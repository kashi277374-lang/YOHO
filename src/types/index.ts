export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  uid: string;
  username: string;
  displayName: string;
  email?: string;
  avatar: string;
  bio: string;
  country: string;
  countryFlag: string;
  coins: number;
  diamonds: number;
  level: number;
  role: UserRole;
  followersCount: number;
  followingCount: number;
  isLive?: boolean;
  currentRoomId?: string;
  badges: string[];
  isBanned?: boolean;
  isVerified?: boolean;
  vipStatus?: string;
  createdAt: string;
}

export interface MicSeat {
  seatIndex: number;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  userLevel?: number;
  isMuted?: boolean;
  isLocked?: boolean;
}

export interface RoomMember {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userLevel: number;
  role: 'owner' | 'admin' | 'member';
  isMuted?: boolean;
  joinedAt: string;
  lastSeen?: number;
}

export interface LiveRoom {
  id: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  hostLevel: number;
  title: string;
  category: string;
  country: string;
  countryFlag: string;
  viewerCount: number;
  coverImage: string;
  backgroundTheme?: string;
  announcement?: string;
  status: 'active' | 'ended';
  isParty: boolean;
  isPrivate?: boolean;
  password?: string;
  micSeats?: MicSeat[];
  tags: string[];
  chestLevel?: number;
  vipBadge?: string;
  likes?: number;
  currentMusic?: string;
  members?: RoomMember[];
  isRented?: boolean;
  rentExpiresAt?: string;
  createdAt: string;
}

export interface RoomRent {
  id: string;
  roomId: string;
  roomTitle: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rentType: 'daily' | 'weekly' | 'monthly' | 'vip';
  rentPrice: number;
  status: 'active' | 'expired' | 'pending';
  startDate: string;
  expiresDate: string;
  createdAt: string;
}

export interface CommentItem {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
}

export interface PostMoment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorLevel?: number;
  countryFlag?: string;
  content: string;
  mediaUrl?: string;
  likesCount: number;
  likedBy: string[];
  commentsCount: number;
  comments: CommentItem[];
  tags: string[];
  createdAt: string;
}

export interface GiftItem {
  id: string;
  name: string;
  icon: string;
  cost: number;
  animationType: 'sparkle' | 'rocket' | 'supercar' | 'crown' | 'chest';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderLevel?: number;
  receiverId?: string;
  roomId?: string;
  content: string;
  type?: 'text' | 'gift' | 'system' | 'join';
  gift?: GiftItem;
  createdAt: string;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  type: 'recharge' | 'gift_sent' | 'gift_received' | 'reward' | 'daily_checkin';
  amount: number;
  description: string;
  relatedUser?: string;
  createdAt: string;
}

export interface AppEvent {
  id: string;
  title: string;
  bannerUrl: string;
  dateRange: string;
  description: string;
  rewardCoins: number;
  type: string;
  status: 'active' | 'upcoming' | 'ended';
}

export interface UserReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'user' | 'room' | 'post';
  targetId: string;
  targetName: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'gift' | 'follow' | 'system' | 'room_invite';
  title: string;
  message: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  isRead: boolean;
  createdAt: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  url: string;
}

export interface AppRelease {
  id: string;
  version: string; // e.g. "v1.2.0"
  versionCode: number; // e.g. 10200
  fileName: string; // e.g. "StarLive_v1.2.0.apk"
  fileSize: number; // bytes
  downloadUrl: string; // Permanent Firebase Storage URL
  storagePath: string; // e.g. "apks/StarLive_v1.2.0_1726567890.apk"
  changelog?: string;
  publishedAt: string;
  publishedBy?: string;
  isActive: boolean;
  downloadsCount: number;
  status: 'published' | 'draft' | 'archived';
  minAndroidVersion?: string;
  sha256?: string;
}

export type NavigationTab = 'discover' | 'live' | 'party' | 'moments' | 'message' | 'mine';

export interface WebRTCSignal {
  id: string;
  roomId: string;
  fromUserId: string;
  fromUserName?: string;
  toUserId: string; // target userId or 'all'
  type: 'offer' | 'answer' | 'candidate' | 'join' | 'join-ack' | 'leave' | 'mute' | 'renegotiate' | 'ping';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  isMuted?: boolean;
  timestamp: number;
  createdAt?: string;
}

export type AudioConnectionState = 'idle' | 'requesting-permission' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';
