import { render, screen } from '@testing-library/react';
import FetsConnect from '../components/FetsConnect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/AuthContext';
import { vi, describe, it, expect } from 'vitest';

// Mock the hooks
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ profile: { id: '1', full_name: 'Test User' } })
}));

vi.mock('../hooks/useFetsConnect', () => ({
  usePosts: () => ({ data: [], isLoading: false }),
  useKudos: () => ({ data: [], isLoading: false }),
  useTasks: () => ({ data: [], isLoading: false }),
  useAllStaff: () => ({ data: [], isLoading: false }),
  useOnlineStaff: () => ({ data: [], isLoading: false }),
  usePostMutations: () => ({ addPost: vi.fn() }),
  useTaskMutations: () => ({ addTask: vi.fn(), updateTask: vi.fn() }),
  useKudosMutations: () => ({ addKudos: vi.fn() }),
}));


describe('FetsConnect', () => {
  it('renders without crashing', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FetsConnect />
        </AuthProvider>
      </QueryClientProvider>
    );
    expect(screen.getByText('FETS Connect')).toBeInTheDocument();
  });
});
