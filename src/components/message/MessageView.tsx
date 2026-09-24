import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserProfile, ChatMessage } from '../../types';
import { MessageSquare, Bell, Gift, Send, ArrowLeft, Check, Sparkles, UserPlus } from 'lucide-react';

export const MessageView: React.FC = () => {
  const { 
    currentUser, 
    allUsers, 
    messages, 
    sendMessage, 
    notifications, 
    markNotificationAsRead,
    sendGift 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'chats' | 'notifications'>('chats');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [inputText, setInputText] = useState('');

  // Conversation messages with the selected user
  const conversation = messages.filter(m => 
    (m.senderId === currentUser.id && m.receiverId === selectedUser?.id) ||
    (m.senderId === selectedUser?.id && m.receiverId === currentUser.id)
  );

  const handleSendDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedUser) return;
    sendMessage(selectedUser.id, inputText.trim());
    setInputText('');
  };

  return (
    <div className="pb-24 pt-2 px-3.5 max-w-2xl mx-auto">
      
      {/* View Switcher: Chats vs Notifications */}
      {!selectedUser && (
        <div className="flex items-center gap-2 mb-4 bg-slate-900 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'chats' 
                ? 'bg-sky-500 text-slate-950 shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare size={14} />
            <span>Messages</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 relative ${
              activeTab === 'notifications' 
                ? 'bg-sky-500 text-slate-950 shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bell size={14} />
            <span>Notifications</span>
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>
        </div>
      )}

      {/* CHATS TAB */}
      {activeTab === 'chats' && !selectedUser && (
        <div className="space-y-2">
          {allUsers.filter(u => u.id !== currentUser.id).length === 0 ? (
            <div className="text-center py-16 bg-slate-900/60 rounded-2xl border border-slate-800">
              <MessageSquare size={28} className="mx-auto text-sky-400 mb-2 opacity-80" />
              <p className="text-slate-300 font-bold text-sm">No Registered Users Yet</p>
              <p className="text-slate-500 text-xs mt-1">As real users register and join StarLive, they will appear here dynamically to message.</p>
            </div>
          ) : (
            allUsers.filter(u => u.id !== currentUser.id).map((user) => {
              return (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="cursor-pointer flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/80 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={user.avatar} 
                        alt={user.displayName} 
                        className="w-12 h-12 rounded-full object-cover border border-slate-700"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1">
                        <span>{user.displayName}</span>
                        <span>{user.countryFlag}</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate max-w-[200px] mt-0.5">
                        {user.bio}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Today</span>
                    <span className="text-[10px] bg-slate-800 text-sky-400 px-1.5 py-0.5 rounded-full font-bold">
                      Lv.{user.level}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 1-ON-1 ACTIVE CHAT CONVERSATION */}
      {selectedUser && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col h-[75vh]">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <button
              onClick={() => setSelectedUser(null)}
              className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white"
            >
              <ArrowLeft size={16} />
            </button>

            <div className="flex items-center gap-2">
              <img src={selectedUser.avatar} alt={selectedUser.displayName} className="w-8 h-8 rounded-full object-cover" />
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1">
                  <span>{selectedUser.displayName}</span>
                  <span>{selectedUser.countryFlag}</span>
                </h4>
                <span className="text-[9px] text-emerald-400">Online</span>
              </div>
            </div>

            <button
              onClick={() => sendGift({ id: 'rose', name: 'Rose', icon: '🌹', cost: 1, animationType: 'sparkle' }, selectedUser.id, selectedUser.displayName)}
              className="p-1.5 rounded-full bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 text-xs font-bold flex items-center gap-1 px-2.5"
              title="Send Quick Rose"
            >
              <Gift size={14} />
              <span>Send Rose</span>
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5 no-scrollbar">
            {conversation.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Say hello to {selectedUser.displayName}! ✨
              </div>
            ) : (
              conversation.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`p-2.5 rounded-2xl max-w-[80%] text-xs ${
                      isMe 
                        ? 'bg-sky-500 text-slate-950 font-medium rounded-tr-none' 
                        : 'bg-slate-800 text-white rounded-tl-none border border-slate-700/60'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 px-1">
                      {msg.createdAt}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendDirect} className="pt-2 flex items-center gap-2 border-t border-slate-800">
            <input 
              type="text"
              placeholder={`Message ${selectedUser.displayName}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
            />
            <button
              type="submit"
              className="p-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && !selectedUser && (
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationAsRead(n.id)}
              className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                n.isRead 
                  ? 'bg-slate-900/60 border-slate-800 text-slate-400' 
                  : 'bg-slate-900 border-sky-500/40 text-white shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 shrink-0">
                  {n.type === 'gift' ? <Gift size={16} /> : <Bell size={16} />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{n.title}</h4>
                  <p className="text-xs text-slate-300 mt-0.5">{n.message}</p>
                  <span className="text-[10px] text-slate-500 mt-1 block">{n.createdAt}</span>
                </div>
              </div>

              {!n.isRead && (
                <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0 mt-1" />
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
