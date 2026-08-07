import React, { useState } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { motion, useMotionValue, useSpring } from 'motion/react';
import mgmLogo from '../assets/images/mgm_logo_1783507972249.jpg';
import { 
  Bell, 
  Wallet, 
  Coins, 
  LogOut, 
  User, 
  ShieldCheck, 
  Sparkles, 
  CheckCheck, 
  Trash2, 
  Menu, 
  X,
  History as HistoryIcon,
  Settings,
  Dices,
  Banknote,
  Headset
} from 'lucide-react';

interface NavbarProps {
  onNavigate: (tab: string) => void;
  currentTab: string;
}

interface AnimatedBalanceBadgeProps {
  value: number;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
}

const AnimatedBalanceBadge: React.FC<AnimatedBalanceBadgeProps> = ({ value, label, icon, colorClass }) => {
  const motionValue = useMotionValue(value);
  const springValue = useSpring(motionValue, {
    stiffness: 75,
    damping: 14,
  });

  const elementRef = React.useRef<HTMLSpanElement>(null);
  const [bounce, setBounce] = useState(false);

  // Trigger bounce and set new target value on update
  React.useEffect(() => {
    motionValue.set(value);
    setBounce(true);
    const timer = setTimeout(() => setBounce(false), 400);
    return () => clearTimeout(timer);
  }, [value, motionValue]);

  // Read actual interpolated motion values to update textContent without React re-renders
  React.useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (elementRef.current) {
        elementRef.current.textContent = `$${Number(latest).toFixed(2)}`;
      }
    });
    return () => unsubscribe();
  }, [springValue]);

  return (
    <motion.div
      animate={bounce ? { 
        scale: [1, 1.15, 0.96, 1],
        y: [0, -3, 1, 0]
      } : {}}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`flex items-center gap-1 ${colorClass}`}
    >
      {icon}
      <span ref={elementRef} className="font-mono text-xs font-bold">
        ${value.toFixed(2)}
      </span>
    </motion.div>
  );
};

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentTab }) => {
  const { 
    currentUser, 
    notifications, 
    markAllNotificationsRead, 
    clearNotifications, 
    logout,
    currentRole 
  } = usePlatform();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userNotifications = notifications.filter(n => !n.userId || (currentUser && n.userId === currentUser.id));
  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    onNavigate('dashboard');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: User },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'referral', label: 'Referral Program', icon: ShieldCheck },
    { id: 'support', label: 'Support Desk', icon: Bell },
    { id: 'history', label: 'Audit History', icon: HistoryIcon },
  ];

  if (currentRole === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Panel', icon: Settings });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white dark:bg-slate-950 transition-colors duration-300 shadow-sm">
      <div className="mx-auto max-w-7xl px-2 xs:px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-1 sm:gap-4">
          
          {/* Logo Section */}
          <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => onNavigate('home')}>
            <img 
              src={mgmLogo} 
              alt="MGM Logo" 
              className="h-10 w-10 rounded-xl aspect-square object-cover shadow-md shadow-amber-500/10 flex-shrink-0" 
              referrerPolicy="no-referrer"
            />
            <div className="hidden sm:block">
              <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-emerald-600 to-amber-500 dark:from-white dark:via-emerald-400 dark:to-amber-400 bg-clip-text text-transparent">
                MGM 澳門美高梅
              </h1>
              <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                PREMIUM ECOSYSTEM
              </p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-1 sm:gap-4">
            
            {/* Screenshot-inspired Quick Actions Panel */}
            <div className="flex items-center gap-2 xs:gap-3.5 sm:gap-6 mr-1 sm:mr-3 border-r border-slate-100 dark:border-slate-800 pr-1.5 sm:pr-4 animate-fade-in" id="header-quick-actions">
              {/* Game */}
              <button
                onClick={() => {
                  onNavigate('home');
                  setTimeout(() => {
                    const el = document.getElementById('home-feed-root');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className={`flex flex-col items-center justify-center transition-all group cursor-pointer ${
                  currentTab === 'home' 
                    ? 'text-slate-900 dark:text-white font-extrabold' 
                    : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                }`}
                id="top-panel-btn-game"
              >
                <Dices className={`h-5 w-5 stroke-[1.5] group-hover:scale-110 transition-transform ${
                  currentTab === 'home' 
                    ? 'text-emerald-500 dark:text-emerald-400' 
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`} />
                <span className="text-[11px] font-medium tracking-wide mt-0.5">Game</span>
              </button>

              {/* History */}
              <button
                onClick={() => onNavigate('history')}
                className={`flex flex-col items-center justify-center transition-all group cursor-pointer ${
                  currentTab === 'history' 
                    ? 'text-slate-900 dark:text-white font-extrabold' 
                    : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                }`}
                id="top-panel-btn-history"
              >
                <HistoryIcon className={`h-5 w-5 stroke-[1.5] group-hover:scale-110 transition-transform ${
                  currentTab === 'history' 
                    ? 'text-emerald-500 dark:text-emerald-400' 
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`} />
                <span className="text-[11px] font-medium tracking-wide mt-0.5">History</span>
              </button>

              {/* Credit */}
              <button
                onClick={() => onNavigate('credit')}
                className={`flex flex-col items-center justify-center transition-all group cursor-pointer ${
                  currentTab === 'credit' 
                    ? 'text-slate-900 dark:text-white font-extrabold' 
                    : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                }`}
                id="top-panel-btn-credit"
              >
                <ShieldCheck className={`h-5 w-5 stroke-[1.5] group-hover:scale-110 transition-transform ${
                  currentTab === 'credit' 
                    ? 'text-emerald-500 dark:text-emerald-400' 
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`} />
                <span className="text-[11px] font-medium tracking-wide mt-0.5">Credit</span>
              </button>

              {/* Support */}
              <button
                onClick={() => onNavigate('support')}
                className={`flex flex-col items-center justify-center transition-all group cursor-pointer ${
                  currentTab === 'support' 
                    ? 'text-slate-900 dark:text-white font-extrabold' 
                    : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                }`}
                id="top-panel-btn-support"
              >
                <Headset className={`h-5 w-5 stroke-[1.5] group-hover:scale-110 transition-transform ${
                  currentTab === 'support' 
                    ? 'text-emerald-500 dark:text-emerald-400' 
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`} />
                <span className="text-[11px] font-medium tracking-wide mt-0.5">Support</span>
              </button>
            </div>

            {/* Notification Center Trigger */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setProfileOpen(false);
                }}
                className={`p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all relative ${
                  notifOpen ? 'bg-slate-100 dark:bg-slate-900' : ''
                }`}
                id="btn-notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Box */}
              {notifOpen && (
                <div 
                  className="absolute right-0 mt-2 w-80 rounded-2xl glass p-4 shadow-xl transition-all duration-300 z-50 text-slate-900 dark:text-slate-100"
                  id="notifications-dropdown"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                    <h3 className="text-sm font-bold">Activity Notifications</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={markAllNotificationsRead}
                        className="text-[11px] text-emerald-500 hover:underline flex items-center gap-0.5 font-medium"
                      >
                        <CheckCheck className="h-3 w-3" /> Read all
                      </button>
                      <button 
                        onClick={clearNotifications}
                        className="text-[11px] text-slate-400 hover:text-rose-500 hover:underline flex items-center gap-0.5 font-medium"
                      >
                        <Trash2 className="h-3 w-3" /> Clear
                      </button>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {userNotifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">
                        No notifications to display.
                      </div>
                    ) : (
                      userNotifications.map(n => (
                        <div 
                          key={n.id} 
                          className={`p-2.5 rounded-xl border transition-all text-xs ${
                            n.isRead 
                              ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-900 text-slate-400 dark:text-slate-500' 
                              : 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100/60 dark:border-emerald-900/40 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{n.title}</span>
                            <span className="text-[9px] text-slate-400 font-mono shrink-0">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="mt-1 leading-normal text-[11px]">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Trigger */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setProfileOpen(!profileOpen);
                    setNotifOpen(false);
                  }}
                  className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer"
                  id="btn-profile-trigger"
                >
                  <span className="text-xl h-7 w-7 flex items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                    {currentUser.avatar || '🦊'}
                  </span>
                  <span className="hidden lg:block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {currentUser.username}
                  </span>
                </button>

                {/* Profile Box */}
                {profileOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 rounded-2xl glass p-2 shadow-xl z-50 text-slate-900 dark:text-slate-100"
                    id="profile-dropdown"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <p className="text-xs text-slate-400 dark:text-slate-500">Logged in as</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-sm font-extrabold text-emerald-500">{currentUser.username}</p>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-black uppercase ${
                          currentUser.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {currentUser.role || 'User'}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">{currentUser.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        onNavigate('dashboard');
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-slate-700 dark:text-slate-300 font-medium"
                    >
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      View Profile Card
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all font-semibold"
                      id="btn-logout"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out Account
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-xs font-extrabold shadow-md hover:from-emerald-600 hover:to-teal-600 transition-all"
                id="btn-login-redirect"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Toggler */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              id="mobile-menu-toggler"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

          </div>
        </div>
      </div>



      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t glass border-slate-200/50 dark:border-white/10 px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
