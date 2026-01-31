# Run Tests

Run and manage tests for the FETS.LIVE project.

## Instructions

### Test Commands:

```bash
cd fets-point

# Run all tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test useQueries.test

# Run tests in watch mode
pnpm test --watch

# Run tests with specific pattern
pnpm test --grep "FetsConnect"
```

### Test File Locations:
All tests are in `fets-point/src/test/`:
- Component tests: `*.test.tsx`
- Hook tests: `hooks.enhanced.test.tsx`, `useQueries.test.tsx`
- Service tests: `api.service.test.ts`
- Setup: `setup.ts`

### Writing Tests:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MyComponent from '../components/MyComponent'

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null })
    }))
  }
}))

describe('MyComponent', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  it('renders correctly', () => {
    render(<MyComponent />, { wrapper })
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

### Testing Patterns:
- Use MSW for API mocking (configured in `test/setup.ts`)
- Wrap components with `QueryClientProvider` for React Query
- Mock Supabase client for unit tests
- Use `@testing-library/react` for component testing

## Actions:
1. Run all tests and report results
2. Run specific test file
3. Check test coverage
4. Help write new tests
