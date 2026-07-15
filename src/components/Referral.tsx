import React, { useState, useEffect } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../context/firebase';
import { UserProfile } from '../types';
import { 
  Users, 
  Share2, 
  Gift, 
  Trophy, 
  Copy, 
  Check, 
  Award, 
  TrendingUp, 
  UserCheck, 
  Activity,
  Heart
} from 'lucide-react';

export const Referral: React.FC = () => {
  const { 
    currentUser, 
    claimReferralEarnings,
    transactions 
  } = usePlatform();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [referredUsers, setReferredUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (!currentUser?.referralCode) return;

    // Listen to users where referrerCode matches current user's unique referral code
    const q1 = query(
      collection(db, 'users'),
      where('referrerCode', '==', currentUser.referralCode)
    );

    // Also listen to users where referredBy matches current user's ID to be backward-compatible with legacy and mock data
    const q2 = query(
      collection(db, 'users'),
      where('referredBy', '==', currentUser.id)
    );

    let list1: UserProfile[] = [];
    let list2: UserProfile[] = [];

    const updateCombinedList = () => {
      const mergedMap = new Map<string, UserProfile>();
      list1.forEach(u => mergedMap.set(u.id, u));
      list2.forEach(u => mergedMap.set(u.id, u));
      setReferredUsers(Array.from(mergedMap.values()));
    };

    // Use includeMetadataChanges: true to handle real-time server synchronizations and bypass cache if needed
    const unsub1 = onSnapshot(q1, { includeMetadataChanges: true }, (snapshot) => {
      list1 = [];
      snapshot.forEach((doc) => {
        // Here, snapshot.metadata.fromCache can be inspected if we strictly want to flag cache vs server source.
        // We push the real-time server updates directly to bypass stale cache behavior.
        list1.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      updateCombinedList();
    }, (error) => {
      console.error("Error listening to referred users (referrerCode):", error);
    });

    const unsub2 = onSnapshot(q2, { includeMetadataChanges: true }, (snapshot) => {
      list2 = [];
      snapshot.forEach((doc) => {
        list2.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      updateCombinedList();
    }, (error) => {
      console.error("Error listening to referred users (referredBy):", error);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [currentUser?.id, currentUser?.referralCode]);

  if (!currentUser) {
    return (
      <div className="text-center py-16" id="referral-not-logged">
        <h3 className="text-lg font-bold">Authentication Required</h3>
        <p className="text-xs text-slate-400 mt-1">Please sign in to access your referral program dashboard.</p>
      </div>
    );
  }

  // Calculate dynamic referral stats for the logged-in user
  const myReferredUsers = referredUsers;
  const totalReferred = myReferredUsers.length;
  
  // Sum up referral earnings from transactions
  const myReferralEarnings = transactions
    .filter(t => t.userId === currentUser.id && t.type === 'referral' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  // Dynamic calculations: $25 bonus reward per successful partner registration + 5% betting volume commission
  const totalWageredByFriends = myReferredUsers.reduce((sum, u) => sum + (u.totalWagered || 0), 0);
  const registrationBonus = totalReferred * 25.0;
  const wageringCommission = totalWageredByFriends * 0.05;
  const accumulatedBalance = registrationBonus + wageringCommission;
  const readyToCollect = Math.max(0, accumulatedBalance - myReferralEarnings);

  // Generate Referral Link
  const referralLink = `${window.location.origin}?ref=${currentUser.referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentUser.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Static mock tournament leaderboard
  const leaderboard = [
    { rank: 1, username: 'VIP_spinner', count: 48, reward: 2500, avatar: '💎' },
    { rank: 2, username: 'alex_jackpot', count: 32, reward: 1200, avatar: '🦁' },
    { rank: 3, username: 'coin_master', count: 21, reward: 800, avatar: '🪙' },
    { rank: 4, username: 'lucky_charm', count: 15, reward: 500, avatar: '🍀' },
    { rank: 5, username: 'wheel_dealer', count: 11, reward: 300, avatar: '🎡' }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="referral-panel-main">
      
      {/* Title & Overview Banner */}
      <div className="rounded-3xl glass text-white p-6 md:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 h-60 w-60 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl" />
        
        <div className="max-w-2xl space-y-4 relative">
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold font-mono tracking-wider">
            AFFILIATE CAMPAIGN
          </span>
          <h2 className="text-xl md:text-3xl font-black tracking-tight leading-tight">
            Invite Friends, Multi-Level Commission. Earn Passive Yield on Every Spin.
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Every friend you invite unlocks $25 instant bonus points. Plus, receive an ongoing 5% of their gaming betting volume—regardless of whether they win or lose!
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        <div className="rounded-2xl glass p-5 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-xl">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-mono font-bold uppercase">Referred Friends</p>
            <h4 className="text-xl font-black text-slate-800 dark:text-white mt-0.5">{totalReferred} Players</h4>
          </div>
        </div>

        <div className="rounded-2xl glass p-5 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-teal-50 dark:bg-teal-950/40 text-teal-500 rounded-xl">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-mono font-bold uppercase">Total Earnings</p>
            <h4 className="text-xl font-black text-emerald-500 mt-0.5">${myReferralEarnings.toFixed(2)}</h4>
          </div>
        </div>

        <div className="rounded-2xl glass p-5 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-xl">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-mono font-bold uppercase">Accumulated Balance</p>
            <h4 className="text-xl font-black text-slate-800 dark:text-white mt-0.5">${accumulatedBalance.toFixed(2)}</h4>
          </div>
        </div>

        <div className="rounded-2xl glass p-5 flex items-center justify-between gap-2 shadow-xs">
          <div>
            <p className="text-[10px] text-slate-400 font-mono font-bold uppercase">Ready to Collect</p>
            <h4 className="text-xl font-black text-amber-500 mt-0.5">${readyToCollect.toFixed(2)}</h4>
          </div>
          <button
            onClick={() => claimReferralEarnings(readyToCollect)}
            disabled={readyToCollect <= 0}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold shadow-sm transition-all ${
              readyToCollect > 0 
                ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
            id="btn-claim-referrals"
          >
            {readyToCollect > 0 ? 'Claim' : 'Settled'}
          </button>
        </div>

      </div>

      {/* Copy ecosystem and Network views */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Copy section */}
        <div className="lg:col-span-1 rounded-3xl glass p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-3">
              <span className="p-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-emerald-500">
                <Share2 className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">Share Invitation Links</h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
              Copy and forward your unique referral link. Once prospects join using your cookie tracking link, they are locked under your network.
            </p>

            {/* Referral Code Box */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide">Unique referral code</span>
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                <span className="font-mono font-extrabold text-sm text-slate-800 dark:text-white tracking-widest">{currentUser.referralCode}</span>
                <button
                  onClick={handleCopyCode}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {copiedCode ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Referral Link Box */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide">Dynamic Invite Link</span>
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                <span className="font-mono text-xs text-slate-400 truncate max-w-[180px]">{referralLink}</span>
                <button
                  onClick={handleCopyLink}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {copiedLink ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/40 dark:border-emerald-900/30 rounded-2xl flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            <Award className="h-4 w-4 shrink-0 text-emerald-500" />
            <div>
              Commission payout balances settle directly into your Main real balance every Sunday.
            </div>
          </div>
        </div>

        {/* Network View */}
        <div className="lg:col-span-2 rounded-3xl glass p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-teal-500">
                <UserCheck className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">Referred Network Tree</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Real-time status updates of referred users and volume commissions.</p>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full font-bold">
              LEVEL 1 PARTNERS
            </span>
          </div>

          <div className="space-y-3">
            {myReferredUsers.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
                You have not invited anyone yet. Copy and share your link above to build your partner network tree.
              </div>
            ) : (
              myReferredUsers.map(ru => (
                <div 
                  key={ru.id}
                  className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-900 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 text-xs hover:border-slate-200 dark:hover:border-slate-850 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 text-xl">
                      {ru.avatar || '👤'}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-200">{ru.username}</h4>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">Joined {new Date(ru.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-mono">Wagered Volume</p>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">${(ru.totalWagered || 0).toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-mono">Commission Yield</p>
                      <span className="font-bold text-emerald-500 font-mono">${(25.00 + (ru.totalWagered || 0) * 0.05).toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-mono">Status</p>
                      <span className={`inline-flex items-center gap-1 font-bold text-[10px] uppercase ${ru.status === 'active' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {ru.status || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Leaderboard Section */}
      <div className="rounded-3xl glass p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-amber-500">
              <Trophy className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">Weekly Affiliate Leaderboard Tournament</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Top-earning referrers get massive cash distribution slices.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
            <Activity className="h-3 w-3 animate-pulse" /> $50,000 REWARD POOL
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {leaderboard.map(lb => (
            <div 
              key={lb.rank}
              className={`rounded-2xl border p-4 text-center relative overflow-hidden transition-all ${
                lb.rank === 1 
                  ? 'bg-gradient-to-tr from-amber-500/10 to-yellow-500/5 border-amber-400/40 shadow-sm shadow-amber-500/5' 
                  : 'border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10 hover:border-slate-200'
              }`}
            >
              <div className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">
                #{lb.rank}
              </div>

              <div className="text-3xl my-2 select-none">{lb.avatar}</div>
              <h4 className="font-extrabold text-xs text-slate-800 dark:text-white truncate">{lb.username}</h4>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{lb.count} Referred players</p>
              
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
              
              <p className="text-[11px] font-black text-emerald-500 font-mono">+${lb.reward}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
