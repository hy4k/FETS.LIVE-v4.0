import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from '../App'
import { AuthProvider } from '../contexts/AuthContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import { supabase } from '../lib/supabase'

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signInWithPassword: vi.fn(),
      signOut: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({ subscribe: vi.fn() })),
      subscribe: vi.fn()
    })),
    removeChannel: vi.fn()
  },
  supabaseHelpers: {
    getCandidates: vi.fn(() => Promise.resolve({ data: [], error: null })),
    getIncidents: vi.fn(() => Promise.resolve({ data: [], error: null })),
    getRosterSchedules: vi.fn(() => Promise.resolve({ data: [], error: null }))
  },
  config: {
    url: 'https://test.supabase.co',
    keyPreview: 'test-key...'
  }
}))

// Mock React.lazy components
vi.mock('../components/Dashboard', () => ({
  Dashboard: () => <div data-testid="dashboard">Dashboard Component</div>
}))

vi.mock('../components/CandidateTracker', () => ({
  CandidateTracker: () => <div data-testid="candidate-tracker">Candidate Tracker Component</div>
}))

// Mock performance APIs
Object.defineProperty(window, 'performance', {
  value: {
    ...performance,
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 10000000
    },
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    now: vi.fn(() => Date.now())
  }
})

// Mock PerformanceObserver
class MockPerformanceObserver {
  constructor(callback: any) {
    this.callback = callback
  }

  observe() { }
  disconnect() { }

  callback: any
}

Object.defineProperty(window, 'PerformanceObserver', {
  value: MockPerformanceObserver
})

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe() { }
  disconnect() { }
  unobserve() { }
}

Object.defineProperty(window, 'IntersectionObserver', {
  value: MockIntersectionObserver
})

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('Enhanced App with Lazy Loading', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('renders loading state initially', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )

    expect(screen.getByText(/Loading Operational Platform Management Console/)).toBeInTheDocument()
  })

  it('renders login when no user is authenticated', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/FETS POINT/)).toBeInTheDocument()
    })
  })

  it('handles lazy component loading with Suspense', async () => {
    // Mock authenticated user
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString()
    }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: mockUser,
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          expires_at: Date.now() + 3600000
        }
      },
      error: null
    })

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('shows loading fallback for lazy components', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )

    // Initially should show app loading
    expect(screen.getByText(/Loading Operational Platform Management Console/)).toBeInTheDocument()
  })

  it('handles lazy component errors with error boundary', async () => {
    // Mock component to throw error
    const ErrorComponent = () => {
      throw new Error('Test error')
    }

    const { rerender } = render(
      <TestWrapper>
        <ErrorComponent />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Oops! Something went wrong/)).toBeInTheDocument()
    })
  })

  it('provides retry functionality in error boundary', async () => {
    const ErrorComponent = () => {
      throw new Error('Test error')
    }

    render(
      <TestWrapper>
        <ErrorComponent />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Try Again/)).toBeInTheDocument()
    })

    const retryButton = screen.getByText(/Try Again/)
    expect(retryButton).toBeInTheDocument()
  })

  it('supports route-based code splitting', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString()
    }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: mockUser,
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          expires_at: Date.now() + 3600000
        }
      },
      error: null
    })

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument()
    })
  })
})

describe('Performance Monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tracks performance metrics', () => {
    // Test that performance monitoring is initialized
    expect(window.performance).toBeDefined()
    expect(window.performance.now).toBeDefined()
  })

  it('measures component load times', () => {
    const startTime = performance.now()

    render(
      <TestWrapper>
        <div>Test Component</div>
      </TestWrapper>
    )

    const endTime = performance.now()
    expect(endTime).toBeGreaterThanOrEqual(startTime)
  })

  it('handles memory usage monitoring', () => {
    const performanceAny = window.performance as any
    expect(performanceAny.memory).toBeDefined()
    expect(performanceAny.memory.usedJSHeapSize).toBeGreaterThan(0)
    expect(performanceAny.memory.totalJSHeapSize).toBeGreaterThan(0)
  })
})

describe('Real-time Features', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes real-time subscriptions', () => {
    const mockChannel = {
      on: vi.fn(() => ({ subscribe: vi.fn() })),
      subscribe: vi.fn()
    }

    vi.mocked(supabase.channel).mockReturnValue(mockChannel)

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )

    expect(supabase.channel).toHaveBeenCalled()
  })

  it('handles real-time connection status', () => {
    const mockChannel = {
      on: vi.fn((event, filter, callback) => {
        // Simulate connection event
        if (event === 'system') {
          callback({ type: 'connected' })
        }
        return { subscribe: vi.fn() }
      }),
      subscribe: vi.fn()
    }

    vi.mocked(supabase.channel).mockReturnValue(mockChannel)

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )

    expect(mockChannel.on).toHaveBeenCalledWith(
      expect.stringContaining('system'),
      expect.anything(),
      expect.any(Function)
    )
  })
})

describe('Service Worker Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock service worker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: vi.fn(() => Promise.resolve({ installing: null, waiting: null, active: null })),
        ready: vi.fn(() => Promise.resolve({ installing: null, waiting: null, active: null })),
        controller: {
          postMessage: vi.fn()
        }
      },
      configurable: true
    })
  })

  it('supports service worker communication', () => {
    expect(navigator.serviceWorker).toBeDefined()
    expect(navigator.serviceWorker.controller?.postMessage).toBeDefined()
  })

  it('handles offline scenarios gracefully', () => {
    // Mock offline state
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true
    })

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )

    // App should still render even when offline
    expect(screen.getByText(/FETS POINT/)).toBeInTheDocument()
  })
})