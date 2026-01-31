# FETS OMNI AI - API Reference

Developer documentation for integrating and extending FETS OMNI AI.

---

## Table of Contents

1. [Core Services](#core-services)
2. [Component API](#component-api)
3. [Database Schema](#database-schema)
4. [Utility Functions](#utility-functions)
5. [Hooks & Context](#hooks--context)
6. [Type Definitions](#type-definitions)

---

## Core Services

### `anthropic.ts` - Base Claude Integration

#### `askClaude(userPrompt: string, userProfile?: any): Promise<string>`

Main function to query Claude AI with FETS data context.

**Parameters:**
- `userPrompt` - User's natural language query
- `userProfile` - Optional user profile object from auth context

**Returns:**
- Promise<string> - AI-generated response

**Example:**
```typescript
import { askClaude } from '../lib/anthropic'

const response = await askClaude(
  "How many CMA US exams were conducted in 2024?",
  currentUserProfile
)
console.log(response)
```

**Features:**
- 30-day data window with summaries
- Rate limit protection
- Comprehensive exam knowledge base
- Source attribution

---

### `anthropicEnhanced.ts` - Supreme OMNI Edition

#### `askClaude(userPrompt: string, userProfile?: any): Promise<string>`

Enhanced version with ALL-TIME data access and advanced NLP.

**Parameters:**
- Same as base version

**Returns:**
- Promise<string> - Enhanced AI response

**Additional Features:**
- No date restrictions (all-time data)
- Advanced query parser
- Date range extraction
- Branch filtering
- Exam synonym recognition
- Real-time data integration

**Example:**
```typescript
import { askClaude } from '../lib/anthropicEnhanced'

const response = await askClaude(
  "Show me all CMA US candidates between Jan 1 and Dec 31, 2024 in Calicut",
  currentUserProfile
)
```

#### `parseAdvancedQuery(query: string): ParsedQuery`

Extracts structured information from natural language.

**Parameters:**
- `query` - Natural language query string

**Returns:**
```typescript
{
  dateRange: { start?: string; end?: string } | null
  branch: string | null
  exam: string | null
  intent: 'count' | 'schedule' | 'list' | 'compare' | 'trend' | 'general'
}
```

**Example:**
```typescript
import { parseAdvancedQuery } from '../lib/anthropicEnhanced'

const parsed = parseAdvancedQuery(
  "How many CMA US candidates in Calicut last month?"
)

console.log(parsed)
// {
//   dateRange: { start: '2025-12-01', end: '2026-01-01' },
//   branch: 'calicut',
//   exam: 'CMA US',
//   intent: 'count'
// }
```

#### `setupRealtimeSubscriptions(callback: Function): Function`

Subscribe to real-time database changes.

**Parameters:**
- `callback` - Function called on data updates

**Returns:**
- Cleanup function to unsubscribe

**Example:**
```typescript
import { setupRealtimeSubscriptions } from '../lib/anthropicEnhanced'

const unsubscribe = setupRealtimeSubscriptions((update) => {
  console.log('Real-time update:', update.type, update.data)
})

// Later: cleanup
unsubscribe()
```

---

### `conversationService.ts` - Conversation Management

#### `conversationService.createConversation(title: string): Promise<Conversation | null>`

Create a new conversation thread.

**Parameters:**
- `title` - Conversation title

**Returns:**
- Conversation object or null on error

**Example:**
```typescript
import { conversationService } from '../lib/conversationService'

const conversation = await conversationService.createConversation(
  "Q1 2026 Analytics"
)
```

#### `conversationService.addMessage(conversationId, role, content, dataReferences?, tokensUsed?): Promise<ConversationMessage | null>`

Add a message to conversation.

**Parameters:**
- `conversationId` - UUID of conversation
- `role` - 'user' | 'assistant'
- `content` - Message text
- `dataReferences` - Optional array of data sources
- `tokensUsed` - Optional token count

**Example:**
```typescript
await conversationService.addMessage(
  conversationId,
  'user',
  'Show me CMA US stats',
  ['candidates', 'sessions'],
  150
)
```

#### `conversationService.getMessages(conversationId: string): Promise<ConversationMessage[]>`

Retrieve all messages in a conversation.

#### `conversationService.logQuery(queryText, responseSummary, dataSources, executionTimeMs, tokensUsed, conversationId?): Promise<void>`

Log query for analytics.

**Example:**
```typescript
await conversationService.logQuery(
  "How many candidates?",
  "Total: 1,234 candidates",
  ['candidates'],
  850,
  200,
  conversationId
)
```

---

### `knowledgeService` - Knowledge Base

#### `knowledgeService.addInsight(topic, insight, sourceQuery, sourceTable, confidenceScore): Promise<KnowledgeInsight | null>`

Add AI-generated insight to knowledge base.

**Parameters:**
- `topic` - Topic name
- `insight` - Insight text
- `sourceQuery` - Original query that generated this
- `sourceTable` - Database table used
- `confidenceScore` - 0.0 to 1.0

**Example:**
```typescript
import { knowledgeService } from '../lib/conversationService'

await knowledgeService.addInsight(
  "CMA US Trends",
  "CMA US registrations increased 34% in 2024",
  "CMA US statistics for 2024",
  "candidates",
  0.92
)
```

#### `knowledgeService.getInsights(topic: string, minConfidence?: number): Promise<KnowledgeInsight[]>`

Retrieve insights for a topic.

#### `knowledgeService.verifyInsight(insightId: string, verified: boolean): Promise<void>`

Mark insight as verified/unverified.

---

### `contextBuilder` - Context Building

#### `contextBuilder.buildContext(userQuery, conversationId?): Promise<ContextData>`

Build comprehensive context for AI query.

**Returns:**
```typescript
{
  systemPrompt: string
  contextData: Record<string, any>
  conversationHistory: ConversationMessage[]
}
```

**Example:**
```typescript
import { contextBuilder } from '../lib/conversationService'

const context = await contextBuilder.buildContext(
  "Show exam trends",
  conversationId
)

// Use context.systemPrompt in Claude API call
```

---

### `advancedAIService.ts` - Advanced Features

#### `advancedConversationService.searchConversations(query, options?): Promise<SearchResult[]>`

Search past conversations.

**Options:**
```typescript
{
  limit?: number         // Default: 20
  startDate?: string    // ISO date
  endDate?: string      // ISO date
}
```

**Example:**
```typescript
import { advancedConversationService } from '../lib/advancedAIService'

const results = await advancedConversationService.searchConversations(
  "CMA US",
  { limit: 10, startDate: '2024-01-01' }
)
```

#### `longitudinalAnalysisService.analyzeTrends(userId?, period?): Promise<LongitudinalAnalysis[]>`

Analyze conversation patterns over time.

**Parameters:**
- `userId` - Optional user filter
- `period` - 'week' | 'month' | 'quarter'

**Returns:**
```typescript
{
  period: string
  total_queries: number
  unique_topics: number
  avg_response_time: number
  top_keywords: string[]
  trend_direction: 'improving' | 'stable' | 'declining'
}[]
```

#### `knowledgeVerificationService` Methods

- `submitForVerification(knowledgeId, topic, insight, requestedBy)`
- `reviewVerification(requestId, decision, verifierId, notes?)`
- `getPendingRequests(limit?)`
- `getVerificationStats()`

#### `semanticSearchService` Methods

- `semanticSearch(query, contentType?, limit?)`
- `getRelatedContent(conversationId, limit?)`
- `storeEmbedding(contentId, contentType, content)`

---

## Component API

### `<FetsOmniAI />` - Full AI Interface

**Props:**
```typescript
interface OmniAIProps {
  initialTab?: string      // 'chat' | 'analytics' | 'knowledge' | 'history'
  initialQuery?: string    // Pre-filled query
}
```

**Usage:**
```tsx
import { FetsOmniAI } from './components/FetsOmniAI'

<FetsOmniAI
  initialTab="chat"
  initialQuery="Show me exam statistics"
/>
```

---

### `<AiAssistant />` - Floating Widget

**Props:** None (uses auth context)

**Usage:**
```tsx
import { AiAssistant } from './components/AiAssistant'

<AiAssistant />
```

**Features:**
- Auto-opens on mount
- Persists conversation in state
- Neumorphic design
- Quick action buttons

---

## Database Schema

### Core Tables

#### `ai_conversations`
```sql
id UUID PRIMARY KEY
user_id UUID (references auth.users)
title TEXT
context JSONB
summary TEXT
status TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### `ai_conversation_messages`
```sql
id UUID PRIMARY KEY
conversation_id UUID (references ai_conversations)
role TEXT ('user' | 'assistant' | 'system')
content TEXT
data_references JSONB
tokens_used INTEGER
created_at TIMESTAMP
```

#### `ai_knowledge_base`
```sql
id UUID PRIMARY KEY
topic TEXT
insight TEXT
source_query TEXT
source_table TEXT
confidence_score FLOAT
verified BOOLEAN
verified_by UUID
verified_at TIMESTAMP
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### `ai_query_log`
```sql
id UUID PRIMARY KEY
user_id UUID
conversation_id UUID
query_text TEXT
response_summary TEXT
data_sources JSONB
execution_time_ms INTEGER
tokens_used INTEGER
created_at TIMESTAMP
```

### Advanced Tables

#### `ai_embeddings`
```sql
id UUID PRIMARY KEY
content_id UUID
content_type TEXT
embedding VECTOR(1536)
metadata JSONB
created_at TIMESTAMP
```

#### `ai_user_engagement`
```sql
id UUID PRIMARY KEY
user_id UUID
date DATE
total_conversations INTEGER
total_queries INTEGER
total_tokens_used INTEGER
avg_session_duration_minutes FLOAT
favorite_topics TEXT[]
peak_activity_hour INTEGER
engagement_score FLOAT
created_at TIMESTAMP
```

---

## Utility Functions

### Date Parsing

```typescript
// From anthropicEnhanced.ts
parseAdvancedQuery(query: string): {
  dateRange: { start?: string; end?: string } | null
  branch: string | null
  exam: string | null
  intent: string
}
```

### Relevance Scoring

```typescript
// From advancedAIService.ts
advancedConversationService.calculateRelevance(
  query: string,
  content: string
): number // 0.0 to 1.0
```

### Cosine Similarity

```typescript
// From advancedAIService.ts
semanticSearchService.cosineSimilarity(
  a: number[],
  b: number[]
): number
```

---

## Hooks & Context

### Using Auth Context

```typescript
import { useAuth } from '../hooks/useAuth'

function MyComponent() {
  const { profile } = useAuth()

  const handleQuery = async () => {
    const response = await askClaude(query, profile)
  }
}
```

### Custom Hooks (Future)

```typescript
// useConversation.ts (to be implemented)
function useConversation(conversationId?: string) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const sendMessage = async (content: string) => { /* ... */ }
  const loadHistory = async () => { /* ... */ }

  return { messages, loading, sendMessage, loadHistory }
}
```

---

## Type Definitions

### Common Types

```typescript
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: string[]
}

interface Conversation {
  id: string
  user_id: string
  title: string
  context: Record<string, any>
  summary: string | null
  status: string
  created_at: string
  updated_at: string
}

interface ConversationMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  data_references: any[]
  tokens_used: number
  created_at: string
}

interface KnowledgeInsight {
  id: string
  topic: string
  insight: string
  source_query: string
  confidence_score: number
  verified: boolean
  created_at: string
}

interface SearchResult {
  id: string
  type: 'conversation' | 'knowledge' | 'query'
  title: string
  content: string
  relevance: number
  created_at: string
  metadata?: Record<string, any>
}

interface LongitudinalAnalysis {
  period: string
  total_queries: number
  unique_topics: number
  avg_response_time: number
  top_keywords: string[]
  trend_direction: 'improving' | 'stable' | 'declining'
}
```

---

## Error Handling

### Custom Errors

```typescript
class AIError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'AIError'
  }
}

// Usage
throw new AIError('API key invalid', 'AUTH_ERROR')
```

### Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `AUTH_ERROR` | API key invalid | Check environment variables |
| `RATE_LIMIT` | Too many requests | Wait and retry |
| `NETWORK_ERROR` | Connection failed | Check internet |
| `DATA_ERROR` | Database query failed | Check Supabase |
| `PARSE_ERROR` | Query parsing failed | Rephrase query |

---

## Performance Optimization

### Caching Strategy

```typescript
// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,  // 30 seconds
      cacheTime: 300000, // 5 minutes
    },
  },
})
```

### Debouncing Queries

```typescript
import { debounce } from 'lodash'

const debouncedQuery = debounce(async (query: string) => {
  const response = await askClaude(query, profile)
  setResponse(response)
}, 500)
```

### Pagination

```typescript
// For large result sets
const results = await conversationService.getMessages(
  conversationId,
  { limit: 50, offset: 0 }
)
```

---

## Security Considerations

### API Key Protection

```typescript
// ✅ Correct: Use environment variables
const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

// ❌ Wrong: Hardcode keys
const apiKey = 'sk-ant-...'
```

### Row Level Security

All AI tables have RLS policies:
- Users can only access their own conversations
- Knowledge base is read-only for all users
- Admins can manage verification

### Input Sanitization

```typescript
// Sanitize user input before sending to AI
function sanitizeQuery(query: string): string {
  return query
    .trim()
    .replace(/[<>]/g, '') // Remove HTML
    .substring(0, 2000)    // Limit length
}
```

---

## Testing

### Unit Tests

```typescript
// Example test
describe('parseAdvancedQuery', () => {
  it('should extract date range', () => {
    const result = parseAdvancedQuery(
      'Show exams between Jan 1 and Jan 31'
    )
    expect(result.dateRange).toBeDefined()
    expect(result.dateRange.start).toBe('2026-01-01')
  })
})
```

### Integration Tests

```typescript
// Test AI query end-to-end
it('should respond to candidate count query', async () => {
  const response = await askClaude(
    'How many candidates?',
    mockProfile
  )
  expect(response).toContain('candidates')
})
```

---

## Migration Guide

### From v1 to v2

1. Update imports:
```typescript
// Old
import { askClaude } from '../lib/anthropic'

// New (enhanced)
import { askClaude } from '../lib/anthropicEnhanced'
```

2. Database migration:
```bash
node scripts/apply-ai-migrations.cjs
```

3. Update environment variables (no changes needed)

---

## Contributing

### Adding New Query Intents

1. Update `parseAdvancedQuery` in `anthropicEnhanced.ts`:
```typescript
const queryIntents = [
  // ... existing intents
  {
    patterns: ['revenue', 'income', 'earnings'],
    intent: 'revenue'
  }
]
```

2. Update system instruction to handle new intent

### Adding New Exam Types

1. Add to `examTypes` array in `parseAdvancedQuery`:
```typescript
{ names: ['gmat'], type: 'GMAT' }
```

2. Add knowledge base entry in `examKnowledgeBase`

---

## Changelog

### v1.0.0 (2026-01-31)
- Initial release
- Base Claude integration
- Conversation management
- Knowledge base
- Advanced NLP query parser
- Semantic search
- Analytics & trends

---

## Support

- **Documentation**: `/docs/`
- **Examples**: `/examples/` (coming soon)
- **Issues**: GitHub Issues
- **Email**: dev@fets.in

---

**Last Updated**: January 31, 2026
**Version**: 1.0.0
**API Stability**: Stable
