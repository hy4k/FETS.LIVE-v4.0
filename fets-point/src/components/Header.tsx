import { FetsLogo } from './FetsLogo';
import './HeaderTheme.css'; // Import the new theme
import { Bell, Menu, X, ChevronDown, MapPin, Sparkles, User, Zap, Building2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useBranch } from '../hooks/useBranch';
import { useUnreadCount } from '../hooks/useNotifications';
import NotificationPanel from './iCloud/NotificationPanel';
import { canSwitchBranches, formatBranchName, getAvailableBranches } from '../utils/authUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  isMobile?: boolean;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export function Header({ isMobile = false, sidebarOpen = false, setSidebarOpen }: HeaderProps = {}) {
  const { profile, user } = useAuth();
  const { activeBranch, setActiveBranch } = useBranch();
  const unreadCount = useUnreadCount();
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  // Branch Switcher State (Integrated)
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableBranches = getAvailableBranches(profile?.email, profile?.role);
  const canSwitch = canSwitchBranches(profile?.email, profile?.role);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
    }
    if (isBranchDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isBranchDropdownOpen]);

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.full_name) {
      return profile.full_name;
    }
    if (user?.email) {
      const name = user.email.split('@')[0];
      return name.split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ');
    }
    return 'User';
  };

  const currentBranchName = activeBranch === 'calicut' ? 'Calicut' : activeBranch === 'cochin' ? 'Cochin' : 'Global View';

  return (
    <>
      {/* PREMIUM HEADER - Nano Banana Design */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-[#FFD700] shadow-md transition-all duration-300">

        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

        {/* Glassmorphism Shine */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>

        <div className="max-w-[1920px] mx-auto px-6 h-28 relative z-10 flex items-center justify-between gap-8">

          {/* LEFT: Branding */}
          <div className="flex items-center gap-6 shrink-0">
            {/* Mobile Menu */}
            {isMobile && setSidebarOpen && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="fets-panel p-3 text-yellow-950 transition-colors"
                style={{ borderRadius: '12px' }}
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            )}

            {/* FETS.LIVE Logo - Animated Button Edition */}
            <div className="flex flex-col justify-center h-full py-2">
              <FetsLogo />
            </div>
          </div>

          {/* CENTER: Quick Command Search */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-auto">
            <div className="fets-search-container group">
              <div className="pointer-events-none pl-2 pr-3">
                <Sparkles className="h-5 w-5 text-yellow-800/40 group-focus-within:text-yellow-800 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Type / to search commands, candidates, or staff..."
                className="fets-search-input"
              />
              <div className="pointer-events-none pr-2">
                <kbd className="hidden sm:inline-block px-2 py-1 bg-yellow-500/10 border border-yellow-600/10 rounded-md text-[10px] font-bold text-yellow-900/60 uppercase tracking-wider">CTRL + K</kbd>
              </div>
            </div>
          </div>

          {/* RIGHT: Unified Action Bar */}
          <div className="flex items-center gap-4 shrink-0">

            {/* Branch Control */}
            <div ref={dropdownRef} className="relative hidden md:block">
              <motion.div
                className="fets-panel flex items-center p-1.5 pr-4 cursor-pointer"
                onClick={() => canSwitch && setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-9 h-9 rounded-xl bg-yellow-500 text-white flex items-center justify-center shadow-inner">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex flex-col ml-3">
                  <span className="text-[10px] uppercase font-bold text-yellow-900/60 tracking-wider mb-px">Location</span>
                  <span className="text-sm font-bold text-yellow-950 leading-none">{currentBranchName}</span>
                </div>
                {canSwitch && <ChevronDown className="w-4 h-4 text-yellow-900/40 ml-2" />}
              </motion.div>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isBranchDropdownOpen && canSwitch && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/60 overflow-hidden z-50 p-2"
                  >
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-2">Select Branch</div>
                    {availableBranches.map((branch) => (
                      <button
                        key={branch}
                        onClick={() => {
                          setActiveBranch(branch as any);
                          setIsBranchDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeBranch === branch
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-950 shadow-md'
                          : 'hover:bg-gray-100 text-gray-700'
                          }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${activeBranch === branch ? 'bg-black' : 'bg-gray-400'}`}></div>
                        <span className="font-semibold text-sm">{formatBranchName(branch)}</span>
                        {activeBranch === branch && <Sparkles className="w-4 h-4 ml-auto text-yellow-900/50" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="w-[1px] h-10 bg-black/5 hidden md:block"></div>

            {/* Notifications */}
            <div className="relative">
              <motion.button
                onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                className="fets-panel p-3 text-yellow-950 group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative">
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#FDB931]"></span>
                  )}
                </div>
              </motion.button>
            </div>

            {/* User Profile */}
            <div className="fets-panel hidden sm:flex items-center pl-1 pr-4 py-1 cursor-default group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-100 to-orange-50 flex items-center justify-center text-yellow-900 shadow-sm group-hover:scale-105 transition-transform">
                <User className="w-5 h-5" />
              </div>
              <div className="flex flex-col mx-3">
                <span className="text-sm font-bold text-yellow-950 leading-none">{getDisplayName()}</span>
                <span className="text-[10px] font-bold text-yellow-900/60 uppercase tracking-widest leading-tight mt-0.5">
                  {profile?.role?.replace('_', ' ') || 'Staff'}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Notification Panel Overlay */}
        <AnimatePresence>
          {showNotificationPanel && (
            <NotificationPanel onClose={() => setShowNotificationPanel(false)} />
          )}
        </AnimatePresence>
      </div>

    </>
  )
}