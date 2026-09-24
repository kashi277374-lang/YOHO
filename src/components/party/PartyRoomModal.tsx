import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { LiveRoom, GiftItem, MicSeat } from '../../types';
import { GIFTS_CATALOG, MUSIC_TRACKS } from '../../data/mockData';
import { soundEffects } from '../../utils/audio';
import { 
  X, 
  Mic, 
  MicOff, 
  Music, 
  Volume2, 
  Gift, 
  Send, 
  Dices, 
  Sparkles, 
  Radio, 
  Smile, 
  LogOut,
  Play,
  Pause,
  ListMusic,
  Share2
} from 'lucide-react';

interface PartyRoomModalProps {
  room: LiveRoom;
  onClose: () => void;
}

export const PartyRoomModal: React.FC<PartyRoomModalProps> = ({ room, onClose }) => {
  const { 
    currentUser, 
    takePartySeat, 
    leavePartySeat, 
    mutePartySeat, 
    messages, 
    sendMessage, 
    sendGift,
    setShowRechargeModal
  } = useApp();

  const [inputMsg, setInputMsg] = useState('');
  const [showGiftDrawer, setShowGiftDrawer] = useState(false);
  const [selectedSeatForGift, setSelectedSeatForGift] = useState<{ id: string; name: string } | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [showMusicDrawer, setShowMusicDrawer] = useState(false);
  const [diceRolling, setDiceRolling] = useState(false);
  const [lastDiceRoll, setLastDiceRoll] = useState<number | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const roomMessages = messages.filter(m => m.roomId === room.id);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [roomMessages]);

  const seats = room.micSeats || [
    { seatIndex: 0, userId: room.hostId, userName: room.hostName, userAvatar: room.hostAvatar, userLevel: room.hostLevel, isMuted: false },
    { seatIndex: 1 },
    { seatIndex: 2 },
    { seatIndex: 3 },
    { seatIndex: 4 },
    { seatIndex: 5 },
    { seatIndex: 6 },
    { seatIndex: 7 }
  ];

  const mySeat = seats.find(s => s.userId === currentUser.id);

  const handleSeatClick = (seat: MicSeat) => {
    if (seat.userId === currentUser.id) {
      // Toggle mute or offer leave
      mutePartySeat(room.id, seat.seatIndex);
    } else if (!seat.userId) {
      // Empty seat - take it
      takePartySeat(room.id, seat.seatIndex);
      soundEffects.playCoinSound();
    } else {
      // Another user - target for gifting
      setSelectedSeatForGift({ id: seat.userId, name: seat.userName || 'User' });
      setShowGiftDrawer(true);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    sendMessage(room.hostId, inputMsg.trim(), room.id);
    setInputMsg('');
  };

  const handleSendGift = async (gift: GiftItem) => {
    const targetId = selectedSeatForGift?.id || room.hostId;
    const targetName = selectedSeatForGift?.name || room.hostName;
    await sendGift(gift, targetId, targetName, room.id);
  };

  const handleDiceRoll = () => {
    setDiceRolling(true);
    soundEffects.playDiceRoll();
    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setLastDiceRoll(roll);
      setDiceRolling(false);
      sendMessage(room.hostId, `🎲 rolled a ${roll}!`, room.id);
    }, 800);
  };

  const handleDjSound = (type: 'horn' | 'cheer' | 'clap') => {
    if (type === 'horn') soundEffects.playHorn();
    if (type === 'clap') soundEffects.playClap();
    if (type === 'cheer') soundEffects.playGiftCelebration();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between overflow-hidden">
      
      {/* Ambient Party Room Stage Lighting */}
      <div className="absolute inset-0 z-0 opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900 via-slate-950 to-slate-950" />

      {/* TOP BAR: Room Title, Host & Tools */}
      <div className="relative z-30 pt-3 px-3 flex items-center justify-between border-b border-purple-500/20 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-purple-900/80 border border-purple-400/40 p-1 flex items-center justify-center text-xl">
            🎉
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span>{room.title}</span>
              <span className="text-xs">{room.countryFlag}</span>
            </h3>
            <p className="text-[10px] text-purple-300 flex items-center gap-2">
              <span>Host: {room.hostName}</span>
              <span className="bg-purple-500/20 px-1.5 py-0.2 rounded text-[9px] font-bold">Party Room</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Music player toggle */}
          <button
            onClick={() => setShowMusicDrawer(!showMusicDrawer)}
            className={`p-2 rounded-full border transition-all ${
              isPlayingMusic 
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse' 
                : 'bg-slate-800 text-purple-300 border-slate-700'
            }`}
            title="Room Music"
          >
            <Music size={16} />
          </button>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center border border-slate-700"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* MUSIC CONTROLLER BAR (if active) */}
      {showMusicDrawer && (
        <div className="relative z-30 bg-purple-950/80 border-b border-purple-800/60 p-2.5 flex items-center justify-between px-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Volume2 size={16} className="text-emerald-400" />
            <span className="text-xs font-bold text-white">
              {MUSIC_TRACKS[currentTrackIdx].title} ({MUSIC_TRACKS[currentTrackIdx].artist})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlayingMusic(!isPlayingMusic)}
              className="p-1.5 rounded-full bg-emerald-400 text-slate-950 font-bold hover:bg-emerald-300"
            >
              {isPlayingMusic ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              onClick={() => setCurrentTrackIdx((prev) => (prev + 1) % MUSIC_TRACKS.length)}
              className="text-xs text-purple-200 hover:text-white underline font-medium"
            >
              Next Song
            </button>
          </div>
        </div>
      )}

      {/* MIDDLE: 8-SEAT MIC GRID */}
      <div className="relative z-10 flex-1 p-4 flex flex-col justify-center max-w-md mx-auto w-full">
        
        <div className="grid grid-cols-4 gap-3 mb-4">
          {seats.map((seat) => {
            const isTaken = !!seat.userId;
            const isMe = seat.userId === currentUser.id;

            return (
              <div 
                key={seat.seatIndex}
                onClick={() => handleSeatClick(seat)}
                className="cursor-pointer flex flex-col items-center group active:scale-95 transition-all"
              >
                {/* Avatar / Empty Mic Circle */}
                <div className="relative">
                  {isTaken ? (
                    <div className="relative">
                      <img 
                        src={seat.userAvatar} 
                        alt={seat.userName} 
                        className={`w-14 h-14 rounded-full object-cover border-2 shadow-lg transition-all ${
                          seat.isMuted 
                            ? 'border-slate-500 opacity-70' 
                            : 'border-emerald-400 ring-4 ring-emerald-400/20'
                        }`}
                      />
                      {/* Mic status badge */}
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] border border-slate-900 ${
                        seat.isMuted ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-slate-950 font-bold'
                      }`}>
                        {seat.isMuted ? <MicOff size={10} /> : <Mic size={10} />}
                      </div>
                      {/* Host Crown badge for Seat 0 */}
                      {seat.seatIndex === 0 && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs">
                          👑
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-slate-800/80 border-2 border-dashed border-purple-500/40 hover:border-purple-400 flex flex-col items-center justify-center text-purple-300 shadow-inner group-hover:scale-105 transition-transform">
                      <Mic size={18} className="opacity-60" />
                      <span className="text-[9px] font-bold mt-0.5 opacity-80">#{seat.seatIndex + 1}</span>
                    </div>
                  )}
                </div>

                {/* User Name / Seat Label */}
                <div className="mt-1.5 text-center max-w-[70px]">
                  <p className="text-[11px] font-bold text-white truncate">
                    {isTaken ? (isMe ? 'You' : seat.userName) : 'Take Mic'}
                  </p>
                  {isTaken && (
                    <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1 rounded font-mono font-bold">
                      Lv.{seat.userLevel || 10}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* My Mic Quick Controller if on seat */}
        {mySeat && (
          <div className="flex items-center justify-center gap-3 py-2 bg-slate-900/80 border border-purple-500/30 rounded-2xl mb-2 backdrop-blur-md">
            <button
              onClick={() => mutePartySeat(room.id, mySeat.seatIndex)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                mySeat.isMuted 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {mySeat.isMuted ? <MicOff size={13} /> : <Mic size={13} />}
              <span>{mySeat.isMuted ? 'Unmute' : 'Muted'}</span>
            </button>

            <button
              onClick={() => leavePartySeat(room.id, mySeat.seatIndex)}
              className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full text-xs font-bold"
            >
              <LogOut size={12} />
              <span>Leave Mic</span>
            </button>
          </div>
        )}

        {/* DJ SOUNDBOARD & MINI GAMES BAR */}
        <div className="flex items-center justify-around bg-slate-900/60 backdrop-blur-md p-2 rounded-2xl border border-slate-800">
          <button 
            onClick={() => handleDjSound('horn')}
            className="flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-xl transition-all active:scale-90"
          >
            📢 Horn
          </button>
          <button 
            onClick={() => handleDjSound('cheer')}
            className="flex items-center gap-1 text-[11px] font-bold text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 px-2 py-1 rounded-xl transition-all active:scale-90"
          >
            🎉 Cheer
          </button>
          <button 
            onClick={() => handleDjSound('clap')}
            className="flex items-center gap-1 text-[11px] font-bold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-2 py-1 rounded-xl transition-all active:scale-90"
          >
            👏 Clap
          </button>
          <button 
            onClick={handleDiceRoll}
            disabled={diceRolling}
            className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-xl transition-all active:scale-90"
          >
            <Dices size={13} className={diceRolling ? 'animate-spin' : ''} />
            <span>Dice {lastDiceRoll ? `[${lastDiceRoll}]` : ''}</span>
          </button>
        </div>

      </div>

      {/* BOTTOM CHAT & GIFT TRAY */}
      <div className="relative z-30 p-3 bg-slate-900/90 border-t border-slate-800/80 flex flex-col gap-2">
        {/* Chat message stream */}
        <div 
          ref={chatContainerRef}
          className="max-h-36 overflow-y-auto space-y-1.5 pr-1 no-scrollbar text-xs"
        >
          {roomMessages.map((msg) => (
            <div 
              key={msg.id}
              className={`rounded-xl px-2.5 py-1 backdrop-blur-sm max-w-[90%] inline-block ${
                msg.type === 'gift' 
                  ? 'bg-gradient-to-r from-purple-900/50 to-amber-900/40 border border-amber-400/30 text-amber-200' 
                  : 'bg-slate-800/70 text-slate-200'
              }`}
            >
              <span className="font-bold text-purple-300 mr-1.5">{msg.senderName}:</span>
              <span>{msg.content}</span>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSendChat} className="flex-1 flex items-center bg-slate-800/80 rounded-full border border-slate-700/60 px-3 py-1.5">
            <input 
              type="text"
              placeholder="Chat with party members..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-slate-400 w-full focus:outline-none"
            />
            <button type="submit" className="text-purple-400 p-1 hover:text-purple-300">
              <Send size={15} />
            </button>
          </form>

          <button
            onClick={() => {
              setSelectedSeatForGift(null);
              setShowGiftDrawer(true);
            }}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-950 flex items-center justify-center shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95"
            title="Send Gift"
          >
            <Gift size={20} />
          </button>
        </div>
      </div>

      {/* GIFT DRAWER */}
      {showGiftDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-4 max-w-md mx-auto w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Gift size={16} className="text-amber-400" />
                Send Gift {selectedSeatForGift ? `to ${selectedSeatForGift.name}` : `to ${room.hostName}`}
              </h3>
              <button 
                onClick={() => {
                  setShowGiftDrawer(false);
                  setShowRechargeModal(true);
                }}
                className="bg-amber-400/20 text-amber-300 px-2.5 py-1 rounded-full text-xs font-bold"
              >
                🪙 {currentUser.coins.toLocaleString()}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2.5 py-4">
              {GIFTS_CATALOG.map((gift) => (
                <button
                  key={gift.id}
                  onClick={() => handleSendGift(gift)}
                  className="flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 transition-all active:scale-95"
                >
                  <span className="text-2xl mb-1">{gift.icon}</span>
                  <span className="text-[11px] font-bold text-white truncate max-w-[65px]">{gift.name}</span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">🪙 {gift.cost}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowGiftDrawer(false)}
              className="w-full py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
