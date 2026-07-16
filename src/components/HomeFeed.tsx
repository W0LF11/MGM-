import React, { useState, useEffect } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { motion, AnimatePresence } from 'motion/react';
import { GamingDustBackground } from './GamingDustBackground';
import { GameCard } from './GameCard';
import { LiveWinsStream } from './LiveWinsStream';
import { 
  LayoutDashboard, 
  Receipt, 
  PlusCircle, 
  CheckCircle2, 
  Play, 
  Sparkles, 
  ChevronRight, 
  Gamepad2, 
  Trophy, 
  Coins, 
  Clock,
  Zap,
  Activity,
  TrendingUp,
  Flame,
  Users
} from 'lucide-react';

interface HomeFeedProps {
  onNavigate: (tab: string, subTab?: string) => void;
  onPlayGame: (gameId: string) => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({ onNavigate, onPlayGame }) => {
  const { games, currentUser } = usePlatform();
  const [luckyNumber, setLuckyNumber] = useState<number>(68);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Real Live-Updating Gambling progressive jackpot ticker
  const [jackpot, setJackpot] = useState<number>(128452.80);

  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1100);
    return () => clearTimeout(loadingTimer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setJackpot(prev => prev + Math.random() * 0.18);
    }, 150);
    return () => clearInterval(timer);
  }, []);

  // Dynamic Lucky Number Wheel effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSpinning(true);
      
      // Roll random numbers before stopping
      let count = 0;
      const rollInterval = setInterval(() => {
        setLuckyNumber(Math.floor(Math.random() * 90) + 10);
        count++;
        if (count > 8) {
          clearInterval(rollInterval);
          setIsSpinning(false);
        }
      }, 100);

    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const [activePlayers, setActivePlayers] = useState<Record<string, number>>({
    dice: 27415,
    lucky_number: 19842,
    spin_wheel: 23150,
    coin_flip: 18452,
    color_match: 21915,
    lucky_seven: 24219,
    card_clash: 18534,
    treasure_box: 20112,
    puzzle_arena: 18150,
    quiz_battle: 19520,
    number_rush: 18942,
    fortune_draw: 22105,
  });

  // Simulating live active slots and spinner counts ticking up/down around 18k-25k and 25k+ for dice
  useEffect(() => {
    const timer = setInterval(() => {
      setActivePlayers(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          const delta = Math.floor(Math.random() * 41) - 20; // -20 to +20
          if (key === 'dice') {
            next[key] = Math.max(25100, (next[key] || 27000) + delta);
          } else {
            next[key] = Math.max(18000, Math.min(25000, (next[key] || 21000) + delta));
          }
        });
        return next;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const customGameThemes: Record<string, { 
    bg: string; 
    tag: string; 
    emoji: string; 
    subtitle: string; 
    tagline: string;
    borderGlow: string;
    badgeStyle: string;
  }> = {
    dice: { 
      bg: 'from-violet-700 via-indigo-800 to-indigo-950 text-white', 
      tag: 'MULTIPLIER', 
      emoji: '🎲', 
      subtitle: 'Quantum Roller', 
      tagline: 'Predict results for up to 10x jackpot payout.',
      borderGlow: 'hover:shadow-[0_0_22px_rgba(139,92,246,0.4)] border-violet-500/30',
      badgeStyle: 'bg-violet-500/35 text-violet-100 border border-violet-400/30'
    },
    lucky_number: { 
      bg: 'from-indigo-600 via-blue-700 to-blue-900 text-white', 
      tag: 'PREMIUM', 
      emoji: '🔮', 
      subtitle: 'Oracle Predictor', 
      tagline: 'Elite Predictions with high precision odds.',
      borderGlow: 'hover:shadow-[0_0_22px_rgba(59,130,246,0.4)] border-indigo-500/30',
      badgeStyle: 'bg-indigo-500/35 text-indigo-100 border border-indigo-400/30'
    },
    spin_wheel: { 
      bg: 'from-rose-600 via-red-700 to-red-950 text-white', 
      tag: 'HOT 🔥', 
      emoji: '🎡', 
      subtitle: 'Fortune Cyclone', 
      tagline: 'Spin the grand wheel for live prize drops.',
      borderGlow: 'hover:shadow-[0_0_22px_rgba(244,63,94,0.4)] border-rose-500/30',
      badgeStyle: 'bg-rose-500/35 text-rose-100 border border-rose-400/30 animate-pulse'
    },
    coin_flip: { 
      bg: 'from-emerald-600 via-teal-700 to-slate-900 text-white', 
      tag: 'SPEEDY ⚡', 
      emoji: '🪙', 
      subtitle: 'Stellar Blitz', 
      tagline: 'Double your currency instantly on active 50/50 flips.',
      borderGlow: 'hover:shadow-[0_0_22px_rgba(16,185,129,0.4)] border-emerald-500/30',
      badgeStyle: 'bg-emerald-500/35 text-emerald-100 border border-emerald-400/30'
    },
    color_match: { 
      bg: 'from-amber-500 via-orange-600 to-amber-950 text-white', 
      tag: 'CHROMA PRISM', 
      emoji: '🎨', 
      subtitle: 'Spectrum Clash', 
      tagline: 'Align ring colors to trigger explosive multipliers.',
      borderGlow: 'hover:shadow-[0_0_22px_rgba(245,158,11,0.4)] border-amber-500/30',
      badgeStyle: 'bg-amber-500/35 text-amber-100 border border-amber-400/30'
    },
    lucky_seven: { 
      bg: 'from-pink-600 via-rose-600 to-rose-950 text-white', 
      tag: 'JACKPOT 🎰', 
      emoji: '🎰', 
      subtitle: 'Vegas Classic', 
      tagline: 'Roll a lucky 7 or triple combos to clear the vault.',
      borderGlow: 'hover:shadow-[0_0_22px_rgba(236,72,153,0.4)] border-pink-500/30',
      badgeStyle: 'bg-pink-500/35 text-pink-100 border border-pink-400/30 animate-bounce'
    },
    card_clash: { 
      bg: 'from-sky-600 via-blue-700 to-slate-900 text-white', 
      tag: 'ROYAL DUEL', 
      emoji: '🃏', 
      subtitle: 'Casino Duel', 
      tagline: 'Face off against the dealer for x2.5 payout.',
      borderGlow: 'hover:shadow-[0_0_22px_rgba(14,165,233,0.4)] border-sky-500/30',
      badgeStyle: 'bg-sky-500/35 text-sky-100 border border-sky-400/30'
    },
    treasure_box: { 
      bg: 'from-purple-600 via-fuchsia-700 to-purple-950 text-white', 
      tag: 'VAULT RAIDER', 
      emoji: '📦', 
      subtitle: 'Minefield Mystery', 
      tagline: 'Unlock locked chests to win compounding bonuses.',
      borderGlow: 'hover:shadow-[0_0_22px_rgba(168,85,247,0.4)] border-purple-500/30',
      badgeStyle: 'bg-purple-500/35 text-purple-100 border border-purple-400/30'
    },
    puzzle_arena: { 
      bg: 'from-indigo-600 via-violet-700 to-slate-900 text-white', 
      tag: 'BRAIN CHAMPION', 
      emoji: '🧩', 
      subtitle: 'Chrono Puzzle', 
      tagline: 'Slide cosmic fragments to realign space-time geometry.',
      borderGlow: 'hover:shadow-[0_0_22px_rgba(109,40,217,0.4)] border-indigo-500/30',
      badgeStyle: 'bg-indigo-500/35 text-indigo-100 border border-indigo-400/30'
    },
    quiz_battle: { 
      bg: 'from-cyan-600 via-teal-700 to-slate-900 text-white', 
      tag: 'MIND DUEL', 
      emoji: '💡', 
      subtitle: 'Oracle Quiz', 
      tagline: 'Test your mental fortitude with swift trivia answers.',
      borderGlow: 'hover:shadow-[0_0_22px_rgba(6,182,212,0.4)] border-cyan-500/30',
      badgeStyle: 'bg-cyan-500/35 text-cyan-100 border border-cyan-400/30'
    },
    number_rush: { 
      bg: 'from-emerald-500 via-green-600 to-teal-950 text-white', 
      tag: 'REFLEX BLITZ ⚡', 
      emoji: '⚡', 
      subtitle: 'Buzzer Rush', 
      tagline: 'Smash randomized grids in escalating rapid succession.',
      borderGlow: 'hover:shadow-[0_0_22px_rgba(16,185,129,0.4)] border-emerald-500/30',
      badgeStyle: 'bg-emerald-500/35 text-emerald-100 border border-emerald-400/30'
    },
    fortune_draw: { 
      bg: 'from-amber-600 via-yellow-600 to-amber-950 text-white', 
      tag: 'INSTANT SCRATCH', 
      emoji: '🎫', 
      subtitle: 'Chamber of Luck', 
      tagline: 'Scratch luxury tickets to reveal supreme gold matches.',
      borderGlow: 'hover:shadow-[0_0_22px_rgba(245,158,11,0.4)] border-amber-500/30',
      badgeStyle: 'bg-amber-500/35 text-amber-100 border border-amber-400/30'
    },
  };

  // Process and sort games to strictly ensure the top 3 (Dice, Spin Wheel, Lucky Number) are live and the rest are locked
  const processedGames = React.useMemo(() => {
    const liveIds = ['dice', 'spin_wheel', 'lucky_number'];
    
    // Filter active games and override isLocked dynamically
    const mapped = games.filter(g => g.isActive).map(g => {
      const isLive = liveIds.includes(g.id);
      return {
        ...g,
        isLocked: !isLive,
        lockReason: isLive ? '' : 'Authorized VIP Lounge Accounts Only'
      };
    });

    // Sort to place top 3 live games at the very beginning
    return mapped.sort((a, b) => {
      const idxA = liveIds.indexOf(a.id);
      const idxB = liveIds.indexOf(b.id);
      
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  }, [games]);

  // Framer Motion container stagger
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 25, stiffness: 350 } }
  };

  if (isLoading) {
    return (
      <div 
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-8 relative overflow-hidden rounded-3xl min-h-[80vh]" 
        id="home-feed-skeleton"
      >
        <GamingDustBackground />
        
        <div className="relative z-10 space-y-8">
          {/* 1. Shortcuts Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 h-[120px]">
                <div className="h-11 w-11 shimmer-bg rounded-xl mb-2.5" />
                <div className="h-3 w-16 shimmer-bg rounded-md" />
              </div>
            ))}
          </div>

          {/* 2. Header Skeleton */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1 bg-emerald-500 rounded-full" />
              <div className="h-4 w-28 shimmer-bg rounded-md" />
            </div>
          </div>

          {/* 3. Game Card Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="rounded-3xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-5 space-y-4 h-[380px] flex flex-col justify-between shadow-xs">
                <div>
                  {/* Top Badge & icon */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="h-5 w-20 shimmer-bg rounded-full" />
                    <div className="h-6 w-6 shimmer-bg rounded-full" />
                  </div>
                  {/* Visual game box / placeholder */}
                  <div className="h-36 w-full shimmer-bg rounded-2xl mb-4" />
                  {/* Subtitle / Title */}
                  <div className="space-y-2">
                    <div className="h-3 w-1/3 shimmer-bg rounded-md" />
                    <div className="h-5 w-3/4 shimmer-bg rounded-md" />
                    <div className="h-3.5 w-full shimmer-bg rounded-md" />
                  </div>
                </div>
                {/* Footer action */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="h-3 w-16 shimmer-bg rounded-md" />
                  <div className="h-8 w-24 shimmer-bg rounded-xl" />
                </div>
              </div>
            ))}
          </div>

          {/* 4. Lucky Draw Banner Skeleton */}
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-6 h-[140px] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-3 w-full md:w-2/3">
              <div className="h-3 w-28 shimmer-bg rounded-full" />
              <div className="h-6 w-3/4 shimmer-bg rounded-md" />
              <div className="h-3.5 w-full shimmer-bg rounded-md" />
            </div>
            <div className="h-16 w-32 shimmer-bg rounded-2xl shrink-0" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-8 relative overflow-hidden rounded-3xl min-h-[80vh]" 
      id="home-feed-root"
    >
      {/* Subtle, slow-moving interactive light particles/gaming dust background */}
      <GamingDustBackground />

      {/* Live Win Ticker at top of feed */}
      <motion.div variants={itemVariants} className="w-full relative z-10">
        <LiveWinsStream variant="ticker" />
      </motion.div>

      <div className="relative z-10 space-y-8">

      {/* 3. Game Zone Header */}
      <motion.div 
        variants={itemVariants}
        className="flex justify-between items-center"
      >
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 bg-rose-500 rounded-full" />
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider font-mono">Game Zone</h3>
        </div>
      </motion.div>

      {/* 4. Game Card Grid (Screenshot Inspired) */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        {processedGames.map((game) => {
          const themeInfo = customGameThemes[game.id] || { 
            bg: 'from-slate-600 to-slate-800 text-white', 
            tag: 'PREMIUM', 
            emoji: '🎮', 
            subtitle: 'Classic Arcade', 
            tagline: 'Step up to play and claim your instant reward.',
            borderGlow: 'hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] border-slate-700',
            badgeStyle: 'bg-slate-700/50 text-slate-300'
          };
          
          const currentPlayersCount = activePlayers[game.id] || (1520 + Math.floor(Math.random() * 80));

          return (
            <GameCard
              key={game.id}
              game={game}
              themeInfo={themeInfo}
              currentPlayersCount={currentPlayersCount}
              onPlayGame={onPlayGame}
            />
          );
        })}
      </motion.div>

      {/* 🔴 Dedicated Live Multiplayer Winners Ledger Feed (Rebuilt to prevent irritable popups) */}
      <motion.div variants={itemVariants} className="w-full relative z-10">
        <LiveWinsStream variant="list" limit={5} />
      </motion.div>

      {/* 5. "LUCKY" Lottery countdown section (Screenshot Inspired) */}
      <motion.div 
        variants={itemVariants}
        className="rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 p-6 relative overflow-hidden shadow-xl text-white"
        id="lucky-draw-banner"
      >
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-[radial-gradient(circle_at_70%_120%,rgba(244,63,94,0.4),transparent)] pointer-events-none" />
        <div className="absolute -right-10 -top-10 h-40 w-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
          <div className="space-y-2 text-center md:text-left">
            <span className="px-2.5 py-1 bg-white/20 border border-white/30 rounded-full text-[9px] font-mono font-black tracking-widest uppercase">
              LIVE DRAW SYSTEM
            </span>
            <h3 className="text-2xl md:text-4xl font-black tracking-tight italic">
              LUCKY PLATFORM JACKPOT
            </h3>
            <p className="text-xs text-white/80 max-w-md">
              Every hour, our Cronos ledger selects a lucky active player seed. Keep spinning dice, matching colors, or scratching tickets to multiply your win rate!
            </p>
          </div>

          <div className="flex items-center gap-4 bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/15 shrink-0 select-none">
            <div className="text-right">
              <span className="text-[9px] font-mono font-bold text-white/60 block uppercase">ACTIVE SEED NO.</span>
              <span className="text-xs font-bold text-rose-300 font-mono tracking-wider">MATCH SYSTEM</span>
            </div>

            {/* Glowing spinning lucky circle matching the screenshot */}
            <div className="relative h-16 w-16 flex items-center justify-center rounded-full border border-white/20 bg-white/5">
              <motion.div 
                animate={{ rotate: isSpinning ? 720 : 360 }}
                transition={{ 
                  repeat: isSpinning ? undefined : Infinity, 
                  duration: isSpinning ? 0.8 : 20, 
                  ease: isSpinning ? "easeInOut" : "linear" 
                }}
                className="absolute inset-0.5 rounded-full border border-dashed border-rose-300"
              />
              <motion.span 
                key={luckyNumber}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-2xl font-black font-mono tracking-tighter"
              >
                {luckyNumber}
              </motion.span>
            </div>
          </div>
        </div>
      </motion.div>
      </div>

    </motion.div>
  );
};
