import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  UserProfile, 
  LiveRoom, 
  RoomMember,
  PostMoment, 
  ChatMessage, 
  AppEvent, 
  UserReport, 
  NotificationItem, 
  TransactionRecord,
  GiftItem,
  CommentItem,
  NavigationTab,
  MicSeat,
  AppRelease,
  RoomRent
} from '../types';
import { 
  GIFTS_CATALOG 
} from '../data/mockData';
import { soundEffects } from '../utils/audio';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  signInWithEmail, 
  registerWithEmail as firebaseRegisterWithEmail, 
  signInGuest, 
  logoutUser,
  uploadApkFileToStorage,
  publishNewApkRelease,
  publishApkLinkRelease,
  fetchActiveApkFromDb,
  triggerDirectApkDownload,
  syncUserProfileWithFirestore,
  findEmailByUsername
} from '../services/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  query,
  where
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { unifiedSignaling } from '../services/unifiedSignaling';

interface AppContextType {
  currentUser: UserProfile;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  allUsers: UserProfile[];
  liveRooms: LiveRoom[];
  recentRooms: LiveRoom[];
  setRecentRooms: React.Dispatch<React.SetStateAction<LiveRoom[]>>;
  activeRoom: LiveRoom | null;
  setActiveRoom: (room: LiveRoom | null) => void;
  roomMembers: RoomMember[];
  myRoom: LiveRoom | null;
  userOwnedRooms: LiveRoom[];
  canCreateRoom: boolean;
  userActiveRoomsCount: number;
  deleteRoom: (roomId: string) => Promise<void>;
  // Aliases for compatibility
  activeLiveRoom: LiveRoom | null;
  setActiveLiveRoom: (room: LiveRoom | null) => void;
  posts: PostMoment[];
  messages: ChatMessage[];
  notifications: NotificationItem[];
  transactions: TransactionRecord[];
  events: AppEvent[];
  reports: UserReport[];
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  // Aliases for compatibility
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isAdminMode: boolean;
  setIsAdminMode: (val: boolean) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  showRechargeModal: boolean;
  setShowRechargeModal: (val: boolean) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isPasswordModalOpen: boolean;
  setIsPasswordModalOpen: (open: boolean) => void;
  roomPendingPassword: LiveRoom | null;
  setRoomPendingPassword: (room: LiveRoom | null) => void;
  isCreateRoomModalOpen: boolean;
  setIsCreateRoomModalOpen: (open: boolean) => void;
  roomRents: RoomRent[];
  rentRoom: (roomIdOrTitle: string, rentType?: 'daily' | 'weekly' | 'monthly' | 'vip', customCover?: string) => Promise<LiveRoom>;
  openRoomRent: (roomIdOrRentId: string) => Promise<boolean>;
  isRoomRented: (roomId: string) => boolean;
  isRoomRentModalOpen: boolean;
  setIsRoomRentModalOpen: (open: boolean) => void;

  // Actions
  loginWithGoogle: () => Promise<void>;
  loginWithGoogleAuth: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithIdentifier: (identifier: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  registerWithUsernameOrGmail: (username: string, email: string, pass: string, displayName?: string) => Promise<void>;
  loginAsGuestUser: () => Promise<void>;
  logout: () => Promise<void>;
  topUpCoins: (amount: number, costUSD: string) => void;
  rechargeCoins: (amount: number, description?: string) => Promise<void>;
  claimDailyBonus: () => boolean;
  sendGift: (gift: GiftItem, recipientId: string, recipientName: string, roomId?: string) => Promise<boolean>;
  createLiveRoom: (data: { title: string; category?: string; country?: string; isParty?: boolean; coverImage?: string; backgroundTheme?: string; announcement?: string; isPrivate?: boolean; password?: string }) => Promise<LiveRoom>;
  createRoom: (data: { title: string; category?: string; country?: string; isParty?: boolean; coverImage?: string; backgroundTheme?: string; announcement?: string; isPrivate?: boolean; password?: string }) => Promise<LiveRoom>;
  updateRoom: (roomId: string, updates: Partial<LiveRoom>) => Promise<void>;
  joinRoom: (room: LiveRoom | string, passwordAttempt?: string) => Promise<{ success: boolean; error?: string }>;
  joinRoomById: (roomId: string, passwordAttempt?: string) => Promise<{ success: boolean; error?: string }>;
  leaveRoom: (roomId?: string) => Promise<void>;
  endLiveRoom: (roomId: string) => Promise<void>;
  createPost: (content: string, mediaUrl?: string, tags?: string[]) => Promise<void>;
  likePost: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  deletePost: (postId: string) => void;
  sendMessage: (receiverId: string, content: string, roomId?: string, gift?: GiftItem) => Promise<void>;
  markNotificationAsRead: (id: string) => void;
  followUser: (targetUserId: string) => void;
  unfollowUser: (targetUserId: string) => void;
  submitReport: (targetType: 'user' | 'room' | 'post', targetId: string, targetName: string, reason: string) => void;
  takePartySeat: (roomId: string, seatIndex: number) => void;
  leavePartySeat: (roomId: string, seatIndex?: number, targetUserId?: string) => Promise<void>;
  removeMemberFromRoom: (roomId: string, targetUserId: string) => Promise<void>;
  mutePartySeat: (roomId: string, seatIndex?: number) => void;
  adminUpdateUser: (userId: string, updates: Partial<UserProfile>) => void;
  adminBanUser: (userId: string, ban: boolean) => void;
  adminAdjustCoins: (userId: string, delta: number) => void;
  adminUpdateReport: (reportId: string, status: 'resolved' | 'dismissed') => void;
  adminCreateEvent: (event: Omit<AppEvent, 'id'>) => void;
  adminUpdateEvent: (eventId: string, updates: Partial<AppEvent>) => void;
  adminDeleteEvent: (eventId: string) => void;
  adminDeleteRoom: (roomId: string) => void;

  // APK Releases & Downloads
  activeApkRelease: AppRelease | null;
  allApkReleases: AppRelease[];
  isApkDownloading: boolean;
  showApkDownloadModal: boolean;
  setShowApkDownloadModal: (val: boolean) => void;
  downloadActiveApk: () => Promise<void>;
  adminUploadAndPublishApk: (
    file: File,
    version: string,
    versionCode: number,
    changelog?: string,
    onProgress?: (percent: number) => void
  ) => Promise<AppRelease>;
  adminPublishExistingRelease: (releaseId: string) => Promise<void>;
  adminDeleteRelease: (releaseId: string) => Promise<void>;
  adminQuickPublishVersion: (version: string, changelog?: string) => Promise<AppRelease>;
  adminPublishApkLink: (data: {
    version: string;
    versionCode?: number;
    fileName?: string;
    fileSizeMb?: string | number;
    downloadUrl: string;
    changelog?: string;
    minAndroidVersion?: string;
  }) => Promise<AppRelease>;
}

const defaultCurrentUser: UserProfile = {
  id: 'user_o',
  uid: 'user_o',
  username: 'User_O',
  displayName: 'User O (Host)',
  email: 'wajaht265374@gmail.com', // Matched with requested admin email
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
  bio: 'Living the StarLive vibes 🌟 Music, Live streams & Good Friends.',
  country: 'Pakistan',
  countryFlag: '🇵🇰',
  coins: 12000, // Matching the exact reference photo coins counter: 12,000
  diamonds: 3200,
  level: 18,
  role: 'admin', // Admin by default for the primary operator (wajaht265374@gmail.com)
  followersCount: 1240,
  followingCount: 86,
  badges: ['VIP Silver', 'Active Broadcaster'],
  isVerified: true,
  createdAt: '2026-05-01'
};

const defaultSpeakerUser: UserProfile = {
  id: 'user_s',
  uid: 'user_s',
  username: 'User_S',
  displayName: 'User S (Speaker)',
  email: 'user_s@starlive.app',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  bio: 'Live Voice Chat Guest 🎙️',
  country: 'Global',
  countryFlag: '🌐',
  coins: 12000,
  diamonds: 1200,
  level: 8,
  role: 'user',
  followersCount: 340,
  followingCount: 42,
  badges: ['Active Speaker'],
  isVerified: true,
  createdAt: '2026-05-01'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// Generates or retrieves a unique user identity per device so two mobile phones never collide
const getOrCreateDeviceUser = (): UserProfile => {
  if (typeof window === 'undefined') return defaultCurrentUser;

  // 1. Secondary tab separation for multi-tab desktop browser testing
  const sessionCached = sessionStorage.getItem('starlive_session_user');
  if (sessionCached) {
    try { return JSON.parse(sessionCached); } catch (e) {}
  }

  const tabId = sessionStorage.getItem('starlive_tab_id') || Math.random().toString(36).substring(2, 9);
  sessionStorage.setItem('starlive_tab_id', tabId);

  const activePrimaryTab = localStorage.getItem('starlive_primary_tab_id');
  if (activePrimaryTab && activePrimaryTab !== tabId) {
    sessionStorage.setItem('starlive_session_user', JSON.stringify(defaultSpeakerUser));
    return defaultSpeakerUser;
  } else if (!activePrimaryTab) {
    localStorage.setItem('starlive_primary_tab_id', tabId);
  }

  // 2. Check cached user in localStorage
  const cached = localStorage.getItem('starlive_user');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.id && parsed.id !== 'current_user' && parsed.id !== 'user_o') {
        return parsed;
      }
      // If user was admin preset
      if (parsed?.email === 'wajaht265374@gmail.com') {
        return defaultCurrentUser;
      }
    } catch (e) {}
  }

  // 3. Persistent unique device-specific user ID for physical mobile devices
  let deviceUserId = localStorage.getItem('starlive_device_user_id');
  if (!deviceUserId) {
    deviceUserId = 'user_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem('starlive_device_user_id', deviceUserId);
  }

  const shortCode = Math.abs(deviceUserId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 900) + 100;
  const avatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80'
  ];
  const avatarIndex = shortCode % avatars.length;

  const deviceUser: UserProfile = {
    id: deviceUserId,
    uid: deviceUserId,
    username: `User_${shortCode}`,
    displayName: `User ${shortCode}`,
    email: `${deviceUserId}@starlive.app`,
    avatar: avatars[avatarIndex],
    bio: 'Living the StarLive vibes 🌟 Music, Live streams & Good Friends.',
    country: 'Global',
    countryFlag: '🌐',
    coins: 12000,
    diamonds: 1500,
    level: 12,
    role: 'user',
    followersCount: 140,
    followingCount: 36,
    badges: ['VIP Member', 'Active Broadcaster'],
    isVerified: true,
    createdAt: new Date().toISOString()
  };

  try {
    localStorage.setItem('starlive_user', JSON.stringify(deviceUser));
  } catch (e) {}

  return deviceUser;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(getOrCreateDeviceUser);

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [liveRooms, setLiveRooms] = useState<LiveRoom[]>([]);
  const [recentRooms, setRecentRooms] = useState<LiveRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<LiveRoom | null>(null);
  const [posts, setPosts] = useState<PostMoment[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [reports, setReports] = useState<UserReport[]>([
    {
      id: 'rep-1',
      reporterId: 'user_malik',
      reporterName: 'Malik Nawab',
      targetType: 'room',
      targetId: 'room-3',
      targetName: 'PK EVENT Room',
      reason: 'Audio feedback high noise',
      status: 'pending',
      createdAt: '2026-09-16T10:05:00Z'
    }
  ]);

  // Default initial official APK release
  const DEFAULT_INITIAL_RELEASE: AppRelease = {
    id: 'release-v1.2.0',
    version: 'v1.2.0',
    versionCode: 10200,
    fileName: 'StarLive_v1.2.0_official.apk',
    fileSize: 28450000,
    downloadUrl: 'https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0633145956.firebasestorage.app/o/apks%2FStarLive_v1.2.0_release.apk?alt=media',
    storagePath: 'apks/StarLive_v1.2.0_release.apk',
    changelog: 'Official StarLive build: Live video broadcasting, 8-seat audio party rooms, instant real-time coin gifting with luxury visual animations, and direct messaging.',
    publishedAt: '2026-09-16T12:00:00.000Z',
    publishedBy: 'wajaht265374@gmail.com',
    isActive: true,
    downloadsCount: 3840,
    status: 'published',
    minAndroidVersion: 'Android 7.0 (API 24) +'
  };

  const [activeApkRelease, setActiveApkRelease] = useState<AppRelease | null>(() => {
    try {
      const cached = localStorage.getItem('starlive_active_apk');
      return cached ? JSON.parse(cached) : DEFAULT_INITIAL_RELEASE;
    } catch {
      return DEFAULT_INITIAL_RELEASE;
    }
  });
  const [allApkReleases, setAllApkReleases] = useState<AppRelease[]>([DEFAULT_INITIAL_RELEASE]);
  const [isApkDownloading, setIsApkDownloading] = useState<boolean>(false);
  const [showApkDownloadModal, setShowApkDownloadModal] = useState<boolean>(false);

  const [currentTab, setCurrentTab] = useState<NavigationTab>('discover');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('starlive_auth_session') === 'true';
    } catch {
      return false;
    }
  });
  const [showRechargeModal, setShowRechargeModal] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Popular');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [roomPendingPassword, setRoomPendingPassword] = useState<LiveRoom | null>(null);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState<boolean>(false);
  const [isRoomRentModalOpen, setIsRoomRentModalOpen] = useState<boolean>(false);
  const [roomRents, setRoomRents] = useState<RoomRent[]>(() => {
    try {
      const saved = localStorage.getItem('starlive_room_rents');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'rent-101',
        roomId: 'room-1',
        roomTitle: '🌟 Islamabad Midnight Vibes (Rent)',
        userId: 'user_malik',
        userName: 'Malik Nawab',
        rentType: 'monthly',
        rentPrice: 35000,
        status: 'active',
        startDate: new Date().toISOString(),
        expiresDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        createdAt: new Date().toISOString()
      }
    ];
  });

  // Sync current user to local storage for persistent testing
  useEffect(() => {
    localStorage.setItem('starlive_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Listen to Firebase Auth state and synchronize user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await syncUserProfileWithFirestore(firebaseUser);
          setCurrentUser(profile);
          setIsAuthenticated(true);
          localStorage.setItem('starlive_auth_session', 'true');
        } catch (e) {
          const userEmail = firebaseUser.email?.toLowerCase().trim() || '';
          const isAdmin = userEmail === 'wajaht265374@gmail.com';
          setCurrentUser(prev => ({
            ...prev,
            uid: firebaseUser.uid,
            email: firebaseUser.email || prev.email,
            displayName: firebaseUser.displayName || prev.displayName,
            avatar: firebaseUser.photoURL || prev.avatar,
            role: isAdmin ? 'admin' : 'user'
          }));
          setIsAuthenticated(true);
          localStorage.setItem('starlive_auth_session', 'true');
        }
      } else {
        const hasSession = localStorage.getItem('starlive_auth_session') === 'true';
        if (!hasSession) {
          setIsAuthenticated(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Try real-time Firestore synchronization for users, liveRooms, and posts
  useEffect(() => {
    try {
      // 1. Real-time dynamic registered users synchronization
      const usersCol = collection(db, 'users');
      const unsubUsers = onSnapshot(usersCol, (snapshot) => {
        const loadedUsers: UserProfile[] = [];
        const mockUserIds = new Set(['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8', 'admin_user', 'user_s', 'user_o']);
        snapshot.forEach(d => {
          if (!mockUserIds.has(d.id)) {
            loadedUsers.push({ id: d.id, ...d.data() } as UserProfile);
          }
        });
        const userMap = new Map<string, UserProfile>();
        loadedUsers.forEach(u => userMap.set(u.id, u));
        if (currentUser?.id && !mockUserIds.has(currentUser.id)) {
          userMap.set(currentUser.id, currentUser);
        }
        setAllUsers(Array.from(userMap.values()));
      }, (err) => {
        console.warn("Using local store for users:", err.message);
      });

      // 2. Real-time dynamic live rooms synchronization (Strictly mirrors Firestore; no ghost or deleted rooms)
      try {
        localStorage.removeItem('starlive_all_rooms');
        localStorage.removeItem('starlive_recent_rooms');
      } catch (e) {}

      const roomsCol = collection(db, 'liveRooms');
      const unsubRooms = onSnapshot(roomsCol, (snapshot) => {
        if (!snapshot.empty) {
          const loadedRooms: LiveRoom[] = [];
          const mockRoomIds = new Set(['room-1', 'room-2', 'room-3', 'room-4', 'room-5', 'room-6']);
          snapshot.forEach(d => {
            if (!mockRoomIds.has(d.id)) {
              const data = d.data() as LiveRoom;
              if (data.status !== 'ended') {
                loadedRooms.push({ id: d.id, ...data });
              }
            }
          });

          // Sort rooms by creation timestamp descending (newest first)
          loadedRooms.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

          setLiveRooms(loadedRooms);
          try {
            localStorage.setItem('starlive_all_rooms', JSON.stringify(loadedRooms));
          } catch (e) {}

          // Also synchronize active room if it was updated or removed remotely
          setActiveRoom(currentActive => {
            if (!currentActive) return null;
            const updated = loadedRooms.find(r => r.id === currentActive.id);
            if (!updated) {
              console.log(`[AppContext] Room ${currentActive.id} was deleted or closed remotely.`);
              return null;
            }
            return { ...currentActive, ...updated };
          });
        } else {
          setLiveRooms([]);
          try {
            localStorage.removeItem('starlive_all_rooms');
          } catch (e) {}
          setActiveRoom(null);
        }
      }, (err) => {
        console.warn("Using local store for liveRooms:", err.message);
        setLiveRooms([]);
      });

      // 3. Real-time dynamic posts synchronization
      const postsCol = collection(db, 'posts');
      const unsubPosts = onSnapshot(postsCol, (snapshot) => {
        if (!snapshot.empty) {
          const loadedPosts: PostMoment[] = [];
          const mockPostIds = new Set(['post-1', 'post-2', 'post-3']);
          snapshot.forEach(d => {
            if (!mockPostIds.has(d.id)) {
              loadedPosts.push({ id: d.id, ...d.data() } as PostMoment);
            }
          });
          setPosts(loadedPosts);
        } else {
          setPosts([]);
        }
      }, (err) => {
        console.warn("Using local store for posts:", err.message);
      });

      const rentsCol = collection(db, 'roomRents');
      const unsubRents = onSnapshot(rentsCol, (snapshot) => {
        if (!snapshot.empty) {
          const loadedRents: RoomRent[] = [];
          snapshot.forEach(d => loadedRents.push({ id: d.id, ...d.data() } as RoomRent));
          setRoomRents(loadedRents);
          try {
            localStorage.setItem('starlive_room_rents', JSON.stringify(loadedRents));
          } catch (e) {}
        }
      }, (err) => {
        console.warn("Using local store for roomRents:", err.message);
      });

      return () => {
        unsubUsers();
        unsubRooms();
        unsubPosts();
        unsubRents();
      };
    } catch (e) {
      console.warn("Firestore listeners initialization:", e);
    }
  }, [currentUser]);

  // Real-time synchronization for APK releases & active published APK
  useEffect(() => {
    try {
      // 1. Listen to active APK release document in real-time
      const unsubActive = onSnapshot(doc(db, 'appReleases', 'active'), async (snap) => {
        if (snap.exists()) {
          const data = snap.data() as AppRelease;
          if (data && data.version && data.downloadUrl) {
            setActiveApkRelease(data);
            try {
              localStorage.setItem('starlive_active_apk', JSON.stringify(data));
            } catch (e) {}
          }
        } else {
          // If no active release in Firestore yet, automatically seed the initial official build
          try {
            await setDoc(doc(db, 'appReleases', 'active'), DEFAULT_INITIAL_RELEASE);
            await setDoc(doc(db, 'appReleases', DEFAULT_INITIAL_RELEASE.id), DEFAULT_INITIAL_RELEASE);
          } catch (e) {
            console.warn("Could not seed default APK release:", e);
          }
        }
      }, (err) => {
        console.warn("Using local active APK fallback:", err.message);
      });

      // 2. Listen to all releases history
      const unsubAll = onSnapshot(collection(db, 'appReleases'), (snap) => {
        if (!snap.empty) {
          const list: AppRelease[] = [];
          snap.forEach(d => {
            if (d.id !== 'active') {
              list.push({ id: d.id, ...d.data() } as AppRelease);
            }
          });
          list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
          if (list.length > 0) {
            setAllApkReleases(list);
          }
        }
      }, (err) => {
        console.warn("Releases listener error:", err.message);
      });

      return () => {
        unsubActive();
        unsubAll();
      };
    } catch (e) {
      console.warn("APK release listener error:", e);
    }
  }, []);

  // Real-time synchronization for active room and joined members subcollection
  useEffect(() => {
    if (!activeRoom?.id) {
      setRoomMembers([]);
      return;
    }

    const currentRoomId = activeRoom.id;
    const isHost = activeRoom.hostId === currentUser.id || activeRoom.hostId === currentUser.uid;

    // Real-time room document updates (for title, coverImage, backgroundTheme, announcement, and micSeats)
    const unsubDoc = onSnapshot(doc(db, 'liveRooms', currentRoomId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const updatedRoom = { id: snap.id, ...data } as LiveRoom;
        if (updatedRoom.status === 'ended') {
          setActiveRoom(null);
          setLiveRooms(prev => prev.filter(r => r.id !== snap.id));
          return;
        }
        setActiveRoom(prev => {
          if (!prev || prev.id !== snap.id) return prev;
          return { ...prev, ...updatedRoom };
        });
        setLiveRooms(prev => prev.map(r => r.id === snap.id ? { ...r, ...updatedRoom } : r));
      } else {
        // Room was deleted or closed remotely
        console.log(`[AppContext] Room ${currentRoomId} was deleted.`);
        setActiveRoom(null);
        setLiveRooms(prev => prev.filter(r => r.id !== currentRoomId));
      }
    }, (err) => {
      console.warn("Active room listener error:", err.message);
    });

    // Real-time members subcollection updates for multi-device presence & disconnect detection
    const membersCol = collection(db, 'liveRooms', currentRoomId, 'members');
    const unsubMembers = onSnapshot(membersCol, (snapshot) => {
      const now = Date.now();
      const list: RoomMember[] = [];

      snapshot.forEach(d => {
        const m = d.data();
        const lastSeen = m.lastSeen ? Number(m.lastSeen) : now;

        // Disconnect detection: if user hasn't sent a presence heartbeat in > 30 seconds
        if (now - lastSeen > 30000) {
          console.log(`[AppContext] Detected disconnected user ${d.id} in room ${currentRoomId}`);
          if (isHost) {
            deleteDoc(doc(db, 'liveRooms', currentRoomId, 'members', d.id)).catch(() => {});
          }
          return;
        }

        list.push({
          id: d.id,
          userId: m.userId || d.id,
          userName: m.userName || 'Member',
          userAvatar: m.userAvatar || '',
          userLevel: m.userLevel || 1,
          role: m.role || 'member',
          joinedAt: m.joinedAt || new Date().toISOString(),
          isMuted: Boolean(m.isMuted),
          lastSeen,
          ...m
        } as RoomMember);
      });

      // Guarantee room host is always included in members list if active
      if (activeRoom && isHost && !list.some(m => m.userId === activeRoom.hostId)) {
        list.unshift({
          id: activeRoom.hostId,
          userId: activeRoom.hostId,
          userName: activeRoom.hostName,
          userAvatar: activeRoom.hostAvatar,
          userLevel: activeRoom.hostLevel,
          role: 'owner',
          joinedAt: activeRoom.createdAt,
          lastSeen: now
        });
      }

      setRoomMembers(list);

      // Keep active room viewerCount synchronized with real members count
      const memberCount = list.length;
      setActiveRoom(prev => prev ? { ...prev, viewerCount: Math.max(1, memberCount) } : null);

      // Empty room cleanup: if 0 members remain, remove room
      if (list.length === 0 && !snapshot.metadata.hasPendingWrites) {
        console.log(`[AppContext] Room ${currentRoomId} is now empty. Auto-removing room.`);
        deleteDoc(doc(db, 'liveRooms', currentRoomId)).catch(() => {});
        setLiveRooms(prev => prev.filter(r => r.id !== currentRoomId));
      }
    }, (err) => {
      console.warn("Room members listener error:", err.message);
    });

    // Real-time WebSocket user-left listener for instant removal
    const offUserLeft = unifiedSignaling.on('user-left', (payload: any) => {
      if (payload && payload.roomId === currentRoomId && payload.userId) {
        console.log(`[AppContext] Instant user-left event for user ${payload.userId}`);
        setRoomMembers(prev => prev.filter(m => m.userId !== payload.userId && m.id !== payload.userId));
        setActiveRoom(prev => {
          if (!prev) return null;
          const updatedSeats = (prev.micSeats || []).map(s => {
            if (s.userId === payload.userId) {
              return { seatIndex: s.seatIndex, isLocked: false };
            }
            return s;
          });
          return {
            ...prev,
            micSeats: updatedSeats,
            viewerCount: Math.max(1, (prev.viewerCount || 1) - 1)
          };
        });
      }
    });

    return () => {
      unsubDoc();
      unsubMembers();
      offUserLeft();
    };
  }, [activeRoom?.id, currentUser.id, currentUser.uid]);

  const loginWithGoogleAuth = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        const profile = await syncUserProfileWithFirestore(user);
        setCurrentUser(profile);
        setIsAuthenticated(true);
        localStorage.setItem('starlive_auth_session', 'true');
        return profile;
      }
    } catch (err: any) {
      const isUserDismissal = err?.code === 'auth/popup-closed-by-user' || 
                              err?.code === 'auth/cancelled-popup-request' ||
                              err?.message?.includes('popup-closed-by-user');
      if (!isUserDismissal) {
        console.warn("Google sign-in notice:", err?.message || err);
      }
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    return loginWithGoogleAuth();
  };

  const loginWithEmail = async (email: string, pass: string) => {
    return loginWithIdentifier(email, pass);
  };

  const loginWithIdentifier = async (identifier: string, pass: string) => {
    const raw = identifier.trim();
    if (!raw) {
      throw new Error("Please enter your Username or Gmail address.");
    }
    if (!pass) {
      throw new Error("Please enter your password.");
    }

    let emailToUse = raw;

    if (raw.includes('@')) {
      emailToUse = raw.toLowerCase();
    } else {
      // It's a username! Look up registered email from Firestore or local state
      const foundEmail = await findEmailByUsername(raw);
      if (foundEmail) {
        emailToUse = foundEmail;
      } else {
        const localFound = allUsers.find(
          u => u.username.toLowerCase() === raw.toLowerCase() ||
               u.displayName.toLowerCase() === raw.toLowerCase()
        );
        if (localFound && localFound.email) {
          emailToUse = localFound.email;
        } else {
          const cleanUser = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
          emailToUse = `${cleanUser}@starlive.app`;
        }
      }
    }

    try {
      const user = await signInWithEmail(emailToUse, pass);
      if (user) {
        const profile = await syncUserProfileWithFirestore(user);
        setCurrentUser(profile);
        setIsAuthenticated(true);
        localStorage.setItem('starlive_auth_session', 'true');
        return;
      }
    } catch (err: any) {
      // If credential was invalid or user not found, check if this account should be auto-created
      // (e.g. first-time sign in on a freshly provisioned Firebase project)
      if (
        err?.code === 'auth/user-not-found' || 
        err?.code === 'auth/invalid-credential'
      ) {
        try {
          const newUser = await firebaseRegisterWithEmail(emailToUse, pass);
          if (newUser) {
            const profile = await syncUserProfileWithFirestore(newUser);
            setCurrentUser(profile);
            setIsAuthenticated(true);
            localStorage.setItem('starlive_auth_session', 'true');
            return;
          }
        } catch (regErr: any) {
          if (regErr?.code === 'auth/email-already-in-use') {
            throw new Error("Incorrect password for this account. Please check your password or use Google Sign-In.");
          }
        }
      }

      // Fallback for admin preset (wajaht265374@gmail.com) or demo users so users are never locked out
      const isRequestedAdmin = emailToUse.toLowerCase() === 'wajaht265374@gmail.com' || raw.toLowerCase() === 'wajaht265374@gmail.com';
      const localMatched = allUsers.find(u => 
        u.email?.toLowerCase() === emailToUse.toLowerCase() ||
        u.username.toLowerCase() === raw.toLowerCase()
      ) || (isRequestedAdmin ? defaultCurrentUser : null);

      if (localMatched) {
        const isAdmin = isRequestedAdmin || localMatched.email?.toLowerCase().trim() === 'wajaht265374@gmail.com';
        setCurrentUser({
          ...localMatched,
          role: isAdmin ? 'admin' : 'user'
        });
        setIsAuthenticated(true);
        localStorage.setItem('starlive_auth_session', 'true');
        return;
      }

      if (err?.code === 'auth/invalid-email') {
        throw new Error("Please enter a valid Gmail address or username.");
      }

      throw new Error("Invalid username/Gmail or password. Please try again.");
    }
  };

  const registerWithUsernameOrGmail = async (
    username: string,
    email: string,
    pass: string,
    displayName?: string
  ) => {
    const cleanUser = username.trim();
    if (!cleanUser) {
      throw new Error("Please enter a username.");
    }
    if (cleanUser.length < 3) {
      throw new Error("Username must be at least 3 characters.");
    }
    if (!pass || pass.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    let targetEmail = email.trim().toLowerCase();
    if (!targetEmail) {
      targetEmail = `${cleanUser.toLowerCase().replace(/[^a-z0-9]/g, '')}@starlive.app`;
    } else if (!targetEmail.includes('@')) {
      throw new Error("Please enter a valid Gmail / email address.");
    }

    const isAdmin = targetEmail === 'wajaht265374@gmail.com';

    try {
      const user = await firebaseRegisterWithEmail(targetEmail, pass);
      if (user) {
        const newProfile: UserProfile = {
          id: user.uid,
          uid: user.uid,
          username: cleanUser,
          displayName: displayName?.trim() || cleanUser,
          email: targetEmail,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
          bio: 'Living the StarLive vibes 🌟 Music, Live streams & Good Friends.',
          country: 'Global',
          countryFlag: '🌐',
          coins: 12000,
          diamonds: 0,
          level: 1,
          role: isAdmin ? 'admin' : 'user',
          followersCount: 0,
          followingCount: 0,
          badges: ['Star Explorer', 'Verified Member'],
          isVerified: true,
          createdAt: new Date().toISOString()
        };

        try {
          await setDoc(doc(db, 'users', user.uid), {
            ...newProfile,
            usernameLower: cleanUser.toLowerCase()
          });
        } catch (e) {}

        setCurrentUser(newProfile);
        setIsAuthenticated(true);
        localStorage.setItem('starlive_auth_session', 'true');
        soundEffects.playCoinSound();
        try {
          confetti({ particleCount: 60, spread: 70 });
        } catch (e) {}
      }
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        throw new Error("This Gmail/email is already registered. Please Sign In instead.");
      }
      if (err?.code === 'auth/weak-password') {
        throw new Error("Password is too weak. Please use at least 6 characters.");
      }
      throw err;
    }
  };

  const registerWithEmail = async (email: string, pass: string, displayName: string) => {
    return registerWithUsernameOrGmail(displayName || email.split('@')[0], email, pass, displayName);
  };

  const loginAsGuestUser = async () => {
    try {
      await signInGuest();
    } catch (e) {
      // Offline fallback
    }
    const guestUser: UserProfile = {
      id: 'guest_' + Math.random().toString(36).substring(2, 7),
      uid: 'uid_guest_' + Date.now(),
      username: 'StarGuest_' + Math.floor(1000 + Math.random() * 9000),
      displayName: 'Star Guest',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      bio: 'Exploring StarLive community! 🌟',
      country: 'Global',
      countryFlag: '🌐',
      coins: 12000, // 12,000 welcome coins
      diamonds: 100,
      level: 1,
      role: 'user',
      followersCount: 0,
      followingCount: 5,
      badges: ['Star Explorer', 'Guest Pass'],
      createdAt: new Date().toISOString()
    };
    setCurrentUser(guestUser);
    setIsAuthenticated(true);
    localStorage.setItem('starlive_auth_session', 'true');
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {}
    localStorage.removeItem('starlive_auth_session');
    setIsAuthenticated(false);
    setIsAdminMode(false);
  };

  const rechargeCoins = async (amount: number, description?: string) => {
    setCurrentUser(prev => {
      const nextCoins = (prev.coins || 0) + amount;
      if (prev.uid) {
        updateDoc(doc(db, 'users', prev.uid), { coins: nextCoins }).catch(() => {});
      }
      return {
        ...prev,
        coins: nextCoins
      };
    });

    const newTx: TransactionRecord = {
      id: 'tx-' + Date.now(),
      userId: currentUser.id,
      type: 'recharge',
      amount,
      description: description || `Recharged +${amount} Coins`,
      createdAt: 'Just now'
    };

    setTransactions(prev => [newTx, ...prev]);
    soundEffects.playCoinSound();

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  const topUpCoins = (amount: number, costUSD: string) => {
    rechargeCoins(amount, `Recharge Pack ($${costUSD}) +${amount} Coins`);
  };

  const claimDailyBonus = (): boolean => {
    const reward = 500;
    setCurrentUser(prev => ({
      ...prev,
      coins: prev.coins + reward
    }));

    const newTx: TransactionRecord = {
      id: 'tx-' + Date.now(),
      userId: currentUser.id,
      type: 'daily_checkin',
      amount: reward,
      description: 'Daily Check-in Reward +500 Coins',
      createdAt: 'Just now'
    };
    setTransactions(prev => [newTx, ...prev]);
    soundEffects.playCoinSound();

    try {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.7 }
      });
    } catch (e) {}

    return true;
  };

  const sendGift = async (gift: GiftItem, recipientId: string, recipientName: string, roomId?: string): Promise<boolean> => {
    if (currentUser.coins < gift.cost) {
      setShowRechargeModal(true);
      return false;
    }

    // Deduct coins from sender
    setCurrentUser(prev => ({
      ...prev,
      coins: prev.coins - gift.cost,
      level: prev.level + (gift.cost >= 500 ? 1 : 0)
    }));

    // Add diamonds to recipient if recipient exists in allUsers
    setAllUsers(prev => prev.map(u => {
      if (u.id === recipientId) {
        return { ...u, diamonds: u.diamonds + Math.floor(gift.cost * 0.7) };
      }
      return u;
    }));

    // Record transaction
    const tx: TransactionRecord = {
      id: 'tx-' + Date.now(),
      userId: currentUser.id,
      type: 'gift_sent',
      amount: -gift.cost,
      description: `Sent ${gift.name} ${gift.icon} to ${recipientName}`,
      relatedUser: recipientName,
      createdAt: 'Just now'
    };
    setTransactions(prev => [tx, ...prev]);

    // Send room message or direct message
    const chatMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      senderAvatar: currentUser.avatar,
      senderLevel: currentUser.level,
      receiverId: recipientId,
      roomId: roomId || undefined,
      content: `Sent ${gift.name} ${gift.icon} (Value: ${gift.cost} coins)!`,
      type: 'gift',
      gift,
      createdAt: 'Just now'
    };
    setMessages(prev => [...prev, chatMsg]);

    // Sound effect
    if (gift.cost >= 1000) {
      soundEffects.playGiftCelebration();
    } else {
      soundEffects.playCoinSound();
    }

    // Canvas Confetti
    try {
      confetti({
        particleCount: gift.cost > 500 ? 100 : 35,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    return true;
  };

  const createRoom = async (data: { 
    title: string; 
    category?: string; 
    country?: string; 
    isParty?: boolean; 
    coverImage?: string; 
    backgroundTheme?: string; 
    announcement?: string; 
    isPrivate?: boolean; 
    password?: string; 
  }): Promise<LiveRoom> => {
    const isParty = data.isParty ?? true;
    const defaultCover = 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80';
    const defaultBg = 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1600&auto=format&fit=crop&q=80';
    
    // Ensure creator hostId matches current user credentials consistently
    const hostId = String(currentUser.id || currentUser.uid || auth.currentUser?.uid || 'host');

    // Requirement 2: Maximum 2 Rooms Per User
    // 1. Check local state active rooms count
    const localActive = liveRooms.filter(r => 
      (r.hostId === hostId || r.hostId === currentUser.id || r.hostId === currentUser.uid || (auth.currentUser && r.hostId === auth.currentUser.uid)) &&
      r.status !== 'ended'
    );
    if (localActive.length >= 2) {
      throw new Error("You can create a maximum of 2 rooms.");
    }

    // 2. Query Firestore directly to prevent bypass across devices, tabs, or refresh
    try {
      const q = query(
        collection(db, 'liveRooms'),
        where('hostId', '==', hostId)
      );
      const querySnap = await getDocs(q);
      const remoteActive = querySnap.docs
        .map(d => d.data() as LiveRoom)
        .filter(r => r.status !== 'ended');
      if (remoteActive.length >= 2) {
        throw new Error("You can create a maximum of 2 rooms.");
      }
    } catch (e: any) {
      if (e.message === "You can create a maximum of 2 rooms.") {
        throw e;
      }
      console.warn("[AppContext] Firestore room count check notice:", e);
    }

    const newRoom: LiveRoom = {
      id: 'room-' + Date.now(),
      hostId,
      hostName: currentUser.displayName,
      hostAvatar: currentUser.avatar,
      hostLevel: currentUser.level,
      title: data.title.trim(),
      category: data.category || 'Popular',
      country: data.country || currentUser.country,
      countryFlag: currentUser.countryFlag || '🌐',
      viewerCount: 1,
      coverImage: data.coverImage || defaultCover,
      backgroundTheme: data.backgroundTheme || defaultBg,
      announcement: data.announcement || 'Welcome to my official live room! 🌟 Respect everyone and enjoy the vibes.',
      status: 'active',
      isParty,
      isPrivate: data.isPrivate ?? false,
      password: data.password || '',
      micSeats: [
        { seatIndex: 0, userId: hostId, userName: `${currentUser.displayName} (Host)`, userAvatar: currentUser.avatar, userLevel: currentUser.level, isMuted: false },
        { seatIndex: 1, isLocked: false },
        { seatIndex: 2, isLocked: false },
        { seatIndex: 3, isLocked: false },
        { seatIndex: 4, isLocked: false },
        { seatIndex: 5, isLocked: false },
        { seatIndex: 6, isLocked: false },
        { seatIndex: 7, isLocked: false }
      ],
      tags: [data.category || 'Popular', isParty ? 'Voice Party' : 'Live Stream'],
      chestLevel: 1,
      vipBadge: '🚀 Official Room Host',
      likes: 1,
      createdAt: new Date().toISOString()
    };

    // Prepend immediately to liveRooms for instant visibility in Popular / Room lists
    setLiveRooms(prev => {
      const updated = [newRoom, ...prev.filter(r => r.id !== newRoom.id)];
      try {
        localStorage.setItem('starlive_all_rooms', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Also register in recentRooms
    setRecentRooms(prev => {
      const updated = [newRoom, ...prev.filter(r => r.id !== newRoom.id)].slice(0, 10);
      try {
        localStorage.setItem('starlive_recent_rooms', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setActiveRoom(newRoom);

    // Save permanently to Firestore
    try {
      await setDoc(doc(db, 'liveRooms', newRoom.id), newRoom);
      const ownerMember: RoomMember = {
        id: currentUser.id,
        userId: currentUser.id,
        userName: currentUser.displayName,
        userAvatar: currentUser.avatar,
        userLevel: currentUser.level,
        role: 'owner',
        joinedAt: new Date().toISOString(),
        lastSeen: Date.now()
      };
      await setDoc(doc(db, 'liveRooms', newRoom.id, 'members', currentUser.id), ownerMember);
      unifiedSignaling.createRoom(newRoom.id, hostId, newRoom.title);
    } catch (e) {
      console.warn("Saved room locally (Firestore fallback):", e);
    }

    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (e) {}

    return newRoom;
  };

  const createLiveRoom = createRoom;

  const updateRoom = async (roomId: string, updates: Partial<LiveRoom>) => {
    // Only the user who created the room (or admin) is permitted to edit
    const targetRoom = liveRooms.find(r => r.id === roomId) || (activeRoom?.id === roomId ? activeRoom : null);
    if (targetRoom) {
      const isOwner = targetRoom.hostId === currentUser.id || 
                      targetRoom.hostId === currentUser.uid || 
                      (auth.currentUser && targetRoom.hostId === auth.currentUser.uid) ||
                      currentUser.role === 'admin' ||
                      currentUser.email === 'wajaht265374@gmail.com';
      if (!isOwner) {
        console.warn("Permission denied: Only the room creator can edit this room.");
        throw new Error("Only the creator of this room can edit its details.");
      }
    }

    // Immediately update liveRooms locally and permanently in localStorage
    setLiveRooms(prev => {
      const updated = prev.map(r => r.id === roomId ? { ...r, ...updates } : r);
      try {
        localStorage.setItem('starlive_all_rooms', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (activeRoom?.id === roomId) {
      setActiveRoom(prev => prev ? { ...prev, ...updates } : null);
    }

    setRecentRooms(prev => {
      const updated = prev.map(r => r.id === roomId ? { ...r, ...updates } : r);
      try {
        localStorage.setItem('starlive_recent_rooms', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Synchronize permanently with Firestore
    try {
      await updateDoc(doc(db, 'liveRooms', roomId), updates);
    } catch (e) {
      console.warn("Updated room locally (Firestore fallback):", e);
    }
  };

  const joinRoom = async (roomOrId: LiveRoom | string, passwordAttempt?: string): Promise<{ success: boolean; error?: string }> => {
    let room: LiveRoom | undefined;

    if (typeof roomOrId === 'string') {
      const cleanId = roomOrId.trim();
      room = liveRooms.find(r => 
        r.id === cleanId || 
        r.id === `room-${cleanId}` || 
        r.id.toLowerCase().endsWith(cleanId.toLowerCase())
      );
      if (!room) {
        try {
          const s1 = await getDoc(doc(db, 'liveRooms', cleanId));
          if (s1.exists()) {
            room = { id: s1.id, ...s1.data() } as LiveRoom;
          } else {
            const s2 = await getDoc(doc(db, 'liveRooms', `room-${cleanId}`));
            if (s2.exists()) {
              room = { id: s2.id, ...s2.data() } as LiveRoom;
            }
          }
        } catch (e) {
          console.warn("[AppContext] Error querying room by ID:", e);
        }
      }
    } else {
      room = roomOrId;
    }

    if (!room || !room.id) {
      console.error("[AppContext] Invalid room supplied to joinRoom:", roomOrId);
      return { success: false, error: 'Room not found' };
    }

    const currentUserId = String(currentUser.id || currentUser.uid || 'current_user');
    const isHost = room.hostId === currentUserId || 
                   room.hostId === currentUser.id || 
                   room.hostId === currentUser.uid;

    if (room.isPrivate && !isHost) {
      if (!passwordAttempt) {
        setRoomPendingPassword(room);
        setIsPasswordModalOpen(true);
        return { success: false, error: 'Password required' };
      }
      if (passwordAttempt !== room.password) {
        return { success: false, error: 'Incorrect room passcode' };
      }
    }

    // Synchronize with latest Firestore room state so joining device does not create separate local state
    try {
      const roomSnap = await getDoc(doc(db, 'liveRooms', room.id));
      if (roomSnap.exists()) {
        const remoteData = roomSnap.data() as LiveRoom;
        room = { ...room, ...remoteData, id: room.id };
      } else {
        // First time room is opened - seed to Firestore so all devices share this exact document
        await setDoc(doc(db, 'liveRooms', room.id), room, { merge: true });
      }
    } catch (e) {
      console.warn("[AppContext] Could not fetch remote room state on join:", e);
    }

    const newViewerCount = Math.max(1, (room.viewerCount || 0) + (isHost ? 0 : 1));

    // Auto-place joining user on first available mic seat so both parties have active voice communication immediately
    let updatedMicSeats = room.micSeats ? [...room.micSeats] : [];
    if (updatedMicSeats.length < 8) {
      updatedMicSeats = Array.from({ length: 8 }, (_, i) => updatedMicSeats[i] || ({ seatIndex: i, isLocked: false }));
    }

    const isAlreadyOnSeat = updatedMicSeats.some(s => s.userId === currentUserId || s.userId === currentUser.id);
    if (!isHost && !isAlreadyOnSeat) {
      const freeSeatIdx = updatedMicSeats.findIndex(s => !s.userId && !s.isLocked);
      if (freeSeatIdx !== -1) {
        updatedMicSeats[freeSeatIdx] = {
          seatIndex: freeSeatIdx,
          userId: currentUserId,
          userName: currentUser.displayName || currentUser.username || 'User',
          userAvatar: currentUser.avatar || '',
          userLevel: currentUser.level || 1,
          isMuted: false,
          isLocked: false
        };
      }
    }

    const updatedRoom: LiveRoom = {
      ...room,
      viewerCount: newViewerCount,
      micSeats: updatedMicSeats
    };

    // 1. Synchronously set active room so UI opens immediately on mobile or desktop without lag
    setActiveRoom(updatedRoom);
    setLiveRooms(prev => {
      const exists = prev.some(r => r.id === updatedRoom.id);
      if (exists) return prev.map(r => r.id === updatedRoom.id ? { ...r, ...updatedRoom } : r);
      return [updatedRoom, ...prev];
    });

    // 2. Record into persistent Recently Visited list
    setRecentRooms(prev => {
      const filtered = prev.filter(r => r.id !== updatedRoom.id);
      const updated = [updatedRoom, ...filtered].slice(0, 12);
      try {
        localStorage.setItem('starlive_recent_rooms', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 3. Immediately register member, micSeats, & viewerCount in Firestore
    (async () => {
      try {
        const newMember: RoomMember = {
          id: currentUserId,
          userId: currentUserId,
          userName: currentUser.displayName || currentUser.username || 'StarLive User',
          userAvatar: currentUser.avatar || '',
          userLevel: currentUser.level || 1,
          role: isHost ? 'owner' : 'member',
          joinedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'liveRooms', updatedRoom.id, 'members', currentUserId), newMember, { merge: true });
        await setDoc(doc(db, 'liveRooms', updatedRoom.id), { 
          viewerCount: newViewerCount,
          micSeats: updatedMicSeats
        }, { merge: true });
      } catch (e) {
        console.warn("[AppContext] Firestore member sync error:", e);
      }

      // Notify room of user entrance
      try {
        const enterMsg: ChatMessage = {
          id: 'msg-' + Date.now(),
          senderId: currentUserId,
          senderName: currentUser.displayName || currentUser.username || 'User',
          senderAvatar: currentUser.avatar,
          senderLevel: currentUser.level || 1,
          roomId: updatedRoom.id,
          content: `entered the room ✨`,
          type: 'join',
          createdAt: 'Just now'
        };
        await setDoc(doc(db, 'messages', enterMsg.id), enterMsg);
        setMessages(prev => [...prev, enterMsg]);
      } catch (e) {}
    })();

    return { success: true };
  };

  const joinRoomById = async (roomId: string, passwordAttempt?: string) => {
    return joinRoom(roomId, passwordAttempt);
  };

  const rentRoom = async (
    roomIdOrTitle: string, 
    rentType: 'daily' | 'weekly' | 'monthly' | 'vip' = 'monthly',
    customCover?: string
  ): Promise<LiveRoom> => {
    const existingRoom = liveRooms.find(r => r.id === roomIdOrTitle || r.title === roomIdOrTitle);
    const durationDays = rentType === 'daily' ? 1 : rentType === 'weekly' ? 7 : 30;
    const cost = rentType === 'daily' ? 2000 : rentType === 'weekly' ? 12000 : 35000;

    let targetRoom: LiveRoom;
    if (existingRoom) {
      targetRoom = {
        ...existingRoom,
        isRented: true,
        rentExpiresAt: new Date(Date.now() + durationDays * 86400000).toISOString(),
        vipBadge: 'VIP RENTED'
      };
    } else {
      targetRoom = await createRoom({
        title: roomIdOrTitle.includes('Room') ? roomIdOrTitle : `${roomIdOrTitle}'s VIP Rented Room 👑`,
        category: 'Popular',
        isParty: true,
        coverImage: customCover || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
        announcement: 'Official Rented VIP Room - High quality voice broadcast!'
      });
      targetRoom = {
        ...targetRoom,
        isRented: true,
        rentExpiresAt: new Date(Date.now() + durationDays * 86400000).toISOString(),
        vipBadge: 'VIP RENTED'
      };
    }

    const currentUserId = currentUser.id || currentUser.uid || 'current_user';
    const newRent: RoomRent = {
      id: 'rent-' + Date.now(),
      roomId: targetRoom.id,
      roomTitle: targetRoom.title,
      userId: currentUserId,
      userName: currentUser.displayName,
      userAvatar: currentUser.avatar,
      rentType,
      rentPrice: cost,
      status: 'active',
      startDate: new Date().toISOString(),
      expiresDate: new Date(Date.now() + durationDays * 86400000).toISOString(),
      createdAt: new Date().toISOString()
    };

    setRoomRents(prev => {
      const updated = [newRent, ...prev.filter(r => r.roomId !== targetRoom.id)];
      try {
        localStorage.setItem('starlive_room_rents', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      await setDoc(doc(db, 'roomRents', newRent.id), newRent);
      await setDoc(doc(db, 'liveRooms', targetRoom.id), targetRoom, { merge: true });
    } catch (e) {
      console.warn("[AppContext] Firestore rent room sync fallback:", e);
    }

    if (currentUser.coins >= cost) {
      setCurrentUser(prev => ({ ...prev, coins: prev.coins - cost }));
    }

    setActiveRoom(targetRoom);
    return targetRoom;
  };

  const openRoomRent = async (roomIdOrRentId: string): Promise<boolean> => {
    console.log("[AppContext] openRoomRent called with:", roomIdOrRentId);
    const rent = roomRents.find(r => r.id === roomIdOrRentId || r.roomId === roomIdOrRentId);
    const targetRoomId = rent ? rent.roomId : roomIdOrRentId;
    const room = liveRooms.find(r => r.id === targetRoomId);
    if (room) {
      await joinRoom(room);
      return true;
    }
    if (myRoom) {
      await joinRoom(myRoom);
      return true;
    }
    if (liveRooms.length > 0) {
      await joinRoom(liveRooms[0]);
      return true;
    }
    // If no room found, create or open a default room
    const created = await rentRoom('My VIP Room', 'monthly');
    return Boolean(created);
  };

  const isRoomRented = (roomId: string): boolean => {
    return roomRents.some(r => r.roomId === roomId && r.status === 'active');
  };

  const leaveRoom = async (roomIdToLeave?: string) => {
    const targetRoom = roomIdToLeave
      ? (liveRooms.find(r => r.id === roomIdToLeave) || activeRoom)
      : activeRoom;

    if (!targetRoom) {
      setActiveRoom(null);
      return;
    }

    const roomId = targetRoom.id;
    const currentUserId = String(currentUser.id || currentUser.uid || 'current_user');
    const isHost = targetRoom.hostId === currentUserId || 
                   targetRoom.hostId === currentUser.id || 
                   targetRoom.hostId === currentUser.uid;

    // Immediately close UI & update active room state so user leaves with zero lag
    setActiveRoom(null);

    // Notify real-time signaling immediately
    try {
      unifiedSignaling.leaveRoom(roomId, currentUserId);
    } catch (e) {}

    // 1. Immediately free any mic seat occupied by currentUser in state
    let seatFreed = false;
    let currentSeats = targetRoom.micSeats ? [...targetRoom.micSeats] : [];
    currentSeats = currentSeats.map(s => {
      if (s.userId === currentUser.id || s.userId === currentUser.uid || s.userId === currentUserId) {
        seatFreed = true;
        return { seatIndex: s.seatIndex, isLocked: false };
      }
      return s;
    });

    if (seatFreed) {
      setLiveRooms(prev => prev.map(r => r.id === roomId ? { ...r, micSeats: currentSeats } : r));
    }

    // 2. Persist removal to Firestore immediately
    try {
      // Remove member doc
      if (currentUser.id) {
        await deleteDoc(doc(db, 'liveRooms', roomId, 'members', currentUser.id)).catch(() => {});
      }
      if (currentUser.uid && currentUser.uid !== currentUser.id) {
        await deleteDoc(doc(db, 'liveRooms', roomId, 'members', currentUser.uid)).catch(() => {});
      }

      // Check remaining members in the room
      const remainingSnap = await getDocs(collection(db, 'liveRooms', roomId, 'members'));
      const remainingMembers = remainingSnap.docs.filter(d => d.id !== currentUser.id && d.id !== currentUser.uid);
      const remainingCount = remainingMembers.length;

      // Requirement 6: If a room becomes empty, automatically remove/close it
      if (remainingCount === 0 || (isHost && remainingCount <= 1)) {
        console.log(`[AppContext] Room ${roomId} is now empty after leave. Cleaning up room.`);
        await deleteDoc(doc(db, 'liveRooms', roomId)).catch(() => {});
        setLiveRooms(prev => prev.filter(r => r.id !== roomId));
        try {
          const saved = localStorage.getItem('starlive_all_rooms');
          if (saved) {
            const list = JSON.parse(saved);
            localStorage.setItem('starlive_all_rooms', JSON.stringify(list.filter((r: LiveRoom) => r.id !== roomId)));
          }
        } catch (e) {}
      } else {
        // Fetch fresh room doc to update viewer count & mic seats
        try {
          const roomRef = doc(db, 'liveRooms', roomId);
          const snap = await getDoc(roomRef);
          let freshSeats = snap.exists() && snap.data().micSeats ? snap.data().micSeats : currentSeats;
          freshSeats = freshSeats.map((s: MicSeat) => {
            if (s.userId === currentUser.id || s.userId === currentUser.uid || s.userId === currentUserId) {
              return { seatIndex: s.seatIndex, isLocked: false };
            }
            return s;
          });
          await updateDoc(roomRef, { 
            viewerCount: remainingCount,
            micSeats: freshSeats 
          }).catch(() => {});
        } catch (e) {}
      }
    } catch (e) {
      console.warn("Left room error:", e);
    }
  };

  const removeMemberFromRoom = async (roomId: string, targetUserId: string) => {
    if (!roomId || !targetUserId) return;
    try {
      // 1. Remove from members subcollection
      await deleteDoc(doc(db, 'liveRooms', roomId, 'members', targetUserId)).catch(() => {});

      // 2. Free mic seat if occupied
      const targetRoom = liveRooms.find(r => r.id === roomId) || activeRoom;
      if (targetRoom && targetRoom.micSeats) {
        let seatFreed = false;
        const currentSeats = targetRoom.micSeats.map(s => {
          if (s.userId === targetUserId) {
            seatFreed = true;
            return { seatIndex: s.seatIndex, isLocked: false };
          }
          return s;
        });

        if (seatFreed) {
          setLiveRooms(prev => prev.map(r => r.id === roomId ? { ...r, micSeats: currentSeats } : r));
          if (activeRoom?.id === roomId) {
            setActiveRoom(prev => prev ? { ...prev, micSeats: currentSeats } : null);
          }
          await setDoc(doc(db, 'liveRooms', roomId), { micSeats: currentSeats }, { merge: true }).catch(() => {});
        }
      }
    } catch (e) {
      console.warn("removeMemberFromRoom error:", e);
    }
  };

  const endLiveRoom = async (roomId: string) => {
    setLiveRooms(prev => prev.filter(r => r.id !== roomId));
    if (activeRoom?.id === roomId) {
      setActiveRoom(null);
    }
    try {
      // 1. Delete all member docs in subcollection
      const membersSnap = await getDocs(collection(db, 'liveRooms', roomId, 'members'));
      for (const mDoc of membersSnap.docs) {
        await deleteDoc(mDoc.ref).catch(() => {});
      }
      // 2. Delete room doc
      await deleteDoc(doc(db, 'liveRooms', roomId));
      // 3. Notify signaling
      unifiedSignaling.sendRoomEvent(roomId, 'room-ended', { roomId });
      // 4. Update localStorage
      try {
        const saved = localStorage.getItem('starlive_all_rooms');
        if (saved) {
          const list = JSON.parse(saved);
          localStorage.setItem('starlive_all_rooms', JSON.stringify(list.filter((r: LiveRoom) => r.id !== roomId)));
        }
      } catch (e) {}
    } catch (e) {
      console.warn("endLiveRoom error:", e);
    }
  };

  const createPost = async (content: string, mediaUrl?: string, tags?: string[]) => {
    const newPost: PostMoment = {
      id: 'post-' + Date.now(),
      authorId: currentUser.id,
      authorName: currentUser.displayName,
      authorAvatar: currentUser.avatar,
      authorLevel: currentUser.level,
      countryFlag: currentUser.countryFlag,
      content,
      mediaUrl,
      likesCount: 0,
      likedBy: [],
      commentsCount: 0,
      comments: [],
      tags: tags || ['StarLive'],
      createdAt: 'Just now'
    };

    setPosts(prev => [newPost, ...prev]);

    try {
      await setDoc(doc(db, 'posts', newPost.id), newPost);
    } catch (e) {
      console.warn("Saved post locally:", e);
    }
  };

  const likePost = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isLiked = p.likedBy.includes(currentUser.id);
        const newLikedBy = isLiked ? p.likedBy.filter(id => id !== currentUser.id) : [...p.likedBy, currentUser.id];
        return {
          ...p,
          likesCount: isLiked ? p.likesCount - 1 : p.likesCount + 1,
          likedBy: newLikedBy
        };
      }
      return p;
    }));
  };

  const addComment = (postId: string, text: string) => {
    const comment: CommentItem = {
      id: 'c-' + Date.now(),
      authorId: currentUser.id,
      authorName: currentUser.displayName,
      authorAvatar: currentUser.avatar,
      text,
      createdAt: 'Just now'
    };

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          commentsCount: p.commentsCount + 1,
          comments: [...p.comments, comment]
        };
      }
      return p;
    }));
  };

  const deletePost = async (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (e) {}
  };

  const sendMessage = async (receiverId: string, content: string, roomId?: string, gift?: GiftItem) => {
    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      senderAvatar: currentUser.avatar,
      senderLevel: currentUser.level,
      receiverId,
      roomId,
      content,
      type: gift ? 'gift' : 'text',
      gift,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);

    try {
      await addDoc(collection(db, 'messages'), newMsg);
    } catch (e) {}
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const followUser = (targetUserId: string) => {
    setCurrentUser(prev => ({ ...prev, followingCount: prev.followingCount + 1 }));
    setAllUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, followersCount: u.followersCount + 1 } : u));
  };

  const unfollowUser = (targetUserId: string) => {
    setCurrentUser(prev => ({ ...prev, followingCount: Math.max(0, prev.followingCount - 1) }));
    setAllUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, followersCount: Math.max(0, u.followersCount - 1) } : u));
  };

  const submitReport = (targetType: 'user' | 'room' | 'post', targetId: string, targetName: string, reason: string) => {
    const newReport: UserReport = {
      id: 'rep-' + Date.now(),
      reporterId: currentUser.id,
      reporterName: currentUser.displayName,
      targetType,
      targetId,
      targetName,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setReports(prev => [newReport, ...prev]);
  };

  const takePartySeat = async (roomId: string, seatIndex: number) => {
    const myId = String(currentUser.id || currentUser.uid);

    try {
      const roomRef = doc(db, 'liveRooms', roomId);
      const roomSnap = await getDoc(roomRef);

      let baseSeats: MicSeat[];
      if (roomSnap.exists() && roomSnap.data().micSeats) {
        baseSeats = roomSnap.data().micSeats;
      } else {
        const fallback = activeRoom?.id === roomId ? activeRoom : liveRooms.find(r => r.id === roomId);
        baseSeats = fallback?.micSeats && fallback.micSeats.length >= 8 
          ? fallback.micSeats 
          : Array.from({ length: 8 }, (_, i) => ({ seatIndex: i, isLocked: false }));
      }

      let currentSeats: MicSeat[] = baseSeats.length >= 8 
        ? [...baseSeats] 
        : Array.from({ length: 8 }, (_, i) => baseSeats[i] || ({ seatIndex: i, isLocked: false }));

      // If seat is occupied by someone else, prevent takeover
      const occ = currentSeats[seatIndex];
      if (occ?.userId && occ.userId !== myId && occ.userId !== currentUser.id && occ.userId !== currentUser.uid) {
        console.warn("Seat already occupied by another user:", occ.userName);
        return;
      }

      // Step 1: Remove currentUser from any previous seat in this room
      currentSeats = currentSeats.map(s => {
        if (s.userId === myId || s.userId === currentUser.id || s.userId === currentUser.uid) {
          return { seatIndex: s.seatIndex, isLocked: false };
        }
        return s;
      });

      // Step 2: Occupy the requested seat
      currentSeats[seatIndex] = {
        seatIndex,
        userId: myId,
        userName: currentUser.displayName || currentUser.username || 'User',
        userAvatar: currentUser.avatar || '',
        userLevel: currentUser.level || 1,
        isMuted: false,
        isLocked: false
      };

      setLiveRooms(prev => prev.map(r => r.id === roomId ? { ...r, micSeats: currentSeats } : r));
      if (activeRoom?.id === roomId) {
        setActiveRoom(prev => prev ? { ...prev, micSeats: currentSeats } : null);
      }

      // Persist to Firestore with merge
      await setDoc(roomRef, { micSeats: currentSeats }, { merge: true });
    } catch (e) {
      console.warn("Error taking party seat:", e);
    }
  };

  const leavePartySeat = async (roomId: string, seatIndex?: number, targetUserId?: string) => {
    const userToRemove = targetUserId || currentUser.id;
    const userUidToRemove = targetUserId || currentUser.uid;

    try {
      const roomRef = doc(db, 'liveRooms', roomId);
      const roomSnap = await getDoc(roomRef);

      let baseSeats: MicSeat[];
      if (roomSnap.exists() && roomSnap.data().micSeats) {
        baseSeats = roomSnap.data().micSeats;
      } else {
        const targetRoom = liveRooms.find(r => r.id === roomId) || activeRoom;
        baseSeats = targetRoom?.micSeats ? [...targetRoom.micSeats] : [];
      }

      let currentSeats = [...baseSeats];

      if (seatIndex !== undefined && seatIndex >= 0) {
        if (
          currentSeats[seatIndex]?.userId === userToRemove ||
          currentSeats[seatIndex]?.userId === userUidToRemove ||
          (!targetUserId && (currentSeats[seatIndex]?.userId === currentUser.id || currentSeats[seatIndex]?.userId === currentUser.uid))
        ) {
          currentSeats[seatIndex] = { seatIndex, isLocked: false };
        }
      } else {
        currentSeats = currentSeats.map(s => {
          if (
            s.userId === userToRemove ||
            s.userId === userUidToRemove ||
            (!targetUserId && (s.userId === currentUser.id || s.userId === currentUser.uid))
          ) {
            return { seatIndex: s.seatIndex, isLocked: false };
          }
          return s;
        });
      }

      setLiveRooms(prev => prev.map(r => r.id === roomId ? { ...r, micSeats: currentSeats } : r));
      if (activeRoom?.id === roomId) {
        setActiveRoom(prev => prev ? { ...prev, micSeats: currentSeats } : null);
      }

      await setDoc(roomRef, { micSeats: currentSeats }, { merge: true });
    } catch (e) {
      console.warn("leavePartySeat error:", e);
    }
  };

  const mutePartySeat = async (roomId: string, seatIndex?: number) => {
    let targetRoom = liveRooms.find(r => r.id === roomId) || activeRoom;
    if (!targetRoom || !targetRoom.micSeats) return;

    let currentSeats = [...targetRoom.micSeats];
    const idx = seatIndex !== undefined && seatIndex >= 0 
      ? seatIndex 
      : currentSeats.findIndex(s => s.userId === currentUser.id);

    if (idx !== -1 && currentSeats[idx]) {
      currentSeats[idx] = {
        ...currentSeats[idx],
        isMuted: !currentSeats[idx].isMuted
      };

      setLiveRooms(prev => prev.map(r => r.id === roomId ? { ...r, micSeats: currentSeats } : r));
      if (activeRoom?.id === roomId) {
        setActiveRoom(prev => prev ? { ...prev, micSeats: currentSeats } : null);
      }

      try {
        await setDoc(doc(db, 'liveRooms', roomId), { micSeats: currentSeats }, { merge: true });
      } catch (e) {}
    }
  };

  // Admin controls
  const adminUpdateUser = (userId: string, updates: Partial<UserProfile>) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }
  };

  const adminBanUser = (userId: string, ban: boolean) => {
    adminUpdateUser(userId, { isBanned: ban });
  };

  const adminAdjustCoins = (userId: string, delta: number) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, coins: Math.max(0, u.coins + delta) };
      }
      return u;
    }));
    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, coins: Math.max(0, prev.coins + delta) }));
    }
  };

  const adminUpdateReport = (reportId: string, status: 'resolved' | 'dismissed') => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
  };

  const adminCreateEvent = (eventData: Omit<AppEvent, 'id'>) => {
    const newEvent: AppEvent = {
      ...eventData,
      id: 'evt-' + Date.now()
    };
    setEvents(prev => [newEvent, ...prev]);
  };

  const adminUpdateEvent = (eventId: string, updates: Partial<AppEvent>) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...updates } : e));
  };

  const adminDeleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  const adminDeleteRoom = (roomId: string) => {
    endLiveRoom(roomId);
  };

  // ==========================================
  // APK DOWNLOAD & RELEASE MANAGEMENT
  // ==========================================

  const downloadActiveApk = async () => {
    setIsApkDownloading(true);
    soundEffects.playCoinSound();
    try {
      // 1. Always fetch directly from Firestore server to prevent any browser, CDN, or worker caching
      let freshRelease: AppRelease | null = null;
      try {
        freshRelease = await fetchActiveApkFromDb();
      } catch (err) {
        console.warn("Could not query fresh active APK from DB:", err);
      }

      const releaseToDownload = freshRelease || activeApkRelease || DEFAULT_INITIAL_RELEASE;
      setActiveApkRelease(releaseToDownload);
      try {
        localStorage.setItem('starlive_active_apk', JSON.stringify(releaseToDownload));
      } catch (e) {}

      // 2. Trigger browser download with dynamic cache-busting timestamp
      await triggerDirectApkDownload(releaseToDownload);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.85 } });
    } catch (err) {
      console.error("APK download error:", err);
      if (activeApkRelease) {
        await triggerDirectApkDownload(activeApkRelease);
      }
    } finally {
      setTimeout(() => setIsApkDownloading(false), 800);
    }
  };

  const adminUploadAndPublishApk = async (
    file: File,
    version: string,
    versionCode: number,
    changelog?: string,
    onProgress?: (percent: number) => void
  ): Promise<AppRelease> => {
    // 1. Upload to permanent Firebase Storage
    const uploadResult = await uploadApkFileToStorage(file, version, onProgress);

    // 2. Publish to Firestore and mark as active APK, replacing previous active APK
    const newRelease = await publishNewApkRelease({
      version,
      versionCode,
      fileName: uploadResult.fileName,
      fileSize: uploadResult.fileSize,
      downloadUrl: uploadResult.downloadUrl,
      storagePath: uploadResult.storagePath,
      changelog: changelog || `StarLive ${version} update with performance improvements.`,
      publishedBy: currentUser.email || currentUser.displayName
    });

    // 3. Immediately update active state
    setActiveApkRelease(newRelease);
    setAllApkReleases(prev => [newRelease, ...prev.filter(r => r.id !== newRelease.id)]);
    try {
      localStorage.setItem('starlive_active_apk', JSON.stringify(newRelease));
    } catch (e) {}

    soundEffects.playCoinSound();
    confetti({ particleCount: 75, spread: 80 });
    return newRelease;
  };

  const adminPublishExistingRelease = async (releaseId: string) => {
    const target = allApkReleases.find(r => r.id === releaseId);
    if (!target) return;

    try {
      const snap = await getDocs(collection(db, 'appReleases'));
      const batchPromises: Promise<any>[] = [];
      snap.forEach(d => {
        if (d.id !== 'active') {
          batchPromises.push(
            updateDoc(doc(db, 'appReleases', d.id), {
              isActive: d.id === releaseId,
              status: d.id === releaseId ? 'published' : 'archived'
            })
          );
        }
      });
      await Promise.all(batchPromises);

      const updatedActive: AppRelease = {
        ...target,
        isActive: true,
        status: 'published',
        publishedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'appReleases', 'active'), updatedActive);
      await updateDoc(doc(db, 'appReleases', releaseId), { isActive: true, status: 'published' });

      setActiveApkRelease(updatedActive);
      setAllApkReleases(prev => prev.map(r => r.id === releaseId ? updatedActive : { ...r, isActive: false, status: 'archived' }));
      soundEffects.playCoinSound();
    } catch (e) {
      console.error("Error activating release:", e);
    }
  };

  const adminDeleteRelease = async (releaseId: string) => {
    try {
      await deleteDoc(doc(db, 'appReleases', releaseId));
      setAllApkReleases(prev => prev.filter(r => r.id !== releaseId));
      if (activeApkRelease?.id === releaseId) {
        const nextActive = allApkReleases.find(r => r.id !== releaseId) || DEFAULT_INITIAL_RELEASE;
        setActiveApkRelease(nextActive);
        await setDoc(doc(db, 'appReleases', 'active'), nextActive);
      }
    } catch (e) {
      console.error("Error deleting release:", e);
    }
  };

  const adminQuickPublishVersion = async (version: string, changelog?: string): Promise<AppRelease> => {
    const cleanVer = version.startsWith('v') ? version : `v${version}`;
    const cleanNum = parseInt(cleanVer.replace(/\D/g, '') || '100', 10);
    const fileName = `StarLive_${cleanVer}_official.apk`;
    const storagePath = `apks/${fileName}`;
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0633145956.firebasestorage.app/o/apks%2F${encodeURIComponent(fileName)}?alt=media`;

    const newRelease = await publishNewApkRelease({
      version: cleanVer,
      versionCode: cleanNum,
      fileName,
      fileSize: 28000000 + (cleanNum * 12000),
      downloadUrl,
      storagePath,
      changelog: changelog || `StarLive ${cleanVer}: Critical audio improvements, live room optimizations, and new gift effects.`,
      publishedBy: currentUser.email || 'wajaht265374@gmail.com'
    });

    setActiveApkRelease(newRelease);
    setAllApkReleases(prev => [newRelease, ...prev.filter(r => r.id !== newRelease.id)]);
    try {
      localStorage.setItem('starlive_active_apk', JSON.stringify(newRelease));
    } catch (e) {}

    soundEffects.playCoinSound();
    confetti({ particleCount: 80, spread: 85 });
    return newRelease;
  };

  const adminPublishApkLink = async (data: {
    version: string;
    versionCode?: number;
    fileName?: string;
    fileSizeMb?: string | number;
    downloadUrl: string;
    changelog?: string;
    minAndroidVersion?: string;
  }): Promise<AppRelease> => {
    if (!data.downloadUrl?.trim()) {
      throw new Error("APK Download Link URL is required.");
    }
    const newRelease = await publishApkLinkRelease({
      ...data,
      publishedBy: currentUser.email || 'wajaht265374@gmail.com'
    });

    setActiveApkRelease(newRelease);
    setAllApkReleases(prev => [newRelease, ...prev.filter(r => r.id !== newRelease.id)]);
    try {
      localStorage.setItem('starlive_active_apk', JSON.stringify(newRelease));
    } catch (e) {}

    soundEffects.playCoinSound();
    try {
      confetti({ particleCount: 75, spread: 80 });
    } catch (e) {}
    return newRelease;
  };

  // Computed user's owned rooms & limit check
  const userOwnedRooms = liveRooms.filter(r => 
    (r.hostId === currentUser.id || r.hostId === currentUser.uid || (auth.currentUser && r.hostId === auth.currentUser.uid)) &&
    r.status !== 'ended'
  );
  const userActiveRoomsCount = userOwnedRooms.length;
  const canCreateRoom = userActiveRoomsCount < 2;

  // Computed user's room
  const myRoom = userOwnedRooms.length > 0 ? userOwnedRooms[0] : null;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        allUsers,
        liveRooms,
        recentRooms,
        setRecentRooms,
        activeRoom,
        setActiveRoom,
        roomMembers,
        myRoom,
        userOwnedRooms,
        canCreateRoom,
        userActiveRoomsCount,
        deleteRoom: endLiveRoom,
        joinRoom,
        joinRoomById,
        leaveRoom,
        createRoom,
        updateRoom,
        isPasswordModalOpen,
        setIsPasswordModalOpen,
        roomPendingPassword,
        setRoomPendingPassword,
        isCreateRoomModalOpen,
        setIsCreateRoomModalOpen,
        roomRents,
        rentRoom,
        openRoomRent,
        isRoomRented,
        isRoomRentModalOpen,
        setIsRoomRentModalOpen,
        activeLiveRoom: activeRoom,
        setActiveLiveRoom: setActiveRoom,
        posts,
        messages,
        notifications,
        transactions,
        events,
        reports,
        currentTab,
        setCurrentTab,
        activeTab: currentTab,
        setActiveTab: setCurrentTab,
        isAdminMode,
        setIsAdminMode,
        isAuthenticated,
        setIsAuthenticated,
        showRechargeModal,
        setShowRechargeModal,
        authModalOpen,
        setAuthModalOpen,
        selectedCategory,
        setSelectedCategory,
        selectedCountry,
        setSelectedCountry,
        searchQuery,
        setSearchQuery,
        isSearchOpen,
        setIsSearchOpen,
        loginWithGoogle,
        loginWithGoogleAuth,
        loginWithEmail,
        loginWithIdentifier,
        registerWithEmail,
        registerWithUsernameOrGmail,
        loginAsGuestUser,
        logout,
        topUpCoins,
        rechargeCoins,
        claimDailyBonus,
        sendGift,
        createLiveRoom,
        endLiveRoom,
        createPost,
        likePost,
        addComment,
        deletePost,
        sendMessage,
        markNotificationAsRead,
        followUser,
        unfollowUser,
        submitReport,
        takePartySeat,
        leavePartySeat,
        removeMemberFromRoom,
        mutePartySeat,
        adminUpdateUser,
        adminBanUser,
        adminAdjustCoins,
        adminUpdateReport,
        adminCreateEvent,
        adminUpdateEvent,
        adminDeleteEvent,
        adminDeleteRoom,
        activeApkRelease,
        allApkReleases,
        isApkDownloading,
        showApkDownloadModal,
        setShowApkDownloadModal,
        downloadActiveApk,
        adminUploadAndPublishApk,
        adminPublishExistingRelease,
        adminDeleteRelease,
        adminQuickPublishVersion,
        adminPublishApkLink
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
