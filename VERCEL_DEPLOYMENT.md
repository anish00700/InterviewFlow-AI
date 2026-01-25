# Vercel Deployment Guide

This guide will help you deploy InterViewFlow AI to Vercel.

## 📋 Overview

InterViewFlow AI consists of two parts:
1. **Frontend** (React + Vite) - Deploy to Vercel
2. **Backend** (Node.js + Express) - Deploy to Railway/Render (recommended) or Vercel Serverless

## 🚀 Deployment Options

### Option 1: Frontend on Vercel + Backend on Railway (Recommended)

This is the recommended approach as it's simpler and more reliable for Express.js backends.

### Option 2: Both on Vercel

Both frontend and backend can be deployed to Vercel, but requires converting Express routes to serverless functions.

---

## 📦 Option 1: Frontend on Vercel + Backend on Railway

### Step 1: Deploy Backend to Railway

1. **Sign up for Railway**:
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your `InterViewFlow` repository
   - Select the `interviewflow-backend` folder

3. **Configure Environment Variables**:
   - Go to your project → Variables tab
   - Add all variables from your `.env` file:
     ```
     PORT=5001
     MONGO_URI=your-mongodb-uri
     JWT_SECRET=your-jwt-secret
     GITHUB_TOKEN=your-github-token
     GITHUB_MODEL=openai/gpt-4o
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_SECURE=false
     SMTP_USER=your-email@gmail.com
     SMTP_PASS=your-gmail-app-password
     FRONTEND_URL=https://your-vercel-app.vercel.app
     GOOGLE_CLIENT_ID=your-google-client-id
     GOOGLE_CLIENT_SECRET=your-google-client-secret
     GOOGLE_CALLBACK_URL=https://your-railway-app.railway.app/api/auth/google/callback
     ```

4. **Deploy**:
   - Railway will automatically detect Node.js and deploy
   - Note your Railway app URL (e.g., `https://your-app.railway.app`)

5. **Update OAuth Callback URLs**:
   - Update Google OAuth callback URL in Google Cloud Console to your Railway URL

### Step 2: Deploy Frontend to Vercel

1. **Install Vercel CLI** (optional, can use web interface):
   ```bash
   npm i -g vercel
   ```

2. **Deploy via Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure:
     - **Root Directory**: `interviewflow-frontend`
     - **Framework Preset**: Vite
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

3. **Add Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add:
     ```
     VITE_API_URL=https://your-railway-app.railway.app
     ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be live at `https://your-app.vercel.app`

5. **Update Backend CORS**:
   - Update `FRONTEND_URL` in Railway to your Vercel URL
   - Restart the Railway service

---

## 📦 Option 2: Both on Vercel

### Deploy Backend to Vercel

1. **Create `api/index.js` in backend**:
   ```javascript
   const app = require('../src/app');
   module.exports = app;
   ```

2. **Update `vercel.json`**:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "api/index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "api/index.js"
       }
     ]
   }
   ```

3. **Deploy Backend**:
   - Create a new Vercel project for backend
   - Root Directory: `interviewflow-backend`
   - Add all environment variables
   - Deploy

4. **Deploy Frontend**:
   - Follow Step 2 from Option 1
   - Set `VITE_API_URL` to your backend Vercel URL

---

## 🔧 Configuration

### Environment Variables for Frontend (Vercel)

```
VITE_API_URL=https://your-backend-url.railway.app
```

### Environment Variables for Backend (Railway/Vercel)

```
PORT=5001
MONGO_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
GITHUB_TOKEN=your-github-token
GITHUB_MODEL=openai/gpt-4o
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
FRONTEND_URL=https://your-vercel-app.vercel.app
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-backend-url/api/auth/google/callback
```

---

## 🔄 Post-Deployment Checklist

- [ ] Backend is running and accessible
- [ ] Frontend environment variable `VITE_API_URL` is set
- [ ] Backend `FRONTEND_URL` matches your Vercel URL
- [ ] Google OAuth callback URL updated in Google Cloud Console
- [ ] MongoDB connection is working
- [ ] Email service is configured
- [ ] Test authentication flow
- [ ] Test interview flow
- [ ] Test PDF export

---

## 🐛 Troubleshooting

### CORS Errors

If you see CORS errors:
- Check that `FRONTEND_URL` in backend matches your Vercel URL exactly
- Ensure CORS is configured in `src/app.js`

### API Not Found

- Verify `VITE_API_URL` is set correctly in Vercel
- Check that backend is deployed and running
- Test backend URL directly in browser

### OAuth Callback Issues

- Update Google OAuth callback URL to your backend URL
- Ensure callback URL matches exactly (no trailing slash)

---

## 📝 Notes

- **Railway** offers a free tier with $5 credit monthly
- **Vercel** offers a free tier for frontend hosting
- Both platforms auto-deploy on git push (if connected to GitHub)
- Environment variables are encrypted and secure

---

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
