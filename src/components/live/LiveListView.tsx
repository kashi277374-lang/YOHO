import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LiveRoom } from '../../types';
import { Radio, Flame, Sparkles, Plus, Video, Swords, Globe, Users } from 'lucide-react';

interface LiveListViewProps {
  onOpenRoom?: (room: LiveRoom) => void;
  onSelectRoom?: (room: LiveRoom) => void;
  onCreateRoom?: () => void;
}

export const LiveListView: React.FC<LiveListViewProps> = ({ onOpenRoom, onSelectRoom, onCreateRoom }) => {
  const { liveRooms, selectedCountry, setSelectedCountry, setActiveRoom } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'pk' | 'talent'>('all');

  const handleOpenRoom = (room: LiveRoom) => {
    if (onOpenRoom) onOpenRoom(room);
    else if (onSelectRoom) onSelectRoom(room);
    else if (setActiveRoom) setActiveRoom(room);
  };

  const handleCreateRoom = () => {
    if (onCreateRoom) onCreateRoom();
  };

  const streams = liveRooms.filter(r => !r.isParty).filter(r => {
    if (selectedCountry !== 'All' && r.country !== selectedCountry) return false;
    if (activeSubTab === 'pk') return r.category === 'PK Event' || r.tags?.includes('PK Match');
    if (activeSubTab === 'talent') return r.category === 'Video/Music' || r.tags?.includes('Music');
    return true;
  });

  return (
    <div className="pb-24 pt-2 px-3 sm:px-3.5 max-w-4xl mx-auto w-full">
      
      {/* Top Header Banner for Live */}
      <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-900 border border-rose-500/30 p-3 sm:p-4 rounded-2xl gap-2">
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 text-rose-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1">
            <Radio size={14} className="animate-pulse" /> Live Broadcasting
          </div>
          <h2 className="text-base sm:text-lg font-black text-white truncate">Explore Live Broadcasters</h2>
          <p className="text-[11px] sm:text-xs text-slate-400 truncate">Interact in real-time, send gifts, and support your idols</p>
        </div>

        <button
          onClick={handleCreateRoom}
          className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-rose-500/30 active:scale-95 transition-all shrink-0 whitespace-nowrap"
        >
          <Video size={16} />
          <span>Go Live</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeSubTab === 'all' ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-800 text-slate-300'
          }`}
        >
          🔥 All Streams
        </button>
        <button
          onClick={() => setActiveSubTab('pk')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeSubTab === 'pk' ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-800 text-slate-300'
          }`}
        >
          ⚔️ PK Battles
        </button>
        <button
          onClick={() => setActiveSubTab('talent')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeSubTab === 'talent' ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-800 text-slate-300'
          }`}
        >
          🎤 Talent & Music
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {streams.map((room) => (
          <div
            key={room.id}
            onClick={() => handleOpenRoom(room)}
            className="cursor-pointer group relative rounded-2xl overflow-hidden bg-slate-800 border border-slate-700/60 hover:border-rose-400 transition-all shadow-lg active:scale-95"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-950">
              <img 
                src={room.coverImage} 
                alt={room.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/30" />

              <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 px-2 py-0.5 rounded-md font-black text-[10px] shadow">
                👑 Lv.{room.hostLevel}
              </div>

              <div className="absolute bottom-8 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                <span>{room.viewerCount} live</span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <p className="text-xs font-bold text-white truncate flex items-center gap-1">
                  <span>{room.countryFlag}</span>
                  <span>{room.title}</span>
                </p>
                <p className="text-[10px] text-slate-300 truncate mt-0.5">
                  Host: {room.hostName}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {streams.length === 0 && (
        <div className="text-center py-16 bg-slate-800/40 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm">No live streams found in this tab.</p>
          <button 
            onClick={onCreateRoom}
            className="mt-3 px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-full text-xs"
          >
            Start Your Live Stream
          </button>
        </div>
      )}

    </div>
  );
};
