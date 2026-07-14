import React, { useState, useEffect } from 'react';
import { PlatformProvider, usePlatform } from './context/PlatformContext';
import mgmLogo from './assets/images/mgm_logo_1783507972249.jpg';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { GameCenter } from './components/GameCenter';
import { Wallet } from './components/Wallet';
import { Referral } from './components/Referral';
import { Support } from './components/Support';
import { History } from './components/History';
import { AdminPanel } from './components/AdminPanel';
import { CreditScore } from './components/CreditScore';
import { HomeFeed } from './components/HomeFeed';
import { Toaster } from './components/Toaster';
import { AuthPanel } from './components/AuthPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home as HomeIcon, 
  Wallet as WalletIcon, 
  Users as UsersIcon, 
  Gamepad2 as GamepadIcon, 
  User as UserIcon,
  Shield as ShieldIcon
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentRole, currentUser, authLoading, logout, setRole } = usePlatform();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [historySubTab, setHistorySubTab] = useState<'games' | 'wallet' | 'referrals' | 'sessions' | 'notifications'>('games');
  const [showLoader, setShowLoader] = useState(true);

  // Force dark theme for the entire platform unconditionally as per user instruction
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add('dark');
    root.classList.remove('light');
  }, []);

  // Handle privilege access check for administration page
  useEffect(() => {
    if (currentTab === 'admin' && currentRole !== 'admin' && currentRole !== 'super_admin') {
      setCurrentTab('dashboard');
    }
  }, [currentRole, currentTab]);

  // Handle loading screen timeout
  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [authLoading]);

  const handleNavigate = (tab: string, subTab?: string) => {
    setCurrentTab(tab);
    if (tab === 'history' && subTab) {
      setHistorySubTab(subTab as any);
    }
  };

  // If user is not authenticated, show unified sign in / sign up portal first
  if (!currentUser) {
    if (authLoading || showLoader) {
      return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
          <div className="flex flex-col items-center space-y-6 max-w-xs text-center">
            <div className="relative p-1 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-2xl shadow-amber-500/20">
              <img 
                src={mgmLogo} 
                alt="MGM Logo" 
                className="h-24 w-24 rounded-[22px] object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-widest bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">
                MGM 澳門美高梅
              </h2>
              <p className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-amber-500/80">
                PREMIUM CASINO PORTAL
              </p>
            </div>
            <div className="relative flex items-center justify-center pt-4">
              <div className="animate-spin rounded-full h-9 w-9 border-2 border-amber-500 border-t-transparent border-r-transparent shadow-md" />
              <span className="absolute text-[8px] font-mono text-amber-400 animate-pulse">MGM</span>
            </div>
          </div>
        </div>
      );
    }
    return <AuthPanel />;
  }

  // INTERCEPT SUSPENDED/DISABLED USERS IMMEDIATELY
  if (currentUser && currentUser.status === 'suspended' && currentRole !== 'admin' && currentRole !== 'super_admin') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4">
        <Toaster />
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col items-center text-center space-y-4 border-b border-slate-800 pb-6">
            <div className="h-16 w-16 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-2xl flex items-center justify-center text-3xl animate-pulse">
              🔒
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-rose-500 tracking-wider font-mono uppercase">
                Account Suspended
              </h2>
              <p className="text-xs text-slate-400 font-mono">MGM MACAU PREMIUM SECURITY BLOCK</p>
            </div>
            <p className="text-xs text-slate-300 font-sans max-w-md leading-relaxed">
              Your member account ledger has been administratively disabled. Access to the premium gaming hall, wallet transactions, and VIP privileges is restricted until security clearance is verified.
            </p>
            
            <button
              onClick={logout}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] rounded-lg uppercase tracking-wider transition-all cursor-pointer"
            >
              Sign Out Account
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-emerald-500">💬</span>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 font-mono">
                24/7 Verified Support Terminal
              </h3>
            </div>
            
            {/* Embedded Live Support Widget so they can only chat */}
            <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/60 max-h-[400px] overflow-y-auto">
              <Support />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 1. CONDITIONAL OPERATIONAL LAYOUT: FULL-SCREEN WIDESCREEN ADMIN COMMAND HUB
  if (currentUser && (currentRole === 'admin' || currentRole === 'super_admin')) {
    return (
      <>
        <AnimatePresence>
          {showLoader && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white"
              id="brand-loading-screen"
            >
              <div className="flex flex-col items-center space-y-6 max-w-xs text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="relative p-1 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-2xl shadow-amber-500/20"
                >
                  <img 
                    src={mgmLogo} 
                    alt="MGM Logo" 
                    className="h-24 w-24 rounded-[22px] object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </motion.div>

                <div className="space-y-2">
                  <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-black tracking-widest bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent"
                  >
                    MGM 澳門美高梅
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    transition={{ delay: 0.4 }}
                    className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-amber-500/80"
                  >
                    CORPORATE COMMAND CONSOLE
                  </motion.p>
                </div>

                <div className="relative flex items-center justify-center pt-4">
                  <div className="animate-spin rounded-full h-9 w-9 border-2 border-amber-500 border-t-transparent border-r-transparent shadow-md" />
                  <span className="absolute text-[8px] font-mono text-amber-400 animate-pulse">MGM</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between" id="admin-app-root">
          <Toaster />
          
          <div className="flex-1">
            {/* Secure Admin Corporate Header */}
            <header className="bg-slate-900 border-b border-slate-850 px-6 py-4 flex justify-between items-center shadow-md">
              <div className="flex items-center gap-2.5">
                <span className="h-9 w-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                  <ShieldIcon className="h-5 w-5" />
                </span>
                <div>
                  <span className="text-sm font-black tracking-tight text-white block uppercase">Admin Panel</span>
                  <span className="text-[10px] text-slate-500 font-mono block">Authorized Administrator Access</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block font-mono text-[11px]">
                  <span className="font-extrabold text-slate-300 block">{currentUser.email}</span>
                  <span className="text-[9px] text-emerald-400 font-bold block">AUDIT OPERATOR</span>
                </div>
                
                <button
                  onClick={() => setRole('user')}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-bold text-slate-300 border border-slate-700/50 transition-all uppercase"
                >
                  Switch to Player View
                </button>

                <button
                  onClick={logout}
                  className="px-3.5 py-1.5 bg-rose-950/40 hover:bg-rose-950/80 rounded-xl text-[10px] font-bold text-rose-400 border border-rose-500/20 transition-all uppercase"
                >
                  Secure Signout
                </button>
              </div>
            </header>

            {/* Main Admin Console */}
            <main className="py-6">
              <ErrorBoundary>
                <AdminPanel />
              </ErrorBoundary>
            </main>
          </div>
        </div>
      </>
    );
  }

  // 2. STANDARD CUSTOMER / PLAYER PORTAL LAYOUT
  return (
    <>
      <AnimatePresence>
        {showLoader && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white"
            id="brand-loading-screen"
          >
            <div className="flex flex-col items-center space-y-6 max-w-xs text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative p-1 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-2xl shadow-amber-500/20"
              >
                <img 
                  src={mgmLogo} 
                  alt="MGM Logo" 
                  className="h-24 w-24 rounded-[22px] object-cover" 
                  referrerPolicy="no-referrer"
                />
              </motion.div>

              <div className="space-y-2">
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-black tracking-widest bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent"
                >
                  MGM 澳門美高梅
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ delay: 0.4 }}
                  className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-amber-500/80"
                >
                  PREMIUM CASINO ECOSYSTEM
                </motion.p>
              </div>

              {/* Beautiful Loading Circle */}
              <div className="relative flex items-center justify-center pt-4">
                <div className="animate-spin rounded-full h-9 w-9 border-2 border-amber-500 border-t-transparent border-r-transparent shadow-md" />
                <span className="absolute text-[8px] font-mono text-amber-400 animate-pulse">MGM</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen app-bg text-slate-900 dark:text-white transition-colors duration-300 flex flex-col justify-between pb-16" id="app-layout-root">
      
      {/* Toast Alerts Notification System */}
      <Toaster />

      {/* Top sticky navigation menu header */}
      <div className="flex-1">
        <Navbar 
          onNavigate={handleNavigate} 
          currentTab={currentTab} 
        />

        {/* Global Announcement Banners System (CMS) */}
        <AnnouncementBanner />

        {/* Dynamic page container routing with sliding fade page transitions */}
        <main className="pb-12 pt-4 relative overflow-x-hidden" id="app-routing-main">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full"
            >
              {currentTab === 'home' && (
                <HomeFeed 
                  onNavigate={handleNavigate}
                  onPlayGame={(gameId) => {
                    setSelectedGameId(gameId);
                  }}
                />
              )}
              {currentTab === 'dashboard' && <Dashboard />}
              {currentTab === 'wallet' && <Wallet />}
              {currentTab === 'credit' && <CreditScore />}
              {currentTab === 'referral' && <Referral />}
              {currentTab === 'support' && <Support />}
              {currentTab === 'history' && (
                <History 
                  initialSubTab={historySubTab} 
                  onSubTabChange={(sub) => setHistorySubTab(sub as any)} 
                />
              )}
              {currentTab === 'admin' && (currentRole === 'admin' || currentRole === 'super_admin') && <AdminPanel />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <GameCenter 
        modalOnly={true}
        initialGameId={selectedGameId} 
        onClearGameId={() => setSelectedGameId(null)} 
      />

      {/* PERSISTENT BOTTOM TAB BAR NAVIGATION MENU (Screenshot Inspired) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-950/85 backdrop-blur-lg border-t border-slate-200/50 dark:border-white/10 px-4 py-2 shadow-xl flex justify-around items-center h-16" id="app-bottom-navbar">
        {[
          { id: 'home', label: 'Home', icon: HomeIcon },
          { id: 'wallet', label: 'Wallet', icon: WalletIcon },
          { id: 'referral', label: 'Agent', icon: UsersIcon },
          { id: 'dashboard', label: 'My', icon: UserIcon },
          ...((currentRole === 'admin' || currentRole === 'super_admin') ? [{ id: 'admin', label: 'Console', icon: ShieldIcon }] : [])
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setCurrentTab(tab.id);
                setSelectedGameId(null);
              }}
              className="flex-1 flex flex-col items-center justify-center relative py-1 cursor-pointer select-none"
              id={`bottom-tab-${tab.id}`}
            >
              {/* Sliding top line active indicator */}
              {isActive && (
                <motion.div 
                  layoutId="activeBottomTabPill"
                  className="absolute -top-2 h-0.5 w-8 bg-emerald-500 rounded-full dark:bg-emerald-400"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              
              <motion.div
                animate={{ 
                  scale: isActive ? 1.15 : 1,
                  color: isActive ? '#10b981' : '#94a3b8' 
                }}
                className={`flex h-6 w-6 items-center justify-center transition-colors ${
                  isActive ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                }`}
              >
                <Icon className="h-5 w-5" />
              </motion.div>
              
              <span className={`text-[10px] mt-0.5 font-bold transition-all ${
                isActive ? 'text-emerald-500 dark:text-emerald-400 font-black' : 'text-slate-400 dark:text-slate-500'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

    </div>
    </>
  );
};

// Internal subcomponent to render active promotional banner announcements
const AnnouncementBanner: React.FC = () => {
  const { announcements } = usePlatform();
  if (announcements.length === 0) return null;

  // Let's render the first banner of type 'announcement' or 'promotion'
  const activeAnn = announcements[0];

  // Map bannerImage string to beautiful gradient classes
  let gradientClasses = 'from-rose-500 via-indigo-600 to-teal-500';
  if (activeAnn.bannerImage === 'sunset') {
    gradientClasses = 'from-amber-500 via-orange-600 to-rose-600';
  } else if (activeAnn.bannerImage === 'emerald') {
    gradientClasses = 'from-emerald-500 via-teal-600 to-cyan-600';
  } else if (activeAnn.bannerImage === 'indigo') {
    gradientClasses = 'from-indigo-600 via-violet-600 to-fuchsia-600';
  } else if (activeAnn.bannerImage === 'obsidian') {
    gradientClasses = 'from-slate-800 via-slate-900 to-black border-b border-white/10';
  }

  return (
    <div className={`bg-gradient-to-r ${gradientClasses} text-white text-[11px] font-bold py-2 px-4 text-center select-none flex justify-center items-center gap-2 shadow-inner`} id="cms-global-announcement">
      <span className="bg-white/20 px-2 py-0.5 rounded-full uppercase text-[9px] font-mono">
        {activeAnn.type}
      </span>
      <span>{activeAnn.title}: {activeAnn.content}</span>
    </div>
  );
};

export default function App() {
  return (
    <PlatformProvider>
      <MainAppContent />
    </PlatformProvider>
  );
}
