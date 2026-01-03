import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, X, Sparkles, Terminal } from 'lucide-react'
import { askGemini } from '../lib/gemini'
import { toast } from 'react-hot-toast'

export function AiAssistant() {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    // Store chat history in state. Start with a greeting.
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
        { role: 'ai', content: "Systems Online. I am FETS Intelligence. How can I assist you with the grid today?" }
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
            const response = await askGemini(userText)
            setMessages(prev => [...prev, { role: 'ai', content: response || "I was unable to process that." }])
        } catch (error) {
            toast.error("Neural Link Unstable")
            setMessages(prev => [...prev, { role: 'ai', content: "Connection failure. My neural link is momentarily disrupted." }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-['Montserrat']">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="absolute bottom-20 right-0 w-[380px] h-[550px] bg-[#e0e5ec] rounded-[2rem] shadow-[20px_20px_40px_#bec3c9,-20px_-20px_40px_#ffffff] border border-white/50 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-white/40 flex justify-between items-center bg-[#e0e5ec] shadow-sm relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#e0e5ec] shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff] p-1.5 overflow-hidden border border-white/50">
                                    <img src="/fets-ai.png" alt="AI" className="w-full h-full object-cover rounded-full" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">FETS Intelligence</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Online</span>
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

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#e0e5ec] custom-scrollbar">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-bold leading-relaxed shadow-sm ${msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-br-none ml-8'
                                            : 'bg-[#e0e5ec] text-slate-700 border border-white rounded-bl-none mr-8 shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff]'
                                        }`}>
                                        {msg.role === 'ai' && (
                                            <div className="mb-1 text-[8px] font-black uppercase tracking-widest text-indigo-400/80 flex items-center gap-1">
                                                <Sparkles size={8} /> Neural Core
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
                                            <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce delay-0"></span>
                                            <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                                            <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce delay-300"></span>
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
                                    placeholder="Type operational command..."
                                    className="w-full bg-[#e0e5ec] shadow-[inset_3px_3px_6px_#bec3c9,inset_-3px_-3px_6px_#ffffff] rounded-xl py-3 pl-4 pr-12 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 placeholder-slate-400 uppercase tracking-wide"
                                />
                                <button
                                    type="submit"
                                    disabled={!query.trim() || isLoading}
                                    className="absolute right-2 p-1.5 bg-indigo-600 rounded-lg text-white shadow-md disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95"
                                >
                                    <ArrowUp size={16} />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-16 h-16 rounded-2xl bg-[#e0e5ec] shadow-[8px_8px_16px_#bec3c9,-8px_-8px_16px_#ffffff] border border-white/50 flex items-center justify-center group overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-inner relative z-10 transition-transform duration-500 group-hover:rotate-[360deg]">
                    <img src="/fets-ai.png" alt="AI" className="w-full h-full object-cover" />
                </div>
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-2xl border-2 border-indigo-500/20 group-hover:border-indigo-500/50 transition-colors"></div>

                {/* Connection Status Dot */}
                <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
            </motion.button>
        </div>
    )
}
