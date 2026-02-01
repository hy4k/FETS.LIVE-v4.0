/**
 * Advanced AI Service - Phase 4
 * Features: Conversation History, Longitudinal Analysis, Knowledge Verification, Semantic Search
 */

import { supabase } from './supabase'

// --- Types ---

interface ConversationWithMessages {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
  messages: ConversationMessage[]
}

interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  data_references?: string[]
  tokens_used?: number
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

interface VerificationRequest {
  id: string
  knowledge_id: string
  topic: string
  insight: string
  requested_by: string
  status: 'pending' | 'verified' | 'rejected' | 'needs_review'
  created_at: string
  verified_by?: string
  verified_at?: string
  notes?: string
}

interface SemanticEmbedding {
  id: string
  content_id: string
  content_type: 'conversation' | 'knowledge' | 'query'
  embedding: number[]
  created_at: string
}

// --- Advanced Conversation Service ---

export const advancedConversationService = {
  /**
   * Get conversation with all messages
   */
  async getConversationWithMessages(conversationId: string): Promise<ConversationWithMessages | null> {
    try {
      // Get conversation details
      const { data: conversation, error: convError } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (convError || !conversation) {
        console.error('Error fetching conversation:', convError)
        return null
      }

      // Get all messages
      const { data: messages, error: msgError } = await supabase
        .from('ai_conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (msgError) {
        console.error('Error fetching messages:', msgError)
        return null
      }

      return {
        ...conversation,
        message_count: messages?.length || 0,
        messages: messages || []
      }
    } catch (err) {
      console.error('Exception getting conversation:', err)
      return null
    }
  },

  /**
   * Search conversations by content
   */
  async searchConversations(
    query: string,
    options: { limit?: number; startDate?: string; endDate?: string } = {}
  ): Promise<SearchResult[]> {
    const { limit = 20, startDate, endDate } = options

    try {
      let queryBuilder = supabase
        .from('ai_conversation_messages')
        .select(`
          id,
          content,
          created_at,
          conversation_id,
          role,
          ai_conversations!inner(title)
        `)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (startDate) {
        queryBuilder = queryBuilder.gte('created_at', startDate)
      }
      if (endDate) {
        queryBuilder = queryBuilder.lte('created_at', endDate)
      }

      const { data, error } = await queryBuilder

      if (error) {
        console.error('Error searching conversations:', error)
        return []
      }

      // Calculate relevance and format results
      const results: SearchResult[] = (data || []).map(item => ({
        id: item.id,
        type: 'conversation' as const,
        title: item.ai_conversations?.title || 'Untitled',
        content: item.content,
        relevance: this.calculateRelevance(query, item.content),
        created_at: item.created_at,
        metadata: {
          role: item.role,
          conversation_id: item.conversation_id
        }
      }))

      return results
    } catch (err) {
      console.error('Exception searching conversations:', err)
      return []
    }
  },

  /**
   * Get conversation timeline
   */
  async getConversationTimeline(
    conversationId: string
  ): Promise<{ timestamp: Date; type: string; summary: string }[]> {
    try {
      const convWithMessages = await this.getConversationWithMessages(conversationId)
      if (!convWithMessages) return []

      const timeline: { timestamp: Date; type: string; summary: string }[] = []

      convWithMessages.messages.forEach(msg => {
        const summary = msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : '')
        timeline.push({
          timestamp: new Date(msg.created_at),
          type: msg.role,
          summary
        })
      })

      return timeline
    } catch (err) {
      console.error('Exception getting timeline:', err)
      return []
    }
  },

  /**
   * Calculate text relevance score (simple version)
   */
  calculateRelevance(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(/\s+/)
    const contentLower = content.toLowerCase()
    
    let matches = 0
    queryWords.forEach(word => {
      if (contentLower.includes(word)) matches++
    })

    return matches / queryWords.length
  },

  /**
   * Get similar conversations based on current query
   */
  async getSimilarConversations(
    currentQuery: string,
    limit: number = 5
  ): Promise<ConversationWithMessages[]> {
    try {
      const { data, error } = await supabase
        .from('ai_conversation_messages')
        .select('conversation_id')
        .ilike('content', `%${currentQuery}%`)
        .limit(limit * 5)

      if (error) {
        console.error('Error finding similar conversations:', error)
        return []
      }

      const conversationIds = [...new Set((data || []).map(d => d.conversation_id))].slice(0, limit)

      const conversations: ConversationWithMessages[] = []
      for (const id of conversationIds) {
        const conv = await this.getConversationWithMessages(id)
        if (conv) conversations.push(conv)
      }

      return conversations
    } catch (err) {
      console.error('Exception finding similar conversations:', err)
      return []
    }
  },

  /**
   * Export conversation for backup/sharing
   */
  async exportConversation(conversationId: string, format: 'json' | 'text' = 'json'): Promise<string | null> {
    const convWithMessages = await this.getConversationWithMessages(conversationId)
    if (!convWithMessages) return null

    if (format === 'text') {
      let text = `Conversation: ${convWithMessages.title}\n`
      text += `Created: ${convWithMessages.created_at}\n`
      text += `Last Updated: ${convWithMessages.updated_at}\n`
      text += '=' .repeat(50) + '\n\n'

      convWithMessages.messages.forEach(msg => {
        text += `[${msg.role.toUpperCase()}] ${msg.created_at}\n`
        text += `${msg.content}\n\n`
      })

      return text
    }

    return JSON.stringify(convWithMessages, null, 2)
  }
}

// --- Longitudinal Analysis Service ---

export const longitudinalAnalysisService = {
  /**
   * Analyze conversation patterns over time
   */
  async analyzeTrends(
    userId?: string,
    period: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<LongitudinalAnalysis[]> {
    try {
      const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - periodDays * 6) // 6 periods

      let query = supabase
        .from('ai_query_log')
        .select('created_at, query_text, execution_time_ms, data_sources')
        .gte('created_at', startDate.toISOString())

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query.order('created_at', { ascending: true })

      if (error) {
        console.error('Error analyzing trends:', error)
        return []
      }

      // Group by period
      const periods = this.groupByPeriod(data || [], period)
      
      return periods.map(periodData => ({
        period: periodData.label,
        total_queries: periodData.count,
        unique_topics: this.countUniqueTopics(periodData.items),
        avg_response_time: this.calculateAvgResponseTime(periodData.items),
        top_keywords: this.extractTopKeywords(periodData.items),
        trend_direction: this.determineTrend(periodData.items)
      }))
    } catch (err) {
      console.error('Exception analyzing trends:', err)
      return []
    }
  },

  /**
   * Group data by time period
   */
  groupByPeriod(data: any[], period: 'week' | 'month' | 'quarter') {
    interface PeriodGroup {
      label: string
      items: any[]
      count: number
    }
    
    const groups: PeriodGroup[] = []
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const start = new Date()
      const end = new Date()

      if (period === 'week') {
        start.setDate(now.getDate() - (i + 1) * 7)
        end.setDate(now.getDate() - i * 7)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
      } else if (period === 'month') {
        start.setMonth(now.getMonth() - i - 1)
        end.setMonth(now.getMonth() - i)
        start.setDate(1)
        end.setDate(0)
      } else {
        start.setMonth(now.getMonth() - (i + 1) * 3)
        end.setMonth(now.getMonth() - i * 3)
        start.setDate(1)
        end.setDate(0)
      }

      const periodData = data.filter(item => {
        const itemDate = new Date(item.created_at)
        return itemDate >= start && itemDate <= end
      })

      groups.push({
        label: this.formatPeriodLabel(start, end, period),
        items: periodData,
        count: periodData.length
      })
    }

    return groups
  },

  formatPeriodLabel(start: Date, end: Date, period: string): string {
    const options: Intl.DateTimeFormatOptions = period === 'month' 
      ? { month: 'short', year: 'numeric' }
      : { month: 'short', day: 'numeric' }
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`
  },

  countUniqueTopics(items: any[]): number {
    const topics = new Set<string>()
    items.forEach(item => {
      const words = item.query_text?.toLowerCase().split(/\s+/) || []
      words.forEach(word => {
        if (word.length > 4) topics.add(word)
      })
    })
    return topics.size
  },

  calculateAvgResponseTime(items: any[]): number {
    if (items.length === 0) return 0
    const total = items.reduce((sum, item) => sum + (item.execution_time_ms || 0), 0)
    return Math.round(total / items.length)
  },

  extractTopKeywords(items: any[]): string[] {
    const wordCounts: Record<string, number> = {}
    
    items.forEach(item => {
      const words = item.query_text?.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/) || []
      words.forEach(word => {
        if (word.length > 4 && !this.isStopWord(word)) {
          wordCounts[word] = (wordCounts[word] || 0) + 1
        }
      })
    })

    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word)
  },

  isStopWord(word: string): boolean {
    const stopWords = new Set([
      'about', 'above', 'after', 'again', 'against', 'could', 'would',
      'should', 'there', 'these', 'those', 'their', 'them', 'then',
      'what', 'when', 'where', 'which', 'while', 'with', 'without'
    ])
    return stopWords.has(word)
  },

  determineTrend(items: any[]): 'improving' | 'stable' | 'declining' {
    if (items.length < 2) return 'stable'
    
    // Simple trend based on response time improvement
    const firstHalf = items.slice(0, Math.floor(items.length / 2))
    const secondHalf = items.slice(Math.floor(items.length / 2))
    
    const firstAvg = this.calculateAvgResponseTime(firstHalf)
    const secondAvg = this.calculateAvgResponseTime(secondHalf)

    if (secondAvg < firstAvg * 0.9) return 'improving'
    if (secondAvg > firstAvg * 1.1) return 'declining'
    return 'stable'
  },

  /**
   * Get user engagement metrics
   */
  async getEngagementMetrics(userId?: string): Promise<{
    totalConversations: number
    totalQueries: number
    avgSessionLength: number
    favoriteTopics: string[]
    activityByHour: number[]
  }> {
    try {
      let convQuery = supabase.from('ai_conversations').select('id, created_at, updated_at')
      let queryQuery = supabase.from('ai_query_log').select('id, created_at, query_text')

      if (userId) {
        convQuery = convQuery.eq('user_id', userId)
        queryQuery = queryQuery.eq('user_id', userId)
      }

      const [convResult, queryResult] = await Promise.all([
        convQuery,
        queryQuery
      ])

      const conversations = convResult.data || []
      const queries = queryResult.data || []

      // Calculate activity by hour
      const activityByHour = new Array(24).fill(0)
      queries.forEach(q => {
        const hour = new Date(q.created_at).getHours()
        activityByHour[hour]++
      })

      // Calculate favorite topics
      const topicCounts: Record<string, number> = {}
      queries.forEach(q => {
        const words = q.query_text?.toLowerCase().split(/\s+/) || []
        words.forEach(word => {
          if (word.length > 4 && !this.isStopWord(word)) {
            topicCounts[word] = (topicCounts[word] || 0) + 1
          }
        })
      })

      const favoriteTopics = Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([topic]) => topic)

      return {
        totalConversations: conversations.length,
        totalQueries: queries.length,
        avgSessionLength: conversations.length > 0 
          ? Math.round(conversations.reduce((sum, c) => {
              const start = new Date(c.created_at).getTime()
              const end = new Date(c.updated_at).getTime()
              return sum + (end - start)
            }, 0) / conversations.length / 60000) // minutes
          : 0,
        favoriteTopics,
        activityByHour
      }
    } catch (err) {
      console.error('Error getting engagement metrics:', err)
      return {
        totalConversations: 0,
        totalQueries: 0,
        avgSessionLength: 0,
        favoriteTopics: [],
        activityByHour: new Array(24).fill(0)
      }
    }
  }
}

// --- Knowledge Verification Service ---

export const knowledgeVerificationService = {
  /**
   * Submit knowledge for verification
   */
  async submitForVerification(
    knowledgeId: string,
    topic: string,
    insight: string,
    requestedBy: string
  ): Promise<VerificationRequest | null> {
    try {
      const { data, error } = await supabase
        .from('ai_verification_requests')
        .insert({
          knowledge_id: knowledgeId,
          topic,
          insight,
          requested_by: requestedBy,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        console.error('Error submitting for verification:', error)
        return null
      }

      return data
    } catch (err) {
      console.error('Exception submitting for verification:', err)
      return null
    }
  },

  /**
   * Approve or reject knowledge
   */
  async reviewVerification(
    requestId: string,
    decision: 'verified' | 'rejected' | 'needs_review',
    verifierId: string,
    notes?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_verification_requests')
        .update({
          status: decision,
          verified_by: verifierId,
          verified_at: new Date().toISOString(),
          notes
        })
        .eq('id', requestId)

      if (error) {
        console.error('Error reviewing verification:', error)
        return false
      }

      // If verified, update the knowledge base
      if (decision === 'verified') {
        const { data: request } = await supabase
          .from('ai_verification_requests')
          .select('knowledge_id')
          .eq('id', requestId)
          .single()

        if (request?.knowledge_id) {
          await supabase
            .from('ai_knowledge_base')
            .update({
              verified: true,
              verified_by: verifierId,
              verified_at: new Date().toISOString()
            })
            .eq('id', request.knowledge_id)
        }
      }

      return true
    } catch (err) {
      console.error('Exception reviewing verification:', err)
      return false
    }
  },

  /**
   * Get pending verification requests
   */
  async getPendingRequests(limit: number = 20): Promise<VerificationRequest[]> {
    try {
      const { data, error } = await supabase
        .from('ai_verification_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching pending requests:', error)
        return []
      }

      return data || []
    } catch (err) {
      console.error('Exception fetching pending requests:', err)
      return []
    }
  },

  /**
   * Get verified knowledge count
   */
  async getVerificationStats(): Promise<{
    total: number
    verified: number
    pending: number
    rejected: number
    verificationRate: number
  }> {
    try {
      const { data: totalData } = await supabase
        .from('ai_knowledge_base')
        .select('id', { count: 'exact', head: true })

      const { data: verifiedData } = await supabase
        .from('ai_knowledge_base')
        .select('id', { count: 'exact', head: true })
        .eq('verified', true)

      const { data: requests } = await supabase
        .from('ai_verification_requests')
        .select('status', { count: 'exact', head: true })

      const pending = (requests || []).filter(r => r.status === 'pending').length
      const rejected = (requests || []).filter(r => r.status === 'rejected').length

      const total = totalData?.count || 0
      const verified = verifiedData?.count || 0

      return {
        total,
        verified,
        pending,
        rejected,
        verificationRate: total > 0 ? Math.round((verified / total) * 100) : 0
      }
    } catch (err) {
      console.error('Error getting verification stats:', err)
      return { total: 0, verified: 0, pending: 0, rejected: 0, verificationRate: 0 }
    }
  }
}

// --- Semantic Search Service ---

export const semanticSearchService = {
  /**
   * Create embedding for content (simulated - in production use actual embedding model)
   */
  async createEmbedding(content: string): Promise<number[]> {
    // Simple word frequency vector as placeholder
    // In production, integrate with OpenAI embeddings or similar
    const words = content.toLowerCase().split(/\s+/)
    const wordVector: Record<string, number> = {}
    
    words.forEach(word => {
      if (word.length > 2) {
        wordVector[word] = (wordVector[word] || 0) + 1
      }
    })

    // Return normalized vector (placeholder for actual embedding)
    return Object.values(wordVector).map(v => v / Math.max(words.length, 1))
  },

  /**
   * Store embedding
   */
  async storeEmbedding(contentId: string, contentType: string, content: string): Promise<void> {
    try {
      const embedding = await this.createEmbedding(content)
      
      await supabase
        .from('ai_embeddings')
        .insert({
          content_id: contentId,
          content_type: contentType,
          embedding
        })
    } catch (err) {
      console.error('Error storing embedding:', err)
    }
  },

  /**
   * Search by semantic similarity (simulated cosine similarity)
   */
  async semanticSearch(
    query: string,
    contentType: 'all' | 'conversation' | 'knowledge' = 'all',
    limit: number = 10
  ): Promise<SearchResult[]> {
    const queryEmbedding = await this.createEmbedding(query)

    try {
      let queryBuilder = supabase
        .from('ai_embeddings')
        .select('content_id, content_type, embedding')

      if (contentType !== 'all') {
        queryBuilder = queryBuilder.eq('content_type', contentType)
      }

      const { data: embeddings, error } = await queryBuilder.limit(limit * 5)

      if (error) {
        console.error('Error fetching embeddings:', error)
        return []
      }

      // Calculate similarity scores
      const results: { id: string; type: string; score: number }[] = []

      embeddings?.forEach(emb => {
        const similarity = this.cosineSimilarity(queryEmbedding, emb.embedding)
        results.push({
          id: emb.content_id,
          type: emb.content_type,
          score: similarity
        })
      })

      // Sort by similarity and limit
      const topResults = results.sort((a, b) => b.score - a.score).slice(0, limit)

      // Get actual content
      const searchResults: SearchResult[] = []

      for (const result of topResults) {
        let content = ''
        let title = ''

        if (result.type === 'conversation') {
          const { data } = await supabase
            .from('ai_conversations')
            .select('title, created_at')
            .eq('id', result.id)
            .single()
          title = data?.title || 'Untitled'
          content = title
        } else if (result.type === 'knowledge') {
          const { data } = await supabase
            .from('ai_knowledge_base')
            .select('topic, insight, created_at')
            .eq('id', result.id)
            .single()
          title = data?.topic || 'Unknown'
          content = data?.insight || ''
        }

        searchResults.push({
          id: result.id,
          type: result.type as 'conversation' | 'knowledge' | 'query',
          title,
          content,
          relevance: result.score,
          created_at: new Date().toISOString()
        })
      }

      return searchResults
    } catch (err) {
      console.error('Exception in semantic search:', err)
      return []
    }
  },

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB)
    return denominator > 0 ? dotProduct / denominator : 0
  },

  /**
   * Get related content based on current conversation
   */
  async getRelatedContent(
    conversationId: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    try {
      // Get conversation messages
      const { data: messages } = await supabase
        .from('ai_conversation_messages')
        .select('content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!messages || messages.length === 0) return []

      // Combine messages for context
      const context = messages.map(m => m.content).join(' ')

      // Search for related content
      return this.semanticSearch(context, 'knowledge', limit)
    } catch (err) {
      console.error('Error getting related content:', err)
      return []
    }
  }
}

// --- AI Insights Generator ---

export const insightsGeneratorService = {
  /**
   * Generate insights from conversation patterns
   */
  async generateInsights(userId?: string): Promise<{
    insights: string[]
    recommendations: string[]
  }> {
    try {
      const metrics = await longitudinalAnalysisService.getEngagementMetrics(userId)
      const trends = await longitudinalAnalysisService.analyzeTrends(userId, 'month')

      const insights: string[] = []
      const recommendations: string[] = []

      // Analyze engagement
      if (metrics.totalQueries > 100) {
        insights.push(`You've made ${metrics.totalQueries} queries, showing active AI engagement`)
        if (metrics.avgSessionLength > 30) {
          insights.push(`Average session length of ${metrics.avgSessionLength} minutes indicates deep engagement`)
        }
      }

      // Analyze trends
      if (trends.length >= 2) {
        const recentTrend = trends[trends.length - 1]
        const previousTrend = trends[trends.length - 2]

        if (recentTrend.trend_direction === 'improving') {
          insights.push('Your query patterns show improving trends with better response times')
          recommendations.push('Consider exploring more complex queries to leverage improved efficiency')
        } else if (recentTrend.trend_direction === 'declining') {
          insights.push('Query frequency has decreased recently')
          recommendations.push('Try setting weekly goals for AI interactions to maintain engagement')
        }
      }

      // Analyze favorite topics
      if (metrics.favoriteTopics.length > 0) {
        insights.push(`Top interests: ${metrics.favoriteTopics.slice(0, 3).join(', ')}`)
        recommendations.push(`Explore deeper topics in ${metrics.favoriteTopics[0]} for more insights`)
      }

      // Analyze activity patterns
      const peakHour = metrics.activityByHour.indexOf(Math.max(...metrics.activityByHour))
      if (peakHour > 0) {
        insights.push(`Most active around ${peakHour}:00`)
        recommendations.push(`Schedule focused AI sessions during peak activity hours`)
      }

      return { insights, recommendations }
    } catch (err) {
      console.error('Error generating insights:', err)
      return { insights: [], recommendations: [] }
    }
  }
}

export default {
  advancedConversationService,
  longitudinalAnalysisService,
  knowledgeVerificationService,
  semanticSearchService,
  insightsGeneratorService
}
