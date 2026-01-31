# FETS OMNI AI - Troubleshooting Guide

Complete guide to diagnosing and fixing common issues with FETS OMNI AI.

---

## 📋 Quick Diagnostics Checklist

Before diving into specific issues, run through this quick checklist:

- [ ] Is Supabase connection working?
- [ ] Is Anthropic API key configured?
- [ ] Are database migrations applied?
- [ ] Is the browser console showing errors?
- [ ] Is internet connection stable?
- [ ] Are you using a supported browser?

---

## Common Issues

### 1. AI Not Responding / "Neural Link Failed"

**Symptoms:**
- Chat bubble not responding
- Error message: "Neural Link Failed", "Neural Link Unstable", or "Connection failure"
- Infinite loading spinner

**Possible Causes:**
1. Missing or invalid Anthropic API key
2. Network connectivity issues
3. API rate limiting
4. CORS issues
5. Supabase connection failure

**Solutions:**

#### Solution 1: Check API Key
```bash
# Check .env file
cat fets-point/.env | grep ANTHROPIC

# Should show:
# VITE_ANTHROPIC_API_KEY=your_anthropic_key_here
```

If missing or invalid:
1. Go to `fets-point/.env`
2. Add/update: `VITE_ANTHROPIC_API_KEY=your_key_here`
3. Restart dev server: `npm run dev`

#### Solution 2: Check Browser Console
1. Press F12 to open DevTools
2. Go to Console tab
3. Look for errors like:
   - `API key invalid`
   - `CORS policy`
   - `Network request failed`

#### Solution 3: Test API Key Manually
```typescript
// In browser console
const testKey = 'your-api-key'
fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': testKey,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
    'anthropic-dangerous-direct-browser-access': 'true'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 100,
    messages: [{ role: 'user', content: 'Hello' }]
  })
}).then(r => r.json()).then(console.log)
```

#### Solution 4: Check Rate Limits
Wait 60 seconds and try again. If rate limited, error message will say:
- "Claude is at rate limit"
- "Too many requests"

---

### 2. Empty or Incorrect Responses

**Symptoms:**
- AI responds with "I don't have data"
- Answers are wrong or outdated
- Statistics don't match reality

**Possible Causes:**
1. Database migrations not applied
2. No data in database tables
3. Query too specific
4. Date range outside available data

**Solutions:**

#### Solution 1: Verify Database Migrations
```sql
-- Run in Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'ai_%'
ORDER BY table_name;
```

Expected: 17 tables starting with `ai_`

If missing, apply migrations:
- See `MIGRATION_INSTRUCTIONS.md`
- Run Phase 1 and Phase 2 SQL files

#### Solution 2: Check Data Availability
```sql
-- Check if there's data
SELECT COUNT(*) FROM candidates;
SELECT COUNT(*) FROM calendar_sessions;
SELECT COUNT(*) FROM incidents;
```

If all return 0, you need to populate data first.

#### Solution 3: Broaden Query
Instead of:
```
Show CMA US exams on January 15, 2024 in Trivandrum
```

Try:
```
Show all CMA US exams in 2024
```

---

### 3. Slow Response Times (>5 seconds)

**Symptoms:**
- AI takes longer than 5 seconds to respond
- Loading spinner for extended period
- Eventually times out

**Possible Causes:**
1. Large dataset (all-time queries)
2. Complex aggregations
3. Slow internet connection
4. Supabase performance issues

**Solutions:**

#### Solution 1: Add Date Filters
```
// Instead of:
Show all CMA US candidates

// Use:
Show CMA US candidates in 2024
```

#### Solution 2: Check Network Speed
```bash
# Test latency to Anthropic API
ping api.anthropic.com

# Test Supabase connection
ping db.qqewusetilxxfvfkmsed.supabase.co
```

#### Solution 3: Use Base Implementation
Switch to optimized version:
```typescript
// Instead of anthropicEnhanced.ts (all-time)
import { askClaude } from '../lib/anthropic'  // 30-day window
```

---

### 4. Conversation History Not Saving

**Symptoms:**
- Previous conversations not appearing in History tab
- Conversation context lost on refresh
- Messages disappear

**Possible Causes:**
1. Database tables not created
2. User not authenticated properly
3. Row-level security blocking inserts
4. JavaScript errors during save

**Solutions:**

#### Solution 1: Check Authentication
```typescript
// In browser console
console.log(window.__CURRENT_USER__)
// Should show user object with id
```

#### Solution 2: Test Database Insert
```sql
-- Run in Supabase SQL Editor
INSERT INTO ai_conversations (user_id, title)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Test Conversation'
);

-- Should succeed
```

#### Solution 3: Check Browser Console
Look for errors like:
- `Permission denied`
- `RLS policy violation`
- `Foreign key constraint`

---

### 5. Chat Bubble Not Appearing

**Symptoms:**
- No AI floating bubble visible
- Widget doesn't render

**Possible Causes:**
1. Component not imported in App.tsx
2. Z-index conflict
3. CSS not loaded
4. Component error

**Solutions:**

#### Solution 1: Verify Import
Check `fets-point/src/App.tsx`:
```typescript
import { AiAssistant } from './components/AiAssistant'

// Later in component:
<AiAssistant />
```

#### Solution 2: Check Z-Index
AiAssistant should have `z-index: 9999`

Inspect element (F12) and verify styles.

#### Solution 3: Check Console Errors
Look for:
- Component render errors
- Import errors
- Dependency missing

---

### 6. FetsOmniAI Tab Not Showing

**Symptoms:**
- No "FETS OMNI AI" option in sidebar
- Tab exists but shows 404

**Possible Causes:**
1. Route not added to App.tsx
2. Component import failed
3. Lazy loading error

**Solutions:**

#### Solution 1: Verify Route
Check `App.tsx` routeComponents:
```typescript
'fets-omni-ai': {
  component: <FetsOmniAI initialQuery={aiQuery} />,
  name: 'FETS OMNI AI'
}
```

#### Solution 2: Check Lazy Import
```typescript
const FetsOmniAI = lazy(() =>
  import('./components/FetsOmniAI').then(module => ({
    default: module.FetsOmniAI
  }))
)
```

#### Solution 3: Check Sidebar Component
Ensure sidebar has navigation item for 'fets-omni-ai'

---

### 7. "Cannot read property of undefined" Errors

**Symptoms:**
- JavaScript errors in console
- Components crash
- White screen

**Possible Causes:**
1. Missing dependencies
2. Incorrect imports
3. Undefined props
4. API response structure changed

**Solutions:**

#### Solution 1: Check Dependencies
```bash
cd fets-point
npm list framer-motion react-hot-toast lucide-react
```

All should be installed. If not:
```bash
npm install framer-motion react-hot-toast lucide-react
```

#### Solution 2: Add Null Checks
```typescript
// Before
const data = response.historical.sessions.by_year

// After
const data = response?.historical?.sessions?.by_year || {}
```

#### Solution 3: Check Props
```typescript
// Component expects these props
<FetsOmniAI
  initialTab="chat"           // Optional
  initialQuery={undefined}    // Optional
/>
```

---

### 8. Glassmorphism Effects Not Rendering

**Symptoms:**
- Flat, non-transparent UI
- Missing blur effects
- No animations

**Possible Causes:**
1. Browser doesn't support backdrop-filter
2. CSS not loaded
3. Tailwind config issue
4. Performance mode enabled

**Solutions:**

#### Solution 1: Check Browser Support
Use modern browser:
- Chrome 76+
- Firefox 103+
- Safari 9+
- Edge 79+

#### Solution 2: Check CSS Classes
Verify in DevTools that these classes are applied:
- `backdrop-blur-xl`
- `bg-white/5`
- `border border-white/10`

#### Solution 3: Disable Performance Mode
Some browsers disable effects in performance mode.

---

### 9. Mobile UI Issues

**Symptoms:**
- Chat bubble too small/large
- Text overflow
- Buttons not clickable
- Animations janky

**Solutions:**

#### Solution 1: Check Viewport
Ensure meta tag in `index.html`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

#### Solution 2: Test Responsive Classes
Components use:
- `md:` prefix for desktop
- Mobile-first approach
- `useIsMobile()` hook

#### Solution 3: Reduce Animations
On mobile, some animations are disabled for performance.

---

### 10. Knowledge Base Not Populating

**Symptoms:**
- Knowledge tab shows no insights
- AI doesn't learn from conversations
- Verification requests empty

**Possible Causes:**
1. Insight extraction disabled
2. Confidence threshold too high
3. Database permissions
4. No verified knowledge yet

**Solutions:**

#### Solution 1: Check Insight Storage
After AI query, check:
```sql
SELECT COUNT(*) FROM ai_knowledge_base;
SELECT COUNT(*) FROM ai_verification_requests;
```

Should increase over time.

#### Solution 2: Lower Confidence Threshold
```typescript
// In conversationService.ts
const minConfidence = 0.5  // Lower from 0.7
```

#### Solution 3: Manually Add Knowledge
```sql
INSERT INTO ai_knowledge_base (
  topic, insight, source_query, confidence_score, verified
) VALUES (
  'Test Topic',
  'Test insight',
  'Test query',
  0.9,
  true
);
```

---

## Advanced Debugging

### Enable Debug Mode

Add to browser localStorage:
```javascript
localStorage.setItem('AI_DEBUG', 'true')
```

Then refresh. You'll see:
- Verbose console logs
- API request/response details
- Query parsing results

### Check Network Requests

1. Open DevTools (F12)
2. Go to Network tab
3. Filter for:
   - `anthropic.com` (AI requests)
   - `supabase.co` (Database)

Look for:
- HTTP status codes (200 = success)
- Response times
- Error messages

### Inspect Database Queries

```sql
-- Check recent queries
SELECT query_text, created_at, execution_time_ms
FROM ai_query_log
ORDER BY created_at DESC
LIMIT 10;

-- Check error patterns
SELECT response_summary, COUNT(*)
FROM ai_query_log
WHERE response_summary LIKE '%error%'
GROUP BY response_summary;
```

### Test Individual Components

```typescript
// Test askClaude directly in console
import { askClaude } from '../lib/anthropic'

const response = await askClaude('test query', null)
console.log(response)
```

---

## Error Messages Reference

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Neural Link Broken: No API key found" | Missing API key | Add VITE_ANTHROPIC_API_KEY to .env |
| "Neural Link Denied: API Key Verification Failed" | Invalid API key | Check API key is correct |
| "Claude is at rate limit" | Too many requests | Wait 60 seconds |
| "Neural Engine Malfunction" | Unknown error | Check browser console |
| "System Alert: Claude Neural Key is missing" | API key undefined | Restart dev server |
| "Connection failure. My neural link is momentarily disrupted." | Network error | Check internet |
| "I was unable to process that" | Query parsing failed | Rephrase query |
| "Permission denied" | RLS policy violation | Check user permissions |

---

## Performance Issues

### Memory Leaks

**Symptoms:**
- Browser becomes slow over time
- High memory usage in Task Manager

**Solutions:**
1. Close unused tabs
2. Disable real-time subscriptions when not needed
3. Clear conversation history periodically
4. Restart browser

### High CPU Usage

**Causes:**
- Too many animations
- Real-time subscriptions active
- Large dataset rendering

**Solutions:**
```typescript
// Disable animations
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

// Unsubscribe from realtime
const unsubscribe = setupRealtimeSubscriptions(...)
unsubscribe()  // Call when component unmounts
```

---

## Browser-Specific Issues

### Safari

**Issue**: Backdrop blur not working
**Fix**: Update to Safari 15.4+

**Issue**: Animations stuttering
**Fix**: Disable hardware acceleration in preferences

### Firefox

**Issue**: CORS errors
**Fix**: Ensure `anthropic-dangerous-direct-browser-access` header is set

### Chrome

**Issue**: Memory usage high
**Fix**: Disable unused Chrome extensions

---

## Still Having Issues?

### Collect Debug Information

1. **Browser & Version**
   ```javascript
   console.log(navigator.userAgent)
   ```

2. **Environment Check**
   ```bash
   node -v        # Node version
   npm -v         # npm version
   npm list       # Installed packages
   ```

3. **Console Errors**
   - Copy all error messages from console
   - Include full stack traces

4. **Network Tab**
   - Screenshot failed requests
   - Include response bodies

### Contact Support

Email: support@fets.in

Include:
- Debug information above
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

### Community Resources

- GitHub Issues: Report bugs
- Documentation: `/docs/`
- User Guide: `AI_USER_GUIDE.md`
- API Reference: `AI_API_REFERENCE.md`

---

## Preventive Measures

### Regular Maintenance

1. **Weekly**:
   - Clear old conversations (>90 days)
   - Review verification requests
   - Check error logs

2. **Monthly**:
   - Update dependencies
   - Backup database
   - Review API usage

3. **Quarterly**:
   - Archive old data
   - Performance audit
   - Security review

### Best Practices

✅ **Do's**:
- Keep dependencies updated
- Monitor API usage
- Test in staging first
- Keep logs for debugging
- Document custom changes

❌ **Don'ts**:
- Don't commit API keys
- Don't skip migrations
- Don't ignore errors
- Don't exceed rate limits
- Don't disable security

---

## Appendix: Diagnostic Scripts

### Test Supabase Connection
```bash
node scripts/test-supabase.cjs
```

### Test Anthropic API
```bash
node scripts/test-anthropic.cjs
```

### Verify Migrations
```bash
node scripts/verify-migrations.cjs
```

### Generate Debug Report
```bash
node scripts/generate-debug-report.cjs
```

---

**Last Updated**: January 31, 2026
**Version**: 1.0.0
