/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopHeader } from './components/layout/TopHeader';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { DiscoverView } from './components/discover/DiscoverView';
import { LiveListView } from './components/live/LiveListView';
import { PartyListView } from './components/party/PartyListView';
import { MomentsView } from './components/moments/MomentsView';
import { MessageView } from './components/message/MessageView';
import { MineProfileView } from './components/mine/MineProfileView';
import { LiveRoomView } from './components/rooms/LiveRoomView';
import { PasswordPromptModal } from './components/rooms/PasswordPromptModal';
import { CreateRoomModal } from './components/rooms/CreateRoomModal';
import { RoomRentModal } from './components/rooms/RoomRentModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { RechargeModal } from './components/common/RechargeModal';
import { SearchModal } from './components/common/SearchModal';
import { AuthModal } from './components/auth/AuthModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { ApkDownloadModal } from './components/common/ApkDownloadModal';
import { LiveRoom } from './types';

const MainContent: React.FC = () => {
  const { 
    currentUser,
    currentTab,
    setCurrentTab,
    activeRoom, 
    setActiveRoom, 
    isAdminMode, 
    isAuthenticated,
    authModalOpen, 
    setAuthModalOpen,
    isSearchOpen,
    setIsSearchOpen,
    isCreateRoomModalOpen,
    setIsCreateRoomModalOpen,
    isRoomRentModalOpen,
    setIsRoomRentModalOpen,
    joinRoom
  } = useApp();

  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [homeSubTab, setHomeSubTab] = useState<'popular' | 'mine'>('popular');

  // Authentication Gate: When user opens the app, enforce Sign In / Login before granting access
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // If Admin Mode is active, render the dedicated Full-Screen Admin Console strictly for authorized admin email
  if (isAdminMode && currentUser.email?.toLowerCase().trim() === 'wajaht265374@gmail.com') {
    return <AdminDashboard />;
  }

  const handleOpenRoom = (room: LiveRoom) => {
    joinRoom(room);
  };

  const handleOpenCreateRoom = () => {
    setIsCreateRoomModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center text-slate-800 selection:bg-teal-400 selection:text-slate-950 w-full">
      
      {/* Mobile-Responsive Main Canvas */}
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col">
        
        {/* Top Header */}
        <TopHeader 
          activeSubTab={homeSubTab}
          setActiveSubTab={(tab) => {
            setHomeSubTab(tab);
            if (currentTab !== 'discover') {
              setCurrentTab('discover');
            }
          }}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenGoLive={handleOpenCreateRoom}
        />

        {/* Main Tab View */}
        <main className="flex-1 bg-white w-full">
          {currentTab === 'discover' && (
            <DiscoverView 
              homeSubTab={homeSubTab}
              onSubTabChange={(tab) => setHomeSubTab(tab)}
              onOpenRoom={handleOpenRoom} 
              onSelectRoom={handleOpenRoom}
              onCreateRoom={handleOpenCreateRoom}
            />
          )}

          {currentTab === 'live' && (
            <LiveListView 
              onOpenRoom={handleOpenRoom} 
              onCreateRoom={handleOpenCreateRoom} 
            />
          )}

          {currentTab === 'party' && (
            <PartyListView 
              onOpenRoom={handleOpenRoom} 
              onCreateRoom={handleOpenCreateRoom} 
            />
          )}

          {currentTab === 'moments' && (
            <MomentsView />
          )}

          {currentTab === 'message' && (
            <MessageView />
          )}

          {currentTab === 'mine' && (
            <MineProfileView />
          )}
        </main>

        {/* Fixed Bottom Navigation */}
        <BottomNavigation />

        {/* Active Modern Live Room Interface */}
        {activeRoom && (
          <LiveRoomView 
            room={activeRoom} 
            onClose={() => {
              setActiveRoom(null);
              // Strictly ensure user remains on the main Room/Home screen
              setCurrentTab('discover');
            }} 
          />
        )}

        {/* Global Modals & Security System */}
        <PasswordPromptModal />
        <RechargeModal />
        
        <CreateRoomModal 
          isOpen={isCreateRoomModalOpen || isCreateRoomOpen}
          onClose={() => {
            setIsCreateRoomOpen(false);
            setIsCreateRoomModalOpen(false);
          }}
          onRoomCreated={(newRoom: LiveRoom) => setActiveRoom(newRoom)}
        />

        <RoomRentModal
          isOpen={isRoomRentModalOpen}
          onClose={() => setIsRoomRentModalOpen(false)}
        />

        <SearchModal 
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelectRoom={(room: LiveRoom) => handleOpenRoom(room)}
        />

        <AuthModal 
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />

        <ApkDownloadModal />

      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
