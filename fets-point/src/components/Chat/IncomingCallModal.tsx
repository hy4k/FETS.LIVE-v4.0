import React from 'react';
import { motion } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';

interface IncomingCallModalProps {
    callerName: string;
    callType?: 'video' | 'audio';
    onAccept: () => void;
    onDecline: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({ callerName, callType = 'video', onAccept, onDecline }) => {
    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`bg-[#1a1a2e] border-2 ${callType === 'audio' ? 'border-[#1dd1a1]' : 'border-[#ffbf00]'} p-8 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] max-w-sm w-full text-center relative overflow-hidden`}
            >
                {/* Background Animation */}
                <div className={`absolute inset-0 bg-gradient-to-br ${callType === 'audio' ? 'from-[#1dd1a1]/5' : 'from-[#ffbf00]/5'} to-transparent pointer-events-none`} />

                <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-pulse border ${callType === 'audio' ? 'bg-[#1dd1a1]/10 border-[#1dd1a1]/30' : 'bg-[#ffbf00]/10 border-[#ffbf00]/30'}`}>
                        {callType === 'audio' ? (
                            <Phone size={40} className="text-[#1dd1a1]" />
                        ) : (
                            <Video size={40} className="text-[#ffbf00]" />
                        )}
                    </div>

                    <h3 className="text-white/50 text-xs font-bold uppercase tracking-[0.2em] mb-2">
                        Incoming {callType === 'video' ? 'Video Transmission' : 'Voice Uplink'}
                    </h3>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-8">
                        {callerName || 'Unknown Agent'}
                    </h2>

                    <div className="flex items-center gap-6 w-full">
                        <button
                            onClick={onDecline}
                            className="flex-1 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all flex flex-col items-center gap-2"
                        >
                            <PhoneOff size={20} />
                            Decline
                        </button>

                        <button
                            onClick={onAccept}
                            className={`flex-1 p-4 rounded-xl border font-bold uppercase tracking-wider transition-all flex flex-col items-center gap-2 shadow-[0_0_30px_rgba(0,0,0,0.2)]
                                ${callType === 'audio'
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black'
                                    : 'bg-[#ffbf00]/10 border-[#ffbf00]/20 text-[#ffbf00] hover:bg-[#ffbf00] hover:text-black'
                                }`}
                        >
                            {callType === 'audio' ? <Phone size={20} /> : <Video size={20} />}
                            Accept
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
