import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useRealtimeCandidates,
  useRealtimeIncidents,
  useRealtimeStatus,
} from "../hooks/useRealtime";
import { usePerformanceMonitoring } from "../hooks/usePerformanceMonitoring";
import { supabase } from "../lib/supabase";

// Mock Supabase
vi.mock("../lib/supabase", () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn(() => ({ subscribe: vi.fn() })),
      subscribe: vi.fn(() => "SUBSCRIBED"),
    })),
    removeChannel: vi.fn(),
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: null }, error: null })
      ),
      signInWithPassword: vi.fn(() =>
        Promise.resolve({ data: { user: null }, error: null })
      ),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
  supabaseHelpers: {
    getCandidates: vi.fn(() => Promise.resolve({ data: [], error: null })),
    getIncidents: vi.fn(() => Promise.resolve({ data: [], error: null })),
    getRosterSchedules: vi.fn(() => Promise.resolve({ data: [], error: null })),
  },
  config: {
    url: "https://test.supabase.co",
    keyPreview: "test-key...",
  },
}));

// Mock performance APIs
Object.defineProperty(window, "performance", {
  value: {
    ...performance,
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 10000000,
    },
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    now: vi.fn(() => Date.now()),
  },
});

class MockPerformanceObserver {
  constructor(callback: any) {
    this.callback = callback;
  }

  observe() {}
  disconnect() {}

  callback: any;
}

Object.defineProperty(window, "PerformanceObserver", {
  value: MockPerformanceObserver,
});

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("Real-time Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useRealtimeCandidates", () => {
    it("initializes subscription correctly", () => {
      const { result } = renderHook(() => useRealtimeCandidates(), {
        wrapper: TestWrapper,
      });

      expect(result.current.liveUpdates).toEqual([]);
      expect(typeof result.current.isSubscribed).toBe("boolean");
      expect(result.current.lastUpdate).toBeInstanceOf(Date);
    });

    it("accepts date filter", () => {
      const testDate = "2025-01-19";

      renderHook(() => useRealtimeCandidates({ date: testDate }), {
        wrapper: TestWrapper,
      });

      expect(supabase.channel).toHaveBeenCalledWith("candidates-changes");
    });

    it("cleans up subscription on unmount", () => {
      const { unmount } = renderHook(() => useRealtimeCandidates(), {
        wrapper: TestWrapper,
      });

      unmount();

      expect(supabase.removeChannel).toHaveBeenCalled();
    });
  });

  describe("useRealtimeIncidents", () => {
    it("initializes subscription correctly", () => {
      const { result } = renderHook(() => useRealtimeIncidents(), {
        wrapper: TestWrapper,
      });

      expect(result.current.liveUpdates).toEqual([]);
      expect(typeof result.current.isSubscribed).toBe("boolean");
      expect(result.current.lastUpdate).toBeInstanceOf(Date);
    });

    it("accepts status filter", () => {
      const testStatus = "open";

      renderHook(() => useRealtimeIncidents(testStatus), {
        wrapper: TestWrapper,
      });

      expect(supabase.channel).toHaveBeenCalledWith("incidents-changes");
    });
  });

  describe("useRealtimeStatus", () => {
    it("tracks connection status", () => {
      const { result } = renderHook(() => useRealtimeStatus(), {
        wrapper: TestWrapper,
      });

      expect(typeof result.current.isConnected).toBe("boolean");
      expect(typeof result.current.reconnectAttempts).toBe("number");
    });
  });
});

describe("Performance Monitoring Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes performance monitoring", () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    expect(result.current.measureRouteLoad).toBeInstanceOf(Function);
    expect(result.current.measureComponentRender).toBeInstanceOf(Function);
    expect(result.current.measureAPICall).toBeInstanceOf(Function);
    expect(result.current.getPerformanceScore).toBeInstanceOf(Function);
    expect(result.current.getRecommendations).toBeInstanceOf(Function);
  });

  it("measures route load time", () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    act(() => {
      const endMeasurement = result.current.measureRouteLoad("TestRoute");
      expect(endMeasurement).toBeInstanceOf(Function);

      // Simulate route load completion
      endMeasurement();
    });
  });

  it("measures component render time", () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    act(() => {
      const endMeasurement =
        result.current.measureComponentRender("TestComponent");
      expect(endMeasurement).toBeInstanceOf(Function);

      // Simulate component render completion
      endMeasurement();
    });
  });

  it("measures API call time", () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    act(() => {
      const endMeasurement = result.current.measureAPICall("/api/test");
      expect(endMeasurement).toBeInstanceOf(Function);

      // Simulate API call completion
      endMeasurement();
    });
  });

  it("calculates performance score", () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    const score = result.current.getPerformanceScore();
    expect(typeof score).toBe("number");
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("provides performance recommendations", () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    const recommendations = result.current.getRecommendations();
    expect(Array.isArray(recommendations)).toBe(true);
  });

  it("collects memory metrics when available", async () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    await waitFor(() => {
      expect(result.current.currentMetrics?.memoryUsage).toBeDefined();
    });

    if (result.current.currentMetrics?.memoryUsage) {
      expect(result.current.currentMetrics.memoryUsage.used).toBeGreaterThan(0);
      expect(result.current.currentMetrics.memoryUsage.total).toBeGreaterThan(
        0
      );
      expect(
        result.current.currentMetrics.memoryUsage.percentage
      ).toBeGreaterThanOrEqual(0);
      expect(
        result.current.currentMetrics.memoryUsage.percentage
      ).toBeLessThanOrEqual(100);
    }
  });

  it("handles missing performance APIs gracefully", () => {
    // Temporarily remove performance API
    const originalPerformance = window.performance;
    delete (window as any).performance;

    const { result } = renderHook(() => usePerformanceMonitoring());

    expect(result.current.measureRouteLoad).toBeInstanceOf(Function);
    // When performance API is missing, the score should still be valid (100 - perfect score due to no detectable issues)
    expect(result.current.getPerformanceScore()).toBe(100);

    // Restore performance API
    window.performance = originalPerformance;
  });
});
