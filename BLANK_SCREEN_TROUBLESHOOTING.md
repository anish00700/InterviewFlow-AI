# Blank Screen Troubleshooting Guide

## Common Causes of Blank Screen on Vercel

### 1. **Missing Environment Variable**

**Problem**: `VITE_API_URL` is not set, causing API calls to fail

**Solution**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `VITE_API_URL` = `https://your-backend-url.railway.app`
3. Redeploy

**Note**: The app should still render even without this, but API calls will fail.

### 2. **JavaScript Errors**

**Check**:
1. Open your deployed site
2. Press F12 to open browser console
3. Look for red error messages
4. Share the error message

### 3. **React Router Not Configured**

**Problem**: Vercel doesn't know how to handle client-side routing

**Solution**: I've added `vercel.json` with rewrites. Make sure it's in `interviewflow-frontend/vercel.json`

### 4. **Assets Not Loading**

**Check**:
- Open browser DevTools → Network tab
- Reload the page
- Look for failed requests (red)
- Check if CSS/JS files are loading

### 5. **AuthContext Blocking Render**

**Problem**: `isLoading` stuck at `true`

**Solution**: I've added a 5-second timeout to prevent infinite loading

## Quick Diagnostic Steps

### Step 1: Check Browser Console (CRITICAL)
1. Open your deployed site
2. Press **F12** (or Right-click → Inspect)
3. Go to **Console** tab
4. Look for:
   - ✅ `🚀 App starting...` - React is loading
   - ✅ `✅ React app rendered` - React mounted successfully
   - ❌ Any red error messages - These are the problem!
   - ⚠️ Yellow warnings - Usually not critical

**What to look for:**
- `Uncaught ReferenceError` - Missing import/component
- `Failed to fetch` - API connection issue
- `Cannot read property` - Null/undefined error
- `Module not found` - Import path issue

### Step 2: Check Network Tab
1. In DevTools, go to **Network** tab
2. Reload the page (Ctrl+R or Cmd+R)
3. Look for:
   - **Red requests** (failed) - These are problems
   - **main.jsx** or **index.js** - Should be status 200
   - **CSS files** - Should be status 200
   - **API calls** - Check if they're failing

### Step 3: Verify Environment Variables
1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Check if `VITE_API_URL` is set
3. Value should be: `https://interviewflow-ai-production.up.railway.app` (your Railway public URL)
4. **IMPORTANT**: After adding/changing env vars, click **Redeploy** or trigger a new deployment

### Step 4: Test Simple Page
1. Visit: `https://your-vercel-url.vercel.app/test.html`
2. If you see "If you see this, the server is working" → Server is fine, React issue
3. If you see 404 → Deployment issue

### Step 5: Check Vercel Build Logs
1. Go to **Vercel Dashboard** → **Deployments**
2. Click on the latest deployment
3. Check **Build Logs**:
   - Should end with "Build completed"
   - Look for any errors or warnings

## Most Likely Issue

Based on the blank screen, the most common causes are:

1. **JavaScript Error** - Check browser console
2. **Missing VITE_API_URL** - API calls failing (but shouldn't block render)
3. **AuthContext stuck loading** - Fixed with timeout
4. **React Router issue** - Fixed with vercel.json rewrites

## What I've Fixed

1. ✅ Added ErrorBoundary to catch React errors
2. ✅ Added timeout to AuthContext to prevent infinite loading
3. ✅ Added vercel.json for SPA routing
4. ✅ Improved error handling in AuthContext

## Next Steps

1. **Check Browser Console** - Share any errors you see
2. **Verify Environment Variables** - Set `VITE_API_URL` in Vercel
3. **Test Locally** - Run `npm run build && npm run preview` to test production build

## If Still Blank

Please share:
1. Browser console errors (F12 → Console tab)
2. Network tab - any failed requests?
3. Vercel deployment URL
4. Screenshot of the blank screen
