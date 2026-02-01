# FETS.LIVE-v4.0 Codebase Index

## Project Overview

**FETS.LIVE** is a comprehensive staff management and operations platform built with React, TypeScript, Vite, and Supabase. Version 4.0 represents a major architectural upgrade with enhanced UI components, real-time data synchronization, and AI-powered features.

- **Version:** 4.0.1
- **Build:** 2026.01
- **Type:** Monorepo (pnpm workspace)
- **Primary Package:** fets-point (React application)

---

## 1. Project Structure

```
FETS.LIVE-v4.0/
├── .claude/                  # Claude AI configuration
├── docs/                     # Documentation files
├── fets-point/              # Main React application
│   ├── public/              # Static assets
│   └── src/                 # Source code
├── scripts/                 # Deployment and maintenance scripts
├── config.toml              # MCP server configuration
├── package.json             # Root package definition
├── pnpm-workspace.yaml      # pnpm workspace configuration
└── README.md               # Project documentation
```

---

## 2. Build Configuration

### Root Configuration Files

| File | Purpose |
|------|---------|
| [`package.json`](package.json) | Root package with Supabase/PostgreSQL dependencies |
| [`pnpm-workspace.yaml`](pnpm-workspace.yaml) | Monorepo workspace definition (includes fets-point) |
| [`config.toml`](config.toml) | MCP (Model Context Protocol) server configuration for Supabase |

### Build System (fets-point/)

| File | Purpose |
|------|---------|
| [`fets-point/package.json`](fets-point/package.json) | Main application dependencies and scripts |
| [`fets-point/tsconfig.json`](fets-point/tsconfig.json) | TypeScript configuration with path aliases |
| [`fets-point/tsconfig.app.json`](fets-point/tsconfig.app.json) | App-specific TypeScript config |
| [`fets-point/tsconfig.node.json`](fets-point/tsconfig.node.json) | Node-specific TypeScript config |
| [`fets-point/vite.config.ts`](fets-point/vite.config.ts) | Vite build configuration with code splitting |
| [`fets-point/tailwind.config.js`](fets-point/tailwind.config.js) | Tailwind CSS with FETS brand colors |
| [`fets-point/postcss.config.js`](fets-point/postcss.config.js) | PostCSS configuration |
| [`fets-point/eslint.config.js`](fets-point/eslint.config.js) | ESLint configuration |
| [`fets-point/vitest.config.ts`](fets-point/vitest.config.ts) | Vitest testing configuration |

---

## 3. Dependencies Overview

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.3.1 | UI library |
| `react-dom` | ^18.3.1 | DOM rendering |
| `react-router-dom` | 6.28.0 | Routing |
| `@tanstack/react-query` | ^5.59.0 | Server state management |
| `@supabase/supabase-js` | ^2.55.0 | Backend API client |
| `zustand` | ^5.0.9 | Client state management |
| `framer-motion` | ^11.11.1 | Animations |
| `tailwindcss` | ^3.4.16 | CSS framework |
| `lucide-react` | ^0.364.0 | Icons |
| `recharts` | ^3.6.0 | Charts/graphs |
| `date-fns` | ^4.1.0 | Date utilities |
| `zod` | ^3.23.8 | Schema validation |
| `react-hook-form` | ^7.53.0 | Form handling |
| `@google/generative-ai` | ^0.24.1 | AI/ML features |
| `xlsx` | ^0.18.5 | Excel export |
| `jspdf` | ^4.0.0 | PDF generation |

---

## 4. Source Code Architecture (fets-point/src/)

```
src/
├── main.tsx              # Application entry point
├── App.tsx               # Root component with providers
├── index.css             # Global styles
├── App.css               # App-specific styles
├── vite-env.d.ts        # Vite type definitions
├── components/           # React components
├── contexts/            # React contexts
├── hooks/               # Custom hooks
├── lib/                 # Library configurations
├── services/            # API services
├── utils/               # Utility functions
├── types/               # TypeScript types
├── config/              # App configuration
├── data/                # Static data
├── styles/              # CSS style modules
└── test/                # Test utilities
```

---

## 5. Contexts (State Management)

| Context | File | Purpose |
|---------|------|---------|
| **AuthContext** | [`contexts/AuthContext.tsx`](fets-point/src/contexts/AuthContext.tsx) | User authentication, session management, profile loading from `staff_profiles` table |
| **BranchContext** | [`contexts/BranchContext.tsx`](fets-point/src/contexts/BranchContext.tsx) | Active branch management, branch-specific themes |
| **ThemeContext** | [`contexts/ThemeContext.tsx`](fets-point/src/contexts/ThemeContext.tsx) | Application theming (light/dark/golden theme) |
| **ChatContext** | [`contexts/ChatContext.tsx`](fets-point/src/contexts/ChatContext.tsx) | Global chat state, detached chat window management |
| **CallContext** | [`contexts/CallContext.tsx`](fets-point/src/contexts/CallContext.tsx) | VoIP call management, incoming call handling |

---

## 6. Components Index

### 6.1 Core Application Components

| Component | File | Purpose |
|-----------|------|---------|
| **App** | [`App.tsx`](fets-point/src/App.tsx) | Root component with lazy loading, providers, and routing |
| **main** | [`main.tsx`](fets-point/src/main.tsx) | Entry point, imports global styles |

### 6.2 Authentication Components

| Component | File | Purpose |
|-----------|------|---------|
| **Login** | [`components/Login.tsx`](fets-point/src/components/Login.tsx) | User login page with Supabase auth |
| **UpdatePassword** | [`components/UpdatePassword.tsx`](fets-point/src/components/UpdatePassword.tsx) | Password reset/update flow |

### 6.3 Dashboard & Analytics

| Component | File | Purpose |
|-----------|------|---------|
| **Dashboard (iCloud)** | [`components/iCloud/iCloudDashboard.tsx`](fets-point/src/components/iCloud/iCloudDashboard.tsx) | Main dashboard with widgets |
| **CommandCentreFinal** | [`components/CommandCentreFinal.tsx`](fets-point/src/components/CommandCentreFinal.tsx) | Command center with navigation |
| **CommandCentreGraphs** | [`components/CommandCentreGraphs.tsx`](fets-point/src/components/CommandCentreGraphs.tsx) | Charts and analytics visualization |
| **PerformanceDashboard** | [`components/PerformanceDashboard.tsx`](fets-point/src/components/PerformanceDashboard.tsx) | Staff performance metrics |
| **CalendarAnalysis** | [`components/CalendarAnalysis.tsx`](fets-point/src/components/CalendarAnalysis.tsx) | Calendar-based analytics |
| **EnhancedAnalysisView** | [`components/EnhancedAnalysisView.tsx`](fets-point/src/components/EnhancedAnalysisView.tsx) | Advanced data analysis view |
| **DailySpark** | [`components/DailySpark.tsx`](fets-point/src/components/DailySpark.tsx) | Daily metrics summary |

### 6.4 Candidate Management

| Component | File | Purpose |
|-----------|------|---------|
| **CandidateTracker** | [`components/CandidateTracker.tsx`](fets-point/src/components/CandidateTracker.tsx) | Basic candidate tracking |
| **CandidateTrackerPremium** | [`components/CandidateTrackerPremium.tsx`](fets-point/src/components/CandidateTrackerPremium.tsx) | Enhanced candidate tracking |
| **CandidateAnalysis** | [`components/CandidateAnalysis.tsx`](fets-point/src/components/CandidateAnalysis.tsx) | Candidate data analysis |
| **ExamScheduleWidget** | [`components/ExamScheduleWidget.tsx`](fets-point/src/components/ExamScheduleWidget.tsx) | Exam scheduling widget |

### 6.5 Roster & Scheduling

| Component | File | Purpose |
|-----------|------|---------|
| **FetsRoster** | [`components/FetsRoster.tsx`](fets-point/src/components/FetsRoster.tsx) | Basic roster view |
| **FetsRosterPremium** | [`components/FetsRosterPremium.tsx`](fets-point/src/components/FetsRosterPremium.tsx) | Enhanced roster with timeline |
| **FetsCalendar** | [`components/FetsCalendar.tsx`](fets-point/src/components/FetsCalendar.tsx) | Calendar view |
| **FetsCalendarPremium** | [`components/FetsCalendarPremium.tsx`](fets-point/src/components/FetsCalendarPremium.tsx) | Enhanced calendar |
| **MonthlyRosterTimeline** | [`components/MonthlyRosterTimeline.tsx`](fets-point/src/components/MonthlyRosterTimeline.tsx) | Monthly timeline view |
| **NewWeeklyRosterView** | [`components/NewWeeklyRosterView.tsx`](fets-point/src/components/NewWeeklyRosterView.tsx) | Weekly roster view |
| **PersonalShiftsView** | [`components/PersonalShiftsView.tsx`](fets-point/src/components/PersonalShiftsView.tsx) | Personal shift management |
| **RosterListView** | [`components/RosterListView.tsx`](fets-point/src/components/RosterListView.tsx) | List-based roster |
| **TimelineRibbonRoster** | [`components/TimelineRibbonRoster.tsx`](fets-point/src/components/TimelineRibbonRoster.tsx) | Ribbon timeline view |
| **DayCell** | [`components/DayCell.tsx`](fets-point/src/components/DayCell.tsx) | Calendar day cell |
| **ShiftNotes** | [`components/ShiftNotes.tsx`](fets-point/src/components/ShiftNotes.tsx) | Shift notes/editing |
| **ShiftCellPopup** | [`components/ShiftCellPopup.tsx`](fets-point/src/components/ShiftCellPopup.tsx) | Shift cell context menu |
| **ShiftSwapModal** | [`components/ShiftSwapModal.tsx`](fets-point/src/components/ShiftSwapModal.tsx) | Shift swapping |
| **StaffRow** | [`components/StaffRow.tsx`](fets-point/src/components/StaffRow.tsx) | Staff roster row |

### 6.6 Task Management

| Component | File | Purpose |
|-----------|------|---------|
| **MyDesk** | [`components/MyDesk.tsx`](fets-point/src/components/MyDesk.tsx) | Basic desk view |
| **MyDeskNew** | [`components/MyDeskNew.tsx`](fets-point/src/components/MyDeskNew.tsx) | Enhanced desk view |
| **MyTasks** | [`components/MyTasks.tsx`](fets-point/src/components/MyTasks.tsx) | Task list |
| **MyFocus** | [`components/MyFocus.tsx`](fets-point/src/components/MyFocus.tsx) | Focus mode for tasks |
| **TaskBoard** | [`components/TaskBoard.tsx`](fets-point/src/components/TaskBoard.tsx) | Kanban task board |
| **TaskModal** | [`components/TaskModal.tsx`](fets-point/src/components/TaskModal.tsx) | Task creation/editing |
| **FetsTaskWidget** | [`components/FetsTaskWidget.tsx`](fets-point/src/components/FetsTaskWidget.tsx) | Task widget |
| **ToDoMatrix** | [`components/ToDoMatrix.tsx`](fets-point/src/components/ToDoMatrix.tsx) | Eisenhower matrix |
| **DailyLog** | [`components/DailyLog.tsx`](fets-point/src/components/DailyLog.tsx) | Daily activity log |

### 6.7 Staff Management

| Component | File | Purpose |
|-----------|------|---------|
| **StaffManagement** | [`components/StaffManagement.tsx`](fets-point/src/components/StaffManagement.tsx) | Staff CRUD operations |
| **UserManagement** | [`components/UserManagement.tsx`](fets-point/src/components/UserManagement.tsx) | User management (admin) |
| **FetsProfile** | [`components/FetsProfile.tsx`](fets-point/src/components/FetsProfile.tsx) | User profile view |
| **AgentDossier** | [`components/AgentDossier.tsx`](fets-point/src/components/AgentDossier.tsx) | Staff dossier |
| **PersonalWorkspace** | [`components/PersonalWorkspace.tsx`](fets-point/src/components/PersonalWorkspace.tsx) | Personal workspace |
| **ProfilePictureUpload** | [`components/ProfilePictureUpload.tsx`](fets-point/src/components/ProfilePictureUpload.tsx) | Profile photo upload |
| **TeamPresence** | [`components/TeamPresence.tsx`](fets-point/src/components/TeamPresence.tsx) | Online status display |
| **AccessHub** | [`components/AccessHub.tsx`](fets-point/src/components/AccessHub.tsx) | Access control hub |

### 6.8 Communication & Chat

| Component | File | Purpose |
|-----------|------|---------|
| **Fetchat** | [`components/Fetchat.tsx`](fets-point/src/components/Fetchat.tsx) | Global chat widget |
| **FetsChatPopup** | [`components/FetsChatPopup.tsx`](fets-point/src/components/FetsChatPopup.tsx) | Chat popup |
| **FetsConnect** | [`components/FetsConnect.tsx`](fets-point/src/components/FetsConnect.tsx) | Connection feature |
| **FetsConnectNew** | [`components/FetsConnectNew.tsx`](fets-point/src/components/FetsConnectNew.tsx) | Enhanced connection |

#### Chat Sub-components (components/Chat/)

| Component | File | Purpose |
|-----------|------|---------|
| **Chat** | [`components/Chat/Chat.tsx`](fets-point/src/components/Chat/Chat.tsx) | Main chat component |
| **ConversationList** | [`components/Chat/ConversationList.tsx`](fets-point/src/components/Chat/ConversationList.tsx) | Conversation list |
| **Conversation** | [`components/Chat/Conversation.tsx`](fets-point/src/components/Chat/Conversation.tsx) | Individual conversation |
| **MessageList** | [`components/Chat/MessageList.tsx`](fets-point/src/components/Chat/MessageList.tsx) | Message display |
| **MessageInput** | [`components/Chat/MessageInput.tsx`](fets-point/src/components/Chat/MessageInput.tsx) | Message input field |
| **Message** | [`components/Chat/Message.tsx`](fets-point/src/components/Chat/Message.tsx) | Single message |
| **UserSearch** | [`components/Chat/UserSearch.tsx`](fets-point/src/components/Chat/UserSearch.tsx) | User search for chat |
| **UserList** | [`components/Chat/UserList.tsx`](fets-point/src/components/Chat/UserList.tsx) | User list display |
| **CreateGroupChatModal** | [`components/Chat/CreateGroupChatModal.tsx`](fets-point/src/components/Chat/CreateGroupChatModal.tsx) | Group chat creation |
| **IncomingCallModal** | [`components/Chat/IncomingCallModal.tsx`](fets-point/src/components/Chat/IncomingCallModal.tsx) | Call notification |
| **VideoCallOverlay** | [`components/Chat/VideoCallOverlay.tsx`](fets-point/src/components/Chat/VideoCallOverlay.tsx) | Video call UI |

### 6.9 AI & Intelligence Features

| Component | File | Purpose |
|-----------|------|---------|
| **FetsIntelligence** | [`components/FetsIntelligence.tsx`](fets-point/src/components/FetsIntelligence.tsx) | AI-powered features |
| **AiAssistant** | [`components/AiAssistant.tsx`](fets-point/src/components/AiAssistant.tsx) | AI assistant widget |
| **Brainstorm** | [`components/Brainstorm.tsx`](fets-point/src/components/Brainstorm.tsx) | Brainstorming tool |

### 6.10 Incident & Issue Management

| Component | File | Purpose |
|-----------|------|---------|
| **IncidentLogPage** | [`components/IncidentLogPage.tsx`](fets-point/src/components/IncidentLogPage.tsx) | Incident listing |
| **IncidentManager** | [`components/IncidentManager.tsx`](fets-point/src/components/IncidentManager.tsx) | Basic incident handling |
| **IncidentManagerPremium** | [`components/IncidentManagerPremium.tsx`](fets-point/src/components/IncidentManagerPremium.tsx) | Enhanced incident handling |
| **LogIncident** | [`components/LogIncident.tsx`](fets-point/src/components/LogIncident.tsx) | Log new incident |

### 6.11 News & Content Management

| Component | File | Purpose |
|-----------|------|---------|
| **NewsManager** | [`components/NewsManager.tsx`](fets-point/src/components/NewsManager.tsx) | News article management |
| **NewsTickerBar** | [`components/NewsTickerBar.tsx`](fets-point/src/components/NewsTickerBar.tsx) | Scrolling news ticker |
| **Feed** | [`components/Feed.tsx`](fets-point/src/components/Feed.tsx) | Activity feed |
| **PostCard** | [`components/PostCard.tsx`](fets-point/src/components/PostCard.tsx) | Social post card |

### 6.12 Vault & Resources

| Component | File | Purpose |
|-----------|------|---------|
| **FetsVault** | [`components/FetsVault.tsx`](fets-point/src/components/FetsVault.tsx) | Document vault |
| **ResourceCentre** | [`components/ResourceCentre.tsx`](fets-point/src/components/ResourceCentre.tsx) | Resource library |
| **FileUpload** | [`components/FileUpload.tsx`](fets-point/src/components/FileUpload.tsx) | File upload component |
| **ClientControl** | [`components/ClientControl.tsx`](fets-point/src/components/ClientControl.tsx) | Client management |
| **LostAndFound** | [`components/LostAndFound.tsx`](fets-point/src/components/LostAndFound.tsx) | Lost & found items |

### 6.13 Quick Capture & Notes

| Component | File | Purpose |
|-----------|------|---------|
| **DigitalNotebook** | [`components/DigitalNotebook.tsx`](fets-point/src/components/DigitalNotebook.tsx) | Quick capture notebook |
| **InkNotebook** | [`components/InkNotebook.tsx`](fets-point/src/components/InkNotebook.tsx) | Digital ink notes |
| **Slate** | [`components/Slate.tsx`](fets-point/src/components/Slate.tsx) | Quick notes slate |

### 6.14 UI Components

| Component | File | Purpose |
|-----------|------|---------|
| **Header** | [`components/Header.tsx`](fets-point/src/components/Header.tsx) | App header with navigation |
| **BranchIndicator** | [`components/BranchIndicator.tsx`](fets-point/src/components/BranchIndicator.tsx) | Branch indicator bar |
| **BranchStatusBar** | [`components/BranchStatusBar.tsx`](fets-point/src/components/BranchStatusBar.tsx) | Branch status display |
| **BranchSwitcher** | [`components/BranchSwitcher.tsx`](fets-point/src/components/BranchSwitcher.tsx) | Branch selection |
| **BranchToggle** | [`components/BranchToggle.tsx`](fets-point/src/components/BranchToggle.tsx) | Branch toggle switch |
| **FetsLogo** | [`components/FetsLogo.tsx`](fets-point/src/components/FetsLogo.tsx) | FETS logo |
| **NotificationBanner** | [`components/NotificationBanner.tsx`](fets-point/src/components/NotificationBanner.tsx) | Notification display |
| **LoadingFallback** | [`components/LoadingFallback.tsx`](fets-point/src/components/LoadingFallback.tsx) | Loading spinner |
| **ErrorBoundary** | [`components/ErrorBoundary.tsx`](fets-point/src/components/ErrorBoundary.tsx) | Error boundary wrapper |
| **LazyErrorBoundary** | [`components/LazyErrorBoundary.tsx`](fets-point/src/components/LazyErrorBoundary.tsx) | Error boundary for lazy components |
| **DatabaseSetup** | [`components/DatabaseSetup.tsx`](fets-point/src/components/DatabaseSetup.tsx) | Database setup UI |
| **EventManager** | [`components/EventManager.tsx`](fets-point/src/components/EventManager.tsx) | Event management |
| **Frame** | [`components/Frame.tsx`](fets-point/src/components/Frame.tsx) | Wrapper frame component |
| **CallOverlay** | [`components/CallOverlay.tsx`](fets-point/src/components/CallOverlay.tsx) | Call overlay UI |
| **EmojiPicker** | [`components/EmojiPicker.tsx`](fets-point/src/components/EmojiPicker.tsx) | Emoji selection |
| **RealtimeIndicators** | [`components/RealtimeIndicators.tsx`](fets-point/src/components/RealtimeIndicators.tsx) | Real-time status indicators |
| **PremiumShowcase** | [`components/PremiumShowcase.tsx`](fets-point/src/components/PremiumShowcase.tsx) | Premium feature showcase |
| **QuickFillDrawer** | [`components/QuickFillDrawer.tsx`](fets-point/src/components/QuickFillDrawer.tsx) | Quick fill drawer |
| **RaiseACaseModal** | [`components/RaiseACaseModal.tsx`](fets-point/src/components/RaiseACaseModal.tsx) | Case creation modal |
| **PullToRefresh** | [`components/PullToRefresh.tsx`](fets-point/src/components/PullToRefresh.tsx) | Pull to refresh |
| **NotificationPanel** | [`components/iCloud/NotificationPanel.tsx`](fets-point/src/components/iCloud/NotificationPanel.tsx) | Notification panel |
| **QuickActions** | [`components/iCloud/QuickActions.tsx`](fets-point/src/components/iCloud/QuickActions.tsx) | Quick action buttons |

#### Shared Components (components/shared/)

| Component | File | Purpose |
|-----------|------|---------|
| **EmptyState** | [`components/shared/EmptyState.tsx`](fets-point/src/components/shared/EmptyState.tsx) | Empty state placeholder |
| **LoadingState** | [`components/shared/LoadingState.tsx`](fets-point/src/components/shared/LoadingState.tsx) | Loading state component |

#### Checklist Components (components/checklist/)

| Component | File | Purpose |
|-----------|------|---------|
| **ChecklistManager** | [`components/checklist/ChecklistManager.tsx`](fets-point/src/components/checklist/ChecklistManager.tsx) | Checklist management |
| **ChecklistCreator** | [`components/checklist/ChecklistCreator.tsx`](fets-point/src/components/checklist/ChecklistCreator.tsx) | Create checklists |
| **ChecklistFormModal** | [`components/checklist/ChecklistFormModal.tsx`](fets-point/src/components/checklist/ChecklistFormModal.tsx) | Checklist form modal |
| **ChecklistAnalysis** | [`components/checklist/ChecklistAnalysis.tsx`](fets-point/src/components/checklist/ChecklistAnalysis.tsx) | Checklist analytics |
| **StaffBranchSelector** | [`components/checklist/StaffBranchSelector.tsx`](fets-point/src/components/checklist/StaffBranchSelector.tsx) | Staff/branch selector |
| **CustomChecklistSelector** | [`components/CustomChecklistSelector.tsx`](fets-point/src/components/CustomChecklistSelector.tsx) | Custom checklist picker |

#### iCloud Components (components/iCloud/)

| Component | File | Purpose |
|-----------|------|---------|
| **iCloudDashboard** | [`components/iCloud/iCloudDashboard.tsx`](fets-point/src/components/iCloud/iCloudDashboard.tsx) | iCloud dashboard |
| **AnimatedCounter** | [`components/iCloud/AnimatedCounter.tsx`](fets-point/src/components/iCloud/AnimatedCounter.tsx) | Animated number display |
| **GlassCard** | [`components/iCloud/GlassCard.tsx`](fets-point/src/components/iCloud/GlassCard.tsx) | Glassmorphism card |
| **ProgressRing** | [`components/iCloud/ProgressRing.tsx`](fets-point/src/components/iCloud/ProgressRing.tsx) | Circular progress |
| **StatusIndicator** | [`components/iCloud/StatusIndicator.tsx`](fets-point/src/components/iCloud/StatusIndicator.tsx) | Status indicator |
| **ThemeToggle** | [`components/iCloud/ThemeToggle.tsx`](fets-point/src/components/iCloud/ThemeToggle.tsx) | Theme switcher |
| **TimelineWidget** | [`components/iCloud/TimelineWidget.tsx`](fets-point/src/components/iCloud/TimelineWidget.tsx) | Timeline display |

### 6.15 System & Admin

| Component | File | Purpose |
|-----------|------|---------|
| **SystemManager** | [`components/SystemManager.tsx`](fets-point/src/components/SystemManager.tsx) | System configuration |
| **DatabaseSetup** | [`components/DatabaseSetup.tsx`](fets-point/src/components/DatabaseSetup.tsx) | Database setup |

---

## 7. Custom Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useAuth` | [`hooks/useAuth.ts`](fets-point/src/hooks/useAuth.ts) | Authentication state |
| `useBranch` | [`hooks/useBranch.ts`](fets-point/src/hooks/useBranch.ts) | Branch context |
| `useIsMobile` | [`hooks/use-mobile.ts`](fets-point/src/hooks/use-mobile.ts) | Mobile detection |
| `useScreenSize` | [`hooks/use-mobile.ts`](fets-point/src/hooks/use-mobile.ts) | Screen size detection |

---

## 8. Libraries & Configurations

| File | Purpose |
|------|---------|
| [`lib/supabase.ts`](fets-point/src/lib/supabase.ts) | Supabase client with typed database and helper functions |
| [`lib/database.types.ts`](fets-point/src/types/database.types.ts) | TypeScript types for database tables |
| [`lib/shared.types.ts`](fets-point/src/types/shared.ts) | Shared TypeScript types |

---

## 9. Utility Functions

| Category | Files |
|----------|-------|
| **Auth Utilities** | `authUtils.ts` - Permission checking, role validation |
| **Date Utilities** | `dateUtils.ts` - Date formatting, calculations |
| **Form Validation** | `validation.ts` - Zod schemas, form validation |

---

## 10. Key Entry Points

### Application Flow

```
main.tsx
    └── App.tsx
        ├── QueryClientProvider (React Query)
        │   └── AuthProvider
        │       └── BranchProvider
        │           └── ThemeProvider
        │               └── ChatProvider
        │                   └── CallProvider
        │                       └── AppContent
        │                           ├── Header (navigation)
        │                           └── activeTab content (lazy loaded)
        │                               ├── CommandCentreFinal
        │                               ├── Dashboard (iCloud)
        │                               ├── CandidateTrackerPremium
        │                               ├── FetsRosterPremium
        │                               ├── FetsCalendarPremium
        │                               ├── MyDeskNew
        │                               ├── StaffManagement
        │                               ├── FetsIntelligence
        │                               ├── IncidentLogPage
        │                               └── ...
```

---

## 11. Data Flow

### Supabase Data Flow

```
Components
    └── React Query (useQuery, useMutation)
        └── supabase client (lib/supabase.ts)
            └── Supabase Database
                ├── staff_profiles
                ├── candidates
                ├── shifts
                ├── incidents
                ├── messages
                ├── news
                ├── checklists
                └── ...
```

### Authentication Flow

```
Login.tsx
    └── supabase.auth.signInWithPassword()
        └── AuthContext.tsx
            ├── getUser() → user state
            └── loadUserProfile() → profile from staff_profiles
```

---

## 12. Routing & Navigation

The app uses programmatic routing via `activeTab` state in `App.tsx`:

| Tab | Component | Route |
|-----|-----------|-------|
| command-center | CommandCentreFinal | Default |
| dashboard | iCloudDashboard | /dashboard |
| candidate-tracker | CandidateTrackerPremium | /candidates |
| fets-roster | FetsRosterPremium | /roster |
| fets-calendar | FetsCalendarPremium | /calendar |
| my-desk | MyDeskNew | /desk |
| staff-management | StaffManagement | /staff |
| fets-intelligence | FetsIntelligence | /ai |
| incident-log | IncidentLogPage | /incidents |
| system-manager | SystemManager | /system |
| news-manager | NewsManager | /news |
| checklist-management | ChecklistManager | /checklists |
| lost-and-found | LostAndFound | /lost-found |
| user-management | UserManagement | /users (admin) |
| slate | Slate | /slate |

---

## 13. Testing Framework

- **Test Runner:** Vitest
- **Testing Library:** @testing-library/react
- **Coverage:** @vitest/coverage-v8
- **UI:** @vitest/ui
- **Mock Service Worker:** msw

**Scripts:**
- `pnpm test` - Run tests
- `pnpm test:ui` - Run tests with UI
- `pnpm test:coverage` - Generate coverage report

---

## 14. Build & Deployment

**Build Scripts:**
```bash
pnpm dev          # Development server (port 5174)
pnpm build        # Production build
pnpm build:prod   # Production build with prod flag
pnpm preview      # Preview production build (port 4173)
pnpm type-check   # TypeScript checking
pnpm lint         # ESLint
pnpm lint:fix     # ESLint auto-fix
```

**Output:**
- Build output: `fets-point/dist/`
- Assets: `fets-point/dist/assets/`
- Code splitting by vendor (React, Supabase), UI, and query libraries

---

## 15. Theme System

### FETS Brand Colors

| Color | Value | Usage |
|-------|-------|-------|
| accent-yellow | `#fbc00e` | Primary brand color |
| accent-mimosa | `#f4d03f` | Secondary brand |
| turquoise | `#29b3ff` | Accent |
| cyan | `#81eaff` | Light accent |
| dark | `#1a1a1a` | Dark background |

### Status Colors

| Status | Color |
|--------|-------|
| success | `#10b981` |
| warning | `#f59e0b` |
| error | `#ef4444` |

---

## 16. Database Schema (Supabase)

Key tables (inferred from code):

- `staff_profiles` - User profiles
- `candidates` - Candidate information
- `shifts` - Shift scheduling
- `incidents` - Incident reports
- `messages` - Chat messages
- `news` - News articles
- `checklists` - Task checklists
- `posts` - Social posts
- `comments` - Post comments

---

## 17. Feature Flags & Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NODE_ENV` | Development/production |

---

## 18. Performance Optimizations

- **Code Splitting:** Lazy loading for all route components
- **React Query:** Caching, stale time 30s, refetchOnWindowFocus disabled
- **Vendor Bundling:** Separate chunks for React, Supabase, UI, Query
- **Image Optimization:** WebP/PNG assets
- **CSS:** Tailwind utility classes, no runtime CSS-in-JS

---

## 19. Known Issues & Build Status

See related files:
- [`BUILD_ISSUES_REPORT.md`](BUILD_ISSUES_REPORT.md)
- [`BUILD_PROGRESS.md`](BUILD_PROGRESS.md)
- [`BUILD_SUCCESS_REPORT.md`](BUILD_SUCCESS_REPORT.md)
- [`FIXES_APPLIED.md`](FIXES_APPLIED.md)

---

## 20. Documentation

| Document | Purpose |
|----------|---------|
| [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md) | Getting started guide |
| [`docs/START-HERE.md`](docs/START-HERE.md) | Quick start |
| [`docs/MIONS.md`](docs/MIGRATION_INSTRUCTIONS.md)IGRATION_INSTRUCT | Migration guide |
| [`docs/WORK-COMPLETED.md`](docs/WORK-COMPLETED.md) | Completed work log |
| [`docs/MCP_SETUP_README.md`](docs/MCP_SETUP_README.md) | MCP server setup |
| [`docs/QUICK-START.md`](docs/QUICK-START.md) | Quick start guide |

---

## Summary

FETS.LIVE v4.0 is a well-structured React application with:

- **Monorepo architecture** using pnpm workspaces
- **TypeScript** throughout for type safety
- **React Query** for server state management
- **Supabase** as backend (auth + database)
- **Tailwind CSS** for styling with custom FETS theme
- **Framer Motion** for animations
- **Comprehensive component library** for staff management, scheduling, and communication
- **Real-time features** via Supabase subscriptions
- **AI integration** via Google Generative AI
- **Export capabilities** (Excel, PDF)

The codebase follows modern React best practices with lazy loading, context-based state management, and a clear separation of concerns.
