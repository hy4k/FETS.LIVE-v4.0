import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Newspaper, Send, Bot, ChevronRight, Activity, Sparkles,
  Zap, Brain, Lightbulb, MessageCircle, Wand2, Star
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-hot-toast'
import { askGemini } from '../lib/gemini'

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

    try {
      const response = await askGemini(userMsg.content, profile)
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMsg])
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

  // Navigation tabs
  const navTabs = [
    { id: 'chat', label: 'AI Assistant', icon: Sparkles },
    { id: 'news', label: 'Broadcasts', icon: Newspaper },
  ];

  // Quick prompts for AI
  const quickPrompts = [
    { text: "How many exams today?", icon: Zap },
    { text: "Who is on duty tomorrow?", icon: Star },
    { text: "Show upcoming sessions", icon: Lightbulb },
    { text: "Any pending incidents?", icon: MessageCircle }
  ]

  return (
    <div 
      className="min-h-screen pt-28 pb-12 px-4 md:px-8 font-['Montserrat'] relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)'
      }}
    >
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs */}
        <motion.div 
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            x: [0, -80, 0],
            y: [0, 80, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            x: [0, 50, 0],
            y: [0, 100, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl"
        />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">

        {/* --- HERO HEADER --- */}
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          {/* Glowing AI Icon */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="relative inline-block mb-8"
          >
            {/* Outer glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-3xl blur-2xl opacity-50 scale-125" />
            
            {/* Main icon container */}
            <div className="relative bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 p-6 md:p-8 rounded-3xl shadow-2xl">
              <Brain size={48} className="text-white md:w-16 md:h-16" />
              
              {/* Sparkle effects */}
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles size={20} className="text-amber-300" />
              </motion.div>
              <motion.div 
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                className="absolute -bottom-2 -left-2"
              >
                <Star size={16} className="text-cyan-300" />
              </motion.div>
            </div>
          </motion.div>
          
          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            FETS <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400">AI</span>
          </h1>
          
          {/* Subtitle */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
            <p className="text-xs font-black text-violet-400 uppercase tracking-[0.4em]">Powered by Gemini</p>
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
          </div>
          
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            Your intelligent assistant for exam operations, candidate queries, roster management, and real-time insights.
          </p>
        </motion.div>

        {/* --- NAVIGATION TABS --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-3 mb-8"
        >
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all duration-300
                ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/30 scale-105'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10 backdrop-blur-sm'
                }
              `}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* --- MAIN CONTENT AREA --- */}
        <AnimatePresence mode="wait">

          {/* AI CHAT TAB */}
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
            >
              {/* Chat Header */}
              <div className="px-6 md:px-8 py-5 border-b border-white/10 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl shadow-lg">
                    <Wand2 size={22} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Ask FETS AI</h2>
                    <p className="text-xs text-slate-400">Real-time intelligence at your fingertips</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
                  <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Live</span>
                </div>
              </div>

              {/* Messages Area */}
              <div className="h-[50vh] overflow-y-auto p-6 space-y-5 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="relative mb-8"
                    >
                      {/* Glowing ring effect */}
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 rounded-full blur-3xl scale-150"
                      />
                      <div className="relative bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 p-8 rounded-3xl shadow-2xl shadow-fuchsia-500/30">
                        <Bot size={48} className="text-white" />
                      </div>
                    </motion.div>
                    
                    <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Hello! I'm FETS AI</h3>
                    <p className="text-slate-400 text-sm max-w-md leading-relaxed mb-8">
                      Ask me anything about exams, candidates, rosters, schedules, or operational insights. I'm here to help!
                    </p>
                    
                    {/* Quick Prompts */}
                    <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
                      {quickPrompts.map((prompt, idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => { setQuery(prompt.text); }}
                          className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/30 rounded-2xl text-left transition-all group"
                        >
                          <div className="p-2 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-lg group-hover:from-violet-500/30 group-hover:to-fuchsia-500/30 transition-colors">
                            <prompt.icon size={16} className="text-violet-400" />
                          </div>
                          <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
                            {prompt.text}
                          </span>
                        </motion.button>
                      ))}
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
                      <div className={`
                        max-w-[85%] md:max-w-[75%] p-5 rounded-2xl relative
                        ${msg.role === 'user'
                          ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-tr-sm shadow-lg shadow-fuchsia-500/20'
                          : 'bg-white/10 backdrop-blur-sm text-white border border-white/10 rounded-tl-sm'
                        }
                      `}>
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                            <div className="p-1.5 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg">
                              <Sparkles size={12} className="text-white" />
                            </div>
                            <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">FETS AI</span>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                        <div className={`text-[10px] mt-3 font-bold uppercase tracking-widest flex items-center gap-2 ${msg.role === 'user' ? 'text-violet-200 justify-end' : 'text-slate-500'}`}>
                          {msg.role === 'assistant' && <Activity size={10} />}
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 backdrop-blur-sm border border-white/10 px-6 py-4 rounded-2xl rounded-tl-sm flex gap-2 items-center">
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        className="w-2.5 h-2.5 bg-gradient-to-br from-violet-400 to-fuchsia-400 rounded-full"
                      />
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                        className="w-2.5 h-2.5 bg-gradient-to-br from-fuchsia-400 to-pink-400 rounded-full"
                      />
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                        className="w-2.5 h-2.5 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full"
                      />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-5 md:p-6 bg-white/5 border-t border-white/10">
                <form onSubmit={handleSend} className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask FETS AI anything..."
                      disabled={loading}
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-2xl px-5 py-4 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all backdrop-blur-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!query.trim() || loading}
                    className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-pink-600 text-white px-6 rounded-2xl shadow-lg shadow-fuchsia-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-fuchsia-50 flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl text-white">
                  <Newspaper size={24} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Global Broadcasts</h2>
              </div>
              <div className="p-8 bg-slate-50 text-slate-800">
                <NewsManager />
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(139,92,246,0.5); }
      `}</style>
    </div>
  )
}
