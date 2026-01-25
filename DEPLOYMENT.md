# Deployment Guide - InterViewFlow AI

This guide covers deploying InterViewFlow AI to production using Vercel (frontend) and Railway (backend).

## 🎯 Recommended Architecture

- **Frontend**: Vercel (React + Vite)
- **Backend**: Railway (Node.js + Express)
- **Database**: MongoDB Atlas
- **Email**: Gmail SMTP

---

## 📦 Step 1: Deploy Backend to Railway

### 1.1 Sign Up for Railway

1. Go to [railway.app](https://railway.app)
2. Sign up with your GitHub account
3. Click "New Project"

### 1.2 Deploy Backend

1. **Select "Deploy from GitHub repo"**
2. Choose your `InterViewFlow` repository
3. **Important**: Set the **Root Directory** to `interviewflow-backend`
4. Railway will auto-detect Node.js

### 1.3 Configure Environment Variables

Go to your Railway project → **Variables** tab and add:

```env
PORT=5001
MONGO_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
GITHUB_TOKEN=your-github-token-with-models-read-permission
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

**Note**: You'll get your Railway app URL after first deployment. Update `GOOGLE_CALLBACK_URL` and `FRONTEND_URL` accordingly.

### 1.4 Deploy

- Railway will automatically deploy
- Wait for deployment to complete
- Copy your Railway app URL (e.g., `https://your-app.railway.app`)

---

## 🚀 Step 2: Deploy Frontend to Vercel

### 2.1 Sign Up for Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub

### 2.2 Deploy Frontend

1. Click **"Add New Project"**
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `interviewflow-frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 2.3 Add Environment Variables

Go to **Settings** → **Environment Variables** and add:

```env
VITE_API_URL=https://your-railway-app.railway.app
```

**Important**: Replace `your-railway-app.railway.app` with your actual Railway backend URL.

### 2.4 Deploy

- Click **"Deploy"**
- Wait for build to complete
- Your app will be live at `https://your-app.vercel.app`

### 2.5 Update Backend CORS

1. Go back to Railway
2. Update `FRONTEND_URL` variable to your Vercel URL
3. Railway will automatically redeploy

---

## 🔧 Step 3: Update OAuth Configuration

### 3.1 Update Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Update **Authorized redirect URIs**:
   - Add: `https://your-railway-app.railway.app/api/auth/google/callback`
4. Save changes

### 3.2 Update Railway Environment

Update `GOOGLE_CALLBACK_URL` in Railway to match:
```
GOOGLE_CALLBACK_URL=https://your-railway-app.railway.app/api/auth/google/callback
```

---

## ✅ Post-Deployment Checklist

- [ ] Backend is accessible (test Railway backend URL)
- [ ] Frontend environment variable `VITE_API_URL` is set correctly
- [ ] Backend `FRONTEND_URL` matches your Vercel URL
- [ ] Google OAuth callback URL updated in Google Cloud Console
- [ ] MongoDB connection is working
- [ ] Email service is configured
- [ ] Test user registration
- [ ] Test login
- [ ] Test Google OAuth
- [ ] Test interview flow
- [ ] Test PDF export

---

## 🔍 Testing Your Deployment

### Test Backend

```bash
curl https://your-railway-app.railway.app/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### Test Frontend

1. Visit your Vercel URL
2. Try registering a new account
3. Test the interview flow
4. Check browser console for any errors

---

## 🐛 Troubleshooting

### CORS Errors

**Problem**: Frontend can't connect to backend

**Solution**:
- Verify `VITE_API_URL` in Vercel matches your Railway URL exactly
- Check `FRONTEND_URL` in Railway matches your Vercel URL
- Ensure no trailing slashes in URLs

### API Not Found (404)

**Problem**: API calls return 404

**Solution**:
- Verify `VITE_API_URL` is set in Vercel
- Check Railway backend is running
- Test backend URL directly: `https://your-railway-app.railway.app/api/health`

### OAuth Redirect Issues

**Problem**: Google OAuth redirect fails

**Solution**:
- Verify callback URL in Google Cloud Console matches Railway URL exactly
- Check `GOOGLE_CALLBACK_URL` in Railway environment variables
- Ensure callback URL has no trailing slash

### Environment Variables Not Working

**Problem**: Frontend can't read `VITE_API_URL`

**Solution**:
- Vite requires `VITE_` prefix for environment variables
- Redeploy after adding environment variables
- Check Vercel build logs for errors

---

## 📝 Environment Variables Reference

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://your-app.railway.app` |

### Backend (Railway)

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | Yes |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `GITHUB_TOKEN` | GitHub Models API token | Yes |
| `GITHUB_MODEL` | Model name | Yes |
| `SMTP_HOST` | Email SMTP host | Yes |
| `SMTP_PORT` | Email SMTP port | Yes |
| `SMTP_USER` | Email username | Yes |
| `SMTP_PASS` | Email password (App Password) | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Optional |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Optional |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URL | Optional |

---

## 🔄 Continuous Deployment

Both Vercel and Railway support automatic deployments:

- **Vercel**: Automatically deploys on push to main branch
- **Railway**: Automatically deploys on push to main branch (if connected)

To enable:
1. Connect your GitHub repository
2. Push changes to main branch
3. Both platforms will auto-deploy

---

## 💰 Pricing

### Vercel (Frontend)
- **Free Tier**: Unlimited deployments, 100GB bandwidth
- Perfect for this project

### Railway (Backend)
- **Free Tier**: $5 credit monthly
- **Hobby Plan**: $5/month for 500 hours
- Sufficient for small to medium traffic

### MongoDB Atlas
- **Free Tier**: 512MB storage
- Perfect for development and small projects

---

## 🔐 Security Notes

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use strong JWT_SECRET** - At least 32 characters
3. **Use Gmail App Passwords** - Not regular passwords
4. **Keep API keys secure** - Only add to platform environment variables
5. **Enable HTTPS** - Both Vercel and Railway provide SSL automatically

---

## 📞 Support

If you encounter issues:

1. Check Railway deployment logs
2. Check Vercel build logs
3. Check browser console for errors
4. Verify all environment variables are set
5. Test backend URL directly

---

## 🎉 You're Done!

Your InterViewFlow AI application should now be live! 🚀

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.railway.app`
