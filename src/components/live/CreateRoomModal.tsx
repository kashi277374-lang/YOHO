import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Video, Mic, Sparkles, X, Image } from 'lucide-react';
import { LiveRoom } from '../../types';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultIsParty?: boolean;
  onRoomCreated?: (room: LiveRoom) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultIsParty = false,
  onRoomCreated 
}) => {
  const { currentUser, createRoom } = useApp();

  const [title, setTitle] = useState(`${currentUser.displayName}'s Live Show 🎉`);
  const [isParty, setIsParty] = useState(defaultIsParty);
  const [category, setCategory] = useState<'Popular' | 'Game' | 'Video/Music' | 'PK Event' | 'Talent'>('Popular');
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newRoom = await createRoom({
      title: title.trim(),
      category,
      coverImage,
      isParty,
      country: currentUser.country,
      countryFlag: currentUser.countryFlag
    });

    onClose();
    if (onRoomCreated) {
      onRoomCreated(newRoom);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 relative shadow-2xl animate-in zoom-in-95">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800"
        >
          <X size={18} />
        </button>

        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-amber-400" />
          {isParty ? 'Start Voice Party Room' : 'Start Live Stream Broadcast'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Room Type Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setIsParty(false)}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                !isParty ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video size={14} />
              <span>Live Video</span>
            </button>

            <button
              type="button"
              onClick={() => setIsParty(true)}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                isParty ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mic size={14} />
              <span>Voice Party (8 Mics)</span>
            </button>
          </div>

          <div>
            <label className="text-xs text-slate-300 block mb-1">Room Title</label>
            <input 
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your room an attractive title..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300 block mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none"
            >
              <option value="Popular">🔥 Popular / Hangout</option>
              <option value="Video/Music">🎵 Video & Music Concert</option>
              <option value="PK Event">⚔️ PK Battle Arena</option>
              <option value="Game">🎮 Gaming & Mini Games</option>
              <option value="Talent">✨ Talent Showcase</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-300 block mb-1">Cover Image URL</label>
            <input 
              type="url"
              required
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
            <div className="mt-2 h-24 rounded-xl overflow-hidden border border-slate-700">
              <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-98 transition-all"
          >
            Launch Broadcast Now 🚀
          </button>

        </form>
      </div>
    </div>
  );
};
