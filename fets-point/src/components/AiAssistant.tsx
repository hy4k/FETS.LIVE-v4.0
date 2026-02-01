import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, X, Sparkles, Terminal, Brain, Zap } from 'lucide-react'
import { askClaude } from '../lib/anthropic'
import { toast } from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'

export function AiAssistant() {
    const { profile } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    // Store chat history in state. Start with a greeting.
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
        { role: 'ai', content: "🚀 FETS OMNI Systems Online. I have complete temporal awareness - all past, present, and future data. How can I assist you?" }
    ])
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        if (isOpen) {
            scrollToBottom()
        }
    }, [messages, isOpen])

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!query.trim() || isLoading) return

        const userText = query
        setQuery('')
        setMessages(prev => [...prev, { role: 'user', content: userText }])
        setIsLoading(true)

        try {
            const response = await askClaude(userText, profile)
            setMessages(prev => [...prev, { role: 'ai', content: response || "I was unable to process that." }])
        } catch (error) {
            toast.error("Neural Link Unstable")
            setMessages(prev => [...prev, { role: 'ai', content: "Connection failure. My neural link is momentarily disrupted." }])
        } finally {
            setIsLoading(false)
        }
    }

    // Quick action handlers
    const quickActions = [
        { label: 'All Exams', action: () => setQuery('Show all exams conducted') },
        { label: 'Candidates', action: () => setQuery('How many candidates registered?') },
        { label: 'Future', action: () => setQuery('Future exam schedule') },
        { label: 'History', action: () => setQuery('Show historical data') },
    ]

    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-['Montserrat']">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="absolute bottom-20 right-0 w-[380px] h-[600px] bg-[#e0e5ec] rounded-[2rem] shadow-[20px_20px_40px_#bec3c9,-20px_-20px_40px_#ffffff] border border-white/50 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-white/40 flex justify-between items-center bg-[#e0e5ec] shadow-sm relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg flex items-center justify-center overflow-hidden">
                                    <Brain size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">FETS OMNI AI</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Temporal Live</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-500"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Quick Actions */}
                        <div className="px-4 py-2 bg-white/30 border-b border-white/40 flex gap-2 overflow-x-auto">
                            {quickActions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={action.action}
                                    className="flex-shrink-0 px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-700 text-[10px] font-bold uppercase tracking-wide rounded-lg transition-colors"
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#e0e5ec] custom-scrollbar">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[90%] p-4 rounded-2xl text-[12px] font-bold leading-relaxed shadow-sm ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-br-none ml-4'
                                            : 'bg-gradient-to-br from-slate-700 to-slate-900 text-white border border-slate-600/50 rounded-bl-none mr-4 shadow-lg'
                                        }`}>
                                        {msg.role === 'ai' && (
                                            <div className="mb-2 text-[8px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
                                                <Zap size={10} /> FETS OMNI
                                            </div>
                                        )}
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-[#e0e5ec] px-4 py-3 rounded-2xl border border-white shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] rounded-bl-none">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-0"></span>
                                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-300"></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-[#e0e5ec] border-t border-white/40">
                            <form onSubmit={handleSend} className="relative flex items-center">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Ask about past, present, or future..."
                                    className="w-full bg-[#e0e5ec] shadow-[inset_3px_3px_6px_#bec3c9,inset_-3px_-3px_6px_#ffffff] rounded-xl py-3 pl-4 pr-24 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 placeholder-slate-400 uppercase tracking-wide"
                                />
                                <div className="absolute right-2 flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setQuery('Show all vault documents')}
                                        className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-600 transition-colors"
                                        title="Vault"
                                    >
                                        <Sparkles size={14} />
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!query.trim() || isLoading}
                                        className="p-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg text-white shadow-md disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95"
                                    >
                                        <ArrowUp size={16} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button - Enhanced */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-16 h-16 rounded-2xl bg-[#e0e5ec] shadow-[8px_8px_16px_#bec3c9,-8px_-8px_16px_#ffffff] border border-white/50 flex items-center justify-center group overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-inner relative z-10 transition-transform duration-500 group-hover:scale-110 bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                    <Brain size={24} className="text-white" />
                </div>
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-2xl border-2 border-violet-500/30 group-hover:border-violet-500/60 transition-colors"></div>

                {/* Connection Status Dot */}
                <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,1)] animate-pulse"></div>
            </motion.button>
        </div>
    )
}
