import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Send, Mic, Paperclip, X, Maximize2, Minimize2,
    ExternalLink, User, Search, MessageSquare,
    Clock, Check, CheckCheck, MoreVertical,
    Phone, Video, Smile, Info, Trash2, Zap, Image as ImageIcon, FileText, ChevronLeft
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'

// --- Types ---
export interface StaffProfile {
    id: string
    user_id: string
    full_name: string
    avatar_url: string | null
    branch_assigned: string | null
    is_online?: boolean
    status?: string
}

interface Message {
    id: string
    conversation_id: string
    sender_id: string
    content: string
    type: 'text' | 'voice' | 'file' | 'image'
    file_path?: string
    created_at: string
    read_at?: string
}

interface FetchatProps {
    isDetached?: boolean
    onToggleDetach?: () => void
    onClose?: () => void
    // State persistence props
    activeUser?: StaffProfile | null
    onSelectUser?: (user: StaffProfile | null) => void
}

const COMMON_EMOJIS = [
    '👍', '👋', '😀', '😂', '😍', '🤔', '😎', '🔥', '✨', '🎉',
    '❤️', '✅', '❌', '👀', '🙌', '💼', '🚀', '💡', '🤖', '🤐',
    '😊', '😅', '🤣', '😭', '😡', '😱', '🥳', '🤯', '🤢', '🤮'
]

// --- Helper Components ---
const GlassInput = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="relative group">
        <input
            {...props}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white placeholder:text-white/20 outline-none focus:border-[#ffbf00]/50 transition-all"
        />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ffbf00]/10 to-transparent opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
    </div>
)

export const Fetchat: React.FC<FetchatProps> = ({
    isDetached = false,
    onToggleDetach,
    onClose,
    activeUser,
    onSelectUser
}) => {
    const { profile, user } = useAuth()
    const [staff, setStaff] = useState<StaffProfile[]>([])
    // Use internal state if no external state is provided
    const [internalSelectedUser, setInternalSelectedUser] = useState<StaffProfile | null>(null)
    const selectedUser = activeUser !== undefined ? activeUser : internalSelectedUser

    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [presence, setPresence] = useState<Record<string, { status: string, last_seen: string }>>({})
    const [isMinimized, setIsMinimized] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [hasNewMessage, setHasNewMessage] = useState(false)
    const [userActivity, setUserActivity] = useState<'online' | 'idle'>('online')
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [attachment, setAttachment] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    const scrollRef = useRef<HTMLDivElement>(null)
    const messageSubscription = useRef<any>(null)
    const activityTimeout = useRef<any>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUserSelection = (u: StaffProfile | null) => {
        if (onSelectUser) onSelectUser(u)
        else setInternalSelectedUser(u)
    }

    // --- Effects (Data Fetching & Realtime) ---
    useEffect(() => {
        const fetchStaff = async () => {
            const { data } = await supabase
                .from('staff_profiles')
                .select('id, user_id, full_name, avatar_url, branch_assigned')
                .neq('user_id', user?.id)
            setStaff(data || [])
        }
        fetchStaff()
    }, [user?.id])

    useEffect(() => {
        if (!user?.id) return
        const channel = supabase.channel('online-staff', { config: { presence: { key: user.id } } })

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState()
                const formattedPresence: Record<string, any> = {}
                Object.keys(state).forEach((key) => {
                    if (state[key].length > 0) formattedPresence[key] = state[key][0]
                })
                setPresence(formattedPresence)
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_id: user.id,
                        full_name: profile?.full_name,
                        status: userActivity,
                        last_seen: new Date().toISOString()
                    })
                }
            })

        const resetActivity = () => {
            setUserActivity('online')
            if (activityTimeout.current) clearTimeout(activityTimeout.current)
            activityTimeout.current = setTimeout(() => setUserActivity('idle'), 300000)
        }

        window.addEventListener('mousemove', resetActivity)
        window.addEventListener('keypress', resetActivity)
        resetActivity()

        return () => {
            channel.unsubscribe()
            window.removeEventListener('mousemove', resetActivity)
            window.removeEventListener('keypress', resetActivity)
            if (activityTimeout.current) clearTimeout(activityTimeout.current)
        }
    }, [user?.id, profile?.full_name, userActivity])

    useEffect(() => {
        const updateChannelStatus = async () => {
            const channel = supabase.getChannels().find(c => c.topic === 'online-staff')
            if (channel && user?.id) {
                await channel.track({
                    user_id: user.id,
                    full_name: profile?.full_name,
                    status: userActivity,
                    last_seen: new Date().toISOString()
                })
            }
        }
        updateChannelStatus()
    }, [userActivity, profile?.full_name, user?.id])

    useEffect(() => {
        if (!selectedUser || !user?.id) return
        const loadChat = async () => {
            setIsLoading(true)
            try {
                const { data: convId, error: convError } = await supabase.rpc('get_or_create_conversation', {
                    user_id_1: profile.id,
                    user_id_2: selectedUser.id
                })
                if (convError) throw convError

                const { data: msgData } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', convId)
                    .order('created_at', { ascending: true })
                setMessages(msgData || [])

                if (messageSubscription.current) messageSubscription.current.unsubscribe()

                messageSubscription.current = supabase
                    .channel(`chat:${convId}`)
                    .on('postgres_changes', {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `conversation_id=eq.${convId}`
                    }, (payload) => {
                        setMessages(prev => [...prev, payload.new as Message])
                        if (isMinimized) setHasNewMessage(true)
                    })
                    .subscribe()
            } catch (err) {
                console.error(err)
                toast.error('Connection Failed')
            } finally {
                setIsLoading(false)
            }
        }
        loadChat()
        return () => { if (messageSubscription.current) messageSubscription.current.unsubscribe() }
    }, [selectedUser, user?.id, profile?.id, isMinimized])

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, [messages, attachment]) // Also scroll when attachment preview appears

    // --- Actions ---
    const handleFileUpload = async (file: File): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
            const filePath = `${profile?.id}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('chat-uploads')
                .upload(filePath, file)

            if (uploadError) {
                console.error('Upload Error:', uploadError)
                throw new Error(`Upload failed: ${uploadError.message}`)
            }

            const { data } = supabase.storage.from('chat-uploads').getPublicUrl(filePath)
            return data.publicUrl
        } catch (error: any) {
            toast.error(error.message)
            return null
        }
    }

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if ((!newMessage.trim() && !attachment) || !selectedUser || !profile) return

        setIsUploading(true)
        try {
            // 1. Upload Attachment if exists
            let attachmentUrl: string | null = null
            let msgType: 'text' | 'image' | 'file' = 'text'

            if (attachment) {
                attachmentUrl = await handleFileUpload(attachment)
                if (!attachmentUrl) {
                    setIsUploading(false)
                    return // Stop if upload failed
                }
                msgType = attachment.type.startsWith('image/') ? 'image' : 'file'
            }

            // 2. Get/Create Conversation
            const { data: convId, error: convError } = await supabase.rpc('get_or_create_conversation', {
                user_id_1: profile.id,
                user_id_2: selectedUser.id
            })
            if (convError) throw convError

            // 3. Send Message
            const { error } = await supabase.from('messages').insert([{
                conversation_id: convId,
                sender_id: profile.id,
                content: attachmentUrl || newMessage.trim(), // If attachment, content is URL
                type: msgType,
                file_path: attachmentUrl ? attachment.name : undefined // Optional metadata
            }])

            if (error) throw error

            // 4. Cleanup
            setNewMessage('')
            setAttachment(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
            setShowEmojiPicker(false)

        } catch (err: any) {
            toast.error('Transmission Failed')
            console.error(err)
        } finally {
            setIsUploading(false)
        }
    }

    const getStatusColor = (userId: string) => {
        const userPresence = presence[userId]
        if (!userPresence) return 'bg-white/20'
        if (userPresence.status === 'online') return 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
        if (userPresence.status === 'idle') return 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
        return 'bg-white/20'
    }

    const filteredStaff = staff.filter(s =>
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.branch_assigned?.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    // --- Render ---

    if (isMinimized && !isDetached) {
        return (
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                onClick={() => { setIsMinimized(false); setHasNewMessage(false) }}
                className={`fixed bottom-6 right-8 cursor-pointer z-50`}
            >
                <div className={`
                    flex items-center gap-3 px-6 py-3 rounded-full 
                    bg-black/80 backdrop-blur-xl border border-[#ffbf00]/30 
                    shadow-[0_0_30px_rgba(0,0,0,0.5)]
                    hover:border-[#ffbf00] transition-colors
                    ${hasNewMessage ? 'animate-bounce border-emerald-500 shadow-emerald-500/30' : ''}
                `}>
                    <div className="relative">
                        <MessageSquare size={20} className="text-[#ffbf00]" />
                        {hasNewMessage && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />}
                    </div>
                    <span className="font-black text-xs text-white uppercase tracking-[0.2em]">FETCHAT</span>
                </div>
            </motion.div>
        )
    }

    // Determine container classes based on detached state
    const containerClasses = isDetached
        ? 'fixed bottom-8 right-8 w-[400px] h-[650px] z-[9999] ring-1 ring-[#ffbf00]/20'
        : 'w-full h-full'

    return (
        <div className={`
            flex flex-col bg-[#0a0a0f] rounded-3xl overflow-hidden relative
            border border-white/10 shadow-2xl
            ${containerClasses}
        `}>
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#0a0a0f] to-black pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ffbf00]/50 to-transparent z-20" />

            {/* Header */}
            <div className="relative z-10 px-4 py-3 bg-black/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#ffbf00]/10 border border-[#ffbf00]/20">
                        <MessageSquare size={18} className="text-[#ffbf00]" />
                    </div>
                    <div>
                        <h3 className="font-black text-xs text-white uppercase tracking-[0.2em]">FETCHAT v4.0</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-bold text-emerald-500/70 uppercase tracking-widest">
                                Secure {selectedUser ? '> ' + selectedUser.full_name.split(' ')[0] : 'Grid'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {onToggleDetach && (
                        <button onClick={onToggleDetach} className="p-2 text-white/30 hover:text-white/80 transition-colors">
                            {isDetached ? <Minimize2 size={16} /> : <ExternalLink size={16} />}
                        </button>
                    )}
                    <button onClick={isDetached ? onClose : () => setIsMinimized(true)} className="p-2 text-white/30 hover:text-rose-400 transition-colors">
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 relative z-10">
                {selectedUser ? (
                    // --- ACTIVE CHAT VIEW ---
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
                            {/* Back Button (Mobile/Small) or just context */}
                            <button
                                onClick={() => handleUserSelection(null)}
                                className="flex items-center gap-2 text-[10px] font-bold text-white/30 hover:text-[#ffbf00] uppercase tracking-widest mb-4 transition-colors"
                            >
                                <ChevronLeft size={12} /> Return to Agents
                            </button>

                            {messages.length === 0 && (
                                <div className="text-center py-10 opacity-30">
                                    <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                                        <Zap size={24} className="text-[#ffbf00]" />
                                    </div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Encrypted Channel Open</p>
                                </div>
                            )}

                            {messages.map((msg) => {
                                const isMe = msg.sender_id === profile?.id
                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`
                                            max-w-[85%] rounded-2xl px-4 py-3 relative border
                                            ${isMe
                                                ? 'bg-[#ffbf00]/10 border-[#ffbf00]/20 text-white rounded-tr-sm'
                                                : 'bg-white/5 border-white/10 text-white/80 rounded-tl-sm'
                                            }
                                        `}>
                                            {/* File/Image Content */}
                                            {msg.type === 'image' && (
                                                <div className="mb-2 rounded-lg overflow-hidden border border-white/10">
                                                    <img src={msg.content} alt="attachment" className="max-w-full h-auto object-cover" />
                                                </div>
                                            )}
                                            {msg.type === 'file' && (
                                                <a href={msg.content} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-black/20 rounded-xl mb-2 hover:bg-black/40 transition-colors group">
                                                    <div className="p-2 bg-white/10 rounded-lg group-hover:bg-[#ffbf00] group-hover:text-black transition-colors">
                                                        <FileText size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-white uppercase truncate max-w-[150px]">{msg.file_path || "Attachment"}</p>
                                                        <p className="text-[9px] text-white/40 font-mono">DOWNLOAD</p>
                                                    </div>
                                                </a>
                                            )}

                                            {/* Text Content */}
                                            {(msg.type === 'text' || (msg.content && !msg.content.startsWith('http'))) && (
                                                <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                            )}

                                            <div className="flex items-center justify-end gap-1.5 mt-1 opacity-50">
                                                <span className="text-[9px] font-mono">{format(new Date(msg.created_at), 'HH:mm')}</span>
                                                {isMe && <CheckCheck size={10} className="text-[#ffbf00]" />}
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-black/40 backdrop-blur-xl border-t border-white/10">
                            {/* Attachment Preview */}
                            <AnimatePresence>
                                {attachment && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-b border-white/10 mb-2 pb-2"
                                    >
                                        <div className="flex items-center justify-between p-2 bg-[#ffbf00]/10 rounded-lg border border-[#ffbf00]/20">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                {attachment.type.startsWith('image/') ? <ImageIcon size={14} className="text-[#ffbf00]" /> : <FileText size={14} className="text-[#ffbf00]" />}
                                                <span className="text-[10px] font-bold text-white uppercase truncate">{attachment.name}</span>
                                            </div>
                                            <button onClick={() => setAttachment(null)} className="p-1 hover:bg-white/10 rounded-full text-white/50 hover:text-white">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                                {/* Emoji Picker Popover */}
                                <AnimatePresence>
                                    {showEmojiPicker && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                            className="absolute bottom-16 left-0 w-64 p-3 bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl z-50 grid grid-cols-6 gap-1"
                                        >
                                            {COMMON_EMOJIS.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={() => {
                                                        setNewMessage(prev => prev + emoji)
                                                        // Optional: don't close picker for multi-selection
                                                    }}
                                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-lg flex items-center justify-center"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                            <div className="absolute -bottom-2 left-6 w-4 h-4 bg-[#1a1a2e] border-b border-r border-white/10 rotate-45" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className={`p-3 rounded-xl border transition-all ${showEmojiPicker ? 'bg-[#ffbf00]/20 border-[#ffbf00] text-[#ffbf00]' : 'bg-white/5 border-white/5 text-white/50 hover:text-white'}`}
                                >
                                    <Smile size={18} />
                                </button>

                                <div className="relative group">
                                    <button
                                        type="button"
                                        className={`p-3 rounded-xl border transition-all ${attachment ? 'bg-[#ffbf00]/20 border-[#ffbf00] text-[#ffbf00]' : 'bg-white/5 border-white/5 text-white/50 hover:text-white'}`}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Paperclip size={18} />
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) setAttachment(e.target.files[0])
                                        }}
                                    />
                                </div>

                                <div className="flex-1">
                                    <GlassInput
                                        placeholder={isUploading ? "Uploading Secure Data..." : "Transmit Message..."}
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        disabled={isUploading}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isUploading || (!newMessage.trim() && !attachment)}
                                    className="p-3 bg-gradient-to-br from-[#ffbf00] to-[#ff9500] text-black rounded-xl shadow-[0_0_20px_rgba(255,191,0,0.3)] hover:shadow-[0_0_30px_rgba(255,191,0,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUploading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Send size={18} />}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    // --- USER LIST VIEW ---
                    <>
                        {/* Search */}
                        <div className="px-4 pb-2">
                            <GlassInput
                                placeholder="Scan Active Agents..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Agent Grid */}
                        <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
                            <div className="grid grid-cols-1 gap-2">
                                {filteredStaff.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => handleUserSelection(s)}
                                        className="group relative flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-left"
                                    >
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/40">
                                                {s.avatar_url ? (
                                                    <img src={s.avatar_url} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/20"><User size={16} /></div>
                                                )}
                                            </div>
                                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#1a1a2e] ${getStatusColor(s.user_id)}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-bold text-white/90 uppercase tracking-wide truncate group-hover:text-[#ffbf00] transition-colors">{s.full_name}</h4>
                                            <p className="text-[9px] font-medium text-white/40 uppercase tracking-widest truncate">
                                                {s.branch_assigned || 'Unassigned'}
                                            </p>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Zap size={14} className="text-[#ffbf00]" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
