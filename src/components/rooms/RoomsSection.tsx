import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RoomCard } from './RoomCard';
import { LiveRoom } from '../../types';
import { 
  Plus, 
  Sparkles, 
  Flame, 
  Users, 
  Radio, 
  Mic, 
  Home, 
  Search, 
  Crown, 
  Lock, 
  ArrowRight,
  ShieldCheck,
  Compass
} from 'lucide-react';

interface RoomsSectionProps {
  onOpenRoom?: (room: LiveRoom) => void;
}

export const RoomsSection: React.FC<RoomsSectionProps> = ({ onOpenRoom }) => {
  const { 
    liveRooms, 
    myRoom, 
    currentUser, 
    joinRoom, 
    setIsCreateRoomModalOpen,
    canCreateRoom,
    userActiveRoomsCount,
    userOwnedRooms,
    deleteRoom
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'party' | 'stream' | 'private'>('all');
  const [roomFilterQuery, setRoomFilterQuery] = useState('');

  const activeRooms = liveRooms.filter(r => r.status !== 'ended');

  // Filter logic
  const filteredRooms = activeRooms.filter(room => {
    // Tab filter
    if (activeTab === 'popular' && (room.viewerCount || 0) < 5) return false;
    if (activeTab === 'party' && !room.isParty) return false;
    if (activeTab === 'stream' && room.isParty) return false;
    if (activeTab === 'private' && !room.isPrivate) return false;

    // Search query filter
    if (roomFilterQuery.trim()) {
      const q = roomFilterQuery.toLowerCase();
      const matchTitle = room.title.toLowerCase().includes(q);
      const matchHost = room.hostName.toLowerCase().includes(q);
      const matchCategory = room.category.toLowerCase().includes(q);
      const matchId = room.id.toLowerCase().includes(q);
      if (!matchTitle && !matchHost && !matchCategory && !matchId) return false;
    }

    return true;
  });

  // Popular rooms (sorted by viewerCount descending)
  const popularRooms = [...activeRooms].sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0)).slice(0, 4);

  const handleRoomClick = (room: LiveRoom) => {
    if (onOpenRoom) {
      onOpenRoom(room);
    } else {
      joinRoom(room);
    }
  };

  return (
    <section className="mb-8 space-y-6">
      
      {/* 1. Header Row: Section Title & "Create Room" Button */}
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-slate-900/90 via-purple-950/40 to-slate-900/90 p-4 rounded-3xl border border-purple-500/20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center text-slate-950">
            <Radio size={24} strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                Live & Voice Rooms
              </h2>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <p className="text-xs text-slate-400">Discover live streams, talk in party mics, or launch your own room</p>
          </div>
        </div>

        {/* Prominent Create Room Button */}
        <button
          id="section-create-room-btn"
          onClick={() => setIsCreateRoomModalOpen(true)}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg transition-all shrink-0 cursor-pointer ${
            !canCreateRoom
              ? 'bg-slate-800 text-amber-300 border border-amber-500/30 hover:bg-slate-700/80 shadow-none'
              : 'bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 shadow-emerald-500/30 hover:scale-105 active:scale-95'
          }`}
          title={!canCreateRoom ? "You can create a maximum of 2 rooms." : "Create Room"}
        >
          <Plus size={16} strokeWidth={3} />
          <span>{canCreateRoom ? (userActiveRoomsCount === 1 ? 'Create 2nd Room' : 'Create Room') : 'Rooms Full (2/2)'}</span>
        </button>
      </div>

      {/* 2. "My Room" Quick Access Banner (Personal room card for registered user) */}
      <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-purple-950/40 p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5 min-w-0">
            {myRoom ? (
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 shrink-0 shadow-md">
                <img 
                  src={myRoom.coverImage} 
                  alt={myRoom.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <Home size={26} />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {userOwnedRooms.length > 0 ? `Your Active Rooms (${userOwnedRooms.length}/2)` : 'New Broadcaster'}
                </span>
                {myRoom && (
                  <span className="text-[10px] font-mono text-slate-400">
                    ID: {myRoom.id.replace('room-', '').slice(-6)}
                  </span>
                )}
              </div>
              
              <h3 className="text-sm sm:text-base font-bold text-white truncate mt-0.5">
                {myRoom ? myRoom.title : `${currentUser.displayName}'s Room`}
              </h3>
              
              <p className="text-xs text-slate-400 truncate">
                {myRoom 
                  ? `Audience: ${myRoom.viewerCount || 1} online • ${canCreateRoom ? 'You can create 1 more room' : 'Limit reached: 2/2 rooms active'}` 
                  : 'You haven\'t started your room yet. Create one now and invite your friends!'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 flex-wrap">
            {myRoom ? (
              <>
                <button
                  id="enter-my-room-btn"
                  onClick={() => handleRoomClick(myRoom)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Enter Room</span>
                  <ArrowRight size={14} strokeWidth={2.5} />
                </button>
                {canCreateRoom && (
                  <button
                    id="create-second-room-btn"
                    onClick={() => setIsCreateRoomModalOpen(true)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-black text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-500/30 transition-all cursor-pointer"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    <span>Create 2nd Room</span>
                  </button>
                )}
              </>
            ) : (
              <button
                id="create-my-first-room-btn"
                onClick={() => setIsCreateRoomModalOpen(true)}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Claim & Create Room</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* 3. "Popular Rooms" Featured Section (Only when popular rooms exist) */}
      {popularRooms.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-amber-400" />
              <h3 className="text-sm font-extrabold text-white tracking-wide">
                Popular Rooms
              </h3>
              <span className="text-[10px] bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                HOT
              </span>
            </div>
            <span className="text-xs text-slate-400">Most active broadcasts</span>
          </div>

          {/* Popular Rooms 2-Column Responsive Bento Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {popularRooms.map(room => (
              <RoomCard 
                key={`popular-${room.id}`} 
                room={room} 
                onJoin={handleRoomClick}
                featured={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* 4. "All Rooms" Section with Filter Tabs & Search */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Compass size={18} className="text-purple-400" />
            <h3 className="text-sm font-extrabold text-white tracking-wide">
              Explore All Rooms ({filteredRooms.length})
            </h3>
          </div>

          {/* Quick Search in Rooms */}
          <div className="relative w-full sm:w-64">
            <input 
              type="text"
              value={roomFilterQuery}
              onChange={(e) => setRoomFilterQuery(e.target.value)}
              placeholder="Search by name, ID, or host..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-full pl-8 pr-4 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
            />
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-3">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              activeTab === 'all' 
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black shadow-md' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Public ({activeRooms.length})
          </button>
          <button
            onClick={() => setActiveTab('popular')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              activeTab === 'popular' 
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black shadow-md' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🔥 High Traffic
          </button>
          <button
            onClick={() => setActiveTab('party')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              activeTab === 'party' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black shadow-md' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🎙️ Voice Party
          </button>
          <button
            onClick={() => setActiveTab('stream')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              activeTab === 'stream' 
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black shadow-md' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            📹 Live Video / PK
          </button>
          <button
            onClick={() => setActiveTab('private')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              activeTab === 'private' 
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🔒 Passcode Protected
          </button>
        </div>

        {/* All Rooms Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredRooms.map(room => (
            <RoomCard 
              key={`all-${room.id}`} 
              room={room} 
              onJoin={handleRoomClick}
            />
          ))}
        </div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-12 bg-slate-900/50 rounded-3xl border border-slate-800 p-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Radio size={24} />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">No Active Rooms Right Now</h4>
            <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
              {roomFilterQuery ? `No rooms match "${roomFilterQuery}". Try searching for something else.` : 'There are currently no active rooms. Be the first to create one!'}
            </p>
            <button
              id="empty-state-create-room-btn"
              onClick={() => setIsCreateRoomModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus size={16} strokeWidth={3} />
              <span>Create Room</span>
            </button>
          </div>
        )}

      </div>

    </section>
  );
};
