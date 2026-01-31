-- Phase 2: Advanced AI Features - Additional Tables
-- Project: FETS.LIVE
-- Adds tables for Phase 4: Semantic Search & Knowledge Verification
-- Run this in Supabase SQL Editor after Phase 1

-- ============================================
-- 1. EMBEDDINGS TABLE (for Semantic Search)
-- ============================================

CREATE TABLE IF NOT EXISTS ai_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('conversation', 'knowledge', 'query', 'document')),
    embedding VECTOR(1536), -- OpenAI embeddings dimension
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for semantic similarity search
CREATE INDEX IF NOT EXISTS idx_ai_embeddings_content_type 
ON ai_embeddings(content_type);

CREATE INDEX IF NOT EXISTS idx_ai_embeddings_embedding 
ON ai_embeddings USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- ============================================
-- 2. KNOWLEDGE VERIFICATION TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS ai_verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_id UUID REFERENCES ai_knowledge_base(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    insight TEXT NOT NULL,
    source_context TEXT,
    requested_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'needs_review')),
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for verification requests
CREATE INDEX IF NOT EXISTS idx_ai_verification_requests_status 
ON ai_verification_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_verification_requests_knowledge_id 
ON ai_verification_requests(knowledge_id);

-- ============================================
-- 3. CONVERSATION SIMILARITY TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS ai_conversation_similarity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
    similar_conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
    similarity_score FLOAT NOT NULL,
    shared_topics TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, similar_conversation_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_conversation_similarity_conv_id 
ON ai_conversation_similarity(conversation_id);

-- ============================================
-- 4. USER ENGAGEMENT METRICS (for Longitudinal Analysis)
-- ============================================

CREATE TABLE IF NOT EXISTS ai_user_engagement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_conversations INTEGER DEFAULT 0,
    total_queries INTEGER DEFAULT 0,
    total_tokens_used INTEGER DEFAULT 0,
    avg_session_duration_minutes FLOAT DEFAULT 0,
    favorite_topics TEXT[],
    peak_activity_hour INTEGER,
    engagement_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_ai_user_engagement_user_date 
ON ai_user_engagement(user_id, date DESC);

-- ============================================
-- 5. AI INSIGHTS & RECOMMENDATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS ai_insights_generated (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL CHECK (insight_type IN ('engagement', 'trend', 'topic', 'recommendation', 'pattern')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence_score FLOAT,
    actionable BOOLEAN DEFAULT TRUE,
    action_items TEXT[],
    viewed BOOLEAN DEFAULT FALSE,
    action_taken BOOLEAN DEFAULT FALSE,
    generated_from_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_generated_user 
ON ai_insights_generated(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_insights_generated_type 
ON ai_insights_generated(insight_type);

-- ============================================
-- 6. ENHANCED QUERY LOG (Additional Fields)
-- ============================================

-- Add new columns to existing ai_query_log table
ALTER TABLE ai_query_log ADD COLUMN IF NOT EXISTS query_embedding VECTOR(1536);
ALTER TABLE ai_query_log ADD COLUMN IF NOT EXISTS session_id UUID;
ALTER TABLE ai_query_log ADD COLUMN IF NOT EXISTS client_info JSONB DEFAULT '{}';

-- Index for query embedding
CREATE INDEX IF NOT EXISTS idx_ai_query_log_embedding 
ON ai_query_log USING ivfflat (query_embedding vector_cosine_ops) 
WITH (lists = 100);

-- ============================================
-- 7. RPC FUNCTIONS FOR ADVANCED QUERIES
-- ============================================

-- Search similar conversations
CREATE OR REPLACE FUNCTION search_similar_conversations(
    p_query_embedding VECTOR(1536),
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    conversation_id UUID,
    title TEXT,
    similarity_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ql.conversation_id,
        c.title,
        (1 - (ql.query_embedding <=> p_query_embedding))::FLOAT as similarity_score,
        c.created_at
    FROM ai_query_log ql
    JOIN ai_conversations c ON ql.conversation_id = c.id
    WHERE ql.query_embedding IS NOT NULL
    ORDER BY ql.query_embedding <=> p_query_embedding
    LIMIT p_limit;
END;
$$;

-- Get user engagement summary
CREATE OR REPLACE FUNCTION get_user_engagement_summary(
    p_user_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_conversations BIGINT,
    total_queries BIGINT,
    avg_daily_queries FLOAT,
    total_tokens_used BIGINT,
    avg_session_minutes FLOAT,
    top_topics TEXT[],
    trend_direction TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT c.id)::BIGINT as total_conversations,
        COUNT(ql.id)::BIGINT as total_queries,
        COUNT(ql.id)::FLOAT / p_days as avg_daily_queries,
        COALESCE(SUM(ql.tokens_used), 0)::BIGINT as total_tokens_used,
        COALESCE(AVG(ue.avg_session_duration_minutes), 0)::FLOAT as avg_session_minutes,
        COALESCE((
            SELECT ARRAY_AGG(topic) 
            FROM (
                SELECT UNNEST(COALESCE(ue.favorite_topics, ARRAY[]::TEXT[])) as topic
                FROM ai_user_engagement ue
                WHERE ue.user_id = p_user_id
                ORDER BY ue.created_at DESC
                LIMIT 10
            ) t
        ), ARRAY[]::TEXT[]) as top_topics,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM ai_user_engagement ue1
                WHERE ue1.user_id = p_user_id
                AND ue1.created_at >= NOW() - INTERVAL '15 days'
            ) THEN
                CASE 
                    WHEN (
                        SELECT COUNT(*) FROM ai_user_engagement ue2
                        WHERE ue2.user_id = p_user_id
                        AND ue2.created_at >= NOW() - INTERVAL '7 days'
                    ) > (
                        SELECT COUNT(*) FROM ai_user_engagement ue3
                        WHERE ue3.user_id = p_user_id
                        AND ue3.created_at >= NOW() - INTERVAL '14 days'
                        AND ue3.created_at < NOW() - INTERVAL '7 days'
                    )
                    THEN 'improving'
                    WHEN (
                        SELECT COUNT(*) FROM ai_user_engagement ue2
                        WHERE ue2.user_id = p_user_id
                        AND ue2.created_at >= NOW() - INTERVAL '7 days'
                    ) < (
                        SELECT COUNT(*) FROM ai_user_engagement ue3
                        WHERE ue3.user_id = p_user_id
                        AND ue3.created_at >= NOW() - INTERVAL '14 days'
                        AND ue3.created_at < NOW() - INTERVAL '7 days'
                    )
                    THEN 'declining'
                    ELSE 'stable'
                END
            ELSE 'insufficient_data'
        END as trend_direction
    FROM ai_conversations c
    LEFT JOIN ai_query_log ql ON c.id = ql.conversation_id
    LEFT JOIN ai_user_engagement ue ON c.user_id = ue.user_id
    WHERE c.user_id = p_user_id
    AND c.created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$;

-- ============================================
-- 8. ADDITIONAL POLICIES
-- ============================================

-- User engagement - users see only their own data
ALTER TABLE ai_user_engagement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own engagement"
    ON ai_user_engagement FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert engagement data"
    ON ai_user_engagement FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can update engagement data"
    ON ai_user_engagement FOR UPDATE
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Insights - users see their own
ALTER TABLE ai_insights_generated ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights"
    ON ai_insights_generated FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can insert insights"
    ON ai_insights_generated FOR INSERT
    WITH CHECK (true);

-- Embeddings - full access for system
ALTER TABLE ai_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage embeddings"
    ON ai_embeddings FOR ALL
    USING (auth.role() = 'authenticated');

-- Verification requests - admins and requesters
ALTER TABLE ai_verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification requests"
    ON ai_verification_requests FOR SELECT
    USING (auth.uid() = requested_by OR auth.role() = 'authenticated');

CREATE POLICY "Admins can manage verification requests"
    ON ai_verification_requests FOR ALL
    USING (auth.role() = 'authenticated');

-- ============================================
-- DONE
-- ============================================

SELECT 'Phase 2 tables created successfully!' as status;

-- Summary of tables:
-- ai_embeddings - Semantic search embeddings
-- ai_verification_requests - Knowledge verification workflow
-- ai_conversation_similarity - Conversation similarity tracking
-- ai_user_engagement - User engagement metrics for longitudinal analysis
-- ai_insights_generated - Auto-generated insights and recommendations
