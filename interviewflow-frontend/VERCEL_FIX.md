# Vercel Build Fix - Step by Step

## ✅ What I Fixed

1. **Fixed `__dirname` issue in `vite.config.js`**
   - ES modules don't have `__dirname` by default
   - Now uses `fileURLToPath(import.meta.url)` which works on Vercel

2. **Updated `vercel.json`**
   - Added SPA routing rewrite rules
   - Ensures all routes work correctly

3. **Fixed case-sensitive imports**
   - Updated UI components index to use lowercase file names

## 🚀 Deployment Steps

### Step 1: Verify Vercel Project Settings

1. Go to your Vercel project dashboard
2. Click **Settings** → **General**
3. **CRITICAL**: Set **Root Directory** to: `interviewflow-frontend`
   - This tells Vercel where your frontend code is
   - Without this, Vercel tries to build from the repo root and fails

### Step 2: Add Environment Variable

1. Go to **Settings** → **Environment Variables**
2. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.railway.app` (or leave empty for now)
   - **Environment**: Production, Preview, Development (select all)

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Or push a new commit to trigger auto-deploy

## 🔍 If Build Still Fails

### Check the Full Error

1. Go to **Deployments** → Click on the failed deployment
2. Scroll to the **bottom** of the build log
3. Look for error messages (usually in red)
4. Common errors:
   - `Cannot find module...`
   - `Error: ENOENT: no such file or directory...`
   - `SyntaxError: ...`

### Common Issues

#### Issue: "Cannot find module '@/components/...'"

**Solution**: 
- Verify Root Directory is set to `interviewflow-frontend`
- The `@` alias is configured in `vite.config.js` and should work

#### Issue: "Root Directory not found"

**Solution**:
- In Vercel Settings → General
- Set Root Directory to exactly: `interviewflow-frontend`
- Not `./interviewflow-frontend` or `/interviewflow-frontend`

#### Issue: Build times out

**Solution**:
- The build should complete in ~2-3 minutes
- If it times out, check for infinite loops or large files

## 📋 Verification Checklist

Before deploying, ensure:

- [ ] Root Directory is set to `interviewflow-frontend` in Vercel
- [ ] `vite.config.js` uses `fileURLToPath` (already fixed)
- [ ] `vercel.json` exists and is correct (already created)
- [ ] Local build works: `npm run build` succeeds
- [ ] All files are committed to git
- [ ] Environment variable `VITE_API_URL` is set (can be empty for now)

## 🎯 Quick Test

After fixing Root Directory, the build should:
1. Install dependencies ✅
2. Run `npm run build` ✅
3. Output to `dist/` directory ✅
4. Deploy successfully ✅

## 📞 Still Having Issues?

If the build still fails after setting Root Directory:

1. **Share the complete error** from the bottom of the Vercel build log
2. **Verify Root Directory** is set correctly (screenshot helps)
3. **Check** that all files are in the repository

The most common issue is **Root Directory not being set correctly**. This is the #1 cause of Vercel build failures for monorepos.
