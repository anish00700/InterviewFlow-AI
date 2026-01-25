# Fix Google OAuth Redirect URI Mismatch (Production)

## Problem
You're getting: `Error 400: redirect_uri_mismatch`

This happens because Google Cloud Console doesn't have your production callback URL configured.

## Solution

### Step 1: Update Google Cloud Console

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/apis/credentials
   - Make sure you're in the correct project

2. **Find your OAuth 2.0 Client:**
   - Look for the client with ID: `825835127905-e91eav3k8p0o7bhsgju27pc7dr15s817.apps.googleusercontent.com`
   - Click on it to edit

3. **Add Production URLs:**

   **Authorized JavaScript origins:**
   - `https://interviewflow-ai-production.up.railway.app`
   - `http://localhost:5001` (keep for local dev)

   **Authorized redirect URIs:**
   - `https://interviewflow-ai-production.up.railway.app/api/auth/google/callback`
   - `http://localhost:5001/api/auth/google/callback` (keep for local dev)

4. **Click "Save"**

### Step 2: Update Railway Environment Variables

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app
   - Select your backend project

2. **Go to Variables tab**

3. **Update/Add these variables:**
   ```
   GOOGLE_CALLBACK_URL=https://interviewflow-ai-production.up.railway.app/api/auth/google/callback
   FRONTEND_URL=https://interview-flow-ai-oewj.vercel.app
   ```

4. **Railway will automatically redeploy** after you save

### Step 3: Verify Configuration

After Railway redeploys:

1. **Check Railway logs** to ensure the server started correctly
2. **Test Google OAuth** from your Vercel frontend
3. **The redirect should work** without the mismatch error

## Important Notes

- ⚠️ **Exact Match Required**: The redirect URI in Google Cloud Console must match **exactly** what's in `GOOGLE_CALLBACK_URL` (including `https://`, no trailing slashes)
- ⚠️ **Wait for Changes**: Google Cloud Console changes can take a few minutes to propagate
- ⚠️ **Railway Redeploy**: After updating environment variables, wait for Railway to finish redeploying

## Current URLs

- **Frontend (Vercel):** `https://interview-flow-ai-oewj.vercel.app`
- **Backend (Railway):** `https://interviewflow-ai-production.up.railway.app`
- **Callback URL:** `https://interviewflow-ai-production.up.railway.app/api/auth/google/callback`

## Testing

1. Go to: `https://interview-flow-ai-oewj.vercel.app/login`
2. Click "Sign in with Google"
3. You should be redirected to Google (no error)
4. After authorization, you'll be redirected back and logged in

## If Still Not Working

1. **Double-check Google Cloud Console:**
   - Make sure the redirect URI is exactly: `https://interviewflow-ai-production.up.railway.app/api/auth/google/callback`
   - No trailing slash, no typos

2. **Check Railway Environment Variables:**
   - Verify `GOOGLE_CALLBACK_URL` is set correctly
   - Verify `FRONTEND_URL` is set correctly

3. **Check Railway Logs:**
   - Look for any errors during startup
   - Verify the server is running

4. **Wait a few minutes:**
   - Google Cloud Console changes can take time to propagate
   - Railway redeploy takes 1-2 minutes
