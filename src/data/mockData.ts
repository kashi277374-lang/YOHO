import { LiveRoom, UserProfile, PostMoment, AppEvent, GiftItem, MusicTrack, NotificationItem } from '../types';

export const GIFTS_CATALOG: GiftItem[] = [
  { id: 'g1', name: 'Rose', icon: '🌹', cost: 1, animationType: 'sparkle' },
  { id: 'g2', name: 'Love Heart', icon: '💖', cost: 10, animationType: 'sparkle' },
  { id: 'g3', name: 'Lollipop', icon: '🍭', cost: 50, animationType: 'sparkle' },
  { id: 'g4', name: 'Diamond Ring', icon: '💍', cost: 199, animationType: 'crown' },
  { id: 'g5', name: 'Sports Car', icon: '🏎️', cost: 520, animationType: 'supercar' },
  { id: 'g6', name: 'Space Rocket', icon: '🚀', cost: 1314, animationType: 'rocket' },
  { id: 'g7', name: 'Golden Crown', icon: '👑', cost: 2999, animationType: 'crown' },
  { id: 'g8', name: 'Mystery Chest', icon: '🎁', cost: 5000, animationType: 'chest' }
];

export const INITIAL_EVENTS: AppEvent[] = [
  {
    id: 'evt-1',
    title: 'Recall Friends To Get Coins',
    bannerUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
    dateRange: '15/09 ~ 15/10',
    description: 'Invite previous inactive friends back to StarLive to unlock up to 50,000 free coins & VIP avatar frame!',
    rewardCoins: 50000,
    type: 'referral',
    status: 'active'
  },
  {
    id: 'evt-2',
    title: 'Star Idol PK Championship',
    bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    dateRange: '20/09 ~ 30/09',
    description: 'PK battle between top broadcasters. Top 3 broadcasters win customized supercar entrance animations.',
    rewardCoins: 200000,
    type: 'tournament',
    status: 'active'
  },
  {
    id: 'evt-3',
    title: 'Weekend Voice Carnival',
    bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    dateRange: 'Every Sat & Sun',
    description: 'Join voice party rooms, speak on mic for 10 minutes to collect mystery treasure chests.',
    rewardCoins: 12000,
    type: 'party',
    status: 'active'
  }
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'admin_user',
    uid: 'admin_user_001',
    username: 'StarAdmin',
    displayName: 'StarLive Official Admin',
    email: 'wajaht265374@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    bio: 'Official StarLive Security & Community Operations Lead.',
    country: 'Global',
    countryFlag: '🌐',
    coins: 999999,
    diamonds: 88888,
    level: 99,
    role: 'admin',
    followersCount: 142000,
    followingCount: 12,
    badges: ['Admin', 'Verified', 'VIP Diamond'],
    isVerified: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'user_cherry',
    uid: 'uid_cherry',
    username: 'CherrySinger',
    displayName: 'Cherry 🌸',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    bio: 'Singing competition finalist 🎤 Stream every evening 8PM GMT!',
    country: 'Pakistan',
    countryFlag: '🇵🇰',
    coins: 12500,
    diamonds: 45000,
    level: 60,
    role: 'user',
    followersCount: 89400,
    followingCount: 320,
    badges: ['Top Vocalist', 'PK Star', 'Golden Level 60'],
    isVerified: true,
    createdAt: '2026-02-14'
  },
  {
    id: 'user_malik',
    uid: 'uid_malik',
    username: 'MalikNawab',
    displayName: 'حویلی نواباں دی 🥂',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    bio: 'Party room vibes, good poetry & evening coffee discussions.',
    country: 'Pakistan',
    countryFlag: '🇵🇰',
    coins: 45000,
    diamonds: 92000,
    level: 60,
    role: 'user',
    followersCount: 65200,
    followingCount: 180,
    badges: ['Room King', 'Clan Leader'],
    isVerified: true,
    createdAt: '2026-03-01'
  },
  {
    id: 'user_alizeh',
    uid: 'uid_alizeh',
    username: 'Alizeh_Khan',
    displayName: 'میژه دی چک وازیرستان 🏔️',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    bio: 'Mountain traveler & acoustic melodies. Welcome to my haven!',
    country: 'Pakistan',
    countryFlag: '🇵🇰',
    coins: 8400,
    diamonds: 18400,
    level: 9,
    role: 'user',
    followersCount: 24100,
    followingCount: 95,
    badges: ['Rising Star'],
    isVerified: false,
    createdAt: '2026-04-10'
  },
  {
    id: 'user_fus',
    uid: 'uid_fus',
    username: 'FusFriendship',
    displayName: 'fus & friendship 🎤',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    bio: 'Let’s hang out, tell stories & play lucky dice on mic!',
    country: 'Pakistan',
    countryFlag: '🇵🇰',
    coins: 16800,
    diamonds: 32000,
    level: 38,
    role: 'user',
    followersCount: 41200,
    followingCount: 220,
    badges: ['Party Master', 'Level 38'],
    isVerified: true,
    createdAt: '2026-04-20'
  },
  {
    id: 'user_selin',
    uid: 'uid_selin',
    username: 'SelinIstanbul',
    displayName: 'Selin Yıldız 🌟',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    bio: 'DJ sets, pop remixes & live guitar from Istanbul 🇹🇷',
    country: 'Turkey',
    countryFlag: '🇹🇷',
    coins: 29000,
    diamonds: 67000,
    level: 52,
    role: 'user',
    followersCount: 78900,
    followingCount: 410,
    badges: ['Top Streamer', 'DJ Star'],
    isVerified: true,
    createdAt: '2026-01-15'
  }
];

export const INITIAL_ROOMS: LiveRoom[] = [
  {
    id: 'room-1',
    hostId: 'user_alizeh',
    hostName: 'میژه دی چک وازیرست..',
    hostAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    hostLevel: 9,
    title: 'میژه دی چګ وازیرست..',
    category: 'Popular',
    country: 'Pakistan',
    countryFlag: '🇵🇰',
    viewerCount: 2,
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80',
    status: 'active',
    isParty: false,
    tags: ['Travel', 'Talk', 'Chill'],
    chestLevel: 2,
    vipBadge: '🚀 Stealth Jet',
    likes: 342,
    createdAt: '2026-09-16T10:00:00Z'
  },
  {
    id: 'room-2',
    hostId: 'user_malik',
    hostName: 'حویلی نواباں دی 🍾',
    hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    hostLevel: 60,
    title: '🥂 حویلی نواباں دی 🍾',
    category: 'Popular',
    country: 'Pakistan',
    countryFlag: '🇵🇰',
    viewerCount: 4,
    coverImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    status: 'active',
    isParty: true,
    micSeats: [
      { seatIndex: 0, userId: 'user_malik', userName: 'Malik (Host)', userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80', userLevel: 60, isMuted: false },
      { seatIndex: 1, userId: 'user_fus', userName: 'Fus', userAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80', userLevel: 38, isMuted: false },
      { seatIndex: 2, isLocked: false },
      { seatIndex: 3, isLocked: false },
      { seatIndex: 4, isLocked: false },
      { seatIndex: 5, isLocked: false },
      { seatIndex: 6, isLocked: false },
      { seatIndex: 7, isLocked: false }
    ],
    tags: ['Party', 'Voice', 'VIP'],
    chestLevel: 5,
    vipBadge: '🛸 Supercraft',
    likes: 1250,
    createdAt: '2026-09-16T09:30:00Z'
  },
  {
    id: 'room-3',
    hostId: 'user_cherry',
    hostName: 'PK EVENT 🏆',
    hostAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    hostLevel: 60,
    title: 'PK EVENT',
    category: 'Video/Music',
    country: 'Pakistan',
    countryFlag: '🇵🇰',
    viewerCount: 2,
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    status: 'active',
    isParty: false,
    tags: ['Music', 'Singing', 'PK Match'],
    chestLevel: 4,
    vipBadge: '🏎️ Gold Ferrari',
    likes: 4890,
    createdAt: '2026-09-16T10:15:00Z'
  },
  {
    id: 'room-4',
    hostId: 'user_fus',
    hostName: 'fus & friendship',
    hostAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    hostLevel: 38,
    title: '🎤 fus & friendship',
    category: 'Game',
    country: 'Pakistan',
    countryFlag: '🇵🇰',
    viewerCount: 5,
    coverImage: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80',
    status: 'active',
    isParty: true,
    micSeats: [
      { seatIndex: 0, userId: 'user_fus', userName: 'Fus Host', userAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80', userLevel: 38, isMuted: false },
      { seatIndex: 1, isLocked: false },
      { seatIndex: 2, isLocked: false },
      { seatIndex: 3, isLocked: false }
    ],
    tags: ['Acoustic', 'Dice Game', 'Friends'],
    chestLevel: 3,
    vipBadge: '⚡ Phantom Jet',
    likes: 890,
    createdAt: '2026-09-16T08:00:00Z'
  },
  {
    id: 'room-5',
    hostId: 'user_selin',
    hostName: 'Selin Istanbul',
    hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    hostLevel: 52,
    title: '🎧 Electro Pop & Bosphorus Sunset',
    category: 'Video/Music',
    country: 'Turkey',
    countryFlag: '🇹🇷',
    viewerCount: 140,
    coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
    status: 'active',
    isParty: false,
    tags: ['DJ', 'Music', 'Sunset'],
    chestLevel: 5,
    vipBadge: '👑 Royal Jet',
    likes: 5400,
    createdAt: '2026-09-16T10:30:00Z'
  }
];

export const INITIAL_POSTS: PostMoment[] = [
  {
    id: 'post-1',
    authorId: 'user_cherry',
    authorName: 'Cherry 🌸',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    authorLevel: 60,
    countryFlag: '🇵🇰',
    content: 'Thank you everyone who sent gifts in yesterday’s PK battle! We reached Top 1 in the singing competition! 💖👑 Love you all so much!',
    mediaUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    likesCount: 542,
    likedBy: [],
    commentsCount: 38,
    comments: [
      { id: 'c1', authorId: 'user_malik', authorName: 'Malik Nawab', authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80', text: 'Well deserved champion! 🔥', createdAt: '1 hour ago' },
      { id: 'c2', authorId: 'user_fus', authorName: 'Fus', authorAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80', text: 'You sang amazingly! Keep shining ✨', createdAt: '30 mins ago' }
    ],
    tags: ['PKBattle', 'SingingCompetition', 'Grateful'],
    createdAt: '2 hours ago'
  },
  {
    id: 'post-2',
    authorId: 'user_alizeh',
    authorName: 'میژه دی چک وازیرستان 🏔️',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    authorLevel: 9,
    countryFlag: '🇵🇰',
    content: 'Crisp mountain breeze and endless green valleys today. Catching this vibe live right now on StarLive! Join the room 🌿🕊️',
    mediaUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
    likesCount: 310,
    likedBy: [],
    commentsCount: 19,
    comments: [],
    tags: ['Nature', 'Waziristan', 'LiveStream'],
    createdAt: '4 hours ago'
  },
  {
    id: 'post-3',
    authorId: 'user_selin',
    authorName: 'Selin Yıldız 🌟',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    authorLevel: 52,
    countryFlag: '🇹🇷',
    content: 'Testing new synthesizers for our weekend live party! What songs do you want to hear tonight? Drop recommendations below 🎶',
    mediaUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80',
    likesCount: 420,
    likedBy: [],
    commentsCount: 45,
    comments: [],
    tags: ['DJLife', 'SynthWave', 'PartyMusic'],
    createdAt: '6 hours ago'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    userId: 'current_user',
    type: 'gift',
    title: 'Received Gift!',
    message: 'Cherry 🌸 sent you a Rose 🌹 (+1 Diamond)',
    senderId: 'user_cherry',
    senderName: 'Cherry 🌸',
    senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    isRead: false,
    createdAt: '10m ago'
  },
  {
    id: 'n2',
    userId: 'current_user',
    type: 'follow',
    title: 'New Follower',
    message: 'حویلی نواباں دی started following you!',
    senderId: 'user_malik',
    senderName: 'حویلی نواباں دی 🥂',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    isRead: false,
    createdAt: '1h ago'
  },
  {
    id: 'n3',
    userId: 'current_user',
    type: 'system',
    title: 'Event Bonus 🎁',
    message: 'You received 500 free coins from the Daily Check-in reward!',
    isRead: true,
    createdAt: '3h ago'
  }
];

export const MUSIC_TRACKS: MusicTrack[] = [
  { id: 'm1', title: 'Summer Breeze Acoustic', artist: 'StarLive Studio', duration: '2:45', url: '' },
  { id: 'm2', title: 'Party Beat Drop 128BPM', artist: 'DJ Selin', duration: '3:20', url: '' },
  { id: 'm3', title: 'Late Night Chill Hop', artist: 'LoFi Beats', duration: '2:15', url: '' },
  { id: 'm4', title: 'Festival Anthem PK', artist: 'Arena Star', duration: '3:05', url: '' }
];
