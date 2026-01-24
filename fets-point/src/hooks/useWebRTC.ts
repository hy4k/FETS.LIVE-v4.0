import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

interface CallState {
    status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended'
    isVideo: boolean
    isMuted: boolean
    isVideoOff: boolean
    remoteUserId: string | null
    remoteUserName: string | null
}

interface SignalPayload {
    type: 'offer' | 'answer' | 'ice-candidate' | 'call-request' | 'call-accepted' | 'call-rejected' | 'call-ended'
    from: string
    fromName: string
    to: string
    isVideo: boolean
    sdp?: RTCSessionDescriptionInit
    candidate?: RTCIceCandidateInit
}

const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        // STUN Servers (for basic NAT traversal)
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        // TURN Servers (for restrictive NAT/firewall environments)
        // Using OpenRelay public TURN servers
        { 
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        { 
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        { 
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ],
    iceCandidatePoolSize: 10
}

export const useWebRTC = (userId: string, userName: string) => {
    const [callState, setCallState] = useState<CallState>({
        status: 'idle',
        isVideo: false,
        isMuted: false,
        isVideoOff: false,
        remoteUserId: null,
        remoteUserName: null
    })
    
    const [incomingCall, setIncomingCall] = useState<{
        from: string
        fromName: string
        isVideo: boolean
    } | null>(null)

    const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
    const localStreamRef = useRef<MediaStream | null>(null)
    const remoteStreamRef = useRef<MediaStream | null>(null)
    const localVideoRef = useRef<HTMLVideoElement | null>(null)
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
    const signalChannelRef = useRef<any>(null)
    const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([])

    // Initialize signaling channel
    useEffect(() => {
        if (!userId) return

        const channel = supabase.channel(`webrtc:${userId}`)
            .on('broadcast', { event: 'signal' }, ({ payload }) => {
                handleSignal(payload as SignalPayload)
            })
            .subscribe()

        signalChannelRef.current = channel

        return () => {
            channel.unsubscribe()
        }
    }, [userId])

    const sendSignal = useCallback(async (targetUserId: string, payload: Omit<SignalPayload, 'from' | 'fromName' | 'to'>) => {
        const targetChannel = supabase.channel(`webrtc:${targetUserId}`)
        await targetChannel.subscribe()
        await targetChannel.send({
            type: 'broadcast',
            event: 'signal',
            payload: {
                ...payload,
                from: userId,
                fromName: userName,
                to: targetUserId
            }
        })
        targetChannel.unsubscribe()
    }, [userId, userName])

    const handleSignal = useCallback(async (signal: SignalPayload) => {
        if (signal.to !== userId) return

        switch (signal.type) {
            case 'call-request':
                setIncomingCall({
                    from: signal.from,
                    fromName: signal.fromName,
                    isVideo: signal.isVideo
                })
                break

            case 'call-accepted':
                // Remote accepted, create offer
                await createOffer(signal.from, signal.fromName, signal.isVideo)
                break

            case 'call-rejected':
                toast.error(`${signal.fromName} declined the call`)
                endCall()
                break

            case 'call-ended':
                toast(`${signal.fromName} ended the call`, { icon: '📞' })
                endCall()
                break

            case 'offer':
                if (signal.sdp) {
                    await handleOffer(signal.from, signal.fromName, signal.sdp, signal.isVideo)
                }
                break

            case 'answer':
                if (signal.sdp && peerConnectionRef.current) {
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.sdp))
                    // Process queued ICE candidates
                    for (const candidate of iceCandidatesQueue.current) {
                        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
                    }
                    iceCandidatesQueue.current = []
                    setCallState(prev => ({ ...prev, status: 'connected' }))
                }
                break

            case 'ice-candidate':
                if (signal.candidate) {
                    if (peerConnectionRef.current?.remoteDescription) {
                        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate))
                    } else {
                        iceCandidatesQueue.current.push(signal.candidate)
                    }
                }
                break
        }
    }, [userId])

    const createPeerConnection = useCallback((remoteUserId: string) => {
        const pc = new RTCPeerConnection(ICE_SERVERS)

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignal(remoteUserId, {
                    type: 'ice-candidate',
                    isVideo: callState.isVideo,
                    candidate: event.candidate.toJSON()
                })
            }
        }

        pc.ontrack = (event) => {
            remoteStreamRef.current = event.streams[0]
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0]
            }
        }

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                endCall()
            }
        }

        peerConnectionRef.current = pc
        return pc
    }, [sendSignal, callState.isVideo])

    const getLocalStream = useCallback(async (isVideo: boolean) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: isVideo
            })
            localStreamRef.current = stream
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream
            }
            return stream
        } catch (err) {
            toast.error('Failed to access camera/microphone')
            throw err
        }
    }, [])

    const startCall = useCallback(async (targetUserId: string, targetUserName: string, isVideo: boolean) => {
        setCallState({
            status: 'calling',
            isVideo,
            isMuted: false,
            isVideoOff: false,
            remoteUserId: targetUserId,
            remoteUserName: targetUserName
        })

        // Send call request
        await sendSignal(targetUserId, {
            type: 'call-request',
            isVideo
        })

        // Get local stream ready
        await getLocalStream(isVideo)
    }, [sendSignal, getLocalStream])

    const acceptCall = useCallback(async () => {
        if (!incomingCall) return

        setCallState({
            status: 'ringing',
            isVideo: incomingCall.isVideo,
            isMuted: false,
            isVideoOff: false,
            remoteUserId: incomingCall.from,
            remoteUserName: incomingCall.fromName
        })

        await getLocalStream(incomingCall.isVideo)

        await sendSignal(incomingCall.from, {
            type: 'call-accepted',
            isVideo: incomingCall.isVideo
        })

        setIncomingCall(null)
    }, [incomingCall, sendSignal, getLocalStream])

    const rejectCall = useCallback(async () => {
        if (!incomingCall) return

        await sendSignal(incomingCall.from, {
            type: 'call-rejected',
            isVideo: incomingCall.isVideo
        })

        setIncomingCall(null)
    }, [incomingCall, sendSignal])

    const createOffer = useCallback(async (targetUserId: string, targetUserName: string, isVideo: boolean) => {
        const pc = createPeerConnection(targetUserId)
        const stream = localStreamRef.current

        if (stream) {
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream)
            })
        }

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        await sendSignal(targetUserId, {
            type: 'offer',
            isVideo,
            sdp: offer
        })

        setCallState(prev => ({ ...prev, status: 'ringing' }))
    }, [createPeerConnection, sendSignal])

    const handleOffer = useCallback(async (fromUserId: string, fromUserName: string, sdp: RTCSessionDescriptionInit, isVideo: boolean) => {
        const pc = createPeerConnection(fromUserId)
        const stream = localStreamRef.current

        if (stream) {
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream)
            })
        }

        await pc.setRemoteDescription(new RTCSessionDescription(sdp))

        // Process queued ICE candidates
        for (const candidate of iceCandidatesQueue.current) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate))
        }
        iceCandidatesQueue.current = []

        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        await sendSignal(fromUserId, {
            type: 'answer',
            isVideo,
            sdp: answer
        })

        setCallState(prev => ({ ...prev, status: 'connected' }))
    }, [createPeerConnection, sendSignal])

    const endCall = useCallback(() => {
        if (callState.remoteUserId) {
            sendSignal(callState.remoteUserId, {
                type: 'call-ended',
                isVideo: callState.isVideo
            })
        }

        // Stop all tracks
        localStreamRef.current?.getTracks().forEach(track => track.stop())
        remoteStreamRef.current?.getTracks().forEach(track => track.stop())

        // Close peer connection
        peerConnectionRef.current?.close()

        // Reset refs
        localStreamRef.current = null
        remoteStreamRef.current = null
        peerConnectionRef.current = null
        iceCandidatesQueue.current = []

        setCallState({
            status: 'idle',
            isVideo: false,
            isMuted: false,
            isVideoOff: false,
            remoteUserId: null,
            remoteUserName: null
        })
    }, [callState.remoteUserId, callState.isVideo, sendSignal])

    const toggleMute = useCallback(() => {
        const audioTrack = localStreamRef.current?.getAudioTracks()[0]
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled
            setCallState(prev => ({ ...prev, isMuted: !audioTrack.enabled }))
        }
    }, [])

    const toggleVideo = useCallback(() => {
        const videoTrack = localStreamRef.current?.getVideoTracks()[0]
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled
            setCallState(prev => ({ ...prev, isVideoOff: !videoTrack.enabled }))
        }
    }, [])

    return {
        callState,
        incomingCall,
        localVideoRef,
        remoteVideoRef,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo
    }
}
