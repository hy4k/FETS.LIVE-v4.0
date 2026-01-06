import { FetsLogo } from './FetsLogo';
import './HeaderTheme.css'; // Import the new theme
import {
  Bell, ChevronDown, MapPin, LayoutDashboard,
  Brain, ShieldAlert, MessageSquare, ClipboardList,
  CalendarDays, UserSearch, UserCheck, Menu, LogOut,
  Server, Cpu, Shield, X
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
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
  setActiveTab?: (tab: string) => void;
  activeTab?: string;
}

/**
 * Helper to wrap each character in a span with a CSS variable for animation delay
 */
const AnimatedLabel = ({ label }: { label: string }) => {
  return (
    <span className="flex gap-[0.05em]">
      {label.split('').map((char, index) => (
        <span
          key={index}
          style={{ '--char-index': index } as React.CSSProperties}
          className="inline-block"
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
};

export function Header({ isMobile = false, sidebarOpen = false, setSidebarOpen, setActiveTab, activeTab }: HeaderProps = {}) {
  const { profile, signOut } = useAuth();
  const { activeBranch, setActiveBranch } = useBranch();
  const unreadCount = useUnreadCount();
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  // Branch Switcher State
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

  const currentBranchName = activeBranch === 'calicut' ? 'Calicut' : activeBranch === 'cochin' ? 'Cochin' : 'Global View';

  // --- NAVIGATION ITEMS ---
  const topNavItems = [
    { id: 'command-center', label: 'FETS POINT', icon: LayoutDashboard },
    { id: 'candidate-tracker', label: 'FETS REGISTER', icon: UserSearch },
    { id: 'fets-calendar', label: 'FETS CALENDAR', icon: CalendarDays },
    { id: 'fets-roster', label: 'FETS ROSTER', icon: UserCheck },
  ].filter(item => {
    // Roster is now visible to all staff
    return true;
  });

  const secondRowItems = [
    { id: 'checklist-management', label: 'CHECKLIST', icon: ClipboardList },
    { id: 'my-desk', label: 'MY DESK', icon: MessageSquare },
    { id: 'system-manager', label: 'SYSTEM MANAGER', icon: Server },
    { id: 'fets-intelligence', label: 'FETS INTELLIGENCE', icon: Brain },
    { id: 'user-management', label: 'USER MGMT', icon: Shield },
  ].filter(item => {
    if (item.id === 'user-management') {
      const isMithun = profile?.email === 'mithun@fets.in';
      const isSuperAdmin = profile?.role === 'super_admin';
      return isMithun || isSuperAdmin;
    }
    return true;
  });

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  const MobileMenu = () => (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-[#e0e5ec] flex flex-col pt-safe"
    >
      {/* Header of Mobile Menu */}
      <div className="p-6 flex items-center justify-between border-b border-white/20">
        <FetsLogo />
        <button
          onClick={() => setSidebarOpen?.(false)}
          className="p-3 bg-[#e0e5ec] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] rounded-xl text-gray-600 active:shadow-inner"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Profile Section */}
      <div className="px-8 py-10">
        <div className="flex items-center gap-6 p-6 bg-[#e0e5ec] shadow-[8px_8px_16px_#bec3c9,-8px_-8px_16px_#ffffff] rounded-3xl">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border-2 border-white/50">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-3xl font-black">
                {profile?.full_name?.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-gray-800 tracking-tight leading-tight">{profile?.full_name}</h2>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mt-1">{profile?.role?.replace('_', ' ')}</p>
            <div className="flex items-center gap-1 mt-2 text-gray-400">
              <MapPin size={12} />
              <span className="text-[10px] font-black uppercase tracking-tight">{currentBranchName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-8 pb-10 space-y-8">
        <div>
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 pl-2">Core Command</h3>
          <div className="grid grid-cols-2 gap-4">
            {topNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab?.(item.id); setSidebarOpen?.(false); }}
                className={`flex flex-col items-center justify-center gap-3 p-5 rounded-3xl transition-all ${activeTab === item.id
                  ? 'bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] text-amber-600'
                  : 'bg-[#e0e5ec] shadow-[6px_6px_12px_#bec3c9,-6px_-6px_12px_#ffffff] text-gray-600'
                  }`}
              >
                <item.icon size={28} />
                <span className="text-[10px] font-black uppercase tracking-wider text-center leading-tight">
                  {item.label.split(' ').join('\n')}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 pl-2">Operations & Intelligence</h3>
          <div className="space-y-4">
            {secondRowItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab?.(item.id); setSidebarOpen?.(false); }}
                className={`w-full flex items-center gap-5 p-5 rounded-2xl transition-all ${activeTab === item.id
                  ? 'bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] text-amber-600'
                  : 'bg-[#e0e5ec] shadow-[6px_6px_12px_#bec3c9,-6px_-6px_12px_#ffffff] text-gray-600'
                  }`}
              >
                <div className={`p-3 rounded-xl ${activeTab === item.id ? 'bg-amber-100' : 'bg-white/50'}`}>
                  <item.icon size={22} />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.15em]">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 space-y-4">
          {canSwitch && (
            <button
              onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
              className="w-full flex items-center justify-between p-5 bg-amber-600 text-white rounded-2xl shadow-lg shadow-amber-900/20 font-black uppercase tracking-widest text-xs"
            >
              <div className="flex items-center gap-3">
                <MapPin size={18} />
                <span>Switch Branch ({currentBranchName})</span>
              </div>
              <ChevronDown size={18} />
            </button>
          )}

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-black uppercase tracking-widest text-xs"
          >
            <LogOut size={18} />
            <span>Terminate Session</span>
          </button>
        </div>
      </div>

      {/* Version Info */}
      <div className="p-8 text-center opacity-30">
        <span className="text-[8px] font-black uppercase tracking-[0.5em] text-gray-600">
          F.E.T.S | GLOBAL GRID v4.0.1
        </span>
      </div>
    </motion.div>
  );

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 fets-command-deck transition-all duration-300">
        {/* --- ROW 1: CORE MODULES (The Command Deck) --- */}
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 h-20 relative z-20 flex items-center justify-between gap-4 md:gap-8">

          {/* LEFT: Branding */}
          <div className="flex items-center gap-4 md:gap-6 shrink-0">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen?.(true)}
                className="p-2.5 bg-[#e0e5ec] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] rounded-xl text-gray-600 active:shadow-inner"
              >
                <Menu size={20} />
              </button>
            )}
            <div className={`flex flex-col justify-center h-full py-2 ${isMobile ? 'scale-75' : 'scale-90'} origin-left`}>
              <FetsLogo />
            </div>
          </div>

          {/* CENTER: CORE NAVIGATION (Neumorphic Buttons) */}
          <div className="hidden lg:flex flex-1 max-w-5xl mx-auto justify-center">
            <div className="flex items-center gap-6">
              {topNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab && setActiveTab(item.id)}
                  className={`module-btn ${activeTab === item.id ? 'active' : ''}`}
                >
                  <item.icon size={18} className={activeTab === item.id ? 'opacity-100' : 'opacity-40'} />
                  <AnimatedLabel label={item.label} />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: COMMAND CONTROLS (Pills) */}
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            {/* Branch Switcher (Desktop) */}
            <div ref={dropdownRef} className="relative hidden md:block">
              <button
                className="fets-pill-control"
                onClick={() => canSwitch && setIsBranchDropdownOpen(!isBranchDropdownOpen)}
              >
                <MapPin className="w-4 h-4 opacity-70" />
                <span className="text-xs uppercase tracking-wider">{currentBranchName}</span>
                {canSwitch && <ChevronDown className="w-3 h-3 opacity-40 ml-1" />}
              </button>

              <AnimatePresence>
                {isBranchDropdownOpen && canSwitch && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 overflow-hidden z-50 p-2"
                  >
                    {availableBranches.map((branch) => (
                      <button
                        key={branch}
                        onClick={() => { setActiveBranch(branch as any); setIsBranchDropdownOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeBranch === branch ? 'bg-amber-100 text-amber-900' : 'hover:bg-gray-100'}`}
                      >
                        <span className="font-semibold text-sm">{formatBranchName(branch)}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications */}
            <button
              onClick={() => setShowNotificationPanel(!showNotificationPanel)}
              className="fets-pill-control relative"
            >
              <div className="relative">
                <Bell className="w-4 h-4 opacity-70" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
              </div>
              <span className="text-xs uppercase tracking-wider hidden sm:inline">Alerts</span>
            </button>

            {/* EXIT Button (Desktop) */}
            {!isMobile && (
              <button
                onClick={handleSignOut}
                className="fets-pill-control exit-btn"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* Profile Avatar (Mobile) */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen?.(true)}
                className="w-10 h-10 rounded-xl overflow-hidden bg-[#e0e5ec] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] p-0.5 border border-white/40"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-[inherit]" />
                ) : (
                  <div className="w-full h-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs rounded-[inherit]">
                    {profile?.full_name?.charAt(0)}
                  </div>
                )}
              </button>
            )}
          </div>
        </div>

        {/* --- ROW 2: UTILITY DECK (Recessed Utility Bar) --- (Hidden on Mobile, moved to Menu) */}
        {!isMobile && (
          <div className="h-20 utility-deck flex items-center relative z-10 border-t border-black/5">
            <div className="max-w-[1920px] mx-auto px-6 w-full flex items-center justify-center gap-6 overflow-x-auto no-scrollbar py-2">
              {secondRowItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab && setActiveTab(item.id)}
                    className={`utility-btn ${isActive ? 'active' : ''}`}
                  >
                    <item.icon size={14} className={`${isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <AnimatePresence>
          {showNotificationPanel && (
            <NotificationPanel onClose={() => setShowNotificationPanel(false)} />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <MobileMenu key="mobile-menu" />
        )}
      </AnimatePresence>
    </>
  );
}
