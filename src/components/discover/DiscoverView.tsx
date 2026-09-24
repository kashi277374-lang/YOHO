import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LiveRoom } from '../../types';
import { RoomCard } from '../rooms/RoomCard';
import { 
  Sparkles, 
  X, 
  Gift, 
  Crown, 
  Trophy, 
  Users, 
  Heart, 
  Radio, 
  ChevronRight,
  Flame,
  History,
  Clock,
  Plus,
  Home,
  Zap
} from 'lucide-react';

interface DiscoverViewProps {
  onOpenRoom?: (room: LiveRoom) => void;
  onSelectRoom?: (room: LiveRoom) => void;
  onCreateRoom?: () => void;
  homeSubTab?: 'popular' | 'mine';
  onSubTabChange?: (tab: 'popular' | 'mine') => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({ 
  onOpenRoom, 
  onSelectRoom, 
  onCreateRoom,
  homeSubTab = 'popular',
  onSubTabChange
}) => {
  const { 
    liveRooms, 
    recentRooms,
    currentUser,
    selectedCategory, 
    setSelectedCategory, 
    selectedCountry, 
    allUsers,
    claimDailyBonus,
    setActiveRoom,
    setIsCreateRoomModalOpen,
    myRoom,
    joinRoom,
    setIsRoomRentModalOpen,
    roomRents
  } = useApp();

  const handleOpenRoom = (room: LiveRoom) => {
    if (onOpenRoom) {
      onOpenRoom(room);
    } else if (onSelectRoom) {
      onSelectRoom(room);
    } else if (setActiveRoom) {
      setActiveRoom(room);
    }
  };

  const handleCreateRoom = () => {
    if (onCreateRoom) {
      onCreateRoom();
    } else if (setIsCreateRoomModalOpen) {
      setIsCreateRoomModalOpen(true);
    }
  };

  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showCpModal, setShowCpModal] = useState(false);
  const [showRecallEventModal, setShowRecallEventModal] = useState(false);

  const categories = [
    { id: 'Popular', label: '🔥 Popular' },
    { id: 'Game', label: 'Game' },
    { id: 'Video/Music', label: 'Video/Music' },
    { id: 'PK Event', label: 'PK Event' },
    { id: 'Party', label: 'Party' }
  ];

  // Filter rooms based on active category
  const filteredRooms = liveRooms.filter(room => {
    if (room.status === 'ended') return false;
    const matchesCategory = selectedCategory === 'Popular' ? true : (
      selectedCategory === 'Party' ? room.isParty : 
      room.category === selectedCategory || room.tags?.includes(selectedCategory)
    );
    const matchesCountry = selectedCountry === 'All' ? true : room.country === selectedCountry;
    return matchesCategory && matchesCountry;
  });

  return (
    <div className="pb-28 pt-2.5 px-2.5 sm:px-3 w-full max-w-md mx-auto bg-white min-h-screen">
      
      {/* 1. Promotional Banner (Exact Match: "Recall Friends To Get Coins" 15/09 ~ 15/10) */}
      <div className="relative mb-3.5 rounded-2xl overflow-hidden shadow-md active:scale-[0.99] transition-transform w-full">
        <div 
          onClick={() => setShowRecallEventModal(true)}
          className="cursor-pointer relative min-h-[120px] sm:h-32 rounded-2xl overflow-hidden bg-gradient-to-r from-[#e5a024] via-[#f59e0b] to-[#b45309] p-2.5 sm:p-3 flex flex-col justify-between w-full"
        >
          {/* Decorative Gold Glow & Confetti */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-yellow-200/30 rounded-full blur-xl pointer-events-none" />
          
          {/* Header 3D text with friends */}
          <div className="flex items-center justify-between z-10 w-full gap-1">
            <div className="flex-1 min-w-0 pr-1">
              <h2 className="text-base min-[360px]:text-lg sm:text-2xl font-black text-white tracking-tight drop-shadow-[0_2px_4px_rgba(113,63,18,0.8)] leading-tight break-words">
                Recall Friends<br />To Get Coins
              </h2>
              <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs font-bold text-amber-100">
                <span className="font-mono bg-black/20 px-1.5 py-0.5 rounded text-amber-200 whitespace-nowrap">15/09 ~ 15/10</span>
              </div>
            </div>

            {/* Illustrative friendly characters & coins */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
              <img 
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80" 
                alt="Friend"
                className="w-11 h-11 sm:w-14 sm:h-14 rounded-full border-2 border-yellow-200 object-cover shadow-lg absolute right-1 top-1"
              />
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80" 
                alt="Friend"
                className="w-9 h-9 sm:w-12 sm:h-12 rounded-full border-2 border-yellow-200 object-cover shadow-lg absolute left-1 bottom-1 z-10"
              />
              <div className="absolute -top-1 left-2 text-base sm:text-xl drop-shadow">🪙</div>
              <div className="absolute bottom-0 right-2 text-sm sm:text-lg drop-shadow">✨</div>
            </div>
          </div>

          {/* Dots Pagination */}
          <div className="flex items-center justify-center gap-1 z-10 mt-1">
            {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
              <span 
                key={idx} 
                className={`h-1.5 rounded-full transition-all ${
                  idx === 0 ? 'w-3.5 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 2. Top 3 Feature Cards (Ranking, Family, CP/Friend - Exact Match to Reference Photo) */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 mb-3.5 w-full">
        
        {/* Ranking Card (Cyan Gradient with Top 1, 2, 3 Podium Avatars) */}
        <div 
          id="feature-ranking-card"
          onClick={() => setShowRankingModal(true)}
          className="cursor-pointer bg-gradient-to-b from-[#25e2d9] to-[#04bfbb] rounded-2xl p-1.5 sm:p-2 flex flex-col items-center justify-between text-white shadow-sm active:scale-95 transition-all relative h-26 sm:h-28 min-w-0 overflow-hidden"
        >
          <span className="text-[10.5px] min-[360px]:text-[11px] sm:text-xs font-black tracking-tight text-white drop-shadow-sm truncate w-full text-center">
            Ranking
          </span>

          <div className="flex items-end justify-center -space-x-1 sm:-space-x-1.5 mb-1 max-w-full">
            {/* Top 2 */}
            <div className="relative flex flex-col items-center shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80" 
                alt="Top 2" 
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-sky-200 object-cover"
              />
              <span className="bg-sky-500 text-[6.5px] sm:text-[7px] font-black px-0.5 sm:px-1 rounded-xs text-white mt-0.5 leading-tight">
                TOP2
              </span>
            </div>

            {/* Top 1 */}
            <div className="relative z-10 flex flex-col items-center -mb-1 shrink-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-yellow-300 p-0.5 bg-amber-400/30">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80" 
                  alt="Top 1" 
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span className="bg-amber-400 text-[7px] sm:text-[8px] font-black px-0.5 sm:px-1 rounded-xs text-amber-950 mt-0.5 leading-tight shadow-sm">
                TOP1
              </span>
            </div>

            {/* Top 3 */}
            <div className="relative flex flex-col items-center shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop&q=80" 
                alt="Top 3" 
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-purple-200 object-cover"
              />
              <span className="bg-purple-600 text-[6.5px] sm:text-[7px] font-black px-0.5 sm:px-1 rounded-xs text-white mt-0.5 leading-tight">
                TOP3
              </span>
            </div>
          </div>
        </div>

        {/* Family Card (Warm Gold Gradient with Hexagon & Members) */}
        <div 
          id="feature-family-card"
          onClick={() => setShowFamilyModal(true)}
          className="cursor-pointer bg-gradient-to-b from-[#ffcf33] to-[#ff9800] rounded-2xl p-1.5 sm:p-2 flex flex-col items-center justify-between text-white shadow-sm active:scale-95 transition-all relative h-26 sm:h-28 min-w-0 overflow-hidden"
        >
          <span className="text-[10.5px] min-[360px]:text-[11px] sm:text-xs font-black tracking-tight text-white drop-shadow-sm truncate w-full text-center">
            Family
          </span>

          <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-1 max-w-full">
            {/* Hexagon TOP 3 Clan */}
            <div className="relative flex flex-col items-center shrink-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg overflow-hidden border border-white shadow-sm bg-teal-900/30">
                <img 
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&auto=format&fit=crop&q=80" 
                  alt="Clan" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="bg-emerald-500 text-[6.5px] sm:text-[7px] font-black px-0.5 sm:px-1 rounded-xs text-white mt-0.5 leading-tight">
                TOP3
              </span>
            </div>

            {/* Clan Members */}
            <div className="grid grid-cols-2 gap-0.5 shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80" 
                alt="Member" 
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-white object-cover"
              />
              <img 
                src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=60&auto=format&fit=crop&q=80" 
                alt="Member" 
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-white object-cover"
              />
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&auto=format&fit=crop&q=80" 
                alt="Member" 
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-white object-cover"
              />
              <img 
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&auto=format&fit=crop&q=80" 
                alt="Member" 
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-white object-cover"
              />
            </div>
          </div>
        </div>

        {/* CP / Friend Card (Bright Pink Gradient with Twin Heart Frames) */}
        <div 
          id="feature-cp-friend-card"
          onClick={() => setShowCpModal(true)}
          className="cursor-pointer bg-gradient-to-b from-[#ff5b99] to-[#ff2a6d] rounded-2xl p-1.5 sm:p-2 flex flex-col items-center justify-between text-white shadow-sm active:scale-95 transition-all relative h-26 sm:h-28 min-w-0 overflow-hidden"
        >
          <span className="text-[10px] min-[360px]:text-[11px] sm:text-xs font-black tracking-tight text-white drop-shadow-sm truncate w-full text-center">
            CP / Friend
          </span>

          <div className="flex items-center justify-center -space-x-1 sm:-space-x-1.5 mb-1.5 max-w-full">
            {/* Partner 1 in Golden Heart Frame */}
            <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-yellow-300 p-0.5 bg-yellow-400/20 shadow-md shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80" 
                alt="CP Partner 1" 
                className="w-full h-full rounded-full object-cover"
              />
            </div>

            {/* Glowing Pink Love Heart */}
            <div className="z-10 text-[8px] sm:text-[10px] animate-bounce shrink-0">💖</div>

            {/* Partner 2 in Golden Heart Frame */}
            <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-yellow-300 p-0.5 bg-yellow-400/20 shadow-md shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&auto=format&fit=crop&q=80" 
                alt="CP Partner 2" 
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>
        </div>

      </div>

      {/* 2.5 Mine SubTab: Room & Room Rent Action Hub */}
      {homeSubTab === 'mine' ? (
        <div className="mb-6 space-y-3.5">
          {/* Room & Room Rent Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Room Button */}
            <button
              id="btn-room"
              type="button"
              onClick={() => {
                if (myRoom) {
                  handleOpenRoom(myRoom);
                } else {
                  handleCreateRoom();
                }
              }}
              className="flex flex-col items-start justify-between p-3 rounded-2xl bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-teal-500/15 border border-teal-500/30 hover:border-teal-500/60 active:scale-95 transition-all text-left shadow-xs cursor-pointer group"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-600 flex items-center justify-center font-bold">
                  <Radio size={16} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded-full">
                  {myRoom ? 'Active' : 'Start'}
                </span>
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 group-hover:text-teal-700 transition-colors">
                  Room
                </h3>
                <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                  {myRoom ? myRoom.title : 'Enter or host your voice room'}
                </p>
              </div>
            </button>

            {/* Room Rent Button */}
            <button
              id="btn-room-rent"
              type="button"
              onClick={() => {
                setIsRoomRentModalOpen(true);
              }}
              className="flex flex-col items-start justify-between p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-amber-500/15 border border-amber-500/30 hover:border-amber-500/60 active:scale-95 transition-all text-left shadow-xs cursor-pointer group"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
                  <Crown size={16} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                  VIP
                </span>
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                  Room Rent
                </h3>
                <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                  Rent or renew VIP room privileges
                </p>
              </div>
            </button>
          </div>

          <div className="flex items-center justify-between mb-3 px-1 pt-1">
            <div className="flex items-center gap-2">
              <History size={16} className="text-teal-600" />
              <h2 className="text-sm font-extrabold text-slate-900">Recently Visited Rooms</h2>
            </div>
            <span className="text-xs text-slate-400 font-bold">{recentRooms.length} rooms</span>
          </div>

          {recentRooms.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
              <Clock size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-600">No recently visited rooms yet</p>
              <p className="text-[11px] text-slate-400 mt-1">Explore popular live rooms</p>
              <button 
                onClick={() => onSubTabChange && onSubTabChange('popular')}
                className="mt-3 px-4 py-1.5 rounded-full bg-teal-500 text-white font-bold text-xs shadow-sm"
              >
                Go to Popular
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-6 [contain:content]">
              {recentRooms.map((room) => (
                <RoomCard 
                  key={`mine-recent-${room.id}`} 
                  room={room} 
                  onJoin={handleOpenRoom} 
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Recently Visited Rooms Section (Persistent History on Main Screen) */}
          {recentRooms && recentRooms.length > 0 && (
            <div id="recently-visited-strip" className="mb-3.5 bg-slate-50/90 rounded-2xl p-2.5 border border-slate-100/90">
              <div className="flex items-center justify-between mb-2 px-0.5">
                <div className="flex items-center gap-1.5">
                  <History size={14} className="text-teal-600" />
                  <span className="text-xs font-black text-slate-800 tracking-tight">Recently Visited</span>
                  <span className="text-[10px] font-bold bg-teal-100 text-teal-700 px-1.5 py-0.2 rounded-full">
                    {recentRooms.length}
                  </span>
                </div>
                <button 
                  onClick={() => onSubTabChange && onSubTabChange('mine')}
                  className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-0.5"
                >
                  View all <ChevronRight size={12} />
                </button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {recentRooms.map((room) => (
                  <div
                    key={`recent-strip-${room.id}`}
                    id={`recent-room-chip-${room.id}`}
                    onClick={() => handleOpenRoom(room)}
                    className="shrink-0 flex items-center gap-2 bg-white rounded-xl p-1.5 pr-3 border border-slate-200/70 shadow-xs cursor-pointer active:scale-95 transition-transform"
                  >
                    <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                      <img 
                        src={room.coverImage} 
                        alt={room.title}
                        className="w-full h-full object-cover" 
                      />
                      <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
                    </div>
                    <div className="max-w-[95px]">
                      <p className="text-[11px] font-black text-slate-800 truncate leading-tight">
                        {room.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <span>{room.countryFlag || '🇵🇰'}</span>
                        <span className="truncate">{room.hostName}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Category Filter Tabs Row (Exact Match to Reference Screenshot) */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1.5 mb-3.5 w-full max-w-full">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`cat-pill-${cat.id}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all active:scale-95 shrink-0 ${
                    isActive 
                      ? 'bg-[#ffd233] text-slate-900 shadow-sm' 
                      : 'bg-[#f1f5f9] text-[#64748b] hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* 4. 2-Column Live Room Cards Grid (Matching the Exact Screenshot Layout) */}
          {filteredRooms.length === 0 ? (
            <div className="py-12 px-4 mb-6 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2.5">
                <Radio size={24} />
              </div>
              <h4 className="font-black text-sm text-slate-800">No Live Rooms Right Now</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Be the first to go live or host a real-time voice party room!
              </p>
              <button
                onClick={handleCreateRoom}
                className="mt-3.5 px-4 py-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-extrabold text-xs shadow-sm active:scale-95 transition-transform"
              >
                + Create Room
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-6 w-full max-w-full">
              {filteredRooms.map((room) => (
                <RoomCard 
                  key={room.id} 
                  room={room} 
                  onJoin={handleOpenRoom} 
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Floating Create Room Button (Connects directly with Create Room action) */}
      <div className="fixed bottom-20 left-0 right-0 mx-auto w-full max-w-md pointer-events-none z-30 fixed-stable">
        <div className="flex justify-end pr-3 sm:pr-4">
          <button
            id="floating-create-live-btn"
            onClick={handleCreateRoom}
            className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-[#20d7a6] via-[#26deab] to-[#12b992] shadow-xl shadow-teal-500/40 border-2 border-white text-white font-black text-xs transition-transform active:scale-95 cursor-pointer"
            title="Create Room"
          >
            <Plus size={16} strokeWidth={3} />
            <span className="font-extrabold tracking-wide">Create Room</span>
          </button>
        </div>
      </div>

      {/* Ranking Leaderboard Modal */}
      {showRankingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 max-h-[80vh] overflow-y-auto text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Trophy className="text-amber-500" size={20} />
                <h3 className="font-extrabold text-base">Daily Stars Leaderboard</h3>
              </div>
              <button onClick={() => setShowRankingModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="divide-y divide-slate-100 mt-2">
              {allUsers.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No registered users on the leaderboard yet.
                </div>
              ) : (
                allUsers.slice(0, 8).map((u, i) => (
                  <div key={u.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-5 text-center font-black text-sm ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-slate-400'}`}>
                        {i + 1}
                      </span>
                      <img src={u.avatar} alt={u.displayName} className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <p className="font-bold text-xs text-slate-800">{u.displayName}</p>
                        <p className="text-[10px] text-slate-400">Level {u.level} • {u.countryFlag}</p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-extrabold text-amber-600">{((u.coins || 0) * 2).toLocaleString()} ⭐️</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Family Clan Modal */}
      {showFamilyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 max-h-[80vh] overflow-y-auto text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="text-amber-500" size={20} />
                <h3 className="font-extrabold text-base">Popular Family Clans</h3>
              </div>
              <button onClick={() => setShowFamilyModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="mt-3 space-y-2.5">
              {[
                { name: 'Nawab Gathering 👑', members: 48, honor: '2.4M', tag: 'TOP 1' },
                { name: 'Cherry Melody 🌸', members: 62, honor: '1.8M', tag: 'TOP 2' },
                { name: 'Waziristan Knights 🏔️', members: 34, honor: '980K', tag: 'TOP 3' }
              ].map((clan, i) => (
                <div key={i} className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/50 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-800">{clan.name}</span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-amber-950">{clan.tag}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{clan.members} members • Honor: {clan.honor}</p>
                  </div>
                  <button className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold shadow-sm">
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CP / Friend Love Space Modal */}
      {showCpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 max-h-[80vh] overflow-y-auto text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Heart className="text-pink-500 fill-pink-500" size={20} />
                <h3 className="font-extrabold text-base">CP / Sweet Couples</h3>
              </div>
              <button onClick={() => setShowCpModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="mt-3 p-4 rounded-2xl bg-pink-50 border border-pink-200 text-center">
              <div className="flex items-center justify-center -space-x-2 my-2">
                <div className="w-12 h-12 rounded-full border-2 border-yellow-400 overflow-hidden shadow">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" alt="CP1" className="w-full h-full object-cover" />
                </div>
                <div className="z-10 text-xl">💖</div>
                <div className="w-12 h-12 rounded-full border-2 border-yellow-400 overflow-hidden shadow">
                  <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100" alt="CP2" className="w-full h-full object-cover" />
                </div>
              </div>
              <p className="font-extrabold text-xs text-pink-900">Sweet Love Space</p>
              <p className="text-[11px] text-pink-700 mt-1">Intimacy Level 9 • 38,400 Intimacy Points</p>
            </div>
          </div>
        </div>
      )}

      {/* Recall Friends Event Modal */}
      {showRecallEventModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-amber-700 flex items-center gap-1.5">
                <Sparkles size={18} className="text-amber-500" />
                Recall Friends To Get Coins
              </h3>
              <button onClick={() => setShowRecallEventModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/70">
                <p className="text-xs font-bold text-amber-900">Event Period: 15/09 ~ 15/10</p>
                <p className="text-xs text-amber-700 mt-1">Invite inactive friends back to StarLive to unlock rewards:</p>
                <ul className="text-xs text-amber-800 mt-2 space-y-1 font-medium">
                  <li>• 1 Friend Recalled: 5,000 Coins 🪙</li>
                  <li>• 3 Friends Recalled: 18,000 Coins + VIP Jet</li>
                  <li>• 5 Friends Recalled: 50,000 Coins + Gold Laurel</li>
                </ul>
              </div>
              <button 
                onClick={() => {
                  claimDailyBonus();
                  setShowRecallEventModal(false);
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-extrabold text-sm shadow-md"
              >
                Claim Invite Link & 1,000 Free Coins
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
