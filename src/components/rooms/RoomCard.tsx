import React from 'react';
import { LiveRoom } from '../../types';
import { useApp } from '../../context/AppContext';
import { Lock } from 'lucide-react';
import { 
  TreasureChestBadge, 
  SpaceshipBadge, 
  LaurelLevelBadge, 
  SignalBarsBadge, 
  PurpleFloralFrame 
} from './RoomVisualAssets';

interface RoomCardProps {
  room: LiveRoom;
  onJoin?: (room: LiveRoom) => void;
  featured?: boolean;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onJoin }) => {
  const { joinRoom } = useApp();

  const handleCardClick = () => {
    if (onJoin) {
      onJoin(room);
    } else {
      joinRoom(room);
    }
  };

  // Determine chest variant based on hostLevel
  const chestVariant: 'green' | 'red' | 'purple' = 
    room.hostLevel >= 50 ? 'purple' : 
    room.hostLevel >= 25 ? 'red' : 'green';

  // Determine spaceship variant based on hostLevel
  const shipVariant: 'red' | 'gold' | 'blue' = 
    room.hostLevel >= 40 ? 'gold' : 
    room.hostLevel >= 20 ? 'blue' : 'red';

  // Level badge variant
  const levelVariant: 'bronze' | 'gold' | 'blue' = 
    room.hostLevel >= 50 ? 'gold' : 
    room.hostLevel >= 30 ? 'blue' : 'bronze';

  // Decorated ornate purple frame on VIP / featured rooms
  const isDecoratedFrame = room.hostLevel >= 50 || Boolean(room.isRented);

  // Real signal viewer count from room.viewerCount
  const signalCount = Math.max(1, room.viewerCount || 1);

  return (
    <div
      id={`room-card-${room.id}`}
      onClick={handleCardClick}
      className="flex flex-col cursor-pointer select-none overflow-hidden [contain:paint_layout] transform-gpu w-full min-w-0"
      style={{ willChange: 'transform' }}
    >
      {/* 1. Image Container with Fixed 1:1 Aspect Ratio and Reserved Space */}
      <div 
        className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-200 shadow-sm shrink-0"
        style={{ aspectRatio: '1 / 1' }}
      >
        <PurpleFloralFrame isDecorated={isDecoratedFrame}>
          <img 
            src={room.coverImage} 
            alt={room.title}
            className="w-full h-full object-cover object-center block"
            decoding="async"
            draggable={false}
          />

          {/* Ambient subtle vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

          {/* Top-Left: Private lock if applicable */}
          {room.isPrivate && (
            <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 z-10 p-0.5 sm:p-1 rounded-full bg-amber-500/90 text-slate-950 shadow-md">
              <Lock size={11} strokeWidth={3} />
            </div>
          )}

          {/* Top-Right: Laurel Level Badge (9, 60, 38) matching screenshot */}
          <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 z-10 scale-85 sm:scale-100 origin-top-right">
            <LaurelLevelBadge level={room.hostLevel} variant={levelVariant} />
          </div>

          {/* Center-Left: Ornate Jewel Treasure Chest */}
          <div className="absolute top-1/2 -translate-y-1/2 left-1 sm:left-1.5 z-10 scale-80 sm:scale-100 origin-left">
            <TreasureChestBadge variant={chestVariant} size={36} />
          </div>

          {/* Bottom-Left: VIP Spaceship / Jet Fighter */}
          <div className="absolute bottom-1.5 sm:bottom-2 left-1 sm:left-1.5 z-10 scale-80 sm:scale-100 origin-bottom-left">
            <SpaceshipBadge variant={shipVariant} size={36} />
          </div>

          {/* Bottom-Right: Signal Bars & Count (📶 2, 📶 4) */}
          <div className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 z-10 scale-85 sm:scale-100 origin-bottom-right">
            <SignalBarsBadge count={signalCount} />
          </div>
        </PurpleFloralFrame>

      </div>

      {/* 2. Below Image: Country Flag + Title in Clean Dark Text with Fixed Height */}
      <div className="mt-1 sm:mt-1.5 px-0.5 flex items-center gap-1 sm:gap-1.5 min-w-0 h-5 overflow-hidden shrink-0 w-full">
        <span className="text-xs sm:text-sm shrink-0 leading-none">
          {room.countryFlag || '🇵🇰'}
        </span>
        <p className="text-[11px] sm:text-xs font-extrabold text-slate-800 truncate leading-tight flex-1 min-w-0">
          {room.title}
        </p>
      </div>
    </div>
  );
};
