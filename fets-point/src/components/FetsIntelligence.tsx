/**
 * FETS INTELLIGENCE - Redesigned for Maximum Readability
 * Clean, professional AI interface with excellent contrast
 * Version: 2.0 - Light Theme
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Newspaper, Send, Bot, ChevronRight, Activity, Sparkles,
  Zap, Brain, Lightbulb, MessageCircle, Wand2, Star,
  Calendar, Users, FileText, AlertCircle, TrendingUp, Eye,
  History, Save, BrainCircuit
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-hot-toast'
import { askClaude } from '../lib/anthropic'
import { conversationService, knowledgeService, contextBuilder } from '../lib/conversationService'

// Feature Components
import { NewsManager } from './NewsManager'

// --- Interfaces ---
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// --- MAIN PAGE ---
interface FetsAIProps {
  initialTab?: string;
  initialQuery?: string;
}

export function FetsIntelligence({ initialTab = 'chat', initialQuery }: FetsAIProps) {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState<string>(initialTab)

  // Chat State
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const hasProcessedInitialQuery = useRef(false)

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab)
  }, [initialTab]);

  // Auto-submit query when initialQuery is provided
  useEffect(() => {
    if (initialQuery && !hasProcessedInitialQuery.current && profile) {
      hasProcessedInitialQuery.current = true
      setActiveTab('chat')
      setTimeout(() => {
        submitQuery(initialQuery)
      }, 300)
    }
  }, [initialQuery, profile])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const submitQuery = async (queryText: string) => {
    if (!queryText.trim()) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: queryText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    const startTime = Date.now()

    try {
      // Build context with conversation history and knowledge
      const context = await contextBuilder.buildContext(queryText)

      const response = await askClaude(userMsg.content, profile)

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMsg])

      // Store in database for persistent memory
      const executionTime = Date.now() - startTime
      await conversationService.logQuery(
        queryText,
        response.substring(0, 200),
        ['candidates', 'sessions', 'incidents'],
        executionTime,
        0
      )

      // Extract and store insights
      await contextBuilder.extractAndStoreInsights(queryText, response, [])

    } catch (error) {
      toast.error('AI Connection Failed')
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return
    await submitQuery(query)
    setQuery('')
  }

  // Navigation tabs - Enhanced for Super AI
  const navTabs = [
    { id: 'chat', label: 'AI Assistant', icon: Sparkles },
    { id: 'news', label: 'Broadcasts', icon: Newspaper },
    { id: 'exam-stats', label: 'Exam Stats', icon: TrendingUp },
    { id: 'knowledge', label: 'Knowledge Base', icon: FileText },
  ];

  // Super AI Quick Prompts - Comprehensive temporal queries
  const quickPrompts = [
    { text: "Show all exams conducted", icon: Calendar },
    { text: "How many candidates registered?", icon: Users },
    { text: "Future exam schedule", icon: Eye },
    { text: "Past incidents summary", icon: AlertCircle },
    { text: "Total sessions ever conducted", icon: TrendingUp },
    { text: "All vault documents", icon: FileText },
    { text: "Staff roster history", icon: Users },
    { text: "Branch performance stats", icon: Star }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* --- HERO HEADER --- */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          {/* AI Icon */}
          <div className="relative inline-block mb-6">
            <div className="relative bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 p-6 rounded-3xl shadow-2xl">
              <Brain size={48} className="text-white" />
              <div className="absolute -top-2 -right-2">
                <Sparkles size={20} className="text-yellow-400" />
              </div>
              <div className="absolute -bottom-2 -left-2">
                <Star size={16} className="text-blue-300" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">
            FETS <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI</span> <span className="text-yellow-600">OMNI</span>
          </h1>

          {/* Subtitle */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent via-purple-300 to-transparent" />
            <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">
              Powered by Claude AI
            </p>
            <div className="h-px w-12 bg-gradient-to-r from-transparent via-purple-300 to-transparent" />
          </div>

          <p className="text-gray-700 text-sm max-w-2xl mx-auto leading-relaxed font-medium">
            Your <span className="text-yellow-600 font-bold">SUPER INTELLIGENT</span> assistant with complete temporal awareness.
            Ask about <span className="text-blue-600 font-semibold">all exams</span>, <span className="text-blue-600 font-semibold">candidates</span>, <span className="text-blue-600 font-semibold">historical data</span>, and <span className="text-blue-600 font-semibold">future schedules</span>.
          </p>
        </motion.div>

        {/* --- NAVIGATION TABS --- */}
        <div className="flex justify-center gap-3 mb-6 flex-wrap">
          {navTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <AnimatePresence mode="wait">

          {/* AI CHAT TAB */}
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden"
            >
              {/* Chat Header */}
              <div className="px-6 md:px-8 py-5 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Wand2 size={22} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Ask FETS OMNI</h2>
                    <p className="text-xs text-blue-100 font-semibold">Temporal Intelligence - All Data Access</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-lg" />
                  <span className="text-xs text-white font-bold uppercase tracking-wider">Live</span>
                </div>
              </div>

              {/* Messages Area */}
              <div className="h-[55vh] overflow-y-auto p-6 bg-gray-50 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <div className="relative mb-6">
                      <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-8 rounded-3xl shadow-xl">
                        <Bot size={48} className="text-white" />
                      </div>
                    </div>

                    <h3 className="text-2xl font-black text-gray-900 mb-3">Hello! I'm FETS OMNI AI</h3>
                    <p className="text-gray-600 text-sm max-w-md mb-8 font-medium">
                      I have <span className="text-yellow-600 font-bold">complete temporal awareness</span>. Ask me anything about your data!
                    </p>

                    {/* Quick Prompts */}
                    <div className="grid grid-cols-2 gap-3 max-w-2xl w-full">
                      {quickPrompts.map((prompt, idx) => {
                        const Icon = prompt.icon
                        return (
                          <button
                            key={idx}
                            onClick={() => { setQuery(prompt.text); submitQuery(prompt.text); }}
                            className="flex items-center gap-3 p-4 bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300 rounded-xl text-left transition-all shadow-sm hover:shadow-md"
                          >
                            <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                              <Icon size={16} className="text-blue-600" />
                            </div>
                            <span className="text-xs font-bold text-gray-800">
                              {prompt.text}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] md:max-w-[75%] p-5 rounded-2xl shadow-md ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                          : 'bg-white text-gray-900 border-2 border-gray-200'
                      }`}>
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-gray-100">
                            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                              <Sparkles size={12} className="text-white" />
                            </div>
                            <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest">
                              FETS OMNI AI
                            </span>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                          {msg.content}
                        </p>
                        <div className={`text-[10px] mt-3 font-bold uppercase flex items-center gap-2 ${
                          msg.role === 'user' ? 'text-blue-100 justify-end' : 'text-gray-500'
                        }`}>
                          {msg.role === 'assistant' && <Activity size={10} />}
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border-2 border-gray-200 px-6 py-4 rounded-2xl shadow-md flex gap-2 items-center">
                      <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                        <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <div className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                      </div>
                      <span className="text-xs text-gray-700 ml-2 font-semibold">FETS OMNI is analyzing...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white border-t-2 border-gray-200">
                <form onSubmit={handleSend} className="flex gap-3">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about ANY past, present, or future content..."
                    disabled={loading}
                    className="flex-1 bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-500 rounded-xl px-5 py-4 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!query.trim() || loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold"
                  >
                    {loading ? (
                      <Activity className="animate-spin" size={22} />
                    ) : (
                      <Send size={22} />
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* NEWS TAB */}
          {activeTab === 'news' && (
            <motion.div
              key="news"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden"
            >
              <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl text-white backdrop-blur-sm">
                  <Newspaper size={24} />
                </div>
                <h2 className="text-xl font-bold text-white">Global Broadcasts</h2>
              </div>
              <div className="p-8 bg-gray-50">
                <NewsManager />
              </div>
            </motion.div>
          )}

          {/* EXAM STATS TAB */}
          {activeTab === 'exam-stats' && (
            <motion.div
              key="exam-stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden"
            >
              <div className="px-6 md:px-8 py-5 bg-gradient-to-r from-orange-500 to-amber-500">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl shadow-lg backdrop-blur-sm">
                    <TrendingUp size={22} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase">Exam Intelligence</h2>
                    <p className="text-xs text-orange-100 font-semibold">Historical & Real-time Exam Statistics</p>
                  </div>
                </div>
              </div>
              <div className="p-8 bg-gray-50">
                <div className="bg-white rounded-2xl p-8 text-center shadow-md border-2 border-gray-200">
                  <TrendingUp size={48} className="text-purple-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Comprehensive Exam Analytics</h3>
                  <p className="text-gray-700 text-sm font-medium mb-6">
                    Ask FETS OMNI about exam statistics, candidate counts, session history, and performance metrics.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => { setActiveTab('chat'); setQuery("Show all exams conducted"); submitQuery("Show all exams conducted"); }}
                      className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-2 border-gray-200 hover:border-blue-300 rounded-xl text-left transition-all shadow-sm hover:shadow-md"
                    >
                      <Calendar size={20} className="text-blue-600 mb-2" />
                      <p className="text-sm font-bold text-gray-900">Exams Conducted</p>
                    </button>
                    <button
                      onClick={() => { setActiveTab('chat'); setQuery("How many candidates registered overall?"); submitQuery("How many candidates registered overall?"); }}
                      className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-2 border-gray-200 hover:border-purple-300 rounded-xl text-left transition-all shadow-sm hover:shadow-md"
                    >
                      <Users size={20} className="text-purple-600 mb-2" />
                      <p className="text-sm font-bold text-gray-900">Candidate Registry</p>
                    </button>
                    <button
                      onClick={() => { setActiveTab('chat'); setQuery("Future exam schedule and capacity"); submitQuery("Future exam schedule and capacity"); }}
                      className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-2 border-gray-200 hover:border-green-300 rounded-xl text-left transition-all shadow-sm hover:shadow-md"
                    >
                      <Eye size={20} className="text-green-600 mb-2" />
                      <p className="text-sm font-bold text-gray-900">Future Schedule</p>
                    </button>
                    <button
                      onClick={() => { setActiveTab('chat'); setQuery("Exam statistics by type"); submitQuery("Exam statistics by type"); }}
                      className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border-2 border-gray-200 hover:border-orange-300 rounded-xl text-left transition-all shadow-sm hover:shadow-md"
                    >
                      <TrendingUp size={20} className="text-orange-600 mb-2" />
                      <p className="text-sm font-bold text-gray-900">Statistics Breakdown</p>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* KNOWLEDGE BASE TAB */}
          {activeTab === 'knowledge' && (
            <motion.div
              key="knowledge"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden"
            >
              <div className="px-6 md:px-8 py-5 bg-gradient-to-r from-cyan-500 to-blue-600">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl shadow-lg backdrop-blur-sm">
                    <FileText size={22} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase">Knowledge Base</h2>
                    <p className="text-xs text-cyan-100 font-semibold">Vault Documents & Historical Records</p>
                  </div>
                </div>
              </div>
              <div className="p-8 bg-gray-50">
                <div className="bg-white rounded-2xl p-8 text-center shadow-md border-2 border-gray-200">
                  <FileText size={48} className="text-cyan-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Complete Document Archive</h3>
                  <p className="text-gray-700 text-sm font-medium mb-6">
                    Access all vault documents, notices, posts, and historical records through FETS OMNI.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => { setActiveTab('chat'); setQuery("List all vault documents"); submitQuery("List all vault documents"); }}
                      className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 border-2 border-gray-200 hover:border-cyan-300 rounded-xl text-left transition-all shadow-sm hover:shadow-md"
                    >
                      <FileText size={20} className="text-cyan-600 mb-2" />
                      <p className="text-sm font-bold text-gray-900">Vault Documents</p>
                    </button>
                    <button
                      onClick={() => { setActiveTab('chat'); setQuery("Show all notices and announcements"); submitQuery("Show all notices and announcements"); }}
                      className="p-4 bg-gradient-to-br from-purple-50 to-fuchsia-50 hover:from-purple-100 hover:to-fuchsia-100 border-2 border-gray-200 hover:border-purple-300 rounded-xl text-left transition-all shadow-sm hover:shadow-md"
                    >
                      <MessageCircle size={20} className="text-purple-600 mb-2" />
                      <p className="text-sm font-bold text-gray-900">Notices Archive</p>
                    </button>
                    <button
                      onClick={() => { setActiveTab('chat'); setQuery("Past incidents and resolutions"); submitQuery("Past incidents and resolutions"); }}
                      className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border-2 border-gray-200 hover:border-amber-300 rounded-xl text-left transition-all shadow-sm hover:shadow-md"
                    >
                      <AlertCircle size={20} className="text-amber-600 mb-2" />
                      <p className="text-sm font-bold text-gray-900">Incident History</p>
                    </button>
                    <button
                      onClick={() => { setActiveTab('chat'); setQuery("Staff roster and leave history"); submitQuery("Staff roster and leave history"); }}
                      className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 border-2 border-gray-200 hover:border-violet-300 rounded-xl text-left transition-all shadow-sm hover:shadow-md"
                    >
                      <Users size={20} className="text-violet-600 mb-2" />
                      <p className="text-sm font-bold text-gray-900">Staff Records</p>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
