import { useState, useEffect, Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster, toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';

import { ThemeProvider } from './contexts/ThemeContext';
import { BranchProvider } from './contexts/BranchContext';
import { useBranch } from './hooks/useBranch';
import { ChatProvider, useChat } from './contexts/ChatContext';
import { CallProvider } from './contexts/CallContext';

import { ErrorBoundary } from './components/ErrorBoundary';
import { LazyErrorBoundary } from './components/LazyErrorBoundary';

import { PageLoadingFallback } from './components/LoadingFallback';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { UpdatePassword } from './components/UpdatePassword';
import { StaffBranchSelector } from './components/checklist/StaffBranchSelector';
import { ChecklistFormModal } from './components/checklist/ChecklistFormModal';

import { BranchIndicator } from './components/BranchIndicator';


// DIRECT IMPORTS FOR MOBILE STABILITY (No Lazy Loading for Mobile)
import { MobileHome } from './components/MobileHome';
import { MobileCalendarView as MobileCalendar } from './components/MobileCalendarView';
import { MobileRegisterView as MobileRegister } from './components/MobileRegisterView';
import { MobileMyDesk } from './components/MobileMyDesk';
import { MobileAiChat } from './components/MobileAiChat';
import { MobileIncidentManager } from './components/MobileIncidentManager';

import { supabase } from './lib/supabase';
import { useIsMobile, useScreenSize } from './hooks/use-mobile';

// Capacitor Imports
import { App as CapacitorApp } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import { Device } from '@capacitor/device';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';

// Lazy load Desktop components
const Dashboard = lazy(() => import('./components/iCloud/iCloudDashboard').then(module => ({ default: module.ICloudDashboard })))
const AccessHubPage = lazy(() => import('./components/AccessHub').then(module => ({ default: module.AccessHub })))
const CommandCentre = lazy(() => import('./components/CommandCentreFinal'))
const CandidateTracker = lazy(() => import('./components/CandidateTrackerPremium').then(module => ({ default: module.CandidateTrackerPremium })))
const MyDesk = lazy(() => import('./components/MyDeskLivingBoard').then(module => ({ default: module.MyDeskLivingBoard })))
const StaffManagement = lazy(() => import('./components/StaffManagement').then(module => ({ default: module.StaffManagement })))
const FetsVault = lazy(() => import('./components/FetsVault').then(module => ({ default: module.FetsVault })))
const FetsIntelligence = lazy(() => import('./components/FetsIntelligence').then(module => ({ default: module.FetsIntelligence })))
const FetsRoster = lazy(() => import('./components/FetsRosterPremium'))
const FetsCalendar = lazy(() => import('./components/FetsCalendarPremium').then(module => ({ default: module.FetsCalendarPremium })))
const SystemManager = lazy(() => import('./components/SystemManager').then(module => ({ default: module.default })))
const ChecklistManagement = lazy(() => import('./components/checklist/ChecklistManager').then(module => ({ default: module.ChecklistManager })))
const NewsManager = lazy(() => import('./components/NewsManager').then(module => ({ default: module.NewsManager })))
const UserManagement = lazy(() => import('./components/UserManagement').then(module => ({ default: module.UserManagement })))
const LostAndFound = lazy(() => import('./components/LostAndFound').then(module => ({ default: module.LostAndFound })))
const RaiseACasePage = lazy(() => import('./components/RaiseACasePage').then(module => ({ default: module.RaiseACasePage })))

const FetsProfilePage = lazy(() => import('./components/FetsProfile').then(module => ({ default: module.FetsProfile })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

function AppContent() {
  const { user, loading, profile } = useAuth()
  const { activeBranch, getBranchTheme } = useBranch()
  const [activeTab, setActiveTab] = useState('command-center')
  const isMobile = useIsMobile()
  const [isRecovering, setIsRecovering] = useState(false)
  const [aiQuery, setAiQuery] = useState<string | undefined>(undefined)

  // Checklist State
  const [showStaffSelector, setShowStaffSelector] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<any | null>(null);
  const [preSelection, setPreSelection] = useState<{ staffId: string; branchId: string; staffName: string } | null>(null);
  const [showChecklistModal, setShowChecklistModal] = useState(false);

  useEffect(() => {
    const setupPush = async () => {
      try {
        const info = await Device.getInfo();
        if (info.platform === 'web') return;
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#F6C845' });
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive !== 'granted') perm = await PushNotifications.requestPermissions();
        if (perm.receive === 'granted') await PushNotifications.register();
      } catch (err) {
        console.error('❌ Capacitor init error:', err);
      }
    };
    setupPush();
  }, []);

  const handleOpenChecklist = async (type: 'pre_exam' | 'post_exam' | 'custom') => {
    try {
      const { data, error } = await supabase
        .from('checklist_templates')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        toast.error(`No active ${type.replace('_', ' ')} checklist found.`);
        return;
      }

      let bestMatch = data.find((t: any) => t.branch_location === activeBranch);
      if (!bestMatch) bestMatch = data.find((t: any) => t.branch_location === 'global' || !t.branch_location);
      if (!bestMatch) bestMatch = data[0];

      setActiveTemplate(bestMatch);
      setShowStaffSelector(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load checklist');
    }
  };

  if (loading) return null;
  if (isRecovering) return <UpdatePassword onComplete={() => { setIsRecovering(false); window.location.hash = ''; }} />;
  if (!user) return <Login />;

  const renderContent = () => {
    if (isMobile) {
      if (activeTab === 'command-center') return <MobileHome setActiveTab={setActiveTab} profile={profile} onOpenChecklist={handleOpenChecklist} />;
      if (activeTab === 'fets-calendar') return <MobileCalendar />;
      if (activeTab === 'candidate-tracker') return <MobileRegister />;
      if (activeTab === 'my-desk') return <MobileMyDesk setActiveTab={setActiveTab} />;
      if (activeTab === 'mobile-ai-chat') return <MobileAiChat />;
      if (activeTab === 'incident-log') return <MobileIncidentManager />;
      if (activeTab === 'access-hub') return <AccessHubPage />;
      if (activeTab === 'user-management') return <UserManagement />;
      if (activeTab === 'profile') return <FetsProfilePage />;
      if (activeTab === 'checklist-management') return <ChecklistManagement currentUser={profile} />;
      if (activeTab === 'system-manager') return <SystemManager />;
      if (activeTab === 'news-manager') return <NewsManager />;
      if (activeTab === 'lost-and-found') return <LostAndFound />;
      if (activeTab === 'fets-roster') return <FetsRoster />;
    }

    const routeComponents: { [key: string]: { component: JSX.Element; name: string } } = {
      'command-center': { component: <CommandCentre onNavigate={setActiveTab} onAiQuery={(q: string) => { setAiQuery(q); setActiveTab('fets-intelligence'); }} />, name: 'Command Centre' },
      'access-hub': { component: <AccessHubPage />, name: 'F-Vault' },
      'dashboard': { component: <Dashboard onNavigate={setActiveTab} />, name: 'Dashboard' },
      'candidate-tracker': { component: <CandidateTracker />, name: 'Candidate Tracker' },
      'fets-roster': { component: <FetsRoster />, name: 'FETS Roster' },
      'fets-calendar': { component: <FetsCalendar />, name: 'FETS Calendar' },
      'my-desk': { component: <MyDesk onNavigate={setActiveTab} />, name: 'My Desk' },
      'staff-management': { component: <StaffManagement />, name: 'Staff Management' },
      'fets-intelligence': { component: <FetsIntelligence initialQuery={aiQuery} />, name: 'FETS Intelligence' },
      'incident-log': { component: <RaiseACasePage />, name: 'Raise A Case' },
      'system-manager': { component: <SystemManager />, name: 'System Manager' },
      'news-manager': { component: <NewsManager />, name: 'News Manager' },
      'checklist-management': { component: <ChecklistManagement currentUser={profile} />, name: 'Checklist Management' },
      'lost-and-found': { component: <LostAndFound />, name: 'Lost & Found' },
      'user-management': { component: <UserManagement />, name: 'User Management' },
      'profile': { component: <FetsProfilePage />, name: 'Profile' },
      'fets-omni-ai': { component: <FetsIntelligence initialQuery={aiQuery} />, name: 'FETS AI' }
    }

    const currentRoute = routeComponents[activeTab] || routeComponents['command-center'];
    return (
      <LazyErrorBoundary routeName={currentRoute.name} onGoBack={() => setActiveTab('command-center')}>
        <Suspense fallback={<PageLoadingFallback pageName={currentRoute.name} />}>
          {currentRoute.component}
        </Suspense>
      </LazyErrorBoundary>
    );
  }

  const isFullscreenPage = activeTab === 'my-desk' || activeTab === 'mobile-ai-chat';

  return (
    <div className={`golden-theme min-h-screen h-screen flex flex-col overflow-hidden relative ${getBranchTheme(activeBranch)}`}>
      {isMobile && !isFullscreenPage && <div className="h-safe-top bg-[#F6C845] w-full flex-none" />}

      {!isFullscreenPage && !isMobile && (
        <div className="flex-none bg-[#e0e5ec] z-50">
          <Header isMobile={isMobile} setActiveTab={setActiveTab} activeTab={activeTab} />
        </div>
      )}

      <div className={`flex-1 scroll-touch relative ${isFullscreenPage ? '' : (isMobile ? 'pt-0' : 'pt-4 px-4 md:px-8 pb-8')}`}>
        {renderContent()}
      </div>

      <BranchIndicator />


      {isMobile && !isFullscreenPage && (
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      <AnimatePresence>
        {showStaffSelector && activeTemplate && (
          <StaffBranchSelector onClose={() => { setShowStaffSelector(false); setActiveTemplate(null); }}
            onSelect={(data) => { setPreSelection(data); setShowStaffSelector(false); setShowChecklistModal(true); }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChecklistModal && activeTemplate && (
          <ChecklistFormModal template={activeTemplate} onClose={() => { setShowChecklistModal(false); setActiveTemplate(null); setPreSelection(null); }}
            onSuccess={() => { toast.success('Checklist submitted!'); setActiveTab('command-center'); }} currentUser={profile}
            overrideStaff={preSelection ? { id: preSelection.staffId, name: preSelection.staffName } : undefined} overrideBranch={preSelection?.branchId} />
        )}
      </AnimatePresence>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BranchProvider>
            <ThemeProvider>
              <ChatProvider>
                <CallProvider>
                  <AppContent />
                </CallProvider>
              </ChatProvider>
              <Toaster position="top-right" />
            </ThemeProvider>
          </BranchProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
