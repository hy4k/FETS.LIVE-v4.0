import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2, Minimize2, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface VideoCallOverlayProps {
    localStream: MediaStream | null;
    remoteStreams: Record<string, MediaStream>; // Keyed by User ID
    onEndCall: () => void;
    isMinimized?: boolean;
    onToggleMinimize?: () => void;
    callType?: 'video' | 'audio';
}

const RemoteVideoTile = ({ stream, userId, callType }: { stream: MediaStream, userId: string, callType: 'video' | 'audio' }) => {
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const [userName, setUserName] = useState('Loading...');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    useEffect(() => {
        const fetchName = async () => {
            const { data } = await supabase.from('staff_profiles').select('full_name, avatar_url').eq('user_id', userId).single();
            if (data) {
                setUserName(data.full_name);
                setAvatarUrl(data.avatar_url);
            }
        };
        fetchName();
    }, [userId]);

    const isVideoRenderable = callType === 'video' && stream?.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled;

    return (
        <div className="relative w-full h-full bg-zinc-800 rounded-xl overflow-hidden border border-white/5">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${!isVideoRenderable ? 'hidden' : ''}`}
            />

            {/* Audio/Avatar Placeholder */}
            {!isVideoRenderable && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 gap-4">
                    <div className="w-24 h-24 rounded-full border-4 border-[#ffbf00]/20 overflow-hidden shadow-2xl relative">
                        {avatarUrl ? (
                            <img src={avatarUrl} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                <User className="text-white/20 w-10 h-10" />
                            </div>
                        )}
                        {/* Audio Indicator Pulse */}
                        <div className="absolute inset-0 border-4 border-emerald-500/50 rounded-full animate-pulse" />
                    </div>
                </div>
            )}

            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                {userName}
                {callType === 'audio' && <Mic size={10} className="text-emerald-400" />}
            </div>
        </div>
    );
};

export const VideoCallOverlay: React.FC<VideoCallOverlayProps> = ({
    localStream,
    remoteStreams,
    onEndCall,
    isMinimized = false,
    onToggleMinimize,
    callType = 'video'
}) => {
    const localVideoRef = React.useRef<HTMLVideoElement>(null);
    const [isMuted, setIsMuted] = React.useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = React.useState(callType === 'video');

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream && callType === 'video') {
            localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const participantsCount = Object.keys(remoteStreams).length;

    // Grid Logic
    const gridCols = participantsCount <= 1 ? 'grid-cols-1' : participantsCount <= 4 ? 'grid-cols-2' : 'grid-cols-3';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.1}
            className={`
                fixed z-[1000] overflow-hidden bg-zinc-950 rounded-2xl border-2 ${callType === 'audio' ? 'border-emerald-500/50' : 'border-[#ffbf00]/50'} shadow-[0_0_80px_rgba(0,0,0,0.8)]
                ${isMinimized ? 'w-48 h-32 bottom-20 right-8' : 'w-[90vw] max-w-[1000px] h-[75vh] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'}
            `}
        >
            {/* Header / Controls for Minimize */}
            <div className="absolute top-0 left-0 right-0 p-3 z-30 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${callType === 'audio' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse shadow-[0_0_8px_current]`} />
                    <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">{callType === 'audio' ? 'VOICE UPLINK' : 'MESH LINK'} ACTIVE</span>
                </div>
                {onToggleMinimize && (
                    <button onClick={onToggleMinimize} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10">
                        {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>
                )}
            </div>

            {/* Main Video Area (Remote Grid) */}
            <div className={`
                absolute inset-0 p-4 pt-16 pb-24 grid gap-3 overflow-hidden
                ${isMinimized ? 'hidden' : gridCols}
            `}>
                {Object.entries(remoteStreams).map(([uid, stream]) => (
                    <RemoteVideoTile key={uid} userId={uid} stream={stream} callType={callType} />
                ))}
                {participantsCount === 0 && (
                    <div className="col-span-full h-full flex flex-col items-center justify-center text-white/20">
                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center mb-4">
                            {callType === 'audio' ? <Mic className="animate-pulse" /> : <Maximize2 className="animate-pulse" />}
                        </div>
                        <p className="font-black text-xs uppercase tracking-[0.3em]">Waiting for uplink...</p>
                    </div>
                )}
            </div>

            {/* Local Video (PIP or Main if Minimized) */}
            <div className={`
                absolute transition-all duration-500 overflow-hidden rounded-xl border border-white/20 shadow-2xl bg-black z-40
                ${isMinimized ? 'inset-0 border-0 rounded-none' : 'w-40 h-28 bottom-6 right-6'}
            `}>
                {callType === 'video' ? (
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                        <User className="text-white/30" />
                    </div>
                )}

                {!isMinimized && (
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/40 rounded text-[8px] font-bold text-white uppercase">You</div>
                )}
            </div>

            {/* Controls (Only visible when not minimized) */}
            {!isMinimized && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 z-50">
                    <button
                        onClick={toggleMute}
                        className={`p-4 rounded-2xl border transition-all ${isMuted ? 'bg-red-500 border-red-500 text-white' : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'}`}
                    >
                        {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                    </button>

                    <button
                        onClick={onEndCall}
                        className="p-5 rounded-2xl bg-rose-600 border border-rose-500 text-white hover:bg-rose-700 transition-all shadow-[0_0_40px_rgba(225,29,72,0.4)] transform hover:scale-105 active:scale-95"
                    >
                        <PhoneOff size={32} />
                    </button>

                    {callType === 'video' && (
                        <button
                            onClick={toggleVideo}
                            className={`p-4 rounded-2xl border transition-all ${!isVideoEnabled ? 'bg-red-500 border-red-500 text-white' : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'}`}
                        >
                            {!isVideoEnabled ? <VideoOff size={22} /> : <Video size={22} />}
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
};
