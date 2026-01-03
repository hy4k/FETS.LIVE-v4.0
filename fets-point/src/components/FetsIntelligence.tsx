import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Newspaper, AlertTriangle, Users, Settings,
  Send, Bot, ChevronRight, Activity, Search,
  Menu, Bell, Shield, Building2, Brain
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-hot-toast'
import { askGemini } from '../lib/gemini'

// Feature Components
import { NewsManager } from './NewsManager'
import { UserManagement } from './UserManagement'
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

export function FetsIntelligence() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('chat')

  // Chat State
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    setQuery('') // Clear input immediately

    try {
      const response = await askGemini(userMsg.content)
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

  const isSuperAdmin = profile?.role === 'super_admin' || profile?.email === 'mithun@fets.in';

  return (
    <div className="min-h-screen pt-24 pb-8 px-4 md:px-8 bg-slate-50 font-['Montserrat'] text-slate-800">

      <div className="max-w-7xl mx-auto h-[85vh] flex gap-6">

        {/* --- SIDEBAR --- */}
        <aside className="w-64 flex flex-col shrink-0">
          <div className="mb-8 pl-2">
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
              FETS<span className="text-amber-500">.INTEL</span>
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Central Command</p>
          </div>

          <nav className="flex-1 space-y-1">
            <div className="mb-6">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-2">Daily Ops</h3>
              <SidebarItem icon={MessageSquare} label="AI Assistant" isActive={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
              <SidebarItem icon={Newspaper} label="News & Updates" isActive={activeTab === 'news'} onClick={() => setActiveTab('news')} />
              <SidebarItem icon={AlertTriangle} label="Incident Log" isActive={activeTab === 'incidents'} onClick={() => setActiveTab('incidents')} />
            </div>

            {isSuperAdmin && (
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-2">Admin Tools</h3>
                <SidebarItem icon={Users} label="Staff Manager" isActive={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                <SidebarItem icon={Settings} label="System Config" isActive={activeTab === 'clients'} onClick={() => setActiveTab('clients')} />
              </div>
            )}
          </nav>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">

            {/* AI CHAT TAB */}
            {activeTab === 'chat' && (
              <ContentCard title="FETS Intelligence AI" icon={Bot}>
                <div className="flex flex-col h-full">
                  {/* Messages Area */}
                  <div className="flex-1 p-6 space-y-6">
                    {messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <div className="bg-amber-100 p-6 rounded-full text-amber-500 mb-4">
                          <Brain size={48} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-600">How can I help you today?</h3>
                        <p className="text-sm">Ask about rosters, exams, or incidents.</p>
                      </div>
                    )}

                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`
                          max-w-[80%] p-5 rounded-2xl shadow-sm leading-relaxed text-sm font-medium
                          ${msg.role === 'user'
                            ? 'bg-amber-500 text-white rounded-tr-none'
                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                          }
                        `}>
                          {msg.content}
                          <div className={`text-[10px] mt-2 font-bold uppercase ${msg.role === 'user' ? 'text-amber-100' : 'text-slate-300'}`}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}

                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 flex gap-2 items-center">
                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-75" />
                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-150" />
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="p-6 bg-white border-t border-slate-100">
                    <form onSubmit={handleSend} className="relative flex gap-4">
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Type your message here..."
                        className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl px-5 py-4 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!query.trim() || loading}
                        className="bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-xl shadow-lg shadow-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={20} />
                      </button>
                    </form>
                  </div>
                </div>
              </ContentCard>
            )}

            {/* NEWS TAB */}
            {activeTab === 'news' && (
              <ContentCard title="Latest News" icon={Newspaper}>
                <div className="p-8">
                  <NewsManager />
                </div>
              </ContentCard>
            )}

            {/* INCIDENTS TAB */}
            {activeTab === 'incidents' && (
              <ContentCard title="Incident Logs" icon={AlertTriangle}>
                <div className="p-8">
                  <IncidentManager />
                </div>
              </ContentCard>
            )}

            {/* STAFF MANAGER */}
            {activeTab === 'users' && isSuperAdmin && (
              <ContentCard title="Staff Directory" icon={Users}>
                <div className="p-8">
                  <UserManagement />
                </div>
              </ContentCard>
            )}

            {/* SYSTEM CONFIG */}
            {activeTab === 'clients' && isSuperAdmin && (
              <ContentCard title="Client Settings" icon={Settings}>
                <div className="p-8">
                  <ClientControl />
                </div>
              </ContentCard>
            )}

          </AnimatePresence>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  )
}
