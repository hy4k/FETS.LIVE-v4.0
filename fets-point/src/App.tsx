import { useState, useEffect, Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';

import { ThemeProvider } from './contexts/ThemeContext';
import { BranchProvider } from './contexts/BranchContext';
import { useBranch } from './hooks/useBranch';

import { ErrorBoundary } from './components/ErrorBoundary';
import { LazyErrorBoundary } from './components/LazyErrorBoundary';
import { DatabaseSetup } from './components/DatabaseSetup';
import { PageLoadingFallback } from './components/LoadingFallback';
import { Login } from './components/Login';
import { Header } from './components/Header';

import { Sidebar } from './components/Sidebar';
import { supabase } from './lib/supabase';
import { useIsMobile, useScreenSize } from './hooks/use-mobile';

// Lazy load all page components for better performance
const Dashboard = lazy(() => import('./components/iCloud/iCloudDashboard').then(module => ({ default: module.ICloudDashboard })))
const CommandCentre = lazy(() => import('./components/CommandCentrePremium').then(module => ({ default: module.default })))
const CandidateTracker = lazy(() => import('./components/CandidateTracker').then(module => ({ default: module.CandidateTracker })))
const MyDesk = lazy(() => import('./components/MyDeskNew').then(module => ({ default: module.MyDeskNew })))
const StaffManagement = lazy(() => import('./components/StaffManagement').then(module => ({ default: module.StaffManagement })))
const FetsVault = lazy(() => import('./components/FetsVault').then(module => ({ default: module.FetsVault })))
const FetsIntelligence = lazy(() => import('./components/FetsIntelligence').then(module => ({ default: module.FetsIntelligence })))
const FetsRoster = lazy(() => import('./components/FetsRosterPremium'))
const FetsCalendar = lazy(() => import('./components/FetsCalendarPremium'))
const IncidentManager = lazy(() => import('./components/IncidentManager').then(module => ({ default: module.default })))
const ChecklistManagement = lazy(() => import('./components/checklist/ChecklistManager').then(module => ({ default: module.ChecklistManager })))
const NewsManager = lazy(() => import('./components/NewsManager').then(module => ({ default: module.NewsManager })))
const SettingsPage = lazy(() => import('./components/SettingsPage').then(module => ({ default: module.SettingsPage })))
const FetsManager = lazy(() => import('./components/FetsManager').then(module => ({ default: module.default })))

// Create QueryClient instance with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
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
      <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-50">
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

function AppContent() {
  const { user, loading, profile } = useAuth()
  const { activeBranch, getBranchTheme } = useBranch()
  const [activeTab, setActiveTab] = useState('command-center')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const isMobile = useIsMobile()
  const screenSize = useScreenSize()


  // Log app initialization
  console.log('🚀 FETS POINT App initialized')
  console.log('📊 App state:', { userAuthenticated: !!user, loading, isMobile, screenSize })

  useEffect(() => {
    // Role-based access control check
    if (activeTab === 'news-manager' && profile?.role !== 'super_admin') {
      console.warn(`Access denied for tab: ${activeTab}. User role: ${profile?.role}`);
      setActiveTab('command-center'); // Redirect to a safe default page
    }

    if (activeTab === 'staff-management' && profile?.role !== 'super_admin' && profile?.role !== 'admin') {
      console.warn(`Access denied for tab: ${activeTab}. User role: ${profile?.role}`);
      setActiveTab('command-center'); // Redirect to a safe default page
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

  if (!user) {
    return (
      <>
        <Login />
        <ConnectionStatus />
      </>
    )
  }

  const renderContent = () => {
    // Map routes to components with proper error boundaries and loading states
    const routeComponents: { [key: string]: { component: JSX.Element; name: string } } = {
      'command-center': {
        component: <CommandCentre />,
        name: 'Command Centre'
      },
      'dashboard': {
        component: <Dashboard onNavigate={setActiveTab} />,
        name: 'Dashboard'
      },
      'candidate-tracker': {
        component: <CandidateTracker />,
        name: 'Candidate Tracker'
      },
      'fets-roster': {
        component: <FetsRoster />,
        name: 'FETS Roster'
      },
      'fets-calendar': {
        component: <FetsCalendar />,
        name: 'FETS Calendar'
      },
      'my-desk': {
        component: <MyDesk />,
        name: 'My Desk'
      },
      'staff-management': {
        component: <StaffManagement />,
        name: 'Staff Management'
      },
      'fets-intelligence': {
        component: <FetsIntelligence />,
        name: 'FETS Intelligence'
      },
      'incident-manager': {
        component: <IncidentManager />,
        name: 'Incident Manager'
      },
      'news-manager': {
        component: <NewsManager />,
        name: 'News Manager'
      },
      'checklist-management': {
        component: <ChecklistManagement currentUser={profile} />,
        name: 'Checklist Management'
      },
      'settings': {
        component: <SettingsPage />,
        name: 'Settings'
      },
      'fets-manager': {
        component: <FetsManager />,
        name: 'FETS Manager'
      }
    }

    const currentRoute = routeComponents[activeTab] || routeComponents['command-center']

    return (
      <LazyErrorBoundary
        routeName={currentRoute.name}
        onGoBack={() => setActiveTab('command-center')}
        onRetry={() => {
          // Force re-render by changing state
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
    <div className={`golden-theme min-h-screen relative branch-global`}>
      {/* Single Unified Header */}
      <Header
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />



      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobile={false}
          isCollapsed={sidebarCollapsed}
          setIsCollapsed={setSidebarCollapsed}
        />
      )}

      {/* Mobile Sidebar */}
      {isMobile && sidebarOpen && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab)
            setSidebarOpen(false)
          }}
          isMobile={true}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content with proper spacing */}
      <div className="content-with-single-banner">
        <div className="dashboard-centered">
          {renderContent()}
        </div>
      </div>


      <ConnectionStatus />
      {process.env.NODE_ENV === 'development' && <DatabaseSetup />}
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
              <AppContent />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#4ade80',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#f87171',
                      secondary: '#fff',
                    },
                  },
                }}
              />
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
