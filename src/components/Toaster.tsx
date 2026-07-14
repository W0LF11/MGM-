import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlatform } from '../context/PlatformContext';
import { Trophy, Sparkles, X, Flame, Coins } from 'lucide-react';

interface WinToast {
  id: string;
  username: string;
  avatar: string;
  gameName: string;
  winAmount: number;
  multiplier: number;
  isCurrentUser: boolean;
}

export const Toaster: React.FC = () => {
  const { bets, currentUser } = usePlatform();
  const [toasts, setToasts] = useState<WinToast[]>([]);
  const prevBetsLengthRef = useRef<number>(bets.length);

  // Function to add a toast
  const addToast = (username: string, avatar: string, gameName: string, winAmount: number, multiplier: number, isCurrentUser: boolean) => {
    const newToast: WinToast = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      avatar,
      gameName,
      winAmount,
      multiplier,
      isCurrentUser,
    };
    setToasts((prev) => [newToast, ...prev].slice(0, 4)); // Show maximum 4 toasts at once
  };

  // 1. Listen to real-time wins from the CURRENT user in the bets ledger
  useEffect(() => {
    if (bets.length > prevBetsLengthRef.current) {
      const newBet = bets[0]; // bets is sorted newest first
      if (newBet && newBet.status === 'win' && currentUser && newBet.userId === currentUser.id) {
        addToast(
          currentUser.username,
          currentUser.avatar || '🦁',
          newBet.gameName,
          newBet.winAmount,
          newBet.multiplier,
          true
        );
      }
    }
    prevBetsLengthRef.current = bets.length;
  }, [bets, currentUser]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return null;
};

interface ToastCardProps {
  toast: WinToast;
  onRemove: () => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onRemove }) => {
  // Auto remove toast after 6 seconds
  useEffect(() => {
    const timer = setTimeout(onRemove, 6000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  return (
    <div 
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-md shadow-xl p-4 flex gap-3 items-center transition-colors ${
        toast.isCurrentUser
          ? 'bg-emerald-950/90 dark:bg-emerald-950/95 border-emerald-500/40 text-emerald-100'
          : 'bg-slate-900/90 dark:bg-slate-950/95 border-slate-800/80 text-slate-100'
      }`}
    >
      {/* Background Animated Glare */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 3 }}
          className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
        />
      </div>

      {/* Avatar Emoji Icon with Glowing Pulse */}
      <div className="relative shrink-0">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-2xl relative z-10 ${
          toast.isCurrentUser
            ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
            : 'bg-slate-800 border border-slate-700'
        }`}>
          {toast.avatar}
        </div>
        {toast.isCurrentUser && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3 z-20">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
        )}
      </div>

      {/* Winning details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-black truncate max-w-28 ${
            toast.isCurrentUser ? 'text-emerald-300' : 'text-slate-200'
          }`}>
            {toast.isCurrentUser ? 'YOU' : toast.username}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">won on</span>
          <span className="text-[10px] bg-slate-800 dark:bg-slate-900/90 border border-slate-700/50 px-1.5 py-0.5 rounded font-bold text-slate-300">
            {toast.gameName}
          </span>
        </div>

        <div className="flex items-baseline gap-1.5 mt-1.5">
          <span className="font-mono text-lg font-black tracking-tight text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
            ${toast.winAmount.toFixed(2)}
          </span>
          <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-0.5">
            <Flame className="h-3 w-3 fill-current" /> x{toast.multiplier}
          </span>
        </div>
      </div>

      {/* Action triggers */}
      <div className="flex flex-col gap-2 shrink-0 self-start">
        <button 
          onClick={onRemove}
          className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Bottom sliding duration line indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/50">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 6, ease: 'linear' }}
          className={`h-full ${
            toast.isCurrentUser ? 'bg-emerald-400' : 'bg-amber-500'
          }`}
        />
      </div>
    </div>
  );
};
