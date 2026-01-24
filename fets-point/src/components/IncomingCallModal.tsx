import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Phone, PhoneOff, Video, User } from 'lucide-react'

interface IncomingCallModalProps {
    callerName: string
    isVideo: boolean
    onAccept: () => void
    onReject: () => void
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
    callerName,
    isVideo,
    onAccept,
    onReject
}) => {
    // Play ringtone sound
    useEffect(() => {
        // Create oscillator for ringtone
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = 440
        oscillator.type = 'sine'
        gainNode.gain.value = 0.1

        const ringPattern = () => {
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
            oscillator.frequency.setValueAtTime(480, audioContext.currentTime + 0.25)
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime + 0.5)
            oscillator.frequency.setValueAtTime(0, audioContext.currentTime + 0.75)
        }

        oscillator.start()
        ringPattern()
        const interval = setInterval(ringPattern, 1500)

        return () => {
            clearInterval(interval)
            oscillator.stop()
            audioContext.close()
        }
    }, [])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 max-w-sm w-full border border-white/10 shadow-2xl"
            >
                {/* Animated Ring */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute inset-0 rounded-full bg-green-500/30"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                        className="absolute inset-0 rounded-full bg-green-500/20"
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                        <User size={40} className="text-white" />
                    </div>
                </div>

                {/* Caller Info */}
                <div className="text-center mb-8">
                    <h3 className="text-white text-2xl font-black mb-2">{callerName}</h3>
                    <div className="flex items-center justify-center gap-2 text-white/60">
                        {isVideo ? <Video size={16} /> : <Phone size={16} />}
                        <span className="text-sm font-medium uppercase tracking-wider">
                            Incoming {isVideo ? 'Video' : 'Voice'} Call
                        </span>
                    </div>
                </div>

                {/* FETSCHAT Badge */}
                <div className="flex justify-center mb-6">
                    <span className="px-4 py-1.5 bg-amber-500 text-black text-[10px] font-black uppercase rounded-full tracking-widest">
                        FETSCHAT SECURE
                    </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-6">
                    {/* Reject Button */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onReject}
                        className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg hover:bg-rose-700 transition-colors"
                    >
                        <PhoneOff size={28} />
                    </motion.button>

                    {/* Accept Button */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onAccept}
                        className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
                    >
                        {isVideo ? <Video size={28} /> : <Phone size={28} />}
                    </motion.button>
                </div>

                {/* Slide to answer hint */}
                <p className="text-center text-white/40 text-xs mt-6 font-medium">
                    Click to accept or decline
                </p>
            </motion.div>
        </motion.div>
    )
}
