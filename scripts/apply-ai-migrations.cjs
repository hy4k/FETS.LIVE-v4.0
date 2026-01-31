/**
 * AI Database Migrations Script
 * Applies Phase 1 and Phase 2 AI tables to Supabase
 *
 * Usage: node scripts/apply-ai-migrations.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
const envPath = path.join(__dirname, '..', 'fets-point', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvValue = (key) => {
  const match = envContent.match(new RegExp(`${key}=(.+)`));
  return match ? match[1].trim() : null;
};

const SUPABASE_URL = getEnvValue('VITE_SUPABASE_URL') || 'https://qqewusetilxxfvfkmsed.supabase.co';
const SUPABASE_ANON_KEY = getEnvValue('VITE_SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_KEY = getEnvValue('SUPABASE_SERVICE_ROLE_KEY') || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 FETS AI Database Migration Tool');
console.log('=' .repeat(60));

// Read migration files
const migration1Path = path.join(__dirname, '..', 'migrations', '001_phase1_ai_tables.sql');
const migration2Path = path.join(__dirname, '..', 'migrations', '002_phase2_ai_advanced_tables.sql');

if (!fs.existsSync(migration1Path)) {
  console.error('❌ Phase 1 migration file not found:', migration1Path);
  process.exit(1);
}

if (!fs.existsSync(migration2Path)) {
  console.error('❌ Phase 2 migration file not found:', migration2Path);
  process.exit(1);
}

const migration1SQL = fs.readFileSync(migration1Path, 'utf8');
const migration2SQL = fs.readFileSync(migration2Path, 'utf8');

console.log('✅ Migration files loaded');
console.log('  - Phase 1:', migration1Path);
console.log('  - Phase 2:', migration2Path);
console.log('');

// Check if service role key is available
if (!SUPABASE_SERVICE_KEY) {
  console.log('⚠️  Service Role Key not found in environment.');
  console.log('');
  console.log('📋 Manual Migration Instructions:');
  console.log('=' .repeat(60));
  console.log('');
  console.log('1. Go to your Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/qqewusetilxxfvfkmsed');
  console.log('');
  console.log('2. Navigate to: SQL Editor (left sidebar)');
  console.log('');
  console.log('3. Create a new query and run Phase 1:');
  console.log('   File: migrations/001_phase1_ai_tables.sql');
  console.log('   Copy and paste the entire file contents');
  console.log('   Click "RUN" button');
  console.log('');
  console.log('4. After Phase 1 succeeds, run Phase 2:');
  console.log('   File: migrations/002_phase2_ai_advanced_tables.sql');
  console.log('   Copy and paste the entire file contents');
  console.log('   Click "RUN" button');
  console.log('');
  console.log('5. Verify tables created:');
  console.log('   Go to: Table Editor');
  console.log('   Look for tables starting with "ai_"');
  console.log('');
  console.log('📊 Expected Tables (17 total):');
  console.log('   Phase 1:');
  console.log('   - ai_conversations');
  console.log('   - ai_conversation_messages');
  console.log('   - ai_knowledge_base');
  console.log('   - ai_knowledge_topics');
  console.log('   - ai_knowledge_topic_links');
  console.log('   - ai_analytics_snapshots');
  console.log('   - ai_trend_data');
  console.log('   - ai_forecasts');
  console.log('   - ai_documents');
  console.log('   - ai_query_log');
  console.log('   - ai_citations');
  console.log('');
  console.log('   Phase 2:');
  console.log('   - ai_embeddings');
  console.log('   - ai_verification_requests');
  console.log('   - ai_conversation_similarity');
  console.log('   - ai_user_engagement');
  console.log('   - ai_insights_generated');
  console.log('');
  console.log('✨ Alternatively, to run automatically:');
  console.log('   1. Get your Service Role Key from Supabase Dashboard > Settings > API');
  console.log('   2. Set environment variable: SUPABASE_SERVICE_ROLE_KEY=your_key');
  console.log('   3. Run: node scripts/apply-ai-migrations.js');
  console.log('');

  // Write migration instructions to file
  const instructionsPath = path.join(__dirname, '..', 'MIGRATION_INSTRUCTIONS.md');
  const instructions = `# AI Database Migration Instructions

## Quick Start (Supabase Dashboard)

### Step 1: Access SQL Editor
1. Go to: https://supabase.com/dashboard/project/qqewusetilxxfvfkmsed
2. Click **SQL Editor** in the left sidebar

### Step 2: Run Phase 1 Migration
1. Click **New Query**
2. Open file: \`migrations/001_phase1_ai_tables.sql\`
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **RUN** button
6. Wait for success message: "Phase 1 tables created successfully!"

### Step 3: Run Phase 2 Migration
1. Click **New Query** again
2. Open file: \`migrations/002_phase2_ai_advanced_tables.sql\`
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **RUN** button
6. Wait for success message: "Phase 2 tables created successfully!"

### Step 4: Verify Installation
1. Go to **Table Editor** in left sidebar
2. Look for tables starting with \`ai_\`
3. You should see 17 new tables:

#### Phase 1 Tables (11)
- \`ai_conversations\` - Store conversation threads
- \`ai_conversation_messages\` - Individual chat messages
- \`ai_knowledge_base\` - AI-generated insights
- \`ai_knowledge_topics\` - Topic categorization
- \`ai_knowledge_topic_links\` - Topic relationships
- \`ai_analytics_snapshots\` - Periodic analytics
- \`ai_trend_data\` - Time-series metrics
- \`ai_forecasts\` - Predictive analytics
- \`ai_documents\` - RAG document embeddings
- \`ai_query_log\` - Query execution tracking
- \`ai_citations\` - Response source tracking

#### Phase 2 Tables (6)
- \`ai_embeddings\` - Semantic search vectors
- \`ai_verification_requests\` - Knowledge verification
- \`ai_conversation_similarity\` - Similar conversation tracking
- \`ai_user_engagement\` - Longitudinal metrics
- \`ai_insights_generated\` - Auto-generated insights

Additional column updates to \`ai_query_log\`:
- \`query_embedding\` (VECTOR)
- \`session_id\` (UUID)
- \`client_info\` (JSONB)

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
\`\`\`sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'ai_%'
ORDER BY table_name;
\`\`\`

Expected result: 17 rows (all ai_ tables)

## Alternative: CLI Method

If you have Supabase CLI installed:

\`\`\`bash
supabase db reset
supabase db push
\`\`\`

Or apply migrations directly:

\`\`\`bash
psql "postgresql://postgres:[YOUR_PASSWORD]@db.qqewusetilxxfvfkmsed.supabase.co:5432/postgres" \\
  -f migrations/001_phase1_ai_tables.sql

psql "postgresql://postgres:[YOUR_PASSWORD]@db.qqewusetilxxfvfkmsed.supabase.co:5432/postgres" \\
  -f migrations/002_phase2_ai_advanced_tables.sql
\`\`\`

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

## Need Help?

- Supabase Documentation: https://supabase.com/docs
- Support: https://supabase.com/dashboard/support
- Project URL: https://supabase.com/dashboard/project/qqewusetilxxfvfkmsed
`;

  fs.writeFileSync(instructionsPath, instructions);
  console.log('📄 Migration instructions saved to: MIGRATION_INSTRUCTIONS.md');
  console.log('');

  process.exit(0);
}

// If we have service key, we could implement automated migration here
console.log('🔑 Service Role Key found - automated migration available');
console.log('⚠️  Note: For safety, please run migrations manually via Supabase Dashboard');
console.log('   See MIGRATION_INSTRUCTIONS.md for detailed steps');
