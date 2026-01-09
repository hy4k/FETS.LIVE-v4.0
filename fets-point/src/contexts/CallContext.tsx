import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useVideoCall } from '../hooks/useVideoCall';
import { IncomingCallModal } from '../components/Chat/IncomingCallModal';
import { VideoCallOverlay } from '../components/Chat/VideoCallOverlay';
import { AnimatePresence } from 'framer-motion';

interface CallContextType {
    callState: any;
    startCall: (targetUserIds: string | string[], type?: 'video' | 'audio') => Promise<void>;
    endCall: () => void;
    answerCall: () => void;
    rejectCall: () => void;
    isMinimized: boolean;
    setIsMinimized: (val: boolean) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
    const { callState, startCall, endCall, answerCall, rejectCall } = useVideoCall();
    const [isMinimized, setIsMinimized] = useState(false);

    // Auto-minimize if small screen or navigation occurs (optional logic here)

    return (
        <CallContext.Provider value={{
            callState,
            startCall,
            endCall,
            answerCall,
            rejectCall,
            isMinimized,
            setIsMinimized
        }}>
            {children}

            <AnimatePresence>
                {callState.isReceivingCall && (
                    <IncomingCallModal
                        callerName={callState.callerId!}
                        callType={callState.callType}
                        onAccept={answerCall}
                        onDecline={rejectCall}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {(callState.isInCall || callState.isCalling) && (
                    <VideoCallOverlay
                        localStream={callState.localStream}
                        remoteStreams={callState.remoteStreams}
                        onEndCall={endCall}
                        isMinimized={isMinimized}
                        onToggleMinimize={() => setIsMinimized(!isMinimized)}
                        callType={callState.callType}
                        startTime={callState.startTime}
                    />
                )}
            </AnimatePresence>
        </CallContext.Provider>
    );
}

export function useGlobalCall() {
    const context = useContext(CallContext);
    if (context === undefined) {
        throw new Error('useGlobalCall must be used within a CallProvider');
    }
    return context;
}
