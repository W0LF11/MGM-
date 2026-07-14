import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Play, Lock, ShieldAlert, X } from 'lucide-react';
import { InteractiveGameBoxVisual } from './InteractiveGameBoxVisual';

interface Game {
  id: string;
  name: string;
  description: string;
  rtp: number;
  isLocked?: boolean;
  lockReason?: string;
}

interface GameCardProps {
  game: Game;
  themeInfo: {
    bg: string;
    tag: string;
    emoji: string;
    subtitle: string;
    tagline: string;
    borderGlow: string;
    badgeStyle: string;
  };
  currentPlayersCount: number;
  onPlayGame: (gameId: string) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, themeInfo, currentPlayersCount, onPlayGame }) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [showLockModal, setShowLockModal] = useState(false);
  
  // High-fidelity Scroll-driven Entry Reveal Animation using useScroll and useTransform
  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ["start end", "center center"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const slideY = useTransform(scrollYProgress, [0, 0.5], [40, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.93, 1]);

  // Spotlight and Tilt coordinates
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCoords({ x, y });

    // Calculate 3D tilt angles (capped at 8 degrees for clean aesthetics)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rx = ((y - centerY) / centerY) * -8; // Pitch
    const ry = ((x - centerX) / centerX) * 8;   // Yaw

    setTilt({ rx, ry });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rx: 0, ry: 0 });
  };

  const handleCardClick = () => {
    if (game.isLocked) {
      setShowLockModal(true);
    } else {
      onPlayGame(game.id);
    }
  };

  return (
    <>
      <motion.div
        ref={outerRef}
        style={{
          opacity,
          y: slideY,
          scale,
        }}
        className="w-full h-full"
      >
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleCardClick}
          style={{
            transformStyle: 'preserve-3d',
            transform: isHovered 
              ? `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(1.04)`
              : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
          }}
          transition={{ type: "spring", damping: 18, stiffness: 220 }}
          className={`relative rounded-[2.2rem] overflow-hidden glass p-2 flex flex-col justify-between min-h-[250px] group border ${
            game.isLocked 
              ? 'border-amber-500/20 hover:shadow-[0_0_22px_rgba(245,158,11,0.25)]' 
              : themeInfo.borderGlow
          } transition-shadow duration-300 cursor-pointer h-full`}
          id={`game-card-${game.id}`}
        >
          {/* 1. Dynamic Mouse Spotlight Glow Layer (Stripe-Style High-Fidelity highlight) */}
          {isHovered && (
            <div
              className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-300"
              style={{
                background: game.isLocked
                  ? `radial-gradient(circle 120px at ${coords.x}px ${coords.y}px, rgba(245, 158, 11, 0.12), transparent 70%)`
                  : `radial-gradient(circle 120px at ${coords.x}px ${coords.y}px, rgba(255, 255, 255, 0.18), transparent 70%)`,
              }}
            />
          )}

          {/* 2. Glass Sweep Flare Effect on Hover */}
          <div 
            className="absolute inset-0 pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden"
          >
            <div 
              className="w-[150%] h-[150%] absolute -top-[25%] -left-[50%] bg-gradient-to-r from-transparent via-white/5 to-transparent -rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"
            />
          </div>

          {/* 3. Colored Card Inner Cover */}
          <div 
            className={`p-5 rounded-[1.85rem] flex-1 flex flex-col justify-between bg-gradient-to-br ${
              game.isLocked ? 'from-slate-800 via-slate-900 to-amber-950/40 text-slate-300' : themeInfo.bg
            } relative overflow-hidden`} 
            style={{ transform: 'translateZ(10px)' }}
          >
            {/* Visual grid highlight in background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_75%)] pointer-events-none" />
            
            {/* High-fidelity custom live canvas animation for each slot/game box */}
            <InteractiveGameBoxVisual gameId={game.id} />

            {/* Card Header */}
            <div className="flex justify-between items-center relative z-10">
              <span className="text-3xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.18)] transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                {game.isLocked ? '🔒' : themeInfo.emoji}
              </span>

              {game.isLocked && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[9px] font-black uppercase tracking-widest font-mono">
                  VIP Restricted
                </span>
              )}
            </div>

            {/* Card Info */}
            <div className="mt-5 relative z-10 space-y-1.5">
              <div className="flex items-center gap-1.5 bg-black/15 backdrop-blur-xs py-0.5 px-2 rounded-full w-fit">
                <span className={`h-1.5 w-1.5 rounded-full ${game.isLocked ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}`} />
                <span className={`text-[10px] font-mono font-bold tracking-wide ${game.isLocked ? 'text-amber-300' : 'text-emerald-300'}`}>
                  {game.isLocked ? 'VIP Lounge Access' : `${currentPlayersCount} active players`}
                </span>
              </div>

              <div>
                <h4 className="font-black text-lg tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] flex items-center gap-1.5">
                  {game.name}
                </h4>
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block font-mono">
                  {themeInfo.subtitle}
                </span>
                <p className="text-[10px] text-white/90 line-clamp-2 mt-1 leading-relaxed">
                  {game.isLocked ? 'This system has been reserved for authorized VIP VIP lounge accounts only. Tap to view requirements.' : themeInfo.tagline}
                </p>
              </div>
            </div>
          </div>

          {/* 4. Bottom Actions Control Panel */}
          <div className="p-3 flex justify-between items-center text-xs relative z-10" style={{ transform: 'translateZ(15px)' }}>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider font-bold">RTP RATE</span>
              <span className="font-mono text-emerald-500 font-black dark:text-emerald-400 text-xs">
                {game.rtp}%
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className={`px-4 py-2 text-white rounded-xl font-black text-[10px] tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-lg ${
                game.isLocked 
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/10' 
                  : 'bg-slate-900 hover:bg-emerald-500 dark:bg-white dark:hover:bg-emerald-500 dark:text-slate-950 dark:hover:text-white shadow-emerald-500/10'
              }`}
              id={`home-play-${game.id}`}
            >
              {game.isLocked ? (
                <>
                  <Lock className="h-3 w-3" /> LOCKED
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-current" /> PLAY NOW
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* 5. Custom executive VIP lock requirements popup details modal overlay */}
      <AnimatePresence>
        {showLockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLockModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md rounded-3xl border border-slate-200/20 dark:border-white/10 bg-slate-900/90 text-white p-6 shadow-2xl overflow-hidden z-10"
            >
              {/* Decorative side spotlight ambient gradient glowing blur background */}
              <div className="absolute top-0 right-0 h-40 w-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-10 -bottom-10 h-40 w-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Header */}
              <div className="flex justify-between items-start border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                    <ShieldAlert className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-sm uppercase tracking-wider font-mono text-amber-400">
                      SYSTEM RESTRICTED
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      VIP Lounge Clearance required
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowLockModal(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body message content */}
              <div className="space-y-4 py-2 relative z-10">
                <div className="space-y-2">
                  <h4 className="text-xl font-black text-white leading-tight">
                    {game.name} is reserved for VIP members
                  </h4>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block tracking-wider">
                      ADMINISTRATOR NOTICE:
                    </span>
                    <p className="text-xs text-amber-200 font-medium leading-relaxed">
                      {game.lockReason && game.lockReason.trim() !== '' 
                        ? game.lockReason 
                        : "it is only access for only vip player for now"
                      }
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-white/5 space-y-1">
                  <p>🔓 <strong className="text-white">Active Games:</strong> Dice game, lucky number and spin wheel remain fully unlocked for everyone.</p>
                  <p>👑 <strong className="text-white font-mono">Vip upgrade:</strong> Contact administrator via live support center to level up account credentials.</p>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-6">
                <button
                  onClick={() => setShowLockModal(false)}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
