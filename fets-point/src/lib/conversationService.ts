import { supabase } from './supabase';
import { useAuth } from '../hooks/useAuth';

/**
 * Conversation Service for FETS OMNI AI
 * Handles storing, retrieving, and managing conversation history with persistent memory
 */

interface Conversation {
  id: string;
  user_id: string;
  title: string;
  context: Record<string, any>;
  summary: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  data_references: any[];
  tokens_used: number;
  created_at: string;
}

interface KnowledgeInsight {
  id: string;
  topic: string;
  insight: string;
  source_query: string;
  confidence_score: number;
  verified: boolean;
  created_at: string;
}

// Get current user from auth
function getCurrentUser() {
  // This will be replaced with actual auth context in components
  return typeof window !== 'undefined' ? (window as any).__CURRENT_USER__ : null;
}

export const conversationService = {
  /**
   * Create a new conversation
   */
  async createConversation(title: string = 'New Conversation'): Promise<Conversation | null> {
    const user = getCurrentUser();
    if (!user?.id) {
      console.warn('No authenticated user found');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          title: title,
          context: {},
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Exception creating conversation:', err);
      return null;
    }
  },

  /**
   * Get user's conversations
   */
  async getConversations(limit: number = 50): Promise<Conversation[]> {
    const user = getCurrentUser();
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Exception fetching conversations:', err);
      return [];
    }
  },

  /**
   * Get a specific conversation with messages
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Error fetching conversation:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Exception fetching conversation:', err);
      return null;
    }
  },

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string): Promise<ConversationMessage[]> {
    try {
      const { data, error } = await supabase
        .from('ai_conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Exception fetching messages:', err);
      return [];
    }
  },

  /**
   * Add a message to a conversation
   */
  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    dataReferences: any[] = [],
    tokensUsed: number = 0
  ): Promise<ConversationMessage | null> {
    try {
      const { data, error } = await supabase
        .from('ai_conversation_messages')
        .insert({
          conversation_id: conversationId,
          role: role,
          content: content,
          data_references: dataReferences,
          tokens_used: tokensUsed
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding message:', error);
        return null;
      }

      // Update conversation timestamp
      await supabase
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    } catch (err) {
      console.error('Exception adding message:', err);
      return null;
    }
  },

  /**
   * Generate conversation summary
   */
  async generateSummary(conversationId: string): Promise<string | null> {
    const messages = await this.getMessages(conversationId);
    if (messages.length === 0) return null;

    const userMessages = messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join(' | ');

    // Simple summary - first 200 chars of user queries
    return userMessages.length > 200 
      ? userMessages.substring(0, 200) + '...' 
      : userMessages;
  },

  /**
   * Save conversation summary
   */
  async saveSummary(conversationId: string): Promise<void> {
    const summary = await this.generateSummary(conversationId);
    if (summary) {
      await supabase
        .from('ai_conversations')
        .update({ summary: summary })
        .eq('id', conversationId);
    }
  },

  /**
   * Log a query for analytics
   */
  async logQuery(
    queryText: string,
    responseSummary: string,
    dataSources: string[],
    executionTimeMs: number,
    tokensUsed: number,
    conversationId?: string
  ): Promise<void> {
    const user = getCurrentUser();

    try {
      await supabase
        .from('ai_query_log')
        .insert({
          user_id: user?.id,
          conversation_id: conversationId,
          query_text: queryText,
          response_summary: responseSummary,
          data_sources: dataSources,
          execution_time_ms: executionTimeMs,
          tokens_used: tokensUsed
        });
    } catch (err) {
      console.error('Error logging query:', err);
    }
  },

  /**
   * Add citation for a response
   */
  async addCitation(
    queryLogId: string,
    sourceTable: string,
    sourceQuery: string,
    dataPoints: any[]
  ): Promise<void> {
    try {
      await supabase
        .from('ai_citations')
        .insert({
          query_log_id: queryLogId,
          source_table: sourceTable,
          source_query: sourceQuery,
          data_points: dataPoints
        });
    } catch (err) {
      console.error('Error adding citation:', err);
    }
  },

  /**
   * Get recent conversations (alias for getConversations with limit)
   */
  async getRecentConversations(limit: number = 10): Promise<Conversation[]> {
    return this.getConversations(limit);
  },

  /**
   * Get knowledge by query search
   */
  async getKnowledgeByQuery(query: string, limit: number = 5): Promise<KnowledgeInsight[]> {
    try {
      const { data, error } = await supabase
        .from('ai_knowledge_base')
        .select('*')
        .or(`topic.ilike.%${query}%,insight.ilike.%${query}%`)
        .eq('verified', true)
        .order('confidence_score', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching knowledge by query:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Exception fetching knowledge:', err);
      return [];
    }
  },

  /**
   * Add knowledge insight
   */
  async addKnowledge(
    topic: string,
    summary: string,
    relatedTopics: string[],
    dataSources: string[]
  ): Promise<KnowledgeInsight | null> {
    try {
      const { data, error } = await supabase
        .from('ai_knowledge_base')
        .insert({
          topic: topic,
          insight: summary,
          source_query: relatedTopics.join(', '),
          source_table: dataSources.join(', '),
          confidence_score: 0.7,
          verified: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding knowledge:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Exception adding knowledge:', err);
      return null;
    }
  }
};

/**
 * Knowledge Base Service
 * Stores and retrieves AI-generated insights
 */
export const knowledgeService = {
  /**
   * Add a knowledge insight
   */
  async addInsight(
    topic: string,
    insight: string,
    sourceQuery: string,
    sourceTable: string,
    confidenceScore: number
  ): Promise<KnowledgeInsight | null> {
    try {
      const { data, error } = await supabase
        .from('ai_knowledge_base')
        .insert({
          topic: topic,
          insight: insight,
          source_query: sourceQuery,
          source_table: sourceTable,
          confidence_score: confidenceScore,
          verified: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding insight:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Exception adding insight:', err);
      return null;
    }
  },

  /**
   * Get insights for a topic
   */
  async getInsights(topic: string, minConfidence: number = 0.7): Promise<KnowledgeInsight[]> {
    try {
      const { data, error } = await supabase
        .from('ai_knowledge_base')
        .select('*')
        .ilike('topic', `%${topic}%`)
        .gte('confidence_score', minConfidence)
        .order('confidence_score', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching insights:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Exception fetching insights:', err);
      return [];
    }
  },

  /**
   * Verify an insight
   */
  async verifyInsight(insightId: string, verified: boolean = true): Promise<void> {
    const user = getCurrentUser();

    try {
      await supabase
        .from('ai_knowledge_base')
        .update({
          verified: verified,
          verified_by: user?.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', insightId);
    } catch (err) {
      console.error('Error verifying insight:', err);
    }
  },

  /**
   * Get verified knowledge for AI context
   */
  async getVerifiedKnowledge(): Promise<KnowledgeInsight[]> {
    try {
      const { data, error } = await supabase
        .from('ai_knowledge_base')
        .select('*')
        .eq('verified', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching verified knowledge:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Exception fetching verified knowledge:', err);
      return [];
    }
  }
};

/**
 * Context Builder for AI Queries
 * Builds comprehensive context from multiple sources
 */
export const contextBuilder = {
  /**
   * Build context for an AI query
   */
  async buildContext(userQuery: string, conversationId?: string): Promise<{
    systemPrompt: string;
    contextData: Record<string, any>;
    conversationHistory: ConversationMessage[];
  }> {
    // Get conversation history if provided
    let conversationHistory: ConversationMessage[] = [];
    let recentInsights: KnowledgeInsight[] = [];
    let verifiedKnowledge: KnowledgeInsight[] = [];

    if (conversationId) {
      conversationHistory = await conversationService.getMessages(conversationId);
    }

    // Extract topic from query and get relevant insights
    const queryLower = userQuery.toLowerCase();
    const keywords = queryLower.split(' ').filter(w => w.length > 3);
    
    if (keywords.length > 0) {
      const mainTopic = keywords[0];
      recentInsights = await knowledgeService.getInsights(mainTopic, 0.6);
    }

    // Get all verified knowledge
    verifiedKnowledge = await knowledgeService.getVerifiedKnowledge();

    // Build context data
    const contextData: Record<string, any> = {
      query: userQuery,
      conversation_history_length: conversationHistory.length,
      relevant_insights_count: recentInsights.length,
      verified_knowledge_count: verifiedKnowledge.length,
      timestamp: new Date().toISOString()
    };

    // Add relevant insights to context
    if (recentInsights.length > 0) {
      contextData.recent_insights = recentInsights.map(i => ({
        topic: i.topic,
        insight: i.insight,
        confidence: i.confidence_score
      }));
    }

    // Add verified knowledge
    if (verifiedKnowledge.length > 0) {
      contextData.verified_knowledge = verifiedKnowledge.map(k => ({
        topic: k.topic,
        insight: k.insight
      }));
    }

    // Build system prompt with context
    const systemPrompt = `You are FETS OMNI AI with persistent memory.
    
You have access to:
- Previous conversation history: ${conversationHistory.length} messages
- Relevant AI-generated insights: ${recentInsights.length}
- Verified knowledge base entries: ${verifiedKnowledge.length}

Use this context to provide more accurate and contextual responses.
If you generate insights, they will be stored for future reference.

Current time: ${contextData.timestamp}

Respond helpfully and accurately.`;

    return {
      systemPrompt,
      contextData,
      conversationHistory
    };
  },

  /**
   * Extract insights from AI response and store them
   */
  async extractAndStoreInsights(
    userQuery: string,
    aiResponse: string,
    dataUsed: any[]
  ): Promise<void> {
    // Simple insight extraction - can be enhanced with NLP
    const insightsToStore = [];

    // Extract numbers/statistics from response
    const numberPatterns = /(\d+[\d,]*)/g;
    const numbers = aiResponse.match(numberPatterns);
    
    if (numbers && numbers.length > 0) {
      insightsToStore.push({
        topic: 'Statistics',
        insight: `Response contained: ${numbers.slice(0, 5).join(', ')}`,
        confidence: 0.8
      });
    }

    // Store insights
    for (const insight of insightsToStore) {
      await knowledgeService.addInsight(
        insight.topic,
        insight.insight,
        userQuery,
        'ai_response',
        insight.confidence
      );
    }
  }
};
