# AI Database Migration Instructions

## Quick Start (Supabase Dashboard)

### Step 1: Access SQL Editor
1. Go to: https://supabase.com/dashboard/project/qqewusetilxxfvfkmsed
2. Click **SQL Editor** in the left sidebar

### Step 2: Run Phase 1 Migration
1. Click **New Query**
2. Open file: `migrations/001_phase1_ai_tables.sql`
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **RUN** button
6. Wait for success message: "Phase 1 tables created successfully!"

### Step 3: Run Phase 2 Migration
1. Click **New Query** again
2. Open file: `migrations/002_phase2_ai_advanced_tables.sql`
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **RUN** button
6. Wait for success message: "Phase 2 tables created successfully!"

### Step 4: Verify Installation
1. Go to **Table Editor** in left sidebar
2. Look for tables starting with `ai_`
3. You should see 17 new tables:

#### Phase 1 Tables (11)
- `ai_conversations` - Store conversation threads
- `ai_conversation_messages` - Individual chat messages
- `ai_knowledge_base` - AI-generated insights
- `ai_knowledge_topics` - Topic categorization
- `ai_knowledge_topic_links` - Topic relationships
- `ai_analytics_snapshots` - Periodic analytics
- `ai_trend_data` - Time-series metrics
- `ai_forecasts` - Predictive analytics
- `ai_documents` - RAG document embeddings
- `ai_query_log` - Query execution tracking
- `ai_citations` - Response source tracking

#### Phase 2 Tables (6)
- `ai_embeddings` - Semantic search vectors
- `ai_verification_requests` - Knowledge verification
- `ai_conversation_similarity` - Similar conversation tracking
- `ai_user_engagement` - Longitudinal metrics
- `ai_insights_generated` - Auto-generated insights

Additional column updates to `ai_query_log`:
- `query_embedding` (VECTOR)
- `session_id` (UUID)
- `client_info` (JSONB)

## Troubleshooting

### If You Get Errors

**Error: "relation already exists"**
- This means tables are already created
- You can skip this migration
- Or drop existing tables first (be careful!)

**Error: "permission denied"**
- Make sure you're logged in to Supabase
- Try refreshing the page
- Check your project permissions

**Error: "extension does not exist"**
- The migration requires pgvector extension
- Go to Database > Extensions
- Enable "vector" extension
- Re-run the migration

### Verify Tables Were Created

Run this query in SQL Editor:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'ai_%'
ORDER BY table_name;
```

Expected result: 17 rows (all ai_ tables)

## Alternative: CLI Method

If you have Supabase CLI installed:

```bash
supabase db reset
supabase db push
```

Or apply migrations directly:

```bash
psql "postgresql://postgres:[YOUR_PASSWORD]@db.qqewusetilxxfvfkmsed.supabase.co:5432/postgres" \
  -f migrations/001_phase1_ai_tables.sql

psql "postgresql://postgres:[YOUR_PASSWORD]@db.qqewusetilxxfvfkmsed.supabase.co:5432/postgres" \
  -f migrations/002_phase2_ai_advanced_tables.sql
```

## What These Tables Do

### Conversation Management
- Store all AI chat conversations
- Track message history
- Maintain context for follow-up queries

### Knowledge Base
- Store AI-generated insights
- Categorize knowledge by topics
- Verification workflow for quality control

### Analytics
- Track query performance
- Store trend data over time
- Generate forecasts and predictions

### Semantic Search
- Vector embeddings for similarity search
- Find related conversations and knowledge
- Improve AI response relevance

### User Engagement
- Track usage patterns
- Generate personalized insights
- Analyze conversation trends

## Next Steps

After migrations complete:

1. ✅ Restart your development server
2. ✅ Test AI features in the application
3. ✅ Check conversation history saves properly
4. ✅ Verify knowledge base populates
5. ⚠️ **IMPORTANT**: Run `NOTIFY pgrst, 'reload schema';` in SQL Editor if you see schema errors.

## Need Help?

- Supabase Documentation: https://supabase.com/docs
- Support: https://supabase.com/dashboard/support
- Project URL: https://supabase.com/dashboard/project/qqewusetilxxfvfkmsed
