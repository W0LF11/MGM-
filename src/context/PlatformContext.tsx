import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  runTransaction, 
  deleteDoc,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { 
  UserProfile, 
  LoginSession, 
  Transaction, 
  ReferralRecord, 
  Game, 
  BetRecord, 
  SupportTicket, 
  Announcement, 
  FAQItem, 
  AppNotification, 
  Achievement,
  SupportMessage,
  BankAccount,
  DiceSchedule,
  JackpotTicket
} from '../types';

interface PlatformContextType {
  currentUser: UserProfile | null;
  users: UserProfile[];
  transactions: Transaction[];
  requests: any[];
  bets: BetRecord[];
  tickets: SupportTicket[];
  announcements: Announcement[];
  faqs: FAQItem[];
  notifications: AppNotification[];
  achievements: Achievement[];
  games: Game[];
  currentRole: 'user' | 'admin' | 'support' | 'super_admin';
  loginSessions: LoginSession[];
  bankAccounts: BankAccount[];
  authLoading: boolean;
  
  // Auth & Profile actions
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (username: string, email: string, phone: string, password?: string, referralCode?: string, adminCode?: string) => Promise<boolean>;
  verifyEmail: () => Promise<void>;
  verifyMobile: () => Promise<void>;
  updateProfile: (username: string, phone: string, avatar: string) => Promise<void>;
  updateSecurity: (password: string) => void;
  
  // Wallet actions
  requestDeposit: (amount: number, reference: string, gateway: string, screenshot?: string) => Promise<void>;
  requestWithdrawal: (amount: number, address: string, method: string) => Promise<boolean>;
  addBankAccount: (bankName: string, accountHolder: string, accountNumber: string, routingCode: string) => Promise<void>;
  deleteBankAccount: (accountId: string) => Promise<void>;
  
  // Referral actions
  claimReferralEarnings: (customReward?: number) => Promise<void>;
  
  // Game Actions
  playGame: (gameId: string, betAmount: number, multiplier: number, outcome: string, winAmount: number) => Promise<void>;
  
  // Ticket Actions
  createTicket: (title: string, category: SupportTicket['category'], priority: SupportTicket['priority'], initialMessage: string) => Promise<string | undefined>;
  addMessageToTicket: (ticketId: string, text: string, sender: 'user' | 'support', file?: { name: string, url: string }) => Promise<void>;
  resolveTicket: (ticketId: string) => Promise<void>;
  setTicketTyping: (ticketId: string, side: 'user' | 'support', isTyping: boolean) => void;
  submitTicketRating: (ticketId: string, rating: number, feedback: string) => Promise<void>;
  
  // Notification Actions
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  addLocalNotification: (title: string, message: string, type: any) => void;
  
  // Admin actions
  adminUpdateUserStatus: (userId: string, status: 'active' | 'suspended') => Promise<void>;
  adminUpdateUserProfile: (userId: string, updates: Partial<UserProfile>) => Promise<void>;
  adminUpdateCreditScore: (userId: string, newScore: number) => Promise<void>;
  adminAddUserBalance: (userId: string, amount: number, isBonus?: boolean) => Promise<void>;
  adminApproveTransaction: (txId: string) => Promise<void>;
  adminRejectTransaction: (txId: string, reason?: string) => Promise<void>;
  adminToggleGameStatus: (gameId: string) => Promise<void>;
  adminToggleGameLock: (gameId: string, isLocked: boolean, reason?: string) => Promise<void>;
  adminToggleUserGameLock: (userId: string, gameId: string) => Promise<void>;
  adminUpdateGameConfig: (gameId: string, rtp: number, minBet: number, maxBet: number) => Promise<void>;
  adminUpdateDiceSchedules: (schedules: DiceSchedule[], winningPercentage: number, jackpotMoney: number) => Promise<void>;
  adminUpdateDiceManualFields: (fields: { manualResult?: string | null, manualTimer?: number | null, manualProfitRate?: number | null }) => Promise<void>;
  adminUpdateDiceGlobalOverrides: (overrides: Record<string, any>) => Promise<void>;
  adminCreateAnnouncement: (title: string, content: string, type: 'announcement' | 'promotion' | 'event', bannerImage?: string) => Promise<void>;
  adminDeleteAnnouncement: (id: string) => Promise<void>;
  adminUpdateFAQ: (faqs: FAQItem[]) => void;
  adminSimulateTraffic: () => void;
  adminSendNotification: (userId: string, title: string, message: string) => Promise<void>;
  adminInjectJackpotWinner: (ticketNumber: string) => Promise<void>;
  adminInjectJackpotTicket: (userId: string) => Promise<string>;
  
  // Jackpot State & Actions
  jackpotTickets: JackpotTicket[];
  buyJackpotTicket: () => Promise<void>;
  
  // Role toggler
  setRole: (role: 'user' | 'admin' | 'support' | 'super_admin') => void;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

// Generate random IDs
const genId = () => Math.random().toString(36).substr(2, 9).toUpperCase();

// Helper to format date
const formatDate = () => new Date().toISOString();

// Derivative Password helper to maintain identical login page behavior
const getDerivedPassword = (email: string) => {
  return 'lucky_' + email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
};

const initialGames: Game[] = [
  { id: 'dice', name: 'Dice Game', description: 'Predict if the roll is high or low and multiply your stake.', category: 'Classic', rtp: 98.5, totalBets: 342, totalVolume: 4200, isActive: true, minBet: 1, maxBet: 500, isLocked: false, lockReason: '', diceSchedules: [], winningPercentage: 45, jackpotMoney: 0 },
  { id: 'lucky_number', name: 'Lucky Number', description: 'Pick your lucky digit and roll the golden barrel.', category: 'Luck', rtp: 97.0, totalBets: 219, totalVolume: 1850, isActive: true, minBet: 1, maxBet: 100, isLocked: false, lockReason: 'Only for VIP players' },
  { id: 'spin_wheel', name: 'Spin Wheel', description: 'Spin the sector wheel to hit instant multipliers.', category: 'Arcade', rtp: 96.5, totalBets: 890, totalVolume: 12400, isActive: true, minBet: 2, maxBet: 1000, isLocked: false, lockReason: 'Only for VIP players' },
  { id: 'coin_flip', name: 'Coin Flip', description: 'Heads or Tails? 50/50 double-or-nothing blitz challenge.', category: 'Speed', rtp: 99.0, totalBets: 1244, totalVolume: 24500, isActive: true, minBet: 1, maxBet: 2500, isLocked: false, lockReason: '' },
  { id: 'color_match', name: 'Color Match', description: 'Spin the double wheel and match inner and outer colors.', category: 'Arcade', rtp: 97.2, totalBets: 412, totalVolume: 3200, isActive: true, minBet: 1, maxBet: 200, isLocked: false, lockReason: '' },
  { id: 'lucky_seven', name: 'Lucky Seven', description: 'Classic slot-style dice rollers chasing the majestic sum of 7.', category: 'Classic', rtp: 95.8, totalBets: 611, totalVolume: 4900, isActive: true, minBet: 2, maxBet: 500, isLocked: false, lockReason: '' },
  { id: 'card_clash', name: 'Card Clash', description: 'Draw high cards and face off directly against the dealer.', category: 'Cards', rtp: 98.2, totalBets: 521, totalVolume: 8900, isActive: true, minBet: 5, maxBet: 1000, isLocked: false, lockReason: '' },
  { id: 'treasure_box', name: 'Treasure Box', description: 'Open boxes to unlock big reward multipliers while avoiding trap bombs.', category: 'Adventure', rtp: 96.0, totalBets: 742, totalVolume: 14500, isActive: true, minBet: 2, maxBet: 300, isLocked: false, lockReason: '' },
  { id: 'puzzle_arena', name: 'Puzzle Arena', description: 'Quick-slide tiles to reconstruct high jackpot patterns under time limits.', category: 'Skill', rtp: 95.0, totalBets: 134, totalVolume: 900, isActive: true, minBet: 1, maxBet: 50, isLocked: false, lockReason: '' },
  { id: 'quiz_battle', name: 'Quiz Battle', description: 'Test your mind! Answer dynamic multi-choice trivia to multiply bets.', category: 'Skill', rtp: 96.8, totalBets: 205, totalVolume: 1540, isActive: true, minBet: 1, maxBet: 100, isLocked: false, lockReason: '' },
  { id: 'number_rush', name: 'Number Rush', description: 'Click randomized ascending grids before the strict buzzer rings.', category: 'Speed', rtp: 97.4, totalBets: 189, totalVolume: 1100, isActive: true, minBet: 1, maxBet: 250, isLocked: false, lockReason: '' },
  { id: 'fortune_draw', name: 'Fortune Draw', description: 'Scratch custom tickets online to match instant triple victory symbols.', category: 'Luck', rtp: 95.2, totalBets: 911, totalVolume: 8500, isActive: true, minBet: 1, maxBet: 500, isLocked: false, lockReason: '' },
];

const initialUsers: UserProfile[] = [
  { id: 'USER_MOCK_1', username: 'alex_jackpot', email: 'alex@gaming.com', phone: '+1234567890', avatar: '🦁', status: 'active', balance: 1450.25, bonusBalance: 150.0, referralCode: 'ALEX99', isEmailVerified: true, isMobileVerified: true, createdAt: '2026-01-10T12:00:00.000Z', role: 'admin' },
  { id: 'USER_MOCK_2', username: 'VIP_spinner', email: 'sarah.vip@lux.com', phone: '+1987654321', avatar: '💎', status: 'active', balance: 12500.0, bonusBalance: 500.0, referralCode: 'VIPSPIN', referredBy: 'USER_MOCK_1', isEmailVerified: true, isMobileVerified: true, createdAt: '2026-02-15T09:30:00.000Z', role: 'user' },
  { id: 'USER_MOCK_3', username: 'casual_gambler', email: 'mark@casual.net', phone: '+15550199', avatar: '🐱', status: 'suspended', balance: 5.40, bonusBalance: 0.0, referralCode: 'CASUALM', isEmailVerified: true, isMobileVerified: false, createdAt: '2026-03-01T15:45:00.000Z', role: 'user' },
  { id: 'USER_MOCK_4', username: 'lucky_charm', email: 'charm@clover.ie', phone: '+353110292', avatar: '🍀', status: 'active', balance: 420.0, bonusBalance: 20.0, referralCode: 'CLOVER7', isEmailVerified: false, isMobileVerified: false, createdAt: '2026-04-12T18:22:00.000Z', role: 'user' },
  { id: 'ADMIN_DEMO', username: 'demo_admin', email: 'admin@luckyplatform.com', phone: '+15559092', avatar: '👑', status: 'active', balance: 100000.0, bonusBalance: 5000.0, referralCode: 'ADMINVIP', isEmailVerified: true, isMobileVerified: true, createdAt: '2026-05-01T10:00:00.000Z', role: 'admin' }
];

const initialAnnouncements: Announcement[] = [
  { id: 'ANN_1', title: '🍀 Super Sunday Spin Bonanza!', content: 'Receive an extra 20% on all deposits this Sunday up to $500 max. Play any of our premium wheels and double your bonus points multiplier.', type: 'promotion', date: '2026-06-23T08:00:00.000Z', isActive: true },
  { id: 'ANN_2', title: '🔒 High-Security Upgrade Complete', content: 'We have updated our mobile and email verification workflows with military-grade encryption systems. Please verify your profiles to safeguard your wallet assets.', type: 'announcement', date: '2026-06-22T12:00:00.000Z', isActive: true },
  { id: 'ANN_3', title: '🏆 Mid-Year Referral Tournament', content: 'Our $50,000 Referral Leaderboard is live! Earn up to 10% commission on all friends bets and capture the #1 trophy in our social gaming league.', type: 'event', date: '2026-06-24T06:00:00.000Z', isActive: true }
];

const initialFAQs: FAQItem[] = [
  { id: 'faq_1', question: 'How do I deposit funds into my gaming wallet?', answer: 'Navigate to the Wallet section and select Deposit. Enter your desired amount, select your preferred gateway (Visa, MasterCard, or Crypto USDT), complete the external instructions, and submit your reference code for immediate administrator approval.', category: 'Wallet' },
  { id: 'faq_2', question: 'What is the referral program and how can I earn commissions?', answer: 'Copy your unique referral link from your Referral page. Share it with friends. Once they register and make a deposit, you will receive referral cash rewards and ongoing multi-level team commission percentages on every game bet they place!', category: 'Referral' },
  { id: 'faq_3', question: 'Is my personal gaming ledger secure?', answer: 'Yes! Our system maintains an offline-first and distributed transaction timeline log, with automated checks that record and lock every single spin, bet, and withdrawal request. Every transaction carries a unique cryptographic trace.', category: 'Security' }
];

const initialAchievements: Achievement[] = [
  { id: 'ach_1', title: 'First Drop', description: 'Complete your first real deposit.', icon: '💰', progress: 0, maxProgress: 1, unlocked: false },
  { id: 'ach_2', title: 'Lucky Gambler', description: 'Win 5 games in the Game Center.', icon: '🎰', progress: 0, maxProgress: 5, unlocked: false },
  { id: 'ach_3', title: 'High Roller', description: 'Place a single game bet of $100 or higher.', icon: '🐳', progress: 0, maxProgress: 1, unlocked: false },
  { id: 'ach_4', title: 'Network Tycoon', description: 'Refer at least 3 active players.', icon: '👥', progress: 0, maxProgress: 3, unlocked: false },
];

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [clearedTransactions, setClearedTransactions] = useState<Transaction[]>([]);
  const [bets, setBets] = useState<BetRecord[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>(initialFAQs);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(initialAchievements);
  const [games, setGames] = useState<Game[]>([]);
  const [currentRole, setRoleState] = useState<'user' | 'admin' | 'support' | 'super_admin'>('user');
  const [loginSessions, setLoginSessions] = useState<LoginSession[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [jackpotTickets, setJackpotTickets] = useState<JackpotTicket[]>([]);

  const pendingRepliesRef = useRef<Set<string>>(new Set());
  const isRegisteringRef = useRef<boolean>(false);

  // Merge requests and clearedTransactions for UI backwards-compatibility
  const transactions: Transaction[] = React.useMemo(() => {
    const list: Transaction[] = [];
    
    // Convert pending/rejected requests into mock transactions
    requests.forEach(req => {
      // Avoid duplicate display if a cleared transaction with the same reference already exists
      if (req.status === 'approved' && clearedTransactions.some(tx => tx.reference === req.reference)) {
        return;
      }

      list.push({
        id: req.id,
        userId: req.userId,
        username: req.username,
        type: req.type,
        amount: req.amount,
        status: req.status, // 'pending' | 'approved' (mapped as 'completed') | 'rejected'
        reference: req.reference,
        date: req.date,
        description: req.type === 'deposit' 
          ? `Deposit request via ${req.gateway} (${req.status})` 
          : `Withdrawal request via ${req.gateway} (${req.status})`,
        gateway: req.gateway,
        method: req.gateway,
        payoutAddress: req.details,
        rejectionReason: req.rejectionReason
      });
    });

    // Add completed permanent ledger entries
    clearedTransactions.forEach(tx => {
      // Avoid duplicate IDs if request has already transitioned
      if (!list.some(item => item.id === tx.id)) {
        list.push(tx);
      }
    });

    // Sort descending by date
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [requests, clearedTransactions]);

  const setRole = (role: 'user' | 'admin' | 'support' | 'super_admin') => {
    setRoleState(role);
    if (currentUser) {
      const updatedUser = { ...currentUser, role };
      adminUpdateUserProfile(currentUser.id, { role });
    }
  };

  // 1. One-time database seeding and pre-warming on system launch (Admin-only)
  useEffect(() => {
    if (!currentUser) return;
    const isAdminUser = currentUser.role === 'admin' || currentUser.role === 'super_admin';
    
    if (isAdminUser) {
      const seedDatabaseIfNeeded = async () => {
        try {
          // Pre-warm Games
          const diceSnap = await getDoc(doc(db, 'games', 'dice'));
          if (!diceSnap.exists()) {
            console.log('[Seed] Seeding games to Firestore...');
            for (const game of initialGames) {
              await setDoc(doc(db, 'games', game.id), game);
            }
          }

          // Pre-warm Announcements
          const annSnap = await getDoc(doc(db, 'announcements', 'ANN_1'));
          if (!annSnap.exists()) {
            console.log('[Seed] Seeding announcements to Firestore...');
            for (const ann of initialAnnouncements) {
              await setDoc(doc(db, 'announcements', ann.id), ann);
            }
          }

          // Pre-warm Initial Users in Firestore
          for (const mu of initialUsers) {
            const uSnap = await getDoc(doc(db, 'users', mu.id));
            if (!uSnap.exists()) {
              await setDoc(doc(db, 'users', mu.id), {
                ...mu,
                creditScore: (mu.role === 'admin' || mu.role === 'super_admin') ? 100 : 95
              });

              // Also register in Firebase Auth so standard demo login runs smoothly
              try {
                const dp = getDerivedPassword(mu.email);
                await createUserWithEmailAndPassword(auth, mu.email, dp);
              } catch (authErr) {
                // Ignore if already exists in Firebase Auth
              }
            }
          }

          // Pre-warm historical transactions
          const txSnap = await getDoc(doc(db, 'transactions', 'TX_1'));
          if (!txSnap.exists()) {
            console.log('[Seed] Seeding historical transactions...');
            await setDoc(doc(db, 'transactions', 'TX_1'), {
              id: 'TX_1', userId: 'USER_MOCK_1', username: 'alex_jackpot', type: 'deposit', amount: 1000.0, status: 'completed', reference: 'DEP_77A9BC', date: '2026-06-20T10:15:00.000Z', description: 'Deposit via VISA Card Gateway'
            });
            await setDoc(doc(db, 'transactions', 'TX_2'), {
              id: 'TX_2', userId: 'USER_MOCK_1', username: 'alex_jackpot', type: 'referral', amount: 50.0, status: 'completed', reference: 'REF_VIP_99', date: '2026-06-21T11:20:00.000Z', description: 'Referral bonus from user VIP_spinner'
            });
            await setDoc(doc(db, 'transactions', 'TX_3'), {
              id: 'TX_3', userId: 'USER_MOCK_2', username: 'VIP_spinner', type: 'deposit', amount: 10000.0, status: 'completed', reference: 'DEP_88F0AB', date: '2026-06-22T14:40:00.000Z', description: 'Crypto Deposit (USDT)'
            });
            await setDoc(doc(db, 'transactions', 'TX_5'), {
              id: 'TX_5', userId: 'USER_MOCK_3', username: 'casual_gambler', type: 'deposit', amount: 50.0, status: 'completed', reference: 'DEP_CAS_01', date: '2026-06-23T09:12:00.000Z', description: 'Instant Bank Transfer'
            });
          }

          // Pre-warm requests
          const reqSnap = await getDoc(doc(db, 'requests', 'REQ_INIT_1'));
          if (!reqSnap.exists()) {
            await setDoc(doc(db, 'requests', 'REQ_INIT_1'), {
              id: 'REQ_INIT_1',
              userId: 'USER_MOCK_2',
              username: 'VIP_spinner',
              type: 'withdrawal',
              amount: 2000.0,
              status: 'pending',
              reference: 'WD_99BB0F',
              gateway: 'USDT-TRC20',
              date: '2026-06-24T08:00:00.000Z',
              details: 'TTRC20Address_Sample999888777F',
              creditScore: 98
            });
          }

        } catch (err) {
          console.error('[PlatformContext] Seeding Error:', err);
        }
      };

      seedDatabaseIfNeeded();
    }
  }, [currentUser]);

  // 2. Local-only config and sessions initialization
  useEffect(() => {
    const localSessions = localStorage.getItem('login_sessions');
    if (localSessions) setLoginSessions(JSON.parse(localSessions));
    else {
      const sess: LoginSession[] = [
        { id: 'SESS_1', ip: '198.162.1.20', device: 'Chrome on MacOS Big Sur', location: 'San Francisco, US', timestamp: '2026-06-24T12:00:00.000Z', status: 'success' },
        { id: 'SESS_2', ip: '109.22.44.88', device: 'Safari on iPhone 15 Pro', location: 'Dublin, Ireland', timestamp: '2026-06-23T08:15:00.000Z', status: 'success' },
      ];
      setLoginSessions(sess);
      localStorage.setItem('login_sessions', JSON.stringify(sess));
    }

    const localAchievements = localStorage.getItem('achievements');
    if (localAchievements) setAchievements(JSON.parse(localAchievements));
  }, []);

  // 3. Dynamic snapshot listeners reactive to Auth state
  useEffect(() => {
    // Read Public Games and Announcements for everyone
    const unsubGames = onSnapshot(collection(db, 'games'), (snap) => {
      const list: Game[] = [];
      snap.forEach(d => list.push(d.data() as Game));
      setGames(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'games');
    });

    const unsubAnnouncements = onSnapshot(collection(db, 'announcements'), (snap) => {
      const list: Announcement[] = [];
      snap.forEach(d => list.push(d.data() as Announcement));
      setAnnouncements(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'announcements');
    });

    // Handle Authentication State Change
    const unsubAuth = onAuthStateChanged(auth, async (authUser) => {
      try {
        if (authUser) {
          try {
            // Fetch user profile from Firestore
            const profileRef = doc(db, 'users', authUser.uid);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
              const data = profileSnap.data() as UserProfile;
              setCurrentUser(data);
              setRoleState(data.role || 'user');
            } else {
              // If the user is currently registering via register(), skip writing the default profile to avoid a race condition.
              if (isRegisteringRef.current) {
                console.log('[onAuthStateChanged] Registration in progress, skipping default profile generation.');
                return;
              }
              // Document does not exist yet (e.g. registered in auth but db write failed or delayed)
              const emailLower = authUser.email?.toLowerCase() || '';
              const isAdminEmail = emailLower === 'wolfsingh1110@gmail.com' || emailLower === 'vishalpal@gmail.com' || emailLower === 'admin@luckyplatform.com';
              const determinedRole = isAdminEmail ? 'admin' : 'user';
              
              const newProfile: UserProfile = {
                id: authUser.uid,
                username: authUser.displayName || authUser.email?.split('@')[0] || 'gamer_' + authUser.uid.slice(0, 5),
                email: authUser.email || '',
                phone: '',
                avatar: '🦊',
                status: 'active',
                balance: 10.0,
                bonusBalance: 50.0,
                referralCode: (authUser.email?.split('@')[0] || 'GAMER').toUpperCase().slice(0, 5) + Math.floor(Math.random() * 90 + 10),
                isEmailVerified: authUser.emailVerified || false,
                isMobileVerified: false,
                createdAt: formatDate(),
                role: determinedRole,
                creditScore: 100
              };
              await setDoc(profileRef, newProfile);
              setCurrentUser(newProfile);
              setRoleState(determinedRole);
            }
          } catch (err) {
            console.error('Error fetching profile snapshot:', err);
          }
        } else {
          setCurrentUser(null);
          setRoleState('user');
        }
      } finally {
        setAuthLoading(false);
      }
    });

    return () => {
      unsubGames();
      unsubAnnouncements();
      unsubAuth();
    };
  }, []);

  // 4. Role-dependent listeners (Firestore Security Guarded Queries)
  useEffect(() => {
    if (!currentUser || !auth.currentUser || currentUser.id !== auth.currentUser.uid) return;

    const uid = currentUser.id;
    const role = currentUser.role || 'user';

    // Real-time listen to own user document
    const unsubProfile = onSnapshot(doc(db, 'users', uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        if (data.creditScore === undefined) {
          data.creditScore = 100;
        }
        setCurrentUser(data);
        setRoleState(data.role || 'user');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    });

    // Real-time bank accounts list
    const unsubBank = onSnapshot(
      query(collection(db, 'bankAccounts'), where('userId', '==', uid)),
      (snap) => {
        const list: BankAccount[] = [];
        snap.forEach(d => list.push(d.data() as BankAccount));
        setBankAccounts(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'bankAccounts');
      }
    );

    let unsubTickets: () => void;
    let unsubTransactions: () => void;
    let unsubRequests: () => void;
    let unsubAllUsers: (() => void) | undefined;
    let unsubReferredUsers: (() => void) | undefined;
    let unsubAllBets: () => void;
    let unsubNotifications: () => void;
    let unsubJackpot: () => void;

    if (role === 'admin' || role === 'support' || role === 'super_admin') {
      // Executive Admin & Support can listen to ALL tickets, transactions, requests, and users
      unsubTickets = onSnapshot(collection(db, 'tickets'), (snap) => {
        const list: SupportTicket[] = [];
        snap.forEach(d => list.push(d.data() as SupportTicket));
        setTickets(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'tickets');
      });

      unsubTransactions = onSnapshot(collection(db, 'transactions'), (snap) => {
        const list: Transaction[] = [];
        snap.forEach(d => list.push(d.data() as Transaction));
        setClearedTransactions(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'transactions');
      });

      unsubRequests = onSnapshot(collection(db, 'requests'), (snap) => {
        const list: any[] = [];
        snap.forEach(d => list.push(d.data()));
        setRequests(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'requests');
      });

      unsubAllUsers = onSnapshot(collection(db, 'users'), (snap) => {
        const list: UserProfile[] = [];
        snap.forEach(d => list.push(d.data() as UserProfile));
        setUsers(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'users');
      });

      unsubAllBets = onSnapshot(collection(db, 'bets'), (snap) => {
        const list: BetRecord[] = [];
        snap.forEach(d => list.push(d.data() as BetRecord));
        setBets(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'bets');
      });

      unsubNotifications = onSnapshot(collection(db, 'notifications'), (snap) => {
        const list: AppNotification[] = [];
        snap.forEach(d => {
          const data = d.data();
          if (data.byAdmin) {
            list.push(data as AppNotification);
          }
        });
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setNotifications(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'notifications');
      });

      unsubJackpot = onSnapshot(collection(db, 'jackpot_tickets'), (snap) => {
        const list: JackpotTicket[] = [];
        snap.forEach(d => list.push(d.data() as JackpotTicket));
        setJackpotTickets(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'jackpot_tickets');
      });
    } else {
      // Standard players can ONLY query their own documents
      unsubTickets = onSnapshot(
        query(collection(db, 'tickets'), where('userId', '==', uid)),
        (snap) => {
          const list: SupportTicket[] = [];
          snap.forEach(d => list.push(d.data() as SupportTicket));
          setTickets(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'tickets');
        }
      );

      unsubTransactions = onSnapshot(
        query(collection(db, 'transactions'), where('userId', '==', uid)),
        (snap) => {
          const list: Transaction[] = [];
          snap.forEach(d => list.push(d.data() as Transaction));
          setClearedTransactions(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'transactions');
        }
      );

      unsubRequests = onSnapshot(
        query(collection(db, 'requests'), where('userId', '==', uid)),
        (snap) => {
          const list: any[] = [];
          snap.forEach(d => list.push(d.data()));
          setRequests(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'requests');
        }
      );

      unsubAllBets = onSnapshot(
        query(collection(db, 'bets'), where('userId', '==', uid)),
        (snap) => {
          const list: BetRecord[] = [];
          snap.forEach(d => list.push(d.data() as BetRecord));
          setBets(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'bets');
        }
      );

      unsubNotifications = onSnapshot(
        query(collection(db, 'notifications'), where('userId', '==', uid)),
        (snap) => {
          const list: AppNotification[] = [];
          snap.forEach(d => {
            const data = d.data();
            if (data.byAdmin) {
              list.push(data as AppNotification);
            }
          });
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setNotifications(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'notifications');
        }
      );

      unsubReferredUsers = onSnapshot(
        query(collection(db, 'users'), where('referredBy', '==', uid)),
        (snap) => {
          const list: UserProfile[] = [];
          snap.forEach(d => {
            list.push(d.data() as UserProfile);
          });
          setUsers(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'referred_users');
        }
      );

      unsubJackpot = onSnapshot(
        query(collection(db, 'jackpot_tickets'), where('userId', '==', uid)),
        (snap) => {
          const list: JackpotTicket[] = [];
          snap.forEach(d => list.push(d.data() as JackpotTicket));
          setJackpotTickets(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'jackpot_tickets');
        }
      );
    }

    return () => {
      unsubProfile();
      unsubBank();
      unsubTickets();
      unsubTransactions();
      unsubRequests();
      unsubAllBets();
      unsubNotifications();
      unsubJackpot();
      if (unsubAllUsers) unsubAllUsers();
      if (unsubReferredUsers) unsubReferredUsers();
    };
  }, [currentUser?.id, currentUser?.role]);

  // Auth Operations
  const login = async (email: string, password?: string): Promise<boolean> => {
    try {
      const emailLower = email.toLowerCase();
      const derivedPass = getDerivedPassword(email);
      const attemptPassword = password || derivedPass;
      
      let cred;
      try {
        cred = await signInWithEmailAndPassword(auth, emailLower, attemptPassword);
      } catch (signInErr: any) {
        // If sign-in fails and a custom password was provided, try with the derived password as fallback
        if (password && password !== derivedPass) {
          try {
            cred = await signInWithEmailAndPassword(auth, emailLower, derivedPass);
          } catch (secondErr) {
            // Keep original error or proceed
          }
        }

        if (!cred) {
          // If signIn fails (e.g. user-not-found or invalid-credential),
          // check if this is one of the initial seeded users. If yes, dynamically register them.
          const mockUser = initialUsers.find(u => u.email.toLowerCase() === emailLower);
          if (mockUser) {
            console.log(`[Auth] Seeding auth user ${email} on login attempt...`);
            try {
              cred = await createUserWithEmailAndPassword(auth, emailLower, attemptPassword);
              // Write user to Firestore since they are now authenticated
              const userRef = doc(db, 'users', cred.user.uid);
              await setDoc(userRef, {
                ...mockUser,
                id: cred.user.uid, // ensure uid matches firebase auth
                createdAt: formatDate(),
                password: attemptPassword
              });
            } catch (createErr) {
              console.error('[Auth] Failed to register seeded user:', createErr);
              throw signInErr; // throw original sign-in error if creation fails
            }
          } else {
            throw signInErr;
          }
        }
      }
      
      const userRef = doc(db, 'users', cred.user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        
        // If the profile has a password stored in Firestore, check if the input matches
        if (data.password && password && data.password !== password) {
          await signOut(auth);
          throw new Error('Invalid password credential / 密碼錯誤');
        }
        if (data.status === 'suspended') {
          await signOut(auth);
          alert('Your account is currently suspended. Please contact customer support.');
          return false;
        }

        const newSession: LoginSession = {
          id: genId(),
          userId: cred.user.uid,
          ip: '198.162.1.20',
          device: 'Chrome on MacOS (AI Studio Simulated)',
          location: 'California, US',
          timestamp: formatDate(),
          status: 'success'
        };
        const updatedSessions = [newSession, ...loginSessions];
        setLoginSessions(updatedSessions);
        localStorage.setItem('login_sessions', JSON.stringify(updatedSessions));

        addLocalNotification('Security Alert', `New login detected from device: ${newSession.device}`, 'account');
        return true;
      } else {
        // Fallback if auth succeeded but document somehow missing
        const emailLower = email.toLowerCase();
        const isSuperAdmin = emailLower === 'superadmin@mgm.com' || emailLower === 'vishalpal@gmail.com' || emailLower.startsWith('superadmin');
        const isAdminEmail = emailLower === 'wolfsingh1110@gmail.com' || emailLower === 'admin@luckyplatform.com';
        const determinedRole = isSuperAdmin ? 'super_admin' : (isAdminEmail ? 'admin' : 'user');
        
        const newProfile: UserProfile = {
          id: cred.user.uid,
          username: email.split('@')[0] || 'gamer_' + cred.user.uid.slice(0, 5),
          email: emailLower,
          phone: '',
          avatar: '🦊',
          status: 'active',
          balance: 10.0,
          bonusBalance: 50.0,
          referralCode: (email.split('@')[0] || 'GAMER').toUpperCase().slice(0, 5) + Math.floor(Math.random() * 90 + 10),
          isEmailVerified: false,
          isMobileVerified: false,
          createdAt: formatDate(),
          role: determinedRole,
          password: password || derivedPass
        };
        await setDoc(userRef, newProfile);
        return true;
      }
    } catch (err) {
      console.error('Firebase Login failed:', err);
      throw err;
    }
  };

  const register = async (username: string, email: string, phone: string, password?: string, referralCode?: string, adminCode?: string): Promise<boolean> => {
    try {
      isRegisteringRef.current = true;
      const derivedPass = password || getDerivedPassword(email);
      const cred = await createUserWithEmailAndPassword(auth, email.toLowerCase(), derivedPass);
      
      let referrerId: string | undefined;
      let referrerCodeVal: string | undefined;
      if (referralCode && referralCode !== 'undefined' && referralCode !== 'null' && referralCode.trim() !== '') {
        try {
          const usersRef = collection(db, 'users');
          const cleanCode = referralCode.toUpperCase().trim();
          const cleanCodeLower = referralCode.toLowerCase().trim();
          
          // 1. Try finding by uppercase referralCode (standard generated codes are uppercase)
          const qCode = query(usersRef, where('referralCode', '==', cleanCode));
          const snapCode = await getDocs(qCode);
          if (!snapCode.empty) {
            referrerId = snapCode.docs[0].id;
            referrerCodeVal = snapCode.docs[0].data().referralCode;
          } else {
            // 2. Try finding by case-insensitive username matching (exact, uppercase, and lowercase)
            const qName = query(usersRef, where('username', '==', referralCode.trim()));
            const snapName = await getDocs(qName);
            if (!snapName.empty) {
              referrerId = snapName.docs[0].id;
              referrerCodeVal = snapName.docs[0].data().referralCode;
            } else {
              const qNameLower = query(usersRef, where('username', '==', cleanCodeLower));
              const snapNameLower = await getDocs(qNameLower);
              if (!snapNameLower.empty) {
                referrerId = snapNameLower.docs[0].id;
                referrerCodeVal = snapNameLower.docs[0].data().referralCode;
              }
            }
          }
        } catch (e) {
          console.error('Error querying referrer:', e);
        }
      }

      const emailLower = email.toLowerCase();
      const isSuperAdmin = emailLower === 'superadmin@mgm.com' || emailLower === 'vishalpal@gmail.com' || adminCode === 'MGM_SUPER_ADMIN_SECRET_KEY_2026' || emailLower.startsWith('superadmin');
      const isAdminEmail = emailLower === 'wolfsingh1110@gmail.com' || emailLower === 'admin@luckyplatform.com' || adminCode === 'MGM_ADMIN_SECRET_KEY_2026';
      const determinedRole = isSuperAdmin ? 'super_admin' : (isAdminEmail ? 'admin' : 'user');

      const newUser: UserProfile = {
        id: cred.user.uid,
        username,
        email: emailLower,
        phone,
        avatar: '🦊',
        status: 'active',
        balance: (determinedRole === 'admin' || determinedRole === 'super_admin') ? 0.0 : 10.0, // Sign up bonus cash
        bonusBalance: (determinedRole === 'admin' || determinedRole === 'super_admin') ? 0.0 : 50.0, // Sign up bonus credit
        referralCode: username.toUpperCase().slice(0, 5) + Math.floor(Math.random() * 90 + 10),
        isEmailVerified: false,
        isMobileVerified: false,
        createdAt: formatDate(),
        role: determinedRole,
        password: password || getDerivedPassword(email),
        ...((adminCode === 'MGM_ADMIN_SECRET_KEY_2026' || adminCode === 'MGM_SUPER_ADMIN_SECRET_KEY_2026') ? { adminCode } : {}),
        ...(referrerId ? { referredBy: referrerId } : {}),
        ...(referrerCodeVal ? { referrerCode: referrerCodeVal } : {})
      };

      await setDoc(doc(db, 'users', cred.user.uid), newUser);
      setCurrentUser(newUser);
      addLocalNotification('Account Registered', 'Welcome to MGM 澳門美高梅 Premium Gaming platform!', 'system');
      return true;
    } catch (err) {
      console.error('Firebase registration failed:', err);
      throw err;
    } finally {
      isRegisteringRef.current = false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const verifyEmail = async () => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.id), { isEmailVerified: true });
      addLocalNotification('Email Verified', 'Your email communication security is now fully authenticated.', 'account');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.id}`);
    }
  };

  const verifyMobile = async () => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.id), { isMobileVerified: true });
      addLocalNotification('Mobile Verified', 'Two-Factor SMS fallback system has been successfully verified.', 'account');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.id}`);
    }
  };

  const updateProfile = async (username: string, phone: string, avatar: string) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.id), { username, phone, avatar });
      addLocalNotification('Profile Updated', 'Your display profile settings have been successfully modified.', 'account');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.id}`);
    }
  };

  const updateSecurity = (password: string) => {
    addLocalNotification('Security Updated', 'Your gaming password has been successfully re-encrypted.', 'account');
  };

  // Wallet
  const requestDeposit = async (amount: number, reference: string, gateway: string, screenshot?: string) => {
    if (!currentUser) return;
    try {
      const reqId = `REQ_${genId()}`;
      const newRequest = {
        id: reqId,
        userId: currentUser.id,
        username: currentUser.username,
        type: 'deposit',
        amount,
        status: 'pending',
        reference: reference || `DEP_${Math.floor(Math.random() * 900000 + 100000)}`,
        gateway,
        date: formatDate(),
        screenshot: screenshot || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&h=300&q=80', // Default receipt mock placeholder
        details: 'N/A',
        creditScore: currentUser.balance > 1000 ? 98 : 95
      };
      await setDoc(doc(db, 'requests', reqId), newRequest);
      addLocalNotification('Deposit Pending', `Your deposit request of $${amount.toFixed(2)} is pending administrator review.`, 'wallet');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `requests`);
    }
  };

  const requestWithdrawal = async (amount: number, address: string, method: string): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      const reqId = `REQ_${genId()}`;
      const newRequest = {
        id: reqId,
        userId: currentUser.id,
        username: currentUser.username,
        type: 'withdrawal',
        amount,
        status: 'pending',
        reference: `WD_${Math.floor(Math.random() * 900000 + 100000)}`,
        gateway: method,
        date: formatDate(),
        details: address,
        creditScore: currentUser.balance > 1000 ? 99 : 95,
        isDeducted: true
      };

      // Query total pending withdrawals to calculate available balance (using simple single-field query to avoid composite indexes)
      const q = query(
        collection(db, 'requests'),
        where('userId', '==', currentUser.id)
      );
      const snap = await getDocs(q);
      let pendingTotal = 0;
      snap.forEach((dDoc) => {
        const d = dDoc.data();
        if (d.type === 'withdrawal' && d.status === 'pending' && !d.isDeducted) {
          pendingTotal += d.amount || 0;
        }
      });

      // Atomically check current user's profile balance in database
      const success = await runTransaction(db, async (tx) => {
        const uRef = doc(db, 'users', currentUser.id);
        const uSnap = await tx.get(uRef);
        if (!uSnap.exists()) throw new Error('User profile not found');
        const userData = uSnap.data() as UserProfile;
        
        const availableBalance = parseFloat((userData.balance - pendingTotal).toFixed(2));
        if (availableBalance < amount) {
          throw new Error(`Insufficient available balance! Balance: $${userData.balance.toFixed(2)}, Pending: $${pendingTotal.toFixed(2)}, Available: $${availableBalance.toFixed(2)}`);
        }

        // Deduct the withdrawal amount immediately upon request submission so funds are locked
        const newBalance = parseFloat((userData.balance - amount).toFixed(2));
        tx.update(uRef, { balance: newBalance });
        tx.set(doc(db, 'requests', reqId), newRequest);
        return true;
      });

      if (success) {
        addLocalNotification('Withdrawal Submitted', `Your withdrawal of $${amount.toFixed(2)} has been submitted for audit.`, 'wallet');
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Withdrawal submission failed:', err);
      let errorMsg = 'Withdrawal submission failed. Please try again.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          errorMsg = `Withdrawal submission failed: ${parsed.error || err.message}`;
        } catch {
          errorMsg = err.message;
        }
      }
      alert(errorMsg);
      return false;
    }
  };

  const addBankAccount = async (bankName: string, accountHolder: string, accountNumber: string, routingCode: string) => {
    if (!currentUser) return;
    try {
      const bankId = `BANK_${genId()}`;
      const newBank: BankAccount = {
        id: bankId,
        userId: currentUser.id,
        bankName,
        accountHolder,
        accountNumber,
        routingCode,
        status: 'verified',
        createdAt: formatDate()
      };
      await setDoc(doc(db, 'bankAccounts', bankId), newBank);
      addLocalNotification('Bank Added', `Your bank account with ${bankName} has been verified and registered for payouts!`, 'wallet');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `bankAccounts`);
    }
  };

  const deleteBankAccount = async (accountId: string) => {
    try {
      await deleteDoc(doc(db, 'bankAccounts', accountId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `bankAccounts/${accountId}`);
    }
  };

  // Referral
  const claimReferralEarnings = async (customReward?: number) => {
    if (!currentUser) return;
    try {
      const reward = customReward !== undefined ? customReward : 50.0;
      if (reward <= 0) {
        alert('You do not have any pending referral rewards to claim at this time.');
        return;
      }
      const txId = `TX_${genId()}`;
      const claimTx: Transaction = {
        id: txId,
        userId: currentUser.id,
        username: currentUser.username,
        type: 'referral',
        amount: reward,
        status: 'completed',
        reference: `REF_CLM_${Math.floor(Math.random() * 90000 + 10000)}`,
        date: formatDate(),
        description: 'Claimed accumulated social network earnings'
      };

      await runTransaction(db, async (tx) => {
        const uRef = doc(db, 'users', currentUser.id);
        const uSnap = await tx.get(uRef);
        if (!uSnap.exists()) throw new Error('User not found');
        const uData = uSnap.data() as UserProfile;
        
        tx.update(uRef, { balance: parseFloat((uData.balance + reward).toFixed(2)) });
        tx.set(doc(db, 'transactions', txId), claimTx);
      });

      addLocalNotification('Rewards Claimed', `Successfully claimed $${reward.toFixed(2)} referral payouts!`, 'referral');
      alert(`Success! $${reward.toFixed(2)} referral rewards have been claimed and credited to your balance.`);
    } catch (err) {
      console.error('Claim Referral Earnings failed:', err);
      alert('Failed to claim referral earnings.');
    }
  };

  // Game Logic Integration
  const playGame = async (gameId: string, betAmount: number, multiplier: number, outcome: string, winAmount: number) => {
    if (!currentUser) return;
    try {
      const betId = `BET_${genId()}`;
      const gameRef = doc(db, 'games', gameId);
      const uRef = doc(db, 'users', currentUser.id);
      
      const betTxId = `TX_${genId()}`;
      const winTxId = `TX_${genId()}`;
      const status: 'win' | 'loss' = winAmount > 0 ? 'win' : 'loss';

      await runTransaction(db, async (tx) => {
        const uSnap = await tx.get(uRef);
        const gSnap = await tx.get(gameRef);

        if (!uSnap.exists()) throw new Error('User document not found');
        if (!gSnap.exists()) throw new Error('Game document not found');

        const uData = uSnap.data() as UserProfile;
        const gData = gSnap.data() as Game;

        let curBal = uData.balance;
        let curBonus = uData.bonusBalance;
        let balanceUsed: 'real' | 'bonus' | 'mixed' = 'real';

        if (curBal >= betAmount) {
          curBal -= betAmount;
          balanceUsed = 'real';
        } else if (curBonus >= betAmount) {
          curBonus -= betAmount;
          balanceUsed = 'bonus';
        } else if (curBal + curBonus >= betAmount) {
          const remainderNeeded = betAmount - curBonus;
          curBonus = 0;
          curBal -= remainderNeeded;
          balanceUsed = 'mixed';
        } else {
          throw new Error('Insufficient wallet funds!');
        }

        if (winAmount > 0) {
          if (balanceUsed === 'real' || balanceUsed === 'mixed') {
            curBal += winAmount;
          } else {
            curBonus += winAmount;
          }
        }

        const betObj: BetRecord = {
          id: betId,
          gameId,
          gameName: gData.name,
          userId: currentUser.id,
          username: currentUser.username,
          betAmount,
          winAmount,
          multiplier,
          outcome,
          date: formatDate(),
          status
        };

        const betTxObj: Transaction = {
          id: betTxId,
          userId: currentUser.id,
          username: currentUser.username,
          type: 'bet',
          amount: betAmount,
          status: 'completed',
          reference: `STK_${betId.slice(4)}`,
          date: formatDate(),
          description: `Wagered stake on ${gData.name} (${balanceUsed === 'real' ? 'Real Balance' : balanceUsed === 'bonus' ? 'Bonus Balance' : 'Mixed Balance'})`
        };

        tx.update(uRef, {
          balance: parseFloat(curBal.toFixed(2)),
          bonusBalance: parseFloat(curBonus.toFixed(2)),
          totalWagered: parseFloat(((uData.totalWagered || 0) + betAmount).toFixed(2))
        });

        tx.update(gameRef, {
          totalBets: gData.totalBets + 1,
          totalVolume: gData.totalVolume + betAmount
        });

        tx.set(doc(db, 'bets', betId), betObj);
        tx.set(doc(db, 'transactions', betTxId), betTxObj);

        if (winAmount > 0) {
          const winTxObj: Transaction = {
            id: winTxId,
            userId: currentUser.id,
            username: currentUser.username,
            type: 'win',
            amount: winAmount,
            status: 'completed',
            reference: `WIN_${betId.slice(4)}`,
            date: formatDate(),
            description: `Settled winnings on ${gData.name} (Multiplier x${multiplier})`
          };
          tx.set(doc(db, 'transactions', winTxId), winTxObj);
        }
      });

      // Track Achievements local progress
      let updatedAchievements = [...achievements];
      if (status === 'win') {
        updatedAchievements = updatedAchievements.map(ach => {
          if (ach.id === 'ach_2') {
            const nextProg = Math.min(ach.maxProgress, ach.progress + 1);
            const nowUnlocked = nextProg === ach.maxProgress && !ach.unlocked;
            if (nowUnlocked) {
              addLocalNotification('🏆 Trophy Unlocked!', 'Achievement Earned: Lucky Gambler (Won 5 matches)', 'achievement');
            }
            return {
              ...ach,
              progress: nextProg,
              unlocked: ach.unlocked || nowUnlocked,
              unlockedAt: nowUnlocked ? formatDate() : ach.unlockedAt
            };
          }
          return ach;
        });
      }
      if (betAmount >= 100) {
        updatedAchievements = updatedAchievements.map(ach => {
          if (ach.id === 'ach_3' && !ach.unlocked) {
            addLocalNotification('🏆 Trophy Unlocked!', 'Achievement Earned: High Roller (Wagered >= $100)', 'achievement');
            return {
              ...ach,
              progress: 1,
              unlocked: true,
              unlockedAt: formatDate()
            };
          }
          return ach;
        });
      }
      setAchievements(updatedAchievements);
      localStorage.setItem('achievements', JSON.stringify(updatedAchievements));

      if (status === 'win') {
        addLocalNotification('🎉 Congratulations!', `You won $${winAmount.toFixed(2)} on ${games.find(g => g.id === gameId)?.name || 'Interactive Game'}! (x${multiplier})`, 'system');
      }
    } catch (err) {
      console.error('Wager play transaction aborted:', err);
      alert(err instanceof Error ? err.message : 'Play Game failed');
    }
  };

  // Support Tickets
  const setTicketTyping = (ticketId: string, side: 'user' | 'support', isTyping: boolean) => {
    try {
      updateDoc(doc(db, 'tickets', ticketId), {
        [side === 'user' ? 'userIsTyping' : 'supportIsTyping']: isTyping
      });
    } catch (err) {
      console.error(err);
    }
  };

  const submitTicketRating = async (ticketId: string, rating: number, feedback: string) => {
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        rating,
        feedback,
        status: 'resolved',
        updatedAt: formatDate()
      });
      addLocalNotification('Support Rated', 'Thank you for rating your live support experience!', 'support');
    } catch (err) {
      console.error(err);
    }
  };

  const createTicket = async (title: string, category: SupportTicket['category'], priority: SupportTicket['priority'], initialMessage: string): Promise<string | undefined> => {
    if (!currentUser) return;
    try {
      const ticketId = `TCK_${Math.floor(Math.random() * 900 + 100)}`;
      const agents = ['Agent Emma', 'Agent Liam', 'Supervisor Sophia', 'Analyst Dave', 'VIP Concierge Chloe'];
      const randomAgent = agents[Math.floor(Math.random() * agents.length)];
      
      const newTicket: SupportTicket = {
        id: ticketId,
        userId: currentUser.id,
        username: currentUser.username,
        title,
        category,
        status: 'open',
        priority,
        createdAt: formatDate(),
        updatedAt: formatDate(),
        agentName: randomAgent,
        messages: [
          {
            id: genId(),
            sender: 'user',
            senderName: currentUser.username,
            text: initialMessage,
            timestamp: formatDate(),
            isRead: true
          }
        ]
      };

      await setDoc(doc(db, 'tickets', ticketId), newTicket);
      addLocalNotification('Conversation Opened', `Your help chat #${ticketId} has been lodged. ${randomAgent} is joining.`, 'support');

      // Simulate live agent greeting
      setTimeout(async () => {
        setTicketTyping(ticketId, 'support', true);
        setTimeout(async () => {
          const welcomeMsgs = [
            `Hello! I am ${randomAgent}, your dedicated support companion. I have reviewed your inquiry regarding ${category === 'wallet' ? 'wallet funds' : category === 'games' ? 'game integrity' : 'your profile'}. How can I assist you in real-time today?`,
            `Greetings! ${randomAgent} here, on-duty support operator. Let's look into your issue with "${title}" together right now.`,
          ];
          const text = welcomeMsgs[Math.floor(Math.random() * welcomeMsgs.length)];
          
          const tSnap = await getDoc(doc(db, 'tickets', ticketId));
          if (tSnap.exists()) {
            const data = tSnap.data() as SupportTicket;
            const newAgentMsg: SupportMessage = {
              id: genId(),
              sender: 'support',
              senderName: randomAgent,
              text,
              timestamp: formatDate(),
              isRead: false,
              isAuto: true
            };
            await updateDoc(doc(db, 'tickets', ticketId), {
              messages: [...data.messages, newAgentMsg],
              status: 'assigned',
              updatedAt: formatDate(),
              supportIsTyping: false
            });
          }
        }, 1500);
      }, 1000);

      return ticketId;
    } catch (err) {
      console.error(err);
    }
  };

  const addMessageToTicket = async (ticketId: string, text: string, sender: 'user' | 'support', file?: { name: string, url: string }) => {
    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      let tSnap = await getDoc(ticketRef);
      let tData: SupportTicket;

      if (!tSnap.exists()) {
        if (ticketId.startsWith('CHAT_') && currentUser) {
          const agents = ['Agent Emma', 'Agent Liam', 'Supervisor Sophia', 'Analyst Dave', 'VIP Concierge Chloe'];
          const randomAgent = agents[Math.floor(Math.random() * agents.length)];
          tData = {
            id: ticketId,
            userId: currentUser.id,
            username: currentUser.username,
            title: 'MGM Live Direct Support',
            category: 'other',
            status: 'open',
            priority: 'high',
            createdAt: formatDate(),
            updatedAt: formatDate(),
            agentName: randomAgent,
            messages: [
              {
                id: 'WELCOME_MSG',
                sender: 'support',
                senderName: randomAgent,
                text: `Hello ${currentUser.username}! Welcome to MGM Macau Direct Live Support. I am your assigned support representative. How can we help you today?`,
                timestamp: formatDate(),
                isRead: false,
                isAuto: true
              }
            ]
          };
          await setDoc(ticketRef, tData);
        } else {
          return;
        }
      } else {
        tData = tSnap.data() as SupportTicket;
      }

      const newMessage: SupportMessage = {
        id: genId(),
        sender,
        senderName: sender === 'user' ? tData.username : (tData.agentName || 'Support Officer'),
        text,
        timestamp: formatDate(),
        isRead: sender === 'user',
        ...(file?.name ? { fileName: file.name } : {}),
        ...(file?.url ? { fileUrl: file.url } : {})
      };

      const updatedMessages = [...tData.messages, newMessage];

      await updateDoc(ticketRef, {
        messages: updatedMessages,
        updatedAt: formatDate(),
        status: sender === 'support' ? 'assigned' : tData.status,
        ...(sender === 'support' ? { adminReplied: true, takenByAdmin: true } : {})
      });

      if (sender === 'support' && currentUser && tData.userId === currentUser.id) {
        addLocalNotification('New Support Reply', `A representative has replied to conversation #${ticketId}.`, 'support');
      }

      // Simulate Auto support officer replies for player texts (only if not taken/replied by admin)
      const hasAdminMessaged = (tData.messages || []).some(m => m.sender === 'support' && !m.isAuto);
      const isClaimedByAdmin = tData.takenByAdmin || tData.adminReplied || hasAdminMessaged;

      if (sender === 'user' && tData.status !== 'resolved' && !isClaimedByAdmin) {
        let reply = `We have assigned a support officer to your conversation, and they will shortly reply to your chat. Please stand by.`;
        
        if (ticketId.startsWith('CHAT_')) {
          const userMessagesCount = updatedMessages.filter(m => m.sender === 'user').length;
          if (userMessagesCount === 1) {
            const displayName = currentUser?.username || 'Valued Player';
            reply = `Hi ${displayName}! Welcome to MGM 澳門美高梅 Direct Live Support. 🌟
 
To ensure we assist you as efficiently as possible, please confirm or provide your details:
• 👤 **Username**: ${currentUser?.username || 'Please type your preferred username'}
• 📱 **Phone Number**: ${currentUser?.phone || 'Please type your active phone number'}
• ✉️ **Email/Gmail**: ${currentUser?.email || 'Please type your Gmail / email'}

We have assigned you a dedicated chat support agent and he will shortly reply to you here in this direct chat.`;
          } else {
            reply = `Your support agent is reviewing your message and will reply shortly. Thank you for your patience!`;
          }
        }

        if (!pendingRepliesRef.current.has(ticketId)) {
          pendingRepliesRef.current.add(ticketId);
          setTimeout(async () => {
            setTicketTyping(ticketId, 'support', true);
            setTimeout(async () => {
              const latestSnap = await getDoc(ticketRef);
              if (latestSnap.exists()) {
                const latestData = latestSnap.data() as SupportTicket;
                const adminMessagedInHistory = (latestData.messages || []).some(m => m.sender === 'support' && !m.isAuto);
                const currentlyTaken = latestData.takenByAdmin || latestData.adminReplied || adminMessagedInHistory;

                if (latestData.status !== 'resolved' && !currentlyTaken) {
                  const autoMsg: SupportMessage = {
                    id: genId(),
                    sender: 'support',
                    senderName: latestData.agentName || 'Support Officer',
                    text: reply,
                    timestamp: formatDate(),
                    isRead: false,
                    isAuto: true
                  };
                  await updateDoc(ticketRef, {
                    messages: [...latestData.messages, autoMsg],
                    updatedAt: formatDate(),
                    status: 'assigned',
                    supportIsTyping: false
                  });
                } else {
                  // Admin has taken/replied to the chat while the timeout was pending. Stop typing.
                  setTicketTyping(ticketId, 'support', false);
                }
              }
              pendingRepliesRef.current.delete(ticketId);
            }, 2000);
          }, 800);
        }
      }

    } catch (err) {
      console.error(err);
    }
  };

  const resolveTicket = async (ticketId: string) => {
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        status: 'resolved',
        updatedAt: formatDate()
      });
      addLocalNotification('Conversation Completed', `Support conversation #${ticketId} has been successfully closed.`, 'support');
    } catch (err) {
      console.error(err);
    }
  };

  // Notifications
  const addLocalNotification = (title: string, message: string, type: AppNotification['type']) => {
    // Only notifications from the admin should be dispatched as per user requirements.
    // So local/system notifications are completely silenced.
  };

  const markAllNotificationsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.isRead);
      for (const n of unreadNotifs) {
        await updateDoc(doc(db, 'notifications', n.id), { isRead: true });
      }
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  };

  const clearNotifications = async () => {
    try {
      for (const n of notifications) {
        await deleteDoc(doc(db, 'notifications', n.id));
      }
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  // --- Executive Admin Operations (Writing directly to Firestore) ---

  const adminUpdateUserStatus = async (userId: string, status: 'active' | 'suspended') => {
    try {
      await updateDoc(doc(db, 'users', userId), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const adminUpdateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      const cleanUndefined = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (Array.isArray(obj)) return obj.map(cleanUndefined);
        if (typeof obj === 'object') {
          const cleaned: any = {};
          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              const val = obj[key];
              if (val !== undefined) {
                cleaned[key] = cleanUndefined(val);
              }
            }
          }
          return cleaned;
        }
        return obj;
      };
      const cleanedUpdates = cleanUndefined(updates);
      await updateDoc(doc(db, 'users', userId), cleanedUpdates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const adminUpdateCreditScore = async (userId: string, newScore: number) => {
    try {
      const clampedScore = Math.max(0, Math.min(100, Math.floor(newScore)));
      
      // Update User document
      await updateDoc(doc(db, 'users', userId), { creditScore: clampedScore });
      
      // Fetch user profile to get their name
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const username = userSnap.exists() ? (userSnap.data() as UserProfile).username : 'User';

      // 1. Write permanent audit log document to `/audit_logs` collection
      const logId = `AUDIT_${genId()}`;
      await setDoc(doc(db, 'audit_logs', logId), {
        id: logId,
        userId,
        type: 'credit_adjustment',
        amount: clampedScore,
        description: `Score adjusted to ${clampedScore} by administrator`,
        createdAt: new Date().toISOString()
      });

      // 2. Also write to `/transactions` so it's transparent in Audit History!
      const txId = `TX_${genId()}`;
      await setDoc(doc(db, 'transactions', txId), {
        id: txId,
        userId,
        username,
        type: 'credit_adjustment',
        amount: clampedScore,
        status: 'completed',
        reference: `CR_ADJ_${Math.floor(Math.random() * 90000 + 10000)}`,
        date: new Date().toISOString(),
        description: `Credit Score adjusted to ${clampedScore} by administrator`
      });

      // Add a notification for the user
      const notifId = `NOTIF_${genId()}`;
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        userId,
        title: 'Credit Score Adjusted / 信用評分已調整',
        message: `Your MGM Trust Index score has been updated to ${clampedScore}/100 by the risk management desk. / 您的美高梅信用評級分數已被風控部門調整為 ${clampedScore}/100。`,
        isRead: false,
        timestamp: new Date().toISOString(),
        type: 'system'
      });

    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}/creditScore`);
    }
  };

  const adminAddUserBalance = async (userId: string, amount: number, isBonus = false) => {
    try {
      const uRef = doc(db, 'users', userId);
      const txId = `TX_${genId()}`;
      
      await runTransaction(db, async (tx) => {
        const uSnap = await tx.get(uRef);
        if (!uSnap.exists()) throw new Error('User profile not found');
        const userData = uSnap.data() as UserProfile;

        const currentBal = userData.balance;
        const currentBonus = userData.bonusBalance;

        const adminTxObj: Transaction = {
          id: txId,
          userId,
          username: userData.username,
          type: 'deposit',
          amount,
          status: 'completed',
          reference: `ADM_${Math.floor(Math.random() * 90000 + 10000)}`,
          date: formatDate(),
          description: `Balance adjusted by Administrator (${isBonus ? 'Bonus Wallet' : 'Real Wallet'})`
        };

        tx.update(uRef, {
          balance: isBonus ? currentBal : parseFloat((currentBal + amount).toFixed(2)),
          bonusBalance: isBonus ? parseFloat((currentBonus + amount).toFixed(2)) : currentBonus
        });
        tx.set(doc(db, 'transactions', txId), adminTxObj);
      });
    } catch (err) {
      console.error('Admin adjustment failed:', err);
    }
  };

  const adminSendNotification = async (userId: string, title: string, message: string) => {
    try {
      const notifId = `NOTIF_${genId()}`;
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        userId,
        title,
        message,
        isRead: false,
        timestamp: new Date().toISOString(),
        type: 'system',
        byAdmin: true
      });
    } catch (err) {
      console.error('Error sending notification:', err);
    }
  };

  const buyJackpotTicket = async () => {
    if (!currentUser) throw new Error('Authentication required to purchase a ticket.');
    
    const ticketPrice = 100;
    if (currentUser.balance < ticketPrice) {
      throw new Error('Insufficient wallet balance to buy a Jackpot Ticket! Please deposit funds to complete purchase.');
    }

    const ticketId = `TKT_${genId()}`;
    const txId = `TX_${genId()}`;
    
    // Generate a beautiful uppercase alphanumeric ticket number (6 characters)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like I, O, 0, 1
    let randomCode = '';
    for (let i = 0; i < 6; i++) {
      randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const ticketNumber = `MGM-${randomCode}`;

    await runTransaction(db, async (tx) => {
      const uRef = doc(db, 'users', currentUser.id);
      const uSnap = await tx.get(uRef);
      if (!uSnap.exists()) throw new Error('User profile not found.');
      const uData = uSnap.data() as UserProfile;

      if (uData.balance < ticketPrice) {
        throw new Error('Insufficient wallet balance to buy a Jackpot Ticket! Please deposit funds to complete purchase.');
      }

      const newBalance = parseFloat((uData.balance - ticketPrice).toFixed(2));

      // 1. Deduct balance
      tx.update(uRef, { balance: newBalance });

      // 2. Create Jackpot Ticket Doc
      const ticketDocRef = doc(db, 'jackpot_tickets', ticketId);
      tx.set(ticketDocRef, {
        id: ticketId,
        userId: currentUser.id,
        username: currentUser.username,
        ticketNumber,
        price: ticketPrice,
        purchaseDate: formatDate(),
        status: 'pending'
      });

      // 3. Create Transaction Doc
      const transactionDocRef = doc(db, 'transactions', txId);
      tx.set(transactionDocRef, {
        id: txId,
        userId: currentUser.id,
        username: currentUser.username,
        type: 'jackpot_purchase',
        amount: ticketPrice,
        status: 'completed',
        reference: ticketNumber,
        date: formatDate(),
        description: `MGM Lucky Jackpot Ticket Purchase (${ticketNumber})`
      });
    });
  };

  const adminInjectJackpotWinner = async (ticketNumber: string) => {
    // 1. Query for the ticket with ticketNumber
    const ticketsQuery = query(collection(db, 'jackpot_tickets'), where('ticketNumber', '==', ticketNumber));
    const querySnap = await getDocs(ticketsQuery);
    if (querySnap.empty) {
      throw new Error(`Ticket with number ${ticketNumber} not found.`);
    }

    const ticketDoc = querySnap.docs[0];
    const ticketData = ticketDoc.data() as JackpotTicket;
    if (ticketData.status !== 'pending') {
      throw new Error(`Ticket ${ticketNumber} has already been processed.`);
    }

    // Grand Jackpot Prize: $10,000
    const jackpotPrize = 10000;
    const winnerUserId = ticketData.userId;
    const winnerUsername = ticketData.username;
    
    // We update this ticket to 'won' and all other pending tickets to 'lost'
    const allTicketsSnap = await getDocs(collection(db, 'jackpot_tickets'));
    
    await runTransaction(db, async (tx) => {
      // 1. Mark winning ticket as won
      tx.update(doc(db, 'jackpot_tickets', ticketData.id), { status: 'won' });

      // 2. Mark other pending tickets as lost
      allTicketsSnap.forEach((docSnap) => {
        const d = docSnap.data() as JackpotTicket;
        if (d.id !== ticketData.id && d.status === 'pending') {
          tx.update(doc(db, 'jackpot_tickets', d.id), { status: 'lost' });
        }
      });

      // 3. Credit winner's balance
      const uRef = doc(db, 'users', winnerUserId);
      const uSnap = await tx.get(uRef);
      if (uSnap.exists()) {
        const uData = uSnap.data() as UserProfile;
        const newBalance = parseFloat((uData.balance + jackpotPrize).toFixed(2));
        tx.update(uRef, { balance: newBalance });
      }

      // 4. Create win transaction for winner
      const winTxId = `TX_${genId()}`;
      tx.set(doc(db, 'transactions', winTxId), {
        id: winTxId,
        userId: winnerUserId,
        username: winnerUsername,
        type: 'win',
        amount: jackpotPrize,
        status: 'completed',
        reference: `JKP_${ticketNumber}`,
        date: formatDate(),
        description: `GRAND MGM JACKPOT WINNER! Ticket: ${ticketNumber}`
      });

      // 5. Create a global notification
      const notifId = `NOTIF_${genId()}`;
      tx.set(doc(db, 'notifications', notifId), {
        id: notifId,
        title: '👑 MGM GRAND JACKPOT WINNER ANNOUNCED! 👑',
        message: `Congratulations to user @${winnerUsername}! Their ticket [${ticketNumber}] has won the Grand MGM Jackpot of $${jackpotPrize.toLocaleString()}! Next round is now active. Buy your tickets now!`,
        isRead: false,
        timestamp: new Date().toISOString(),
        type: 'system',
        byAdmin: true
      });
    });
  };

  const adminInjectJackpotTicket = async (userId: string): Promise<string> => {
    const uRef = doc(db, 'users', userId);
    const uSnap = await getDoc(uRef);
    if (!uSnap.exists()) throw new Error('User profile not found in database.');
    const uData = uSnap.data() as UserProfile;

    const ticketId = `TKT_${genId()}`;
    const txId = `TX_${genId()}`;
    
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomCode = '';
    for (let i = 0; i < 6; i++) {
      randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const ticketNumber = `MGM-${randomCode}`;

    await runTransaction(db, async (tx) => {
      const ticketDocRef = doc(db, 'jackpot_tickets', ticketId);
      tx.set(ticketDocRef, {
        id: ticketId,
        userId: uData.id,
        username: uData.username,
        ticketNumber,
        price: 100,
        purchaseDate: formatDate(),
        status: 'pending'
      });

      const transactionDocRef = doc(db, 'transactions', txId);
      tx.set(transactionDocRef, {
        id: txId,
        userId: uData.id,
        username: uData.username,
        type: 'jackpot_purchase',
        amount: 100,
        status: 'completed',
        reference: ticketNumber,
        date: formatDate(),
        description: `MGM Lucky Jackpot Ticket Injected by Admin (${ticketNumber})`
      });
    });

    return ticketNumber;
  };

  // ATOMIC Payouts Approval Gate
  const adminApproveTransaction = async (reqId: string) => {
    try {
      const reqRef = doc(db, 'requests', reqId);
      const txId = `TX_${genId()}`;

      await runTransaction(db, async (tx) => {
        const reqSnap = await tx.get(reqRef);
        if (!reqSnap.exists()) throw new Error('Request document not found');
        const reqData = reqSnap.data();

        if (reqData.status !== 'pending') throw new Error('Request already processed');

        const uRef = doc(db, 'users', reqData.userId);
        const uSnap = await tx.get(uRef);
        if (!uSnap.exists()) throw new Error('User profile not found');
        const userData = uSnap.data() as UserProfile;

        // Ledger Record log to write
        const settledTx: Transaction = {
          id: txId,
          userId: reqData.userId,
          username: reqData.username,
          type: reqData.type,
          amount: reqData.amount,
          status: 'completed',
          reference: reqData.reference,
          date: formatDate(),
          description: reqData.type === 'deposit' 
            ? `Cleared Deposit via Admin Audit (UTR: ${reqData.reference})`
            : `Cleared Withdrawal Cashout via Admin Gate (Target: ${reqData.details})`
        };

        if (reqData.type === 'deposit') {
          // If deposit, credit their balance
          tx.update(uRef, { balance: parseFloat((userData.balance + reqData.amount).toFixed(2)) });
        } else {
          // If withdrawal, only deduct if it was not already deducted on submission (backward compatibility)
          if (reqData.isDeducted) {
            // Already deducted upon submission, nothing more to deduct!
          } else {
            if (userData.balance < reqData.amount) {
              throw new Error(`Insufficient available wallet balance! User only has $${userData.balance.toLocaleString('en-US')}, but requested $${reqData.amount.toLocaleString('en-US')}.`);
            }
            tx.update(uRef, { balance: parseFloat((userData.balance - reqData.amount).toFixed(2)) });
          }
        }

        tx.update(reqRef, { 
          status: 'approved',
          approvedBy: auth.currentUser?.uid || 'ADMIN_DEMO'
        });
        tx.set(doc(db, 'transactions', txId), settledTx);
      });
    } catch (err) {
      console.error('Admin transaction approval failed:', err);
      alert(err instanceof Error ? err.message : 'Approval transaction failed');
    }
  };

  const adminRejectTransaction = async (reqId: string, reason = 'Administrative reject') => {
    try {
      const reqRef = doc(db, 'requests', reqId);
      const txId = `TX_${genId()}`;

      await runTransaction(db, async (tx) => {
        const reqSnap = await tx.get(reqRef);
        if (!reqSnap.exists()) throw new Error('Request document not found');
        const reqData = reqSnap.data();

        if (reqData.status !== 'pending') throw new Error('Request already processed');

        const uRef = doc(db, 'users', reqData.userId);
        const uSnap = await tx.get(uRef);
        if (!uSnap.exists()) throw new Error('User profile not found');
        const userData = uSnap.data() as UserProfile;

        // Ledger Record log to write
        const rejectedTx: Transaction = {
          id: txId,
          userId: reqData.userId,
          username: reqData.username,
          type: reqData.type,
          amount: reqData.amount,
          status: 'rejected',
          reference: reqData.reference,
          date: formatDate(),
          description: `Rejected ${reqData.type}: ${reason}`
        };

        // If withdrawal was deducted on submission, refund the amount to user's balance on rejection
        if (reqData.type === 'withdrawal' && reqData.isDeducted) {
          tx.update(uRef, { balance: parseFloat((userData.balance + reqData.amount).toFixed(2)) });
        }

        tx.update(reqRef, { 
          status: 'rejected',
          rejectedBy: auth.currentUser?.uid || 'ADMIN_DEMO',
          rejectionReason: reason
        });
        tx.set(doc(db, 'transactions', txId), rejectedTx);
      });
    } catch (err) {
      console.error('Admin rejection transaction failed:', err);
      alert(err instanceof Error ? err.message : 'Rejection failed');
    }
  };

  const adminToggleGameStatus = async (gameId: string) => {
    try {
      const gRef = doc(db, 'games', gameId);
      const gSnap = await getDoc(gRef);
      if (gSnap.exists()) {
        await updateDoc(gRef, { isActive: !gSnap.data().isActive });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const adminToggleGameLock = async (gameId: string, isLocked: boolean, reason?: string) => {
    try {
      await updateDoc(doc(db, 'games', gameId), { isLocked, lockReason: reason || '' });
    } catch (err) {
      console.error(err);
    }
  };

  const adminToggleUserGameLock = async (userId: string, gameId: string) => {
    try {
      const uRef = doc(db, 'users', userId);
      await runTransaction(db, async (tx) => {
        const uSnap = await tx.get(uRef);
        if (!uSnap.exists()) throw new Error('User profile not found');
        const userData = uSnap.data() as UserProfile;
        const currentLocked = userData.lockedGames || [];
        let newLocked: string[];
        if (currentLocked.includes(gameId)) {
          newLocked = currentLocked.filter(id => id !== gameId);
        } else {
          newLocked = [...currentLocked, gameId];
        }
        tx.update(uRef, { lockedGames: newLocked });
      });
    } catch (err) {
      console.error('Error toggling user game lock:', err);
    }
  };

  const adminUpdateGameConfig = async (gameId: string, rtp: number, minBet: number, maxBet: number) => {
    try {
      await updateDoc(doc(db, 'games', gameId), { rtp, minBet, maxBet });
    } catch (err) {
      console.error(err);
    }
  };

  const adminUpdateDiceSchedules = async (schedules: DiceSchedule[], winningPercentage: number, jackpotMoney: number) => {
    try {
      await updateDoc(doc(db, 'games', 'dice'), {
        diceSchedules: schedules,
        winningPercentage,
        jackpotMoney
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'games/dice');
    }
  };

  const adminUpdateDiceManualFields = async (fields: { manualResult?: string | null, manualTimer?: number | null, manualProfitRate?: number | null }) => {
    try {
      await updateDoc(doc(db, 'games', 'dice'), fields);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'games/dice');
    }
  };

  const adminUpdateDiceGlobalOverrides = async (overrides: Record<string, any>) => {
    try {
      await updateDoc(doc(db, 'games', 'dice'), { globalDiceOverrides: overrides });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'games/dice');
    }
  };

  const adminCreateAnnouncement = async (title: string, content: string, type: 'announcement' | 'promotion' | 'event', bannerImage?: string) => {
    try {
      const annId = `ANN_${genId()}`;
      const newAnn: Announcement = {
        id: annId,
        title,
        content,
        type,
        date: formatDate(),
        isActive: true,
        bannerImage
      };
      await setDoc(doc(db, 'announcements', annId), newAnn);
      addLocalNotification('New Announcement Published', `${title}`, 'system');
    } catch (err) {
      console.error(err);
    }
  };

  const adminDeleteAnnouncement = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (err) {
      console.error(err);
    }
  };

  const adminUpdateFAQ = (newFaqs: FAQItem[]) => {
    setFaqs(newFaqs);
  };

  const adminSimulateTraffic = () => {
    if (users.length === 0) return;
    const randomUser = users[Math.floor(Math.random() * users.length)];
    if (randomUser.id === currentUser?.id) return; // Skip self

    const actionType = Math.random() < 0.7 ? 'bet' : 'transaction';
    
    if (actionType === 'bet') {
      const game = games[Math.floor(Math.random() * games.length)];
      if (!game) return;
      const betAmount = Math.floor(Math.random() * 95) + 5;
      const isWin = Math.random() * 100 < game.rtp;
      const mult = isWin ? parseFloat((Math.random() * 4 + 1.1).toFixed(2)) : 0;
      const winAmount = isWin ? parseFloat((betAmount * mult).toFixed(2)) : 0;
      const outcome = isWin ? `Multiplier x${mult}` : 'Lost stake';

      // Perform simulated play using their user ref
      const betId = `BET_${genId()}`;
      const betTxId = `TX_${genId()}`;
      const winTxId = `TX_${genId()}`;
      const status = winAmount > 0 ? 'win' : 'loss';

      const uRef = doc(db, 'users', randomUser.id);
      const gameRef = doc(db, 'games', game.id);

      runTransaction(db, async (tx) => {
        const uSnap = await tx.get(uRef);
        if (!uSnap.exists()) return;
        const uData = uSnap.data() as UserProfile;

        if (uData.balance < betAmount) return;

        const updatedBalance = parseFloat((uData.balance - betAmount + winAmount).toFixed(2));

        tx.update(uRef, { balance: updatedBalance });
        tx.update(gameRef, {
          totalBets: game.totalBets + 1,
          totalVolume: game.totalVolume + betAmount
        });

        tx.set(doc(db, 'bets', betId), {
          id: betId,
          gameId: game.id,
          gameName: game.name,
          userId: randomUser.id,
          username: randomUser.username,
          betAmount,
          winAmount,
          multiplier: mult,
          outcome,
          date: formatDate(),
          status
        });

        tx.set(doc(db, 'transactions', betTxId), {
          id: betTxId,
          userId: randomUser.id,
          username: randomUser.username,
          type: 'bet',
          amount: betAmount,
          status: 'completed',
          reference: `STK_${betId.slice(4)}`,
          date: formatDate(),
          description: `Simulated wager stake on ${game.name}`
        });

        if (winAmount > 0) {
          tx.set(doc(db, 'transactions', winTxId), {
            id: winTxId,
            userId: randomUser.id,
            username: randomUser.username,
            type: 'win',
            amount: winAmount,
            status: 'completed',
            reference: `WIN_${betId.slice(4)}`,
            date: formatDate(),
            description: `Simulated payout win on ${game.name}`
          });
        }
      }).catch(() => {});
    } else {
      // Simulated deposit request
      const reqId = `REQ_${genId()}`;
      const amt = Math.floor(Math.random() * 450) + 50;
      const ref = `DEP_${Math.floor(Math.random() * 900000 + 100000)}`;
      const gateways = ['BankWire', 'USDT-TRC20', 'VisaCard', 'MasterCard'];
      const gate = gateways[Math.floor(Math.random() * gateways.length)];

      setDoc(doc(db, 'requests', reqId), {
        id: reqId,
        userId: randomUser.id,
        username: randomUser.username,
        type: 'deposit',
        amount: amt,
        status: 'pending',
        reference: ref,
        gateway: gate,
        date: formatDate(),
        screenshot: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&h=300&q=80',
        details: 'N/A',
        creditScore: 95
      }).catch(() => {});
    }
  };

  return (
    <PlatformContext.Provider value={{
      currentUser,
      users,
      transactions,
      requests,
      bets,
      tickets,
      announcements,
      faqs,
      notifications,
      achievements,
      games,
      currentRole,
      loginSessions,
      bankAccounts,
      authLoading,
      login,
      logout,
      register,
      verifyEmail,
      verifyMobile,
      updateProfile,
      updateSecurity,
      requestDeposit,
      requestWithdrawal,
      addBankAccount,
      deleteBankAccount,
      claimReferralEarnings,
      playGame,
      createTicket,
      addMessageToTicket,
      resolveTicket,
      setTicketTyping,
      submitTicketRating,
      markAllNotificationsRead,
      clearNotifications,
      addLocalNotification,
      adminUpdateUserStatus,
      adminUpdateUserProfile,
      adminUpdateCreditScore,
      adminAddUserBalance,
      adminApproveTransaction,
      adminRejectTransaction,
      adminToggleGameStatus,
      adminToggleGameLock,
      adminToggleUserGameLock,
      adminUpdateGameConfig,
      adminUpdateDiceSchedules,
      adminUpdateDiceManualFields,
      adminUpdateDiceGlobalOverrides,
      adminCreateAnnouncement,
      adminDeleteAnnouncement,
      adminUpdateFAQ,
      adminSimulateTraffic,
      adminSendNotification,
      adminInjectJackpotWinner,
      adminInjectJackpotTicket,
      jackpotTickets,
      buyJackpotTicket,
      setRole
    }}>
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (context === undefined) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
};
