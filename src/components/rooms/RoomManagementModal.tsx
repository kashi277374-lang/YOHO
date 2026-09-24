import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { auth } from '../../services/firebase';
import { LiveRoom } from '../../types';
import { ROOM_THEMES } from '../../data/roomThemes';
import { processDeviceImage } from '../../utils/imageUtils';
import { 
  X, 
  Settings, 
  Sparkles, 
  Lock, 
  Globe, 
  Palette, 
  Check, 
  Upload,
  Camera,
  Trash2,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

interface RoomManagementModalProps {
  room: LiveRoom;
  isOpen: boolean;
  onClose: () => void;
  onEndRoom?: () => void;
}

export const RoomManagementModal: React.FC<RoomManagementModalProps> = ({
  room,
  isOpen,
  onClose,
  onEndRoom
}) => {
  const { currentUser, updateRoom, endLiveRoom, leaveRoom } = useApp();

  // Check creator permission: Only the user who created the room (or admin) can edit
  const isOwner = room.hostId === currentUser.id || 
                  room.hostId === currentUser.uid || 
                  (auth.currentUser && room.hostId === auth.currentUser.uid) ||
                  currentUser.role === 'admin' || 
                  currentUser.email === 'wajaht265374@gmail.com';

  const [title, setTitle] = useState(room.title);
  const [announcement, setAnnouncement] = useState(room.announcement || '');
  const [isPrivate, setIsPrivate] = useState(room.isPrivate || false);
  const [password, setPassword] = useState(room.password || '');
  const [coverImage, setCoverImage] = useState(room.coverImage);
  const [backgroundTheme, setBackgroundTheme] = useState(room.backgroundTheme || room.coverImage);
  const [activeTab, setActiveTab] = useState<'appearance' | 'details' | 'security'>('appearance');
  const [saving, setSaving] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDeviceImage = async (file: File) => {
    if (!isOwner) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image (PNG, JPG, WEBP)');
      return;
    }
    setUploadError(null);
    setIsProcessingImage(true);
    try {
      const dataUrl = await processDeviceImage(file, 800, 0.85);
      setCoverImage(dataUrl);
    } catch (err) {
      console.error("Error processing thumbnail image:", err);
      setUploadError('Failed to process device image.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isOwner) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleDeviceImage(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      alert('Only the room creator can edit the room name and thumbnail.');
      return;
    }
    if (!title.trim()) return;

    setSaving(true);
    try {
      await updateRoom(room.id, {
        title: title.trim(),
        coverImage,
        backgroundTheme,
        announcement: announcement.trim(),
        isPrivate,
        password: isPrivate ? password.trim() : ''
      });
      setSaving(false);
      onClose();
    } catch (err: any) {
      console.error("Failed to update room:", err);
      alert(err.message || 'Failed to save room updates.');
      setSaving(false);
    }
  };

  const handleEndBroadcast = async () => {
    if (!isOwner) return;
    if (window.confirm('Are you sure you want to end this room broadcast? All members will be disconnected.')) {
      await endLiveRoom(room.id);
      if (onEndRoom) {
        onEndRoom();
      } else {
        await leaveRoom();
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[92vh] my-auto">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Settings size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                Room Customization
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-teal-300 border border-teal-500/20">
                  ID: {room.id.replace('room-', '').slice(-6)}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isOwner ? 'Edit room name, thumbnail and broadcast settings' : 'View room details (Creator only edit)'}
              </p>
            </div>
          </div>
          <button 
            id="close-room-manage-btn"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800/80 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Ownership Notice if not owner */}
        {!isOwner && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center gap-2 text-amber-300 text-xs">
            <AlertCircle size={16} className="shrink-0 text-amber-400" />
            <span>Only the user who created this room is allowed to edit its name and thumbnail.</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex items-center px-5 border-b border-slate-800 bg-slate-950/40 gap-5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'appearance' 
                ? 'border-teal-400 text-teal-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Name & Thumbnail
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'details' 
                ? 'border-teal-400 text-teal-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Announcement
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'security' 
                ? 'border-teal-400 text-teal-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Privacy & Passcode
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: APPEARANCE (NAME & DEVICE THUMBNAIL) */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              
              {/* Room Name Input */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
                  <span>Room Name</span>
                  <span className="text-[10px] text-slate-400 font-normal">{title.length}/40</span>
                </label>
                <input 
                  id="edit-room-name-input"
                  type="text"
                  disabled={!isOwner}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter custom room name"
                  maxLength={40}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-teal-400 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Device Thumbnail Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera size={14} className="text-teal-400" />
                    <span>Upload New Thumbnail from Device</span>
                  </span>
                  <span className="text-[10px] text-slate-400">1:1 Square recommended</span>
                </label>

                <input 
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  disabled={!isOwner}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleDeviceImage(e.target.files[0]);
                    }
                  }}
                />

                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); if (isOwner) setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                  className={`border-2 border-dashed rounded-2xl p-3.5 transition-all ${
                    isDragging 
                      ? 'border-teal-400 bg-teal-950/30' 
                      : 'border-slate-700 bg-slate-950/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="relative w-18 h-18 rounded-xl overflow-hidden bg-slate-800 border border-teal-500/40 shrink-0">
                      <img 
                        src={coverImage} 
                        alt="Room thumbnail" 
                        className="w-full h-full object-cover" 
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white mb-0.5 truncate">{title || 'Untitled'}</p>
                      <p className="text-[11px] text-slate-400 mb-2">
                        {isProcessingImage ? 'Optimizing device image...' : 'Current Room Thumbnail'}
                      </p>
                      {isOwner && (
                        <button
                          id="upload-room-thumbnail-btn"
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold text-xs border border-teal-500/40 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload size={13} />
                          <span>Choose from Device</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {uploadError && (
                    <p className="text-xs text-rose-400 mt-2 font-medium">{uploadError}</p>
                  )}
                </div>
              </div>

              {/* Preset Visual Themes (Quick Alternatives) */}
              {isOwner && (
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1">
                    <Palette size={14} className="text-purple-400" />
                    <span>Or Select Preset Visual Style</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {ROOM_THEMES.slice(0, 4).map((th) => {
                      const isSelected = coverImage === th.coverImage;
                      return (
                        <div
                          key={th.id}
                          onClick={() => {
                            setCoverImage(th.coverImage);
                            setBackgroundTheme(th.backgroundImage);
                          }}
                          className={`relative rounded-xl overflow-hidden aspect-[4/3] cursor-pointer border-2 transition-all ${
                            isSelected 
                              ? 'border-teal-400 ring-2 ring-teal-500/30 scale-[1.02]' 
                              : 'border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
                          }`}
                        >
                          <img 
                            src={th.coverImage} 
                            alt={th.name} 
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                            <span className="text-[8px] font-bold text-white truncate">{th.tag}</span>
                          </div>
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-teal-400 text-slate-950 rounded-full p-0.5">
                              <Check size={10} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: DETAILS (ANNOUNCEMENT) */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">Room Announcement</label>
                <textarea 
                  disabled={!isOwner}
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  placeholder="Welcome rules or instructions for incoming listeners"
                  rows={4}
                  maxLength={200}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-teal-400 resize-none disabled:opacity-60"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
                <img 
                  src={coverImage} 
                  alt="Cover" 
                  className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0" 
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Preview</span>
                  <p className="text-xs font-bold text-white truncate">{title || 'Untitled Room'}</p>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{announcement || 'No announcement set'}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${isPrivate ? 'bg-amber-400/20 text-amber-400' : 'bg-teal-400/20 text-teal-400'}`}>
                      {isPrivate ? <Lock size={16} /> : <Globe size={16} />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {isPrivate ? 'Passcode Protected Room' : 'Public Room'}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {isPrivate ? 'Requires passcode to enter' : 'Open to everyone in the Popular section'}
                      </p>
                    </div>
                  </div>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setIsPrivate(!isPrivate)}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                        isPrivate ? 'bg-amber-500' : 'bg-slate-700'
                      }`}
                    >
                      <div 
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          isPrivate ? 'translate-x-5' : 'translate-x-0'
                        }`} 
                      />
                    </button>
                  )}
                </div>

                {isPrivate && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <label className="block text-xs font-semibold text-amber-300 mb-1">
                      Room Passcode
                    </label>
                    <input 
                      type="text"
                      disabled={!isOwner}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="e.g. 1234"
                      maxLength={10}
                      className="w-full bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}
              </div>

              {isOwner && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleEndBroadcast}
                    className="w-full py-2.5 px-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 font-bold text-xs transition-colors"
                  >
                    End Room Broadcast (Close Room)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-800 flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors"
            >
              {isOwner ? 'Cancel' : 'Close'}
            </button>
            {isOwner && (
              <button
                id="save-room-settings-btn"
                type="submit"
                disabled={saving || !title.trim()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-black text-xs hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-teal-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={15} />
                {saving ? 'Saving...' : 'Save & Sync Room'}
              </button>
            )}
          </div>

        </form>

      </div>
    </div>
  );
};
