import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { LiveRoom, GiftItem } from '../../types';
import { GIFTS_CATALOG } from '../../data/mockData';
import { 
  X, 
  Heart, 
  Send, 
  Gift, 
  Share2, 
  Flag, 
  Volume2, 
  VolumeX, 
  Eye, 
  UserPlus, 
  Check, 
  Sparkles,
  ShieldAlert,
  Coins
} from 'lucide-react';

interface LiveRoomModalProps {
  room: LiveRoom;
  onClose: () => void;
}

interface FloatingHeart {
  id: number;
  x: number;
  color: string;
}

export const LiveRoomModal: React.FC<LiveRoomModalProps> = ({ room, onClose }) => {
  const { 
    currentUser, 
    sendGift, 
    messages, 
    sendMessage, 
    followUser, 
    allUsers, 
    submitReport, 
    setShowRechargeModal 
  } = useApp();

  const [inputMsg, setInputMsg] = useState('');
  const [showGiftDrawer, setShowGiftDrawer] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [roomLikes, setRoomLikes] = useState(room.likes || 120);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Filter messages for this room
  const roomMessages = messages.filter(m => m.roomId === room.id || m.receiverId === room.hostId);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [roomMessages]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    sendMessage(room.hostId, inputMsg.trim(), room.id);
    setInputMsg('');
  };

  const handleLike = () => {
    setRoomLikes(prev => prev + 1);
    const colors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#fbbf24'];
    const newHeart: FloatingHeart = {
      id: Date.now() + Math.random(),
      x: 60 + Math.random() * 40,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    setFloatingHearts(prev => [...prev.slice(-15), newHeart]);

    // Cleanup heart after 2s
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 2000);
  };

  const handleSendGift = async (gift: GiftItem) => {
    const success = await sendGift(gift, room.hostId, room.hostName, room.id);
    if (success) {
      handleLike();
    }
  };

  const [reportSubmittedToast, setReportSubmittedToast] = useState(false);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason) return;
    submitReport('room', room.id, room.title, reportReason);
    setShowReportModal(false);
    setReportReason('');
    setReportSubmittedToast(true);
    setTimeout(() => setReportSubmittedToast(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden">
      
      {/* Background Live Stream simulation (Cover image with animated pulse & video glow) */}
      <div className="absolute inset-0 z-0">
        <img 
          src={room.coverImage} 
          alt={room.title}
          className="w-full h-full object-cover brightness-75 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />
      </div>

      {/* Floating Hearts Layer */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {floatingHearts.map(heart => (
          <div
            key={heart.id}
            className="absolute bottom-24 transition-all duration-1000 ease-out animate-bounce"
            style={{
              left: `${heart.x}%`,
              transform: 'translateY(-180px) scale(1.3)',
              opacity: 0.9,
              transition: 'all 1.5s cubic-bezier(0.25, 1, 0.5, 1)'
            }}
          >
            <Heart size={28} style={{ fill: heart.color, color: heart.color }} />
          </div>
        ))}
      </div>

      {/* TOP BAR: Host Info & Viewers & Close */}
      <div className="relative z-30 pt-3 px-3 flex items-center justify-between">
        {reportSubmittedToast && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-emerald-500/50 text-emerald-300 text-xs px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <span className="text-emerald-400">✓</span> Report submitted to StarLive Trust & Safety
          </div>
        )}
        
        {/* Host Info Pill */}
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md p-1 pr-3 rounded-full border border-white/10">
          <img 
            src={room.hostAvatar} 
            alt={room.hostName} 
            className="w-9 h-9 rounded-full object-cover border-2 border-emerald-400"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-white truncate max-w-[100px]">
                {room.hostName}
              </span>
              <span className="text-xs">{room.countryFlag}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-300">
              <span className="bg-amber-400/30 text-amber-300 px-1 rounded font-bold">
                Lv.{room.hostLevel}
              </span>
              <span>❤️ {roomLikes}</span>
            </div>
          </div>

          <button
            id="follow-host-btn"
            onClick={() => {
              if (!isFollowing) {
                followUser(room.hostId);
                setIsFollowing(true);
              }
            }}
            className={`ml-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
              isFollowing 
                ? 'bg-white/20 text-white' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/30'
            }`}
          >
            {isFollowing ? <Check size={12} /> : '+ Follow'}
          </button>
        </div>

        {/* Right Controls: Viewers, Report, Close */}
        <div className="flex items-center gap-2">
          <div className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1 border border-white/10">
            <Eye size={12} className="text-emerald-400" />
            <span>{room.viewerCount}</span>
          </div>

          <button
            id="report-room-btn"
            onClick={() => setShowReportModal(true)}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-slate-300 hover:text-white flex items-center justify-center border border-white/10"
            title="Report Room"
          >
            <Flag size={14} />
          </button>

          <button
            id="close-live-room-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/90 flex items-center justify-center border border-white/20"
          >
            <X size={18} />
          </button>
        </div>

      </div>

      {/* Middle Interactive Tap Area for Double-Tap Likes */}
      <div 
        className="relative z-10 flex-1 flex items-center justify-center cursor-pointer"
        onClick={handleLike}
      >
        {/* Subtle center watermarks or PK status */}
        <div className="text-center bg-black/30 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/5 pointer-events-none">
          <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-xs">
            <Sparkles size={14} />
            <span>{room.title}</span>
          </div>
          <span className="text-[10px] text-slate-300">Tap screen anywhere to send hearts ❤️</span>
        </div>
      </div>

      {/* BOTTOM SECTION: Live Chat & Controls */}
      <div className="relative z-30 p-3 flex flex-col gap-2.5 bg-gradient-to-t from-black via-black/80 to-transparent">
        
        {/* Chat message stream */}
        <div 
          ref={chatContainerRef}
          className="max-h-48 overflow-y-auto space-y-1.5 pr-2 no-scrollbar"
        >
          {/* System welcome */}
          <div className="bg-emerald-950/60 border border-emerald-500/20 backdrop-blur-sm rounded-xl px-2.5 py-1 text-xs text-emerald-300 inline-block max-w-[85%]">
            👋 Welcome to {room.hostName}'s live stream! Please maintain community guidelines.
          </div>

          {roomMessages.map((msg) => (
            <div 
              key={msg.id}
              className={`rounded-xl px-2.5 py-1 text-xs backdrop-blur-sm max-w-[90%] inline-block ${
                msg.type === 'gift' 
                  ? 'bg-gradient-to-r from-amber-500/40 to-yellow-500/30 border border-amber-400/40 text-amber-200'
                  : 'bg-black/50 text-white'
              }`}
            >
              <span className="font-bold text-amber-300 mr-1.5">
                {msg.senderName}:
              </span>
              <span>{msg.content}</span>
            </div>
          ))}
        </div>

        {/* Input & Action Bar */}
        <div className="flex items-center gap-2">
          {/* Chat Form */}
          <form onSubmit={handleSendChat} className="flex-1 flex items-center bg-black/60 backdrop-blur-md rounded-full border border-white/20 px-3 py-1.5">
            <input 
              id="live-chat-input"
              type="text"
              placeholder="Say something nice..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-slate-400 w-full focus:outline-none"
            />
            <button type="submit" className="text-emerald-400 p-1 hover:text-emerald-300">
              <Send size={15} />
            </button>
          </form>

          {/* Send Gift Button */}
          <button
            id="open-gift-tray-btn"
            onClick={() => setShowGiftDrawer(true)}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-950 flex items-center justify-center shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all"
            title="Send Gift"
          >
            <Gift size={20} />
          </button>

          {/* Like Heart Button */}
          <button
            id="like-heart-btn"
            onClick={handleLike}
            className="w-10 h-10 rounded-full bg-rose-500/80 backdrop-blur-md text-white flex items-center justify-center shadow-lg shadow-rose-500/30 hover:scale-110 active:scale-95 transition-all"
            title="Send Hearts"
          >
            <Heart size={20} className="fill-white" />
          </button>
        </div>

      </div>

      {/* GIFT DRAWER MODAL */}
      {showGiftDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-4 max-w-md mx-auto w-full shadow-2xl animate-in slide-in-from-bottom">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Gift size={18} className="text-amber-400" />
                <h3 className="text-sm font-bold text-white">Send Gifts to {room.hostName}</h3>
              </div>

              {/* Coins pill with Recharge trigger */}
              <button 
                onClick={() => {
                  setShowGiftDrawer(false);
                  setShowRechargeModal(true);
                }}
                className="flex items-center gap-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 px-2.5 py-1 rounded-full text-xs font-bold"
              >
                <span>🪙 {currentUser.coins.toLocaleString()}</span>
                <span className="text-[10px] bg-amber-400 text-amber-950 px-1 rounded font-black">Top-Up</span>
              </button>
            </div>

            {/* Gift Grid */}
            <div className="grid grid-cols-4 gap-2.5 py-4">
              {GIFTS_CATALOG.map((gift) => {
                const canAfford = currentUser.coins >= gift.cost;
                return (
                  <button
                    key={gift.id}
                    onClick={() => handleSendGift(gift)}
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all active:scale-95 ${
                      canAfford 
                        ? 'bg-slate-800/80 border-slate-700/60 hover:border-amber-400 hover:bg-slate-800 text-white' 
                        : 'bg-slate-800/40 border-slate-800 opacity-60 text-slate-400'
                    }`}
                  >
                    <span className="text-2xl mb-1">{gift.icon}</span>
                    <span className="text-[11px] font-bold truncate max-w-[65px]">{gift.name}</span>
                    <span className="text-[10px] font-mono text-amber-400 font-bold flex items-center gap-0.5">
                      🪙 {gift.cost}
                    </span>
                  </button>
                );
              })}
            </div>

            <button 
              onClick={() => setShowGiftDrawer(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* REPORT ROOM MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-4 relative">
            <button 
              onClick={() => setShowReportModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-2 mb-3 text-rose-400">
              <ShieldAlert size={20} />
              <h4 className="text-sm font-bold text-white">Report Live Stream</h4>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Reporting "{room.title}" by {room.hostName}. Please select the violation reason:
            </p>
            <form onSubmit={handleReportSubmit} className="space-y-3">
              <select 
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none"
              >
                <option value="">-- Select Reason --</option>
                <option value="Inappropriate Content / Nudity">Inappropriate Content / Nudity</option>
                <option value="Harassment or Hate Speech">Harassment or Hate Speech</option>
                <option value="Copyright Infringement">Copyright Infringement</option>
                <option value="Spam or Scams">Spam or Scams</option>
                <option value="Dangerous Behavior">Dangerous Behavior</option>
              </select>
              <button 
                type="submit"
                className="w-full py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl text-xs"
              >
                Submit Report
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
