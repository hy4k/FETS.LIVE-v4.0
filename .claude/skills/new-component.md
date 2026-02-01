# Create New Component

Create a new React component following FETS.LIVE patterns and conventions.

## Instructions

When creating a new component:

1. **Location**: Place in appropriate directory:
   - `src/components/` - General components
   - `src/components/Chat/` - Chat-related components
   - `src/components/iCloud/` - Dashboard widgets
   - `src/components/shared/` - Reusable UI components
   - `src/components/checklist/` - Checklist-related components

2. **File naming**: Use PascalCase (e.g., `MyComponent.tsx`)

3. **Component structure**:
```tsx
import React from 'react'
import { motion } from 'framer-motion'
// Import icons from lucide-react
// Import hooks: useAuth, useBranch, etc.
// Import services from api.service.ts

interface MyComponentProps {
  // Define props with TypeScript
}

export default function MyComponent({ ...props }: MyComponentProps) {
  // Use hooks at top
  const { profile } = useAuth()
  const { activeBranch } = useBranch()

  // Component logic

  return (
    // JSX with Tailwind CSS classes
  )
}
```

4. **Data fetching**: Use React Query hooks, NOT useEffect
5. **Styling**: Use Tailwind CSS utility classes
6. **API calls**: Use services from `api.service.ts`, never call Supabase directly
7. **Branch filtering**: Always filter by `activeBranch` when fetching data
8. **Animations**: Use Framer Motion for smooth transitions

## Ask me:
- What should the component be named?
- What functionality does it need?
- Does it need to fetch data?
- Which directory should it go in?
