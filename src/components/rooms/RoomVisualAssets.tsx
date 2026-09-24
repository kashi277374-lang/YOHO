import React from 'react';

// Ornate Treasure Chest Badge (Green, Red, Purple with gold trim)
export const TreasureChestBadge: React.FC<{ variant?: 'green' | 'red' | 'purple'; size?: number }> = ({ 
  variant = 'green',
  size = 40
}) => {
  const getColors = () => {
    switch (variant) {
      case 'red':
        return {
          base: '#991b1b',
          glow: '#ef4444',
          highlight: '#f87171',
          lid: '#b91c1c',
          gem: '#fca5a5'
        };
      case 'purple':
        return {
          base: '#6b21a8',
          glow: '#a855f7',
          highlight: '#c084fc',
          lid: '#7e22ce',
          gem: '#f3e8ff'
        };
      case 'green':
      default:
        return {
          base: '#065f46',
          glow: '#10b981',
          highlight: '#34d399',
          lid: '#047857',
          gem: '#a7f3d0'
        };
    }
  };

  const c = getColors();

  return (
    <div 
      className="relative drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] active:scale-95 transition-transform cursor-pointer"
      title="Mystery Treasure Chest"
      style={{ width: size, height: size * 0.85 }}
    >
      <svg viewBox="0 0 64 54" className="w-full h-full overflow-visible">
        <defs>
          {/* Gold metallic gradient */}
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#eab308" />
            <stop offset="70%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>

          {/* Chest Body gradient */}
          <linearGradient id={`chestBody-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={c.highlight} />
            <stop offset="40%" stopColor={c.lid} />
            <stop offset="100%" stopColor={c.base} />
          </linearGradient>

          {/* Gold Rim */}
          <linearGradient id="goldRim" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#713f12" />
          </linearGradient>
        </defs>

        {/* Outer Chest Shadow */}
        <ellipse cx="32" cy="50" rx="26" ry="4" fill="rgba(0,0,0,0.4)" />

        {/* Chest Lower Box */}
        <path 
          d="M 6 22 L 58 22 L 54 48 C 54 50 51 51 48 51 L 16 51 C 13 51 10 50 10 48 Z" 
          fill={`url(#chestBody-${variant})`} 
          stroke="#713f12" 
          strokeWidth="1.5"
        />

        {/* Chest Lid Domed */}
        <path 
          d="M 4 21 C 4 11 16 5 32 5 C 48 5 60 11 60 21 Z" 
          fill={`url(#chestBody-${variant})`} 
          stroke="url(#goldRim)" 
          strokeWidth="2"
        />

        {/* Gold Metal Reinforcing Straps */}
        <path d="M 16 7 L 16 50" stroke="url(#goldGrad)" strokeWidth="4" strokeLinecap="round" />
        <path d="M 48 7 L 48 50" stroke="url(#goldGrad)" strokeWidth="4" strokeLinecap="round" />
        <path d="M 5 21 L 59 21" stroke="url(#goldGrad)" strokeWidth="3.5" />

        {/* Gold rivets/studs */}
        <circle cx="16" cy="11" r="1.5" fill="#fef08a" />
        <circle cx="16" cy="27" r="1.5" fill="#fef08a" />
        <circle cx="16" cy="42" r="1.5" fill="#fef08a" />
        <circle cx="48" cy="11" r="1.5" fill="#fef08a" />
        <circle cx="48" cy="27" r="1.5" fill="#fef08a" />
        <circle cx="48" cy="42" r="1.5" fill="#fef08a" />

        {/* Center Golden Lock Plate */}
        <rect x="26" y="18" width="12" height="12" rx="2.5" fill="url(#goldGrad)" stroke="#713f12" strokeWidth="1" />
        
        {/* Center Glowing Gem */}
        <circle cx="32" cy="24" r="3" fill={c.gem} stroke="#fff" strokeWidth="1" />
        <circle cx="31" cy="23" r="1" fill="#fff" />
      </svg>
    </div>
  );
};

// VIP Spaceship / Jet Fighter Badge (Red, Gold, Blue)
export const SpaceshipBadge: React.FC<{ variant?: 'red' | 'gold' | 'blue'; size?: number }> = ({ 
  variant = 'red',
  size = 40
}) => {
  const getShipColors = () => {
    switch (variant) {
      case 'gold':
        return {
          primary: '#eab308',
          accent: '#fef08a',
          thruster: '#f97316',
          body: '#ca8a04',
          dark: '#713f12'
        };
      case 'blue':
        return {
          primary: '#2563eb',
          accent: '#60a5fa',
          thruster: '#38bdf8',
          body: '#1d4ed8',
          dark: '#1e3a8a'
        };
      case 'red':
      default:
        return {
          primary: '#dc2626',
          accent: '#f87171',
          thruster: '#f59e0b',
          body: '#b91c1c',
          dark: '#7f1d1d'
        };
    }
  };

  const sc = getShipColors();

  return (
    <div 
      className="relative drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] active:scale-95 transition-transform"
      title="VIP Spaceship Fleet"
      style={{ width: size, height: size * 0.9 }}
    >
      <svg viewBox="0 0 60 54" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id={`shipBody-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={sc.accent} />
            <stop offset="50%" stopColor={sc.primary} />
            <stop offset="100%" stopColor={sc.dark} />
          </linearGradient>

          <linearGradient id="thrusterFire" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor={sc.thruster} />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        {/* Thruster Flames */}
        <polygon points="25,44 30,53 35,44" fill="url(#thrusterFire)" />
        <polygon points="17,40 20,49 23,40" fill="url(#thrusterFire)" />
        <polygon points="37,40 40,49 43,40" fill="url(#thrusterFire)" />

        {/* Left Swept Wing */}
        <polygon 
          points="20,24 2,42 16,42 22,34" 
          fill={`url(#shipBody-${variant})`} 
          stroke={sc.accent} 
          strokeWidth="1"
        />

        {/* Right Swept Wing */}
        <polygon 
          points="40,24 58,42 44,42 38,34" 
          fill={`url(#shipBody-${variant})`} 
          stroke={sc.accent} 
          strokeWidth="1"
        />

        {/* Center Fuselage */}
        <polygon 
          points="30,4 38,24 35,44 25,44 22,24" 
          fill={`url(#shipBody-${variant})`} 
          stroke="#fff" 
          strokeWidth="1" 
        />

        {/* Cockpit Canopy */}
        <polygon points="30,12 34,22 30,28 26,22" fill="#67e8f9" stroke="#fff" strokeWidth="0.8" />
        <line x1="30" y1="12" x2="30" y2="28" stroke="#fff" strokeWidth="0.8" />

        {/* Wing Tip Cannons / Lights */}
        <circle cx="3" cy="42" r="1.5" fill="#fef08a" />
        <circle cx="57" cy="42" r="1.5" fill="#fef08a" />
      </svg>
    </div>
  );
};

// Laurel Level Shield Badge (Bronze 9, Gold 60, Blue 38)
export const LaurelLevelBadge: React.FC<{ level: number; variant?: 'bronze' | 'gold' | 'blue' }> = ({ 
  level, 
  variant 
}) => {
  // Auto detect variant based on level if not explicitly provided
  const v = variant || (level >= 50 ? 'gold' : level >= 20 ? 'blue' : 'bronze');

  const getStyle = () => {
    switch (v) {
      case 'gold':
        return {
          bg: 'from-amber-400 via-yellow-400 to-amber-600',
          border: 'border-yellow-200',
          text: 'text-amber-950',
          shadow: 'shadow-[0_2px_8px_rgba(234,179,8,0.5)]',
          ribbon: 'bg-amber-600'
        };
      case 'blue':
        return {
          bg: 'from-blue-400 via-sky-400 to-indigo-600',
          border: 'border-sky-200',
          text: 'text-white',
          shadow: 'shadow-[0_2px_8px_rgba(59,130,246,0.5)]',
          ribbon: 'bg-blue-600'
        };
      case 'bronze':
      default:
        return {
          bg: 'from-amber-700 via-amber-800 to-amber-950',
          border: 'border-amber-500/50',
          text: 'text-amber-100',
          shadow: 'shadow-[0_2px_8px_rgba(146,64,14,0.4)]',
          ribbon: 'bg-amber-900'
        };
    }
  };

  const s = getStyle();

  return (
    <div className={`relative flex items-center justify-center px-2 py-0.5 min-w-[28px] h-6 rounded-md bg-gradient-to-b ${s.bg} border ${s.border} ${s.shadow}`}>
      {/* Crown / Star Notch on top */}
      <span className={`text-[12px] font-black ${s.text} font-mono leading-none tracking-tight`}>
        {level}
      </span>
      {/* Tiny corner ribbons */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-1 bg-amber-500/80 rounded-b-sm" />
    </div>
  );
};

// Signal Bars Indicator Badge (📶 2, 📶 4, 📶 5)
export const SignalBarsBadge: React.FC<{ count: number }> = ({ count }) => {
  return (
    <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-white text-[11px] font-bold border border-white/10 shadow-sm">
      <div className="flex items-end gap-0.5 h-3">
        <span className="w-0.5 h-1.5 bg-white rounded-full" />
        <span className="w-0.5 h-2.5 bg-white rounded-full" />
        <span className="w-0.5 h-3 bg-white rounded-full" />
      </div>
      <span className="text-white font-black text-xs">{count}</span>
    </div>
  );
};

// Ornate Purple Crystal VIP Floral Frame
export const PurpleFloralFrame: React.FC<{ children: React.ReactNode; isDecorated?: boolean }> = ({ 
  children, 
  isDecorated = false 
}) => {
  if (!isDecorated) {
    return <div className="relative w-full h-full rounded-2xl overflow-hidden">{children}</div>;
  }

  return (
    <div className="relative w-full h-full rounded-2xl p-[3px] bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-600 shadow-[0_0_15px_rgba(192,132,252,0.4)]">
      {/* Golden Corner brackets */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-300 rounded-tl-xl z-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow-300 rounded-tr-xl z-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-300 rounded-bl-xl z-20 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-300 rounded-br-xl z-20 pointer-events-none" />

      {/* Inner Rounded Content */}
      <div className="w-full h-full rounded-[14px] overflow-hidden relative">
        {children}
      </div>
    </div>
  );
};
