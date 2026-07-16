import React, { useState, useEffect, useRef } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { motion, AnimatePresence } from 'motion/react';
import { GameCelebrationCanvas } from './GameCelebrationCanvas';
import { PremiumDisplayBackground } from './PremiumDisplayBackground';
import { GameLoader } from './GameLoader';
import { LiveWinsStream } from './LiveWinsStream';
import { 
  Trophy, 
  Coins, 
  Gamepad2, 
  Activity, 
  User, 
  Play, 
  RefreshCw, 
  HelpCircle, 
  Star, 
  Clock, 
  ChevronRight, 
  Timer,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Volume2,
  Target,
  Eye,
  EyeOff,
  Lock,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

function seededRandom(seed: string): number {
  let h = 1540483477;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  const x = Math.sin(h) * 10000;
  return x - Math.floor(x);
}

function getDeterministicRollForPeriod(period: string, globalDiceOverrides: Record<string, any>) {
  let pIdxStr = '001';
  if (period.includes('-')) {
    pIdxStr = period.split('-')[1];
  }

  const activeGlobalOverride = globalDiceOverrides[period] || globalDiceOverrides[`daily-${pIdxStr}`];

  let d1 = 1, d2 = 1, d3 = 1, sum = 3;
  if (activeGlobalOverride && activeGlobalOverride.outcome !== 'random') {
    const outcomeVal = activeGlobalOverride.outcome;
    const targetVal = activeGlobalOverride.target || 'any';
    
    let found = false;
    let tries = 0;
    while (!found && tries < 1000) {
      const d1_rand = seededRandom(period + '-d1-' + tries);
      const d2_rand = seededRandom(period + '-d2-' + tries);
      const d3_rand = seededRandom(period + '-d3-' + tries);
      d1 = Math.floor(d1_rand * 6) + 1;
      d2 = Math.floor(d2_rand * 6) + 1;
      d3 = Math.floor(d3_rand * 6) + 1;
      sum = d1 + d2 + d3;
      
      const isSmall = sum >= 3 && sum <= 10;
      const isBig = sum >= 11 && sum <= 18;
      const isOdd = sum % 2 === 1;
      const isEven = sum % 2 === 0;

      if (outcomeVal === 'win') {
        if (targetVal === 'any') {
          found = true;
        } else {
          let match = false;
          if (targetVal === 'big') match = isBig;
          else if (targetVal === 'small') match = isSmall;
          else if (targetVal === 'odd') match = isOdd;
          else if (targetVal === 'even') match = isEven;
          else match = sum === parseInt(targetVal);
          if (match) found = true;
        }
      } else if (outcomeVal === 'lose') {
        let match = false;
        if (targetVal === 'big') match = isBig;
        else if (targetVal === 'small') match = isSmall;
        else if (targetVal === 'odd') match = isOdd;
        else if (targetVal === 'even') match = isEven;
        else match = sum === parseInt(targetVal);
        if (!match) found = true;
      }
      tries++;
    }
    if (!found) {
      d1 = 3; d2 = 4; d3 = 5; sum = 12;
    }
  } else {
    d1 = Math.floor(seededRandom(period + '-d1') * 6) + 1;
    d2 = Math.floor(seededRandom(period + '-d2') * 6) + 1;
    d3 = Math.floor(seededRandom(period + '-d3') * 6) + 1;
    sum = d1 + d2 + d3;
  }

  return { d1, d2, d3, sum, dice: [d1, d2, d3] };
}

interface GameCenterProps {
  initialGameId?: string | null;
  onClearGameId?: () => void;
  modalOnly?: boolean;
}

export const GameCenter: React.FC<GameCenterProps> = ({ initialGameId, onClearGameId, modalOnly }) => {
  const { 
    currentUser, 
    games, 
    bets, 
    playGame: contextPlayGame,
    adminUpdateUserProfile,
    adminUpdateDiceManualFields
  } = usePlatform();

  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(initialGameId || null);

  // Dynamic high-fidelity celebration and disappointment canvas state
  const [celebration, setCelebration] = useState<'win' | 'big_win' | 'loss' | null>(null);
  const [celebrationWinnings, setCelebrationWinnings] = useState<number>(0);
  const [celebrationMult, setCelebrationMult] = useState<number>(1);

  // Wrapped playGame method to intercept game resolutions and trigger visual celebrations/gloom
  const playGame = (gameId: string, betAmount: number, multiplier: number, outcome: string, winAmount: number) => {
    // Record game play inside the core ledger
    contextPlayGame(gameId, betAmount, multiplier, outcome, winAmount);

    // Save metadata and trigger overlay canvas effects
    setCelebrationWinnings(winAmount);
    setCelebrationMult(multiplier);
    if (winAmount > 0) {
      // Big Win is triggered if win multiplier is 2.5x or higher, or single win is $100 or higher
      if (multiplier >= 2.5 || winAmount >= 100) {
        setCelebration('big_win');
      } else {
        setCelebration('win');
      }
    } else {
      setCelebration('loss');
    }
  };

  // Game loading state for the custom animated loading system
  const [loadingGameId, setLoadingGameId] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing frame resources...');

  useEffect(() => {
    if (initialGameId !== undefined) {
      setSelectedGameId(initialGameId);
    }
  }, [initialGameId]);

  useEffect(() => {
    if (selectedGameId) {
      setLoadingGameId(selectedGameId);
      setLoadingProgress(0);
      setLoadingStatus('Initializing frame resources...');
      
      let interval: NodeJS.Timeout;
      let currentProgress = 0;
      
      const statuses = [
        { limit: 15, text: 'Initializing game frame resources...' },
        { limit: 40, text: 'Pre-warming quantum RNG engine...' },
        { limit: 70, text: 'Injecting provably fair cryptographic seed...' },
        { limit: 90, text: 'Rendering vector boards and gameplay assets...' },
        { limit: 100, text: 'Establishing secure web ledger channel... Ready!' }
      ];

      interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 8) + 5; // increment randomly
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          setTimeout(() => {
            setLoadingGameId(null);
          }, 350); // short delay to show 100% and 'Ready!'
        }
        
        setLoadingProgress(currentProgress);
        const match = statuses.find(s => currentProgress <= s.limit);
        if (match) {
          setLoadingStatus(match.text);
        }
      }, 70);

      return () => {
        clearInterval(interval);
      };
    } else {
      setLoadingGameId(null);
      setLoadingProgress(0);
    }
  }, [selectedGameId]);

  const handleCloseCabinet = () => {
    setSelectedGameId(null);
    setCelebration(null);
    if (onClearGameId) {
      onClearGameId();
    }
  };

  // General bet sizing states
  const [betAmount, setBetAmount] = useState<number>(10);

  // Game specific mechanics states
  // 1. Dice Game (Advanced real-time simulation matching screenshot layout)
  const DICE_BET_OPTIONS = [
    { id: 'big', label: 'Big', odds: 1.96 },
    { id: 'small', label: 'Small', odds: 1.96 },
    { id: 'odd', label: 'Odd', odds: 1.96 },
    { id: 'even', label: 'Even', odds: 1.96 },
    { id: '3', label: '3', odds: 190.19 },
    { id: '4', label: '4', odds: 63.4 },
    { id: '5', label: '5', odds: 31.7 },
    { id: '6', label: '6', odds: 19.02 },
    { id: '7', label: '7', odds: 12.67 },
    { id: '8', label: '8', odds: 9.05 },
    { id: '9', label: '9', odds: 7.6 },
    { id: '10', label: '10', odds: 7.04 },
    { id: '11', label: '11', odds: 7.04 },
    { id: '12', label: '12', odds: 7.6 },
    { id: '13', label: '13', odds: 9.05 },
    { id: '14', label: '14', odds: 12.67 },
    { id: '15', label: '15', odds: 19.02 },
    { id: '16', label: '16', odds: 31.7 },
    { id: '17', label: '17', odds: 63.4 },
    { id: '18', label: '18', odds: 190.19 },
  ];

  const [diceTab, setDiceTab] = useState<'bet' | 'last_bet' | 'how_play'>('bet');
  const [diceTimeMode, setDiceTimeMode] = useState<'fast' | 'real'>('real');
  const [dicePeriod, setDicePeriod] = useState<number>(705222);
  const [diceTimer, setDiceTimer] = useState<number>(28);
  const [diceSelectedChoices, setDiceSelectedChoices] = useState<string[]>([]);
  const [diceRolling, setDiceRolling] = useState<boolean>(false);
  const [diceResult3, setDiceResult3] = useState<number[]>([2, 5, 3]); // actual 3 rolled numbers
  const [showDiceBalance, setShowDiceBalance] = useState<boolean>(true);
  const [diceLastPeriodInfo, setDiceLastPeriodInfo] = useState<{ period: string; dice: number[]; sum: number }>({
    period: '0705221',
    dice: [2, 5, 3],
    sum: 10,
  });
  const [diceTrends, setDiceTrends] = useState<number[]>([14, 8, 11, 7, 15, 6, 12, 9, 10, 13]);
  const [perBetAmount, setPerBetAmount] = useState<number>(10);
  const [diceUserBets, setDiceUserBets] = useState<{
    id: string;
    period: string;
    betAmount: number;
    result: string;
    choice: string;
    time: string;
    status: 'win' | 'loss' | 'pending';
    winAmount: number;
  }[]>(() => {
    const local = localStorage.getItem('dice_user_bets');
    return local ? JSON.parse(local) : [];
  });
  const [diceIsCommitted, setDiceIsCommitted] = useState<boolean>(false);

  // Time-based schedule helpers
  const getCurrentTimeSlot = (): string => {
    const now = new Date();
    const hrs = now.getHours();
    const mins = now.getMinutes();
    const slotMin = Math.floor(mins / 5) * 5;
    return `${String(hrs).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`;
  };

  const getRealRemainingSeconds = (): number => {
    const now = new Date();
    return 300 - ((now.getMinutes() % 5) * 60 + now.getSeconds());
  };

  const getRealPeriod = (): string => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const periodIndex = Math.floor(currentMinutes / 5) + 1;
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(periodIndex).padStart(3, '0')}`;
  };

  const getDisplayPeriod = (): string => {
    if (diceTimeMode === 'real') {
      return getRealPeriod();
    }
    return String(dicePeriod);
  };

  const formatDiceTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `00:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getPeriodWithOffset = (offset: number): string => {
    if (diceTimeMode === 'fast') {
      return String(dicePeriod + offset);
    }
    const now = new Date();
    const offsetMs = offset * 5 * 60 * 1000;
    const offsetDate = new Date(now.getTime() + offsetMs);
    const currentMinutes = offsetDate.getHours() * 60 + offsetDate.getMinutes();
    const periodIndex = Math.floor(currentMinutes / 5) + 1;
    return `${offsetDate.getFullYear()}${String(offsetDate.getMonth() + 1).padStart(2, '0')}${String(offsetDate.getDate()).padStart(2, '0')}-${String(periodIndex).padStart(3, '0')}`;
  };

  useEffect(() => {
    const currentDiceGame = games.find(g => g.id === 'dice');
    const globalDiceOverrides = currentDiceGame?.globalDiceOverrides || {};
    
    // Calculate last drawn period info dynamically based on currentPeriod - 1
    const prevPeriodId = getPeriodWithOffset(-1);
    const prevRoll = getDeterministicRollForPeriod(prevPeriodId, globalDiceOverrides);
    
    setDiceLastPeriodInfo({
      period: prevPeriodId,
      dice: prevRoll.dice,
      sum: prevRoll.sum
    });

    // Compute the past 12 sums for trends
    const pastSums: number[] = [];
    for (let i = 1; i <= 12; i++) {
      const pId = getPeriodWithOffset(-i);
      const roll = getDeterministicRollForPeriod(pId, globalDiceOverrides);
      pastSums.push(roll.sum);
    }
    setDiceTrends(pastSums);
  }, [games, selectedGameId, diceTimeMode, dicePeriod]);

  const diceIsCommittedRef = useRef(diceIsCommitted);
  const diceSelectedChoicesRef = useRef(diceSelectedChoices);
  const perBetAmountRef = useRef(perBetAmount);
  const dicePeriodRef = useRef(dicePeriod);
  const lastDrawnPeriodRef = useRef<string>(getRealPeriod());
  const lastSyncedManualTimerRef = useRef<number | null>(null);
  const currentUserRef = useRef(currentUser);
  const gamesRef = useRef(games);
  const diceRollingRef = useRef(diceRolling);

  useEffect(() => {
    diceIsCommittedRef.current = diceIsCommitted;
  }, [diceIsCommitted]);

  useEffect(() => {
    diceSelectedChoicesRef.current = diceSelectedChoices;
  }, [diceSelectedChoices]);

  useEffect(() => {
    perBetAmountRef.current = perBetAmount;
  }, [perBetAmount]);

  useEffect(() => {
    dicePeriodRef.current = dicePeriod;
  }, [dicePeriod]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    gamesRef.current = games;
  }, [games]);

  useEffect(() => {
    diceRollingRef.current = diceRolling;
  }, [diceRolling]);

  // Dice Game Countdown Loop
  useEffect(() => {
    if (selectedGameId !== 'dice') return;

    const interval = setInterval(() => {
      const currentDiceGame = gamesRef.current.find(g => g.id === 'dice');
      const hasAdminManualTimer = currentDiceGame?.manualTimer !== undefined && currentDiceGame?.manualTimer !== null;

      if (diceTimeMode === 'real' && !hasAdminManualTimer) {
        const remaining = getRealRemainingSeconds();
        setDiceTimer(remaining);
        
        const curPeriod = getRealPeriod();
        if (lastDrawnPeriodRef.current !== curPeriod) {
          lastDrawnPeriodRef.current = curPeriod;
          triggerDiceDraw();
        }
      } else {
        // Either 'fast' mode or Admin manual timer mode is active!
        setDiceTimer(prev => {
          if (prev <= 1) {
            triggerDiceDraw();
            // If it was an admin manual timer, reset it on Firestore so we go back to normal 'real' mode
            if (hasAdminManualTimer) {
              adminUpdateDiceManualFields({ manualTimer: null }).catch(console.error);
            }
            return diceTimeMode === 'real' ? 300 : 30; // reset
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedGameId, diceTimeMode]);

  // Real-time synchronization of the manual timer set by Admin
  useEffect(() => {
    const currentDiceGame = games.find(g => g.id === 'dice');
    if (selectedGameId !== 'dice' || !currentDiceGame) return;
    
    const adminTimer = currentDiceGame.manualTimer;
    if (adminTimer !== undefined && adminTimer !== null) {
      if (adminTimer !== lastSyncedManualTimerRef.current) {
        lastSyncedManualTimerRef.current = adminTimer;
        if (adminTimer === 0) {
          triggerDiceDraw();
          adminUpdateDiceManualFields({ manualTimer: null }).catch(console.error);
        } else {
          setDiceTimer(adminTimer);
        }
      }
    } else {
      lastSyncedManualTimerRef.current = null;
    }
  }, [games, selectedGameId]);

  const triggerDiceDraw = () => {
    if (diceRollingRef.current) return;
    setDiceRolling(true);

    const latestUser = currentUserRef.current;
    const latestGames = gamesRef.current;
    if (!latestUser) return;

    const drawingPeriod = diceTimeMode === 'fast' ? String(dicePeriod) : getPeriodWithOffset(-1);
    const currentDiceGame = latestGames.find(g => g.id === 'dice');
    const globalDiceOverrides = currentDiceGame?.globalDiceOverrides || {};

    let d1 = 1, d2 = 1, d3 = 1, sum = 3;

    const slotOverride = latestUser?.diceOverrides?.[drawingPeriod];
    const userTargetSlot = latestUser?.nextDiceTimeSlot || 'any';
    const isUserRiggingActive = latestUser?.nextDiceResult && latestUser.nextDiceResult !== 'random' && (userTargetSlot === 'any' || userTargetSlot === drawingPeriod);

    if (slotOverride && slotOverride.outcome !== 'random') {
      const outcomeVal = slotOverride.outcome;
      const targetVal = slotOverride.target || 'any';
      const choices = diceSelectedChoicesRef.current;

      let found = false;
      let tries = 0;
      while (!found && tries < 1000) {
        d1 = Math.floor(Math.random() * 6) + 1;
        d2 = Math.floor(Math.random() * 6) + 1;
        d3 = Math.floor(Math.random() * 6) + 1;
        sum = d1 + d2 + d3;
        const isSmall = sum >= 3 && sum <= 10;
        const isBig = sum >= 11 && sum <= 18;
        const isOdd = sum % 2 === 1;
        const isEven = sum % 2 === 0;

        if (outcomeVal === 'win') {
          if (targetVal === 'any') {
            const hasWon = choices.some(choice => {
              if (choice === 'big') return isBig;
              if (choice === 'small') return isSmall;
              if (choice === 'odd') return isOdd;
              if (choice === 'even') return isEven;
              return sum === parseInt(choice);
            });
            if (hasWon || choices.length === 0) found = true;
          } else {
            let match = false;
            if (targetVal === 'big') match = isBig;
            else if (targetVal === 'small') match = isSmall;
            else if (targetVal === 'odd') match = isOdd;
            else if (targetVal === 'even') match = isEven;
            else match = sum === parseInt(targetVal);
            if (match) found = true;
          }
        } else if (outcomeVal === 'lose') {
          const hasWon = choices.some(choice => {
            if (choice === 'big') return isBig;
            if (choice === 'small') return isSmall;
            if (choice === 'odd') return isOdd;
            if (choice === 'even') return isEven;
            return sum === parseInt(choice);
          });
          if (!hasWon) found = true;
        }
        tries++;
      }
    } else if (isUserRiggingActive) {
      const outcomeVal = latestUser.nextDiceResult;
      const choices = diceSelectedChoicesRef.current;

      let found = false;
      let tries = 0;
      while (!found && tries < 1000) {
        d1 = Math.floor(Math.random() * 6) + 1;
        d2 = Math.floor(Math.random() * 6) + 1;
        d3 = Math.floor(Math.random() * 6) + 1;
        sum = d1 + d2 + d3;
        const isSmall = sum >= 3 && sum <= 10;
        const isBig = sum >= 11 && sum <= 18;
        const isOdd = sum % 2 === 1;
        const isEven = sum % 2 === 0;

        const hasWon = choices.some(choice => {
          if (choice === 'big') return isBig;
          if (choice === 'small') return isSmall;
          if (choice === 'odd') return isOdd;
          if (choice === 'even') return isEven;
          return sum === parseInt(choice);
        });

        if (outcomeVal === 'win') {
          if (hasWon || choices.length === 0) found = true;
        } else {
          if (!hasWon) found = true;
        }
        tries++;
      }
    } else {
      const roll = getDeterministicRollForPeriod(drawingPeriod, globalDiceOverrides);
      d1 = roll.d1;
      d2 = roll.d2;
      d3 = roll.d3;
      sum = roll.sum;
    }

    const rolledDice = [d1, d2, d3];

    setTimeout(() => {
      setDiceResult3(rolledDice);
      setDiceRolling(false);

      setDiceLastPeriodInfo({
        period: getDisplayPeriod(),
        dice: rolledDice,
        sum: sum
      });
      setDiceTrends(prev => [sum, ...prev].slice(0, 12));

      if (diceTimeMode === 'fast') {
        setDicePeriod(prev => prev + 1);
      }

      // Consume/Reset Rigging on Firestore
      if (latestUser?.nextDiceResult && latestUser.nextDiceResult !== 'random') {
        const userTargetSlot = latestUser?.nextDiceTimeSlot || 'any';
        const curPeriod = getRealPeriod();
        if (userTargetSlot === 'any' || userTargetSlot === curPeriod) {
          adminUpdateUserProfile(latestUser.id, { 
            nextDiceResult: 'random',
            nextDiceTimeSlot: 'any',
            nextDiceWinPercentage: null,
            nextDiceLossPercentage: null
          }).catch(console.error);
        }
      }

      // Consume/Reset slotOverride on Firestore
      const curPeriod = getRealPeriod();
      if (latestUser?.diceOverrides?.[curPeriod]) {
        const updatedOverrides = { ...latestUser.diceOverrides };
        delete updatedOverrides[curPeriod];
        adminUpdateUserProfile(latestUser.id, {
          diceOverrides: updatedOverrides
        }).catch(console.error);
      }

      if (diceIsCommittedRef.current && diceSelectedChoicesRef.current.length > 0) {
        const choices = diceSelectedChoicesRef.current;
        const betAmt = perBetAmountRef.current;
        const totalWager = choices.length * betAmt;

        const isSmall = sum >= 3 && sum <= 10;
        const isBig = sum >= 11 && sum <= 18;
        const isOdd = sum % 2 === 1;
        const isEven = sum % 2 === 0;

        let totalWin = 0;
        const profitMult = currentDiceGame?.manualProfitRate || 1.0;
        choices.forEach(choice => {
          let won = false;
          let odds = 1.96;
          if (choice === 'big') {
            won = isBig;
          } else if (choice === 'small') {
            won = isSmall;
          } else if (choice === 'odd') {
            won = isOdd;
          } else if (choice === 'even') {
            won = isEven;
          } else {
            const val = parseInt(choice);
            won = sum === val;
            const opt = DICE_BET_OPTIONS.find(o => o.id === choice);
            odds = opt ? opt.odds : 1.96;
          }

          if (won) {
            totalWin += betAmt * odds * profitMult;
          }
        });

        // Check if user override is active and override totalWin based on win/loss percentage!
        const cPeriod = getRealPeriod();
        const activeSlotOverride = latestUser?.diceOverrides?.[cPeriod];
        const uTargetSlot = latestUser?.nextDiceTimeSlot || 'any';
        const isUserRiggingActive = latestUser?.nextDiceResult && latestUser.nextDiceResult !== 'random' && (uTargetSlot === 'any' || uTargetSlot === cPeriod);

        // Fetch global overrides
        const globalDiceOverrides = currentDiceGame?.globalDiceOverrides || {};
        const now = new Date();
        const slot = getCurrentTimeSlot();
        const activeSchedule = slot ? currentDiceGame?.diceSchedules?.find(s => s.timeSlot === slot) : null;
        const pIndex = Math.floor((now.getHours() * 60 + now.getMinutes()) / 5) + 1;
        const pIdxStr = String(pIndex).padStart(3, '0');
        const activeGlobalOverride = globalDiceOverrides[cPeriod] || globalDiceOverrides[`daily-${pIdxStr}`];

        if (activeSlotOverride && activeSlotOverride.outcome !== 'random') {
          if (activeSlotOverride.outcome === 'win') {
            const pct = activeSlotOverride.winPct !== undefined ? activeSlotOverride.winPct : 96;
            totalWin = totalWager + (totalWager * (pct / 100));
          } else if (activeSlotOverride.outcome === 'lose') {
            const pct = activeSlotOverride.lossPct !== undefined ? activeSlotOverride.lossPct : 100;
            totalWin = totalWager * ((100 - pct) / 100);
          }
        } else if (isUserRiggingActive) {
          const customWinPct = latestUser?.nextDiceWinPercentage;
          const customLossPct = latestUser?.nextDiceLossPercentage;

          let actuallyWonAny = false;
          choices.forEach(choice => {
            let won = false;
            if (choice === 'big') won = isBig;
            else if (choice === 'small') won = isSmall;
            else if (choice === 'odd') won = isOdd;
            else if (choice === 'even') won = isEven;
            else won = sum === parseInt(choice);
            if (won) actuallyWonAny = true;
          });

          if (actuallyWonAny) {
            if (customWinPct !== undefined && customWinPct !== null) {
              totalWin = totalWager * (customWinPct / 100);
            }
          } else {
            if (customLossPct !== undefined && customLossPct !== null) {
              totalWin = totalWager * ((100 - customLossPct) / 100);
            }
          }
        } else if (activeGlobalOverride && activeGlobalOverride.outcome !== 'random') {
          if (activeGlobalOverride.outcome === 'win') {
            const pct = activeGlobalOverride.winPct !== undefined ? activeGlobalOverride.winPct : 100;
            totalWin = totalWager * (pct / 100);
          } else if (activeGlobalOverride.outcome === 'lose') {
            const pct = activeGlobalOverride.lossPct !== undefined ? activeGlobalOverride.lossPct : 100;
            totalWin = totalWager * ((100 - pct) / 100);
          }
        }

        // Add active schedule jackpot / golden hour bonus to user's winning
        if (totalWin > 0 && activeSchedule && activeSchedule.jackpotMoney > 0) {
          totalWin += activeSchedule.jackpotMoney;
        }

        const netMultiplier = totalWager > 0 ? parseFloat((totalWin / totalWager).toFixed(2)) : 0;
        const outcomeDesc = `Roll: ${d1},${d2},${d3} (Sum: ${sum})`;

        playGame('dice', totalWager, netMultiplier, outcomeDesc, parseFloat(totalWin.toFixed(2)));

        const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
        const resultDesc = `${sum} (${isBig ? 'Big' : 'Small'}, ${isOdd ? 'Odd' : 'Even'})`;
        const newLocalRecord = {
          id: `BET_LOCAL_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          period: getDisplayPeriod(),
          betAmount: totalWager,
          result: resultDesc,
          choice: choices.map(c => c.toUpperCase()).join(', '),
          time: timeStr,
          status: (totalWin > 0 ? 'win' : 'loss') as 'win' | 'loss',
          winAmount: parseFloat(totalWin.toFixed(2))
        };

        setDiceUserBets(prev => {
          const updated = [newLocalRecord, ...prev].slice(0, 40);
          localStorage.setItem('dice_user_bets', JSON.stringify(updated));
          return updated;
        });

        setCelebrationWinnings(totalWin);
        setCelebrationMult(netMultiplier);
        if (totalWin > 0) {
          if (netMultiplier >= 2.5 || totalWin >= 100) {
            setCelebration('big_win');
          } else {
            setCelebration('win');
          }
        } else {
          setCelebration('loss');
        }

        setDiceIsCommitted(false);
        setDiceSelectedChoices([]);
      }
    }, 1500);
  };

  const handleConfirmDiceBet = () => {
    if (diceIsCommitted) return;
    if (diceSelectedChoices.length === 0) {
      alert("Please choose at least one bet option first!");
      return;
    }

    const totalWager = diceSelectedChoices.length * perBetAmount;
    const balance = currentUser.balance;
    if (balance < totalWager) {
      alert("Insufficient wallet balance for this bet!");
      return;
    }

    setDiceIsCommitted(true);

    if (diceTimer > 3) {
      setDiceTimer(3);
    }
  };

  // 2. Lucky Number
  const [selectedLuckyNum, setSelectedLuckyNum] = useState<number>(7);
  const [luckyRolling, setLuckyRolling] = useState(false);
  const [luckyResult, setLuckyResult] = useState<number | null>(null);

  // 3. Spin Wheel
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelResult, setWheelResult] = useState<string | null>(null);

  // 4. Coin Flip
  const [selectedCoinSide, setSelectedCoinSide] = useState<'Heads' | 'Tails'>('Heads');
  const [coinFlipping, setCoinFlipping] = useState(false);
  const [coinResult, setCoinResult] = useState<'Heads' | 'Tails' | null>(null);

  // 5. Color Match
  const [selectedColorMatch, setSelectedColorMatch] = useState<'Red' | 'Blue' | 'Gold'>('Red');
  const [colorSpinning, setColorSpinning] = useState(false);
  const [innerColor, setInnerColor] = useState<string>('');
  const [outerColor, setOuterColor] = useState<string>('');

  // 6. Lucky Seven
  const [diceRolls, setDiceRolls] = useState<number[]>([1, 1, 1]);
  const [sevenRolling, setSevenRolling] = useState(false);
  const [sevenResultSum, setSevenResultSum] = useState<number | null>(null);

  // 7. Card Clash
  const [clashState, setClashState] = useState<'idle' | 'deal' | 'clashed'>('idle');
  const [dealerCard, setDealerCard] = useState<{ suite: string, value: number, name: string } | null>(null);
  const [playerCard, setPlayerCard] = useState<{ suite: string, value: number, name: string } | null>(null);

  // 8. Treasure Box
  const [boxGrid, setBoxGrid] = useState<{ id: number, hasBomb: boolean, revealed: boolean, mult: number }[]>([]);
  const [boxActive, setBoxActive] = useState(false);
  const [boxAccumMultiplier, setBoxAccumMultiplier] = useState(1.0);
  const [boxBusted, setBoxBusted] = useState(false);

  // 9. Puzzle Arena (Sliding tiles)
  const [puzzleGrid, setPuzzleGrid] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 0]); // 0 represents empty space
  const [puzzleActive, setPuzzleActive] = useState(false);
  const [puzzleTimer, setPuzzleTimer] = useState(45);
  const [puzzleWon, setPuzzleWon] = useState(false);
  const puzzleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 10. Quiz Battle
  const [quizState, setQuizState] = useState<'idle' | 'active' | 'resolved'>('idle');
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizTimer, setQuizTimer] = useState(15);
  const quizIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const mockQuestions = [
    { q: "What is the product of 7 multiplied by 8?", a: ["54", "56", "64", "48"], correct: "56" },
    { q: "Which solar planet orbits closest to the Sun?", a: ["Venus", "Mars", "Mercury", "Earth"], correct: "Mercury" },
    { q: "What was the name of the genesis block of Bitcoin?", a: ["Satoshi block", "Genesis block", "Block 0", "Hal Finney block"], correct: "Genesis block" }
  ];

  // 11. Number Rush
  const [rushGrid, setRushGrid] = useState<number[]>([]);
  const [rushTarget, setRushTarget] = useState(1);
  const [rushActive, setRushActive] = useState(false);
  const [rushTimer, setRushTimer] = useState(20);
  const rushIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 12. Fortune Draw Scratch
  const [scratchedItems, setScratchedItems] = useState<boolean[]>([false, false, false, false, false, false]);
  const [scratchMults, setScratchMults] = useState<number[]>([1.5, 1.5, 2, 5, 1.5, 10]);
  const [scratchActive, setScratchActive] = useState(false);

  // Reset states when changing selected game
  useEffect(() => {
    // Clean up timers
    if (puzzleIntervalRef.current) clearInterval(puzzleIntervalRef.current);
    if (quizIntervalRef.current) clearInterval(quizIntervalRef.current);
    if (rushIntervalRef.current) clearInterval(rushIntervalRef.current);

    setDiceResult3([2, 5, 3]);
    setDiceSelectedChoices([]);
    setDiceIsCommitted(false);
    setLuckyResult(null);
    setWheelResult(null);
    setCoinResult(null);
    setSevenResultSum(null);
    setClashState('idle');
    setDealerCard(null);
    setPlayerCard(null);
    setBoxActive(false);
    setPuzzleActive(false);
    setQuizState('idle');
    setRushActive(false);
    setScratchActive(false);
  }, [selectedGameId]);

  if (!currentUser) {
    return (
      <div className="text-center py-16" id="game-lobby-not-logged">
        <h3 className="text-lg font-bold">Authentication Required</h3>
        <p className="text-xs text-slate-400 mt-1">Please sign in to access the interactive Game Center.</p>
      </div>
    );
  }

  // Categories list
  const categories = ['All', 'Classic', 'Luck', 'Arcade', 'Speed', 'Skill'];
  const filteredGames = games.filter(g => filterCategory === 'All' || g.category === filterCategory);

  const renderGameContent = (gameId: string) => {
    switch (gameId) {
      case 'dice': {
        const renderDiceDotLayout = (val: number) => {
          const dotPositions: Record<number, string[]> = {
            1: ['col-start-2 row-start-2'],
            2: ['col-start-1 row-start-1', 'col-start-3 row-start-3'],
            3: ['col-start-1 row-start-1', 'col-start-2 row-start-2', 'col-start-3 row-start-3'],
            4: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
            5: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-2 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
            6: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-2', 'col-start-3 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
          };
          const positions = dotPositions[val] || [];
          return (
            <div className="grid grid-cols-3 grid-rows-3 p-1 w-8 h-8 rounded-lg bg-red-600 border border-red-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.25)] justify-items-center items-center gap-0.5">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => {
                const row = Math.floor(idx / 3) + 1;
                const col = (idx % 3) + 1;
                const isDot = positions.some(pos => pos.includes(`col-start-${col}`) && pos.includes(`row-start-${row}`));
                return (
                  <div 
                    key={idx} 
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${
                      isDot 
                        ? 'bg-white shadow-[0_1px_1px_rgba(0,0,0,0.35)] scale-100' 
                        : 'bg-transparent opacity-0 scale-50'
                    }`} 
                  />
                );
              })}
            </div>
          );
        };

        const totalNote = diceSelectedChoices.length;
        const totalWager = totalNote * perBetAmount;

        return (
          <div className="space-y-4 text-left text-slate-100 bg-slate-900/40 p-4 rounded-3xl border border-slate-800 backdrop-blur-md shadow-xl">
            {/* Header / Tab System & Balance */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
              <div className="flex gap-1 bg-slate-950/40 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setDiceTab('bet')}
                  className={`px-4 py-2 text-xs font-black tracking-wide rounded-lg transition-all ${
                    diceTab === 'bet'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/10'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bet
                </button>
                <button
                  onClick={() => setDiceTab('last_bet')}
                  className={`px-4 py-2 text-xs font-black tracking-wide rounded-lg transition-all ${
                    diceTab === 'last_bet'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/10'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Last bet
                </button>
                <button
                  onClick={() => setDiceTab('how_play')}
                  className={`px-4 py-2 text-xs font-black tracking-wide rounded-lg transition-all ${
                    diceTab === 'how_play'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/10'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  How play
                </button>
              </div>

              {/* Time Mode Toggles - Running in 5m interval throughout */}

              {/* Balance Widget */}
              <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 self-stretch sm:self-auto justify-between">
                <div className="flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Balance:</span>
                  <span className="text-xs font-mono font-black text-amber-400">
                    {showDiceBalance ? `$${(currentUser?.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$••••••'}
                  </span>
                </div>
                <button
                  onClick={() => setShowDiceBalance(!showDiceBalance)}
                  className="text-slate-400 hover:text-white p-0.5 transition-all"
                >
                  {showDiceBalance ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* TAB: BET */}
            {diceTab === 'bet' && (
              <div className="space-y-4">
                {/* Golden Hour / Jackpot Active Banner removed for seamless unrigged feeling */}

                {/* Period Draw Status Info Bar */}
                <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60 relative overflow-hidden">
                  {/* Left Side: Active Period Countdown */}
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-1 text-slate-400 text-[10px] uppercase font-mono font-bold tracking-widest">
                      <Clock className="h-3 w-3 text-red-500 animate-pulse" /> Period {getDisplayPeriod()}
                    </div>
                    <div className="text-red-500 font-mono font-black text-2xl tracking-widest bg-red-950/10 px-3 py-1 w-fit rounded-xl border border-red-500/20 shadow-inner mt-1">
                      {formatDiceTimer(diceTimer)}
                    </div>
                    <span className="text-[9px] text-slate-500 font-medium mt-1 leading-tight">
                      Guess the sum of 3 numbers. 3-10 is small, 11-18 is big.
                    </span>
                  </div>

                  {/* Right Side: Previous Period Winning Result */}
                  <div className="flex flex-col justify-center items-end border-l border-slate-800/80 pl-4">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest mb-1.5 text-right">
                      Period {diceLastPeriodInfo.period} win numbers
                    </span>
                    <div className="flex items-center gap-2 bg-slate-900/60 py-1.5 px-3 rounded-xl border border-slate-800">
                      {diceRolling ? (
                        <div className="flex gap-1.5 items-center">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ 
                                rotate: [0, 90, 180, 270, 360],
                                y: [0, -4, 0, -4, 0]
                              }}
                              transition={{ 
                                repeat: Infinity, 
                                duration: 0.4, 
                                ease: "easeInOut",
                                delay: i * 0.12
                              }}
                            >
                              {renderDiceDotLayout(Math.floor(Math.random() * 6) + 1)}
                            </motion.div>
                          ))}
                          <span className="text-[9px] font-mono font-black text-red-500 uppercase tracking-widest animate-pulse ml-1.5">
                            ROLLING...
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-1.5">
                            {diceLastPeriodInfo.dice.map((d, idx) => (
                              <React.Fragment key={idx}>{renderDiceDotLayout(d)}</React.Fragment>
                            ))}
                          </div>
                          <div className="h-6 w-px bg-slate-800 mx-1" />
                          <div className="text-right">
                            <span className="text-xs font-black text-amber-400 font-mono block leading-none">
                              {diceLastPeriodInfo.sum}
                            </span>
                            <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                              {diceLastPeriodInfo.sum >= 11 ? 'Big' : 'Small'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Horizontal Trend History (Spotting Patterns) */}
                <div className="bg-slate-950/35 px-4 py-2.5 rounded-2xl border border-slate-800/40 flex items-center justify-between gap-3 text-[10px]" id="dice-trend-history-container">
                  <div className="flex items-center gap-1.5 font-mono font-black text-slate-400 uppercase tracking-widest shrink-0">
                    <TrendingUp className="h-3.5 w-3.5 text-red-500" /> Trend History
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {diceTrends.map((tSum, idx) => {
                      const isBig = tSum >= 11;
                      const isEven = tSum % 2 === 0;
                      return (
                        <div 
                          key={idx}
                          className={`h-5 w-5 rounded-full flex items-center justify-center font-mono font-black text-[9px] border transition-all ${
                            idx === 0 
                              ? 'bg-red-600 text-white border-red-400 scale-110 shadow-md shadow-red-500/25' 
                              : isBig 
                              ? 'bg-orange-950/60 text-orange-400 border-orange-500/30' 
                              : 'bg-indigo-950/60 text-indigo-400 border-indigo-500/30'
                          }`}
                          title={`Sum: ${tSum} (${isBig ? 'Big' : 'Small'}, ${isEven ? 'Even' : 'Odd'})`}
                        >
                          {tSum}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Orange Grid of Bets Options (matching the screenshot) */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-mono font-black uppercase tracking-wider block pl-1">
                    Select Bets Combinations
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {/* Row 1: Big / Small / Odd / Even */}
                    {DICE_BET_OPTIONS.slice(0, 4).map((opt) => {
                      const isSelected = diceSelectedChoices.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          disabled={diceIsCommitted}
                          onClick={() => {
                            if (diceSelectedChoices.includes(opt.id)) {
                              setDiceSelectedChoices(prev => prev.filter(c => c !== opt.id));
                            } else {
                              setDiceSelectedChoices(prev => [...prev, opt.id]);
                            }
                          }}
                          className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center border ${
                            isSelected
                              ? 'bg-amber-500 text-white border-amber-300 ring-2 ring-amber-400 shadow-lg scale-95'
                              : 'bg-orange-600 text-orange-50 border-orange-500 hover:bg-orange-500'
                          }`}
                        >
                          <span className="text-sm font-black tracking-tight">{opt.label}</span>
                          <span className="text-[8px] font-bold text-white/70 uppercase tracking-widest mt-0.5">
                            Odds {opt.odds}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {/* Rows 2-5: Individual sums 3 to 18 */}
                    {DICE_BET_OPTIONS.slice(4).map((opt) => {
                      const isSelected = diceSelectedChoices.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          disabled={diceIsCommitted}
                          onClick={() => {
                            if (diceSelectedChoices.includes(opt.id)) {
                              setDiceSelectedChoices(prev => prev.filter(c => c !== opt.id));
                            } else {
                              setDiceSelectedChoices(prev => [...prev, opt.id]);
                            }
                          }}
                          className={`p-2 rounded-xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center border ${
                            isSelected
                              ? 'bg-amber-500 text-white border-amber-300 ring-2 ring-amber-400 shadow-lg scale-95'
                              : 'bg-[#cf5c0c] text-orange-50 border-orange-600 hover:bg-orange-500'
                          }`}
                        >
                          <span className="text-xs font-black font-mono leading-none">{opt.label}</span>
                          <span className="text-[7px] font-bold text-white/60 uppercase tracking-widest mt-1">
                            {opt.odds}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Betting Amount Settings Panel */}
                <div className="flex items-center justify-between gap-4 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">per bet</span>
                    <div className="flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-500">[</span>
                      <input
                        type="number"
                        disabled={diceIsCommitted}
                        value={perBetAmount}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val >= 1) {
                            setPerBetAmount(val);
                          }
                        }}
                        className="w-16 bg-transparent text-center text-xs font-mono font-black text-white focus:outline-none focus:ring-0 p-0"
                      />
                      <span className="text-[10px] font-bold text-slate-500">]</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">$</span>
                  </div>

                  <div className="flex gap-1.5">
                    {[5, 10, 50, 100, 500].map((preset) => (
                      <button
                        key={preset}
                        disabled={diceIsCommitted}
                        onClick={() => setPerBetAmount(preset)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono font-black transition-all ${
                          perBetAmount === preset
                            ? 'bg-amber-500 text-slate-950 border border-amber-400'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Black footer control bar */}
                <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <button
                    disabled={diceIsCommitted}
                    onClick={() => setDiceSelectedChoices([])}
                    className="text-xs font-black text-slate-400 hover:text-white uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Clear
                  </button>

                  <div className="text-xs font-mono font-bold text-slate-300">
                    <span className="text-amber-400 font-black text-sm">{totalNote}</span> Note,{' '}
                    <span className="text-emerald-400 font-black text-sm">${totalWager.toFixed(2)}</span> Dollar
                  </div>

                  <button
                    onClick={handleConfirmDiceBet}
                    disabled={diceIsCommitted || totalNote === 0}
                    className={`px-6 py-2.5 rounded-xl font-black text-xs tracking-widest uppercase transition-all duration-300 ${
                      diceIsCommitted
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                        : totalNote > 0
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                    }`}
                  >
                    {diceIsCommitted ? 'DRAWING...' : 'Confirm Bet'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB: LAST BET */}
            {diceTab === 'last_bet' && (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950 text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">
                        <th className="p-3">Period</th>
                        <th className="p-3">Bet Amount</th>
                        <th className="p-3">Choice</th>
                        <th className="p-3">Result</th>
                        <th className="p-3">Time</th>
                        <th className="p-3 text-right">Payout</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 font-mono text-xs text-slate-300">
                      {diceUserBets.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">
                            No betting records
                          </td>
                        </tr>
                      ) : (
                        diceUserBets.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-900/30 transition-all">
                            <td className="p-3 font-bold text-slate-400">{rec.period}</td>
                            <td className="p-3 font-bold">${rec.betAmount.toFixed(2)}</td>
                            <td className="p-3 truncate max-w-[120px] font-black text-amber-500" title={rec.choice}>
                              {rec.choice}
                            </td>
                            <td className="p-3 font-semibold text-slate-200">{rec.result}</td>
                            <td className="p-3 text-slate-500">{rec.time}</td>
                            <td className={`p-3 text-right font-black ${rec.status === 'win' ? 'text-emerald-400' : 'text-rose-500/70'}`}>
                              {rec.status === 'win' ? `+$${rec.winAmount.toFixed(2)}` : '$0.00'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="text-[10px] font-mono font-bold text-slate-500 text-center uppercase tracking-wider block">
                  Display up to 20 betting records See more
                </div>
              </div>
            )}

            {/* TAB: HOW PLAY */}
            {diceTab === 'how_play' && (
              <div className="space-y-5 bg-slate-950/50 p-5 rounded-3xl border border-slate-800 max-h-[500px] overflow-y-auto leading-relaxed">
                {/* Introduction Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 border-l-4 border-red-500 pl-3">
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Introduction</h4>
                  </div>
                  <ul className="list-disc list-inside text-xs text-slate-300 pl-2 space-y-1">
                    <li>
                      <span className="font-bold text-slate-200">Drawing Time:</span> 288 issues per day, 1 issue every 5 minutes, 24 hours non-stop award.
                    </li>
                    <li>
                      <span className="font-bold text-slate-200">Win number:</span> The game result is 3 numbers, each number is composed of 1-6.
                    </li>
                  </ul>
                </div>

                {/* Rules Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-l-4 border-red-500 pl-3">
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Rules</h4>
                  </div>

                  {/* Rule 1: Sum Value */}
                  <div className="pl-2 space-y-1.5">
                    <h5 className="text-xs font-black text-amber-400 uppercase tracking-widest font-mono">Sum value</h5>
                    <ol className="list-decimal list-inside text-xs text-slate-300 pl-1 space-y-1">
                      <li>
                        <span className="font-bold text-slate-200">Sum value:</span> The betting number matches the sum of the 3 numbers of the current number, that is, Win.
                      </li>
                      <li>
                        <span className="font-bold text-slate-200">Sum value size:</span> The size of the bet is consistent with the sum of the 3 numbers of the current number, that is, Win.
                      </li>
                      <li>
                        <span className="font-bold text-slate-200">Odd and Even:</span> Betting odd and even matches the sum of the 3 numbers of the current number, that is, Win.
                      </li>
                    </ol>
                  </div>

                  {/* Rule 2: Three Same Numbers */}
                  <div className="pl-2 space-y-1.5">
                    <h5 className="text-xs font-black text-amber-400 uppercase tracking-widest font-mono">Three same numbers</h5>
                    <ol className="list-decimal list-inside text-xs text-slate-300 pl-1 space-y-1">
                      <li>
                        <span className="font-bold text-slate-200">Three same number general selection:</span> The three numbers of the numbers in the current period are the same, that is, Win.
                      </li>
                      <li>
                        <span className="font-bold text-slate-200">Three same number radio:</span> The three numbers of the current number are the same, and the betting number matches the current number, that is, the winner.
                      </li>
                    </ol>
                  </div>

                  {/* Rule 3: Three Different Numbers */}
                  <div className="pl-2 space-y-1.5">
                    <h5 className="text-xs font-black text-amber-400 uppercase tracking-widest font-mono">Three different numbers</h5>
                    <ol className="list-decimal list-inside text-xs text-slate-300 pl-1 space-y-1">
                      <li>
                        <span className="font-bold text-slate-200">Three different numbers:</span> The three numbers of the numbers of the current period are different, and the betting numbers match all the numbers of the numbers of the current period, that is, a winner.
                      </li>
                    </ol>
                  </div>

                  {/* Rule 4: Triple Number */}
                  <div className="pl-2 space-y-1.5">
                    <h5 className="text-xs font-black text-amber-400 uppercase tracking-widest font-mono">Triple number</h5>
                    <ol className="list-decimal list-inside text-xs text-slate-300 pl-1 space-y-1">
                      <li>
                        <span className="font-bold text-slate-200">Three serial number general selection:</span> The current number is three connected numbers (only: 123, 234, 345, 456), that is, Win.
                      </li>
                    </ol>
                  </div>

                  {/* Rule 5: Two Same Numbers */}
                  <div className="pl-2 space-y-1.5">
                    <h5 className="text-xs font-black text-amber-400 uppercase tracking-widest font-mono">Two same numbers</h5>
                    <ol className="list-decimal list-inside text-xs text-slate-300 pl-1 space-y-1">
                      <li>
                        <span className="font-bold text-slate-200">Two same number check:</span> Two numbers in the current numbers are the same, and the two same numbers in the betting numbers match the two same numbers in the current number, that is, a prize.
                      </li>
                      <li>
                        <span className="font-bold text-slate-200">Two radios with the same number:</span> Two numbers in the numbers of the current period are the same, and the betting numbers match the two same numbers and one different number in the numbers of the current period, that is, a winner.
                      </li>
                    </ol>
                  </div>

                  {/* Rule 6: Two Different Numbers */}
                  <div className="pl-2 space-y-1.5">
                    <h5 className="text-xs font-black text-amber-400 uppercase tracking-widest font-mono">Two different numbers</h5>
                    <ol className="list-decimal list-inside text-xs text-slate-300 pl-1 space-y-1">
                      <li>
                        <span className="font-bold text-slate-200">Two different numbers:</span> There are two different numbers in the numbers of the current period, and the two different numbers in the betting numbers match the two numbers of the current period, that is, Win.
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'lucky_number':
        return (
          <div className="space-y-4 text-center">
            <motion.div 
              animate={luckyRolling ? { x: [-3, 3, -3, 3, -1, 1, 0], y: [-2, 2, -1, 1, 0] } : {}}
              transition={{ duration: 0.1, repeat: luckyRolling ? Infinity : 0 }}
              className="h-44 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden p-4 shadow-2xl"
            >
              <PremiumDisplayBackground theme="indigo" />
              {luckyRolling ? (
                <div className="flex flex-col items-center justify-center space-y-3 w-full z-10">
                  <div className="flex gap-2 h-14 justify-center items-center overflow-hidden w-40 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-2xl px-4 border border-indigo-500/30 shadow-[inset_0_0_15px_rgba(99,102,241,0.5)]">
                    {[1, 2, 3].map((delay) => (
                      <motion.div
                        key={delay}
                        animate={{
                          y: [-40, 40]
                        }}
                        transition={{
                          duration: 0.12,
                          repeat: Infinity,
                          repeatType: "loop",
                          delay: delay * 0.04
                        }}
                        className="text-indigo-400 font-mono font-black text-2xl drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]"
                      >
                        {Math.floor(Math.random() * 10)}
                      </motion.div>
                    ))}
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-400 animate-pulse uppercase tracking-wider">SPINNING GOLDEN CYLINDER DRUM...</span>
                </div>
              ) : luckyResult !== null ? (
                <motion.div 
                  initial={{ scale: 0, y: 30 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 220, damping: 14 }}
                  className="flex flex-col items-center justify-center space-y-2 z-10 w-full"
                >
                  <div className="flex gap-4 items-center bg-slate-950/70 backdrop-blur-md p-4 rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                    <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)] text-white font-black text-3xl border border-indigo-400/40 relative">
                      <span className="absolute -inset-1 rounded-2xl bg-indigo-500/30 blur-md animate-pulse" />
                      <span className="relative z-10">{luckyResult}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] font-bold font-mono text-indigo-400 uppercase tracking-wider block">LUCKY NUMBER DRAW</span>
                      <h4 className="text-sm font-black text-white">
                        Your Choice: {selectedLuckyNum}
                      </h4>
                      <span className={`text-xs font-black uppercase tracking-wider block mt-0.5 ${
                        luckyResult === selectedLuckyNum 
                          ? 'text-indigo-400 animate-bounce' 
                          : 'text-rose-400'
                      }`}>
                        {luckyResult === selectedLuckyNum ? '🎉 JACKPOT WIN!' : '❌ TRY AGAIN'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2 z-10">
                  <div className="h-16 w-16 bg-slate-900/40 border-2 border-dashed border-indigo-500/40 rounded-2xl flex items-center justify-center text-indigo-400 text-3xl font-black shadow-inner">
                    🔮
                  </div>
                  <span className="text-xs font-semibold text-indigo-400/80 tracking-wide">Pick a lucky digit and draw!</span>
                </div>
              )}
            </motion.div>

            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedLuckyNum(i)}
                  className={`h-10 border rounded-xl font-bold font-mono text-xs transition-all ${
                    selectedLuckyNum === i 
                      ? 'bg-indigo-500 text-white border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]' 
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 hover:border-indigo-400'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>

            <button
              onClick={playLuckyNumber}
              disabled={luckyRolling}
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-extrabold shadow-md transition-all uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98]"
            >
              {luckyRolling ? 'Drawing lot...' : `Wager on Lucky Number (${selectedLuckyNum})`}
            </button>
          </div>
        );

      case 'spin_wheel':
        return (
          <div className="space-y-4 text-center flex flex-col items-center">
            <motion.div 
              animate={wheelSpinning ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.1, repeat: wheelSpinning ? Infinity : 0 }}
              className="h-56 bg-slate-950 rounded-2xl border border-slate-850 flex items-center justify-center w-full relative overflow-hidden p-4 shadow-2xl"
            >
              <PremiumDisplayBackground theme="violet" />
              {/* Wheel circular container */}
              <div className="relative w-40 h-40 flex items-center justify-center z-10">
                <div 
                  className="relative w-40 h-40 rounded-full border-4 border-slate-800 bg-slate-950 flex items-center justify-center overflow-hidden shadow-2xl"
                  style={{ 
                    transform: `rotate(${wheelRotation}deg)`,
                    transition: 'transform 2.5s cubic-bezier(0.1, 0.8, 0.3, 1)' 
                  }}
                >
                  {/* Segment division lines */}
                  <div className="absolute w-full h-px bg-white/20" />
                  <div className="absolute w-full h-px bg-white/20 transform rotate-45" />
                  <div className="absolute w-full h-px bg-white/20 transform rotate-90" />
                  <div className="absolute w-full h-px bg-white/20 transform rotate-135" />
                  
                  <span className="absolute top-2 font-bold text-[8px] text-amber-400 tracking-wider">MEGA x10</span>
                  <span className="absolute right-2 font-bold text-[8px] text-emerald-400 tracking-wider">x2.0</span>
                  <span className="absolute bottom-2 font-bold text-[8px] text-rose-500 tracking-wider">Bust x0</span>
                  <span className="absolute left-2 font-bold text-[8px] text-sky-400 tracking-wider">Match x1.5</span>
                </div>
                
                {/* Interactive glowing LEDs on border */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <div 
                    key={i}
                    className={`absolute w-1.5 h-1.5 rounded-full z-20 ${wheelSpinning ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_#fbbf24]' : 'bg-slate-500'}`}
                    style={{
                      transform: `rotate(${i * 30}deg) translate(80px)`
                    }}
                  />
                ))}

                {/* Dial pointer pin */}
                <motion.div 
                  animate={wheelSpinning ? { rotate: [-15, 15, -15] } : { rotate: 0 }}
                  transition={{ repeat: Infinity, duration: 0.08 }}
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4.5 h-6.5 bg-rose-500 rounded-b-full shadow-lg z-30 origin-top" 
                />
                
                {/* central hub */}
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-900 to-slate-950 text-white flex items-center justify-center font-black text-[9px] border-2 border-slate-700 z-30 absolute shadow-2xl">
                  SPIN
                </div>
              </div>
            </motion.div>

            <div className="text-center h-8">
              {wheelSpinning ? (
                <p className="text-xs text-violet-400 animate-pulse font-bold tracking-wider uppercase">WHEEL IN HIGH-SPEED ROTATION...</p>
              ) : wheelResult ? (
                <motion.h4 
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="font-extrabold text-sm text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                >
                  Landed: {wheelResult} 🎉
                </motion.h4>
              ) : (
                <p className="text-xs text-slate-400 font-mono">SPIN TO HIT JACKPOT MULTIPLIERS</p>
              )}
            </div>

            <button
              onClick={playSpinWheel}
              disabled={wheelSpinning}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold shadow-md transition-all uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98]"
            >
              {wheelSpinning ? 'Spinning wheel...' : 'Wager and spin wheel'}
            </button>
          </div>
        );

      case 'coin_flip':
        return (
          <div className="space-y-4 text-center flex flex-col items-center">
            <motion.div 
              animate={coinFlipping ? { x: [-1, 1, -1, 1, 0] } : {}}
              transition={{ duration: 0.1, repeat: coinFlipping ? Infinity : 0 }}
              className="h-44 w-full bg-slate-950 rounded-2xl border border-slate-850 flex flex-col items-center justify-center relative overflow-hidden p-4 shadow-2xl"
            >
              <PremiumDisplayBackground theme="amber" />
              {coinFlipping ? (
                <motion.div
                  animate={{
                    rotateX: [0, 360, 720, 1080, 1440],
                    scale: [1, 1.4, 0.8, 1.2, 1],
                    y: [0, -60, 20, -10, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    ease: "easeInOut"
                  }}
                  className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 border-4 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)] flex items-center justify-center text-4xl font-black text-amber-950 select-none z-10"
                >
                  🪙
                </motion.div>
              ) : coinResult ? (
                <motion.div
                  initial={{ scale: 0, rotateY: -180 }}
                  animate={{ scale: 1, rotateY: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="flex flex-col items-center space-y-2 z-10 w-full"
                >
                  <div className="flex gap-4 items-center bg-slate-950/70 backdrop-blur-md p-4 rounded-2xl border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                    <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${
                      coinResult === 'Heads' ? 'from-amber-400 to-amber-500' : 'from-slate-300 to-slate-400'
                    } border-4 ${
                      coinResult === 'Heads' ? 'border-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'border-slate-500'
                    } shadow-lg flex flex-col items-center justify-center text-slate-950 font-black text-xs select-none`}>
                      <span>{coinResult}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] font-bold font-mono text-amber-400 uppercase tracking-wider block">COIN TOSS DRAW</span>
                      <h4 className="text-sm font-black text-white">
                        Choice: {selectedCoinSide}
                      </h4>
                      <span className={`text-xs font-black uppercase tracking-wider ${
                        coinResult === selectedCoinSide ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {coinResult === selectedCoinSide ? '🎉 WIN DOUBLE!' : '❌ TRY AGAIN'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2 z-10">
                  <div className="h-16 w-16 bg-slate-900/40 border-2 border-dashed border-amber-500/40 rounded-2xl flex items-center justify-center text-amber-400 text-3xl font-black shadow-inner">
                    🪙
                  </div>
                  <span className="text-xs font-semibold text-amber-400/8 tracking-wide">Select side Heads or Tails & flip</span>
                </div>
              )}
            </motion.div>

            <div className="flex gap-2 w-full border border-slate-200 dark:border-slate-800 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/50">
              <button
                onClick={() => setSelectedCoinSide('Heads')}
                className={`flex-1 py-2 text-xs rounded-lg font-bold transition-all ${selectedCoinSide === 'Heads' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
              >
                HEADS
              </button>
              <button
                onClick={() => setSelectedCoinSide('Tails')}
                className={`flex-1 py-2 text-xs rounded-lg font-bold transition-all ${selectedCoinSide === 'Tails' ? 'bg-slate-400 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
              >
                TAILS
              </button>
            </div>

            <button
              onClick={playCoinFlip}
              disabled={coinFlipping}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold shadow-md transition-all uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98]"
            >
              {coinFlipping ? 'Flipping coin...' : `Wager on ${selectedCoinSide}`}
            </button>
          </div>
        );

      case 'color_match':
        return (
          <div className="space-y-4 text-center flex flex-col items-center">
            <motion.div 
              animate={colorSpinning ? { x: [-2, 2, -2, 2, 0] } : {}}
              transition={{ duration: 0.1, repeat: colorSpinning ? Infinity : 0 }}
              className="h-44 w-full bg-slate-950 rounded-2xl border border-slate-850 flex flex-col items-center justify-center relative overflow-hidden p-4 shadow-2xl"
            >
              <PremiumDisplayBackground theme="violet" />
              {colorSpinning ? (
                <div className="flex gap-6 z-10">
                  {['inner', 'outer'].map((part) => (
                    <motion.div
                      key={part}
                      animate={{
                        rotate: 360,
                        borderColor: ['#ef4444', '#3b82f6', '#fbbf24', '#ef4444']
                      }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                      className="h-16 w-16 rounded-full border-4 flex items-center justify-center text-2xl bg-slate-900/40 relative shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                    >
                      <span className="absolute inset-0 bg-purple-500/10 rounded-full animate-ping" />
                      🎨
                    </motion.div>
                  ))}
                </div>
              ) : innerColor ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex flex-col items-center space-y-2 z-10 w-full"
                >
                  <div className="flex gap-4 items-center bg-slate-950/70 backdrop-blur-md p-4 rounded-2xl border border-purple-500/20 shadow-[0_0_20px_rgba(167,139,250,0.15)]">
                    <div className="flex gap-2">
                      <motion.div 
                        animate={{ scale: [1, 1.15, 1] }}
                        className="h-12 w-12 rounded-full border-2 border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.2)]" 
                        style={{ backgroundColor: innerColor === 'Gold' ? '#fbbf24' : innerColor === 'Red' ? '#ef4444' : '#3b82f6' }} 
                      />
                      <motion.div 
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ delay: 0.1 }}
                        className="h-12 w-12 rounded-full border-2 border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.2)]" 
                        style={{ backgroundColor: outerColor === 'Gold' ? '#fbbf24' : outerColor === 'Red' ? '#ef4444' : '#3b82f6' }} 
                      />
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] font-bold font-mono text-purple-400 uppercase tracking-wider block">COLOR WHEEL DRAW</span>
                      <h4 className="text-xs font-extrabold text-white">Inner: {innerColor} | Outer: {outerColor}</h4>
                      <span className={`text-[11px] font-black uppercase tracking-wider block mt-0.5 ${innerColor === outerColor ? 'text-emerald-400 animate-bounce' : 'text-slate-400'}`}>
                        {innerColor === outerColor ? '🎉 COLOR MATCH!' : '❌ NO MATCH'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2 z-10">
                  <div className="h-16 w-16 bg-slate-900/40 border-2 border-dashed border-purple-500/40 rounded-2xl flex items-center justify-center text-purple-400 text-3xl font-black shadow-inner">
                    🎨
                  </div>
                  <span className="text-xs font-semibold text-purple-400/80 tracking-wide">Match colors to multiply stake</span>
                </div>
              )}
            </motion.div>

            <div className="flex gap-2 w-full border border-slate-200 dark:border-slate-800 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/50">
              {(['Red', 'Blue', 'Gold'] as const).map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColorMatch(color)}
                  className={`flex-1 py-1.5 text-xs rounded-lg font-bold transition-all ${selectedColorMatch === color ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {color}
                </button>
              ))}
            </div>

            <button
              onClick={playColorMatch}
              disabled={colorSpinning}
              className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-xs font-extrabold shadow-md transition-all uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98]"
            >
              {colorSpinning ? 'Matching colors...' : `Wager on ${selectedColorMatch}`}
            </button>
          </div>
        );

      case 'lucky_seven':
        return (
          <div className="space-y-4 text-center flex flex-col items-center">
            <motion.div 
              animate={sevenRolling ? { x: [-3, 3, -3, 3, 0] } : {}}
              transition={{ duration: 0.1, repeat: sevenRolling ? Infinity : 0 }}
              className="h-44 w-full bg-slate-950 rounded-2xl border border-slate-850 flex flex-col items-center justify-center relative overflow-hidden p-4 shadow-2xl"
            >
              <PremiumDisplayBackground theme="rose" />
              {sevenRolling ? (
                <div className="flex gap-3 z-10">
                  {[1, 2, 3].map((delay) => (
                    <motion.div
                      key={delay}
                      animate={{ rotate: 360, y: [0, -15, 0] }}
                      transition={{ repeat: Infinity, duration: 0.45, delay: delay * 0.08 }}
                      className="h-14 w-14 bg-rose-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-[0_0_15px_rgba(244,63,94,0.6)] border border-rose-400"
                    >
                      🎰
                    </motion.div>
                  ))}
                </div>
              ) : sevenResultSum !== null ? (
                <div className="flex flex-col items-center space-y-3 z-10 w-full">
                  <div className="flex gap-4 items-center bg-slate-950/70 backdrop-blur-md p-4 rounded-2xl border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
                    <div className="flex gap-2">
                      {diceRolls.map((roll, idx) => (
                        <motion.div 
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", delay: idx * 0.1 }}
                          key={idx} 
                          className="h-12 w-12 bg-rose-600 text-white font-black rounded-xl flex items-center justify-center shadow-[0_0_10px_rgba(244,63,94,0.4)] text-xl border border-rose-400"
                        >
                          {roll}
                        </motion.div>
                      ))}
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] font-bold font-mono text-rose-400 uppercase tracking-wider block">SLOTS REEL SPIN</span>
                      <h5 className="font-extrabold text-xs text-white">Total Sum: <span className="text-rose-500 font-mono text-sm">{sevenResultSum}</span></h5>
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 animate-bounce block mt-0.5">
                        {sevenResultSum === 7 ? '🎰 JACKPOT SEVEN (5x)!' : '🎉 WINNER (1.4x)'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2 z-10">
                  <div className="h-16 w-16 bg-slate-900/40 border-2 border-dashed border-rose-500/40 rounded-2xl flex items-center justify-center text-rose-400 text-3xl font-black shadow-inner">
                    🎰
                  </div>
                  <span className="text-xs font-semibold text-rose-400/80 tracking-wide">Roll 3 dice. Sum of 7 wins 5x jackpot!</span>
                </div>
              )}
            </motion.div>

            <button
              onClick={playLuckySeven}
              disabled={sevenRolling}
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-extrabold shadow-md transition-all uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98]"
            >
              {sevenRolling ? 'Spinning slots...' : 'Wager on Lucky Seven'}
            </button>
          </div>
        );

      case 'card_clash':
        return (
          <div className="space-y-4 text-center flex flex-col items-center">
            <div className="h-44 w-full bg-slate-950 rounded-2xl border border-slate-850 flex flex-col items-center justify-center relative overflow-hidden p-4 shadow-2xl">
              <PremiumDisplayBackground theme="indigo" />
              {clashState === 'idle' && (
                <div className="flex flex-col items-center justify-center space-y-2 z-10">
                  <div className="h-16 w-16 bg-slate-900/40 border-2 border-dashed border-indigo-500/40 rounded-2xl flex items-center justify-center text-indigo-400 text-3xl font-black shadow-inner">
                    🃏
                  </div>
                  <span className="text-xs font-semibold text-indigo-400/80 tracking-wide">Dealer draws, then you draw. High card wins 2x!</span>
                </div>
              )}

              {clashState === 'deal' && dealerCard && (
                <div className="flex flex-col items-center space-y-2 z-10">
                  <div className="text-[10px] font-bold text-indigo-400 uppercase font-mono tracking-wider">DEALER DRAWN CARD</div>
                  <motion.div
                    initial={{ scale: 0.5, rotateY: 180 }}
                    animate={{ scale: 1, rotateY: 0 }}
                    className="h-20 w-14 bg-gradient-to-br from-white to-slate-100 border border-slate-200 rounded-xl shadow-xl flex flex-col items-center justify-center font-black text-slate-800"
                  >
                    <span className="text-red-500 text-sm leading-none">{dealerCard.suite}</span>
                    <span className="text-lg leading-none mt-1">{dealerCard.name}</span>
                  </motion.div>
                  <span className="text-xs text-rose-400 font-extrabold animate-pulse uppercase tracking-wider">DRAW YOUR CARD TO CLASH!</span>
                </div>
              )}

              {clashState === 'clashed' && dealerCard && playerCard && (
                <div className="flex items-center gap-6 z-10 bg-slate-950/70 backdrop-blur-md p-4 rounded-2xl border border-indigo-500/20 shadow-xl">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">DEALER</span>
                    <motion.div 
                      initial={{ rotateY: 180 }} 
                      animate={{ rotateY: 0 }} 
                      className="h-16 w-12 bg-white border rounded-lg flex flex-col justify-center items-center text-slate-700 font-black"
                    >
                      <span className="text-xs text-red-500 leading-none">{dealerCard.suite}</span>
                      <span className="text-xs leading-none mt-0.5">{dealerCard.name}</span>
                    </motion.div>
                  </div>
                  
                  <motion.span 
                    animate={{ scale: [1, 1.3, 1] }}
                    className="text-xs font-mono font-black text-indigo-400 uppercase tracking-widest"
                  >
                    VS
                  </motion.span>
                  
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase">YOU</span>
                    <motion.div 
                      initial={{ scale: 0, rotateY: 180 }} 
                      animate={{ scale: 1, rotateY: 0 }} 
                      transition={{ type: "spring", stiffness: 220 }}
                      className="h-16 w-12 bg-indigo-50 border-2 border-indigo-500 rounded-lg flex flex-col justify-center items-center text-slate-900 font-black shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                    >
                      <span className="text-xs text-blue-600 leading-none">{playerCard.suite}</span>
                      <span className="text-xs leading-none mt-0.5">{playerCard.name}</span>
                    </motion.div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 w-full z-10">
              {clashState === 'idle' && (
                <button
                  onClick={dealCardClash}
                  className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-extrabold shadow-md transition-all uppercase tracking-wider"
                >
                  Deal Dealer Card
                </button>
              )}
              {clashState === 'deal' && (
                <button
                  onClick={drawCardClash}
                  className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-extrabold shadow-md transition-all uppercase tracking-wider"
                >
                  Draw My Card
                </button>
              )}
              {clashState === 'clashed' && (
                <button
                  onClick={() => setClashState('idle')}
                  className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-xl text-xs font-extrabold shadow-md transition-all uppercase tracking-wider"
                >
                  Reset Table
                </button>
              )}
            </div>
          </div>
        );

      case 'treasure_box':
        return (
          <div className="space-y-4 text-center flex flex-col items-center">
            <div className="w-full bg-slate-950 rounded-2xl border border-slate-850 p-4 shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[220px]">
              <PremiumDisplayBackground theme="amber" />
              {!boxActive ? (
                <div className="flex flex-col items-center justify-center space-y-3 z-10">
                  <div className="h-16 w-16 bg-slate-900/40 border-2 border-dashed border-amber-500/40 rounded-2xl flex items-center justify-center text-amber-400 text-3xl font-black shadow-inner">
                    📦
                  </div>
                  <button
                    onClick={startTreasureBox}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold shadow-md transition-all uppercase tracking-wider"
                  >
                    Initialize Chest Vault
                  </button>
                </div>
              ) : (
                <div className="space-y-4 w-full z-10">
                  <div className="flex justify-between items-center text-xs font-mono font-bold bg-slate-950/60 backdrop-blur-md p-2 rounded-xl border border-amber-500/10">
                    <span className="text-amber-400">VAULT MULTIPLIER: {boxAccumMultiplier}x</span>
                    <button onClick={cashoutBox} className="px-3 py-1 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-extrabold uppercase text-[10px]">
                      Cash out
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 max-w-[200px] mx-auto">
                    {boxGrid.map((box) => (
                      <motion.button
                        key={box.id}
                        onClick={() => clickBox(box.id)}
                        whileTap={{ scale: 0.9 }}
                        whileHover={!box.revealed ? { scale: 1.05 } : {}}
                        className={`h-12 rounded-xl border flex flex-col items-center justify-center font-bold text-xs transition-all ${
                          box.revealed 
                            ? box.hasBomb 
                              ? 'bg-rose-500 border-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.6)]' 
                              : 'bg-emerald-950/60 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                            : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-amber-500'
                        }`}
                      >
                        {box.revealed ? (box.hasBomb ? '💥' : `x${box.mult}`) : '📦'}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'puzzle_arena':
        return (
          <div className="space-y-4 text-center flex flex-col items-center">
            <div className="w-full bg-slate-950 rounded-2xl border border-slate-850 p-4 shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[220px]">
              <PremiumDisplayBackground theme="indigo" />
              {!puzzleActive ? (
                <div className="flex flex-col items-center justify-center space-y-3 z-10">
                  <div className="h-16 w-16 bg-slate-900/40 border-2 border-dashed border-indigo-500/40 rounded-2xl flex items-center justify-center text-indigo-400 text-3xl font-black shadow-inner">
                    🧩
                  </div>
                  <button
                    onClick={startPuzzle}
                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-extrabold shadow-md transition-all uppercase tracking-wider"
                  >
                    Deploy Slide Matrix
                  </button>
                </div>
              ) : (
                <div className="space-y-4 w-full z-10">
                  <div className="flex justify-between items-center text-xs font-bold font-mono bg-slate-950/60 backdrop-blur-md p-2 rounded-xl border border-indigo-500/10">
                    <span className="text-rose-400 flex items-center gap-1">
                      <Timer className="h-4 w-4" /> Clock: {puzzleTimer}s
                    </span>
                    <button
                      onClick={autoSolvePuzzle}
                      className="px-2.5 py-0.5 bg-slate-800 text-white rounded font-mono text-[9px] hover:bg-slate-700 transition-colors uppercase font-bold"
                    >
                      Auto Solve
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 w-48 mx-auto bg-slate-900/60 p-2 rounded-2xl border border-indigo-500/20 shadow-xl">
                    {puzzleGrid.map((num, idx) => (
                      <motion.button
                        key={idx}
                        onClick={() => handlePuzzleClick(idx)}
                        whileTap={{ scale: 0.92 }}
                        className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-xs border transition-all ${
                          num === 0 
                            ? 'border-dashed border-slate-800 bg-slate-950 text-transparent' 
                            : 'border-slate-800 bg-slate-900 text-indigo-400 hover:border-indigo-400'
                        }`}
                      >
                        {num}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'quiz_battle':
        return (
          <div className="space-y-4 text-center flex flex-col items-center">
            <div className="w-full bg-slate-950 rounded-2xl border border-slate-850 p-4 shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[220px]">
              <PremiumDisplayBackground theme="sky" />
              {quizState === 'idle' && (
                <div className="flex flex-col items-center justify-center space-y-3 z-10">
                  <div className="h-16 w-16 bg-slate-900/40 border-2 border-dashed border-sky-500/40 rounded-2xl flex items-center justify-center text-sky-400 text-3xl font-black shadow-inner">
                    🧠
                  </div>
                  <button
                    onClick={startQuiz}
                    className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-extrabold shadow-md transition-all uppercase tracking-wider"
                  >
                    Trivia Matchmaker
                  </button>
                </div>
              )}

              {quizState === 'active' && (
                <div className="space-y-4 w-full z-10">
                  <div className="flex justify-between text-xs font-bold font-mono bg-slate-950/60 backdrop-blur-md p-2 rounded-xl border border-sky-500/10">
                    <span className="text-rose-400 flex items-center gap-1">
                      <Timer className="h-4 w-4" /> Clock: {quizTimer}s
                    </span>
                    <span className="text-cyan-400">Quest: {quizIndex + 1}/3</span>
                  </div>

                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-left">
                    <h4 className="text-xs font-extrabold text-white leading-relaxed">{mockQuestions[quizIndex].q}</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {mockQuestions[quizIndex].a.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => answerQuiz(opt)}
                        className="p-2.5 border border-slate-800 bg-slate-900 rounded-xl font-bold text-[10px] text-slate-300 hover:border-cyan-500 transition-all"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {quizState === 'resolved' && (
                <div className="space-y-2 z-10">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                  <h4 className="font-extrabold text-xs text-white">Battle Concluded</h4>
                  <p className="text-[11px] text-slate-400 font-mono">Score: {quizScore}/3</p>
                  <button onClick={() => setQuizState('idle')} className="px-4 py-1.5 bg-cyan-500 text-white rounded-lg text-[10px] font-bold mt-2 uppercase tracking-wide">
                    Play Again
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'number_rush':
        return (
          <div className="space-y-4 text-center flex flex-col items-center">
            <div className="w-full bg-slate-950 rounded-2xl border border-slate-850 p-4 shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[220px]">
              <PremiumDisplayBackground theme="rose" />
              {!rushActive ? (
                <div className="flex flex-col items-center justify-center space-y-3 z-10">
                  <div className="h-16 w-16 bg-slate-900/40 border-2 border-dashed border-rose-500/40 rounded-2xl flex items-center justify-center text-rose-400 text-3xl font-black shadow-inner">
                    ⚡
                  </div>
                  <button
                    onClick={startRush}
                    className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-extrabold shadow-md transition-all uppercase tracking-wider"
                  >
                    Activate Rush
                  </button>
                </div>
              ) : (
                <div className="space-y-4 w-full z-10">
                  <div className="flex justify-between items-center text-xs font-bold bg-slate-950/60 backdrop-blur-md p-2 rounded-xl border border-rose-500/10 font-mono">
                    <span className="text-rose-400 flex items-center gap-1">
                      <Timer className="h-4 w-4" /> Timer: {rushTimer}s
                    </span>
                    <span className="text-emerald-400">Next Target: {rushTarget}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 w-56 mx-auto bg-slate-900/60 p-2 rounded-2xl border border-rose-500/20 shadow-xl">
                    {rushGrid.map((num, idx) => (
                      <motion.button
                        key={idx}
                        onClick={() => clickRushNumber(num)}
                        whileTap={{ scale: 0.9 }}
                        className={`h-10 rounded-lg font-bold font-mono text-xs border transition-all ${
                          num < rushTarget 
                            ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-rose-500'
                        }`}
                      >
                        {num}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'fortune_draw':
        return (
          <div className="space-y-4 text-center flex flex-col items-center">
            <div className="w-full bg-slate-950 rounded-2xl border border-slate-850 p-4 shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[220px]">
              <PremiumDisplayBackground theme="emerald" />
              {!scratchActive ? (
                <div className="flex flex-col items-center justify-center space-y-3 z-10">
                  <div className="h-16 w-16 bg-slate-900/40 border-2 border-dashed border-emerald-500/40 rounded-2xl flex items-center justify-center text-emerald-400 text-3xl font-black shadow-inner">
                    🎟️
                  </div>
                  <button
                    onClick={startScratch}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold shadow-md transition-all uppercase tracking-wider"
                  >
                    Scratch Ticket
                  </button>
                </div>
              ) : (
                <div className="space-y-4 w-full z-10">
                  <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-mono font-black">Scratch all blocks. Match 3 to win!</p>
                  
                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto bg-slate-900/40 p-2 rounded-2xl border border-emerald-500/10 shadow-xl">
                    {scratchedItems.map((scratched, idx) => (
                      <motion.button
                        key={idx}
                        onClick={() => scratchCell(idx)}
                        whileHover={!scratched ? { scale: 1.05 } : {}}
                        className={`h-12 border rounded-xl font-bold flex items-center justify-center text-xs transition-all ${
                          scratched 
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400 font-mono font-extrabold shadow-inner shadow-[inset_0_0_8px_rgba(16,185,129,0.5)]' 
                            : 'bg-gradient-to-br from-slate-700 to-slate-850 border-slate-600 text-white font-mono font-bold animate-pulse'
                        }`}
                      >
                        {scratched ? (
                          <motion.span
                            initial={{ scale: 0.4 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                          >
                            x{scratchMults[idx]}
                          </motion.span>
                        ) : (
                          '🎁 RUB'
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const adjustBet = (multiplier: number) => {
    setBetAmount(prev => {
      const computed = parseFloat((prev * multiplier).toFixed(2));
      return Math.max(1, Math.min(currentUser.balance, computed));
    });
  };

  const setMaxBet = () => {
    setBetAmount(parseFloat((currentUser.balance).toFixed(2)));
  };

  // --- GAME 1: DICE GAME (Real-time Period drawing handled inline) ---

  // --- GAME 2: LUCKY NUMBER ---
  const playLuckyNumber = () => {
    if (luckyRolling) return;
    setLuckyRolling(true);
    setLuckyResult(null);

    setTimeout(() => {
      let rolled = Math.floor(Math.random() * 10);

      // Admin Control / Rigging Override
      if (currentUser?.nextLuckyResult) {
        if (currentUser.nextLuckyResult === 'win') {
          rolled = selectedLuckyNum;
        } else if (currentUser.nextLuckyResult === 'lose') {
          let tries = 0;
          while (rolled === selectedLuckyNum && tries < 50) {
            rolled = Math.floor(Math.random() * 10);
            tries++;
          }
          if (rolled === selectedLuckyNum) {
            rolled = (selectedLuckyNum + 1) % 10;
          }
        } else if (currentUser.nextLuckyResult !== 'random') {
          const targetNum = parseInt(currentUser.nextLuckyResult);
          if (!isNaN(targetNum) && targetNum >= 0 && targetNum <= 9) {
            rolled = targetNum;
          }
        }
      }

      setLuckyResult(rolled);
      setLuckyRolling(false);

      const win = rolled === selectedLuckyNum;
      const multiplier = win ? 9.0 : 0;
      const winnings = win ? betAmount * multiplier : 0;
      playGame('lucky_number', betAmount, multiplier, `Rolled: ${rolled}`, winnings);

      // Consume/Reset Rigging on Firestore
      if (currentUser?.nextLuckyResult && currentUser.nextLuckyResult !== 'random') {
        adminUpdateUserProfile(currentUser.id, { nextLuckyResult: 'random' }).catch(console.error);
      }
    }, 1200);
  };

  // --- GAME 3: SPIN WHEEL ---
  const playSpinWheel = () => {
    if (wheelSpinning) return;
    setWheelSpinning(true);
    setWheelResult(null);

    // Multiplier segments on wheel
    const segments = [
      { label: 'x0 (Bust)', mult: 0 },
      { label: 'x1.5 (Match)', mult: 1.5 },
      { label: 'x5 (Super)', mult: 5 },
      { label: 'x0.5 (Half)', mult: 0.5 },
      { label: 'x10 (MEGA)', mult: 10 },
      { label: 'x2.0 (Double)', mult: 2 },
      { label: 'x0 (Bust)', mult: 0 },
      { label: 'x1.5 (Match)', mult: 1.5 },
    ];

    let randomIndex = Math.floor(Math.random() * segments.length);

    // Admin Control / Rigging Override
    if (currentUser?.nextSpinResult && currentUser.nextSpinResult !== 'random') {
      if (currentUser.nextSpinResult === 'win') {
        const winningIndices = segments
          .map((s, idx) => s.mult >= 1.5 ? idx : -1)
          .filter(idx => idx !== -1);
        if (winningIndices.length > 0) {
          randomIndex = winningIndices[Math.floor(Math.random() * winningIndices.length)];
        }
      } else if (currentUser.nextSpinResult === 'lose') {
        const losingIndices = segments
          .map((s, idx) => s.mult < 1.0 ? idx : -1)
          .filter(idx => idx !== -1);
        if (losingIndices.length > 0) {
          randomIndex = losingIndices[Math.floor(Math.random() * losingIndices.length)];
        }
      } else {
        const matchingIndices = segments
          .map((s, idx) => s.label === currentUser.nextSpinResult ? idx : -1)
          .filter(idx => idx !== -1);
        if (matchingIndices.length > 0) {
          randomIndex = matchingIndices[Math.floor(Math.random() * matchingIndices.length)];
        }
      }
    }

    const degreeIncrement = 360 / segments.length;
    const targetRotation = wheelRotation + 1440 + (randomIndex * degreeIncrement); // 4 full spins + offset
    setWheelRotation(targetRotation);

    setTimeout(() => {
      setWheelSpinning(false);
      const landed = segments[randomIndex];
      setWheelResult(landed.label);

      const winnings = parseFloat((betAmount * landed.mult).toFixed(2));
      playGame('spin_wheel', betAmount, landed.mult, `Segment: ${landed.label}`, winnings);

      // Consume/Reset Rigging on Firestore
      if (currentUser?.nextSpinResult && currentUser.nextSpinResult !== 'random') {
        adminUpdateUserProfile(currentUser.id, { nextSpinResult: 'random' }).catch(console.error);
      }
    }, 2500);
  };

  // --- GAME 4: COIN FLIP ---
  const playCoinFlip = () => {
    if (coinFlipping) return;
    setCoinFlipping(true);
    setCoinResult(null);

    setTimeout(() => {
      let roll = Math.random() > 0.5 ? 'Heads' : 'Tails';

      // Admin Control / Rigging Override
      if (currentUser?.nextCoinFlipResult) {
        if (currentUser.nextCoinFlipResult === 'win') {
          roll = selectedCoinSide;
        } else if (currentUser.nextCoinFlipResult === 'lose') {
          roll = selectedCoinSide === 'Heads' ? 'Tails' : 'Heads';
        } else if (currentUser.nextCoinFlipResult === 'Heads' || currentUser.nextCoinFlipResult === 'Tails') {
          roll = currentUser.nextCoinFlipResult;
        }
      }

      setCoinResult(roll as 'Heads' | 'Tails');
      setCoinFlipping(false);

      const win = roll === selectedCoinSide;
      const multiplier = win ? 1.95 : 0;
      const winnings = win ? betAmount * multiplier : 0;
      playGame('coin_flip', betAmount, multiplier, `Landed: ${roll}`, winnings);

      // Consume/Reset Rigging on Firestore
      if (currentUser?.nextCoinFlipResult && currentUser.nextCoinFlipResult !== 'random') {
        adminUpdateUserProfile(currentUser.id, { nextCoinFlipResult: 'random' }).catch(console.error);
      }
    }, 1500);
  };

  // --- GAME 5: COLOR MATCH ---
  const playColorMatch = () => {
    if (colorSpinning) return;
    setColorSpinning(true);
    setInnerColor('');
    setOuterColor('');

    const colors = ['Red', 'Blue', 'Gold'];
    setTimeout(() => {
      let inner = colors[Math.floor(Math.random() * colors.length)];
      let outer = colors[Math.floor(Math.random() * colors.length)];

      // Admin rigging for Color Match
      if (currentUser?.nextColorMatchResult) {
        if (currentUser.nextColorMatchResult === 'win') {
          inner = selectedColorMatch;
          outer = selectedColorMatch;
        } else if (currentUser.nextColorMatchResult === 'lose') {
          let tries = 0;
          while (inner === outer && tries < 50) {
            inner = colors[Math.floor(Math.random() * colors.length)];
            outer = colors[Math.floor(Math.random() * colors.length)];
            tries++;
          }
          if (inner === outer) {
            inner = 'Red';
            outer = 'Blue';
          }
        } else if (colors.includes(currentUser.nextColorMatchResult)) {
          inner = currentUser.nextColorMatchResult;
          outer = currentUser.nextColorMatchResult;
        }
      }

      setInnerColor(inner);
      setOuterColor(outer);
      setColorSpinning(false);

      const isMatch = inner === outer;
      const matchesSelected = inner === selectedColorMatch && isMatch;
      let multiplier = 0;
      if (matchesSelected) {
        multiplier = selectedColorMatch === 'Gold' ? 10.0 : 4.0;
      } else if (isMatch) {
        multiplier = 2.0;
      }

      const winnings = betAmount * multiplier;
      playGame('color_match', betAmount, multiplier, `Match: ${inner} / ${outer}`, winnings);

      // Consume/Reset Rigging on Firestore
      if (currentUser?.nextColorMatchResult && currentUser.nextColorMatchResult !== 'random') {
        adminUpdateUserProfile(currentUser.id, { nextColorMatchResult: 'random' }).catch(console.error);
      }
    }, 1500);
  };

  // --- GAME 6: LUCKY SEVEN ---
  const playLuckySeven = () => {
    if (sevenRolling) return;
    setSevenRolling(true);
    setSevenResultSum(null);

    setTimeout(() => {
      let dice1 = Math.floor(Math.random() * 6) + 1;
      let dice2 = Math.floor(Math.random() * 6) + 1;
      let dice3 = Math.floor(Math.random() * 6) + 1;
      let sum = dice1 + dice2 + dice3;

      // Admin rigging for Lucky Seven
      if (currentUser?.nextLuckySevenResult) {
        if (currentUser.nextLuckySevenResult === 'win') {
          let found = false;
          let tries = 0;
          while (!found && tries < 100) {
            dice1 = Math.floor(Math.random() * 6) + 1;
            dice2 = Math.floor(Math.random() * 6) + 1;
            dice3 = Math.floor(Math.random() * 6) + 1;
            if (dice1 + dice2 + dice3 === 7) {
              sum = 7;
              found = true;
            }
            tries++;
          }
          if (!found) { dice1 = 2; dice2 = 2; dice3 = 3; sum = 7; }
        } else if (currentUser.nextLuckySevenResult === 'lose') {
          let tries = 0;
          while (sum === 7 && tries < 50) {
            dice1 = Math.floor(Math.random() * 6) + 1;
            dice2 = Math.floor(Math.random() * 6) + 1;
            dice3 = Math.floor(Math.random() * 6) + 1;
            sum = dice1 + dice2 + dice3;
            tries++;
          }
          if (sum === 7) { dice1 = 1; dice2 = 1; dice3 = 1; sum = 3; }
        }
      }

      setDiceRolls([dice1, dice2, dice3]);
      setSevenResultSum(sum);
      setSevenRolling(false);

      let multiplier = 0;
      if (sum === 7) multiplier = 5.0;
      else if (sum > 7) multiplier = 1.4;
      else multiplier = 1.4;

      const winnings = betAmount * multiplier;
      playGame('lucky_seven', betAmount, multiplier, `Sum: ${sum}`, winnings);

      // Consume/Reset Rigging on Firestore
      if (currentUser?.nextLuckySevenResult && currentUser.nextLuckySevenResult !== 'random') {
        adminUpdateUserProfile(currentUser.id, { nextLuckySevenResult: 'random' }).catch(console.error);
      }
    }, 1500);
  };

  // --- GAME 7: CARD CLASH ---
  const dealCardClash = () => {
    if (clashState !== 'idle') return;
    setClashState('deal');

    const suites = ['♠', '♥', '♦', '♣'];
    const rIdxDealer = Math.floor(Math.random() * 13) + 2; // 2 to 14
    const dCard = { suite: suites[Math.floor(Math.random() * 4)], value: rIdxDealer, name: getCardName(rIdxDealer) };
    setDealerCard(dCard);
  };

  const drawCardClash = () => {
    if (clashState !== 'deal') return;

    const suites = ['♠', '♥', '♦', '♣'];
    let rIdxPlayer = Math.floor(Math.random() * 13) + 2;

    // Admin rigging for Card Clash
    if (currentUser?.nextCardClashResult) {
      const dealerVal = dealerCard?.value || 0;
      if (currentUser.nextCardClashResult === 'win') {
        if (dealerVal >= 14) {
          if (dealerCard) {
            dealerCard.value = 13;
            dealerCard.name = 'King';
          }
        }
        let tries = 0;
        while (rIdxPlayer <= (dealerCard?.value || 0) && tries < 50) {
          rIdxPlayer = Math.floor(Math.random() * 13) + 2;
          tries++;
        }
        if (rIdxPlayer <= (dealerCard?.value || 0)) {
          rIdxPlayer = 14;
        }
      } else if (currentUser.nextCardClashResult === 'lose') {
        let tries = 0;
        while (rIdxPlayer > dealerVal && tries < 50) {
          rIdxPlayer = Math.floor(Math.random() * 13) + 2;
          tries++;
        }
        if (rIdxPlayer > dealerVal) {
          rIdxPlayer = 2;
        }
      }
    }

    const pCard = { suite: suites[Math.floor(Math.random() * 4)], value: rIdxPlayer, name: getCardName(rIdxPlayer) };
    setPlayerCard(pCard);
    setClashState('clashed');

    const win = pCard.value > (dealerCard?.value || 0);
    const multiplier = win ? 2.0 : 0;
    const winnings = win ? betAmount * multiplier : 0;
    
    playGame('card_clash', betAmount, multiplier, `Clash: ${pCard.name} vs ${dealerCard?.name}`, winnings);

    // Consume/Reset Rigging on Firestore
    if (currentUser?.nextCardClashResult && currentUser.nextCardClashResult !== 'random') {
      adminUpdateUserProfile(currentUser.id, { nextCardClashResult: 'random' }).catch(console.error);
    }
  };

  const getCardName = (val: number) => {
    if (val === 11) return 'Jack';
    if (val === 12) return 'Queen';
    if (val === 13) return 'King';
    if (val === 14) return 'Ace';
    return val.toString();
  };

  // --- GAME 8: TREASURE BOX (Minesweeper Multipliers) ---
  const startTreasureBox = () => {
    // Initialize 9 boxes: 2 have bombs, others have multipliers
    const grid = Array.from({ length: 9 }).map((_, i) => ({
      id: i,
      hasBomb: i === 2 || i === 7, // fixed for simple simulation
      revealed: false,
      mult: i === 0 || i === 4 ? 1.5 : i === 1 || i === 5 ? 1.2 : 1.1
    }));
    setBoxGrid(grid);
    setBoxActive(true);
    setBoxAccumMultiplier(1.0);
    setBoxBusted(false);
  };

  const clickBox = (id: number) => {
    if (!boxActive || boxBusted) return;
    let box = boxGrid[id];
    if (box.revealed) return;

    let updatedGrid = [...boxGrid];

    // Admin rigging for Treasure Box
    if (currentUser?.nextTreasureBoxResult) {
      if (currentUser.nextTreasureBoxResult === 'win') {
        if (box.hasBomb) {
          const unrevealedNonBombIdx = updatedGrid.findIndex(b => b.id !== id && !b.revealed && !b.hasBomb);
          if (unrevealedNonBombIdx !== -1) {
            updatedGrid[id].hasBomb = false;
            updatedGrid[unrevealedNonBombIdx].hasBomb = true;
          } else {
            updatedGrid[id].hasBomb = false;
          }
        }
      } else if (currentUser.nextTreasureBoxResult === 'lose') {
        if (!box.hasBomb) {
          updatedGrid = updatedGrid.map(b => b.id === id ? { ...b, hasBomb: true } : { ...b, hasBomb: false });
        }
      }
    }

    box = updatedGrid[id];
    updatedGrid[id].revealed = true;
    setBoxGrid(updatedGrid);

    if (box.hasBomb) {
      setBoxBusted(true);
      setBoxActive(false);
      playGame('treasure_box', betAmount, 0, 'Busted on Bomb', 0);

      if (currentUser?.nextTreasureBoxResult && currentUser.nextTreasureBoxResult !== 'random') {
        adminUpdateUserProfile(currentUser.id, { nextTreasureBoxResult: 'random' }).catch(console.error);
      }
    } else {
      const nextMult = parseFloat((boxAccumMultiplier * box.mult).toFixed(2));
      setBoxAccumMultiplier(nextMult);
    }
  };

  const cashoutBox = () => {
    if (!boxActive || boxBusted) return;
    setBoxActive(false);
    const winnings = parseFloat((betAmount * boxAccumMultiplier).toFixed(2));
    playGame('treasure_box', betAmount, boxAccumMultiplier, `Collected x${boxAccumMultiplier}`, winnings);

    if (currentUser?.nextTreasureBoxResult && currentUser.nextTreasureBoxResult !== 'random') {
      adminUpdateUserProfile(currentUser.id, { nextTreasureBoxResult: 'random' }).catch(console.error);
    }
  };

  // --- GAME 9: PUZZLE ARENA (15 Puzzle sliding 3x3) ---
  const startPuzzle = () => {
    // Scaffold scrambled solvable puzzle
    const scramble = [4, 1, 3, 2, 0, 6, 7, 5, 8]; // custom solvable scrambling
    setPuzzleGrid(scramble);
    setPuzzleActive(true);
    setPuzzleWon(false);
    setPuzzleTimer(45);

    if (puzzleIntervalRef.current) clearInterval(puzzleIntervalRef.current);
    puzzleIntervalRef.current = setInterval(() => {
      setPuzzleTimer(prev => {
        if (prev <= 1) {
          clearInterval(puzzleIntervalRef.current!);
          setPuzzleActive(false);
          playGame('puzzle_arena', betAmount, 0, 'Puzzle timeout', 0);

          if (currentUser?.nextPuzzleArenaResult && currentUser.nextPuzzleArenaResult !== 'random') {
            adminUpdateUserProfile(currentUser.id, { nextPuzzleArenaResult: 'random' }).catch(console.error);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePuzzleClick = (index: number) => {
    if (!puzzleActive) return;
    const emptyIndex = puzzleGrid.indexOf(0);
    const validMoves = [
      emptyIndex - 1, emptyIndex + 1,
      emptyIndex - 3, emptyIndex + 3
    ];

    // Prevent grid wraps on rows
    if (emptyIndex % 3 === 0 && index === emptyIndex - 1) return;
    if (emptyIndex % 3 === 2 && index === emptyIndex + 1) return;

    if (validMoves.includes(index)) {
      const newGrid = [...puzzleGrid];
      newGrid[emptyIndex] = puzzleGrid[index];
      newGrid[index] = 0;
      setPuzzleGrid(newGrid);

      const isForcedWin = currentUser?.nextPuzzleArenaResult === 'win';
      const isForcedLoss = currentUser?.nextPuzzleArenaResult === 'lose';

      if (newGrid.join(',') === '1,2,3,4,5,6,7,8,0' && isForcedLoss) {
        // Prevent winning by shuffling it back
        setPuzzleGrid([4, 1, 3, 2, 0, 6, 7, 5, 8]);
        return;
      }

      // Check win order [1,2,3,4,5,6,7,8,0]
      if (newGrid.join(',') === '1,2,3,4,5,6,7,8,0' || isForcedWin) {
        if (isForcedWin) {
          setPuzzleGrid([1, 2, 3, 4, 5, 6, 7, 8, 0]);
        }
        setPuzzleWon(true);
        setPuzzleActive(false);
        if (puzzleIntervalRef.current) clearInterval(puzzleIntervalRef.current);
        playGame('puzzle_arena', betAmount, 4.0, 'Puzzle solved!', betAmount * 4.0);

        if (currentUser?.nextPuzzleArenaResult && currentUser.nextPuzzleArenaResult !== 'random') {
          adminUpdateUserProfile(currentUser.id, { nextPuzzleArenaResult: 'random' }).catch(console.error);
        }
      }
    }
  };

  // Developer auto-solve hack helper to let users easily win for evaluation purposes
  const autoSolvePuzzle = () => {
    if (!puzzleActive) return;

    const isForcedLoss = currentUser?.nextPuzzleArenaResult === 'lose';
    if (isForcedLoss) {
      // Force it to remain unsolved
      setPuzzleGrid([4, 1, 3, 2, 0, 6, 7, 5, 8]);
      return;
    }

    const solved = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    setPuzzleGrid(solved);
    setPuzzleWon(true);
    setPuzzleActive(false);
    if (puzzleIntervalRef.current) clearInterval(puzzleIntervalRef.current);
    playGame('puzzle_arena', betAmount, 4.0, 'Puzzle solved (Auto)!', betAmount * 4.0);

    if (currentUser?.nextPuzzleArenaResult && currentUser.nextPuzzleArenaResult !== 'random') {
      adminUpdateUserProfile(currentUser.id, { nextPuzzleArenaResult: 'random' }).catch(console.error);
    }
  };

  // --- GAME 10: QUIZ BATTLE (Trivia Challenge) ---
  const startQuiz = () => {
    setQuizIndex(0);
    setQuizScore(0);
    setQuizTimer(15);
    setQuizState('active');

    if (quizIntervalRef.current) clearInterval(quizIntervalRef.current);
    quizIntervalRef.current = setInterval(() => {
      setQuizTimer(prev => {
        if (prev <= 1) {
          resolveQuiz(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const answerQuiz = (ans: string) => {
    if (quizState !== 'active') return;
    const currentQ = mockQuestions[quizIndex];
    let nextScore = quizScore;
    if (ans === currentQ.correct) {
      nextScore += 1;
      setQuizScore(nextScore);
    }

    if (quizIndex < mockQuestions.length - 1) {
      setQuizIndex(prev => prev + 1);
    } else {
      resolveQuiz(nextScore);
    }
  };

  const resolveQuiz = (finalScore: number) => {
    setQuizState('resolved');
    if (quizIntervalRef.current) clearInterval(quizIntervalRef.current);

    let actualScore = finalScore;
    if (currentUser?.nextQuizBattleResult === 'win') {
      actualScore = 3;
      setQuizScore(3);
    } else if (currentUser?.nextQuizBattleResult === 'lose') {
      actualScore = 0;
      setQuizScore(0);
    }

    let mult = 0;
    if (actualScore === 3) mult = 3.0;
    else if (actualScore === 2) mult = 1.5;

    const winnings = betAmount * mult;
    playGame('quiz_battle', betAmount, mult, `Quiz Score: ${actualScore}/3`, winnings);

    if (currentUser?.nextQuizBattleResult && currentUser.nextQuizBattleResult !== 'random') {
      adminUpdateUserProfile(currentUser.id, { nextQuizBattleResult: 'random' }).catch(console.error);
    }
  };

  // --- GAME 11: NUMBER RUSH (Speed ascending order) ---
  const startRush = () => {
    // Generate randomized list of 1 to 16
    const numbers = Array.from({ length: 16 }).map((_, i) => i + 1);
    const scrambled = numbers.sort(() => Math.random() - 0.5);
    setRushGrid(scrambled);
    setRushTarget(1);
    setRushActive(true);
    setRushTimer(20);

    if (rushIntervalRef.current) clearInterval(rushIntervalRef.current);
    rushIntervalRef.current = setInterval(() => {
      setRushTimer(prev => {
        if (prev <= 1) {
          clearInterval(rushIntervalRef.current!);
          setRushActive(false);
          playGame('number_rush', betAmount, 0, 'Rush Timeout', 0);

          if (currentUser?.nextNumberRushResult && currentUser.nextNumberRushResult !== 'random') {
            adminUpdateUserProfile(currentUser.id, { nextNumberRushResult: 'random' }).catch(console.error);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clickRushNumber = (num: number) => {
    if (!rushActive) return;

    const isForcedWin = currentUser?.nextNumberRushResult === 'win';
    const isForcedLoss = currentUser?.nextNumberRushResult === 'lose';

    if (isForcedLoss) {
      // Any clicks fail
      return;
    }

    if (num === rushTarget || isForcedWin) {
      const next = isForcedWin ? 17 : rushTarget + 1;
      setRushTarget(next);
      if (next > 16) {
        setRushActive(false);
        if (rushIntervalRef.current) clearInterval(rushIntervalRef.current);
        playGame('number_rush', betAmount, 3.0, 'Rush Completed!', betAmount * 3.0);

        if (currentUser?.nextNumberRushResult && currentUser.nextNumberRushResult !== 'random') {
          adminUpdateUserProfile(currentUser.id, { nextNumberRushResult: 'random' }).catch(console.error);
        }
      }
    }
  };

  // --- GAME 12: FORTUNE DRAW (Scratch Multipliers) ---
  const startScratch = () => {
    setScratchedItems([false, false, false, false, false, false]);
    // Randomize matching lists
    const sets = [
      [1.5, 1.5, 2, 5, 1.5, 10], // Matches 1.5 (pays 1.5x)
      [5, 5, 2, 5, 1.5, 10],     // Matches 5 (pays 5x)
      [2, 0.5, 2, 2, 10, 50],    // Matches 2 (pays 2x)
      [0.5, 0.5, 0.5, 1.5, 2, 5] // matches 0.5 (pays 0.5)
    ];
    let selectedSet = sets[Math.floor(Math.random() * sets.length)];

    if (currentUser?.nextFortuneDrawResult) {
      if (currentUser.nextFortuneDrawResult === 'win') {
        const winningSets = [
          [1.5, 1.5, 2, 5, 1.5, 10],
          [5, 5, 2, 5, 1.5, 10],
          [2, 0.5, 2, 2, 10, 50]
        ];
        selectedSet = winningSets[Math.floor(Math.random() * winningSets.length)];
      } else if (currentUser.nextFortuneDrawResult === 'lose') {
        selectedSet = [0.5, 1.5, 2, 5, 10, 50]; // No matches of 3!
      }
    }

    setScratchMults(selectedSet);
    setScratchActive(true);
  };

  const scratchCell = (index: number) => {
    if (!scratchActive || scratchedItems[index]) return;
    const updated = [...scratchedItems];
    updated[index] = true;
    setScratchedItems(updated);

    // If all scratchable elements have been rubbed off, resolve the results
    if (updated.filter(i => i).length === 6) {
      setScratchActive(false);
      // Count duplicates
      const counts: Record<number, number> = {};
      scratchMults.forEach(val => {
        counts[val] = (counts[val] || 0) + 1;
      });

      let winningMult = 0;
      Object.entries(counts).forEach(([multStr, count]) => {
        if (count >= 3) {
          winningMult = parseFloat(multStr);
        }
      });

      const winnings = betAmount * winningMult;
      playGame('fortune_draw', betAmount, winningMult, `Scratch Match: ${winningMult}x`, winnings);

      if (currentUser?.nextFortuneDrawResult && currentUser.nextFortuneDrawResult !== 'random') {
        adminUpdateUserProfile(currentUser.id, { nextFortuneDrawResult: 'random' }).catch(console.error);
      }
    }
  };

  if (modalOnly) {
    return (
      <AnimatePresence>
        {selectedGameId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="glass rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              {/* Grand high-fidelity animated game loader system */}
              <AnimatePresence>
                {loadingGameId && (
                  <motion.div 
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="absolute inset-0 z-40"
                  >
                    <GameLoader 
                      gameId={loadingGameId}
                      gameName={games.find(g => g.id === loadingGameId)?.name || 'Game Cabinet'}
                      rtp={games.find(g => g.id === loadingGameId)?.rtp}
                      progress={loadingProgress}
                      status={loadingStatus}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dynamic canvas celebration / disappointment overlay layer */}
              <GameCelebrationCanvas 
                type={celebration} 
                onClose={() => setCelebration(null)} 
                winAmount={celebrationWinnings} 
                multiplier={celebrationMult} 
              />
            
            {/* Cabinet Top Header */}
            <div className="p-4 border-b border-slate-150 dark:border-slate-850 flex justify-between items-center bg-slate-50 dark:bg-slate-900/40">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-sm">
                  🎮
                </span>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-white">
                    {games.find(g => g.id === selectedGameId)?.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 capitalize">Category: {games.find(g => g.id === selectedGameId)?.category}</p>
                </div>
              </div>

              <button 
                onClick={handleCloseCabinet}
                className="p-1 text-slate-400 hover:text-slate-600"
                id="btn-close-cabinet"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Main Interactive Cabinet Board (Scrollable) */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              
              {currentUser?.lockedGames?.includes(selectedGameId) ? (
                <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 max-w-md mx-auto">
                  <div className="h-16 w-16 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl flex items-center justify-center text-3xl animate-bounce" style={{ animationDuration: '3s' }}>
                    🔒
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider font-mono">
                      Game Under Maintenance
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">CODE: SYSTEM_LOCK_ENG_042</p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    This high-fidelity cabinet terminal has been administratively locked or is undergoing regulatory system updates. Access has been restricted for your profile ledger.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseCabinet();
                      alert("Please navigate to the SUPPORT tab on the top menu bar to chat with our 24/7 Verified Support.");
                    }}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Contact Support Chat
                  </button>
                </div>
              ) : (
                <>
                  {/* --- GAME BOARD RENDERS --- */}
                  {renderGameContent(selectedGameId)}
                </>
              )}

            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return null;
};
