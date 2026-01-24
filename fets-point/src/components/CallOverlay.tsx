import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Phone, PhoneOff, Mic, MicOff, Video, VideoOff,
    Maximize2, Minimize2, User
} from 'lucide-react'

interface CallOverlayProps {
    status: 'calling' | 'ringing' | 'connected'
    isVideo: boolean
    isMuted: boolean
    isVideoOff: boolean
    remoteUserName: string
    localVideoRef: React.RefObject<HTMLVideoElement>
    remoteVideoRef: React.RefObject<HTMLVideoElement>
    onEndCall: () => void
    onToggleMute: () => void
    onToggleVideo: () => void
}

export const CallOverlay: React.FC<CallOverlayProps> = ({
    status,
    isVideo,
    isMuted,
    isVideoOff,
    remoteUserName,
    localVideoRef,
    remoteVideoRef,
    onEndCall,
    onToggleMute,
    onToggleVideo
}) => {
    const [callDuration, setCallDuration] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)

    useEffect(() => {
        if (status !== 'connected') {
            setCallDuration(0)
            return
        }

        const timer = setInterval(() => {
            setCallDuration(prev => prev + 1)
        }, 1000)

        return () => clearInterval(timer)
    }, [status])

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-[9999] flex flex-col ${
                isFullscreen ? '' : 'p-4'
            }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white/80 font-bold text-sm uppercase tracking-widest">
                        {status === 'calling' && 'Calling...'}
                        {status === 'ringing' && 'Connecting...'}
                        {status === 'connected' && `LIVE • ${formatDuration(callDuration)}`}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-amber-500 text-black text-[10px] font-black uppercase rounded-full">
                        FETSCHAT SECURE
                    </span>
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2 text-white/60 hover:text-white transition-colors"
                    >
                        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                </div>
            </div>

            {/* Video Area */}
            <div className="flex-1 relative flex items-center justify-center">
                {isVideo ? (
                    <>
                        {/* Remote Video (Main) */}
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover rounded-2xl"
                        />

                        {/* Local Video (PIP) */}
                        <motion.div
                            drag
                            dragMomentum={false}
                            className="absolute bottom-4 right-4 w-40 h-28 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl"
                        >
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover ${isVideoOff ? 'opacity-0' : ''}`}
                            />
                            {isVideoOff && (
                                <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                                    <VideoOff className="text-white/40" size={24} />
                                </div>
                            )}
                        </motion.div>
                    </>
                ) : (
                    /* Audio Call UI */
                    <div className="flex flex-col items-center gap-6">
                        <motion.div
                            animate={{ scale: status === 'connected' ? [1, 1.1, 1] : 1 }}
                            transition={{ repeat: status === 'connected' ? Infinity : 0, duration: 2 }}
                            className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center border-4 border-white/20 shadow-2xl"
                        >
                            <User size={56} className="text-white" />
                        </motion.div>
                        <div className="text-center">
                            <h2 className="text-3xl font-black text-white mb-2">{remoteUserName}</h2>
                            <p className="text-white/60 text-sm font-medium">
                                {status === 'calling' && 'Calling...'}
                                {status === 'ringing' && 'Ringing...'}
                                {status === 'connected' && formatDuration(callDuration)}
                            </p>
                        </div>

                        {/* Audio Visualizer Placeholder */}
                        {status === 'connected' && (
                            <div className="flex items-center gap-1 mt-4">
                                {[...Array(12)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ 
                                            height: [8, Math.random() * 32 + 8, 8],
                                        }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 0.5 + Math.random() * 0.5,
                                            delay: i * 0.05
                                        }}
                                        className="w-1.5 bg-amber-400 rounded-full"
                                        style={{ height: 8 }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="p-6 flex items-center justify-center gap-4">
                {/* Mute Button */}
                <button
                    onClick={onToggleMute}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                        isMuted 
                            ? 'bg-rose-500 text-white' 
                            : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                {/* End Call Button */}
                <button
                    onClick={onEndCall}
                    className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg hover:bg-rose-700 transition-all hover:scale-105"
                >
                    <PhoneOff size={28} />
                </button>

                {/* Video Toggle Button (only for video calls) */}
                {isVideo && (
                    <button
                        onClick={onToggleVideo}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                            isVideoOff 
                                ? 'bg-rose-500 text-white' 
                                : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                    >
                        {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                    </button>
                )}
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-20 left-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-20 right-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        </motion.div>
    )
}
