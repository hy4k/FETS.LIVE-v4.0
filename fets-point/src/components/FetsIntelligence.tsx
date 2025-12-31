import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Zap, Search, Newspaper, Activity,
  User, LogOut, ArrowRight, X, Sparkles,
  Maximize2, UserCog, Shield, Building2,
  LayoutDashboard, Menu, ChevronRight,
  Terminal, Database, Radio, Bell, Globe, CPU, BarChart3
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
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

// --- Sidebar Button Component ---
const SidebarButton = ({
  icon: Icon,
  label,
  isActive,
  onClick,
  color = "amber"
}: {
  icon: React.ElementType,
  label: string,
  isActive: boolean,
  onClick: () => void,
  color?: string
}) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 8 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-500 group overflow-hidden
        ${isActive
          ? 'bg-[#e0e5ec] shadow-[inset_6px_6px_12px_#bec3c9,inset_-6px_-6px_12px_#ffffff] border border-white/50'
          : 'hover:bg-white/50 border border-transparent'
        }
      `}
    >
      <div className={`
        p-3 rounded-xl transition-all duration-700 relative z-10
        ${isActive
          ? `bg-gradient-to-br from-${color}-500 to-${color}-700 text-white shadow-lg rotate-[360deg]`
          : `bg-[#e0e5ec] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] text-slate-400 group-hover:text-${color}-600 group-hover:shadow-md`
        }
      `}>
        <Icon size={18} />
      </div>

      <span className={`
        text-[11px] font-black uppercase tracking-[0.2em] transition-all font-['Montserrat'] relative z-10
        ${isActive ? 'text-slate-800 translate-x-1' : 'text-slate-500 group-hover:text-slate-700'}
      `}>
        {label}
      </span>

      {isActive && (
        <motion.div
          layoutId="active-indicator"
          className={`ml-auto w-1.5 h-1.5 rounded-full bg-${color}-500 shadow-[0_0_15px_rgba(245,158,11,0.8)]`}
        />
      )}
    </motion.button>
  )
}

// --- Main Content Wrapper ---
const ContentPanel = ({ id, icon: Icon, title, subtitle, children, color = "indigo" }: { id: string, icon: any, title: string, subtitle: string, children: React.ReactNode, color?: string }) => {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex-1 flex flex-col h-full overflow-hidden"
    >
      <div className="flex items-center gap-6 mb-8 px-2">
        <div className="relative">
          <div className={`absolute inset-0 bg-${color}-500 blur-2xl opacity-20 animate-pulse`} />
          <div className={`relative p-5 rounded-3xl bg-[#e0e5ec] shadow-[8px_8px_16px_#bec3c9,-8px_-8px_16px_#ffffff] border border-white/60 text-${color}-600`}>
            <Icon size={32} />
          </div>
        </div>
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">{title}</h2>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-['Montserrat']">{subtitle}</p>
            <div className={`w-8 h-px bg-${color}-500 opacity-30`} />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-[#e0e5ec] rounded-[3.5rem] shadow-[20px_20px_60px_#bec3c9,-20px_-20px_60px_#ffffff] border border-white/40 overflow-hidden relative">
        <div className="h-full overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </motion.div>
  )
}

// --- MAIN COMPONENT ---

export function FetsIntelligence() {
  const { profile } = useAuth()
  const [activeSection, setActiveSection] = useState<string>('intelligence')

  // Intelligence States
  const [searchQuery, setSearchQuery] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isAiLoading, setIsAiLoading] = useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handlers
  const handleSendMessage = async (query: string) => {
    if (!query.trim()) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setIsAiLoading(true)

    try {
      const response = await askGemini(query)
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || "I couldn't process that request.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (error) {
      toast.error('Intelligence Module Offline')
    } finally {
      setIsAiLoading(false)
    }
  }

  const isSuperAdmin = profile?.role === 'super_admin' || profile?.email === 'mithun@fets.in';

  return (
    <div className="min-h-screen -mt-32 pt-32 bg-[#e0e5ec] flex flex-col h-screen overflow-hidden font-['Montserrat']">

      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none opacity-40 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-200 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-200 blur-[100px] rounded-full animate-pulse delay-75" />
      </div>

      <div className="flex-1 flex gap-10 p-8 md:p-12 relative z-10 min-h-0">

        {/* Sidebar Terminal Navigation */}
        <aside className="w-85 flex flex-col h-full bg-[#e0e5ec] p-8 rounded-[3.5rem] shadow-[20px_20px_60px_#bec3c9,-20px_-20px_60px_#ffffff] border border-white/40">

          <div className="mb-12 px-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-3 w-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-800">Operational Grid</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-none italic">
              Intelligence <span className="text-indigo-600">Core</span>
            </h2>
          </div>

          <nav className="flex-1 flex flex-col gap-10 overflow-y-auto no-scrollbar">
            {/* Mission Group */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-4">
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Mission Parameters</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="space-y-3 px-2">
                <SidebarButton
                  icon={Brain}
                  label="Neural AI Core"
                  isActive={activeSection === 'intelligence'}
                  onClick={() => setActiveSection('intelligence')}
                  color="indigo"
                />
                <SidebarButton
                  icon={Newspaper}
                  label="News Terminal"
                  isActive={activeSection === 'news'}
                  onClick={() => setActiveSection('news')}
                  color="emerald"
                />
                <SidebarButton
                  icon={Shield}
                  label="Incident Control"
                  isActive={activeSection === 'incidents'}
                  onClick={() => setActiveSection('incidents')}
                  color="rose"
                />
              </div>
            </div>

            {/* Elite Authorization Group */}
            {isSuperAdmin && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 px-4 pt-4">
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Elite Protocols</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="space-y-3 px-2">
                  <SidebarButton
                    icon={UserCog}
                    label="Personnel Control"
                    isActive={activeSection === 'users'}
                    onClick={() => setActiveSection('users')}
                    color="blue"
                  />
                  <SidebarButton
                    icon={Building2}
                    label="Client Master"
                    isActive={activeSection === 'clients'}
                    onClick={() => setActiveSection('clients')}
                    color="purple"
                  />
                </div>
              </div>
            )}
          </nav>

          {/* System Integrity Footer */}
          <div className="mt-auto pt-8 border-t border-white/20">
            <div className="p-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] flex items-center gap-4">
              <div className="relative h-10 w-10 flex items-center justify-center bg-[#e0e5ec] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] rounded-xl text-emerald-500">
                <CPU size={20} className="animate-spin duration-3000" />
              </div>
              <div>
                <div className="text-[9px] font-black text-slate-800 uppercase tracking-widest leading-none mb-1">Grid Sync: OK</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Status: Nominal</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Dynamic Operational Display */}
        <main className="flex-1 min-w-0 h-full">
          <AnimatePresence mode="wait">

            {/* Neural AI Interface */}
            {activeSection === 'intelligence' && (
              <ContentPanel
                id="intelligence"
                icon={Brain}
                title="Neural Engine"
                subtitle="Advanced Data Synthesis & Analysis"
                color="indigo"
              >
                <div className="flex flex-col h-full gap-8 p-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 shrink-0">
                    {[
                      { icon: Database, label: 'Data Latency', value: '14ms', color: 'emerald', trend: '-2ms' },
                      { icon: Radio, label: 'Neural Link', value: 'Synced', color: 'indigo', trend: 'Lvl 4' },
                      { icon: BarChart3, label: 'Compute Load', value: '2.4TF', color: 'amber', trend: 'Stable' }
                    ].map((stat, i) => (
                      <div key={i} className="bg-[#e0e5ec] p-6 rounded-3xl shadow-[8px_8px_16px_#bec3c9,-8px_-8px_16px_#ffffff] border border-white/40">
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-3 rounded-2xl bg-[#e0e5ec] shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff] text-${stat.color}-600`}>
                            <stat.icon size={20} />
                          </div>
                          <span className={`text-[9px] font-black uppercase text-${stat.color}-600 px-2 py-1 bg-${stat.color}-500/10 rounded-lg`}>{stat.trend}</span>
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
                        <div className="text-2xl font-black text-slate-800 italic uppercase">{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 flex flex-col bg-[#e0e5ec] rounded-[3rem] shadow-[inset_12px_12px_24px_#bec3c9,inset_-12px_-12px_24px_#ffffff] border border-white/40 overflow-hidden relative min-h-0">
                    {/* Neural Message Stream */}
                    <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                      {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-30">
                          <div className="p-8 rounded-full bg-[#e0e5ec] shadow-[8px_8px_16px_#bec3c9,-8px_-8px_16px_#ffffff] border border-white/60 mb-6 text-indigo-500 animate-pulse">
                            <Sparkles size={64} />
                          </div>
                          <p className="font-black uppercase tracking-[0.4em] text-[10px] text-center">Neural Stream Standby<br />Initiate Operational Query</p>
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`
                                max-w-[80%] p-8 rounded-[2.5rem] text-[13px] font-bold leading-relaxed shadow-lg
                                ${msg.role === 'user'
                                  ? 'bg-[#1a1f2c] text-white rounded-tr-none'
                                  : 'bg-[#e0e5ec] text-slate-800 rounded-tl-none border border-white shadow-[8px_8px_16px_#bec3c9,-4px_-4px_16px_#ffffff]'
                                }
                              `}
                            >
                              {msg.content}
                              <div className={`text-[8px] font-black mt-4 opacity-40 uppercase tracking-[0.2em] ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-500'}`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • MISSION_LOG
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                      {isAiLoading && (
                        <div className="flex justify-start">
                          <div className="bg-[#e0e5ec] p-6 rounded-3xl rounded-tl-none border border-white shadow-md flex items-center gap-3">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Command Input Sequence */}
                    <div className="p-8 bg-[#e0e5ec]/60 backdrop-blur-md border-t border-white/60">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          handleSendMessage(searchQuery)
                          setSearchQuery('')
                        }}
                        className="relative flex items-center gap-6"
                      >
                        <div className="flex-1 relative group">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Type operational command..."
                            className="w-full bg-[#e0e5ec] border-none rounded-3xl py-6 pl-10 pr-20
                              shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff]
                              focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-bold uppercase text-[11px] tracking-widest placeholder-slate-400"
                          />
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3 pointer-events-none">
                            <div className="h-6 w-px bg-slate-300" />
                            <Terminal size={14} className="text-slate-400" />
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={!searchQuery.trim() || isAiLoading}
                          className="p-6 bg-[#1a1f2c] text-white rounded-[1.5rem] shadow-xl 
                            disabled:opacity-50 disabled:grayscale hover:scale-105 active:scale-95 transition-all"
                        >
                          <ArrowRight size={28} />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </ContentPanel>
            )}

            {/* Operational News Room */}
            {activeSection === 'news' && (
              <ContentPanel
                id="news"
                icon={Newspaper}
                title="Broadcast Center"
                subtitle="High-Priority Personnel Notifications"
                color="emerald"
              >
                <div className="p-10">
                  <NewsManager />
                </div>
              </ContentPanel>
            )}

            {/* Incident Command Module */}
            {activeSection === 'incidents' && (
              <ContentPanel
                id="incidents"
                icon={Shield}
                title="Response Terminal"
                subtitle="Real-time Failure Interception & Mitigation"
                color="rose"
              >
                <div className="p-10">
                  <IncidentManager />
                </div>
              </ContentPanel>
            )}

            {/* Elite Personnel Control */}
            {activeSection === 'users' && isSuperAdmin && (
              <ContentPanel
                id="users"
                icon={UserCog}
                title="Personnel Matrix"
                subtitle="Master Access Credentials & Roles"
                color="blue"
              >
                <div className="p-10">
                  <UserManagement />
                </div>
              </ContentPanel>
            )}

            {/* Global Client Protocols */}
            {activeSection === 'clients' && isSuperAdmin && (
              <ContentPanel
                id="clients"
                icon={Building2}
                title="Protocol Control"
                subtitle="Client Master Integration Framework"
                color="purple"
              >
                <div className="p-10">
                  <ClientControl />
                </div>
              </ContentPanel>
            )}
          </AnimatePresence>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #bec3c9;
          border-radius: 20px;
          border: 2px solid #e0e5ec;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a3aab1;
        }
        @keyframes duration-3000 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin.duration-3000 {
          animation: duration-3000 8s linear infinite;
        }
      `}</style>
    </div>
  )
}
