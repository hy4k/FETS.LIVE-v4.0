import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Newspaper, AlertTriangle, Users, Settings,
  Send, Bot, ChevronRight, Activity, Search,
  Menu, Bell, Shield, Building2
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-hot-toast'
import { askGemini } from '../lib/gemini'

// Feature Components
import { NewsManager } from './NewsManager'
import IncidentManager from './IncidentManager'
import { ClientControl } from './ClientControl'

// --- Interfaces ---

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// --- Components ---

const SidebarItem = ({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ElementType,
  label: string,
  isActive: boolean,
  onClick: () => void,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 mb-2 font-medium text-sm
        ${isActive
          ? 'bg-amber-400 text-white shadow-lg shadow-amber-200 transform scale-105'
          : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 shadow-sm border border-slate-100'
        }
      `}
    >
      <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
      <span>{label}</span>
      {isActive && <ChevronRight size={16} className="ml-auto opacity-80" />}
    </button>
  )
}

const ContentCard = ({ title, children, icon: Icon }: { title: string, children: React.ReactNode, icon: any }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col h-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
  >
    <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white flex items-center gap-4">
      <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
        <Icon size={24} />
      </div>
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
    </div>
    <div className="flex-1 overflow-auto bg-slate-50/50 relative">
      <div className="h-full overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </div>
  </motion.div>
)

// --- MAIN PAGE ---

// --- MAIN PAGE ---
interface FetsIntelligenceProps {
  initialTab?: string;
  initialQuery?: string;
}

export function FetsIntelligence({ initialTab = 'chat', initialQuery }: FetsIntelligenceProps) {
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

  // Auto-submit query when initialQuery is provided from Command Centre
  useEffect(() => {
    if (initialQuery && !hasProcessedInitialQuery.current && profile) {
      hasProcessedInitialQuery.current = true
      setActiveTab('chat')
      // Submit the query after a brief delay to ensure component is ready
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
        content: "Sorry, I'm having trouble connecting to the network right now.",
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
    setQuery('') // Clear input after sending
  }

  const isSuperAdmin = profile?.role === 'super_admin' || profile?.email === 'mithun@fets.in';

  // Navigation tabs for the page
  const navTabs = [
    { id: 'chat', label: 'Intelligence', icon: Bot },
    { id: 'news', label: 'Broadcasts', icon: Newspaper },
    ...(isSuperAdmin ? [{ id: 'clients', label: 'System Config', icon: Settings }] : [])
  ];

  return (
    <div className="min-h-screen pt-28 pb-12 px-4 md:px-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-['Montserrat'] text-white">
      
      <div className="max-w-5xl mx-auto">

        {/* --- HERO HEADER WITH CENTERED LOGO --- */}
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          {/* Large Centered Logo */}
          <motion.img 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            src="/fets_intel_logo.png" 
            alt="FETS INTELLIGENCE" 
            className="h-20 md:h-28 w-auto mx-auto mb-6 drop-shadow-[0_10px_30px_rgba(251,191,36,0.3)]"
          />
          
          {/* Subtitle */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-500/50"></div>
            <p className="text-xs font-black text-amber-400 uppercase tracking-[0.4em]">Oracle v11.0</p>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-500/50"></div>
          </div>
          
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            Your operational command center for real-time intelligence on exams, candidates, rosters, and incidents.
          </p>
        </motion.div>

        {/* --- NAVIGATION TABS --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-2 mb-8"
        >
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2.5 px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wider transition-all duration-300
                ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 scale-105'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50'
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
              className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden shadow-2xl shadow-black/30"
            >
              {/* Chat Header */}
              <div className="px-8 py-5 border-b border-slate-700/50 bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                    <Bot size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Ask Anything</h2>
                    <p className="text-xs text-slate-400">Exams, candidates, rosters, incidents — I know it all</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Online</span>
                </div>
              </div>

              {/* Messages Area */}
              <div className="h-[50vh] overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="relative mb-8"
                    >
                      {/* Glowing ring effect */}
                      <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-3xl scale-150"></div>
                      <div className="relative bg-gradient-to-br from-amber-400 to-amber-600 p-10 rounded-full shadow-2xl shadow-amber-500/30">
                        <Bot size={56} className="text-white" />
                      </div>
                    </motion.div>
                    <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Intelligence Ready</h3>
                    <p className="text-slate-400 text-sm max-w-md leading-relaxed mb-8">
                      Query the Oracle for operational insights. Try asking about upcoming exams, candidate counts, or staff schedules.
                    </p>
                    
                    {/* Quick Prompts */}
                    <div className="flex flex-wrap justify-center gap-3">
                      {[
                        "How many CMA exams today?",
                        "Who is on duty tomorrow?",
                        "Show upcoming sessions"
                      ].map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => { setQuery(prompt); }}
                          className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 rounded-full text-xs font-semibold text-slate-300 hover:text-white transition-all"
                        >
                          {prompt}
                        </button>
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
                        max-w-[80%] p-5 rounded-2xl relative
                        ${msg.role === 'user'
                          ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-tr-sm'
                          : 'bg-gradient-to-br from-slate-600 to-slate-700 text-white border border-slate-500/30 rounded-tl-sm shadow-xl'
                        }
                      `}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <div className={`text-[10px] mt-3 font-bold uppercase tracking-widest flex items-center gap-2 ${msg.role === 'user' ? 'text-amber-200 justify-end' : 'text-amber-300'}`}>
                          {msg.role === 'assistant' && <Activity size={10} />}
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-700/50 border border-slate-600/50 px-6 py-4 rounded-2xl rounded-tl-sm flex gap-2 items-center">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 bg-slate-800/50 border-t border-slate-700/50">
                <form onSubmit={handleSend} className="flex gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask FETS Intelligence..."
                      disabled={loading}
                      className="w-full bg-slate-900/50 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl px-5 py-4 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!query.trim() || loading}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
              <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                  <Newspaper size={24} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Global Broadcasts</h2>
              </div>
              <div className="p-8 bg-slate-50 text-slate-800">
                <NewsManager />
              </div>
            </motion.div>
          )}

          {/* SYSTEM CONFIG */}
          {activeTab === 'clients' && isSuperAdmin && (
            <motion.div
              key="clients"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                  <Settings size={24} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Client Protocol Config</h2>
              </div>
              <div className="p-8 bg-slate-50 text-slate-800">
                <ClientControl />
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.5); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.7); }
      `}</style>
    </div>
  )
}
