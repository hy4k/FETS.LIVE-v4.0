import { useState, useEffect, Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';

import { ThemeProvider } from './contexts/ThemeContext';
import { BranchProvider } from './contexts/BranchContext';
import { useBranch } from './hooks/useBranch';
import { ChatProvider, useChat } from './contexts/ChatContext';
import { CallProvider } from './contexts/CallContext';

import { ErrorBoundary } from './components/ErrorBoundary';
import { LazyErrorBoundary } from './components/LazyErrorBoundary';
import { DatabaseSetup } from './components/DatabaseSetup';
import { PageLoadingFallback } from './components/LoadingFallback';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { UpdatePassword } from './components/UpdatePassword';
import { AiAssistant } from './components/AiAssistant';
import { Fetchat } from './components/Fetchat';
import { BranchIndicator } from './components/BranchIndicator';

import { supabase } from './lib/supabase';
import { useIsMobile, useScreenSize } from './hooks/use-mobile';


// Lazy load all page components for better performance
const Dashboard = lazy(() => import('./components/iCloud/iCloudDashboard').then(module => ({ default: module.ICloudDashboard })))
const CommandCentre = lazy(() => import('./components/CommandCentreFinal'))
const CandidateTracker = lazy(() => import('./components/CandidateTrackerPremium').then(module => ({ default: module.CandidateTrackerPremium })))
const MyDesk = lazy(() => import('./components/MyDesk').then(module => ({ default: module.MyDesk })))
const StaffManagement = lazy(() => import('./components/StaffManagement').then(module => ({ default: module.StaffManagement })))
const FetsVault = lazy(() => import('./components/FetsVault').then(module => ({ default: module.FetsVault })))
const FetsIntelligence = lazy(() => import('./components/FetsIntelligence').then(module => ({ default: module.FetsIntelligence })))
const FetsRoster = lazy(() => import('./components/FetsRosterPremium'))
const FetsCalendar = lazy(() => import('./components/FetsCalendarPremium'))
const SystemManager = lazy(() => import('./components/SystemManager').then(module => ({ default: module.default })))
const ChecklistManagement = lazy(() => import('./components/checklist/ChecklistManager').then(module => ({ default: module.ChecklistManager })))
const NewsManager = lazy(() => import('./components/NewsManager').then(module => ({ default: module.NewsManager })))
const UserManagement = lazy(() => import('./components/UserManagement').then(module => ({ default: module.UserManagement })))

// Create QueryClient instance with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Connection status component for debugging
function ConnectionStatus() {
  const [connectionTest, setConnectionTest] = useState<string>('untested')

  const testConnection = async () => {
    try {
      setConnectionTest('testing')
      console.log('🔄 Testing Supabase connection...')

      const { error } = await supabase.from('staff_profiles').select('count', { count: 'exact', head: true })

      if (error) {
        console.error('❌ Connection test failed:', error.message)
        setConnectionTest('failed')
      } else {
        console.log('✅ Connection test successful')
        setConnectionTest('success')
      }
    } catch (err: any) {
      console.error('❌ Connection test exception:', err.message)
      setConnectionTest('failed')
    }
  }

  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-50 hidden md:block">
        <div className="text-sm">
          <div className="font-medium mb-2">Supabase Connection</div>
          <div className="flex items-center space-x-2">
            <button
              onClick={testConnection}
              className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
              disabled={connectionTest === 'testing'}
            >
              {connectionTest === 'testing' ? 'Testing...' : 'Test'}
            </button>
            <span className={`text-xs ${connectionTest === 'success' ? 'text-green-600' : connectionTest === 'failed' ? 'text-red-600' : 'text-gray-500'}`}>
              {connectionTest === 'success' ? '✅ Connected' : connectionTest === 'failed' ? '❌ Failed' : '⏳ Untested'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return null
}

function GlobalChatLayer() {
  const { isDetached, setIsDetached, activeUser, setActiveUser, toggleDetach } = useChat();

  if (!isDetached) return null;

  return (
    <Fetchat
      isDetached={true}
      onClose={() => setIsDetached(false)}
      onToggleDetach={toggleDetach}
      activeUser={activeUser}
      onSelectUser={setActiveUser}
    />
  );
}

function AppContent() {
  const { user, loading, profile } = useAuth()
  const { activeBranch, getBranchTheme } = useBranch()
  const [activeTab, setActiveTab] = useState('command-center')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useIsMobile()
  const screenSize = useScreenSize()
  const [isRecovering, setIsRecovering] = useState(false)

  useEffect(() => {
    if (window.location.hash.includes('type=recovery')) {
      setIsRecovering(true)
    }
  }, [])

  // Log app initialization
  console.log('🚀 FETS POINT App initialized')
  console.log('📊 App state:', { userAuthenticated: !!user, loading, isMobile, screenSize })

  useEffect(() => {
    const restrictedTabs = ['user-management'];
    if (restrictedTabs.includes(activeTab)) {
      const isMithun = profile?.email === 'mithun@fets.in';
      const isSuperAdmin = profile?.role === 'super_admin';

      let hasPermission = false;
      if (activeTab === 'user-management') {
        hasPermission = isMithun || isSuperAdmin || (typeof profile?.permissions === 'object' && profile?.permissions?.user_management_edit);
      }

      if (!hasPermission) {
        console.warn(`Access denied for tab: ${activeTab}. Restricted access.`);
        setActiveTab('command-center');
      }
    }
  }, [activeTab, profile]);

  if (loading) {
    return (
      <div className="golden-theme flex items-center justify-center relative min-h-screen">
        <div className="text-center relative z-10 px-4">
          <div className="golden-logo inline-block mb-8 golden-pulse">
            <img
              src="/fets-point-logo.png"
              alt="FETS POINT"
              className="h-16 w-16 sm:h-20 sm:w-20"
            />
          </div>
          <h1 className="golden-title mb-4 text-2xl sm:text-3xl">FETS POINT</h1>
          <p className="golden-subtitle mb-8 text-sm sm:text-base">Loading Operational Platform Management Console...</p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          </div>
        </div>
        <ConnectionStatus />
      </div>
    )
  }

  if (isRecovering) {
    return <UpdatePassword onComplete={() => {
      setIsRecovering(false)
      window.location.hash = ''
    }} />
  }

  if (!user) {
    return (
      <>
        <Login />
        <ConnectionStatus />
      </>
    )
  }

  const renderContent = () => {
    const routeComponents: { [key: string]: { component: JSX.Element; name: string } } = {
      'command-center': { component: <CommandCentre />, name: 'Command Centre' },
      'dashboard': { component: <Dashboard onNavigate={setActiveTab} />, name: 'Dashboard' },
      'candidate-tracker': { component: <CandidateTracker />, name: 'Candidate Tracker' },
      'fets-roster': { component: <FetsRoster />, name: 'FETS Roster' },
      'fets-calendar': { component: <FetsCalendar />, name: 'FETS Calendar' },
      'my-desk': { component: <MyDesk />, name: 'My Desk' },
      'staff-management': { component: <StaffManagement />, name: 'Staff Management' },
      'fets-intelligence': { component: <FetsIntelligence />, name: 'FETS Intelligence' },
      'system-manager': { component: <SystemManager />, name: 'System Manager' },
      'news-manager': { component: <NewsManager />, name: 'News Manager' },
      'checklist-management': { component: <ChecklistManagement currentUser={profile} />, name: 'Checklist Management' },
      'settings': { component: <FetsIntelligence />, name: 'FETS Intelligence' },
      'user-management': { component: <UserManagement />, name: 'User Management' }
    }

    const currentRoute = routeComponents[activeTab] || routeComponents['command-center']

    return (
      <LazyErrorBoundary
        routeName={currentRoute.name}
        onGoBack={() => setActiveTab('command-center')}
        onRetry={() => {
          setActiveTab('')
          setTimeout(() => setActiveTab(activeTab), 100)
        }}
      >
        <Suspense fallback={<PageLoadingFallback pageName={currentRoute.name} />}>
          {currentRoute.component}
        </Suspense>
      </LazyErrorBoundary>
    )
  }

  return (
    <div className={`golden-theme min-h-screen relative ${getBranchTheme(activeBranch)}`}>
      <Header
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        setActiveTab={setActiveTab}
        activeTab={activeTab}
      />

      <div className="pt-32 px-4 md:px-8 pb-8 transition-all duration-300">
        <div className="max-w-[1920px] mx-auto">
          {renderContent()}
        </div>
      </div>

      {/* Floating AI Assistant - ALWAYS VISIBLE */}
      <AiAssistant />
      <GlobalChatLayer />
      <BranchIndicator />

      <ConnectionStatus />
      {process.env.NODE_ENV === 'development' && <DatabaseSetup />}

      <div className="max-w-[1920px] mx-auto mt-8 mb-4 flex justify-center opacity-30 pointer-events-none">
        <span className={"font-['Rajdhani'] font-bold text-[10px] uppercase tracking-[0.5em] text-slate-800"}>
          F.E.T.S | GLOBAL OPERATIONAL GRID v4.0.1 - BUILD 2026.01
        </span>
      </div>
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
              <Toaster position="top-right" toastOptions={{
                duration: 4000,
                style: { background: '#363636', color: '#fff' }
              }} />
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </ThemeProvider>
          </BranchProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
