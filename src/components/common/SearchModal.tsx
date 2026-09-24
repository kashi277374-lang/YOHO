import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, X, Radio, Users, Sparkles } from 'lucide-react';
import { LiveRoom, UserProfile } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoom?: (room: LiveRoom) => void;
  onOpenRoom?: (room: LiveRoom) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectRoom, onOpenRoom }) => {
  const { liveRooms, allUsers, setActiveRoom } = useApp();
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const handleSelectRoom = (room: LiveRoom) => {
    if (onSelectRoom) onSelectRoom(room);
    else if (onOpenRoom) onOpenRoom(room);
    else if (setActiveRoom) setActiveRoom(room);
    onClose();
  };

  const filteredRooms = query.trim() ? liveRooms.filter(r => 
    r.title.toLowerCase().includes(query.toLowerCase()) ||
    r.hostName.toLowerCase().includes(query.toLowerCase()) ||
    r.category.toLowerCase().includes(query.toLowerCase()) ||
    r.country.toLowerCase().includes(query.toLowerCase())
  ) : [];

  const filteredUsers = query.trim() ? allUsers.filter(u => 
    u.displayName.toLowerCase().includes(query.toLowerCase()) ||
    u.username.toLowerCase().includes(query.toLowerCase()) ||
    u.country.toLowerCase().includes(query.toLowerCase())
  ) : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-start p-4 pt-12 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-4 relative shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Search Bar Input */}
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              autoFocus
              placeholder="Search live rooms, creators, countries or tags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
            />
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results Stream */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 no-scrollbar">
          {!query.trim() ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <Sparkles size={24} className="mx-auto text-amber-400 mb-2 opacity-80" />
              <p>Type keywords to search rooms, hosts, and moments</p>
              <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                {['Music', 'PK Battle', 'Gaming', 'Chill', 'Turkey', 'USA'].map((tag, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(tag)}
                    className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 hover:text-white text-xs"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Rooms results */}
              {filteredRooms.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Radio size={14} className="text-rose-400" /> Live & Party Rooms ({filteredRooms.length})
                  </h4>
                  <div className="space-y-2">
                    {filteredRooms.map(room => (
                      <div
                        key={room.id}
                        onClick={() => handleSelectRoom(room)}
                        className="p-2.5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 cursor-pointer flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <img src={room.coverImage} alt={room.title} className="w-10 h-10 rounded-xl object-cover" />
                          <div>
                            <p className="text-xs font-bold text-white flex items-center gap-1">
                              <span>{room.countryFlag}</span>
                              <span>{room.title}</span>
                            </p>
                            <span className="text-[10px] text-slate-400">Host: {room.hostName}</span>
                          </div>
                        </div>
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">
                          {room.viewerCount} watching
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users results */}
              {filteredUsers.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Users size={14} className="text-emerald-400" /> Creators & Users ({filteredUsers.length})
                  </h4>
                  <div className="space-y-2">
                    {filteredUsers.map(user => (
                      <div
                        key={user.id}
                        className="p-2.5 rounded-2xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <img src={user.avatar} alt={user.displayName} className="w-9 h-9 rounded-full object-cover" />
                          <div>
                            <p className="text-xs font-bold text-white flex items-center gap-1">
                              <span>{user.displayName}</span>
                              <span>{user.countryFlag}</span>
                            </p>
                            <span className="text-[10px] text-slate-400">@{user.username}</span>
                          </div>
                        </div>
                        <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                          Lv.{user.level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredRooms.length === 0 && filteredUsers.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No rooms or creators matched "{query}".
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};
