-- Phase 1: Database Foundation - AI Data Analysis System Tables
-- Project: FETS.LIVE
-- Supabase Project: qqewusetilxxfvfkmsed
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CONVERSATION HISTORY TABLES
-- ============================================

-- Conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    context JSONB DEFAULT '{}', -- Stores conversation context
    summary TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation messages
CREATE TABLE IF NOT EXISTS ai_conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    data_references JSONB DEFAULT '[]', -- Links to retrieved data
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast conversation lookup
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id 
ON ai_conversations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_conversation_messages_conversation_id 
ON ai_conversation_messages(conversation_id, created_at ASC);

-- ============================================
-- 2. KNOWLEDGE BASE TABLES
-- ============================================

-- Knowledge insights from AI analysis
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL,
    insight TEXT NOT NULL,
    source_query TEXT,
    source_table TEXT,
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge topics for categorization
CREATE TABLE IF NOT EXISTS ai_knowledge_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES ai_knowledge_topics(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link knowledge to topics
CREATE TABLE IF NOT EXISTS ai_knowledge_topic_links (
    knowledge_id UUID REFERENCES ai_knowledge_base(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES ai_knowledge_topics(id) ON DELETE CASCADE,
    PRIMARY KEY (knowledge_id, topic_id)
);

-- Indexes for knowledge base
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_topic 
ON ai_knowledge_base USING GIN (to_tsvector('english', topic));

CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_confidence 
ON ai_knowledge_base(confidence_score DESC) WHERE verified = TRUE;

-- ============================================
-- 3. ANALYTICS TABLES
-- ============================================

-- Analytics snapshots
CREATE TABLE IF NOT EXISTS ai_analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_type TEXT NOT NULL CHECK (snapshot_type IN ('daily', 'weekly', 'monthly', 'quarterly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    metrics JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trend data points
CREATE TABLE IF NOT EXISTS ai_trend_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value FLOAT NOT NULL,
    dimension TEXT, -- e.g., 'branch', 'exam_type'
    dimension_value TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source_table TEXT,
    source_query TEXT
);

-- Forecasting results
CREATE TABLE IF NOT EXISTS ai_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_type TEXT NOT NULL CHECK (model_type IN ('prophet', 'arima', 'linear', 'custom')),
    target_metric TEXT NOT NULL,
    forecast_period_start DATE NOT NULL,
    forecast_period_end DATE NOT NULL,
    predictions JSONB NOT NULL, -- Array of {date, value, lower_bound, upper_bound}
    model_params JSONB DEFAULT '{}',
    accuracy_metrics JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_ai_trend_data_metric_time 
ON ai_trend_data(metric_name, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_analytics_snapshots_type_period 
ON ai_analytics_snapshots(snapshot_type, period_start DESC);

-- ============================================
-- 4. DOCUMENT EMBEDDINGS TABLE (for RAG)
-- ============================================

CREATE TABLE IF NOT EXISTS ai_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    doc_type TEXT DEFAULT 'general' CHECK (doc_type IN ('policy', 'procedure', 'guide', 'report', 'general')),
    embedding vector(1536), -- For semantic search
    metadata JSONB DEFAULT '{}',
    is_indexed BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for semantic search
CREATE INDEX IF NOT EXISTS idx_ai_documents_embedding 
ON ai_documents USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_ai_documents_content 
ON ai_documents USING GIN (to_tsvector('english', content));

-- ============================================
-- 5. QUERY LOGGING & CITATIONS
-- ============================================

-- Query execution log
CREATE TABLE IF NOT EXISTS ai_query_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    conversation_id UUID REFERENCES ai_conversations(id),
    query_text TEXT NOT NULL,
    response_summary TEXT,
    data_sources JSONB DEFAULT '[]',
    execution_time_ms INTEGER,
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Citations for responses
CREATE TABLE IF NOT EXISTS ai_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_log_id UUID REFERENCES ai_query_log(id) ON DELETE CASCADE,
    source_table TEXT NOT NULL,
    source_query TEXT NOT NULL,
    data_points JSONB NOT NULL,
    relevance_score FLOAT DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for query log
CREATE INDEX IF NOT EXISTS idx_ai_query_log_user_time 
ON ai_query_log(user_id, created_at DESC);

-- ============================================
-- 6. VIEW FOR ANALYTICS SUMMARY
-- ============================================

CREATE OR REPLACE VIEW v_ai_daily_metrics AS
SELECT 
    DATE(recorded_at) as metric_date,
    metric_name,
    dimension,
    dimension_value,
    COUNT(*) as data_points,
    AVG(metric_value) as avg_value,
    SUM(metric_value) as total_value,
    MIN(metric_value) as min_value,
    MAX(metric_value) as max_value
FROM ai_trend_data
GROUP BY DATE(recorded_at), metric_name, dimension, dimension_value;

-- ============================================
-- 7. FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to relevant tables
CREATE TRIGGER update_ai_conversations_updated_at
    BEFORE UPDATE ON ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ai_knowledge_base_updated_at
    BEFORE UPDATE ON ai_knowledge_base
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ai_documents_updated_at
    BEFORE UPDATE ON ai_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 8. SAMPLE DATA - KNOWLEDGE TOPICS
-- ============================================

INSERT INTO ai_knowledge_topics (name, description) VALUES
('Exam Statistics', 'Insights related to exam performance and metrics'),
('Candidate Analysis', 'Data about candidate registrations and outcomes'),
('Staff Performance', 'Staff-related analytics and productivity'),
('Branch Operations', 'Per-branch operational metrics'),
('Incident Trends', 'Patterns in incident reports and resolutions')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 9. RPC FUNCTIONS FOR COMMON QUERIES
-- ============================================

-- Get conversation history with messages
CREATE OR REPLACE FUNCTION get_conversation_history(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    conversation_id UUID,
    title TEXT,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    message_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.summary,
        c.created_at,
        COUNT(m.id)::BIGINT as message_count
    FROM ai_conversations c
    LEFT JOIN ai_conversation_messages m ON c.id = m.conversation_id
    WHERE c.user_id = p_user_id
    GROUP BY c.id
    ORDER BY c.updated_at DESC
    LIMIT p_limit;
END;
$$;

-- Get knowledge insights for a topic
CREATE OR REPLACE FUNCTION get_knowledge_insights(
    p_topic TEXT,
    p_min_confidence FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    id UUID,
    topic TEXT,
    insight TEXT,
    confidence_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kb.id,
        kb.topic,
        kb.insight,
        kb.confidence_score,
        kb.created_at
    FROM ai_knowledge_base kb
    WHERE kb.topic ILIKE '%' || p_topic || '%'
        AND kb.confidence_score >= p_min_confidence
        AND (kb.verified = TRUE OR kb.confidence_score >= 0.9)
    ORDER BY kb.confidence_score DESC
    LIMIT 20;
END;
$$;

-- ============================================
-- SECURITY & POLICIES (Row Level Security)
-- ============================================

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_query_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY "Users can view own conversations"
    ON ai_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
    ON ai_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
    ON ai_conversations FOR UPDATE
    USING (auth.uid() = user_id);

-- Query log - users see their own queries
CREATE POLICY "Users can view own query logs"
    ON ai_query_log FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can insert query logs"
    ON ai_query_log FOR INSERT
    WITH CHECK (true);

-- Knowledge base is viewable by all authenticated users
CREATE POLICY "Authenticated users can view knowledge"
    ON ai_knowledge_base FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can insert knowledge"
    ON ai_knowledge_base FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin can update knowledge"
    ON ai_knowledge_base FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Documents are viewable by all
CREATE POLICY "Public can view indexed documents"
    ON ai_documents FOR SELECT
    USING (is_indexed = TRUE OR auth.role() = 'authenticated');

-- ============================================
-- DONE
-- ============================================

SELECT 'Phase 1 tables created successfully!' as status;
