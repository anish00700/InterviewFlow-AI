# OAuth Setup Guide (Google)

This guide will help you set up OAuth authentication for Google sign-in.

## Prerequisites

1. Install OAuth packages:
   ```bash
   cd interviewflow-backend
   npm install passport passport-google-oauth20
   ```

2. Restart your server after installation

---

## Google OAuth Setup

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable Google+ API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: "InterviewFlow AI"
   - Authorized JavaScript origins:
     - `http://localhost:5001` (for development)
     - Your production backend URL (for production)
   - Authorized redirect URIs:
     - `http://localhost:5001/api/auth/google/callback` (for development)
     - `https://your-domain.com/api/auth/google/callback` (for production)
5. Copy the **Client ID** and **Client Secret**

### Step 2: Update .env File

Add to your `interviewflow-backend/.env`:

```env
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

### Step 3: Restart Server

```bash
npm run dev
```

---

## Complete .env Example

```env
PORT=5001
MONGO_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
GITHUB_TOKEN=your-github-models-token
GITHUB_MODEL=openai/gpt-4o

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# OAuth Configuration
FRONTEND_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
```

---

## Testing OAuth

1. **Start your backend server:**
   ```bash
   cd interviewflow-backend
   npm run dev
   ```

2. **Start your frontend:**
   ```bash
   cd interviewflow-frontend
   npm run dev
   ```

3. **Test the flow:**
   - Go to `/register` or `/login`
   - Click "Sign up with Google" or "Sign in with Google" button
   - You'll be redirected to Google for authorization
   - After authorization, you'll be redirected back
   - Account will be created automatically (if new) or logged in (if existing)

---

## How It Works

1. User clicks "Sign up with Google" or "Sign in with Google" button
2. Frontend redirects to `/api/auth/google`
3. Backend redirects to Google OAuth provider
4. User authorizes the application
5. Google redirects back to `/api/auth/google/callback`
6. Backend creates/updates user and generates JWT token
7. Backend redirects to frontend `/auth/callback?token=...`
8. Frontend stores token and redirects to `/setup`

---

## Troubleshooting

### Error: "OAuth strategy not configured"
- Make sure you've set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
- Restart the server after updating `.env`

### Error: "redirect_uri_mismatch"
- Check that the callback URL in `.env` matches exactly what you configured in Google OAuth settings
- Make sure there are no trailing slashes or typos

### Error: "Invalid credentials"
- Double-check your Client ID and Client Secret
- Make sure there are no extra spaces in `.env` file

### User not being created
- Check MongoDB connection
- Check server logs for errors
- Verify email is being extracted correctly from OAuth profile

---

## Production Deployment

When deploying to production:

1. **Update Google Cloud Console:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Edit your OAuth 2.0 Client
   - **Authorized JavaScript origins:** Add `https://your-backend-domain.com`
   - **Authorized redirect URIs:** Add `https://your-backend-domain.com/api/auth/google/callback`
   - Click "Save"

2. **Update Railway Environment Variables:**
   ```env
   FRONTEND_URL=https://your-frontend-domain.com
   GOOGLE_CALLBACK_URL=https://your-backend-domain.com/api/auth/google/callback
   ```

3. **For your current deployment:**
   - Frontend: `https://interview-flow-ai-oewj.vercel.app`
   - Backend: `https://interviewflow-ai-production.up.railway.app`
   - Callback: `https://interviewflow-ai-production.up.railway.app/api/auth/google/callback`

4. **Important:** The redirect URI in Google Cloud Console must match **exactly** (including `https://`, no trailing slashes)

5. Make sure your backend is accessible from the internet (for OAuth callbacks)

---

## Security Notes

- Never commit `.env` file to git
- Keep OAuth secrets secure
- Use HTTPS in production
- Regularly rotate OAuth credentials
- Monitor OAuth usage in provider dashboards
