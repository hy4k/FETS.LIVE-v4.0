import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCandidateMetrics, useIncidentStats } from "../hooks/useQueries";

// Mock the supabase helpers
vi.mock("../lib/supabase", () => ({
  supabaseHelpers: {
    getCandidates: vi.fn(),
    getIncidents: vi.fn(),
  },
}));

// Test QueryClient
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Updated from cacheTime
      },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useQueries hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useCandidateMetrics", () => {
    it("should return candidate metrics", async () => {
      const mockCandidates = [
        { id: "1", status: "checked_in", exam_date: "2025-09-19T10:00:00Z" },
        { id: "2", status: "in_progress", exam_date: "2025-09-19T10:00:00Z" },
        { id: "3", status: "completed", exam_date: "2025-09-19T10:00:00Z" },
        { id: "4", status: "registered", exam_date: "2025-09-19T10:00:00Z" },
      ];

      const { supabaseHelpers } = await import("../lib/supabase");
      vi.mocked(supabaseHelpers.getCandidates).mockResolvedValue({
        data: mockCandidates,
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
      });

      const { result } = renderHook(() => useCandidateMetrics("2025-09-19"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toEqual({
          total: 4,
          checkedIn: 1,
          inProgress: 1,
          completed: 1,
        });
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it("should handle empty candidates", async () => {
      const { supabaseHelpers } = await import("../lib/supabase");
      vi.mocked(supabaseHelpers.getCandidates).mockResolvedValue({
        data: [],
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
      });

      const { result } = renderHook(() => useCandidateMetrics("2025-09-19"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toEqual({
          total: 0,
          checkedIn: 0,
          inProgress: 0,
          completed: 0,
        });
      });
    });

    it("should handle errors", async () => {
      const { supabaseHelpers } = await import("../lib/supabase");
      const mockError = {
        name: "PostgrestError",
        message: "Database connection failed",
        details: "Connection timeout",
        hint: "Check your network connection",
        code: "500",
      };
      vi.mocked(supabaseHelpers.getCandidates).mockResolvedValue({
        data: null,
        error: mockError,
        count: null,
        status: 500,
        statusText: "Internal Server Error",
      });

      const { result } = renderHook(() => useCandidateMetrics("2025-09-19"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(mockError);
      });
    });
  });

  describe("useIncidentStats", () => {
    it("should return incident statistics", async () => {
      const mockIncidents = [
        { id: "1", status: "open", priority: "high" },
        { id: "2", status: "in_progress", priority: "medium" },
        { id: "3", status: "rectified", priority: "low" },
        { id: "4", status: "closed", priority: "medium" },
      ];

      const { supabaseHelpers } = await import("../lib/supabase");
      vi.mocked(supabaseHelpers.getIncidents).mockResolvedValue({
        data: mockIncidents,
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
      });

      const { result } = renderHook(() => useIncidentStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual({
          total: 4,
          open: 1,
          inProgress: 1,
          resolved: 2, // rectified + closed
        });
      });
    });

    it("should handle no incidents", async () => {
      const { supabaseHelpers } = await import("../lib/supabase");
      vi.mocked(supabaseHelpers.getIncidents).mockResolvedValue({
        data: [],
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
      });

      const { result } = renderHook(() => useIncidentStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual({
          total: 0,
          open: 0,
          inProgress: 0,
          resolved: 0,
        });
      });
    });
  });
});
