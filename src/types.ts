export interface UserProfile {
  id: string;
  username: string;
  email: string;
  phone: string;
  avatar: string;
  status: 'active' | 'suspended';
  balance: number;
  bonusBalance: number;
  referralCode: string;
  password?: string;
  referredBy?: string;
  referrerCode?: string;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  createdAt: string;
  role?: 'user' | 'admin' | 'support' | 'super_admin';
  creditScore?: number;
  totalWagered?: number;
  adminCode?: string;
  taskProgress?: string;
  expectedCommission?: string;
  expectedCommissionType?: 'automatic' | 'manual';
  spinLocked?: boolean;
  tasksLocked?: boolean;
  lockedGames?: string[];
  nextSpinResult?: string;
  nextLuckyResult?: string;
  nextDiceResult?: string;
  nextDiceTimeSlot?: string;
  nextDiceWinPercentage?: number | null;
  nextDiceLossPercentage?: number | null;
  nextCoinFlipResult?: string;
  nextColorMatchResult?: string;
  nextLuckySevenResult?: string;
  nextCardClashResult?: string;
  nextTreasureBoxResult?: string;
  nextPuzzleArenaResult?: string;
  nextQuizBattleResult?: string;
  nextNumberRushResult?: string;
  nextFortuneDrawResult?: string;
  diceOverrides?: Record<string, {
    outcome: 'win' | 'lose' | 'random';
    target?: string;
    winPct?: number;
    lossPct?: number;
  }>;
}

export interface BankAccount {
  id: string;
  userId: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  routingCode: string;
  status: 'verified' | 'pending';
  createdAt: string;
}

export interface LoginSession {
  id: string;
  userId?: string;
  ip: string;
  device: string;
  location: string;
  timestamp: string;
  status: 'success' | 'failed';
}

export interface Transaction {
  id: string;
  userId: string;
  username: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'referral' | 'credit_adjustment' | 'jackpot_purchase';
  amount: number;
  status: 'pending' | 'completed' | 'rejected' | 'approved';
  reference: string;
  date: string;
  description: string;
  gateway?: string;
  method?: string;
  payoutAddress?: string;
  rejectionReason?: string;
  timestamp?: string;
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referredId: string;
  referredUsername: string;
  referredAvatar: string;
  earnings: number;
  joinedAt: string;
  status: 'active' | 'completed';
}

export interface DiceSchedule {
  timeSlot: string; // "HH:MM" e.g. "14:35" which is a 5-minute interval start
  output: string; // "random" | "win" | "lose" | "3" | "4" | ... | "18"
  winPercentage: number; // 0 to 100
  jackpotMoney: number; // bonus money to add
}

export interface Game {
  id: string;
  name: string;
  description: string;
  category: string;
  rtp: number; // Return To Player %
  totalBets: number;
  totalVolume: number;
  isActive: boolean;
  minBet: number;
  maxBet: number;
  isLocked?: boolean;
  lockReason?: string;
  diceSchedules?: DiceSchedule[];
  winningPercentage?: number;
  jackpotMoney?: number;
  manualResult?: string;
  manualTimer?: number;
  manualProfitRate?: number;
  globalDiceOverrides?: Record<string, {
    outcome: 'win' | 'lose' | 'random';
    target?: string;
    winPct?: number;
    lossPct?: number;
    isRepeating?: boolean;
  }>;
}

export interface BetRecord {
  id: string;
  gameId: string;
  gameName: string;
  userId: string;
  username: string;
  betAmount: number;
  winAmount: number;
  multiplier: number;
  outcome: string; // e.g. "Heads", "Red 7", "Win"
  date: string;
  status: 'win' | 'loss' | 'pending';
}

export interface SupportMessage {
  id: string;
  sender: 'user' | 'support';
  senderName: string;
  text: string;
  timestamp: string;
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
  isAuto?: boolean;
}

export interface SupportTicket {
  id: string;
  userId: string;
  username: string;
  title: string;
  category: 'wallet' | 'games' | 'account' | 'technical' | 'other';
  status: 'open' | 'assigned' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
  userIsTyping?: boolean;
  supportIsTyping?: boolean;
  rating?: number;
  feedback?: string;
  agentName?: string;
  takenByAdmin?: boolean;
  adminReplied?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'promotion' | 'event';
  date: string;
  isActive: boolean;
  bannerImage?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface AppNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'account' | 'wallet' | 'referral' | 'system' | 'achievement' | 'support';
  isRead: boolean;
  timestamp: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface JackpotTicket {
  id: string;
  userId: string;
  username: string;
  ticketNumber: string;
  price: number;
  purchaseDate: string;
  status: 'pending' | 'won' | 'lost';
}
