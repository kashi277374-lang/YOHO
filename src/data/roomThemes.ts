export interface RoomTheme {
  id: string;
  name: string;
  tag: string;
  category: string;
  coverImage: string;
  backgroundImage: string;
  gradientOverlay: string;
  accentColor: string;
  description: string;
}

export const ROOM_THEMES: RoomTheme[] = [
  {
    id: 'cyber-neon',
    name: 'Cyber Neon Lounge',
    tag: 'Popular',
    category: 'Popular',
    coverImage: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80',
    backgroundImage: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1600&auto=format&fit=crop&q=80',
    gradientOverlay: 'from-purple-950/90 via-slate-950/80 to-purple-900/90',
    accentColor: '#ec4899',
    description: 'Electric neon aesthetics with futuristic cyber city skyline'
  },
  {
    id: 'golden-luxury',
    name: 'Royal VIP Palace',
    tag: 'VIP Club',
    category: 'Party',
    coverImage: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=800&auto=format&fit=crop&q=80',
    backgroundImage: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=1600&auto=format&fit=crop&q=80',
    gradientOverlay: 'from-amber-950/90 via-slate-950/80 to-yellow-950/90',
    accentColor: '#f59e0b',
    description: 'Gilded palace hall with chandeliers and gold bullion trim'
  },
  {
    id: 'galaxy-stars',
    name: 'Galaxy Starlight',
    tag: 'Chill',
    category: 'Video/Music',
    coverImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
    backgroundImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
    gradientOverlay: 'from-blue-950/90 via-indigo-950/80 to-slate-950/90',
    accentColor: '#38bdf8',
    description: 'Cosmic nebula with swirling starry constellations and deep space glow'
  },
  {
    id: 'edm-arena',
    name: 'Festival EDM Arena',
    tag: 'PK Match',
    category: 'PK Event',
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    backgroundImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1600&auto=format&fit=crop&q=80',
    gradientOverlay: 'from-rose-950/90 via-slate-950/80 to-red-950/90',
    accentColor: '#f43f5e',
    description: 'Electrifying mainstage lasers, sub-bass pyrotechnics and crowd energy'
  },
  {
    id: 'sunset-chill',
    name: 'Sunset Acoustic Cafe',
    tag: 'Acoustic',
    category: 'Video/Music',
    coverImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80',
    backgroundImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1600&auto=format&fit=crop&q=80',
    gradientOverlay: 'from-orange-950/90 via-slate-950/80 to-amber-950/90',
    accentColor: '#fb923c',
    description: 'Golden hour warmth, wooden deck overlooking sun-drenched horizon'
  },
  {
    id: 'gaming-battle',
    name: 'Gaming Cyber Zone',
    tag: 'Gaming',
    category: 'Game',
    coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    backgroundImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&auto=format&fit=crop&q=80',
    gradientOverlay: 'from-emerald-950/90 via-slate-950/80 to-teal-950/90',
    accentColor: '#10b981',
    description: 'High-octane esports gaming arena with RGB backlights and leaderboard displays'
  },
  {
    id: 'velvet-night',
    name: 'Velvet Midnight Lounge',
    tag: 'Voice Chat',
    category: 'Party',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    backgroundImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80',
    gradientOverlay: 'from-purple-950/90 via-slate-950/80 to-slate-900/90',
    accentColor: '#a855f7',
    description: 'Intimate velvet banquet with soft candlelight and low-lit jazz ambience'
  },
  {
    id: 'ocean-drift',
    name: 'Ocean Drift Oasis',
    tag: 'Relaxing',
    category: 'Popular',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    backgroundImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80',
    gradientOverlay: 'from-cyan-950/90 via-slate-950/80 to-blue-950/90',
    accentColor: '#06b6d4',
    description: 'Tropical shoreline with gentle turquoise waves and breezy palm trees'
  }
];
