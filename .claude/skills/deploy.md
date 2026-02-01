# Deploy Application

Build and deploy the FETS.LIVE application.

## Instructions

### Build Commands:

```bash
cd fets-point

# Development build
pnpm build

# Production build (recommended for deployment)
pnpm build:prod

# Preview production build locally
pnpm preview
```

### Pre-Deployment Checklist:

1. **Type check passes**:
   ```bash
   pnpm type-check
   ```

2. **Lint check passes**:
   ```bash
   pnpm lint
   ```

3. **Tests pass**:
   ```bash
   pnpm test
   ```

4. **Environment variables set**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Production Build Process:

The `pnpm build:prod` command:
1. Installs dependencies
2. Cleans temp build artifacts
3. Runs TypeScript compiler
4. Sets `BUILD_MODE=prod` environment variable
5. Runs Vite production build

### Output:
- Build files go to `fets-point/dist/`
- Ready for deployment to any static hosting

### Deployment Script:
PowerShell deployment script available at `scripts/deploy.ps1` (FTP-based)

## Actions:
1. Run pre-deployment checks (type-check, lint, test)
2. Create production build
3. Preview build locally
4. Report build status and any errors
