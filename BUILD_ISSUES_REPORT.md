# FETS.LIVE Build Issues Report

## Summary
The project has been successfully pushed to GitHub, but there are **TypeScript compilation errors** that prevent the build from completing. Below is a detailed analysis of the issues found.

## Build Status
- ✅ Dependencies installed successfully
- ❌ Build failed with TypeScript errors
- ✅ Project committed and pushed to GitHub

## Critical Issues Found

### 1. Missing Components
- `SevenDayCalendarWidget.tsx` - Referenced but deleted
- `SevenDayRosterDisplay.tsx` - Referenced but deleted
- `KudosBoard.tsx` - Referenced but deleted
- `KudosModal.tsx` - Referenced but deleted
- `ChecklistFillModal` - Export not found
- `CreateCustomChecklistModal` - Export not found

**Files affected:**
- `CommandCentre.tsx` (lines 13-16)
- `CommandCentrePremium.tsx` (lines 8-9)
- `FetsConnect.tsx` (lines 39, 41)

### 2. Type Mismatches

#### Database Type Issues
- `question_type` field expects specific enum values but receives generic strings
- `priority` field type mismatch (string vs enum)
- `Session` type missing `exam_name` and `user_id` properties
- `StaffProfile` type not exported from database.types
- `LeaveRequest` type not exported from database.types

**Files affected:**
- `ChecklistManagement.tsx` (lines 148, 171)
- `CommandCentrePremium.tsx` (lines 255, 257, 439)
- `FetsCalendar.tsx` (line 543)
- `StaffManagement.tsx` (line 23)
- `ShiftSwapModal.tsx` (line 7)

#### State Management Issues
- KPI data missing `sessions_live` and `sessions_done` properties
- Event/Incident priority type mismatch
- Comment ID type mismatch (number vs string)
- Notification type missing properties (`icon`, `color`, `timestamp`, `dismissNotification`)

**Files affected:**
- `CommandCentre.tsx` (lines 119, 185)
- `EventManager.tsx` (line 100)
- `IncidentManager.tsx` (lines 115, 859, 917)
- `NotificationBanner.tsx` (lines 89, 148-149, 221-222, 232, 236, 262)

### 3. Missing Imports/Exports
- `toast` function not imported in `FetsCalendar.tsx`
- `ShieldCheck` icon not imported in `SettingsPage.tsx`
- `Inserts` and `Updates` types not found in hooks
- `CandidateMetrics` and `IncidentStats` not exported
- `ChecklistItem` not exported from types

**Files affected:**
- `FetsCalendar.tsx` (lines 65, 195, 200, 206)
- `SettingsPage.tsx` (line 498)
- `useQueries.ts` (multiple lines)
- `useChecklist.ts` (line 3)

### 4. Function Signature Issues
- `useMutateAsyncFunction` assigned to `MouseEventHandler` (incompatible types)
- `loadIntelligenceData`, `loadAnalytics`, `loadInsights`, `loadReports` used before declaration
- `loadVaultData`, `loadFeedData`, `loadMockFeedData` used before declaration
- `loadStaffProfiles`, `loadSwapRequests` used before declaration
- `loadNext7DaysData` used before declaration

**Files affected:**
- `Chat.tsx` (line 29)
- `FetsIntelligence.tsx` (lines 46, 71)
- `FetsVault.tsx` (line 316)
- `MyDesk.tsx` (lines 63, 79)
- `ShiftSwapModal.tsx` (lines 47-48)
- `iCloud/TimelineWidget.tsx` (line 40)

### 5. Supabase Query Issues
- Invalid table references: `calendar_sessions`, `schedules`, `news_ticker`, `user_settings`
- These tables don't exist in the current database schema

**Files affected:**
- `CommandCentrePremium.tsx` (line 141)
- `EnhancedQuickAddModal.tsx` (line 101)
- `FetsManager.tsx` (line 147)
- `SettingsPage.tsx` (lines 183-184, 220)

### 6. Type Instantiation Issues
- Excessively deep type instantiation in `FetsManager.tsx` and `SettingsPage.tsx`
- Circular type references causing infinite recursion

**Files affected:**
- `FetsManager.tsx` (line 147)
- `SettingsPage.tsx` (line 183)
- `useCommandCentre.ts` (line 36)
- `useSessions.ts` (line 31)

### 7. Property Access Issues
- `BranchType` doesn't have `id`, `name` properties (it's a string literal type)
- `Notification` type missing several properties
- `StaffProfile` missing from exports
- `last_message` property doesn't exist (should be `last_message_at`)

**Files affected:**
- `CommandCentrePremium.tsx` (lines 103, 167, 174)
- `FetsCalendarPremium.tsx` (lines 321, 563)
- `FetsRosterPremium.tsx` (lines 358)
- `IncidentManager.tsx` (lines 240, 859)
- `ConversationList.tsx` (line 37)

## Recommendations

### Priority 1 (Critical)
1. Restore or recreate deleted components or remove references
2. Fix database type definitions to match actual schema
3. Export missing types from `database.types.ts`
4. Fix Supabase table references

### Priority 2 (High)
1. Fix function declaration order (move declarations before usage)
2. Add missing imports (toast, icons, types)
3. Resolve type mismatches in state management
4. Fix BranchType usage

### Priority 3 (Medium)
1. Resolve circular type references
2. Update Notification type definition
3. Fix property access issues
4. Add proper type casting where needed

## Next Steps
1. Review the database schema and update type definitions
2. Audit component imports and exports
3. Fix function declaration order
4. Run `pnpm build` again to verify fixes
5. Consider using `pnpm lint:fix` to auto-fix some issues

## Files Requiring Immediate Attention
- `src/types/database.types.ts` - Update type definitions
- `src/components/CommandCentre.tsx` - Fix imports and types
- `src/components/CommandCentrePremium.tsx` - Fix imports and types
- `src/hooks/useQueries.ts` - Fix type exports
- `src/services/api.service.ts` - Verify Supabase queries
