import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  ICE_SERVERS, 
  unlockAudioContext, 
  playRemoteAudioTrack, 
  stopRemoteAudio, 
  cleanupAllRemoteAudio, 
  requestMicrophoneStream, 
  resumeAllRemoteAudio 
} from '../services/webrtcAudio';
import { 
  unifiedSignaling as signalingService, 
  RemoteParticipantPresence, 
  SignalingConnectionStatus 
} from '../services/unifiedSignaling';

export type AudioConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

export interface PeerDebugInfo {
  peerId: string;
  connectionState: RTCPeerConnectionState | 'new';
  iceConnectionState: RTCIceConnectionState | 'new';
  signalingState: RTCSignalingState | 'stable';
  hasRemoteTrack: boolean;
  isSpeaking: boolean;
  audioLevel: number;
}

export interface DebugEvent {
  id: string;
  timestamp: string;
  type: 'signaling' | 'connection' | 'ice' | 'mic' | 'join' | 'leave' | 'error';
  message: string;
}

interface PeerConnectionData {
  pc: RTCPeerConnection;
  candidateQueue: RTCIceCandidateInit[];
  makingOffer: boolean;
  audioSender?: RTCRtpSender;
  audioTransceiver?: RTCRtpTransceiver;
  remoteStream: MediaStream;
}

interface UseLiveVoiceChatProps {
  roomId: string;
  currentUser: {
    id?: string;
    uid?: string;
    displayName?: string;
    username?: string;
    avatar?: string;
    role?: string;
  };
  isUserOnMic: boolean;
  isMuted: boolean;
  participantIds?: string[];
  onPeerLeave?: (peerId: string) => void;
}

export const useLiveVoiceChat = ({
  roomId,
  currentUser,
  isUserOnMic,
  isMuted,
  participantIds = [],
  onPeerLeave,
}: UseLiveVoiceChatProps) => {
  const [audioState, setAudioState] = useState<AudioConnectionState>('idle');
  const [signalingStatus, setSignalingStatus] = useState<SignalingConnectionStatus>('disconnected');
  const [micPermissionState, setMicPermissionState] = useState<'prompt' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'error'>('prompt');
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  
  // Real-time room participants from signaling server
  const [serverParticipants, setServerParticipants] = useState<RemoteParticipantPresence[]>([]);
  const [speakingUserIds, setSpeakingUserIds] = useState<Set<string>>(new Set());
  const [peerDebugMap, setPeerDebugMap] = useState<Map<string, PeerDebugInfo>>(new Map());
  const [debugEvents, setDebugEvents] = useState<DebugEvent[]>([]);

  const myUserId = String(currentUser.id || currentUser.uid || '');
  const peersRef = useRef<Map<string, PeerConnectionData>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const localTrackRef = useRef<MediaStreamTrack | null>(null);
  
  // Audio Analysers for actual microphone and remote audio activity
  const audioContextRef = useRef<AudioContext | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalysersRef = useRef<Map<string, AnalyserNode>>(new Map());
  const animationFrameRef = useRef<number | null>(null);

  // Synchronized refs to avoid re-triggering effects on mutable states
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const isUserOnMicRef = useRef(isUserOnMic);
  isUserOnMicRef.current = isUserOnMic;

  const onPeerLeaveRef = useRef(onPeerLeave);
  onPeerLeaveRef.current = onPeerLeave;

  // Add event to diagnostic log buffer (capped at 50 events)
  const addDebugEvent = useCallback((type: DebugEvent['type'], message: string) => {
    const event: DebugEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
    };
    console.log(`[WebRTC:${type.toUpperCase()}] ${message}`);
    setDebugEvents(prev => [event, ...prev.slice(0, 49)]);
  }, []);

  // Update peer debug state helper
  const updatePeerDebug = useCallback((peerId: string, updates: Partial<PeerDebugInfo>) => {
    setPeerDebugMap(prev => {
      const next = new Map<string, PeerDebugInfo>(prev);
      const current = next.get(peerId);
      const updated: PeerDebugInfo = {
        peerId,
        connectionState: updates.connectionState ?? current?.connectionState ?? 'new',
        iceConnectionState: updates.iceConnectionState ?? current?.iceConnectionState ?? 'new',
        signalingState: updates.signalingState ?? current?.signalingState ?? 'stable',
        hasRemoteTrack: updates.hasRemoteTrack ?? current?.hasRemoteTrack ?? false,
        isSpeaking: updates.isSpeaking ?? current?.isSpeaking ?? false,
        audioLevel: updates.audioLevel ?? current?.audioLevel ?? 0,
      };
      next.set(peerId, updated);
      return next;
    });
  }, []);

  // Helper to attach Web Audio Analyser to a stream for speaker volume detection
  const attachStreamAnalyser = useCallback((id: string, stream: MediaStream, isLocal: boolean = false) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);

      if (isLocal) {
        if (localAnalyserRef.current) {
          try { localAnalyserRef.current.disconnect(); } catch (e) {}
        }
        localAnalyserRef.current = analyser;
      } else {
        const existing = remoteAnalysersRef.current.get(id);
        if (existing) {
          try { existing.disconnect(); } catch (e) {}
        }
        remoteAnalysersRef.current.set(id, analyser);
      }
    } catch (err: any) {
      console.warn(`[LiveVoiceChat] Could not attach audio analyser for ${id}:`, err.message);
    }
  }, []);

  // Continuous speech detection loop based on real microphone / remote audio RMS level
  useEffect(() => {
    const dataArray = new Uint8Array(128);
    const SPEAKING_THRESHOLD = 18; // Minimum audio level to indicate speaking (scale 0-255)

    const checkAudioActivity = () => {
      const currentlySpeaking = new Set<string>();

      // 1. Check local microphone volume if not muted and on mic
      if (!isMutedRef.current && isUserOnMicRef.current && localAnalyserRef.current) {
        localAnalyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        if (avg > SPEAKING_THRESHOLD) {
          currentlySpeaking.add(myUserId);
        }
      }

      // 2. Check remote participants' volume
      remoteAnalysersRef.current.forEach((analyser, peerId) => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalizedLevel = Math.min(100, Math.round((avg / 128) * 100));
        
        const isSpeaking = avg > SPEAKING_THRESHOLD;
        if (isSpeaking) {
          currentlySpeaking.add(peerId);
        }
        updatePeerDebug(peerId, { isSpeaking, audioLevel: normalizedLevel });
      });

      setSpeakingUserIds(currentlySpeaking);

      // Send local speaking state to signaling server if active
      if (myUserId && roomId) {
        const isLocalSpeaking = currentlySpeaking.has(myUserId);
        signalingService.sendSpeakingStatus(roomId, myUserId, isLocalSpeaking);
      }

      animationFrameRef.current = requestAnimationFrame(checkAudioActivity);
    };

    animationFrameRef.current = requestAnimationFrame(checkAudioActivity);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [myUserId, roomId, updatePeerDebug]);

  // Clean up single peer connection
  const closePeer = useCallback((peerId: string) => {
    const peerData = peersRef.current.get(peerId);
    if (peerData) {
      addDebugEvent('connection', `Closing WebRTC connection with peer ${peerId}`);
      try {
        peerData.pc.onicecandidate = null;
        peerData.pc.ontrack = null;
        peerData.pc.onconnectionstatechange = null;
        peerData.pc.oniceconnectionstatechange = null;
        peerData.pc.onsignalingstatechange = null;
        peerData.pc.onnegotiationneeded = null;
        peerData.pc.close();
      } catch (e) {}
      peersRef.current.delete(peerId);
    }
    stopRemoteAudio(peerId);
    remoteAnalysersRef.current.delete(peerId);
    setPeerDebugMap(prev => {
      const next = new Map<string, PeerDebugInfo>(prev);
      next.delete(peerId);
      return next;
    });
  }, [addDebugEvent]);

  // Create or get RTCPeerConnection for a remote peer
  const getOrCreatePeerConnection = useCallback((peerId: string): PeerConnectionData => {
    const existing = peersRef.current.get(peerId);
    if (existing) return existing;

    addDebugEvent('connection', `Creating RTCPeerConnection for peer ${peerId}`);
    const pc = new RTCPeerConnection(ICE_SERVERS);
    const remoteStream = new MediaStream();

    const peerData: PeerConnectionData = {
      pc,
      candidateQueue: [],
      makingOffer: false,
      remoteStream,
    };
    peersRef.current.set(peerId, peerData);

    updatePeerDebug(peerId, {
      peerId,
      connectionState: pc.connectionState,
      iceConnectionState: pc.iceConnectionState,
      signalingState: pc.signalingState,
    });

    // 1. ICE candidate exchange: send candidate to remote peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candInit: RTCIceCandidateInit = {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          usernameFragment: event.candidate.usernameFragment,
        };
        signalingService.sendCandidate(roomId, myUserId, peerId, candInit);
      }
    };

    // 2. Receive remote audio track: attach to <audio> element and volume analyser
    pc.ontrack = (event) => {
      addDebugEvent('connection', `Received remote audio track from peer ${peerId} (kind: ${event.track.kind})`);
      
      // Ensure the received track is active and unmuted
      event.track.enabled = true;

      // Extract or construct the remote MediaStream
      let stream: MediaStream;
      if (event.streams && event.streams[0]) {
        stream = event.streams[0];
      } else {
        stream = new MediaStream([event.track]);
      }

      // Ensure all audio tracks in stream are enabled
      stream.getAudioTracks().forEach(track => {
        track.enabled = true;
      });

      // Play remote audio through HTML5 <audio> element
      playRemoteAudioTrack(peerId, stream, event.track);
      
      // Attach Web Audio Analyser for speaking indicator
      attachStreamAnalyser(peerId, stream, false);

      updatePeerDebug(peerId, { hasRemoteTrack: true });
    };

    // 3. WebRTC connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      addDebugEvent('connection', `Peer ${peerId} connectionState: ${state}`);
      updatePeerDebug(peerId, { connectionState: state });

      if (state === 'connected') {
        setAudioState('connected');
        // Ensure remote audio playback triggers
        resumeAllRemoteAudio();
      } else if (state === 'failed') {
        addDebugEvent('error', `Peer ${peerId} WebRTC connection failed. Isolating connection.`);
      }
    };

    // 4. ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      addDebugEvent('ice', `Peer ${peerId} iceConnectionState: ${state}`);
      updatePeerDebug(peerId, { iceConnectionState: state });

      if (state === 'connected' || state === 'completed') {
        resumeAllRemoteAudio();
      } else if (state === 'disconnected') {
        addDebugEvent('ice', `Peer ${peerId} ICE connection disconnected. Reconnecting...`);
        setTimeout(() => {
          if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
            try {
              pc.restartIce();
              if (myUserId > peerId) {
                initiateOffer(peerId);
              }
            } catch (e) {}
          }
        }, 2000);
      } else if (state === 'failed') {
        addDebugEvent('error', `Peer ${peerId} ICE connection failed. Reconnecting with ICE restart...`);
        try {
          pc.restartIce();
          if (myUserId > peerId) {
            initiateOffer(peerId);
          }
        } catch (e) {}
      }
    };

    // 5. Signaling state changes
    pc.onsignalingstatechange = () => {
      updatePeerDebug(peerId, { signalingState: pc.signalingState });
    };

    // 6. Ensure Audio Section exists: Add local track OR audio transceiver
    if (localTrackRef.current && localStreamRef.current) {
      try {
        peerData.audioSender = pc.addTrack(localTrackRef.current, localStreamRef.current);
      } catch (e: any) {
        console.warn(`[LiveVoiceChat] Could not add existing track for ${peerId}:`, e.message);
      }
    } else {
      try {
        // Guarantee m=audio sendrecv line exists in every SDP offer and answer
        peerData.audioTransceiver = pc.addTransceiver('audio', { direction: 'sendrecv' });
        peerData.audioSender = peerData.audioTransceiver.sender;
      } catch (e: any) {
        console.warn(`[LiveVoiceChat] Could not add audio transceiver for ${peerId}:`, e.message);
      }
    }

    // 7. Perfect Negotiation: onnegotiationneeded
    pc.onnegotiationneeded = async () => {
      try {
        peerData.makingOffer = true;
        addDebugEvent('signaling', `onnegotiationneeded: creating offer for peer ${peerId}`);
        const offer = await pc.createOffer({ offerToReceiveAudio: true });
        if (pc.signalingState !== 'stable') return;
        await pc.setLocalDescription(offer);
        if (pc.localDescription) {
          signalingService.sendOffer(roomId, myUserId, peerId, {
            type: pc.localDescription.type,
            sdp: pc.localDescription.sdp,
          });
        }
      } catch (err: any) {
        console.warn(`[LiveVoiceChat] onnegotiationneeded error with ${peerId}:`, err.message);
      } finally {
        peerData.makingOffer = false;
      }
    };

    return peerData;
  }, [roomId, myUserId, addDebugEvent, updatePeerDebug, attachStreamAnalyser]);

  // Initiate an offer to a peer (called deterministically by the designated offerer or on track renegotiation)
  const initiateOffer = useCallback(async (peerId: string) => {
    const peerData = getOrCreatePeerConnection(peerId);
    if (!peerData) return;

    if (peerData.makingOffer || peerData.pc.signalingState !== 'stable') {
      return;
    }

    try {
      peerData.makingOffer = true;
      addDebugEvent('signaling', `Initiating WebRTC offer to peer ${peerId}`);

      // Ensure transceiver direction is sendrecv if audio transceiver exists
      peerData.pc.getTransceivers().forEach(tr => {
        if (tr.receiver.track.kind === 'audio' || tr.sender === peerData.audioSender) {
          tr.direction = 'sendrecv';
        }
      });

      const offer = await peerData.pc.createOffer({
        offerToReceiveAudio: true,
      });

      if (peerData.pc.signalingState !== 'stable') {
        return;
      }

      await peerData.pc.setLocalDescription(offer);

      if (peerData.pc.localDescription) {
        signalingService.sendOffer(roomId, myUserId, peerId, {
          type: peerData.pc.localDescription.type,
          sdp: peerData.pc.localDescription.sdp,
        });
      }
    } catch (err: any) {
      addDebugEvent('error', `Error initiating offer to ${peerId}: ${err.message}`);
    } finally {
      peerData.makingOffer = false;
    }
  }, [roomId, myUserId, addDebugEvent, getOrCreatePeerConnection]);

  // Request & activate microphone
  const setupMicrophone = useCallback(async () => {
    setMicPermissionState('requesting');
    setMicErrorMessage(null);
    addDebugEvent('mic', 'Requesting microphone access from device...');

    try {
      const stream = await requestMicrophoneStream();
      localStreamRef.current = stream;
      const track = stream.getAudioTracks()[0];
      localTrackRef.current = track;
      track.enabled = !isMutedRef.current;

      setMicPermissionState('granted');
      addDebugEvent('mic', `Microphone granted: "${track.label}"`);

      // Attach local mic audio analyser
      attachStreamAnalyser(myUserId, stream, true);

      // Add/replace track on all active peer connections
      peersRef.current.forEach((peerData, peerId) => {
        try {
          const senders = peerData.pc.getSenders();
          const audioSender = senders.find(s => (s.track && s.track.kind === 'audio') || !s.track);
          if (audioSender) {
            audioSender.replaceTrack(track);
            peerData.audioSender = audioSender;
          } else {
            peerData.audioSender = peerData.pc.addTrack(track, stream);
          }

          // Ensure audio transceivers are set to sendrecv
          peerData.pc.getTransceivers().forEach(tr => {
            if (tr.sender === peerData.audioSender || tr.receiver.track.kind === 'audio') {
              tr.direction = 'sendrecv';
            }
          });

          // Trigger renegotiation offer so remote peers receive incoming audio
          if (peerData.pc.signalingState === 'stable') {
            initiateOffer(peerId);
          }
        } catch (e: any) {
          addDebugEvent('error', `Failed to attach local track to peer ${peerId}: ${e.message}`);
        }
      });

      return stream;
    } catch (err: any) {
      console.error('[LiveVoiceChat:MicrophoneError]', err);
      let message = 'Unable to access microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermissionState('denied');
        message = 'Microphone permission was denied. Please allow microphone access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setMicPermissionState('unavailable');
        message = 'No microphone device found on this system.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setMicPermissionState('error');
        message = 'Microphone is already in use by another tab or app.';
      } else {
        setMicPermissionState('error');
        message = err.message || 'Microphone initialization failed.';
      }
      setMicErrorMessage(message);
      addDebugEvent('error', message);
      throw err;
    }
  }, [myUserId, addDebugEvent, attachStreamAnalyser, initiateOffer]);

  // Stop microphone
  const releaseMicrophone = useCallback(() => {
    addDebugEvent('mic', 'Releasing microphone tracks.');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    localTrackRef.current = null;
    if (localAnalyserRef.current) {
      try { localAnalyserRef.current.disconnect(); } catch (e) {}
      localAnalyserRef.current = null;
    }
    peersRef.current.forEach(peerData => {
      const senders = peerData.pc.getSenders();
      const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
      if (audioSender) {
        try {
          audioSender.replaceTrack(null);
        } catch (e) {}
      }
    });
  }, [addDebugEvent]);

  // Connect to room presence and setup WebRTC signaling message handlers
  useEffect(() => {
    if (!roomId || !myUserId) return;

    addDebugEvent('signaling', `Connecting to WebSocket signaling for room ${roomId}`);
    setAudioState('connecting');

    // Subscribe to signaling connection status
    const unsubscribeStatus = signalingService.onStatusChange((status) => {
      setSignalingStatus(status);
      addDebugEvent('signaling', `Signaling status: ${status}`);
      if (status === 'connected') {
        setAudioState('connected');
      } else if (status === 'reconnecting') {
        setAudioState('reconnecting');
      } else if (status === 'disconnected') {
        setAudioState('disconnected');
      }
    });

    // Join room on signaling server
    signalingService.joinRoom(roomId, {
      userId: myUserId,
      userName: currentUser.displayName || currentUser.username || 'User',
      userAvatar: currentUser.avatar,
      role: currentUser.role,
      isMuted: isMutedRef.current,
    });

    // 1. Handle room-state event (initial participant list on join)
    const offRoomState = signalingService.on('room-state', (payload: any) => {
      const participants: RemoteParticipantPresence[] = payload.participants || [];
      addDebugEvent('join', `Received room state: ${participants.length} participants`);
      setServerParticipants(participants.filter(p => p.userId !== myUserId));

      // For every existing peer in the room, prepare peer connection
      participants.forEach(p => {
        if (p.userId !== myUserId) {
          getOrCreatePeerConnection(p.userId);
          // Deterministic offerer: user with higher ID initiates offer
          if (myUserId > p.userId) {
            initiateOffer(p.userId);
          }
        }
      });
    });

    // 2. Handle user-joined event
    const offUserJoined = signalingService.on('user-joined', (payload: any) => {
      const p: RemoteParticipantPresence = payload.participant;
      if (!p || p.userId === myUserId) return;

      addDebugEvent('join', `User ${p.userName} (${p.userId}) joined the room.`);
      setServerParticipants(prev => {
        const filtered = prev.filter(item => item.userId !== p.userId);
        return [...filtered, p];
      });

      // Prepare peer connection for new participant
      getOrCreatePeerConnection(p.userId);
      // Deterministic offerer: user with higher ID initiates offer
      if (myUserId > p.userId) {
        initiateOffer(p.userId);
      }
    });

    // 3. Handle user-left event
    const offUserLeft = signalingService.on('user-left', (payload: any) => {
      const { userId, reason } = payload;
      if (!userId || userId === myUserId) return;

      addDebugEvent('leave', `User ${userId} left the room (reason: ${reason || 'normal'}).`);
      setServerParticipants(prev => prev.filter(p => p.userId !== userId));
      closePeer(userId);
      onPeerLeaveRef.current?.(userId);
    });

    // 4. Handle incoming WebRTC offer
    const offOffer = signalingService.on('offer', async (payload: any) => {
      const { fromUserId, sdp } = payload;
      if (!fromUserId || fromUserId === myUserId || !sdp) return;

      const peerData = getOrCreatePeerConnection(fromUserId);
      const isPolite = myUserId < fromUserId; // Match deterministic rule: smaller ID is polite

      try {
        const offerCollision = peerData.makingOffer || peerData.pc.signalingState !== 'stable';
        if (offerCollision) {
          if (!isPolite) {
            addDebugEvent('signaling', `Collided offer from ${fromUserId} ignored (impolite peer).`);
            return;
          }
          addDebugEvent('signaling', `Collided offer from ${fromUserId}: rolling back local offer (polite peer).`);
          await peerData.pc.setLocalDescription({ type: 'rollback' });
        }

        addDebugEvent('signaling', `Handling offer from peer ${fromUserId}`);
        await peerData.pc.setRemoteDescription(new RTCSessionDescription(sdp));

        // Drain queued ICE candidates
        while (peerData.candidateQueue.length > 0) {
          const cand = peerData.candidateQueue.shift()!;
          try {
            await peerData.pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e: any) {
            console.warn(`[LiveVoiceChat] Error draining candidate for ${fromUserId}:`, e.message);
          }
        }

        // Before creating answer: attach local audio track if available and ensure sendrecv direction
        if (localTrackRef.current && localStreamRef.current) {
          try {
            const senders = peerData.pc.getSenders();
            const audioSender = senders.find(s => (s.track && s.track.kind === 'audio') || !s.track);
            if (audioSender) {
              audioSender.replaceTrack(localTrackRef.current);
              peerData.audioSender = audioSender;
            } else {
              peerData.audioSender = peerData.pc.addTrack(localTrackRef.current, localStreamRef.current);
            }
          } catch (e: any) {
            console.warn(`[LiveVoiceChat] Could not attach local track in offOffer:`, e);
          }
        }

        try {
          peerData.pc.getTransceivers().forEach(tr => {
            if (tr.sender === peerData.audioSender || tr.receiver.track.kind === 'audio') {
              tr.direction = 'sendrecv';
            }
          });
        } catch (e: any) {}

        // Create and set local answer
        const answer = await peerData.pc.createAnswer();
        await peerData.pc.setLocalDescription(answer);

        if (peerData.pc.localDescription) {
          signalingService.sendAnswer(roomId, myUserId, fromUserId, {
            type: peerData.pc.localDescription.type,
            sdp: peerData.pc.localDescription.sdp,
          });
        }
      } catch (err: any) {
        addDebugEvent('error', `Error handling offer from ${fromUserId}: ${err.message}`);
      }
    });

    // 5. Handle incoming WebRTC answer
    const offAnswer = signalingService.on('answer', async (payload: any) => {
      const { fromUserId, sdp } = payload;
      if (!fromUserId || fromUserId === myUserId || !sdp) return;

      const peerData = peersRef.current.get(fromUserId);
      if (!peerData) return;

      try {
        if (peerData.pc.signalingState === 'have-local-offer') {
          addDebugEvent('signaling', `Handling answer from peer ${fromUserId}`);
          await peerData.pc.setRemoteDescription(new RTCSessionDescription(sdp));

          // Drain queued ICE candidates
          while (peerData.candidateQueue.length > 0) {
            const cand = peerData.candidateQueue.shift()!;
            try {
              await peerData.pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e: any) {
              console.warn(`[LiveVoiceChat] Error draining candidate in answer for ${fromUserId}:`, e.message);
            }
          }
        }
      } catch (err: any) {
        addDebugEvent('error', `Error handling answer from ${fromUserId}: ${err.message}`);
      }
    });

    // 6. Handle incoming ICE candidate
    const offCandidate = signalingService.on('candidate', async (payload: any) => {
      const { fromUserId, candidate } = payload;
      if (!fromUserId || fromUserId === myUserId || !candidate) return;

      const peerData = getOrCreatePeerConnection(fromUserId);

      try {
        if (peerData.pc.remoteDescription && peerData.pc.remoteDescription.type) {
          await peerData.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          peerData.candidateQueue.push(candidate);
        }
      } catch (err: any) {
        console.warn(`[LiveVoiceChat] Error adding candidate from ${fromUserId}:`, err.message);
      }
    });

    // 7. Handle mute-status event
    const offMute = signalingService.on('mute-status', (payload: any) => {
      const { userId, isMuted: peerMuted } = payload;
      setServerParticipants(prev =>
        prev.map(p => p.userId === userId ? { ...p, isMuted: peerMuted } : p)
      );
    });

    // 8. Handle speaking-status event
    const offSpeaking = signalingService.on('speaking-status', (payload: any) => {
      const { userId, isSpeaking } = payload;
      setServerParticipants(prev =>
        prev.map(p => p.userId === userId ? { ...p, isSpeaking } : p)
      );
    });

    return () => {
      unsubscribeStatus();
      offRoomState();
      offUserJoined();
      offUserLeft();
      offOffer();
      offAnswer();
      offCandidate();
      offMute();
      offSpeaking();
      signalingService.leaveRoom(roomId, myUserId);
    };
  }, [roomId, myUserId, currentUser, addDebugEvent, getOrCreatePeerConnection, initiateOffer, closePeer]);

  // Automatic audio recovery and peer refresh on tab visibility / unlock
  useEffect(() => {
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && roomId) {
        resumeAllRemoteAudio();
        signalingService.requestPeers?.(roomId);
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
      return () => document.removeEventListener('visibilitychange', handleVisibility);
    }
  }, [roomId]);

  // Sync external participantIds (e.g. from room members or seats)
  useEffect(() => {
    if (!participantIds || participantIds.length === 0 || !myUserId) return;
    participantIds.forEach(id => {
      if (id && id !== myUserId) {
        getOrCreatePeerConnection(id);
        if (myUserId > id) {
          initiateOffer(id);
        }
      }
    });
  }, [participantIds, myUserId, getOrCreatePeerConnection, initiateOffer]);

  // Handle isUserOnMic state changes
  useEffect(() => {
    if (isUserOnMic) {
      setupMicrophone().catch(err => {
        console.warn('[LiveVoiceChat] Failed to acquire microphone on mic take:', err);
      });
    } else {
      releaseMicrophone();
    }
  }, [isUserOnMic, setupMicrophone, releaseMicrophone]);

  // Handle microphone mute/unmute
  useEffect(() => {
    if (localTrackRef.current) {
      localTrackRef.current.enabled = !isMuted;
    }
    signalingService.sendMuteStatus(roomId, myUserId, isMuted);
  }, [isMuted, roomId, myUserId]);

  // Peer cleanup helper on full teardown
  const cleanupVoiceChat = useCallback(() => {
    addDebugEvent('connection', 'Teardown voice chat completely.');
    releaseMicrophone();
    peersRef.current.forEach((peerData, peerId) => {
      closePeer(peerId);
    });
    cleanupAllRemoteAudio();
    signalingService.leaveRoom(roomId, myUserId);
    setAudioState('idle');
  }, [addDebugEvent, releaseMicrophone, closePeer, roomId, myUserId]);

  // Calculate active peers count
  const activePeersCount = useMemo(() => {
    let count = 0;
    peersRef.current.forEach(p => {
      if (p.pc.connectionState === 'connected' || p.pc.iceConnectionState === 'connected') {
        count++;
      }
    });
    return count > 0 ? count : serverParticipants.length;
  }, [serverParticipants.length]);

  return {
    unlockAudio: unlockAudioContext,
    speakingUserIds,
    audioState,
    signalingStatus,
    activePeersCount,
    serverParticipants,
    peerDebugMap,
    debugEvents,
    micPermissionState,
    micErrorMessage,
    retryMicrophone: setupMicrophone,
    cleanupVoiceChat,
  };
};
