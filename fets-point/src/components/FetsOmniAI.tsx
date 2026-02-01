/**
 * FETS OMNI AI - Redesigned for Maximum Readability
 * Clean, professional AI interface with excellent contrast
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Send, Bot, ChevronRight, Brain, Lightbulb,
  MessageCircle, Wand2, Star, Calendar, Users, FileText,
  AlertCircle, TrendingUp, Eye, History, Save, BrainCircuit,
  Cpu, Globe, Shield, Target, ArrowRight, Mic, MicOff,
  Volume2, VolumeX, Download, Share2, Settings, X, Maximize2,
  BarChart3, PieChart, LineChart, TrendingDown, Activity, Zap
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-hot-toast'
import { askClaude } from '../lib/anthropic'
import { conversationService, knowledgeService, contextBuilder } from '../lib/conversationService'

// --- Interfaces ---
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: string[]
}

interface AIMetric {
  label: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'stable'
  icon: any
}

interface OmniAIProps {
  initialTab?: string
  initialQuery?: string
}

// --- Metric Card Component ---
function MetricCard({ metric, index }: { metric: AIMetric, index: number }) {
  const Icon = metric.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${
          metric.trend === 'up' ? 'bg-green-100 text-green-600' :
          metric.trend === 'down' ? 'bg-red-100 text-red-600' :
          'bg-blue-100 text-blue-600'
        }`}>
          <Icon size={24} />
        </div>
        {metric.change && (
          <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
            metric.trend === 'up' ? 'bg-green-100 text-green-700' :
            metric.trend === 'down' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {metric.change}
          </span>
        )}
      </div>
      <h3 className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</h3>
      <p className="text-gray-600 text-sm font-medium">{metric.label}</p>
    </motion.div>
  )
}

// --- Chat Message Component ---
function ChatMessageComponent({ message, index }: { message: ChatMessage, index: number }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            isUser
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 ml-3'
              : 'bg-gradient-to-br from-purple-500 to-purple-600 mr-3'
          }`}
        >
          {isUser ? (
            <Users size={18} className="text-white" />
          ) : (
            <BrainCircuit size={18} className="text-white" />
          )}
        </div>

        {/* Message Bubble */}
        <div className={`rounded-2xl p-4 shadow-sm ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-white border border-gray-200 text-gray-900'
        }`}>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap m-0">{message.content}</p>
          </div>
          {message.sources && message.sources.length > 0 && (
            <div className={`mt-3 pt-3 border-t ${isUser ? 'border-blue-400' : 'border-gray-200'}`}>
              <p className={`text-xs font-semibold mb-2 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                Sources:
              </p>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((source, i) => (
                  <span key={i} className={`text-xs px-2 py-1 rounded-full font-medium ${
                    isUser ? 'bg-blue-400 text-white' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {source}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className={`text-xs mt-2 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
            {message.timestamp.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// --- Typing Indicator Component ---
function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 p-4">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
        <BrainCircuit size={18} className="text-white" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-2 h-2 rounded-full bg-purple-500"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Quick Action Button ---
function QuickAction({ action, index, onClick }: { action: { text: string, icon: any, color: string }, index: number, onClick: (text: string) => void }) {
  const Icon = action.icon
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(action.text)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r ${action.color} text-white font-medium transition-all shadow-md hover:shadow-lg`}
    >
      <Icon size={16} />
      <span className="text-sm">{action.text}</span>
    </motion.button>
  )
}

// --- Main Component ---
export function FetsOmniAI({ initialTab = 'chat', initialQuery }: OmniAIProps) {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState<string>(initialTab)
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const hasProcessedInitialQuery = useRef(false)

  // Metrics data
  const metrics: AIMetric[] = [
    { label: 'Total Conversations', value: '12,847', change: '+12.3%', trend: 'up', icon: MessageCircle },
    { label: 'Questions Answered', value: '48,392', change: '+8.7%', trend: 'up', icon: Brain },
    { label: 'Knowledge Stored', value: '2,156', change: '+23.1%', trend: 'up', icon: FileText },
    { label: 'Accuracy Rate', value: '98.7%', change: '+0.3%', trend: 'up', icon: Target },
    { label: 'Response Time', value: '0.8s', change: '-12%', trend: 'up', icon: Zap },
    { label: 'Active Users', value: '1,247', change: '+5.2%', trend: 'up', icon: Users },
  ]

  // Quick actions
  const quickActions = [
    { text: "All exams conducted", icon: Calendar, color: "from-blue-500 to-blue-600" },
    { text: "Candidates registered", icon: Users, color: "from-purple-500 to-purple-600" },
    { text: "Future exam schedule", icon: Eye, color: "from-green-500 to-green-600" },
    { text: "Past incidents", icon: AlertCircle, color: "from-red-500 to-red-600" },
    { text: "Sessions conducted", icon: TrendingUp, color: "from-orange-500 to-orange-600" },
    { text: "Branch statistics", icon: BarChart3, color: "from-indigo-500 to-indigo-600" },
  ]

  // Navigation tabs
  const navTabs = [
    { id: 'chat', label: 'AI Assistant', icon: Sparkles },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'knowledge', label: 'Knowledge', icon: FileText },
    { id: 'history', label: 'History', icon: History },
  ]

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle initial query
  useEffect(() => {
    if (initialQuery && !hasProcessedInitialQuery.current && profile) {
      hasProcessedInitialQuery.current = true
      setActiveTab('chat')
      setTimeout(() => submitQuery(initialQuery), 300)
    }
  }, [initialQuery, profile])

  // Submit query to AI
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
      const context = await contextBuilder.buildContext(queryText)
      const response = await askClaude(userMsg.content, profile)

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        sources: ['candidates', 'sessions', 'incidents']
      }
      setMessages(prev => [...prev, aiMsg])

      const executionTime = Date.now() - startTime
      await conversationService.logQuery(
        queryText,
        response.substring(0, 200),
        ['candidates', 'sessions', 'incidents'],
        executionTime,
        0
      )

      await contextBuilder.extractAndStoreInsights(queryText, response, [])

    } catch (error) {
      toast.error('AI Connection Failed')
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm experiencing connection issues. Please try again in a moment.",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 md:p-6">

      {/* Top Navigation */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                <BrainCircuit size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  FETS OMNI AI
                </h1>
                <p className="text-xs text-gray-600 font-medium">Super-Powered Intelligence</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2">
              {navTabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="hidden md:inline">{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all text-gray-700">
                <Settings size={20} />
              </button>
              <button className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-md transition-all">
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto">

        {/* AI Assistant Tab */}
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Quick Actions */}
            <div className="hidden lg:block">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap size={20} className="text-blue-600" />
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  {quickActions.map((action, index) => (
                    <QuickAction
                      key={index}
                      action={action}
                      index={index}
                      onClick={(text) => {
                        setQuery(text)
                        submitQuery(text)
                      }}
                    />
                  ))}
                </div>

                {/* AI Capabilities */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-bold text-gray-700 mb-4">AI Capabilities</h4>
                  <div className="space-y-2">
                    {[
                      { icon: Globe, text: 'Global Data Access' },
                      { icon: History, text: 'Historical Records' },
                      { icon: Target, text: 'Exam Intelligence' },
                      { icon: Brain, text: 'Predictive Analytics' },
                    ].map((cap, i) => {
                      const Icon = cap.icon
                      return (
                        <div key={i} className="flex items-center gap-3 text-sm text-gray-700">
                          <Icon size={16} className="text-blue-600" />
                          <span>{cap.text}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col h-[calc(100vh-12rem)]">
                {/* Chat Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                      <BrainCircuit size={24} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">FETS OMNI AI</h2>
                      <p className="text-sm text-green-600 flex items-center gap-1 font-medium">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Online • Ready to help
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all text-gray-700">
                      <Download size={18} />
                    </button>
                    <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all text-gray-700">
                      <Maximize2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                  <AnimatePresence>
                    {messages.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-full text-center"
                      >
                        <div className="w-24 h-24 mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
                          <BrainCircuit size={48} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          How can I help you today?
                        </h3>
                        <p className="text-gray-600 max-w-md mb-6">
                          Ask me anything about your data, exams, candidates, or get insights from your historical records.
                        </p>

                        {/* Quick prompts */}
                        <div className="flex flex-wrap justify-center gap-2">
                          {quickActions.slice(0, 4).map((action, i) => (
                            <button
                              key={i}
                              onClick={() => submitQuery(action.text)}
                              className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all font-medium"
                            >
                              {action.text}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {messages.map((message, index) => (
                      <ChatMessageComponent
                        key={message.id}
                        message={message}
                        index={index}
                      />
                    ))}

                    {loading && <TypingIndicator />}
                  </AnimatePresence>
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 border-t border-gray-200 bg-white">
                  <form onSubmit={handleSend} className="relative">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsRecording(!isRecording)}
                        className={`p-3 rounded-lg transition-all ${
                          isRecording
                            ? 'bg-red-100 text-red-600 animate-pulse'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                      </button>

                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask FETS OMNI AI anything..."
                        className="flex-1 px-6 py-4 rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                      />

                      <button
                        type="submit"
                        disabled={!query.trim() || loading}
                        className="px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all font-medium"
                      >
                        <Send size={20} />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Analytics Dashboard
              </h2>
              <p className="text-gray-600">Real-time insights and predictive analytics</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {metrics.map((metric, index) => (
                <MetricCard key={metric.label} metric={metric} index={index} />
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <LineChart size={20} className="text-blue-600" />
                  Conversation Trends
                </h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <LineChart size={48} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <PieChart size={20} className="text-purple-600" />
                  Query Distribution
                </h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <PieChart size={48} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium">Analytics visualization coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Knowledge Tab */}
        {activeTab === 'knowledge' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Knowledge Base
              </h2>
              <p className="text-gray-600">AI-generated insights and verified knowledge</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Lightbulb size={20} className="text-yellow-600" />
                Recent Insights
              </h3>
              <div className="space-y-4">
                {[
                  { title: 'Exam Registration Trend', insight: '23% increase in CMA US registrations this quarter', confidence: 95 },
                  { title: 'Candidate Success Rate', insight: 'Pass rate improved by 8% with new study materials', confidence: 88 },
                  { title: 'Session Optimization', insight: 'Average session duration reduced by 15 minutes', confidence: 92 },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-900">{item.title}</h4>
                      <span className="text-sm text-green-600 font-semibold bg-green-100 px-2 py-1 rounded-full">
                        {item.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{item.insight}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Conversation History
              </h2>
              <p className="text-gray-600">Your past interactions with FETS OMNI AI</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="space-y-4">
                {[
                  { query: 'Show all CMA US exam registrations', time: '2 hours ago', duration: '1.2s' },
                  { query: 'What is the pass rate for Part 1?', time: '5 hours ago', duration: '0.8s' },
                  { query: 'Future exam schedule for Q1 2026', time: 'Yesterday', duration: '1.5s' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <MessageCircle size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-semibold">{item.query}</p>
                        <p className="text-sm text-gray-600">{item.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 font-medium">{item.duration}</span>
                      <ChevronRight size={18} className="text-gray-400" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FetsOmniAI
