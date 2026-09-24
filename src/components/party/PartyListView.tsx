import React from 'react';
import { useApp } from '../../context/AppContext';
import { LiveRoom } from '../../types';
import { Users2, Mic, Music, Plus, Sparkles } from 'lucide-react';

interface PartyListViewProps {
  onOpenRoom?: (room: LiveRoom) => void;
  onSelectRoom?: (room: LiveRoom) => void;
  onCreateRoom?: () => void;
}

export const PartyListView: React.FC<PartyListViewProps> = ({ onOpenRoom, onSelectRoom, onCreateRoom }) => {
  const { liveRooms, selectedCountry, setActiveRoom } = useApp();

  const handleOpenRoom = (room: LiveRoom) => {
    if (onOpenRoom) onOpenRoom(room);
    else if (onSelectRoom) onSelectRoom(room);
    else if (setActiveRoom) setActiveRoom(room);
  };

  const handleCreateRoom = () => {
    if (onCreateRoom) onCreateRoom();
  };

  const partyRooms = liveRooms.filter(r => r.isParty).filter(r => {
    if (selectedCountry !== 'All' && r.country !== selectedCountry) return false;
    return true;
  });

  return (
    <div className="pb-24 pt-2 px-3 sm:px-3.5 max-w-4xl mx-auto w-full">
      
      {/* Top Banner for Party */}
      <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-purple-950/90 via-slate-900 to-slate-900 border border-purple-500/30 p-3 sm:p-4 rounded-2xl gap-2">
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 text-purple-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1">
            <Users2 size={14} /> Voice & Audio Hangouts
          </div>
          <h2 className="text-base sm:text-lg font-black text-white truncate">Party & Multi-Mic Rooms</h2>
          <p className="text-[11px] sm:text-xs text-slate-400 truncate">Take a mic, play dice games, and listen to music together</p>
        </div>

        <button
          onClick={handleCreateRoom}
          className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/30 active:scale-95 transition-all shrink-0 whitespace-nowrap"
        >
          <Mic size={15} />
          <span>Create Party</span>
        </button>
      </div>

      {/* Party Rooms List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {partyRooms.map((room) => {
          const seats = room.micSeats || [];
          const activeTalkers = seats.filter(s => s.userId).length;

          return (
            <div
              key={room.id}
              onClick={() => handleOpenRoom(room)}
              className="cursor-pointer bg-slate-900/90 hover:bg-slate-800/90 border border-purple-500/30 hover:border-purple-400/70 rounded-2xl p-3.5 transition-all shadow-md group active:scale-[0.98]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={room.hostAvatar} 
                      alt={room.hostName} 
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-purple-400"
                    />
                    <span className="absolute -bottom-1 -right-1 text-xs">
                      {room.countryFlag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                      {room.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Host: {room.hostName}
                    </p>
                  </div>
                </div>

                <div className="bg-purple-950/80 border border-purple-500/30 px-2 py-1 rounded-full text-[10px] font-bold text-purple-300 flex items-center gap-1">
                  <Mic size={11} className="text-emerald-400" />
                  <span>{activeTalkers} on mic</span>
                </div>
              </div>

              {/* Seated Avatars preview */}
              <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center -space-x-2">
                  {seats.map((s, idx) => (
                    s.userAvatar ? (
                      <img 
                        key={idx} 
                        src={s.userAvatar} 
                        alt="Seat" 
                        className="w-6 h-6 rounded-full border border-purple-400 object-cover" 
                      />
                    ) : (
                      <div key={idx} className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] text-slate-500">
                        {idx + 1}
                      </div>
                    )
                  ))}
                </div>

                <span className="text-[11px] font-bold text-purple-400 flex items-center gap-1">
                  Enter Room →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {partyRooms.length === 0 && (
        <div className="text-center py-16 bg-slate-900/60 rounded-2xl border border-slate-800">
          <Mic size={28} className="mx-auto text-purple-400 mb-2 opacity-80" />
          <p className="text-slate-300 font-bold text-sm">No Active Voice Parties</p>
          <p className="text-slate-500 text-xs mt-1">Host your own party room and invite friends to speak together!</p>
          <button 
            onClick={onCreateRoom}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:brightness-110 text-white font-bold rounded-full text-xs shadow-md active:scale-95 transition-transform"
          >
            Create Voice Party
          </button>
        </div>
      )}

    </div>
  );
};
