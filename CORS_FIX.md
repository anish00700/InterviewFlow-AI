# CORS Fix for Vercel Deployment

## Problem
The backend CORS is configured to only allow `http://localhost:5173`, but your frontend is deployed at `https://interview-flow-ai-oewj.vercel.app`.

## Solution

### 1. Update Railway Environment Variables

Go to your **Railway Dashboard** → Your Project → **Variables** tab and set:

```
FRONTEND_URL=https://interview-flow-ai-oewj.vercel.app
```

**Important**: After setting this, Railway will automatically redeploy your backend.

### 2. Verify CORS Configuration

The backend code has been updated to allow multiple origins:
- `http://localhost:5173` (local development)
- `https://interview-flow-ai-oewj.vercel.app` (your Vercel deployment)
- Any URL set in `FRONTEND_URL` environment variable

### 3. Double Slash Fix

The code now automatically removes trailing slashes from `VITE_API_URL` to prevent URLs like `https://backend.com//api/auth/login`.

## Testing

After Railway redeploys:

1. Go to your Vercel frontend: `https://interview-flow-ai-oewj.vercel.app`
2. Try to log in
3. Check browser console - CORS errors should be gone

## If Still Having Issues

1. **Check Railway Logs**: Make sure the backend restarted after setting `FRONTEND_URL`
2. **Verify Environment Variable**: In Railway, check that `FRONTEND_URL` is exactly: `https://interview-flow-ai-oewj.vercel.app` (no trailing slash)
3. **Check Browser Console**: Look for any remaining CORS errors

## Additional Notes

- The backend now accepts requests from multiple origins for flexibility
- In production, you can restrict this to only your Vercel URL by setting `NODE_ENV=production` in Railway
- The CORS configuration allows credentials (cookies, auth headers) which is needed for authentication
