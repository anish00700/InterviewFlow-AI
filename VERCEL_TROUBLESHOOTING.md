# Vercel Deployment Troubleshooting

## Common Build Issues

### 1. Build Log Shows "Vulnerabilities" Warning

**What you see:**
```
4 vulnerabilities (3 moderate, 1 critical)
```

**Solution:** These are just warnings, not errors. The build should continue. If the build fails, it's likely due to a different issue. Check the full build log for actual errors.

### 2. Build Fails with "Module not found" or Import Errors

**Possible causes:**
- Missing dependencies
- Path alias `@` not resolving correctly
- Missing configuration files

**Solution:**
1. Ensure `vite.config.js` has the path alias configured:
   ```js
   resolve: {
     alias: {
       '@': path.resolve(__dirname, './src'),
     },
   }
   ```

2. Verify all imports use correct paths
3. Check that `tailwind.config.js` and `postcss.config.js` exist

### 3. Build Fails with "Cannot find module"

**Solution:**
- Ensure all dependencies are in `package.json`
- Remove `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check that you're in the correct directory (`interviewflow-frontend`)

### 4. Environment Variables Not Working

**Problem:** `VITE_API_URL` is undefined in production

**Solution:**
1. In Vercel Dashboard → Project Settings → Environment Variables
2. Add: `VITE_API_URL` = `https://your-backend-url.railway.app`
3. **Important**: Variable name must start with `VITE_` for Vite to expose it
4. Redeploy after adding variables

### 5. Build Succeeds but App Doesn't Work

**Check:**
- Browser console for errors
- Network tab for failed API calls
- Verify `VITE_API_URL` is set correctly
- Check CORS settings in backend

### 6. "Root Directory" Configuration

**In Vercel:**
- Go to Project Settings → General
- Set **Root Directory** to: `interviewflow-frontend`
- Save and redeploy

### 7. Build Timeout

**Problem:** Build takes too long and times out

**Solution:**
- Remove unnecessary dependencies
- Check for large files in the repository
- Optimize build process

---

## Quick Fixes

### Remove Unnecessary Dependencies

The `pnpm` package was removed from `package.json` as it's a package manager, not a runtime dependency.

### Simplify Vercel Config

Vercel auto-detects Vite, so `vercel.json` is optional. If you have one, keep it minimal:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

Or remove it entirely - Vercel will auto-detect.

---

## Getting Full Error Logs

If the build fails, check:

1. **Vercel Dashboard** → Your Project → Deployments → Click on failed deployment
2. Scroll to the bottom of the build log
3. Look for error messages (usually in red)
4. Common error patterns:
   - `Error: Cannot find module...`
   - `SyntaxError: ...`
   - `Build failed with exit code 1`

---

## Testing Build Locally

Before deploying, test the build locally:

```bash
cd interviewflow-frontend
npm run build
```

If this works locally, the Vercel build should work too.

---

## Still Having Issues?

Share the **complete** build log from Vercel (especially the error section at the bottom) for more specific help.
