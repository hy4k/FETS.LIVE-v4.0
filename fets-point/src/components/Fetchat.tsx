import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Send, Mic, Paperclip, X, Maximize2, Minimize2,
    ExternalLink, User, Search, MessageSquare,
    Clock, Check, CheckCheck, MoreVertical,
    Phone, Video, Smile, Info, Trash2, Zap, Image as ImageIcon, FileText, ChevronLeft,
    Minus, ArrowUpRight, Lock, Circle, CircleDashed, Slash
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'
import { AgentDossier } from './AgentDossier'

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
    type: 'text' | 'voice' | 'file' | 'image' | 'video'
    file_path?: string
    created_at: string
    read_at?: string
    status?: 'sent' | 'delivered' | 'seen' | 'deleted_for_me' | 'deleted_for_all'
}

interface FetchatProps {
    isDetached?: boolean
    onToggleDetach?: () => void
    onClose?: () => void
    activeUser?: StaffProfile | null
    onSelectUser?: (user: StaffProfile | null) => void

    onStartVideoCall?: (targetUserIds: string | string[], type?: 'video' | 'audio') => void
}

const COMMON_EMOJIS = [
    '👍', '👋', '😀', '😂', '😍', '🤔', '😎', '🔥', '✨', '🎉',
    '❤️', '✅', '❌', '👀', '🙌', '💼', '🚀', '💡', '🤖', '🤐'
]

// --- Retro UI Components ---
const ComicInput = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        {...props}
        className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-sm font-bold text-gray-800 placeholder-gray-400 outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
    />
)

const MessageStatus = ({ status }: { status?: string }) => {
    switch (status) {
        case 'sent':
            return (
                <div className="flex items-center" title="Sent (Accepted by system)">
                    <div className="w-2.5 h-2.5 rounded-full border border-black/40" />
                </div>
            );
        case 'delivered':
            return (
                <div className="flex items-center" title="Delivered to device">
                    <div className="w-2.5 h-2.5 rounded-full bg-black/40" />
                </div>
            );
        case 'seen':
            return (
                <div className="flex items-center" title="Seen">
                    <div className="w-2.5 h-2.5 rounded-full bg-black/80 flex items-center justify-center">
                        <div className="w-1 h-1 bg-white rounded-full" />
                    </div>
                </div>
            );
        case 'deleted_for_me':
            return (
                <div className="flex items-center opacity-40" title="Deleted for you">
                    <div className="w-3 h-3 rounded-full border border-black relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Slash size={10} className="text-black" />
                        </div>
                    </div>
                </div>
            );
        case 'deleted_for_all':
            return (
                <div className="flex items-center opacity-30" title="Deleted for both">
                    <div className="w-3.5 h-3.5 rounded-full bg-black/10 border border-black flex items-center justify-center relative">
                        <Lock size={8} className="text-black" />
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                </div>
            );
        default:
            return <div className="w-2.5 h-2.5 rounded-full border border-black/20" />;
    }
};

export const Fetchat: React.FC<FetchatProps> = ({
    isDetached = false,
    onToggleDetach,
    onClose,
    activeUser,
    onSelectUser,
    onStartVideoCall
}) => {
    const { profile, user } = useAuth()
    const [staff, setStaff] = useState<StaffProfile[]>([])

    // Internal state for selected user and view mode
    const [internalSelectedUser, setInternalSelectedUser] = useState<StaffProfile | null>(null)
    const [viewMode, setViewMode] = useState<'chat' | 'dossier'>('chat')

    // Derived selected user (either prop or internal)
    const selectedUser = activeUser !== undefined ? activeUser : internalSelectedUser

    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [presence, setPresence] = useState<Record<string, { status: string, last_seen: string }>>({})
    const [isLoading, setIsLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [attachment, setAttachment] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [activeConversation, setActiveConversation] = useState<any>(null)

    const scrollRef = useRef<HTMLDivElement>(null)
    const messageSubscription = useRef<any>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Helper: Select user and optionally mode
    const handleSelectUser = (u: StaffProfile | null, mode: 'chat' | 'dossier' = 'chat') => {
        if (onSelectUser) onSelectUser(u)
        else setInternalSelectedUser(u)
        setViewMode(mode)
    }

    // --- Effects ---
    useEffect(() => {
        const fetchStaff = async () => {
            const { data } = await supabase.from('staff_profiles').select('*').neq('user_id', user?.id)
            setStaff(data || [])
        }
        fetchStaff()
    }, [user?.id])

    // Presence
    useEffect(() => {
        if (!user?.id) return
        const channel = supabase.channel('online-staff', { config: { presence: { key: user.id } } })
        channel.on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState()
            const map: any = {}
            for (const key in state) { if (state[key].length > 0) map[key] = state[key][0] }
            setPresence(map)
        }).subscribe(async (status) => {
            if (status === 'SUBSCRIBED') await channel.track({ user_id: user.id, status: 'online' })
        })
        return () => { channel.unsubscribe() }
    }, [user?.id])

    // Load Chat (only if selectedUser AND viewMode is chat)
    useEffect(() => {
        if (!selectedUser || !user?.id) return

        const loadChat = async () => {
            setIsLoading(true)
            try {
                const { data: convId, error } = await supabase.rpc('get_or_create_conversation', { user_id_1: profile.id, user_id_2: selectedUser.id })
                if (error) throw error

                // Fetch conversation details to check if group
                const { data: conv } = await supabase.from('conversations').select('*, members:conversation_members(user_id)').eq('id', convId).single()
                setActiveConversation(conv)

                const { data: msgs } = await supabase.from('messages').select('*').eq('conversation_id', convId).order('created_at', { ascending: true })
                setMessages(msgs || [])

                if (messageSubscription.current) messageSubscription.current.unsubscribe()
                messageSubscription.current = supabase.channel(`chat:${convId}`)
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` },
                        payload => {
                            if (payload.eventType === 'INSERT') {
                                setMessages(prev => [...prev, payload.new as Message]);
                                // If I am the recipient and the chat is open, mark as seen
                                if (payload.new.sender_id !== profile.id) {
                                    supabase.from('messages').update({ status: 'seen' }).eq('id', payload.new.id).select().then();
                                }
                            } else if (payload.eventType === 'UPDATE') {
                                setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
                            }
                        })
                    .subscribe()

                // Mark unread as seen
                await supabase.from('messages')
                    .update({ status: 'seen' })
                    .eq('conversation_id', convId)
                    .neq('sender_id', profile.id)
                    .in('status', ['sent', 'delivered'])
            } catch (e) {
                console.error(e)
            } finally { setIsLoading(false) }
        }
        loadChat()
        return () => { if (messageSubscription.current) messageSubscription.current.unsubscribe() }
    }, [selectedUser, user?.id, profile.id])

    const handleStartCall = (type: 'video' | 'audio' = 'video') => {
        if (!onStartVideoCall || !selectedUser) return

        if (activeConversation?.is_group) {
            // Member IDs excluding current user
            const members = activeConversation.members
                .map((m: any) => m.user_id)
                .filter((id: string) => id !== user?.id)
            onStartVideoCall(members, type)
        } else {
            onStartVideoCall(selectedUser.user_id, type)
        }
    }

    const [isRecording, setIsRecording] = useState<'audio' | 'video' | null>(null)
    const [recordingTime, setRecordingTime] = useState(0)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<any>(null)

    // --- Recording Logic ---
    const startRecording = async (type: 'audio' | 'video') => {
        try {
            const constraints = type === 'audio' ? { audio: true } : { video: true, audio: true }
            const stream = await navigator.mediaDevices.getUserMedia(constraints)

            const recorder = new MediaRecorder(stream)
            mediaRecorderRef.current = recorder
            chunksRef.current = []

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            recorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: type === 'audio' ? 'audio/webm' : 'video/webm' })
                const file = new File([blob], `recording.${type === 'audio' ? 'webm' : 'webm'}`, { type: blob.type })

                const shouldAutoSend = (recorder as any)._autoSend !== false;

                // Stop all tracks
                stream.getTracks().forEach(track => {
                    track.stop();
                    track.enabled = false;
                })

                setIsRecording(null)
                setRecordingTime(0)
                clearInterval(timerRef.current)

                if (shouldAutoSend) {
                    setIsUploading(true);
                    try {
                        const ext = file.name.split('.').pop()
                        const path = `${profile.id}/${Date.now()}.${ext}`
                        await supabase.storage.from('chat-uploads').upload(path, file)
                        const { data } = supabase.storage.from('chat-uploads').getPublicUrl(path)
                        const url = data.publicUrl

                        const { data: convId } = await supabase.rpc('get_or_create_conversation', {
                            user_id_1: profile.id,
                            user_id_2: selectedUser?.id
                        })

                        await supabase.from('messages').insert({
                            conversation_id: convId,
                            sender_id: profile.id,
                            content: url,
                            type: type === 'audio' ? 'voice' : 'video',
                            file_path: file.name,
                            status: (selectedUser?.user_id && presence[selectedUser.user_id]?.status === 'online') ? 'delivered' : 'sent'
                        })
                        toast.success('Sent')
                    } catch (err) {
                        toast.error('Failed to send recording')
                        setAttachment(file) // Fallback to manual send
                    } finally {
                        setIsUploading(false)
                    }
                } else {
                    setAttachment(file)
                }
            }

            recorder.start()
            setIsRecording(type)

            // Timer
            setRecordingTime(0)
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    const next = prev + 1
                    // Limits: Audio 120s (2m), Video 60s (1m)
                    if ((type === 'audio' && next >= 120) || (type === 'video' && next >= 60)) {
                        stopRecording()
                        return next
                    }
                    return next
                })
            }, 1000)

        } catch (err) {
            console.error('Recording failed:', err)
            toast.error('Could not access media device')
        }
    }

    const stopRecording = (autoSend = true) => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            (mediaRecorderRef.current as any)._autoSend = autoSend;
            mediaRecorderRef.current.stop()
        }
    }

    const cancelRecording = () => {
        stopRecording(false)
    }

    // Effect to handle auto-sending after state updates if needed, 
    // but better to do it in onstop itself since we have the blob.

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if ((!newMessage.trim() && !attachment) || !selectedUser) return
        setIsUploading(true)
        try {
            let url = null
            let type = 'text'
            if (attachment) {
                const ext = attachment.name.split('.').pop()
                const path = `${profile.id}/${Date.now()}.${ext}`
                await supabase.storage.from('chat-uploads').upload(path, attachment)
                const { data } = supabase.storage.from('chat-uploads').getPublicUrl(path)
                url = data.publicUrl

                if (attachment.type.startsWith('image/')) type = 'image'
                else if (attachment.type.startsWith('audio/')) type = 'voice'
                else if (attachment.type.startsWith('video/')) type = 'video'
                else type = 'file'
            }

            const { data: convId } = await supabase.rpc('get_or_create_conversation', { user_id_1: profile.id, user_id_2: selectedUser.id })

            const isRecipientOnline = selectedUser?.user_id && presence[selectedUser.user_id]?.status === 'online';

            await supabase.from('messages').insert({
                conversation_id: convId,
                sender_id: profile.id,
                content: url || newMessage.trim(),
                type,
                file_path: attachment?.name,
                status: isRecipientOnline ? 'delivered' : 'sent'
            })

            setNewMessage('')
            setAttachment(null)
        } catch (err) {
            toast.error('Failed to send')
        } finally {
            setIsUploading(false)
        }
    }

    const handleDeleteMessage = async (msgId: string, forAll: boolean = false) => {
        try {
            if (forAll) {
                await supabase.from('messages').update({ status: 'deleted_for_all', content: 'Message deleted for everyone' }).eq('id', msgId)
                toast.success('Deleted for both')
            } else {
                await supabase.from('messages').update({ status: 'deleted_for_me' }).eq('id', msgId)
                toast.success('Deleted for you')
            }
        } catch (err) {
            toast.error('Delete failed')
        }
    }

    const filteredStaff = staff.filter(s => s.full_name.toLowerCase().includes(searchQuery.toLowerCase()))

    const containerStyle = isDetached
        ? "fixed bottom-8 right-8 w-[400px] h-[600px] z-[9999]"
        : "w-full h-full"

    return (
        <div className={`flex flex-col ${containerStyle} font-sans relative`}>

            {/* Header Window Bar */}
            <div className={`
                bg-[#f4d03f] border-2 border-black border-b-0 rounded-t-xl px-4 py-3 flex items-center justify-between shadow-[0_2px_0_0_rgba(0,0,0,1)] z-10
                ${isDetached ? 'cursor-move' : ''}
            `}>
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full border-2 border-black bg-[#ff6b6b]" />
                        <div className="w-3 h-3 rounded-full border-2 border-black bg-[#feca57]" />
                        <div className="w-3 h-3 rounded-full border-2 border-black bg-[#1dd1a1]" />
                    </div>
                    <span className="font-black text-sm uppercase tracking-widest text-black/80">
                        {isDetached ? 'FLOATING CHAT' : 'FETCHAT TERMINAL'}
                    </span>
                </div>
                <div className="flex gap-2">
                    {onToggleDetach && (
                        <button onClick={onToggleDetach} className="p-1 hover:bg-black/10 rounded border border-transparent hover:border-black transition-all">
                            {isDetached ? <Minus size={16} className="text-black" /> : <ExternalLink size={16} className="text-black" />}
                        </button>
                    )}
                    {isDetached && onClose && (
                        <button onClick={onClose} className="p-1 hover:bg-black/10 rounded border border-transparent hover:border-black transition-all">
                            <X size={16} className="text-black" />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className={`flex-1 flex bg-[#fdfbf7] border-2 border-t-0 border-black rounded-b-xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]`}>

                <div className={`
                    ${isDetached && selectedUser ? 'hidden' : 'flex'} 
                    ${!isDetached ? 'w-full md:w-[340px] border-r-2 border-black' : 'w-full'}
                    flex-col bg-[#fdfbf7]
                `}>
                    <div className="p-4 bg-[#f4e7c3] border-b-2 border-black">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input
                                className="w-full pl-10 pr-4 py-2 border-2 border-black rounded-lg text-sm font-bold bg-white outline-none focus:shadow-[2px_2px_0px_0px_black] transition-all"
                                placeholder="Search Agents..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50/50">
                        {filteredStaff.map(s => {
                            const isOnline = presence[s.user_id]?.status === 'online';
                            const isSelected = selectedUser?.id === s.id;

                            return (
                                <div
                                    key={s.id}
                                    className={`
                                        group relative p-3 rounded-2xl border-2 transition-all duration-300
                                        ${isSelected
                                            ? 'bg-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                            : 'bg-white border-gray-200 hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-full border-2 border-black bg-gray-200 overflow-hidden">
                                                {s.avatar_url ? <img src={s.avatar_url} className="w-full h-full object-cover" /> : <User className="p-3 w-full h-full text-gray-400" />}
                                            </div>
                                            {isOnline && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-sm text-gray-900 truncate">{s.full_name}</h4>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide truncate">{s.branch_assigned || 'Active Agent'}</p>

                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleSelectUser(s, 'chat'); }}
                                                    className="flex-1 py-1.5 px-3 bg-black text-white text-[10px] font-bold uppercase rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <MessageSquare size={12} /> Chat
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleSelectUser(s, 'dossier'); }}
                                                    className="flex-1 py-1.5 px-3 bg-gray-100 border border-gray-300 text-gray-700 text-[10px] font-bold uppercase rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <User size={12} /> Profile
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {selectedUser ? (
                    <div className={`
                        flex-1 flex flex-col relative bg-[#fff]
                        ${isDetached ? 'w-full' : 'hidden md:flex'}
                    `}>
                        {viewMode === 'dossier' ? (
                            <div className="flex-1 flex flex-col bg-slate-900 relative overflow-hidden">
                                <div className="absolute top-4 left-4 z-20">
                                    <button
                                        onClick={() => handleSelectUser(null)}
                                        className="p-2 bg-black/50 text-white rounded-full hover:bg-white/10 backdrop-blur-sm border border-white/10"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                </div>
                                <div className="flex-1 p-4 md:p-8 flex items-center justify-center">
                                    <div className="w-full h-full max-w-md mx-auto relative">
                                        <AgentDossier
                                            agent={{ ...selectedUser, is_online: presence[selectedUser.user_id]?.status === 'online' }}
                                            currentUserId={user?.id}
                                            onClose={() => setViewMode('chat')}
                                            onStartChat={() => setViewMode('chat')}
                                            embedded={true}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="p-3 border-b-2 border-black flex items-center justify-between bg-[#fdfbf7]">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => handleSelectUser(null)} className="md:hidden p-2 rounded-lg hover:bg-black/5"><ChevronLeft size={20} /></button>
                                        <div
                                            onClick={() => setViewMode('dossier')}
                                            className="w-8 h-8 rounded-full border-2 border-black overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                        >
                                            {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} className="w-full h-full object-cover" /> : <User className="p-1" />}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-sm uppercase cursor-pointer hover:underline" onClick={() => setViewMode('dossier')}>
                                                {selectedUser.full_name}
                                            </h3>
                                            <div className="flex items-center gap-1">
                                                <div className={`w-2 h-2 rounded-full ${presence[selectedUser.user_id]?.status === 'online' ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                <span className="text-[10px] font-bold text-gray-500 uppercase">{presence[selectedUser.user_id]?.status || 'OFFLINE'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {onStartVideoCall && (
                                            <>
                                                <button
                                                    onClick={() => handleStartCall('audio')}
                                                    disabled={presence[selectedUser.user_id]?.status !== 'online' && !activeConversation?.is_group}
                                                    className={`p-2 rounded-lg transition-colors ${(presence[selectedUser.user_id]?.status === 'online' || activeConversation?.is_group) ? 'bg-white border-2 border-black hover:bg-gray-50' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                                    title={(presence[selectedUser.user_id]?.status === 'online' || activeConversation?.is_group) ? "Start Audio Call" : "Agent Offline"}
                                                >
                                                    <Phone size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleStartCall('video')}
                                                    disabled={presence[selectedUser.user_id]?.status !== 'online' && !activeConversation?.is_group}
                                                    className={`p-2 rounded-lg transition-colors ${(presence[selectedUser.user_id]?.status === 'online' || activeConversation?.is_group) ? 'bg-[#f4d03f] hover:bg-[#ffe16b] text-black border-2 border-black shadow-[2px_2px_0px_0px_black]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                                    title={(presence[selectedUser.user_id]?.status === 'online' || activeConversation?.is_group) ? "Start Video Call" : "Agent Offline"}
                                                >
                                                    <Video size={18} />
                                                </button>
                                            </>
                                        )}

                                        <button
                                            onClick={() => setViewMode('dossier')}
                                            className="p-2 hover:bg-black/5 rounded-lg text-gray-500 hover:text-black transition-colors"
                                            title="View Agent Dossier"
                                        >
                                            <Info size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fdfbf7]" ref={scrollRef}>
                                    {messages.map(msg => {
                                        const isMe = msg.sender_id === user?.id
                                        return (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                key={msg.id}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`
                                                    max-w-[80%] p-3 rounded-2xl border-2 border-black relative
                                                    ${isMe
                                                        ? 'bg-[#f4d03f] shadow-[3px_3px_0px_0px_black] rounded-br-none'
                                                        : 'bg-white shadow-[3px_3px_0px_0px_#e5e7eb] rounded-bl-none'
                                                    }
                                                 `}>
                                                    {msg.status !== 'deleted_for_all' && (
                                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                            <button onClick={() => handleDeleteMessage(msg.id, false)} title="Delete for me" className="p-1 hover:bg-black/5 rounded text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                                                            {isMe && <button onClick={() => handleDeleteMessage(msg.id, true)} title="Delete for both" className="p-1 hover:bg-black/5 rounded text-gray-400 hover:text-red-500"><Lock size={12} /></button>}
                                                        </div>
                                                    )}

                                                    {msg.status === 'deleted_for_all' ? (
                                                        <p className="text-xs italic opacity-50 flex items-center gap-2">
                                                            <Lock size={10} /> Message deleted for both
                                                        </p>
                                                    ) : (
                                                        <>
                                                            {msg.type === 'text' && <p className="text-sm font-bold text-gray-800 whitespace-pre-wrap">{msg.content}</p>}
                                                            {msg.type === 'image' && <img src={msg.content} className="max-w-full rounded-lg border-2 border-black/10" />}
                                                            {msg.type === 'voice' && (
                                                                <div className="flex items-center gap-2 min-w-[200px]">
                                                                    <div className="p-2 bg-black rounded-full text-white"><Mic size={16} /></div>
                                                                    <audio src={msg.content} controls className="w-full h-8" />
                                                                </div>
                                                            )}
                                                            {msg.type === 'video' && (
                                                                <div className="min-w-[200px]">
                                                                    <video src={msg.content} controls className="w-full h-auto rounded-lg" />
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                    <div className="flex items-center justify-end gap-1.5 mt-1 border-t border-black/5 pt-1">
                                                        <span className="text-[9px] font-bold opacity-40">{format(new Date(msg.created_at), 'HH:mm')}</span>
                                                        {isMe && <MessageStatus status={msg.status} />}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>

                                <div className="p-3 bg-white border-t-2 border-black">
                                    {isRecording ? (
                                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border-2 border-red-200 animate-pulse">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                                                <span className="font-bold text-red-500 text-sm uppercase">
                                                    Recording {isRecording} ({recordingTime}s / {isRecording === 'audio' ? '120s' : '60s'})
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => stopRecording()} className="p-2 bg-red-500 text-white rounded-lg font-bold text-xs uppercase hover:bg-red-600 transition-colors">Stop & Send</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                                            <div className="flex gap-1">
                                                <button type="button" onClick={() => startRecording('audio')} className="p-3 rounded-xl border-2 border-transparent hover:border-black hover:bg-gray-100 transition-all text-gray-500 hover:text-black" title="Record Voice (Max 2m)">
                                                    <Mic size={18} />
                                                </button>
                                                <button type="button" onClick={() => startRecording('video')} className="p-3 rounded-xl border-2 border-transparent hover:border-black hover:bg-gray-100 transition-all text-gray-500 hover:text-black" title="Record Video Message (Max 1m)">
                                                    <Video size={18} />
                                                </button>
                                                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 rounded-xl border-2 border-transparent hover:border-black hover:bg-gray-100 transition-all text-gray-500 hover:text-black">
                                                    <Paperclip size={18} />
                                                </button>
                                            </div>

                                            <input type="file" ref={fileInputRef} className="hidden" onChange={e => { if (e.target.files?.[0]) setAttachment(e.target.files[0]) }} />

                                            <div className="flex-1 relative">
                                                {attachment && (
                                                    <div className="absolute bottom-full mb-2 left-0 right-0 bg-[#f4d03f] p-2 rounded-lg border-2 border-black flex justify-between items-center z-10">
                                                        <span className="text-xs font-bold truncate max-w-[80%]">{attachment.name}</span>
                                                        <button onClick={() => setAttachment(null)}><X size={14} /></button>
                                                    </div>
                                                )}
                                                <ComicInput
                                                    placeholder="Type a message..."
                                                    value={newMessage}
                                                    onChange={e => setNewMessage(e.target.value)}
                                                />
                                            </div>

                                            <button type="submit" disabled={isUploading} className="p-3 bg-black text-[#f4d03f] rounded-xl border-2 border-black hover:bg-gray-800 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                                                <Send size={18} fill="currentColor" />
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center bg-[#fdfbf7]">
                        <div className="relative mb-8">
                            <div className="w-40 h-40 bg-[#fff] rounded-full border-4 border-black flex items-center justify-center shadow-[12px_12px_0px_0px_#f4d03f] relative z-10">
                                <MessageSquare size={64} className="text-black" strokeWidth={1.5} />
                            </div>
                            <div className="absolute top-0 right-0 -mr-4 -mt-4 transform rotate-12 bg-black text-white px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border-2 border-[#f4d03f]">
                                Secure
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-black uppercase tracking-tight mb-3">Encrypted Comms</h2>
                        <p className="text-gray-500 font-bold max-w-sm text-sm leading-relaxed">
                            Select an agent from the roster to establish a secure uplink.
                            <br />
                            <span className="text-[#f4d03f] text-xs uppercase tracking-widest mt-2 block">Clearance Level Verified</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
