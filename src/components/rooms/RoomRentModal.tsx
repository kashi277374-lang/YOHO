import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Sparkles, 
  Crown, 
  ShieldCheck, 
  Clock, 
  Check, 
  Coins, 
  Radio, 
  Calendar,
  Zap,
  ArrowRight
} from 'lucide-react';
import { soundEffects } from '../../utils/audio';
import confetti from 'canvas-confetti';

interface RoomRentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoomRentModal: React.FC<RoomRentModalProps> = ({ isOpen, onClose }) => {
  const { 
    currentUser, 
    roomRents, 
    rentRoom, 
    joinRoom,
    liveRooms,
    setShowRechargeModal 
  } = useApp();

  const [selectedPlan, setSelectedPlan] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [roomTitle, setRoomTitle] = useState(`${currentUser.displayName}'s VIP Lounge 👑`);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Find user's active rented room
  const currentUserId = currentUser.id || currentUser.uid;
  const userActiveRent = roomRents.find(
    r => (r.userId === currentUserId || r.userName === currentUser.displayName) && r.status === 'active'
  );
  const rentedLiveRoom = userActiveRent 
    ? liveRooms.find(r => r.id === userActiveRent.roomId) 
    : null;

  const plans = [
    {
      id: 'daily' as const,
      name: '1 Day Pass',
      duration: '24 Hours',
      price: 2000,
      badge: 'Starter',
      benefits: ['Instant 8-mic party room', 'Public room discovery', 'Standard voice server']
    },
    {
      id: 'weekly' as const,
      name: '7 Days VIP',
      duration: '7 Days',
      price: 12000,
      badge: 'Popular',
      popular: true,
      benefits: ['Priority feed placement', 'Golden VIP room badge', 'Lossless WebRTC audio', 'Custom room background']
    },
    {
      id: 'monthly' as const,
      name: '30 Days Royalty',
      duration: '1 Month',
      price: 35000,
      badge: 'Best Value',
      benefits: ['Top of Popular feed banner', 'Exclusive Royalty Crown badge', 'Unlimited audience capacity', '24/7 Room preservation']
    }
  ];

  const currentPlan = plans.find(p => p.id === selectedPlan) || plans[2];
  const canAfford = currentUser.coins >= currentPlan.price;

  const handleConfirmRent = async () => {
    if (!canAfford) {
      setShowRechargeModal(true);
      return;
    }

    setIsProcessing(true);
    setFeedbackMsg(null);

    try {
      soundEffects.playCoinSound();
      confetti({ particleCount: 60, spread: 70 });
      const room = await rentRoom(roomTitle.trim() || `${currentUser.displayName}'s VIP Room`, selectedPlan);
      setIsProcessing(false);
      onClose();
      // Join rented room immediately
      if (room) {
        await joinRoom(room);
      }
    } catch (e: any) {
      console.error("Rent room error:", e);
      setIsProcessing(false);
      setFeedbackMsg("Failed to complete room rent. Please try again.");
    }
  };

  const handleEnterExistingRentedRoom = async () => {
    if (rentedLiveRoom) {
      await joinRoom(rentedLiveRoom);
      onClose();
    } else if (userActiveRent) {
      const fallbackRoom = liveRooms.find(r => r.id === userActiveRent.roomId);
      if (fallbackRoom) {
        await joinRoom(fallbackRoom);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl relative text-white flex flex-col max-h-[92vh] overflow-y-auto"
        id="room-rent-modal-card"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="Close"
          id="close-room-rent-modal-btn"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
            <Crown size={26} strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                VIP Room Rent
              </h2>
              <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                Official
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Rent high-performance audio rooms with VIP host privileges
            </p>
          </div>
        </div>

        {/* Active Rent Notification if user already has an active rented room */}
        {userActiveRent && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wide block">
                Active Room Rental
              </span>
              <p className="text-xs font-bold text-white truncate">
                {userActiveRent.roomTitle}
              </p>
              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Clock size={11} className="text-amber-400" />
                <span>Expires: {new Date(userActiveRent.expiresDate).toLocaleDateString()}</span>
              </p>
            </div>

            <button
              id="rent-enter-room-btn"
              onClick={handleEnterExistingRentedRoom}
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-300 active:scale-95 transition-all shrink-0 flex items-center gap-1 shadow-sm"
            >
              <span>Enter</span>
              <ArrowRight size={13} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Room Title Input */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Room Name
          </label>
          <input
            type="text"
            value={roomTitle}
            onChange={(e) => setRoomTitle(e.target.value)}
            placeholder="e.g. Islamabad VIP Audio Club"
            maxLength={60}
            className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Plan Selection Cards */}
        <div className="space-y-2 mb-4">
          <label className="block text-xs font-bold text-slate-300">
            Select Rental Period
          </label>
          <div className="grid grid-cols-3 gap-2">
            {plans.map((p) => {
              const isSelected = selectedPlan === p.id;
              return (
                <div
                  key={p.id}
                  id={`rent-plan-${p.id}`}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`cursor-pointer rounded-2xl p-2.5 sm:p-3 border text-center transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 shadow-md shadow-amber-500/10'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                      HOT
                    </span>
                  )}
                  <div>
                    <h3 className="text-xs font-bold text-white mb-0.5">{p.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono">{p.duration}</p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800/80">
                    <span className="text-xs font-black text-amber-300 font-mono block">
                      {p.price.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400">Coins</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Benefits Checklist */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 mb-5 space-y-1.5">
          <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block mb-1">
            Included Privileges
          </span>
          {currentPlan.benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check size={11} strokeWidth={3} />
              </div>
              <span className="text-[11.5px]">{b}</span>
            </div>
          ))}
        </div>

        {/* Coin Balance Check */}
        <div className="flex items-center justify-between text-xs mb-4 px-1">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Coins size={14} className="text-amber-400" />
            <span>Your Balance:</span>
          </div>
          <span className={`font-mono font-black ${canAfford ? 'text-amber-300' : 'text-rose-400'}`}>
            {currentUser.coins.toLocaleString()} Coins
          </span>
        </div>

        {feedbackMsg && (
          <p className="text-xs text-rose-400 font-bold mb-3 text-center">{feedbackMsg}</p>
        )}

        {/* Action Button */}
        <div className="mt-auto">
          {canAfford ? (
            <button
              id="confirm-rent-room-btn"
              onClick={handleConfirmRent}
              disabled={isProcessing}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm hover:brightness-110 active:scale-98 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Zap size={16} fill="currentColor" />
              <span>
                {isProcessing 
                  ? 'Activating VIP Room...' 
                  : userActiveRent 
                    ? `Renew Rental (${currentPlan.price.toLocaleString()} Coins)` 
                    : `Rent Room Now (${currentPlan.price.toLocaleString()} Coins)`}
              </span>
            </button>
          ) : (
            <button
              id="recharge-for-rent-btn"
              onClick={() => {
                onClose();
                setShowRechargeModal(true);
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs sm:text-sm hover:brightness-110 active:scale-98 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Coins size={16} />
              <span>Insufficient Coins • Recharge Now</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
