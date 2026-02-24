# 🔔 Functional Notification System - Documentation

## Overview

The FETS.LIVE notification system provides real-time, intelligent alerts from all important features across the platform. It replaces the static "FETS NEWS" banner with a dynamic, priority-based notification center.

---

## 📍 Location

The notification banner is displayed at the **top of the Command Centre page**, directly below the main header and above the dashboard content.

---

## ✨ Features

### 1. **Smart Notification Aggregation**

Automatically collects and prioritizes notifications from multiple sources:

- ✅ Critical Incidents (emergency/critical priority)
- ✅ Pending Incidents (awaiting resolution)
- ✅ Today's Exams (scheduled sessions)
- ✅ Incomplete Checklists (today's pending tasks)
- ✅ New Candidate Registrations (5+ today)
- ✅ Upcoming Exams (next 3 days)
- ✅ System News Updates

### 2. **Priority Levels**

Notifications are categorized and sorted by priority:

- 🔴 **Critical:** Emergency incidents requiring immediate attention
- 🟠 **High:** Pending incidents, today's exams
- 🟡 **Medium:** Incomplete checklists, new registrations
- 🔵 **Low:** Upcoming exams, system news

### 3. **Two Display Modes**

#### Collapsed Mode (Default)

- **Scrolling Banner:** Continuously scrolls high-priority notifications
- **Unread Count Badge:** Shows number of unread notifications
- **"View All" Button:** Expands to full detail view
- **Minimal Screen Space:** Single-line banner at top

#### Expanded Mode

- **Full Grid View:** 1-3 column responsive grid of notification cards
- **Detailed Information:** Complete notification details with icons
- **Action Buttons:** Click to navigate to relevant sections
- **Dismiss/Mark as Read:** Interactive controls
- **"Show All" Toggle:** Filter between top 3 or all notifications

### 4. **Color-Coded Visual Design**

Each notification type has a unique color scheme:

- 🔴 **Red:** Critical incidents (emergency)
- 🟠 **Orange:** Pending incidents (high priority)
- 🔵 **Blue:** Today's exams, system notifications
- 🟣 **Purple:** Checklists, tasks
- 🟢 **Green:** Candidate registrations (positive)
- 🟢 **Indigo:** Upcoming exams (informational)
- ⚫ **Gray:** News, general updates

### 5. **Actionable Notifications**

Click any notification to:

- Navigate to **Incident Manager** for incidents
- Jump to **Calendar** for exam details
- Open **Command Centre** for checklist actions
- View **Candidates** page for registrations

### 6. **Auto-Refresh**

- Updates every **60 seconds** automatically
- No manual refresh needed
- Real-time synchronization with database

### 7. **User Controls**

- **Mark as Read:** Click notification to mark read
- **Dismiss:** Remove individual notifications
- **Mark All as Read:** Bulk action (future enhancement)
- **Expand/Collapse:** Toggle detail view

---

## 🎨 Design Features

### Glassmorphism Effect

- Semi-transparent backgrounds
- Backdrop blur for modern aesthetic
- Consistent with Command Centre design language

### Smooth Animations

- Scrolling marquee effect in collapsed mode
- Fade-in/fade-out transitions
- Hover effects on notification cards
- Pulse animation for unread badges

### Responsive Design

- **Mobile:** Single column, touch-friendly
- **Tablet:** 2-column grid
- **Desktop:** 3-column grid
- All screen sizes fully supported

---

## 🔧 Technical Implementation

### Files Created/Modified

#### New Files:

1. **`src/hooks/useNotifications.ts`**

   - Custom React hook for notification management
   - Fetches from 7 different data sources
   - Handles priority sorting and filtering
   - Provides state management functions

2. **`src/components/NotificationBanner.tsx`**
   - Main notification UI component
   - Collapsed and expanded view modes
   - Interactive notification cards
   - Responsive grid layout

#### Modified Files:

1. **`src/components/CommandCentre.tsx`**
   - Replaced FETS NEWS scroller with NotificationBanner
   - Removed old news fetching logic
   - Integrated new notification system

### Data Sources

The system queries the following Supabase tables:

1. **`incidents`** - Critical and pending incidents
2. **`sessions`** - Today's exams and upcoming sessions
3. **`checklist_instances`** - Incomplete checklists
4. **`candidates`** - New registrations
5. **`news_updates`** - System announcements

### Notification Types

```typescript
interface Notification {
  id: string;
  type: "incident" | "exam" | "candidate" | "checklist" | "system" | "news";
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  link?: string; // Navigation target
  timestamp: string;
  isRead: boolean;
  icon: string; // Icon name
  color: string; // Color scheme
}
```

### Priority Sorting Algorithm

```typescript
const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
// Sort by priority first, then by timestamp
notifications.sort((a, b) => {
  if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  }
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
});
```

---

## 📊 Notification Rules

### When Notifications Appear:

1. **Critical Incidents**

   - Priority: Critical/Emergency
   - Status: Not closed
   - Limit: Top 5
   - Action: Navigate to Incident Manager

2. **Pending Incidents**

   - Status: Pending
   - Count: All pending incidents
   - Shows total count in message

3. **Today's Exams**

   - Date: Today
   - Shows: Number of exams and total candidates
   - Action: Navigate to Calendar

4. **Incomplete Checklists**

   - Exam Date: Today
   - Status: Not completed
   - Shows: Count of pending checklists

5. **New Candidates**

   - Created: Today
   - Threshold: 5+ registrations
   - Shows: Total count

6. **Upcoming Exams**

   - Date: Next 3 days
   - Shows: Count of scheduled exams

7. **System News**
   - Active: Yes
   - Not expired
   - Limit: Top 3 by priority

### Branch Filtering

All notifications respect the active branch setting:

- **Global Branch:** Shows all notifications across branches
- **Specific Branch:** Filters to branch-specific data only

---

## 🎯 User Experience

### First-Time View

1. User navigates to Command Centre
2. Notification banner auto-loads at top
3. High-priority notifications scroll in banner
4. Unread count badge shows total unread

### Interaction Flow

1. **View Details:** Click "View All" to expand
2. **Navigate:** Click notification card to go to relevant page
3. **Dismiss:** Click X button to remove notification
4. **Collapse:** Click collapse button to return to banner

### No Notifications State

- Banner hidden when no notifications exist
- Clean, uncluttered interface

---

## 🚀 Performance

### Optimization Features:

- ✅ Efficient database queries with `.limit()` and `.select()`
- ✅ 60-second refresh interval (not real-time to save resources)
- ✅ Debounced interactions
- ✅ Lazy loading of notification details
- ✅ Memoized sorting and filtering

### Loading States:

- Graceful loading during data fetch
- No blocking UI operations
- Background refresh without interruption

---

## 📱 Mobile Experience

### Mobile-Specific Features:

- Touch-optimized tap targets (48px minimum)
- Single-column card layout
- Full-width banner
- Smooth touch scrolling
- Responsive font sizes
- Bottom-aligned action buttons

### Tablet View:

- 2-column grid in expanded mode
- Larger touch targets
- Enhanced spacing

---

## 🔐 Security & Privacy

### Data Access:

- Respects user authentication
- Branch-level data filtering
- No sensitive data in notifications
- Secure Supabase queries

### Permissions:

- Only shows data user has access to
- Branch-filtered results
- Role-based notification visibility

---

## 🎨 Customization Options

### Future Enhancements:

- [ ] Notification preferences per user
- [ ] Sound alerts for critical notifications
- [ ] Email/SMS integration
- [ ] Notification history log
- [ ] Custom notification rules
- [ ] Snooze functionality
- [ ] Notification grouping

---

## 🧪 Testing Checklist

Before going live, verify:

- [ ] Notifications appear in Command Centre
- [ ] Collapsed banner scrolls smoothly
- [ ] Expanded view displays all details
- [ ] Navigation links work correctly
- [ ] Unread count updates properly
- [ ] Dismiss functionality works
- [ ] Mobile responsive design
- [ ] Touch interactions smooth
- [ ] Color coding correct
- [ ] Priority sorting accurate
- [ ] Auto-refresh working (60s)
- [ ] Branch filtering applied

---

## 📈 Monitoring & Analytics

### Key Metrics to Track:

- Number of notifications generated per day
- Most common notification types
- Click-through rate on notifications
- Dismissal rate
- Average time to action on critical notifications

---

## 🛠️ Troubleshooting

### Issue: No Notifications Appearing

**Solution:**

1. Check if there are actually pending incidents/exams
2. Verify Supabase connection
3. Check browser console for errors
4. Ensure branch filter is correct

### Issue: Notifications Not Updating

**Solution:**

1. Refresh page manually
2. Check 60-second auto-refresh interval
3. Verify Supabase real-time connection
4. Check network connectivity

### Issue: Broken Navigation

**Solution:**

1. Verify `onNavigate` prop is passed correctly
2. Check tab names match routing configuration
3. Ensure proper navigation handler in parent component

---

## 📞 Support

For issues or questions about the notification system:

1. Check browser console for errors
2. Verify Supabase connection
3. Review notification hook logs
4. Test in incognito mode to rule out cache issues

---

## 🎉 Conclusion

The functional notification system transforms the Command Centre into a true operational hub, keeping users informed of all important events across FETS.LIVE in real-time.

**Key Benefits:**

- ✅ Never miss critical incidents
- ✅ Stay informed about today's exams
- ✅ Track pending checklists
- ✅ Monitor candidate registrations
- ✅ Plan for upcoming exams
- ✅ Receive system updates

**Result:** A more efficient, informed, and proactive team managing exams with confidence!

---

**Built with:** React, TypeScript, Supabase, Framer Motion, Tailwind CSS
**Version:** 1.0
**Last Updated:** 2025

---

**Happy Monitoring! 📊**
