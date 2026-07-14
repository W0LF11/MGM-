import React, { useState } from 'react';
import { usePlatform } from '../context/PlatformContext';
import mgmLogo from '../assets/images/mgm_logo_1783507972249.jpg';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, User, Phone, Users, Shield, ArrowRight, Check, AlertCircle, Lock } from 'lucide-react';

export const AuthPanel: React.FC = () => {
  const { login, register } = usePlatform();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [adminCode, setAdminCode] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!password.trim()) {
        setError('❌ Please specify a security password to proceed.');
        setLoading(false);
        return;
      }

      if (isSignUp) {
        if (!username.trim() || !email.trim() || !phone.trim()) {
          setError('Please fill in all required fields.');
          setLoading(false);
          return;
        }
        
        // Basic Email validation
        if (!email.includes('@')) {
          setError('Please provide a valid email address.');
          setLoading(false);
          return;
        }

        if (password.trim().length < 6) {
          setError('❌ Security requirement: Password must contain at least 6 characters.');
          setLoading(false);
          return;
        }

        const ok = await register(
          username.trim(), 
          email.trim(), 
          phone.trim(), 
          password.trim(),
          referralCode.trim() || undefined,
          adminCode.trim() || undefined
        );
        if (ok) {
          setSuccess(true);
        } else {
          setError('Registration failed. The email might already be in use.');
        }
      } else {
        if (!email.trim()) {
          setError('Please enter your email address.');
          setLoading(false);
          return;
        }

        const ok = await login(email.trim(), password.trim());
        if (ok) {
          setSuccess(true);
        } else {
          setError('Authentication failed. Please check your credentials or register an account.');
        }
      }
    } catch (err: any) {
      console.error('[AuthPanel] Authentication error intercepted:', err);
      const errMsg = err?.message || '';
      const errCode = err?.code || '';
      
      if (errCode === 'auth/invalid-credential' || errMsg.includes('invalid-credential')) {
        setError('❌ Access Denied: Invalid security password or unregistered player node. Please check your spelling or register a new account.');
      } else if (errCode === 'auth/email-already-in-use' || errMsg.includes('email-already-in-use')) {
        setError('❌ Registration Failed: This email address is already registered on our servers. Please login instead.');
      } else if (errCode === 'auth/invalid-email' || errMsg.includes('invalid-email')) {
        setError('❌ Format Error: The provided email is invalid. Please double-check formatting.');
      } else if (errCode === 'auth/weak-password' || errMsg.includes('weak-password')) {
        setError('❌ Security Alert: The selected password is too weak. Please use at least 6 characters.');
      } else {
        setError(`❌ Security Authentication Error: ${err?.message || 'Access rejected by secure node'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden" id="auth-panel-root">
      
      {/* Premium Background Ambiance */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 -translate-y-1/2 w-[350px] h-[350px] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        
        {/* Logo and Greeting Header */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-block p-1 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-xl shadow-amber-500/10"
          >
            <img 
              src={mgmLogo} 
              alt="MGM Logo" 
              className="h-16 w-16 rounded-[22px] object-cover" 
              referrerPolicy="no-referrer"
            />
          </motion.div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-widest bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">
              MGM 澳門美高梅
            </h2>
            <p className="text-[10px] font-mono font-bold tracking-[0.25em] uppercase text-amber-500/80">
              PREMIUM CASINO PORTAL
            </p>
          </div>
        </div>

        {/* Auth Glass Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-slate-900/60 border border-slate-800 backdrop-blur-xl rounded-[32px] p-8 shadow-2xl space-y-6 relative"
          id="auth-card"
        >
          {/* Security Indicator */}
          <div className="absolute top-4 right-6 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono font-bold text-emerald-400">
            <Shield className="h-3 w-3" />
            SECURE SSL
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-850">
            <button
              onClick={() => { setIsSignUp(false); setError(null); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                !isSignUp 
                  ? 'bg-slate-800 text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In Account
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(null); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isSignUp 
                  ? 'bg-slate-800 text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register Portal
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* Username (Sign Up Only) */}
            <AnimatePresence initial={false}>
              {isSignUp && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold block">
                    Gamer Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. lucky_spinner"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email (Always) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold block">
                {isSignUp ? 'Email Address' : 'Sign-In Email'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder={isSignUp ? 'your@email.com' : 'Enter email or admin@luckyplatform.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Password (Always) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold block">
                Security Password <span className="text-[9px] text-amber-500 font-bold">(Required)</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="Enter secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Phone (Sign Up Only) */}
            <AnimatePresence initial={false}>
              {isSignUp && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold block">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Referral Code (Sign Up Only) */}
            <AnimatePresence initial={false}>
              {isSignUp && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold block">
                    Referral Code <span className="text-[9px] text-slate-600 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. ALEX99"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Admin Code (Sign Up Only) */}
            <AnimatePresence initial={false}>
              {isSignUp && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold block flex justify-between">
                    <span>Admin Activation Code <span className="text-[9px] text-slate-600 font-normal">(Optional)</span></span>
                    <span className="text-[8px] text-slate-500 lowercase font-normal">Use MGM_ADMIN_SECRET_KEY_2026</span>
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-3 h-4 w-4 text-amber-500/70" />
                    <input
                      type="password"
                      placeholder="Enter secret admin key to elevate account"
                      value={adminCode}
                      onChange={(e) => setAdminCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-amber-200 placeholder-slate-700 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Security Explanation Note */}
            <div className="text-[10px] text-slate-500 leading-relaxed font-mono">
              ℹ️ Security Audit Rule: Encrypted standard account passwords safeguard your digital wallet balance and console authorizations.
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                loading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:shadow-lg hover:shadow-amber-500/10 active:scale-95 cursor-pointer font-black'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-500 border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  {isSignUp ? 'Complete Registration' : 'Secure Lobby Access'}
                  <ArrowRight className="h-4 w-4 text-slate-950" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Corporate Operator Info */}
        <div className="text-center space-y-1 text-[10px] text-slate-600 font-mono">
          <p>🔒 128-Bit SSL Transaction Encryption System Active</p>
          <p>Corporate accounts and players log in from the same secure node.</p>
        </div>

      </div>
    </div>
  );
};
