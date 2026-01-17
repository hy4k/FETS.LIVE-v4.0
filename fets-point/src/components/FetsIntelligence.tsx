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
}

export function FetsIntelligence({ initialTab = 'chat' }: FetsIntelligenceProps) {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState<string>(initialTab)

  // Chat State
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab)
  }, [initialTab]);

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

  const isSuperAdmin = profile?.role === 'super_admin' || profile?.email === 'mithun@fets.in';

  return (
    <div className="min-h-screen pt-24 pb-8 px-4 md:px-8 bg-[#EEF2F9] font-['Montserrat'] text-slate-800">

      <div className="max-w-[1600px] mx-auto h-[85vh] flex gap-8">

        {/* --- SIDEBAR --- */}
        <aside className="w-72 flex flex-col shrink-0">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-10 pl-4"
          >
            <img 
              src="/fets_intel_logo.png" 
              alt="FETS INTELLIGENCE" 
              className="h-10 w-auto object-contain mb-3 drop-shadow-md"
            />
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-8 bg-amber-500 rounded-full"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Central Command v10.0</p>
            </div>
          </motion.div>

          <nav className="flex-1 space-y-2">
            <div className="mb-8">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 pl-4">Neural Link</h3>
              <SidebarItem icon={MessageSquare} label="AI Intelligence" isActive={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
            </div>

            <div className="mb-8">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 pl-4">Operational Grid</h3>
              <SidebarItem icon={Newspaper} label="Broadcasts" isActive={activeTab === 'news'} onClick={() => setActiveTab('news')} />
            </div>

            {isSuperAdmin && (
              <div>
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 pl-4">System Core</h3>
                <SidebarItem icon={Settings} label="Client Protocol" isActive={activeTab === 'clients'} onClick={() => setActiveTab('clients')} />
              </div>
            )}
          </nav>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">

            {/* AI CHAT TAB */}
            {activeTab === 'chat' && (
              <ContentCard title="AI Neural Interface" icon={Bot}>
                <div className="flex flex-col h-full bg-[#f8fafc]">
                  {/* Messages Area */}
                  <div className="flex-1 p-8 space-y-8">
                    {messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-80">
                         <motion.div 
                           initial={{ scale: 0.8, opacity: 0 }}
                           animate={{ scale: 1, opacity: 1 }}
                           className="bg-gradient-to-br from-amber-400 to-amber-600 p-8 rounded-[2rem] text-white shadow-[0_20px_40px_-10px_rgba(245,158,11,0.4)] mb-8 ring-4 ring-amber-100"
                         >
                           <Bot size={64} className="text-white drop-shadow-md" />
                         </motion.div>
                         <h3 className="text-3xl font-black text-slate-700 tracking-tight mb-2">FETS Intelligence Online</h3>
                         <p className="text-sm font-medium text-slate-500 max-w-md text-center leading-relaxed">
                           Systems nominal. Accessing secure ledger. <br/> Ready for operational queries involving rosters, exams, or incidents.
                         </p>
                      </div>
                    )}

                    {messages.map((msg) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id} 
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`
                          max-w-[75%] p-6 rounded-[1.5rem] shadow-sm relative group transition-all duration-300
                          ${msg.role === 'user'
                            ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-tr-none shadow-xl shadow-slate-200'
                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-[4px_4px_20px_rgba(0,0,0,0.03)]'
                          }
                        `}>
                          <p className={`text-[15px] font-medium leading-relaxed ${msg.role === 'user' ? 'text-slate-100' : 'text-slate-600'}`}>
                            {msg.content}
                          </p>
                          <div className={`text-[9px] mt-3 font-black uppercase tracking-widest opacity-60 flex items-center gap-2 ${msg.role === 'user' ? 'text-slate-400 justify-end' : 'text-amber-500'}`}>
                            {msg.role === 'assistant' && <Activity size={10} />}
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-white px-6 py-5 rounded-[1.5rem] rounded-tl-none border border-slate-100 flex gap-2 items-center shadow-sm">
                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-75" />
                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-150" />
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="p-6 bg-white/80 backdrop-blur-md border-t border-slate-100/50">
                    <form onSubmit={handleSend} className="relative flex gap-4 max-w-4xl mx-auto">
                      <div className="relative flex-1 group">
                         <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-300 to-amber-500 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                         <input
                           type="text"
                           value={query}
                           onChange={(e) => setQuery(e.target.value)}
                           placeholder="Transmit query to Neural Core..."
                           disabled={loading}
                           className="relative w-full bg-white border-none text-slate-800 placeholder-slate-400 rounded-xl px-6 py-4 font-semibold text-lg focus:outline-none focus:ring-0 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.02)]"
                         />
                      </div>
                      <button
                        type="submit"
                        disabled={!query.trim() || loading}
                        className="bg-slate-900 hover:bg-black text-white px-6 rounded-xl shadow-lg shadow-slate-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[3.5rem]"
                      >
                        <Send size={22} className={loading ? 'opacity-0' : ''} />
                        {loading && <div className="absolute inset-0 flex items-center justify-center"><Activity className="animate-spin" size={20} /></div>}
                      </button>
                    </form>
                    <p className="text-center text-[10px] uppercase font-bold tracking-widest text-slate-300 mt-4">
                       Protected by Secure Neural Layer v10.0
                    </p>
                  </div>
                </div>
              </ContentCard>
            )}

            {/* NEWS TAB */}
            {activeTab === 'news' && (
              <ContentCard title="Global Broadcasts" icon={Newspaper}>
                <div className="p-10">
                  <NewsManager />
                </div>
              </ContentCard>
            )}

            {/* Incidents Tab Removed - Now a separate page */}

            {/* SYSTEM CONFIG */}
            {activeTab === 'clients' && isSuperAdmin && (
              <ContentCard title="Client Protocol Config" icon={Settings}>
                <div className="p-10">
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
