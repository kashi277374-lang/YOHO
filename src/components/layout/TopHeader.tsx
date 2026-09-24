import React from 'react';
import { useApp } from '../../context/AppContext';
import { Search, ShieldCheck, Plus, Download } from 'lucide-react';

interface TopHeaderProps {
  activeSubTab?: 'mine' | 'popular';
  setActiveSubTab?: (tab: 'mine' | 'popular') => void;
  onOpenSearch?: () => void;
  onOpenGoLive?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ 
  activeSubTab: propActiveSubTab, 
  setActiveSubTab: propSetActiveSubTab,
  onOpenSearch,
  onOpenGoLive,
}) => {
  const { 
    currentUser, 
    setShowRechargeModal, 
    setIsSearchOpen, 
    setIsCreateRoomModalOpen,
    canCreateRoom,
    userActiveRoomsCount,
    currentTab,
    setCurrentTab,
    isAdminMode,
    setIsAdminMode,
    activeApkRelease,
    setShowApkDownloadModal
  } = useApp();

  const activeSub = propActiveSubTab ?? 'popular';

  const handleSelectSubTab = (tab: 'mine' | 'popular') => {
    if (typeof propSetActiveSubTab === 'function') {
      propSetActiveSubTab(tab);
    }
    // Keep user on the main Room/Home screen (discover), do NOT switch to mine profile page
    if (currentTab !== 'discover') {
      setCurrentTab('discover');
    }
  };

  // Admin entry is strictly restricted to wajaht265374@gmail.com
  const isAdmin = currentUser.email?.toLowerCase().trim() === 'wajaht265374@gmail.com';

  return (
    <header className="sticky top-0 z-30 w-full bg-gradient-to-r from-[#20d7a6] via-[#26deab] to-[#4eedc4] text-white px-2 sm:px-3.5 pt-2.5 sm:pt-3 pb-2 sm:pb-2.5 shadow-sm">
      <div className="w-full max-w-md mx-auto flex items-center justify-between gap-1 sm:gap-2">
        
        {/* Left: Coin Counter Pill (matching reference screenshot with cream pill & coin) */}
        <button
          id="top-coin-counter-btn"
          onClick={() => setShowRechargeModal(true)}
          className="flex items-center gap-1 sm:gap-1.5 bg-[#fff8d6] border border-[#fef08a] text-[#854d0e] px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-black shadow-sm active:scale-95 transition-all shrink-0 cursor-pointer"
          title="Click to recharge coins"
        >
          <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-[9px] sm:text-[10px] font-black shadow-inner shrink-0">
            🪙
          </div>
          <span className="font-mono tracking-tight font-extrabold text-[10.5px] sm:text-xs text-amber-900 truncate max-w-[55px] sm:max-w-none">
            {currentUser.coins.toLocaleString()}
          </span>
        </button>

        {/* Center: Tabs "Mine" & "Popular" + "Create Room" Option */}
        <div className="flex items-center gap-1.5 min-[360px]:gap-2 sm:gap-4 shrink min-w-0">
          <button
            id="tab-mine-btn"
            onClick={() => handleSelectSubTab('mine')}
            className={`text-xs sm:text-base font-bold transition-all relative py-0.5 px-0.5 ${
              activeSub === 'mine' ? 'text-white' : 'text-white/80 hover:text-white font-medium'
            }`}
          >
            Mine
            {activeSub === 'mine' && (
              <span className="block w-3.5 sm:w-5 h-0.5 sm:h-1 bg-white rounded-full mx-auto mt-0.5 shadow-sm" />
            )}
          </button>

          <button
            id="tab-popular-btn"
            onClick={() => handleSelectSubTab('popular')}
            className={`text-sm sm:text-lg font-black transition-all relative py-0.5 px-0.5 ${
              activeSub === 'popular' ? 'text-white' : 'text-white/80 hover:text-white font-medium'
            }`}
          >
            Popular
            {activeSub === 'popular' && (
              <span className="block w-4 sm:w-6 h-0.5 sm:h-1 bg-white rounded-full mx-auto mt-0.5 shadow-sm" />
            )}
          </button>

          {/* "Create Room" Option with responsive text and 2-room limit indicator */}
          <button
            id="tab-create-room-btn"
            onClick={() => {
              if (onOpenGoLive) {
                onOpenGoLive();
              } else {
                setIsCreateRoomModalOpen(true);
              }
            }}
            className={`flex items-center gap-0.5 sm:gap-1 border px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-black shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              !canCreateRoom
                ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/50 text-amber-200'
                : 'bg-white/20 hover:bg-white/30 border-white/50 text-white'
            }`}
            title={!canCreateRoom ? "You can create a maximum of 2 rooms." : "Create Room"}
          >
            <Plus size={12} strokeWidth={3} className={!canCreateRoom ? 'text-amber-300 shrink-0' : 'text-white shrink-0'} />
            <span className="hidden min-[380px]:inline">{canCreateRoom ? (userActiveRoomsCount === 1 ? 'Create 2nd Room' : 'Create Room') : 'Rooms (2/2)'}</span>
            <span className="min-[380px]:hidden inline">{canCreateRoom ? 'Create' : '2/2'}</span>
          </button>

          {/* Separate Download Icon next to Create Room */}
          <button
            id="top-download-apk-btn"
            onClick={() => setShowApkDownloadModal(true)}
            className="p-1 sm:p-1.5 rounded-full bg-white/20 hover:bg-white/30 border border-white/40 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-xs"
            title={`Download StarLive Android APK (${activeApkRelease?.version || 'Latest'})`}
          >
            <Download size={13} strokeWidth={2.5} className="text-white shrink-0" />
          </button>
        </div>

        {/* Right: Admin toggle & Search */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {isAdmin && (
            <button
              id="admin-mode-toggle-btn"
              onClick={() => setIsAdminMode(!isAdminMode)}
              className={`p-1 sm:p-1.5 rounded-full text-xs font-bold flex items-center justify-center transition-all shrink-0 ${
                isAdminMode 
                  ? 'bg-amber-400 text-slate-950 shadow-md' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              title="Admin Mode"
            >
              <ShieldCheck size={15} />
            </button>
          )}

          <button
            id="top-search-btn"
            onClick={() => {
              if (onOpenSearch) onOpenSearch();
              else setIsSearchOpen(true);
            }}
            className="p-1 sm:p-1.5 rounded-full text-white hover:bg-white/20 transition-colors active:scale-95 shrink-0"
            title="Search"
          >
            <Search size={19} strokeWidth={2.5} className="sm:w-5 sm:h-5" />
          </button>
        </div>

      </div>
    </header>
  );
};
