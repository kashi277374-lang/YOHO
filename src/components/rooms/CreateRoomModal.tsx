import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ROOM_THEMES, RoomTheme } from '../../data/roomThemes';
import { processDeviceImage } from '../../utils/imageUtils';
import { 
  X, 
  Sparkles, 
  Radio, 
  Mic, 
  Lock, 
  Globe, 
  Palette, 
  Check, 
  Upload,
  Image as ImageIcon,
  Camera,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { LiveRoom } from '../../types';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated?: (room: LiveRoom) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onRoomCreated
}) => {
  const { 
    currentUser, 
    createRoom, 
    canCreateRoom, 
    userActiveRoomsCount, 
    userOwnedRooms, 
    deleteRoom, 
    joinRoom 
  } = useApp();

  const [title, setTitle] = useState(`${currentUser.displayName}'s Live Party 🌟`);
  const [customThumbnail, setCustomThumbnail] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<RoomTheme>(ROOM_THEMES[0]);
  const [isParty, setIsParty] = useState(true);
  const [category, setCategory] = useState<'Popular' | 'Game' | 'Video/Music' | 'PK Event' | 'Talent'>('Popular');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [announcement, setAnnouncement] = useState('Welcome everyone to my official room! Tap to take a mic seat and enjoy.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Active cover image is either device-uploaded custom thumbnail or the selected theme
  const activeCoverImage = customThumbnail || selectedTheme.coverImage;

  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    setUploadError(null);
    setIsProcessingImage(true);
    try {
      const optimizedUrl = await processDeviceImage(file, 800, 0.85);
      setCustomThumbnail(optimizedUrl);
    } catch (err: any) {
      console.error("Error processing image:", err);
      setUploadError('Could not process this image. Please choose another.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (!canCreateRoom) {
      setUploadError("You can create a maximum of 2 rooms.");
      return;
    }

    setIsSubmitting(true);

    try {
      const newRoom = await createRoom({
        title: title.trim(),
        category,
        isParty,
        coverImage: activeCoverImage,
        backgroundTheme: customThumbnail || selectedTheme.backgroundImage,
        announcement: announcement.trim(),
        isPrivate,
        password: isPrivate ? password.trim() : '',
        country: currentUser.country,
      });

      setIsSubmitting(false);
      onClose();
      if (onRoomCreated) {
        onRoomCreated(newRoom);
      }
    } catch (err: any) {
      console.error("Failed to create room:", err);
      setUploadError(err.message || "Failed to create room");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[92vh] my-auto">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center text-slate-950">
              <Radio size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                Create Room
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold border border-emerald-400/30">
                  LIVE
                </span>
              </h3>
              <p className="text-xs text-slate-400">Set room name and upload your custom thumbnail</p>
            </div>
          </div>
          <button 
            id="close-create-room-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Requirement 2: 2-Room Maximum Warning Banner & Active Rooms list */}
          {!canCreateRoom && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/40 rounded-2xl flex items-start gap-3 animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-amber-300">You can create a maximum of 2 rooms.</h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  You already have {userActiveRoomsCount} active rooms. To launch a new room, please enter or close one of your existing rooms below:
                </p>
                <div className="mt-2.5 space-y-2">
                  {userOwnedRooms.map(room => (
                    <div key={room.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={room.coverImage} alt={room.title} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{room.title}</p>
                          <p className="text-[10px] text-slate-400">{room.category} • {room.viewerCount || 1} online</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            joinRoom(room);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 transition-colors"
                        >
                          Enter
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`Close and delete "${room.title}"?`)) {
                              await deleteRoom(room.id);
                            }
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors flex items-center gap-1"
                        >
                          <Trash2 size={11} />
                          Close
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* 1. Room Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>Room Name</span>
                <span className="text-rose-400">*</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">{title.length}/40</span>
            </label>
            <input 
              id="create-room-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. VIP Star Lounge • Chill & Music"
              maxLength={40}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-teal-400 transition-colors font-medium placeholder:text-slate-600"
            />
          </div>

          {/* 2. Device Thumbnail Uploader */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera size={14} className="text-teal-400" />
                <span>Room Thumbnail / Cover Image</span>
              </span>
              {customThumbnail && (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Custom Uploaded
                </span>
              )}
            </label>

            {/* Hidden native file input */}
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            {/* Drag & Drop Upload Zone or Thumbnail Preview */}
            <div 
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative border-2 border-dashed rounded-2xl p-3.5 transition-all ${
                isDragging 
                  ? 'border-teal-400 bg-teal-950/30' 
                  : customThumbnail 
                    ? 'border-teal-500/50 bg-slate-950' 
                    : 'border-slate-700 hover:border-slate-600 bg-slate-950/60'
              }`}
            >
              {customThumbnail ? (
                <div className="flex items-center gap-3">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-800 border border-teal-500/40 shrink-0">
                    <img 
                      src={customThumbnail} 
                      alt="Thumbnail preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-1">
                      <span className="text-[9px] text-white font-bold truncate">Uploaded</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white mb-0.5">Device Image Ready</h4>
                    <p className="text-[11px] text-slate-400 mb-2">Optimized for fast synchronization across all devices.</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold text-xs border border-teal-500/30 transition-colors"
                      >
                        Change Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomThumbnail(null)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/20 transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center py-4 cursor-pointer text-center group"
                >
                  <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform border border-teal-500/20">
                    <Upload size={20} />
                  </div>
                  <p className="text-xs font-bold text-white mb-0.5">
                    {isProcessingImage ? 'Optimizing image...' : 'Upload Thumbnail from Device'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Tap to browse photos or drag and drop an image
                  </p>
                  <span className="text-[10px] text-teal-400/80 font-medium mt-1">
                    Supports PNG, JPG, WEBP (Auto-optimized)
                  </span>
                </div>
              )}

              {uploadError && (
                <p className="text-xs text-rose-400 mt-2 font-medium">{uploadError}</p>
              )}
            </div>

            {/* Alternative preset thumbnails */}
            <div className="mt-2.5">
              <span className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
                Or select a curated visual style:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {ROOM_THEMES.slice(0, 4).map((theme) => {
                  const isSelected = !customThumbnail && selectedTheme.id === theme.id;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => {
                        setCustomThumbnail(null);
                        setSelectedTheme(theme);
                      }}
                      className={`relative rounded-xl overflow-hidden aspect-[4/3] cursor-pointer border-2 transition-all group ${
                        isSelected 
                          ? 'border-teal-400 ring-2 ring-teal-500/30 scale-[1.02]' 
                          : 'border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={theme.coverImage} 
                        alt={theme.name} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                        <span className="text-[8px] font-bold text-white truncate">{theme.tag}</span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-teal-400 text-slate-950 flex items-center justify-center text-[9px] font-black">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Room Type Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">Room Type</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setIsParty(true)}
                className={`p-2.5 rounded-2xl border-2 flex items-center gap-2.5 transition-all text-left ${
                  isParty 
                    ? 'border-purple-500 bg-purple-950/40 shadow-sm shadow-purple-500/20' 
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${isParty ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Mic size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">Voice Party</h4>
                  <p className="text-[10px] text-slate-400 truncate">8 seats & audio chat</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsParty(false)}
                className={`p-2.5 rounded-2xl border-2 flex items-center gap-2.5 transition-all text-left ${
                  !isParty 
                    ? 'border-teal-400 bg-teal-950/40 shadow-sm shadow-teal-500/20' 
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${!isParty ? 'bg-teal-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  <Radio size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">Live Broadcast</h4>
                  <p className="text-[10px] text-slate-400 truncate">Stream & audience</p>
                </div>
              </button>
            </div>
          </div>

          {/* 4. Category selection */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {(['Popular', 'PK Event', 'Video/Music', 'Game', 'Talent'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    category === cat 
                      ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-black shadow-xs' 
                      : 'bg-slate-800/90 text-slate-400 hover:text-white border border-slate-700/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Privacy & Passcode */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-xl ${isPrivate ? 'bg-amber-400/20 text-amber-400' : 'bg-teal-400/20 text-teal-400'}`}>
                  {isPrivate ? <Lock size={15} /> : <Globe size={15} />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {isPrivate ? 'Private Room (Passcode)' : 'Public Room (Open for all)'}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {isPrivate ? 'Passcode required to enter' : 'Appears immediately in the Popular feed'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                  isPrivate ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <div 
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    isPrivate ? 'translate-x-5' : 'translate-x-0'
                  }`} 
                />
              </button>
            </div>

            {isPrivate && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-800 animate-in fade-in">
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Set Room Passcode
                </label>
                <input 
                  type="text"
                  required={isPrivate}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="e.g. 1234 or star"
                  maxLength={10}
                  className="w-full bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>

          {/* 6. Welcome announcement */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">Room Announcement</label>
            <input 
              type="text"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Welcome note for incoming visitors"
              maxLength={120}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-400 placeholder:text-slate-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-800 flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-create-room-btn"
              type="submit"
              disabled={!canCreateRoom || isSubmitting || !title.trim()}
              className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
                !canCreateRoom
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 hover:brightness-110 active:scale-95 shadow-lg shadow-teal-500/30 cursor-pointer disabled:opacity-50'
              }`}
            >
              <Sparkles size={15} />
              {!canCreateRoom 
                ? 'Limit Reached (Max 2 Rooms)' 
                : isSubmitting 
                ? 'Launching...' 
                : 'Create & Launch Room'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
