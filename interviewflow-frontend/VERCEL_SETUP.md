# Vercel Deployment Setup Guide

## ✅ Pre-Deployment Checklist

Before deploying to Vercel, ensure:

1. **Root Directory is Set Correctly**
   - In Vercel Dashboard → Project Settings → General
   - Set **Root Directory** to: `interviewflow-frontend`
   - This is CRITICAL - Vercel needs to know where your frontend code is

2. **Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-backend-url.railway.app`
   - Replace with your actual backend URL

3. **Build Configuration**
   - Vercel should auto-detect Vite
   - If not, verify:
     - Framework: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Install Command: `npm install`

## 🚀 Deployment Steps

### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. **IMPORTANT**: Set Root Directory to `interviewflow-frontend`

### Step 2: Configure Build Settings

Vercel should auto-detect, but verify:

- **Framework Preset**: Vite
- **Root Directory**: `interviewflow-frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Add Environment Variables

In Project Settings → Environment Variables, add:

```
VITE_API_URL=https://your-backend-url.railway.app
```

**Important**: 
- Variable name MUST start with `VITE_` for Vite to expose it
- Replace `your-backend-url.railway.app` with your actual Railway backend URL

### Step 4: Deploy

Click "Deploy" and wait for the build to complete.

## 🔍 Common Issues & Solutions

### Issue 1: "Cannot find module" or Import Errors

**Solution**: 
- Check that Root Directory is set to `interviewflow-frontend`
- Verify all imports use correct paths
- Check browser console for specific module errors

### Issue 2: Build Succeeds but App Shows Blank Page

**Possible causes**:
- Missing environment variable `VITE_API_URL`
- API calls failing (check Network tab)
- CORS issues (verify backend `FRONTEND_URL`)

**Solution**:
- Add `VITE_API_URL` environment variable
- Check browser console for errors
- Verify backend is running and accessible

### Issue 3: "Root Directory not found"

**Solution**:
- Ensure you're deploying from the repository root
- Set Root Directory to `interviewflow-frontend` (not `./interviewflow-frontend`)

### Issue 4: Build Timeout

**Solution**:
- Check for large files in repository
- Remove unnecessary dependencies
- Optimize build process

## 📝 Verification

After deployment:

1. **Check Build Logs**:
   - Go to Deployments → Click on deployment
   - Scroll to bottom to see build output
   - Look for any errors (usually in red)

2. **Test the App**:
   - Visit your Vercel URL
   - Open browser console (F12)
   - Check for any errors
   - Test API calls in Network tab

3. **Verify Environment Variables**:
   - Check that `VITE_API_URL` is set
   - Test API connectivity

## 🐛 If Build Still Fails

1. **Share the complete error message** from the bottom of the Vercel build log
2. **Check**:
   - Root Directory is set correctly
   - All files are committed to git
   - No syntax errors in code

3. **Test locally first**:
   ```bash
   cd interviewflow-frontend
   npm run build
   ```
   If this fails, fix the error before deploying.

## 📞 Need Help?

If you're still getting errors, please share:
1. The complete error message from Vercel build log
2. Screenshot of your Vercel project settings (Root Directory)
3. Your environment variables (hide sensitive values)
