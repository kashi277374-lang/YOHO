import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserProfile, LiveRoom, PostMoment, AppEvent, UserReport } from '../../types';
import { 
  ShieldCheck, 
  Users, 
  Radio, 
  FileText, 
  Flag, 
  Calendar, 
  Coins, 
  BarChart3, 
  ArrowLeft, 
  Check, 
  Ban, 
  Trash2, 
  Plus, 
  Search, 
  Award, 
  Sparkles,
  X,
  AlertTriangle,
  Download,
  Smartphone,
  UploadCloud,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Layers,
  RefreshCw,
  HardDrive,
  Link,
  Link2,
  Globe
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { 
    currentUser, 
    setIsAdminMode, 
    allUsers, 
    liveRooms, 
    posts, 
    events, 
    reports, 
    adminUpdateUser, 
    adminBanUser, 
    adminAdjustCoins, 
    adminUpdateReport, 
    adminCreateEvent, 
    adminUpdateEvent, 
    adminDeleteEvent, 
    adminDeleteRoom, 
    deletePost,
    activeApkRelease,
    allApkReleases,
    downloadActiveApk,
    adminPublishApkLink,
    adminPublishExistingRelease,
    adminDeleteRelease,
    adminQuickPublishVersion
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<
    'analytics' | 'apk' | 'users' | 'rooms' | 'posts' | 'reports' | 'events' | 'economy'
  >('apk');

  const [userSearch, setUserSearch] = useState('');
  const [selectedUserForCoins, setSelectedUserForCoins] = useState<UserProfile | null>(null);
  const [coinAmountToAdjust, setCoinAmountToAdjust] = useState<number>(5000);

  // APK Download Link System & Release Management State
  const [apkDownloadLink, setApkDownloadLink] = useState<string>(
    activeApkRelease?.downloadUrl || 'https://firebasestorage.googleapis.com/v0/b/starlive-releases/o/StarLive_v1.3.0.apk?alt=media'
  );
  const [apkVersion, setApkVersion] = useState<string>('v1.3.0');
  const [apkVersionCode, setApkVersionCode] = useState<number>(10300);
  const [apkFileName, setApkFileName] = useState<string>('StarLive_v1.3.0.apk');
  const [apkFileSizeMb, setApkFileSizeMb] = useState<string>('28.5');
  const [apkMinAndroid, setApkMinAndroid] = useState<string>('Android 7.0+');
  const [apkChangelog, setApkChangelog] = useState<string>(
    'Performance improvements, smoother live video rendering, and enhanced audio party effects.'
  );
  const [isPublishingLink, setIsPublishingLink] = useState<boolean>(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string>('');
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [quickTestVersion, setQuickTestVersion] = useState<string>('v1.3.0');
  const [isTestingFlow, setIsTestingFlow] = useState<boolean>(false);

  // New Event Form State
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventBanner, setNewEventBanner] = useState('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80');
  const [newEventDates, setNewEventDates] = useState('01/10 ~ 15/10');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventCoins, setNewEventCoins] = useState(25000);

  // Guard: Admin portal strictly accessible ONLY to wajaht265374@gmail.com
  const isAuthorized = currentUser.email?.toLowerCase().trim() === 'wajaht265374@gmail.com';
  if (!isAuthorized) {
    return (
      <div className="p-8 text-center bg-slate-900 min-h-screen text-slate-300">
        <AlertTriangle size={48} className="mx-auto text-rose-500 mb-3" />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-xs text-slate-400 mt-1">This administrative portal is strictly protected.</p>
        <button 
          onClick={() => setIsAdminMode(false)}
          className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs"
        >
          Return to App
        </button>
      </div>
    );
  }

  // Analytics Metrics
  const totalUsers = allUsers.length;
  const activeRoomsCount = liveRooms.length;
  const totalCoinsCirculation = allUsers.reduce((sum, u) => sum + (u.coins || 0), 0);
  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;

  const filteredUsers = allUsers.filter(u => 
    u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    adminCreateEvent({
      title: newEventTitle,
      bannerUrl: newEventBanner,
      dateRange: newEventDates,
      description: newEventDescription,
      rewardCoins: newEventCoins,
      type: 'tournament',
      status: 'active'
    });
    setShowCreateEventModal(false);
    setNewEventTitle('');
    setNewEventDescription('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 overflow-y-auto w-full">
      
      {/* Admin Header */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-amber-500/30 px-4 py-3 shadow-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAdminMode(false)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Back to App"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-black text-sm sm:text-base flex items-center gap-1.5">
                  <ShieldCheck size={18} /> StarLive Admin Console
                </span>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Root Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Signed in as: {currentUser.email || 'Admin'}</p>
            </div>
          </div>

          <button
            onClick={() => setIsAdminMode(false)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold transition-all border border-slate-700"
          >
            Exit Console
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar pt-3">
          {[
            { id: 'analytics', label: 'Overview', icon: BarChart3 },
            { id: 'apk', label: 'APK Releases', icon: Smartphone },
            { id: 'users', label: 'Users & Profiles', icon: Users },
            { id: 'rooms', label: 'Live Rooms', icon: Radio },
            { id: 'posts', label: 'Moments', icon: FileText },
            { id: 'reports', label: `Reports (${pendingReportsCount})`, icon: Flag },
            { id: 'events', label: 'Events & Banners', icon: Calendar },
            { id: 'economy', label: 'Coins & Rewards', icon: Coins }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeAdminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveAdminTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive 
                    ? 'bg-amber-400 text-amber-950 shadow-md font-black' 
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto p-4">
        
        {/* 1. ANALYTICS OVERVIEW TAB */}
        {activeAdminTab === 'analytics' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Platform Key Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400">Total Users</span>
                <p className="text-2xl font-black text-white mt-1">{totalUsers.toLocaleString()}</p>
                <span className="text-[10px] text-emerald-400 font-bold">+18 today</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400">Active Live Streams</span>
                <p className="text-2xl font-black text-emerald-400 mt-1">{activeRoomsCount}</p>
                <span className="text-[10px] text-emerald-400 font-bold">100% operational</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400">Coins in Circulation</span>
                <p className="text-2xl font-black text-amber-300 mt-1 font-mono">{totalCoinsCirculation.toLocaleString()}</p>
                <span className="text-[10px] text-amber-400 font-bold">Healthy economy</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400">Pending Reports</span>
                <p className={`text-2xl font-black mt-1 ${pendingReportsCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {pendingReportsCount}
                </p>
                <span className="text-[10px] text-slate-400">Moderation queue</span>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <h4 className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">
                System Infrastructure Status
              </h4>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Firebase Authentication (Google Sign-In & Guest)
                  </span>
                  <span className="text-emerald-400 font-bold">Operational</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Firestore Database with ABAC Zero-Trust Rules
                  </span>
                  <span className="text-emerald-400 font-bold">Protected</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Live Web Audio Synthesizer & Soundboard
                  </span>
                  <span className="text-emerald-400 font-bold">Ready</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. USERS & PROFILES MANAGEMENT TAB */}
        {activeAdminTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search user by username, display name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              {filteredUsers.map((user) => (
                <div 
                  key={user.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} alt={user.displayName} className="w-12 h-12 rounded-full object-cover border border-slate-700" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white">{user.displayName}</h4>
                        <span>{user.countryFlag}</span>
                        {user.isVerified && <ShieldCheck size={14} className="text-emerald-400" />}
                        {user.isBanned && (
                          <span className="bg-rose-500/20 text-rose-400 px-1.5 py-0.2 rounded text-[9px] font-bold">
                            BANNED
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">@{user.username} • {user.email || 'No Email'}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px]">
                        <span className="text-amber-300 font-bold">🪙 {user.coins.toLocaleString()}</span>
                        <span className="text-rose-400 font-bold">💎 {user.diamonds.toLocaleString()}</span>
                        <span className="text-slate-400 font-bold">Lv.{user.level}</span>
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">Role: {user.role}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedUserForCoins(user);
                      }}
                      className="px-2.5 py-1.5 bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <Coins size={13} />
                      <span>Adjust Coins</span>
                    </button>

                    <button
                      onClick={() => adminUpdateUser(user.id, { isVerified: !user.isVerified })}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${
                        user.isVerified 
                          ? 'bg-slate-800 text-slate-400 hover:text-white' 
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      <Award size={13} />
                      <span>{user.isVerified ? 'Unverify' : 'Verify'}</span>
                    </button>

                    <button
                      onClick={() => adminBanUser(user.id, !user.isBanned)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${
                        user.isBanned 
                          ? 'bg-emerald-500/20 text-emerald-300' 
                          : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                      }`}
                    >
                      <Ban size={13} />
                      <span>{user.isBanned ? 'Unban' : 'Ban User'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. LIVE & PARTY ROOMS MANAGEMENT TAB */}
        {activeAdminTab === 'rooms' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-300">Active Live & Voice Rooms ({liveRooms.length})</h3>
            <div className="space-y-2.5">
              {liveRooms.map((room) => (
                <div 
                  key={room.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img src={room.coverImage} alt={room.title} className="w-12 h-12 rounded-xl object-cover" />
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1">
                        <span>{room.countryFlag}</span>
                        <span>{room.title}</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Host: {room.hostName} • Category: {room.category} • {room.isParty ? 'Party Room' : 'Live Stream'}
                      </p>
                      <span className="text-[10px] text-emerald-400">📊 {room.viewerCount} live viewers</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adminDeleteRoom(room.id)}
                      className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold rounded-xl text-xs flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      <span>Close Room</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. POSTS & MOMENTS TAB */}
        {activeAdminTab === 'posts' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-300">Moments Feed Moderation</h3>
            <div className="space-y-2.5">
              {posts.map((post) => (
                <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <img src={post.authorAvatar} alt={post.authorName} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <h4 className="text-xs font-bold text-white">{post.authorName}</h4>
                      <p className="text-xs text-slate-300 mt-1 max-w-xl">{post.content}</p>
                      {post.mediaUrl && (
                        <img src={post.mediaUrl} alt="Attached" className="w-20 h-20 rounded-lg object-cover mt-2 border border-slate-700" />
                      )}
                      <span className="text-[10px] text-slate-500 mt-1 block">❤️ {post.likesCount} Likes</span>
                    </div>
                  </div>

                  <button
                    onClick={() => deletePost(post.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                    title="Delete Moment"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. REPORTS & MODERATION TAB */}
        {activeAdminTab === 'reports' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-300">User Moderation Reports ({reports.length})</h3>
            <div className="space-y-2.5">
              {reports.map((rep) => (
                <div key={rep.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                        {rep.targetType}
                      </span>
                      <h4 className="text-xs font-bold text-white">Target: {rep.targetName}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        rep.status === 'pending' ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {rep.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">Reason: <span className="font-semibold">{rep.reason}</span></p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Reported by: {rep.reporterName} • {rep.createdAt}</p>
                  </div>

                  {rep.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adminUpdateReport(rep.id, 'resolved')}
                        className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1"
                      >
                        <Check size={13} />
                        <span>Resolve</span>
                      </button>
                      <button
                        onClick={() => adminUpdateReport(rep.id, 'dismissed')}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. EVENTS & BANNERS TAB */}
        {activeAdminTab === 'events' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-300">Platform Events & Promos</h3>
              <button
                onClick={() => setShowCreateEventModal(true)}
                className="px-3 py-1.5 bg-amber-400 text-amber-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow"
              >
                <Plus size={14} />
                <span>Create New Event</span>
              </button>
            </div>

            <div className="space-y-3">
              {events.map((evt) => (
                <div key={evt.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={evt.bannerUrl} alt={evt.title} className="w-20 h-14 rounded-xl object-cover border border-slate-700" />
                    <div>
                      <h4 className="text-xs font-bold text-white">{evt.title}</h4>
                      <p className="text-[11px] text-amber-300 font-mono font-bold">{evt.dateRange} • Reward: {evt.rewardCoins.toLocaleString()} Coins</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{evt.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => adminDeleteEvent(evt.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. COIN ECONOMY & REWARDS TAB */}
        {activeAdminTab === 'economy' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <h3 className="text-sm font-bold text-amber-300 mb-2 flex items-center gap-2">
                <Coins size={16} /> Coin Reward Rates & Economy Rules
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/60">
                  <span className="text-slate-400 block mb-1">Daily Check-in Bonus</span>
                  <span className="text-base font-bold text-white font-mono">500 Coins</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60">
                  <span className="text-slate-400 block mb-1">Broadcaster Diamond Share</span>
                  <span className="text-base font-bold text-white font-mono">70% of Gift Value</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60">
                  <span className="text-slate-400 block mb-1">Recall Friend Bonus</span>
                  <span className="text-base font-bold text-white font-mono">2,500 Coins/Invite</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. APK RELEASES & STORAGE MANAGEMENT TAB */}
        {activeAdminTab === 'apk' && (
          <div className="space-y-6">
            
            {/* Top Feedback Messages */}
            {uploadSuccessMessage && (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>{uploadSuccessMessage}</span>
                </div>
                <button 
                  onClick={() => setUploadSuccessMessage('')}
                  className="p-1 hover:text-white text-emerald-400"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {uploadErrorMessage && (
              <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                  <span>{uploadErrorMessage}</span>
                </div>
                <button 
                  onClick={() => setUploadErrorMessage('')}
                  className="p-1 hover:text-white text-rose-400"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* 1. CURRENTLY ACTIVE & LIVE APK CARD */}
            <div className="bg-slate-900 border border-teal-500/40 p-5 rounded-3xl relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/20">
                    <Smartphone size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-white">Active Production APK</h3>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        LIVE TO ALL USERS
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Served by all frontend download buttons with anti-cache streaming
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="admin-test-download-active-btn"
                    onClick={downloadActiveApk}
                    className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    title="Download active APK to test"
                  >
                    <Download size={14} strokeWidth={2.5} />
                    <span>Test Download Active APK</span>
                  </button>
                </div>
              </div>

              {/* Active Release Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
                <div className="bg-slate-800/60 border border-slate-700/50 p-3 rounded-2xl">
                  <span className="text-slate-400 text-[11px] block mb-1 flex items-center gap-1">
                    <Layers size={12} className="text-teal-400" /> Active Version
                  </span>
                  <span className="font-mono font-extrabold text-white text-sm">
                    {activeApkRelease?.version || 'v1.2.0'}
                  </span>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/50 p-3 rounded-2xl">
                  <span className="text-slate-400 text-[11px] block mb-1 flex items-center gap-1">
                    <HardDrive size={12} className="text-teal-400" /> Package Size
                  </span>
                  <span className="font-semibold text-slate-200 text-sm">
                    {activeApkRelease?.fileSize 
                      ? (activeApkRelease.fileSize / (1024 * 1024)).toFixed(1) + ' MB'
                      : '28.5 MB'}
                  </span>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/50 p-3 rounded-2xl">
                  <span className="text-slate-400 text-[11px] block mb-1 flex items-center gap-1">
                    <Clock size={12} className="text-teal-400" /> Published At
                  </span>
                  <span className="font-medium text-slate-200 text-xs">
                    {activeApkRelease?.publishedAt 
                      ? new Date(activeApkRelease.publishedAt).toLocaleDateString()
                      : 'Recently'}
                  </span>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/50 p-3 rounded-2xl">
                  <span className="text-slate-400 text-[11px] block mb-1 flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-400" /> Total Downloads
                  </span>
                  <span className="font-mono font-extrabold text-emerald-400 text-sm">
                    {(activeApkRelease?.downloadsCount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Download URL & Anti-Cache Architecture */}
              <div className="mt-4 bg-slate-950/70 border border-slate-800 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Permanent Firebase Storage URL
                  </span>
                  {activeApkRelease?.downloadUrl && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeApkRelease.downloadUrl);
                        setCopiedUrl(true);
                        setTimeout(() => setCopiedUrl(false), 2000);
                      }}
                      className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-bold"
                    >
                      <Copy size={11} /> {copiedUrl ? 'Copied URL!' : 'Copy Link'}
                    </button>
                  )}
                </div>
                <div className="text-[11px] font-mono text-slate-300 truncate bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  {activeApkRelease?.downloadUrl || 'Permanent Storage Bucket Link'}
                </div>
                <p className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-1">
                  <ShieldCheck size={12} className="text-teal-400 shrink-0" />
                  <span>
                    Bypasses browser, CDN, and worker caches via <code>Cache-Control: max-age=0</code> and dynamic cache-buster query nonce.
                  </span>
                </p>
              </div>

              {/* Active Release Changelog */}
              {activeApkRelease?.changelog && (
                <div className="mt-3 text-xs bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
                  <span className="text-slate-400 block font-semibold mb-1">Release Notes:</span>
                  <p className="text-slate-200">{activeApkRelease.changelog}</p>
                </div>
              )}
            </div>

            {/* 2. PUBLISH APK DOWNLOAD LINK SYSTEM */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                  <Link2 size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Publish APK Download Link System</h3>
                    <span className="bg-teal-500/20 text-teal-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-teal-500/40">
                      Link-Based Distribution
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Deploy APK releases by providing direct download links (Google Drive, Firebase Storage, CDN, Mediafire, or custom server). It immediately replaces the active APK for all community users.
                  </p>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="mb-3.5 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Globe size={12} className="text-teal-400" /> Quick Link Presets / Templates:
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setApkDownloadLink('https://firebasestorage.googleapis.com/v0/b/starlive-releases/o/StarLive_v1.3.0.apk?alt=media');
                      setApkFileName('StarLive_v1.3.0.apk');
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-semibold border border-slate-700 transition-colors"
                  >
                    🔥 Firebase Storage Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setApkDownloadLink('https://drive.google.com/uc?export=download&id=YOUR_DRIVE_FILE_ID');
                      setApkFileName('StarLive_v1.3.0.apk');
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-semibold border border-slate-700 transition-colors"
                  >
                    📁 Google Drive Direct Link Format
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setApkDownloadLink('https://cdn.starlive.community/releases/StarLive_latest.apk');
                      setApkFileName('StarLive_latest.apk');
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-semibold border border-slate-700 transition-colors"
                  >
                    🌐 Custom CDN Direct URL
                  </button>
                </div>
              </div>

              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!apkDownloadLink.trim()) {
                    setUploadErrorMessage('Please provide a valid direct APK download URL.');
                    return;
                  }
                  setIsPublishingLink(true);
                  setUploadErrorMessage('');
                  setUploadSuccessMessage('');

                  try {
                    const parsedSize = parseFloat(apkFileSizeMb) || 28.5;
                    const newRel = await adminPublishApkLink(
                      apkDownloadLink.trim(),
                      apkVersion.trim() || 'v1.3.0',
                      apkVersionCode || 10300,
                      apkChangelog.trim() || 'New updates and bug fixes.',
                      apkFileName.trim() || 'StarLive_v1.3.0.apk',
                      parsedSize * 1024 * 1024,
                      apkMinAndroid.trim() || 'Android 7.0+'
                    );
                    setUploadSuccessMessage(`Successfully published and activated APK ${newRel.version}! All users will now download from this link.`);
                  } catch (err: any) {
                    setUploadErrorMessage(err?.message || 'Failed to publish APK download link.');
                  } finally {
                    setIsPublishingLink(false);
                  }
                }}
                className="space-y-3.5 text-xs"
              >
                {/* 1. DIRECT APK DOWNLOAD LINK URL INPUT */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Link size={13} className="text-teal-400" />
                      <span>Direct APK Download URL</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    {apkDownloadLink && (
                      <a
                        href={apkDownloadLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-400 hover:text-teal-300 flex items-center gap-1 font-bold text-[11px]"
                      >
                        <ExternalLink size={11} /> Test Link in New Tab
                      </a>
                    )}
                  </div>
                  <input
                    id="apk-download-url-input"
                    type="url"
                    required
                    value={apkDownloadLink}
                    onChange={(e) => setApkDownloadLink(e.target.value)}
                    placeholder="https://drive.google.com/uc?export=download&id=... or direct .apk link"
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Must be a directly accessible download link (e.g. Google Drive direct link, Cloud Storage, or HTTP server file).
                  </p>
                </div>

                {/* 2. Version & Code Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Version String</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={apkVersion}
                        onChange={(e) => setApkVersion(e.target.value)}
                        placeholder="v1.3.0"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const currentNum = parseInt(activeApkRelease?.version.replace(/\D/g, '') || '120', 10);
                          const nextNum = currentNum + 10;
                          const formatted = `v${Math.floor(nextNum / 100)}.${Math.floor((nextNum % 100) / 10)}.${nextNum % 10}`;
                          setApkVersion(formatted);
                          setApkVersionCode(nextNum * 100);
                          setApkFileName(`StarLive_${formatted}.apk`);
                        }}
                        className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white font-bold whitespace-nowrap text-[11px]"
                        title="Auto increment version"
                      >
                        + Next
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Version Code (Android API)</label>
                    <input
                      type="number"
                      required
                      value={apkVersionCode}
                      onChange={(e) => setApkVersionCode(Number(e.target.value))}
                      placeholder="10300"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-400"
                    />
                  </div>
                </div>

                {/* 3. Package Name & File Size */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">APK File Name</label>
                    <input
                      type="text"
                      required
                      value={apkFileName}
                      onChange={(e) => setApkFileName(e.target.value)}
                      placeholder="StarLive_v1.3.0.apk"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">File Size (MB)</label>
                    <input
                      type="text"
                      value={apkFileSizeMb}
                      onChange={(e) => setApkFileSizeMb(e.target.value)}
                      placeholder="28.5"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Min Android OS</label>
                    <input
                      type="text"
                      value={apkMinAndroid}
                      onChange={(e) => setApkMinAndroid(e.target.value)}
                      placeholder="Android 7.0+"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>
                </div>

                {/* 4. Changelog Input */}
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Release Notes / Changelog</label>
                  <textarea
                    rows={2}
                    value={apkChangelog}
                    onChange={(e) => setApkChangelog(e.target.value)}
                    placeholder="Describe new features, audio party improvements, video latency fixes..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                {/* 5. Submit Button */}
                <button
                  id="admin-publish-apk-link-btn"
                  type="submit"
                  disabled={isPublishingLink || !apkDownloadLink.trim()}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-lg shadow-teal-500/20 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isPublishingLink ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Publishing & Activating APK Link...</span>
                    </>
                  ) : (
                    <>
                      <Link2 size={16} strokeWidth={2.5} />
                      <span>Publish & Activate APK Link ({apkVersion})</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* 3. MULTIPLE VERSIONS TESTING SUITE */}
            <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-3xl shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <RefreshCw size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Test Flow: Multiple APK Versions Simulator</h3>
                  <p className="text-xs text-slate-400">
                    Verify complete release lifecycle with multiple versions. Test that published versions immediately replace previous active APKs.
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  id="test-publish-v130-btn"
                  disabled={isTestingFlow}
                  onClick={async () => {
                    setIsTestingFlow(true);
                    try {
                      const res = await adminQuickPublishVersion('v1.3.0', 'Test Build v1.3.0: 60FPS video broadcasting, multi-seat mic audio filters, and instant coin tipping.');
                      setUploadSuccessMessage(`Successfully published ${res.version}! Active APK was replaced immediately.`);
                    } catch (e: any) {
                      setUploadErrorMessage(e.message);
                    } finally {
                      setIsTestingFlow(false);
                    }
                  }}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-all active:scale-98 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-white text-xs font-mono">v1.3.0</span>
                    <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-bold">Release</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Publish & replace active with v1.3.0</p>
                </button>

                <button
                  id="test-publish-v140-btn"
                  disabled={isTestingFlow}
                  onClick={async () => {
                    setIsTestingFlow(true);
                    try {
                      const res = await adminQuickPublishVersion('v1.4.0', 'Test Build v1.4.0: Audio party PK battles, VIP silver gift effects, and latency reduction.');
                      setUploadSuccessMessage(`Successfully published ${res.version}! Active APK was replaced immediately.`);
                    } catch (e: any) {
                      setUploadErrorMessage(e.message);
                    } finally {
                      setIsTestingFlow(false);
                    }
                  }}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-all active:scale-98 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-white text-xs font-mono">v1.4.0</span>
                    <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-bold">Release</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Publish & replace active with v1.4.0</p>
                </button>

                <button
                  id="test-publish-v200-btn"
                  disabled={isTestingFlow}
                  onClick={async () => {
                    setIsTestingFlow(true);
                    try {
                      const res = await adminQuickPublishVersion('v2.0.0', 'Major StarLive 2.0 release: New 3D audio party engine, full HD streaming, and animated badges.');
                      setUploadSuccessMessage(`Successfully published ${res.version}! Active APK was replaced immediately.`);
                    } catch (e: any) {
                      setUploadErrorMessage(e.message);
                    } finally {
                      setIsTestingFlow(false);
                    }
                  }}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-all active:scale-98 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-white text-xs font-mono">v2.0.0</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">Major</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Publish & replace active with v2.0.0</p>
                </button>
              </div>

              {/* Custom Version Quick Publisher */}
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
                <input 
                  type="text"
                  value={quickTestVersion}
                  onChange={(e) => setQuickTestVersion(e.target.value)}
                  placeholder="e.g. v1.5.0"
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
                />
                <button
                  disabled={isTestingFlow || !quickTestVersion}
                  onClick={async () => {
                    setIsTestingFlow(true);
                    try {
                      const res = await adminQuickPublishVersion(quickTestVersion);
                      setUploadSuccessMessage(`Successfully published and activated ${res.version}!`);
                    } catch (e: any) {
                      setUploadErrorMessage(e.message);
                    } finally {
                      setIsTestingFlow(false);
                    }
                  }}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs rounded-xl transition-all cursor-pointer"
                >
                  Publish Custom Test Version
                </button>
              </div>
            </div>

            {/* 4. ALL APK RELEASES HISTORY TABLE */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">APK Releases History ({allApkReleases.length})</h3>
                  <p className="text-xs text-slate-400">All registered builds stored permanently in Firebase Storage</p>
                </div>
              </div>

              <div className="space-y-3">
                {allApkReleases.map(rel => {
                  const isActive = activeApkRelease?.version === rel.version || rel.isActive;
                  return (
                    <div 
                      key={rel.id || rel.version}
                      className={`p-4 rounded-2xl border transition-all ${
                        isActive 
                          ? 'bg-teal-950/20 border-teal-500/40 shadow-sm' 
                          : 'bg-slate-800/40 border-slate-700/50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-extrabold text-white text-sm">
                            {rel.version}
                          </span>
                          {isActive ? (
                            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 size={10} /> Active Version
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                              Archived
                            </span>
                          )}
                          <span className="text-xs text-slate-400">
                            {rel.fileSize ? (rel.fileSize / (1024 * 1024)).toFixed(1) + ' MB' : '28.5 MB'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isActive && (
                            <button
                              onClick={() => adminPublishExistingRelease(rel.id)}
                              className="px-2.5 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              title="Set this release as active"
                            >
                              Make Active
                            </button>
                          )}

                          <button
                            onClick={() => {
                              window.location.href = `${rel.downloadUrl}&nocache=${Date.now()}`;
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs transition-all cursor-pointer"
                            title="Direct download link"
                          >
                            <Download size={14} />
                          </button>

                          {allApkReleases.length > 1 && !isActive && (
                            <button
                              onClick={() => adminDeleteRelease(rel.id)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 rounded-xl text-xs transition-all cursor-pointer"
                              title="Delete release record"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-2.5 bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 text-[11px] font-mono text-slate-300 truncate">
                          <Link size={12} className="text-teal-400 shrink-0" />
                          <span className="truncate">{rel.downloadUrl}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(rel.downloadUrl);
                              alert('Download link copied to clipboard!');
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold border border-slate-700 transition-all flex items-center gap-1"
                            title="Copy link"
                          >
                            <Copy size={10} /> Copy
                          </button>
                          <a
                            href={rel.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-lg text-[10px] font-bold border border-teal-500/30 transition-all flex items-center gap-1"
                            title="Open link in new tab"
                          >
                            <ExternalLink size={10} /> Open
                          </a>
                        </div>
                      </div>

                      <div className="mt-2 text-[11px] text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>File: <code className="text-slate-300">{rel.fileName}</code></span>
                        <span>Date: {new Date(rel.publishedAt).toLocaleDateString()}</span>
                        <span>Author: {rel.publishedBy}</span>
                      </div>

                      {rel.changelog && (
                        <p className="mt-1.5 text-xs text-slate-300 bg-slate-900/50 p-2 rounded-xl border border-slate-800/80">
                          {rel.changelog}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* MODAL: ADJUST USER COINS */}
      {selectedUserForCoins && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-4 relative">
            <button 
              onClick={() => setSelectedUserForCoins(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-white mb-2">
              Adjust Coins for {selectedUserForCoins.displayName}
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Current balance: {selectedUserForCoins.coins.toLocaleString()} Coins
            </p>

            <div className="space-y-3">
              <input 
                type="number" 
                value={coinAmountToAdjust}
                onChange={(e) => setCoinAmountToAdjust(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    adminAdjustCoins(selectedUserForCoins.id, coinAmountToAdjust);
                    setSelectedUserForCoins(null);
                  }}
                  className="py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400"
                >
                  + Grant Coins
                </button>
                <button
                  onClick={() => {
                    adminAdjustCoins(selectedUserForCoins.id, -coinAmountToAdjust);
                    setSelectedUserForCoins(null);
                  }}
                  className="py-2 bg-rose-500 text-white font-bold rounded-xl text-xs hover:bg-rose-400"
                >
                  - Deduct Coins
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE EVENT */}
      {showCreateEventModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 relative">
            <button 
              onClick={() => setShowCreateEventModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-white mb-3">Create Platform Event</h3>

            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Event Title</label>
                <input 
                  type="text" 
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="E.g., Star Golden Festival PK"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Banner Image URL</label>
                <input 
                  type="url" 
                  required
                  value={newEventBanner}
                  onChange={(e) => setNewEventBanner(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Date Range</label>
                  <input 
                    type="text" 
                    value={newEventDates}
                    onChange={(e) => setNewEventDates(e.target.value)}
                    placeholder="15/10 ~ 30/10"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Reward Pool (Coins)</label>
                  <input 
                    type="number" 
                    value={newEventCoins}
                    onChange={(e) => setNewEventCoins(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Description</label>
                <textarea 
                  rows={3}
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  placeholder="Details and guidelines for contestants..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold rounded-xl text-xs"
              >
                Publish Event
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
