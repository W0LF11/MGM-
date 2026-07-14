import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlatform } from '../context/PlatformContext';
import { 
  Shield, 
  Smartphone, 
  Mail, 
  Key, 
  User, 
  CheckCircle, 
  XCircle, 
  Fingerprint, 
  Clock, 
  Eye, 
  EyeOff,
  UserPlus,
  LogIn,
  MapPin,
  Check,
  AlertCircle,
  Info,
  X,
  CreditCard,
  Bell,
  Coins,
  Sparkles,
  TrendingUp,
  Gamepad2,
  ArrowRightLeft,
  Award,
  Activity,
  Edit2
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { 
    currentUser, 
    login, 
    register, 
    verifyEmail, 
    verifyMobile, 
    updateProfile, 
    updateSecurity,
    loginSessions,
    users,
    bets,
    bankAccounts,
    addBankAccount,
    deleteBankAccount,
    notifications,
    markAllNotificationsRead,
    currentRole,
    setRole
  } = usePlatform();

  // Auth form states
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [refCode, setRefCode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [authError, setAuthError] = useState('');

  // Profile modification states
  const [editUser, setEditUser] = useState(currentUser?.username || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatar || '🦁');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Profile synchronization effect to handle post-login state population
  React.useEffect(() => {
    if (currentUser) {
      setEditUser(currentUser.username || '');
      setEditPhone(currentUser.phone || '');
      setEditAvatar(currentUser.avatar || '🦁');
    }
  }, [currentUser]);

  // Security password state
  const [secOldPass, setSecOldPass] = useState('');
  const [secNewPass, setSecNewPass] = useState('');
  const [secSuccess, setSecSuccess] = useState('');

  // Verification simulator states
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  
  const [smsOtp, setSmsOtp] = useState('');
  const [smsOtpSent, setSmsOtpSent] = useState(false);
  const [smsVerifying, setSmsVerifying] = useState(false);

  // Terms and Bank account custom states
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [editBankName, setEditBankName] = useState('');
  const [editAccountHolder, setEditAccountHolder] = useState('');
  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [editRoutingCode, setEditRoutingCode] = useState('');
  const [bankSuccess, setBankSuccess] = useState<string | null>(null);
  const [showNotifModal, setShowNotifModal] = useState(false);

  const userNotifications = (notifications || []).filter(n => !n.userId || (currentUser && n.userId === currentUser.id));
  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const userBank = bankAccounts.find(acc => acc.userId === currentUser?.id);

  React.useEffect(() => {
    if (userBank) {
      setEditBankName(userBank.bankName);
      setEditAccountHolder(userBank.accountHolder);
      setEditAccountNumber(userBank.accountNumber);
      setEditRoutingCode(userBank.routingCode);
    } else if (currentUser) {
      setEditBankName('');
      setEditAccountHolder(currentUser.username.toUpperCase());
      setEditAccountNumber('');
      setEditRoutingCode('');
    }
  }, [userBank, currentUser]);

  // Quick switch mock users state helper
  const handleQuickLogin = async (mockEmail: string) => {
    setEmail(mockEmail);
    await login(mockEmail);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (isSignUp) {
      if (!username || !email || !phone || !password) {
        setAuthError('Please fill out all required fields.');
        return;
      }
      const ok = await register(username, email, phone, refCode);
      if (ok) {
        // Automatically logs in inside context
        setIsSignUp(false);
      } else {
        setAuthError('Username or email is already registered.');
      }
    } else {
      if (!email) {
        setAuthError('Please enter your email address.');
        return;
      }
      const ok = await login(email);
      if (!ok) {
        setAuthError('Email not registered, or account suspended. Use the credentials below or sign up.');
      }
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    if (!editUser) return;
    updateProfile(editUser, editPhone, editAvatar);
    setProfileSuccess('Profile successfully updated!');
    setTimeout(() => setProfileSuccess(''), 3000);
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setSecSuccess('');
    if (!secNewPass) return;
    updateSecurity(secNewPass);
    setSecSuccess('Password securely changed.');
    setSecOldPass('');
    setSecNewPass('');
    setTimeout(() => setSecSuccess(''), 3000);
  };

  const handleSendEmailOtp = () => {
    setEmailOtpSent(true);
    // Simulate OTP arriving
    setTimeout(() => {
      setEmailOtp('884219');
    }, 1500);
  };

  const handleVerifyEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailOtp === '884219') {
      setEmailVerifying(true);
      setTimeout(() => {
        verifyEmail();
        setEmailVerifying(false);
        setEmailOtpSent(false);
      }, 1000);
    } else {
      alert('Invalid simulated passcode. Try using "884219"');
    }
  };

  const handleSendSmsOtp = () => {
    setSmsOtpSent(true);
    setTimeout(() => {
      setSmsOtp('441129');
    }, 1500);
  };

  const handleVerifySmsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (smsOtp === '441129') {
      setSmsVerifying(true);
      setTimeout(() => {
        verifyMobile();
        setSmsVerifying(false);
        setSmsOtpSent(false);
      }, 1000);
    } else {
      alert('Invalid simulated SMS code. Try using "441129"');
    }
  };

  // Auth gate if user not logged in
  if (!currentUser) {
    return (
      <div className="mx-auto max-w-md py-12 px-4" id="auth-gate-panel">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 20 }}
          className="rounded-3xl glass p-8 shadow-2xl"
        >
          <div className="text-center mb-6">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-500 mb-3">
              <Fingerprint className="h-6 w-6" />
            </span>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {isSignUp ? 'Create Workspace Profile' : 'Authenticate Credentials'}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {isSignUp ? 'Unlock massive registration bonuses instantly' : 'Secure entry gateway to the commercial platform'}
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex border border-slate-100 dark:border-slate-800 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 mb-6">
            <button
              onClick={() => { setIsSignUp(false); setAuthError(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                !isSignUp 
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              id="tab-signin"
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setAuthError(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                isSignUp 
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              id="tab-signup"
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="font-semibold">{authError}</span>
              </div>
            )}

            {isSignUp && (
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  Desired Username *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. lucky_jack"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-sm dark:text-white"
                    id="auth-input-username"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. pilot@gaming.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-sm dark:text-white"
                  id="auth-input-email"
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  Mobile Contact *
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 0123"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-sm dark:text-white"
                    id="auth-input-phone"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                Password Settings *
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl glass-input text-sm dark:text-white"
                  id="auth-input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  Referral Promo Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ALEX99"
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm dark:text-white"
                  id="auth-input-refcode"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-sm font-extrabold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 transition-all mt-6 cursor-pointer flex items-center justify-center gap-2"
              id="auth-submit-btn"
            >
              {isSignUp ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
              {isSignUp ? 'Launch Account' : 'Authenticate Security Session'}
            </button>
          </form>

          {/* Quick Mock Login Assistance */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              PRE-CONFIGURED TEST PROFILES
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {(users || []).slice(0, 2).map((mu) => (
                <button
                  key={mu.id}
                  onClick={() => handleQuickLogin(mu.email)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs hover:border-emerald-500 dark:hover:border-emerald-500 transition-all font-semibold"
                >
                  {mu.avatar} {mu.username}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Logged-in profile panel
  const avatarList = ['🦁', '🦊', '🐼', '🐨', '🐸', '🦄', '🐝', '💎', '🍀', '👑', '👽', '💀'];

  // Dynamic gaming analytics calculations
  const userBets = bets.filter(b => b.userId === currentUser?.id);
  const lastPlayedGame = userBets.length > 0 ? userBets[0] : null;

  // Group bets by gameId to find the most played game
  const gameCounts: Record<string, { count: number; totalBet: number; gameName: string }> = {};
  userBets.forEach(b => {
    if (!gameCounts[b.gameId]) {
      gameCounts[b.gameId] = { count: 0, totalBet: 0, gameName: b.gameName };
    }
    gameCounts[b.gameId].count += 1;
    gameCounts[b.gameId].totalBet += b.betAmount;
  });

  let mostPlayedGameName = 'No gaming activity yet';
  let mostPlayedCount = 0;
  let mostPlayedTotalBet = 0;
  Object.values(gameCounts).forEach(data => {
    if (data.count > mostPlayedCount) {
      mostPlayedCount = data.count;
      mostPlayedGameName = data.gameName;
      mostPlayedTotalBet = data.totalBet;
    }
  });

  const handleSaveBankDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (userBank) {
      deleteBankAccount(userBank.id);
    }
    addBankAccount(editBankName, editAccountHolder, editAccountNumber, editRoutingCode);
    setBankSuccess("Bank details synchronized securely in real-time.");
    setIsEditingBank(false);
    setTimeout(() => setBankSuccess(null), 3000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="user-dashboard-main">
      
      {/* Visual Header Block */}
      <div className="rounded-3xl bg-white dark:bg-slate-900/30 p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-md border border-slate-100 dark:border-slate-800/60 relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 left-0 w-48 h-48 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-teal-500/5 dark:bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left z-10">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/10 flex items-center justify-center text-4xl select-none transition-transform hover:rotate-3">
            <div className="h-full w-full rounded-[14px] bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
              {currentUser?.avatar}
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {currentUser?.username}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-100/60 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30">
                {currentUser?.role || 'User'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500 dark:bg-slate-900/80 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800">
                Active Session
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-1">{currentUser?.email}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">Joined: {currentUser ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>

        {/* Clear Security Status Badge & Interactive Buttons */}
        <div className="flex flex-col items-center md:items-end gap-3.5 text-right z-10">
          <div className="text-xs font-mono font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 px-3.5 py-1.5 rounded-xl border border-slate-150 dark:border-slate-800">
            <Shield className="h-4 w-4 text-emerald-500 animate-pulse" />
            SECURE LEDGER CHANNEL
          </div>
          
          <div className="flex items-center gap-2">
            {/* Interactive Balance Button */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl px-4 py-2 shadow-xs transition-all hover:scale-[1.02]">
              <Coins className="h-4 w-4 text-emerald-500" />
              <div className="text-left font-mono">
                <span className="block text-[8px] uppercase font-bold text-slate-400 tracking-wider">Wallet Balance</span>
                <span className="text-sm font-black text-slate-800 dark:text-emerald-400">
                  ${(currentUser?.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Alert Notification Button */}
            <button
              onClick={() => {
                setShowNotifModal(true);
                markAllNotificationsRead();
              }}
              className="relative flex items-center justify-center h-11 w-11 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 border border-amber-150 dark:border-amber-900/30 text-amber-500 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
              title="View Admin Alerts"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5.5 w-5.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-950 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <span className="text-[10px] bg-slate-100 dark:bg-slate-900/80 px-3 py-1 rounded-full text-slate-500 dark:text-slate-400 font-mono font-bold border border-slate-200/40 dark:border-slate-800">
            ID: {currentUser?.id}
          </span>
        </div>
      </div>

      {/* Main Grid: Wallet & Bank left, Suggestions & Games right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COMPONENT: BANK ACCOUNTS */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* USER BANK ACCOUNT DETAILS */}
          <div className="rounded-3xl bg-white dark:bg-slate-900/20 p-6 space-y-4 border border-slate-100 dark:border-slate-800/80 shadow-md">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-100 dark:border-slate-800">
                  <CreditCard className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-850 dark:text-slate-100">Bank Account Details</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Secure real-time payout connection</p>
                </div>
              </div>
              
              <button
                onClick={() => setIsEditingBank(!isEditingBank)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-300 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="h-3 w-3" />
                {isEditingBank ? 'CANCEL' : 'EDIT DETAILS'}
              </button>
            </div>

            {bankSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl text-xs flex items-center gap-1.5 font-bold animate-pulse">
                <Check className="h-4 w-4" /> {bankSuccess}
              </div>
            )}

            {!isEditingBank ? (
              userBank ? (
                /* Premium Card Rendering */
                <div className="relative w-full rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 text-white overflow-hidden shadow-xl border border-slate-850">
                  <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase font-black">CONNECTED DEPOSITORY</span>
                      <h4 className="text-sm font-black font-mono tracking-wide mt-0.5">{userBank.bankName}</h4>
                    </div>
                    {/* Chip illustration */}
                    <div className="w-10 h-8 rounded-lg bg-gradient-to-r from-amber-400 to-amber-200/80 p-0.5 shadow-inner">
                      <div className="h-full w-full bg-slate-950/20 rounded-[6px] border border-amber-300/40" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Account Number</span>
                      <span className="text-md font-mono font-black tracking-widest mt-0.5 block">{userBank.accountNumber}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold">Account Holder</span>
                        <span className="text-xs font-black uppercase mt-0.5 block truncate">{userBank.accountHolder}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold">Routing / IFSC</span>
                        <span className="text-xs font-mono font-black mt-0.5 block">{userBank.routingCode}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                    No bank accounts linked. Tap 'EDIT DETAILS' to hook up your settlement account!
                  </p>
                </div>
              )
            ) : (
              /* Editable form for bank connection */
              <form onSubmit={handleSaveBankDetails} className="space-y-3.5 bg-slate-50 dark:bg-slate-900/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Commercial Bank"
                      value={editBankName}
                      onChange={(e) => setEditBankName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ALEX JACKPOT"
                      value={editAccountHolder}
                      onChange={(e) => setEditAccountHolder(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1102 9928 0192"
                      value={editAccountNumber}
                      onChange={(e) => setEditAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Routing / IFSC Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. APEX00921"
                      value={editRoutingCode}
                      onChange={(e) => setEditRoutingCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all"
                >
                  SAVE BANK PROFILE CONNECTION
                </button>
              </form>
            )}
          </div>

        </div>

        {/* RIGHT COMPONENT: GAMING ANALYTICS */}
        <div className="lg:col-span-5 space-y-8">

          {/* REAL-TIME GAMING ANALYTICS */}
          <div className="rounded-3xl bg-white dark:bg-slate-900/20 p-6 space-y-4 border border-slate-100 dark:border-slate-800/80 shadow-md" id="user-gaming-analytics">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-xl border border-indigo-150 dark:border-indigo-900/20">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-850 dark:text-slate-100">Gaming Activity Stats</h3>
                <p className="text-[10px] text-slate-400 font-mono">Dynamic tracking from active sessions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Last Played Game Receipt */}
              <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                <span className="text-[10px] font-mono text-slate-400 font-black uppercase tracking-widest block mb-3">
                  Last Played Game
                </span>
                
                {lastPlayedGame ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-black text-slate-850 dark:text-white">{lastPlayedGame.gameName}</span>
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black font-mono uppercase tracking-wide border ${
                        lastPlayedGame.status === 'win' 
                          ? 'bg-emerald-50 text-emerald-650 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30' 
                          : 'bg-rose-50 text-rose-650 border-rose-100 dark:bg-rose-950/40 dark:text-rose-450 dark:border-rose-900/30'
                      }`}>
                        {lastPlayedGame.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-dashed border-slate-200 dark:border-slate-800 text-[10px] font-mono">
                      <div>
                        <span className="text-slate-400 font-bold block uppercase text-[9px]">STAKE</span>
                        <span className="text-slate-800 dark:text-slate-200 font-black text-xs">${lastPlayedGame.betAmount}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block uppercase text-[9px]">COEFF</span>
                        <span className="text-slate-800 dark:text-slate-200 font-black text-xs">x{lastPlayedGame.multiplier}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block uppercase text-[9px]">PAYOUT</span>
                        <span className={`font-black text-xs ${lastPlayedGame.status === 'win' ? 'text-emerald-500' : 'text-slate-500'}`}>${lastPlayedGame.winAmount}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                      <span>Outcome: <strong className="text-slate-600 dark:text-slate-350">{lastPlayedGame.outcome}</strong></span>
                      <span>{new Date(lastPlayedGame.date).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">No gaming session recorded. Go roll some dice!</p>
                )}
              </div>

              {/* Most Played Game Metrics */}
              <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                <span className="text-[10px] font-mono text-slate-400 font-black uppercase tracking-widest block mb-3">
                  Favorite / Most Played Game
                </span>

                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-black text-slate-850 dark:text-slate-100">{mostPlayedGameName}</h4>
                    {mostPlayedCount > 0 ? (
                      <p className="text-[10px] text-slate-500 dark:text-slate-450 font-mono mt-1.5 leading-relaxed">
                        Total Bets: <strong className="text-slate-700 dark:text-slate-300">{mostPlayedCount} times</strong> <span className="text-slate-300 dark:text-slate-700">•</span> Volume: <strong className="text-slate-700 dark:text-slate-300">${mostPlayedTotalBet.toFixed(2)}</strong>
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1">No plays recorded yet</p>
                    )}
                  </div>
                  <span className="h-11 w-11 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-500 flex items-center justify-center text-xl shadow-xs border border-indigo-100/30 dark:border-indigo-900/10 shrink-0">
                    🎰
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Subtle Info Button for Terms & Regulatory Conditions */}
      <div className="flex justify-center items-center py-4" id="user-terms-container">
        <button
          onClick={() => setShowTermsModal(true)}
          className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
          id="btn-show-terms-modal"
          title="Terms & Regulatory Directives"
        >
          <Info className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        </button>
      </div>

      {/* Terms & Conditions Modal Overlay */}
      <AnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 shadow-2xl p-6 space-y-4"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowTermsModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Title Header */}
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="p-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-500">
                  <Shield className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide animate-pulse">
                  商業條款與合規監管條件
                </h3>
              </div>

              {/* Modal Body */}
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-3 leading-relaxed font-mono max-h-[300px] overflow-y-auto pr-1">
                <p className="text-slate-700 dark:text-slate-300">
                  歡迎來到 <strong className="text-slate-900 dark:text-white">MGM 澳門美高梅尊尚娛樂平台</strong>。登錄並訪問您的個人用戶控制面板，即表示您確認並同意遵守以下聲明的安全商業框架：
                </p>
                
                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-150/40 dark:border-slate-850">
                    <span className="font-extrabold text-amber-600 dark:text-amber-400 block text-[10px] uppercase mb-1">
                      1. VIP 權限清除協議
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium block">
                      執行委員會保留鎖定系統遊戲、重新校準玩家返還率指數以及應用 VIP 權限的最終權力。受限制的 VIP 系統需要特定的賬戶許可。
                    </span>
                  </div>
                  
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-150/40 dark:border-slate-850">
                    <span className="font-extrabold text-amber-600 dark:text-amber-400 block text-[10px] uppercase mb-1">
                      2. 財務結算限額
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium block">
                      所有模擬存款、獎金和分類賬餘額均嚴格綁定至此本地工作區配置文件。分類賬審計每小時自動清除，且無任何外部責任或實際法律義務。
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-150/40 dark:border-slate-850">
                    <span className="font-extrabold text-amber-600 dark:text-amber-400 block text-[10px] uppercase mb-1">
                      3. 安全防護與合規審計
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium block">
                      MGM 平台配備最先進的本地加密與會話保護技術，確保所有模擬操作和 VIP 帳戶活動都在最高安全級別下進行。用戶有義務維護會話安全。
                    </span>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    法律聲明：訪問這些安全指令對經過驗證的本地用戶會話完全私密。這使機密準則免受公眾視圖的影響。
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Alerts & Notifications Modal */}
      <AnimatePresence>
        {showNotifModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 shadow-2xl p-6 space-y-4"
              id="admin-alerts-modal-container"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowNotifModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Title Header */}
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="p-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-500">
                  <Bell className="h-4 w-4 animate-pulse" />
                </span>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide font-mono">
                  Risk Management & Admin Broadcast Alerts
                </h3>
              </div>

              {/* Modal Body */}
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {userNotifications.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-mono space-y-2">
                    <span className="text-2xl block">🔔</span>
                    <p className="text-xs">No active administrative notifications have been dispatched to your terminal yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userNotifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/5 border border-amber-100/60 dark:border-amber-900/10 space-y-2"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-xs font-black text-amber-700 dark:text-amber-400 font-mono flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                            {notif.title}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono shrink-0">
                            {new Date(notif.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                          {notif.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowNotifModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Close Terminal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
