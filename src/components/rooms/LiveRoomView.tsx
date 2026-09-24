import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { LiveRoom, GiftItem, MicSeat, RoomMember } from '../../types';
import { GIFTS_CATALOG } from '../../data/mockData';
import { soundEffects } from '../../utils/audio';
import { RoomManagementModal } from './RoomManagementModal';
import { LaurelLevelBadge } from './RoomVisualAssets';
import { useLiveVoiceChat } from '../../hooks/useLiveVoiceChat';
import { setupGlobalMediaUnlock } from '../../services/webrtcAudio';
import { WebRTCDebugModal } from './WebRTCDebugModal';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { 
  X, 
  Mic, 
  MicOff, 
  Gift, 
  Send, 
  Dices, 
  Sparkles, 
  LogOut, 
  Users, 
  Settings, 
  Crown, 
  Copy, 
  Check, 
  Heart,
  MessageCircle,
  Radio,
  Lock,
  Volume2,
  UserPlus,
  Flame,
  Megaphone,
  CheckCircle2,
  Music2,
  Pencil,
  Activity,
  AlertTriangle
} from 'lucide-react';

interface LiveRoomViewProps {
  room: LiveRoom;
  onClose: () => void;
}

export const LiveRoomView: React.FC<LiveRoomViewProps> = ({ room, onClose }) => {
  const { 
    currentUser, 
    leaveRoom, 
    messages, 
    sendMessage, 
    sendGift, 
    roomMembers, 
    takePartySeat, 
    leavePartySeat, 
    mutePartySeat,
    removeMemberFromRoom,
    setShowRechargeModal,
    followUser 
  } = useApp();

  const [inputMsg, setInputMsg] = useState('');
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showGiftDrawer, setShowGiftDrawer] = useState(false);
  const [showMembersDrawer, setShowMembersDrawer] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedSeatModal, setSelectedSeatModal] = useState<number | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: string; name: string } | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [flyingHearts, setFlyingHearts] = useState<{ id: number; left: number }[]>([]);
  const [showDebugModal, setShowDebugModal] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const hasLeftRef = useRef(false);
  const isOwner = room.hostId === currentUser.id || 
                  room.hostId === currentUser.uid || 
                  currentUser.role === 'admin' || 
                  currentUser.email === 'wajaht265374@gmail.com';
  const shortId = room.id.replace('room-', '').slice(-6);

  // Filter messages for this room
  const roomMessages = messages.filter(m => m.roomId === room.id);

  // Auto-scroll chat when drawer is open
  useEffect(() => {
    if (showChatDrawer && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [roomMessages, showChatDrawer]);

  // Ensure room has 8 mic seats (No.1 to No.8)
  const micSeats: MicSeat[] = (room.micSeats && room.micSeats.length >= 8)
    ? room.micSeats
    : Array.from({ length: 8 }, (_, i) => ({ seatIndex: i, isLocked: false }));

  // Check if current user is on any seat (matching both id and uid)
  const myUserId = String(currentUser.id || currentUser.uid);
  const mySeatIndex = micSeats.findIndex(
    s => s.userId === myUserId || (currentUser.id && s.userId === currentUser.id) || (currentUser.uid && s.userId === currentUser.uid)
  );
  const isUserOnMic = mySeatIndex !== -1;
  const mySeat = isUserOnMic ? micSeats[mySeatIndex] : null;
  const isMuted = Boolean(mySeat?.isMuted);

  // Collect room participant IDs for WebRTC voice peer connections (memoized to prevent re-creation)
  const participantIds = useMemo(() => {
    return Array.from(new Set([
      room.hostId,
      ...micSeats.map(s => s.userId).filter(Boolean),
      ...roomMembers.map(m => m.userId).filter(Boolean)
    ])).filter(id => id && id !== currentUser.id && id !== currentUser.uid && id !== myUserId) as string[];
  }, [room.hostId, micSeats, roomMembers, currentUser.id, currentUser.uid, myUserId]);

  // Real-time automatic removal of disconnected or left peers
  const handlePeerLeave = useCallback(async (peerId: string) => {
    console.log('[LiveRoom] Peer left or disconnected:', peerId);
    if (!peerId) return;
    await removeMemberFromRoom(room.id, peerId);
  }, [room.id, removeMemberFromRoom]);

  // Real-time WebRTC Live Voice Chat hook (handles microphone, STUN, signaling, two-way audio, and cleanup)
  const { 
    unlockAudio, 
    speakingUserIds, 
    audioState, 
    signalingStatus,
    activePeersCount, 
    serverParticipants,
    peerDebugMap,
    debugEvents,
    micPermissionState,
    micErrorMessage,
    retryMicrophone,
    cleanupVoiceChat 
  } = useLiveVoiceChat({
    roomId: room.id,
    currentUser,
    isUserOnMic,
    isMuted,
    participantIds,
    onPeerLeave: handlePeerLeave,
  });

  // Unified participant list merging Host, roomMembers (Firestore), and serverParticipants (Signaling)
  const displayMembers = useMemo(() => {
    const map = new Map<string, RoomMember>();

    // 1. Host
    const isMeHost = room.hostId === currentUser.id || room.hostId === currentUser.uid;
    map.set(room.hostId, {
      id: room.hostId,
      userId: room.hostId,
      userName: isMeHost ? `${currentUser.displayName} (Host)` : (room.hostName || 'Host'),
      userAvatar: isMeHost ? (currentUser.avatar || '') : (room.hostAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'),
      userLevel: isMeHost ? (currentUser.level || 1) : (room.hostLevel || 1),
      role: 'owner',
      joinedAt: room.createdAt || new Date().toISOString()
    });

    // 2. Room members from Firestore subcollection
    roomMembers.forEach(m => {
      const uId = m.userId || m.id;
      if (uId) {
        map.set(uId, {
          ...m,
          id: uId,
          userId: uId
        });
      }
    });

    // 3. Server participants from signaling presence
    serverParticipants.forEach(p => {
      if (p.userId && !map.has(p.userId)) {
        map.set(p.userId, {
          id: p.userId,
          userId: p.userId,
          userName: p.userName || 'Member',
          userAvatar: p.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
          userLevel: 1,
          role: p.role || 'member',
          joinedAt: p.joinedAt || new Date().toISOString()
        });
      }
    });

    // 4. Also ensure currentUser is included
    const myId = String(currentUser.id || currentUser.uid);
    if (!map.has(myId)) {
      map.set(myId, {
        id: myId,
        userId: myId,
        userName: currentUser.displayName || 'You',
        userAvatar: currentUser.avatar || '',
        userLevel: currentUser.level || 1,
        role: room.hostId === myId ? 'owner' : 'member',
        joinedAt: new Date().toISOString()
      });
    }

    return Array.from(map.values());
  }, [room.hostId, room.hostName, room.hostAvatar, room.hostLevel, room.createdAt, roomMembers, serverParticipants, currentUser]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(shortId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleFollowHost = () => {
    followUser(room.hostId);
    setIsFollowing(true);
  };

  // Synchronized refs for stable event handlers
  const isUserOnMicRef = useRef(isUserOnMic);
  isUserOnMicRef.current = isUserOnMic;

  const mySeatIndexRef = useRef(mySeatIndex);
  mySeatIndexRef.current = mySeatIndex;

  const cleanupVoiceChatRef = useRef(cleanupVoiceChat);
  cleanupVoiceChatRef.current = cleanupVoiceChat;

  const leavePartySeatRef = useRef(leavePartySeat);
  leavePartySeatRef.current = leavePartySeat;

  const leaveRoomRef = useRef(leaveRoom);
  leaveRoomRef.current = leaveRoom;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Comprehensive user exit handler
  const handleLeave = useCallback(async () => {
    if (hasLeftRef.current) return;
    hasLeftRef.current = true;

    console.log('[LiveRoom] Leaving room cleanly:', room.id);
    try {
      cleanupVoiceChatRef.current?.();
      if (isUserOnMicRef.current && mySeatIndexRef.current !== -1) {
        await leavePartySeatRef.current?.(room.id, mySeatIndexRef.current);
      }
      await leaveRoomRef.current?.(room.id);
    } catch (e) {
      console.warn('[LiveRoom] Error during leave:', e);
    }
    onCloseRef.current?.();
  }, [room.id]);

  // Handle Browser / Android back button or gesture
  useEffect(() => {
    // Proactively unlock audio context and install global interaction listeners
    unlockAudio();
    setupGlobalMediaUnlock();

    window.history.pushState({ inLiveRoom: room.id }, '', window.location.href);

    const handlePopState = () => {
      console.log('[LiveRoom] Back button/gesture detected via popstate.');
      handleLeave();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [room.id, handleLeave, unlockAudio]);

  // Real-time presence heartbeat to detect active connection and prune disconnected users
  useEffect(() => {
    const currentUserId = String(currentUser.id || currentUser.uid || 'user');
    const sendHeartbeat = () => {
      try {
        setDoc(doc(db, 'liveRooms', room.id, 'members', currentUserId), {
          lastSeen: Date.now()
        }, { merge: true }).catch(() => {});
      } catch (e) {}
    };

    // Send immediately on entering
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [room.id, currentUser.id, currentUser.uid]);

  // Handle pagehide / beforeunload (refresh, close app, tab close) and final unmount
  useEffect(() => {
    const handleUnload = () => {
      console.log('[LiveRoom] Page unload / close detected.');
      try {
        // Send Beacon to backend immediately - works even if browser tab closes abruptly
        const payload = JSON.stringify({ userId: currentUser.id || currentUser.uid });
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon(`/api/rooms/${room.id}/leave`, payload);
        }
        cleanupVoiceChatRef.current?.();
        if (isUserOnMicRef.current && mySeatIndexRef.current !== -1) {
          leavePartySeatRef.current?.(room.id, mySeatIndexRef.current);
        }
        leaveRoomRef.current?.(room.id);
      } catch (e) {}
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      // ONLY clean up if user has actually triggered leave or true component destruction
      if (hasLeftRef.current) {
        try {
          cleanupVoiceChatRef.current?.();
        } catch (e) {}
      }
    };
  }, [room.id, currentUser.id, currentUser.uid]);

  const handleSeatClick = (seatIndex: number) => {
    unlockAudio();
    const seat = micSeats[seatIndex];
    if (!seat) return;

    if (seat.userId) {
      if (seat.userId === currentUser.id) {
        // Current user taps own seat -> open quick controls (leave / mute)
        setSelectedSeatModal(seatIndex);
      } else {
        // Taps someone else's seat -> offer gift or view
        setSelectedRecipient({ id: seat.userId, name: seat.userName || 'Member' });
        setShowGiftDrawer(true);
      }
    } else {
      // Empty mic seat clicked -> take mic seat
      takePartySeat(room.id, seatIndex);
    }
  };

  const handleJoinFirstAvailableMic = () => {
    unlockAudio();
    const firstEmptyIndex = micSeats.findIndex(s => !s.userId && !s.isLocked);
    if (firstEmptyIndex !== -1) {
      takePartySeat(room.id, firstEmptyIndex);
    } else {
      alert("All microphone seats are currently occupied!");
    }
  };

  const handleLeaveMic = () => {
    leavePartySeat(room.id, mySeatIndex);
    setSelectedSeatModal(null);
  };

  const handleToggleMute = () => {
    unlockAudio();
    mutePartySeat(room.id, mySeatIndex);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    sendMessage(room.hostId, inputMsg.trim(), room.id);
    setInputMsg('');
  };

  const handleSendGift = async (gift: GiftItem) => {
    const recipientId = selectedRecipient?.id || room.hostId;
    const recipientName = selectedRecipient?.name || room.hostName;

    const success = await sendGift(gift, recipientId, recipientName, room.id);
    if (success) {
      soundEffects.playGiftCelebration();
      setShowGiftDrawer(false);
    }
  };

  const handleTapHeart = () => {
    const newHeart = { id: Date.now() + Math.random(), left: 70 + Math.random() * 20 };
    setFlyingHearts(prev => [...prev.slice(-15), newHeart]);
    setTimeout(() => {
      setFlyingHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 1800);
  };

  const handleRollDice = () => {
    if (diceRolling) return;
    setDiceRolling(true);
    soundEffects.playDiceRoll();

    const roll = Math.floor(Math.random() * 6) + 1;
    setDiceResult(roll);

    setTimeout(() => {
      setDiceRolling(false);
      sendMessage(room.hostId, `🎲 Rolled a lucky ${roll}!`, room.id);
      setTimeout(() => setDiceResult(null), 3000);
    }, 800);
  };

  // Top mock audience members for the avatar stack
  const vipAudience = [
    { avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', border: 'border-yellow-400' },
    { avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', border: 'border-slate-300' },
    { avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100', border: 'border-amber-700' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#060814] flex justify-center items-center overflow-hidden select-none fixed-stable">
      
      {/* Mobile Frame Container (Responsive width & safe area padding) */}
      <div className="relative w-full max-w-md h-full max-h-[100dvh] flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#0e1026] via-[#090b1a] to-[#04060d] text-white shadow-2xl pt-[max(0.25rem,env(safe-area-inset-top))] pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        
        {/* ======================================================== */}
        {/* BACKGROUND ATMOSPHERE: Radial Spotlights, Nebula & Stars */}
        {/* ======================================================== */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Cover image blurred underlay */}
          <img 
            src={room.backgroundTheme || room.coverImage} 
            alt={room.title}
            className="w-full h-full object-cover filter brightness-[0.25] blur-2xl scale-110 opacity-40"
          />
          
          {/* Multi-layered cosmic gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/80 via-[#070919]/90 to-[#03050c]" />
          
          {/* Top radiant spotlight beam */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 -left-20 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -right-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Subtle Stage Floor Glow Reflection */}
          <div className="absolute top-[42%] left-1/2 -translate-x-1/2 w-[90%] h-44 bg-gradient-to-b from-cyan-400/5 via-teal-500/10 to-transparent rounded-[100%] blur-xl" />

          {/* Shimmering Star Sparkles */}
          <div className="absolute top-20 left-12 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-ping opacity-60" />
          <div className="absolute top-36 right-16 w-1 h-1 bg-amber-300 rounded-full animate-ping opacity-75" />
          <div className="absolute top-64 left-24 w-1 h-1 bg-purple-300 rounded-full animate-pulse opacity-50" />
          <div className="absolute top-80 right-28 w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse opacity-60" />
        </div>

        {/* Floating Animated Hearts */}
        <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
          {flyingHearts.map(h => (
            <div 
              key={h.id} 
              style={{ left: `${h.left}%` }}
              className="absolute bottom-20 text-2xl animate-float-heart"
            >
              💖
            </div>
          ))}
        </div>

        {/* 3D Lucky Dice Result Overlay */}
        {diceResult !== null && (
          <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
            <div className="p-5 rounded-3xl bg-slate-900/90 border-2 border-amber-400/80 shadow-[0_0_30px_rgba(251,191,36,0.6)] flex flex-col items-center animate-in zoom-in duration-200">
              <span className="text-5xl animate-bounce">🎲</span>
              <p className="text-lg font-black text-amber-300 mt-2">Lucky {diceResult}!</p>
              <span className="text-[10px] text-amber-200/80 uppercase tracking-widest font-bold">Star Roll</span>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 1. TOP HEADER: Host Capsule, Audience VIPs, Room Controls */}
        {/* ======================================================== */}
        <div className="relative z-20 px-2.5 sm:px-3 pt-1.5 sm:pt-2.5 pb-1 flex flex-col gap-1.5 sm:gap-2 shrink-0">
          
          <div className="flex items-center justify-between gap-1 sm:gap-2 min-w-0">
            
            {/* Host Profile Capsule (Glowing Golden Border & Crown) */}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-950/80 backdrop-blur-md p-1 pr-2 sm:pr-2.5 rounded-full border border-yellow-500/30 shadow-[0_0_12px_rgba(234,179,8,0.2)] min-w-0 flex-1 max-w-[200px] sm:max-w-none">
              
              {/* Host Avatar with Crown */}
              <div className="relative shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 shadow-md">
                  <img 
                    src={room.hostAvatar} 
                    alt={room.hostName} 
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="absolute -top-1.5 -left-1 text-[11px] sm:text-xs drop-shadow-md">
                  👑
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-slate-950 p-0.5 rounded-full border border-slate-950 shadow">
                  <Music2 size={7} className="animate-spin" />
                </div>
              </div>

              {/* Host Details */}
              <div className="min-w-0 pr-0.5 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] sm:text-xs font-black text-white truncate max-w-[70px] sm:max-w-[85px] drop-shadow-sm">
                    {room.hostName}
                  </span>
                </div>

                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[8px] sm:text-[9px] font-black text-amber-950 bg-gradient-to-r from-amber-300 to-yellow-400 px-1 sm:px-1.5 py-0.2 rounded-full shadow-sm shrink-0">
                    Lv.{room.hostLevel}
                  </span>

                  {/* Room ID with quick copy */}
                  <button 
                    onClick={handleCopyId}
                    className="flex items-center gap-0.5 text-[8px] sm:text-[9px] text-slate-400 hover:text-cyan-300 font-mono transition-colors truncate"
                    title="Copy Room ID"
                  >
                    <span>ID:{shortId}</span>
                    {copiedId ? <Check size={8} className="text-emerald-400 shrink-0" /> : <Copy size={8} className="shrink-0" />}
                  </button>
                </div>
              </div>

              {/* Follow Button */}
              {!isOwner && (
                <button 
                  onClick={handleFollowHost}
                  className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black transition-all active:scale-95 shadow-sm shrink-0 flex items-center gap-0.5 ${
                    isFollowing 
                      ? 'bg-slate-800 text-slate-400 border border-slate-700' 
                      : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:brightness-110 text-white shadow-pink-500/30'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <CheckCircle2 size={9} />
                      <span className="hidden xs:inline">Joined</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={9} />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}

            </div>

            {/* Right: VIP Audience Stack + Member Count + Settings + Close (ALWAYS VISIBLE, NO WRAP) */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 z-30">
              
              {/* VIP Contributor Avatars Cluster */}
              <div 
                onClick={() => setShowMembersDrawer(true)}
                className="hidden xs:flex items-center -space-x-2 cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                title="View VIP contributors"
              >
                {vipAudience.slice(0, 2).map((vip, i) => (
                  <img 
                    key={i} 
                    src={vip.avatar} 
                    alt="VIP" 
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border-2 ${vip.border} shadow-sm`}
                  />
                ))}
              </div>

              {/* WebRTC & Signaling Status / Debug Toggle Button */}
              <button
                id="room-webrtc-debug-btn"
                onClick={() => setShowDebugModal(true)}
                className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold transition-all shadow-sm active:scale-95 shrink-0 border ${
                  signalingStatus === 'connected'
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80'
                    : signalingStatus === 'reconnecting'
                    ? 'bg-amber-950/80 border-amber-500/50 text-amber-300 animate-pulse'
                    : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                }`}
                title="WebRTC Voice Inspector & Debug Mode"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  signalingStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : signalingStatus === 'reconnecting' ? 'bg-amber-400 animate-spin' : 'bg-rose-400'
                }`} />
                <Activity size={11} className={signalingStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400'} />
                <span className="capitalize hidden xs:inline">{signalingStatus}</span>
              </button>

              {/* Online Audience Count Capsule */}
              <button
                id="room-online-members-btn"
                onClick={() => setShowMembersDrawer(true)}
                className="flex items-center gap-0.5 sm:gap-1 bg-slate-900/90 border border-slate-700/80 px-2 sm:px-2.5 py-1 rounded-full text-xs font-bold text-slate-200 hover:text-white transition-all shadow-sm active:scale-95 shrink-0"
                title="View room members"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <Users size={11} className="text-emerald-400" />
                <span className="font-mono text-[10px] sm:text-[11px] font-bold">
                  {Math.max(displayMembers.length, roomMembers.length, serverParticipants.length + 1, room.viewerCount || 1)}
                </span>
              </button>

              {/* Room Owner Settings Gear */}
              {isOwner && (
                <button
                  id="room-manage-settings-btn"
                  onClick={() => setShowManageModal(true)}
                  className="p-1 sm:p-1.5 rounded-full bg-slate-900/90 border border-purple-500/40 text-purple-300 hover:text-white transition-colors shadow-sm active:scale-95 shrink-0"
                  title="Room Settings"
                >
                  <Settings size={14} />
                </button>
              )}

              {/* Leave Room Button - ALWAYS VISIBLE, NEVER CUT OFF OR HIDDEN */}
              <button
                id="room-leave-btn"
                onClick={handleLeave}
                className="p-1.5 sm:p-2 rounded-full bg-rose-600/20 border border-rose-500/80 text-rose-300 hover:text-white hover:bg-rose-600 transition-all shadow-[0_0_12px_rgba(244,63,94,0.4)] active:scale-95 shrink-0 z-30 flex items-center justify-center cursor-pointer"
                title="Leave Room"
                aria-label="Leave Room"
              >
                <X size={15} strokeWidth={2.5} />
              </button>

            </div>

          </div>

          {/* Room Title, Category & Heat Bar */}
          <div className="flex items-center justify-between gap-2 px-1">
            
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs shrink-0">{room.countryFlag || '🌐'}</span>
              <p className="text-xs font-bold text-slate-200 truncate drop-shadow-sm">{room.title}</p>
              {room.isPrivate && (
                <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1 rounded border border-amber-400/20 shrink-0">
                  <Lock size={9} /> Lock
                </span>
              )}
              {isOwner && (
                <button
                  id="room-quick-edit-title-btn"
                  onClick={() => setShowManageModal(true)}
                  className="p-1 rounded bg-white/10 hover:bg-white/20 text-teal-300 hover:text-white transition-colors shrink-0 flex items-center gap-1 text-[10px] font-semibold"
                  title="Edit Room Name & Thumbnail"
                >
                  <Pencil size={11} />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              )}
            </div>

            {/* Room Heat / Flame Points */}
            <div className="flex items-center gap-1 shrink-0 bg-slate-950/70 border border-amber-500/30 px-2 py-0.5 rounded-full">
              <Flame size={11} className="text-amber-400 fill-amber-400 animate-pulse" />
              <span className="font-mono text-[10px] font-black text-amber-300">
                {((room.viewerCount || 1) * 340 + 2400).toLocaleString()} Heat
              </span>
            </div>

          </div>

          {/* Golden VIP Announcement Ticker */}
          <div className="relative overflow-hidden px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-950/60 via-slate-950/80 to-amber-950/60 border border-amber-500/30 flex items-center gap-2 shadow-inner">
            <div className="p-1 rounded-lg bg-amber-400/20 text-amber-300 shrink-0">
              <Megaphone size={12} className="animate-bounce" />
            </div>
            
            <div className="overflow-hidden whitespace-nowrap w-full text-[11px] text-amber-200/90 font-medium">
              <span className="animate-marquee">
                {room.announcement || "✨ Welcome to the Voice Party! Be respectful on mic • Send gifts to support speakers! • StarLive Official"}
              </span>
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* 2. CENTER STAGE: 8 NUMBERED MICROPHONE SEATS (No.1 to 8) */}
        {/* ======================================================== */}
        <div className="relative z-20 my-auto py-2 px-3 max-h-full overflow-y-auto custom-scrollbar">
          
          {/* Microphone Permission Warning / Retry Banner */}
          {micErrorMessage && (
            <div className="mb-2.5 p-2.5 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-200 flex items-center justify-between gap-2 shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                <p className="text-[11px] font-medium truncate">{micErrorMessage}</p>
              </div>
              <button
                onClick={retryMicrophone}
                className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] shrink-0 active:scale-95 shadow transition-all"
              >
                Retry Mic
              </button>
            </div>
          )}

          {/* Decorative Stage Arc Lighting Frame */}
          <div className="relative rounded-3xl p-3 bg-slate-950/40 backdrop-blur-md border border-white/5 shadow-[0_0_25px_rgba(0,0,0,0.5)]">
            
            {/* Stage Title */}
            <div className="flex items-center justify-between px-1 mb-3">
              <div className="flex items-center gap-1.5 text-xs font-black tracking-wide text-cyan-300">
                <Radio size={14} className="text-emerald-400 animate-pulse" />
                <span className="uppercase text-[11px] tracking-wider">Audio Live Stage</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Sparkles size={10} className="text-cyan-400" />
                Tap seat to take mic
              </span>
            </div>

            {/* 2 Rows x 4 Columns = 8 Numbered Seats */}
            <div className="grid grid-cols-4 gap-y-3 sm:gap-y-4 gap-x-1 sm:gap-x-2">
              {micSeats.slice(0, 8).map((seat, idx) => {
                const seatNo = `No.${idx + 1}`;
                const isOccupied = !!seat.userId;
                const isMe = seat.userId === currentUser.id || seat.userId === currentUser.uid;
                const isSpeaking = isOccupied && !seat.isMuted && (speakingUserIds.has(seat.userId) || (isMe && !isMuted));

                return (
                  <div 
                    key={idx} 
                    id={`mic-seat-${idx}`}
                    className="flex flex-col items-center group relative min-w-0"
                  >
                    
                    {/* Interactive Circular Mic Button / Avatar */}
                    <div 
                      onClick={() => handleSeatClick(idx)}
                      className={`relative w-12 h-12 xs:w-13 xs:h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 select-none ${
                        isOccupied 
                          ? isSpeaking 
                            ? 'border-2 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.7)] scale-105 ring-2 ring-emerald-400/40' 
                            : 'border-2 border-emerald-500/70 shadow-[0_0_12px_rgba(16,185,129,0.25)] scale-100 hover:scale-105 active:scale-95' 
                          : 'border border-cyan-400/40 bg-gradient-to-b from-cyan-950/60 via-slate-900/90 to-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.2)] hover:border-cyan-300 hover:shadow-[0_0_18px_rgba(6,182,212,0.4)] active:scale-95'
                      }`}
                    >
                      {isOccupied ? (
                        <>
                          {/* Occupied: Profile Avatar */}
                          <img 
                            src={seat.userAvatar} 
                            alt={seat.userName || 'User'} 
                            className="w-full h-full rounded-full object-cover"
                          />

                          {/* Speaking Soundwave Halo (Animated Pulse when actively speaking) */}
                          {isSpeaking && (
                            <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-soundwave pointer-events-none" />
                          )}

                          {/* Mic Status Badge */}
                          {!seat.isMuted ? (
                            <div 
                              className={`absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full ${isSpeaking ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-500'} text-slate-950 flex items-center justify-center text-[9px] sm:text-[10px] font-black shadow-lg border border-slate-950`}
                              title="Speaking"
                            >
                              <Mic size={9} strokeWidth={3} />
                            </div>
                          ) : (
                            <div 
                              className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px] sm:text-[10px] shadow-lg border border-slate-950"
                              title="Muted"
                            >
                              <MicOff size={9} strokeWidth={2.5} />
                            </div>
                          )}

                          {/* Self Tag */}
                          {isMe && (
                            <div className="absolute -bottom-1 -left-1 px-1 sm:px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-[7px] sm:text-[8px] uppercase tracking-wider shadow">
                              YOU
                            </div>
                          )}
                        </>
                      ) : (
                        /* Empty Seat: Premium Circular Mic Button */
                        <div className="flex flex-col items-center justify-center">
                          {/* Inner metallic concentric ring */}
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900/90 border border-cyan-500/30 flex items-center justify-center group-hover:border-cyan-400 group-hover:bg-cyan-950/40 transition-colors shadow-inner">
                            <Mic size={15} strokeWidth={2.2} className="text-cyan-400 group-hover:text-cyan-200 transition-colors" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Seat Label & Number */}
                    <div className="mt-1 flex flex-col items-center max-w-[62px] sm:max-w-[76px] text-center">
                      {isOccupied ? (
                        <>
                          <p className="text-[10px] sm:text-[11px] font-bold text-slate-100 truncate w-full">
                            {seat.userName}
                          </p>
                          <span className="text-[8px] sm:text-[9px] text-amber-300 font-extrabold flex items-center gap-0.5">
                            {seatNo}
                          </span>
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] sm:text-[11px] font-black text-cyan-300 group-hover:text-cyan-100 transition-colors">
                            {seatNo}
                          </p>
                          <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium">
                            Join
                          </span>
                        </>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Connection Status Footnote */}
            <div className="mt-2.5 sm:mt-3 pt-2 border-t border-white/5 flex items-center justify-center text-center">
              {isUserOnMic ? (
                <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 sm:px-3 py-0.5 rounded-full font-bold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  <span className="truncate">
                    On Mic No.{mySeatIndex + 1} • {audioState === 'connected' ? 'Live Audio Connected' : audioState === 'requesting-permission' ? 'Requesting Mic...' : 'Connecting Audio...'}
                    {activePeersCount > 0 ? ` (${activePeersCount} ${activePeersCount === 1 ? 'peer' : 'peers'})` : ''}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                  Audience Mode • Tap any seat or press <span className="text-cyan-300 font-bold">"Join Mic"</span>
                  {activePeersCount > 0 && <span className="text-emerald-400 font-medium ml-1">({activePeersCount} listening)</span>}
                </span>
              )}
            </div>

            {/* Microphone Permission Recovery Banner */}
            {isUserOnMic && (micPermissionState === 'denied' || micPermissionState === 'error') && (
              <div className="mt-2.5 mx-auto max-w-sm bg-rose-950/90 border border-rose-500/70 rounded-xl p-2 text-rose-200 flex items-center justify-between gap-2 shadow-lg">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MicOff size={14} className="text-rose-400 shrink-0" />
                  <p className="text-[10px] sm:text-[11px] leading-tight text-rose-200 truncate">
                    Mic blocked. Allow mic in browser settings.
                  </p>
                </div>
                <button
                  onClick={() => retryMicrophone()}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[10px] shrink-0 active:scale-95 transition-all"
                >
                  Retry
                </button>
              </div>
            )}

          </div>

        </div>

        {/* ======================================================== */}
        {/* 3. BOTTOM CONTROLS BAR: Stable, Clamped, No-Jitter       */}
        {/* ======================================================== */}
        <div className="relative z-30 px-2 sm:px-3 py-1.5 sm:py-2.5 border-t border-white/10 bg-slate-950/95 backdrop-blur-md flex items-center justify-between gap-1 sm:gap-1.5 shrink-0 overflow-x-hidden">
          
          {/* Button 1: Live Chat Drawer Toggle */}
          <button
            id="room-open-chat-btn"
            onClick={() => setShowChatDrawer(true)}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 transition-all active:scale-95 shadow-md relative shrink-0"
            title="Open Room Chat"
          >
            <MessageCircle size={14} className="text-purple-400" />
            <span className="text-[11px] sm:text-xs font-bold">Chat</span>
            {roomMessages.length > 0 && (
              <span className="text-[9px] bg-purple-500 text-white font-black px-1 rounded-full">
                {roomMessages.length}
              </span>
            )}
          </button>

          {/* Button 2 & 3: Interactive Dice + Heart Reaction */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleRollDice}
              disabled={diceRolling}
              className="p-1.5 sm:p-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-amber-500/30 transition-all active:scale-95 shadow-md"
              title="Roll Lucky Star Dice"
            >
              <Dices size={15} className={diceRolling ? 'animate-spin text-amber-300' : ''} />
            </button>

            <button
              onClick={handleTapHeart}
              className="p-1.5 sm:p-2 rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 border border-pink-500/30 transition-all active:scale-125 shadow-md"
              title="Send Love Heart"
            >
              <Heart size={15} fill="#f43f5e" />
            </button>
          </div>

          {/* Button 4: Join Mic OR Speaker Controls (Mute / Leave) */}
          <div className="flex items-center gap-1 shrink-0">
            {isUserOnMic ? (
              <>
                {/* Mute/Unmute */}
                <button
                  onClick={handleToggleMute}
                  className={`p-1.5 sm:p-2 rounded-full border transition-all active:scale-95 shadow-md shrink-0 ${
                    mySeat?.isMuted 
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' 
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}
                  title={mySeat?.isMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {mySeat?.isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                </button>

                {/* Leave Mic */}
                <button
                  id="room-leave-mic-btn"
                  onClick={handleLeaveMic}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white font-black text-[11px] sm:text-xs flex items-center gap-1 shadow-md shadow-rose-600/20 active:scale-95 transition-all shrink-0"
                  title="Leave Microphone Seat"
                >
                  <LogOut size={12} />
                  <span>Leave</span>
                </button>
              </>
            ) : (
              /* Join Mic Button */
              <button
                id="room-join-mic-btn"
                onClick={handleJoinFirstAvailableMic}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 hover:brightness-110 text-slate-950 font-black text-[11px] sm:text-xs flex items-center gap-1 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all shrink-0"
                title="Join Microphone"
              >
                <Mic size={13} strokeWidth={2.8} />
                <span>Join</span>
              </button>
            )}

            {/* Button 5: Send Gift (3D Glowing Gift Box) */}
            <button
              id="room-gift-btn"
              onClick={() => {
                setSelectedRecipient({ id: room.hostId, name: room.hostName });
                setShowGiftDrawer(true);
              }}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 hover:brightness-110 text-slate-950 font-black text-[11px] sm:text-xs flex items-center gap-1 shadow-lg shadow-orange-500/30 active:scale-95 transition-all shrink-0"
              title="Send Gift"
            >
              <Gift size={13} strokeWidth={2.5} />
              <span>Gift</span>
            </button>
          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* DRAWER 1: SLIDE-UP CHAT DRAWER                           */}
      {/* ======================================================== */}
      {showChatDrawer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center p-0 animate-in fade-in">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl w-full max-w-md h-[65vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
            
            {/* Chat Drawer Header */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400">
                  <MessageCircle size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Room Live Chat
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                      {roomMessages.length}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400">Direct voice room communication</p>
                </div>
              </div>
              <button 
                onClick={() => setShowChatDrawer(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 transition-colors"
                title="Close chat"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Messages Feed */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar"
            >
              <div className="bg-slate-950/80 border border-cyan-500/20 rounded-2xl p-2.5 text-xs text-cyan-300 flex items-start gap-2">
                <Sparkles size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Welcome to {room.title}!</span> Respect mic speakers and enjoy the party!
                </div>
              </div>

              {roomMessages.map((msg) => (
                <div 
                  key={msg.id}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-2.5 text-xs text-slate-200 flex items-start gap-2.5 animate-in fade-in"
                >
                  <img 
                    src={msg.senderAvatar} 
                    alt={msg.senderName} 
                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-700" 
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-300 text-xs truncate">
                        {msg.senderName}
                      </span>
                      {msg.senderLevel && (
                        <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400 font-mono">
                          Lv.{msg.senderLevel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white break-words mt-0.5 leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}

              {roomMessages.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No messages yet. Say hello to everyone on mic!
                </div>
              )}
            </div>

            {/* Chat Input Field */}
            <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
              <input 
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Say something to the room..."
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-full px-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={!inputMsg.trim()}
                className="p-2 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold disabled:opacity-40 shadow-md transition-all active:scale-95"
              >
                <Send size={15} />
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SEAT CONTROLS (Mute / Leave for Current User)      */}
      {/* ======================================================== */}
      {selectedSeatModal !== null && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xs p-5 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center mb-3">
              <Mic size={22} />
            </div>

            <h3 className="text-base font-bold text-white mb-1">
              Mic No.{selectedSeatModal + 1}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              You are currently occupying this microphone seat
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  handleToggleMute();
                  setSelectedSeatModal(null);
                }}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-colors ${
                  mySeat?.isMuted 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : 'bg-slate-800 text-slate-200 border-slate-700'
                }`}
              >
                {mySeat?.isMuted ? <Mic size={15} /> : <MicOff size={15} />}
                <span>{mySeat?.isMuted ? 'Unmute Microphone' : 'Mute Microphone'}</span>
              </button>

              <button
                onClick={handleLeaveMic}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-rose-600/20"
              >
                <LogOut size={15} />
                <span>Leave Microphone Seat</span>
              </button>

              <button
                onClick={() => setSelectedSeatModal(null)}
                className="w-full py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER 2: MEMBERS LIST DRAWER                            */}
      {/* ======================================================== */}
      {showMembersDrawer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-0 animate-in fade-in">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl w-full max-w-md p-5 max-h-[75vh] flex flex-col animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Room Members ({displayMembers.length})
                </h3>
              </div>
              <button 
                onClick={() => setShowMembersDrawer(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-2 flex-1 custom-scrollbar">
              {displayMembers.map((member) => {
                const isHost = member.role === 'owner' || member.userId === room.hostId;
                const memberSeatIdx = micSeats.findIndex(s => s.userId === member.userId);

                return (
                  <div 
                    key={member.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={member.userAvatar} 
                        alt={member.userName} 
                        className="w-10 h-10 rounded-full object-cover border border-slate-700" 
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{member.userName}</span>
                          {isHost && (
                            <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 rounded font-black border border-amber-400/30">
                              👑 Host
                            </span>
                          )}
                          {memberSeatIdx !== -1 && (
                            <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 rounded font-bold border border-cyan-500/30">
                              Mic {memberSeatIdx + 1}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">Level {member.userLevel}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedRecipient({ id: member.userId, name: member.userName });
                        setShowMembersDrawer(false);
                        setShowGiftDrawer(true);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1"
                    >
                      <Gift size={12} />
                      <span>Gift</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER 3: GIFTS DRAWER                                   */}
      {/* ======================================================== */}
      {showGiftDrawer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-0 animate-in fade-in">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl w-full max-w-md p-5 max-h-[80vh] flex flex-col animate-in slide-in-from-bottom">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Gift size={18} className="text-amber-400" />
                  Send Gift to {selectedRecipient?.name || room.hostName}
                </h3>
                <p className="text-xs text-slate-400">Balance: <span className="text-amber-400 font-bold">{currentUser.coins} Coins</span></p>
              </div>
              <button 
                onClick={() => setShowGiftDrawer(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2.5 py-4 overflow-y-auto custom-scrollbar">
              {GIFTS_CATALOG.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleSendGift(g)}
                  className="flex flex-col items-center p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-400 hover:scale-105 active:scale-95 transition-all group"
                >
                  <span className="text-3xl mb-1 group-hover:scale-125 transition-transform">{g.icon}</span>
                  <span className="text-xs font-bold text-white truncate max-w-[65px]">{g.name}</span>
                  <span className="text-[10px] font-black text-amber-400 mt-0.5">🪙 {g.cost}</span>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Need more coins?</span>
              <button
                onClick={() => {
                  setShowGiftDrawer(false);
                  setShowRechargeModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-transform"
              >
                Top-Up Coins
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ROOM OWNER SETTINGS                               */}
      {/* ======================================================== */}
      {showManageModal && (
        <RoomManagementModal 
          room={room}
          isOpen={showManageModal}
          onClose={() => setShowManageModal(false)}
          onEndRoom={onClose}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL: WEBRTC & SIGNALING DEBUG INSPECTOR                */}
      {/* ======================================================== */}
      <WebRTCDebugModal
        isOpen={showDebugModal}
        onClose={() => setShowDebugModal(false)}
        roomId={room.id}
        signalingStatus={signalingStatus}
        micPermissionState={micPermissionState}
        micErrorMessage={micErrorMessage}
        serverParticipants={serverParticipants}
        peerDebugMap={peerDebugMap}
        debugEvents={debugEvents}
        speakingUserIds={speakingUserIds}
        onRetryMic={retryMicrophone}
        onUnlockAudio={unlockAudio}
      />

    </div>
  );
};
