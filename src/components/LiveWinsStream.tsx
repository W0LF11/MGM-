import React, { useState, useEffect, useRef } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flame, Coins, Sparkles, Activity, TrendingUp, Zap, ChevronRight, User } from 'lucide-react';

export interface LiveWinItem {
  id: string;
  username: string;
  avatar: string;
  gameName: string;
  winAmount: number;
  multiplier: number;
  isCurrentUser: boolean;
  timestamp: Date;
}

// Global list of players for simulation
const PLAYERS = [
  { name: 'VIP_spinner', avatar: '💎' },
  { name: 'lucky_charm', avatar: '🍀' },
  { name: 'alex_jackpot', avatar: '🦁' },
  { name: 'dice_master', avatar: '🎲' },
  { name: 'fortune_boss', avatar: '👑' },
  { name: 'spin_joker', avatar: '🃏' },
  { name: 'clover_queen', avatar: '👸' },
  { name: 'coin_blitz', avatar: '⚡' },
  { name: 'shadow_rolls', avatar: '🐱' },
  { name: 'alpha_whale', avatar: '🐳' }
];

// Global list of games
const GAMES_LIST = [
  'Dice Challenge',
  'Lucky Number',
  'Spin Wheel',
  'Coin Flip',
  'Color Match',
  'Lucky Seven',
  'Card Clash',
  'Treasure Box',
  'Number Rush',
  'Fortune Draw'
];

// Seed initial wins for pristine presentation on first load
const createInitialWins = (): LiveWinItem[] => {
  return Array.from({ length: 10 }).map((_, idx) => {
    const player = PLAYERS[idx % PLAYERS.length];
    // Force exactly 6 out of 10 to be Dice Challenge (indices 0, 1, 2, 4, 5, 7)
    const isDice = [0, 1, 2, 4, 5, 7].includes(idx);
    const game = isDice ? 'Dice Challenge' : GAMES_LIST.filter(g => g !== 'Dice Challenge')[(idx * 3) % (GAMES_LIST.length - 1)];
    const multiplier = parseFloat((Math.random() * 3.8 + 1.2).toFixed(1));
    const winAmount = Math.floor(Math.random() * 280) + 40;
    return {
      id: `seed-${idx}-${Math.random()}`,
      username: player.name,
      avatar: player.avatar,
      gameName: game,
      winAmount,
      multiplier,
      isCurrentUser: false,
      timestamp: new Date(Date.now() - idx * 120000)
    };
  });
};

interface LiveWinsStreamProps {
  variant: 'ticker' | 'list' | 'sidebar';
  limit?: number;
}

export const LiveWinsStream: React.FC<LiveWinsStreamProps> = ({ variant, limit = 8 }) => {
  const { bets, currentUser } = usePlatform();
  const [wins, setWins] = useState<LiveWinItem[]>(createInitialWins());
  const prevBetsLengthRef = useRef<number>(bets.length);

  // 1. Listen for real-time user wins in the actual platform ledger
  useEffect(() => {
    if (bets.length > prevBetsLengthRef.current) {
      const newBet = bets[0]; // bets is sorted newest first
      if (newBet && newBet.status === 'win' && currentUser && newBet.userId === currentUser.id) {
        const userWin: LiveWinItem = {
          id: `real-${newBet.id || Math.random()}`,
          username: currentUser.username,
          avatar: currentUser.avatar || '🦁',
          gameName: newBet.gameName,
          winAmount: newBet.winAmount,
          multiplier: newBet.multiplier,
          isCurrentUser: true,
          timestamp: new Date()
        };
        setWins((prev) => [userWin, ...prev].slice(0, 30));
      }
    }
    prevBetsLengthRef.current = bets.length;
  }, [bets, currentUser]);

  // 2. Background simulation of multiplayer crowd wins
  useEffect(() => {
    const triggerSimulatedWin = () => {
      if (document.hidden) return;

      const randomPlayer = PLAYERS[Math.floor(Math.random() * PLAYERS.length)];
      
      // Keep username distinct
      let playerName = randomPlayer.name;
      let playerAvatar = randomPlayer.avatar;
      if (currentUser && playerName === currentUser.username) {
        playerName = 'omega_whale_8';
        playerAvatar = '🐳';
      }

      const isDiceWin = Math.random() < 0.60;
      const randomGame = isDiceWin ? 'Dice Challenge' : GAMES_LIST.filter(g => g !== 'Dice Challenge')[Math.floor(Math.random() * (GAMES_LIST.length - 1))];
      const wager = Math.floor(Math.random() * 120) + 15;
      const multiplier = parseFloat((Math.random() * 4.2 + 1.5).toFixed(1));
      const winAmount = parseFloat((wager * multiplier).toFixed(2));

      const simulatedWin: LiveWinItem = {
        id: `sim-${Math.random().toString(36).substr(2, 9)}`,
        username: playerName,
        avatar: playerAvatar,
        gameName: randomGame,
        winAmount,
        multiplier,
        isCurrentUser: false,
        timestamp: new Date()
      };

      setWins((prev) => [simulatedWin, ...prev].slice(0, 30));
    };

    // Simulate wins on an active, realistic frequency (every 8 to 12 seconds)
    const intervalTime = Math.floor(Math.random() * 4000) + 8000;
    const interval = setInterval(triggerSimulatedWin, intervalTime);

    return () => clearInterval(interval);
  }, [currentUser]);

  const activeWins = wins.slice(0, limit);

  // Layout A: HORIZONTAL BANNER TICKER (Ultra premium, non-intrusive)
  if (variant === 'ticker') {
    return (
      <div 
        className="w-full bg-slate-900/60 backdrop-blur-md border-y border-slate-800/80 overflow-hidden py-2"
        id="live-wins-ticker-container"
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-4">
          {/* Animated Badge Indicator */}
          <div className="flex items-center gap-1.5 shrink-0 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold text-rose-400 font-mono">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
            LIVE WINS
          </div>

          {/* Sliding Marquee Container */}
          <div className="flex-1 relative overflow-hidden h-7 flex items-center">
            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />
            
            <div className="flex gap-8 animate-marquee whitespace-nowrap items-center font-sans">
              {activeWins.map((win) => (
                <div 
                  key={win.id} 
                  className="inline-flex items-center gap-2 text-xs"
                >
                  <span className="text-base select-none">{win.avatar}</span>
                  <span className={`font-black tracking-tight ${win.isCurrentUser ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {win.isCurrentUser ? 'YOU' : win.username}
                  </span>
                  <span className="text-slate-500 text-[10px]">won on</span>
                  <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700/60 rounded text-[9.5px] font-bold text-slate-300">
                    {win.gameName}
                  </span>
                  <span className="font-mono font-black text-amber-400">
                    +${win.winAmount.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    ({win.multiplier}x)
                  </span>
                  <span className="text-slate-700 select-none font-mono">|</span>
                </div>
              ))}
              {/* Duplicate list to ensure infinite smooth seamless scroll loop */}
              {activeWins.map((win) => (
                <div 
                  key={`${win.id}-dup`} 
                  className="inline-flex items-center gap-2 text-xs"
                >
                  <span className="text-base select-none">{win.avatar}</span>
                  <span className={`font-black tracking-tight ${win.isCurrentUser ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {win.isCurrentUser ? 'YOU' : win.username}
                  </span>
                  <span className="text-slate-500 text-[10px]">won on</span>
                  <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700/60 rounded text-[9.5px] font-bold text-slate-300">
                    {win.gameName}
                  </span>
                  <span className="font-mono font-black text-amber-400">
                    +${win.winAmount.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    ({win.multiplier}x)
                  </span>
                  <span className="text-slate-700 select-none font-mono">|</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Layout B: DETAILED MAIN VERTICAL FEED (Bento Card Grid Companion)
  if (variant === 'list') {
    return (
      <div 
        className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-150 dark:border-slate-850 p-6 shadow-xl relative overflow-hidden"
        id="live-wins-dashboard-card"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Trophy className="h-28 w-28 text-amber-500" />
        </div>

        {/* Card Header */}
        <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-slate-800/60 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
              <Activity className="h-5 w-5 animate-pulse" />
            </span>
            <div>
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider font-mono">
                MGM TOP WINNER
              </h4>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                Real-time active player payouts & golden multipliers
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            ACTIVE
          </div>
        </div>

        {/* Live List Stream with animated transitions */}
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {activeWins.map((win) => (
              <motion.div
                key={win.id}
                initial={{ opacity: 0, y: -15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  win.isCurrentUser
                    ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.06)]'
                    : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/85 hover:border-slate-200 dark:hover:border-slate-700/60'
                }`}
              >
                {/* Left Side: Avatar, Name & Game Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl relative shrink-0 ${
                    win.isCurrentUser 
                      ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-400/20' 
                      : 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50'
                  }`}>
                    {win.avatar}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-black truncate max-w-[100px] sm:max-w-[140px] ${
                        win.isCurrentUser ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {win.isCurrentUser ? 'YOU' : win.username}
                      </span>
                      {win.isCurrentUser && (
                        <span className="text-[9px] bg-emerald-500 text-white font-black px-1 py-0.2 rounded-md font-mono uppercase tracking-wide">
                          Winner
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                      won on <strong className="text-slate-500 dark:text-slate-400 font-bold">{win.gameName}</strong>
                    </span>
                  </div>
                </div>

                {/* Right Side: Total Payout Cash & Multiplier Flame */}
                <div className="text-right shrink-0">
                  <span className="font-mono text-sm font-black text-amber-500 tracking-tight block">
                    +${win.winAmount.toFixed(2)}
                  </span>
                  <span className="text-[9.5px] font-mono text-emerald-500 font-extrabold flex items-center justify-end gap-0.5 mt-0.5">
                    <Flame className="h-3 w-3 fill-current" /> {win.multiplier}x
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Layout C: HIGH COMPACT ACTIVE SIDEBAR FOR ACTIVE CABINETS (GameCenter Companion)
  return (
    <div 
      className="bg-slate-900/60 dark:bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-4.5 space-y-4"
      id="live-wins-sidebar"
    >
      <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
          <h5 className="text-[10.5px] font-black uppercase text-slate-300 font-mono tracking-wider">
            Live Wins Stream
          </h5>
        </div>
        <span className="text-[8.5px] font-mono text-slate-500 font-bold">
          MULTITUDE
        </span>
      </div>

      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-0.5 text-xs">
        <AnimatePresence initial={false}>
          {activeWins.slice(0, 5).map((win) => (
            <motion.div
              key={win.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`flex items-center justify-between p-2 rounded-xl border transition-all text-[11px] ${
                win.isCurrentUser
                  ? 'bg-emerald-950/40 border-emerald-500/30'
                  : 'bg-slate-900/40 border-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm select-none shrink-0">{win.avatar}</span>
                <div className="min-w-0">
                  <span className={`font-bold block truncate max-w-[70px] ${
                    win.isCurrentUser ? 'text-emerald-400' : 'text-slate-300'
                  }`}>
                    {win.isCurrentUser ? 'YOU' : win.username}
                  </span>
                  <span className="text-[8px] text-slate-500 truncate block">
                    {win.gameName}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono font-bold text-amber-400 block">
                  +${win.winAmount.toFixed(2)}
                </span>
                <span className="text-[8px] font-mono text-emerald-400 font-bold block mt-0.2">
                  {win.multiplier}x
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
