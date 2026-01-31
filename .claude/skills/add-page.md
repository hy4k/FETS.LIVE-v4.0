# Add New Page

Add a new page/tab to the FETS.LIVE application.

## Instructions

### Step 1: Create the Page Component

Create in `src/components/`:

```tsx
import React from 'react'
import { motion } from 'framer-motion'
import { IconName } from 'lucide-react'

export default function MyNewPage() {
  return (
    <div className="min-h-screen pt-8 pb-12 px-4 md:px-8 bg-[#EEF2F9] font-['Montserrat']">
      <div className="max-w-[1600px] mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          {/* Your header content */}
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl border border-slate-100"
        >
          {/* Your content */}
        </motion.div>
      </div>
    </div>
  )
}
```

### Step 2: Add Lazy Loading in App.tsx

```tsx
// Near top with other lazy imports
const MyNewPage = lazy(() => import('./components/MyNewPage'))
```

### Step 3: Add Route/Tab in App.tsx

Find the tab rendering section and add:

```tsx
{activeTab === 'my-new-page' && (
  <LazyErrorBoundary>
    <Suspense fallback={<LoadingSpinner />}>
      <MyNewPage />
    </Suspense>
  </LazyErrorBoundary>
)}
```

### Step 4: Add Sidebar Navigation

In `Sidebar.tsx`, add to the navigation items:

```tsx
{
  id: 'my-new-page',
  label: 'My New Page',
  icon: IconName,
}
```

### Step 5: Add Styles (Optional)

Create `src/styles/my-new-page.css` and import in `index.css`:

```css
@import './styles/my-new-page.css';
```

### Routing Note:
FETS.LIVE uses internal tab state, NOT React Router:
```tsx
const [activeTab, setActiveTab] = useState('command-center')
```
Navigation happens via `setActiveTab()` in Sidebar.

## Ask me:
- What should the page be called?
- What functionality does it need?
- What icon should represent it?
- Does it need to fetch data?
