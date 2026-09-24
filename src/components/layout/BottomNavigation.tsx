import React from 'react';
import { useApp } from '../../context/AppContext';
import { MessageSquare, Smile, Radio } from 'lucide-react';
import { NavigationTab } from '../../types';

export const BottomNavigation: React.FC = () => {
  const { currentTab, setCurrentTab, notifications } = useApp();

  const isHomeActive = currentTab === 'discover' || currentTab === 'live' || currentTab === 'party' || currentTab === 'moments';
  const isMessageActive = currentTab === 'message';
  const isMeActive = currentTab === 'mine';

  return (
    <nav 
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-md z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 sm:px-4 py-1.5 sm:py-2 shadow-[0_-4px_25px_rgba(0,0,0,0.05)] fixed-stable"
    >
      <div className="w-full flex items-center justify-around">
        
        {/* Tab 1: Home (Mint Capsule with Icon matching reference screenshot) */}
        <button
          id="bottom-nav-home"
          onClick={() => setCurrentTab('discover')}
          className="flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 group"
        >
          {isHomeActive ? (
            <div className="w-12 h-8 rounded-full bg-[#d2f9ef] flex items-center justify-center text-[#00c996] shadow-inner transition-transform">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            </div>
          ) : (
            <div className="w-12 h-8 flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 opacity-70">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            </div>
          )}
          <span className={`text-xs mt-0.5 tracking-tight ${isHomeActive ? 'text-[#00c996] font-extrabold' : 'text-slate-400 font-semibold'}`}>
            Home
          </span>
        </button>

        {/* Tab 2: Message (Speech Bubble with Red 3 Badge matching reference screenshot) */}
        <button
          id="bottom-nav-message"
          onClick={() => setCurrentTab('message')}
          className="flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 group"
        >
          <div className="relative w-12 h-8 flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
            {isMessageActive ? (
              <div className="w-12 h-8 rounded-full bg-[#d2f9ef] flex items-center justify-center text-[#00c996] shadow-inner">
                <MessageSquare size={22} className="fill-current" />
              </div>
            ) : (
              <MessageSquare size={24} strokeWidth={2.2} className="text-slate-400 opacity-90" />
            )}

            {/* Notification Badge with Red 3 matching screenshot */}
            <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
              3
            </span>
          </div>
          <span className={`text-xs mt-0.5 tracking-tight ${isMessageActive ? 'text-[#00c996] font-extrabold' : 'text-slate-400 font-semibold'}`}>
            Message
          </span>
        </button>

        {/* Tab 3: Me (Smiley Profile Avatar matching reference screenshot) */}
        <button
          id="bottom-nav-me"
          onClick={() => setCurrentTab('mine')}
          className="flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 group"
        >
          <div className="w-12 h-8 flex items-center justify-center transition-colors">
            {isMeActive ? (
              <div className="w-12 h-8 rounded-full bg-[#d2f9ef] flex items-center justify-center text-[#00c996] shadow-inner">
                <Smile size={22} strokeWidth={2.6} />
              </div>
            ) : (
              <Smile size={24} strokeWidth={2.2} className="text-slate-400 opacity-90 group-hover:text-slate-600" />
            )}
          </div>
          <span className={`text-xs mt-0.5 tracking-tight ${isMeActive ? 'text-[#00c996] font-extrabold' : 'text-slate-400 font-semibold'}`}>
            Me
          </span>
        </button>

      </div>
    </nav>
  );
};
