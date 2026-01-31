# Fix Error

Quickly diagnose and fix errors in the FETS.LIVE codebase.

## Instructions

### Common Error Types & Solutions:

#### 1. TypeScript Errors
```bash
cd fets-point && pnpm type-check
```
- Check for missing type imports
- Verify interface definitions match usage
- Look for undefined property access

#### 2. Import Errors
- Verify file paths are correct
- Check if export is default vs named
- Ensure circular dependencies aren't present

#### 3. React Query Errors
- Ensure `QueryClientProvider` wraps the app
- Check query key uniqueness
- Verify async functions return properly

#### 4. Supabase Errors
- Check RLS policies in Supabase dashboard
- Verify table/column names match
- Ensure user is authenticated for protected routes

#### 5. Build Errors
```bash
cd fets-point && pnpm build 2>&1 | head -50
```
- Check for unused imports (strict mode)
- Verify all dependencies are installed
- Look for syntax errors

### Debugging Steps:

1. **Read the error message carefully** - line numbers and file paths
2. **Check recent changes** - `git diff` or `git status`
3. **Verify imports** - correct paths and named vs default
4. **Check types** - TypeScript compiler output
5. **Console logs** - Use emoji prefixes for visibility:
   ```typescript
   console.log('🔄 Loading...')
   console.log('✅ Success:', data)
   console.log('❌ Error:', error)
   ```

### Quick Fixes:

**Missing dependency:**
```bash
cd fets-point && pnpm install package-name
```

**Clear cache and rebuild:**
```bash
cd fets-point && rm -rf node_modules/.vite && pnpm dev
```

**Reset node_modules:**
```bash
cd fets-point && rm -rf node_modules && pnpm install
```

## Provide me:
- The error message (copy/paste)
- The file where it occurs
- What you were trying to do when it happened
