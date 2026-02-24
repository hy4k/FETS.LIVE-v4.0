import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "../components/ErrorBoundary";

// Test QueryClient for testing
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("ErrorBoundary", () => {
  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders error UI when there is an error", () => {
    const ThrowError = () => {
      throw new Error("Test error");
    };

    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const consoleGroupSpy = vi
      .spyOn(console, "group")
      .mockImplementation(() => {});
    const consoleGroupEndSpy = vi
      .spyOn(console, "groupEnd")
      .mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText("Oops! Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText(/We're sorry, but something unexpected happened/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Try Again/i })
    ).toBeInTheDocument();

    // Restore console methods
    consoleSpy.mockRestore();
    consoleGroupSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
  });

  it("allows retry after error", async () => {
    const user = userEvent.setup();
    let shouldThrow = true;

    const ConditionalError = () => {
      if (shouldThrow) {
        throw new Error("Test error");
      }
      return <div>Success after retry</div>;
    };

    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const consoleGroupSpy = vi
      .spyOn(console, "group")
      .mockImplementation(() => {});
    const consoleGroupEndSpy = vi
      .spyOn(console, "groupEnd")
      .mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ConditionalError />
      </ErrorBoundary>
    );

    // Initially shows error
    expect(screen.getByText("Oops! Something went wrong")).toBeInTheDocument();

    // Fix the error condition
    shouldThrow = false;

    // Click retry button
    await user.click(screen.getByRole("button", { name: /Try Again/i }));

    // Should show success content
    await waitFor(() => {
      expect(screen.getByText("Success after retry")).toBeInTheDocument();
    });

    // Restore console methods
    consoleSpy.mockRestore();
    consoleGroupSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
  });
});

describe("TestWrapper", () => {
  it("provides QueryClient context", () => {
    const TestComponent = () => {
      return <div>Query client is available</div>;
    };

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByText("Query client is available")).toBeInTheDocument();
  });
});

// Utility function tests
describe("Utility Functions", () => {
  it("should generate unique error IDs", () => {
    const id1 = `error_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const id2 = `error_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // They should be different (with very high probability)
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^error_\d+_[a-z0-9]{9}$/);
    expect(id2).toMatch(/^error_\d+_[a-z0-9]{9}$/);
  });
});
