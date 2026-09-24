import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  User, 
  Settings, 
  Coins, 
  Gem, 
  ShieldCheck, 
  Trophy, 
  Sparkles, 
  LogOut, 
  Edit3, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  Music, 
  History, 
  Lock,
  ChevronRight,
  Share2,
  Download,
  Smartphone,
  Radio,
  Crown
} from 'lucide-react';
import { soundEffects } from '../../utils/audio';

export const MineProfileView: React.FC = () => {
  const { 
    currentUser, 
    setCurrentUser, 
    setShowRechargeModal, 
    claimDailyBonus, 
    setIsAdminMode, 
    logout,
    transactions,
    activeApkRelease,
    setShowApkDownloadModal,
    myRoom,
    joinRoom,
    liveRooms,
    setIsCreateRoomModalOpen,
    setIsRoomRentModalOpen,
    roomRents
  } = useApp();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState(currentUser.displayName);
  const [editBio, setEditBio] = useState(currentUser.bio);
  const [editCountry, setEditCountry] = useState(currentUser.country);
  const [editFlag, setEditFlag] = useState(currentUser.countryFlag);
  const [editAvatar, setEditAvatar] = useState(currentUser.avatar);

  // Privacy toggles
  const [hideLocation, setHideLocation] = useState(false);
  const [allowStrangersMessage, setAllowStrangersMessage] = useState(true);

  // Admin portal is strictly restricted to wajaht265374@gmail.com
  const isAdmin = currentUser.email?.toLowerCase().trim() === 'wajaht265374@gmail.com';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentUser(prev => ({
      ...prev,
      displayName: editName,
      bio: editBio,
      country: editCountry,
      countryFlag: editFlag,
      avatar: editAvatar
    }));
    setShowEditModal(false);
  };

  return (
    <div className="pb-24 pt-2 px-3.5 max-w-2xl mx-auto space-y-4">
      
      {/* 1. Main Profile Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-800/90 via-slate-900 to-slate-900 border border-slate-700/60 p-5 shadow-xl">
        
        {/* Top bar icons */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-mono font-bold text-slate-400">
            ID: 1000{currentUser.id.replace(/\D/g, '') || '7788'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Settings & Privacy"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* User Info Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.displayName} 
              className="w-16 h-16 rounded-full object-cover border-2 border-emerald-400 shadow-md"
            />
            <span className="absolute -bottom-1 -right-1 text-sm">
              {currentUser.countryFlag}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                {currentUser.displayName}
              </h2>
              {currentUser.isVerified && (
                <span className="text-emerald-400" title="Verified Broadcaster">
                  <ShieldCheck size={16} />
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 font-mono">@{currentUser.username}</p>
            
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-400/30 flex items-center gap-1">
                👑 Level {currentUser.level}
              </span>
              {currentUser.badges?.map((badge, idx) => (
                <span key={idx} className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full text-[10px] font-medium border border-purple-500/30">
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowEditModal(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Edit Profile"
          >
            <Edit3 size={16} />
          </button>
        </div>

        {/* Bio */}
        <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
          {currentUser.bio || "No bio yet. Tap edit to write something about yourself!"}
        </p>

        {/* Stats Grid: Following, Followers, Coins, Diamonds */}
        <div className="grid grid-cols-4 gap-2 text-center pt-3 border-t border-slate-800">
          <div>
            <span className="text-sm font-bold text-white block">{currentUser.followingCount}</span>
            <span className="text-[10px] text-slate-400">Following</span>
          </div>
          <div>
            <span className="text-sm font-bold text-white block">{currentUser.followersCount}</span>
            <span className="text-[10px] text-slate-400">Followers</span>
          </div>
          <div>
            <span className="text-sm font-bold text-amber-300 font-mono block">
              {currentUser.coins.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Coins 🪙</span>
          </div>
          <div>
            <span className="text-sm font-bold text-rose-400 font-mono block">
              {currentUser.diamonds.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Diamonds 💎</span>
          </div>
        </div>
      </div>

      {/* 2. Wallet & Daily Bonus Quick Action Card */}
      <div className="grid grid-cols-2 gap-3">
        {/* Recharge Card */}
        <div 
          onClick={() => setShowRechargeModal(true)}
          className="cursor-pointer bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 hover:border-amber-400/60 p-4 rounded-2xl flex flex-col justify-between transition-all active:scale-98"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-300">My Coin Wallet</span>
            <span className="text-lg">🪙</span>
          </div>
          <div>
            <span className="text-xl font-black text-amber-200 font-mono">
              {currentUser.coins.toLocaleString()}
            </span>
            <p className="text-[10px] text-amber-400/80 mt-1 flex items-center gap-1 font-bold">
              Top-Up Coins →
            </p>
          </div>
        </div>

        {/* Daily Bonus Card */}
        <div 
          onClick={() => claimDailyBonus()}
          className="cursor-pointer bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 hover:border-emerald-400/60 p-4 rounded-2xl flex flex-col justify-between transition-all active:scale-98"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-300">Daily Bonus</span>
            <span className="text-lg">🎁</span>
          </div>
          <div>
            <span className="text-sm font-black text-emerald-200 block">
              Claim 500 Coins
            </span>
            <p className="text-[10px] text-emerald-400/80 mt-1 flex items-center gap-1 font-bold">
              Check-in Now ✨
            </p>
          </div>
        </div>
      </div>

      {/* 3. SECURE ADMIN PORTAL ENTRY (Strictly visible ONLY to Admin) */}
      {isAdmin && (
        <div 
          id="admin-dashboard-access-card"
          onClick={() => setIsAdminMode(true)}
          className="cursor-pointer bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/70 border-2 border-amber-500/60 hover:border-amber-400 p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-amber-500/10 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-amber-300">Admin Control Center</h3>
                <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.2 rounded uppercase">
                  Protected
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Manage users, live rooms, reports, events, and community coins
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-amber-400" />
        </div>
      )}

      {/* 4. Menu Actions List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-2 space-y-1">
        
        {/* 4.1 My Room Button */}
        <button
          id="profile-my-room-btn"
          type="button"
          onClick={() => {
            if (myRoom) {
              joinRoom(myRoom);
            } else {
              setIsCreateRoomModalOpen(true);
            }
          }}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800 transition-colors text-slate-200 cursor-pointer active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
              <Radio size={16} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-200">My Room</span>
                {myRoom && (
                  <span className="text-[10px] font-extrabold bg-teal-500/30 text-teal-300 px-1.5 py-0.2 rounded-full">
                    Live
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                {myRoom ? myRoom.title : 'Enter your hosted party broadcast'}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-teal-400/60" />
        </button>

        {/* 4.2 Room Rent Button */}
        <button
          id="profile-room-rent-btn"
          type="button"
          onClick={() => {
            setIsRoomRentModalOpen(true);
          }}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800 transition-colors text-slate-200 border border-amber-500/20 bg-amber-500/5 cursor-pointer active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Crown size={16} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-200">Room Rent</span>
                <span className="text-[10px] font-extrabold bg-amber-500/30 text-amber-300 px-1.5 py-0.2 rounded-full">
                  VIP
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Rent 8-mic party room with official host privileges
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-amber-400/60" />
        </button>

        <button
          onClick={() => setShowHistoryModal(true)}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800 transition-colors text-slate-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
              <History size={16} />
            </div>
            <span className="text-xs font-bold">Transaction & Gift History</span>
          </div>
          <ChevronRight size={16} className="text-slate-500" />
        </button>

        <button
          id="profile-download-apk-btn"
          onClick={() => setShowApkDownloadModal(true)}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800 transition-colors text-slate-200 border border-teal-500/30 bg-teal-950/20"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
              <Download size={16} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-200">Download StarLive APK</span>
                <span className="text-[10px] font-extrabold bg-teal-500/30 text-teal-300 px-1.5 py-0.5 rounded-full">
                  {activeApkRelease?.version || 'Latest'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Direct official Android package</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-teal-400/60" />
        </button>

        <button
          onClick={() => setShowSettingsModal(true)}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800 transition-colors text-slate-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 text-purple-400">
              <Lock size={16} />
            </div>
            <span className="text-xs font-bold">Privacy & Account Security</span>
          </div>
          <ChevronRight size={16} className="text-slate-500" />
        </button>

        <button
          onClick={() => {
            navigator.clipboard?.writeText?.(window.location.href);
            setCopiedInviteLink(true);
            setTimeout(() => setCopiedInviteLink(false), 2500);
          }}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800 transition-colors text-slate-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 text-emerald-400">
              <Share2 size={16} />
            </div>
            <span className={`text-xs font-bold ${copiedInviteLink ? 'text-emerald-400' : ''}`}>
              {copiedInviteLink ? '✓ StarLive Invite Link Copied!' : 'Invite Friends & Earn Rewards'}
            </span>
          </div>
          <ChevronRight size={16} className="text-slate-500" />
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-rose-950/30 transition-colors text-rose-400"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <LogOut size={16} />
            </div>
            <span className="text-xs font-bold">Log Out</span>
          </div>
          <ChevronRight size={16} className="text-rose-500/60" />
        </button>

      </div>

      {/* MODAL: EDIT PROFILE */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 relative">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800"
            >
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-white mb-3">Edit Profile</h3>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Display Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Avatar Image URL</label>
                <input 
                  type="url" 
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Country</label>
                  <input 
                    type="text" 
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Flag Emoji</label>
                  <input 
                    type="text" 
                    value={editFlag}
                    onChange={(e) => setEditFlag(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Bio</label>
                <textarea 
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TRANSACTION HISTORY */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 relative max-h-[80vh] flex flex-col">
            <button 
              onClick={() => setShowHistoryModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800"
            >
              <X size={18} />
            </button>
            
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <History size={16} className="text-amber-400" />
              Coin Transaction History
            </h3>

            <div className="space-y-2 overflow-y-auto pr-1 flex-1">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">{tx.description}</p>
                    <span className="text-[10px] text-slate-400">{tx.createdAt}</span>
                  </div>
                  <span className={`font-mono font-bold ${
                    tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Coins
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRIVACY & SETTINGS */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 relative">
            <button 
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800"
            >
              <X size={18} />
            </button>

            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Settings size={18} className="text-emerald-400" />
              Settings & Privacy Controls
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60">
                <div>
                  <h4 className="text-xs font-bold text-white">Hide Country / Location</h4>
                  <p className="text-[11px] text-slate-400">Do not display country flag on profile and rooms</p>
                </div>
                <input 
                  type="checkbox"
                  checked={hideLocation}
                  onChange={(e) => setHideLocation(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60">
                <div>
                  <h4 className="text-xs font-bold text-white">Allow Messages from Strangers</h4>
                  <p className="text-[11px] text-slate-400">Receive direct chats from non-followers</p>
                </div>
                <input 
                  type="checkbox"
                  checked={allowStrangersMessage}
                  onChange={(e) => setAllowStrangersMessage(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40 text-[11px] text-slate-400">
                🔒 StarLive Cloud Infrastructure backed by Firebase Auth & Firestore Rules ABAC Zero-Trust security.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
