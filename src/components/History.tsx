import React, { useState, useEffect } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { 
  History as HistoryIcon, 
  Gamepad2, 
  Wallet, 
  Users, 
  Bell, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface HistoryProps {
  initialSubTab?: 'games' | 'wallet' | 'referrals' | 'sessions' | 'notifications';
  onSubTabChange?: (subTab: 'games' | 'wallet' | 'referrals' | 'sessions' | 'notifications') => void;
}

export const History: React.FC<HistoryProps> = ({ initialSubTab, onSubTabChange }) => {
  const { 
    currentUser, 
    bets, 
    transactions, 
    users, 
    notifications, 
    loginSessions 
  } = usePlatform();

  const [activeSubTab, setActiveSubTab] = useState<'games' | 'wallet' | 'referrals' | 'sessions' | 'notifications'>(initialSubTab || 'games');

  // Keep state in sync with prop if it changes
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSubTabClick = (tabId: 'games' | 'wallet' | 'referrals' | 'sessions' | 'notifications') => {
    setActiveSubTab(tabId);
    if (onSubTabChange) {
      onSubTabChange(tabId);
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-16" id="history-not-logged">
        <h3 className="text-lg font-bold">Authentication Required</h3>
        <p className="text-xs text-slate-400 mt-1">Please sign in to view your detailed gaming ledgers.</p>
      </div>
    );
  }

  // Filters for current user
  const myBets = bets
    .filter(b => b.userId === currentUser.id)
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  const myTx = transactions
    .filter(t => t.userId === currentUser.id)
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  const myReferred = users.filter(u => u.referredBy === currentUser.id);
  const mySessions = loginSessions.filter(s => !s.userId || s.userId === currentUser.id);
  const myNotifications = notifications.filter(n => !n.userId || n.userId === currentUser.id);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6" id="compliance-history-main">
      
      {/* Tab select strip */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <HistoryIcon className="h-6 w-6 text-emerald-500" /> Account Audit History Log
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Browse cryptographic session stamps, game roll outcomes, wallet transactions, and active referral tracking logs.
          </p>
        </div>

        <div className="flex flex-wrap gap-1 glass p-1 rounded-2xl">
          {[
            { id: 'games', label: 'Game Bets', icon: Gamepad2 },
            { id: 'wallet', label: 'Wallet Ledgers', icon: Wallet },
            { id: 'referrals', label: 'Social Network', icon: Users },
            { id: 'sessions', label: 'Login Sessions', icon: Clock },
            { id: 'notifications', label: 'Alerts', icon: Bell }
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleSubTabClick(item.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeSubTab === item.id 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Render */}
      <div className="rounded-3xl glass p-6 min-h-[400px]">
        
        {/* SUB SECTION 1: GAME BETS */}
        {activeSubTab === 'games' && (
          <div className="space-y-4" id="history-games-tab">
            <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-widest">Wagers History Log</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-850 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3">Bet ID</th>
                    <th className="py-3">Game Title</th>
                    <th className="py-3">Wager Stake</th>
                    <th className="py-3">Multiplier</th>
                    <th className="py-3">Net Profit</th>
                    <th className="py-3">Game Outcome</th>
                    <th className="py-3">Stamp Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {myBets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">No wagers recorded. Go to the Game Center to spin the wheels!</td>
                    </tr>
                  ) : (
                    myBets.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                        <td className="py-4 font-mono font-bold text-slate-400">{b.id}</td>
                        <td className="py-4 font-extrabold text-slate-800 dark:text-white">{b.gameName}</td>
                        <td className="py-4 font-mono font-bold text-slate-700 dark:text-slate-300">${b.betAmount.toFixed(2)}</td>
                        <td className="py-4 font-mono font-extrabold text-indigo-500">x{b.multiplier}</td>
                        <td className="py-4 font-mono font-extrabold">
                          {b.status === 'win' ? (
                            <span className="text-emerald-500">+${b.winAmount.toFixed(2)}</span>
                          ) : (
                            <span className="text-slate-400">-$0.00</span>
                          )}
                        </td>
                        <td className="py-4 font-medium">{b.outcome}</td>
                        <td className="py-4 text-slate-400 font-mono text-[11px]">{new Date(b.date).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUB SECTION 2: WALLET TRANSACTIONS */}
        {activeSubTab === 'wallet' && (
          <div className="space-y-4" id="history-wallet-tab">
            <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-widest">Financial ledgers Log</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-850 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3">Transaction Reference</th>
                    <th className="py-3">Type</th>
                    <th className="py-3">Description</th>
                    <th className="py-3">Amount</th>
                    <th className="py-3">Date Stamp</th>
                    <th className="py-3">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {myTx.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">No financial transactions registered.</td>
                    </tr>
                  ) : (
                    myTx.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                        <td className="py-4 font-mono font-bold text-slate-800 dark:text-slate-300">{tx.reference}</td>
                        <td className="py-4 font-bold uppercase">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            tx.type === 'deposit' ? 'bg-emerald-50 text-emerald-500' :
                            tx.type === 'withdrawal' ? 'bg-rose-50 text-rose-500' :
                            tx.type === 'win' ? 'bg-teal-50 text-teal-600' :
                            'bg-amber-50 text-amber-500'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-4 max-w-xs truncate text-slate-500 dark:text-slate-400 font-medium">{tx.description}</td>
                        <td className="py-4 font-mono font-bold">
                          <span className={tx.type === 'win' || tx.type === 'deposit' || tx.type === 'referral' ? 'text-emerald-500' : 'text-slate-600'}>
                            {tx.type === 'win' || tx.type === 'deposit' || tx.type === 'referral' ? '+' : '-'}
                            ${tx.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4 text-slate-400 font-mono text-[11px]">{new Date(tx.date).toLocaleString()}</td>
                        <td className="py-4">
                          {tx.status === 'completed' && (
                            <span className="flex items-center gap-1 text-emerald-500 font-bold">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Settle OK
                            </span>
                          )}
                          {tx.status === 'pending' && (
                            <span className="flex items-center gap-1 text-amber-500 font-bold">
                              <Clock className="h-3.5 w-3.5 animate-spin" /> Auditing
                            </span>
                          )}
                          {tx.status === 'rejected' && (
                            <span className="flex items-center gap-1 text-rose-500 font-bold">
                              <AlertCircle className="h-3.5 w-3.5" /> REJECTED
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUB SECTION 3: SOCIAL REFERRALS */}
        {activeSubTab === 'referrals' && (
          <div className="space-y-4" id="history-referrals-tab">
            <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-widest">Referral Invitations & Commissions</h3>
            
            <div className="space-y-2">
              {myReferred.length === 0 ? (
                <div className="text-center py-10 text-slate-400">No referral signups found under your code yet. Share your invitation link to build passive volume commissions.</div>
              ) : (
                myReferred.map(ru => (
                  <div key={ru.id} className="flex justify-between items-center p-3 border border-slate-100 dark:border-slate-900 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{ru.avatar || '👤'}</span>
                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-white">{ru.username}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">ID: {ru.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-mono">Commission Yield</p>
                      <span className="font-bold text-emerald-500 font-mono">+$25.00</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SUB SECTION 4: LOGIN TIMELINE */}
        {activeSubTab === 'sessions' && (
          <div className="space-y-4" id="history-sessions-tab">
            <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-widest">Audited Login Terminals</h3>
            
            <div className="space-y-3">
              {mySessions.length === 0 ? (
                <div className="text-center py-10 text-slate-400">No login sessions logged.</div>
              ) : (
                mySessions.map(sess => (
                  <div key={sess.id} className="flex justify-between items-center p-3 border border-slate-100 dark:border-slate-900 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white">
                        <span>IP Terminal: {sess.ip}</span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold font-mono uppercase">
                          Secure
                        </span>
                      </div>
                      <p className="text-slate-400 font-mono text-[10px]">{sess.device} ({sess.location})</p>
                    </div>
                    <span className="text-slate-400 font-mono font-bold text-[11px]">{new Date(sess.timestamp).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SUB SECTION 5: APP NOTIFICATIONS TIMELINE */}
        {activeSubTab === 'notifications' && (
          <div className="space-y-4" id="history-notifications-tab">
            <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-widest">Notification Audits</h3>
            
            <div className="space-y-2">
              {myNotifications.length === 0 ? (
                <div className="text-center py-10 text-slate-400">No alerts logged.</div>
              ) : (
                myNotifications.map(n => (
                  <div key={n.id} className="p-3 border border-slate-100 dark:border-slate-900 rounded-2xl bg-slate-50/40 dark:bg-slate-900/20 text-xs space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-800 dark:text-white">{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(n.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 leading-normal text-[11px]">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
