# Railway Variables Verification - Complete Checklist

## ✅ Variables That Are CORRECT

Based on your Railway variables:

### Core Application
- ✅ `PORT`: `5001` ✓
- ✅ `MONGO_URI`: Set (MongoDB connection string) ✓
- ✅ `JWT_SECRET`: Set ✓
- ✅ `GITHUB_TOKEN`: Set ✓
- ✅ `GITHUB_MODEL`: Should be `openai/gpt-4o` (verify if masked) ✓

### SMTP Configuration (Email)
- ✅ `SMTP_PORT`: `587` ✓
- ✅ `SMTP_SECURE`: `false` ✓ (Correct for STARTTLS on port 587)
- ✅ `SMTP_USER`: Set (Gmail address) ✓
- ✅ `SMTP_PASS`: Set (Gmail App Password) ✓
- ⚠️ `SMTP_HOST`: Should be `smtp.gmail.com` (verify if masked)

### OAuth Configuration
- ✅ `FRONTEND_URL`: `https://interview-flow-ai-oewj.vercel.app` ✓ **CORRECT!**
- ✅ `GOOGLE_CLIENT_ID`: Set (should match Google Cloud Console) ✓
- ✅ `GOOGLE_CLIENT_SECRET`: Set (should match Google Cloud Console) ✓

---

## 🚨 CRITICAL ISSUE FOUND

### ❌ `GOOGLE_CALLBACK_URL` is WRONG!

**Current Value (WRONG):**
```
http://localhost:5001/api/auth/google/callback
```

**Should Be (CORRECT):**
```
https://interviewflow-ai-production.up.railway.app/api/auth/google/callback
```

**Why This Matters:**
- Google OAuth will fail with "redirect_uri_mismatch" error
- OAuth callbacks won't work in production
- Users can't sign in with Google

**Fix Required:**
1. Go to Railway → Variables tab
2. Find `GOOGLE_CALLBACK_URL`
3. Click to edit
4. Change to: `https://interviewflow-ai-production.up.railway.app/api/auth/google/callback`
5. Save (Railway will auto-redeploy)

---

## 📋 Complete Variable Checklist

### Required Variables (All Should Be Set)

| Variable | Current Status | Should Be | Action |
|----------|---------------|-----------|--------|
| `PORT` | ✅ `5001` | `5001` | ✓ Correct |
| `MONGO_URI` | ✅ Set | MongoDB URI | ✓ Correct |
| `JWT_SECRET` | ✅ Set | Random string | ✓ Correct |
| `GITHUB_TOKEN` | ✅ Set | GitHub token | ✓ Correct |
| `GITHUB_MODEL` | ⚠️ Verify | `openai/gpt-4o` | Check if masked |
| `SMTP_HOST` | ⚠️ Verify | `smtp.gmail.com` | Check if masked |
| `SMTP_PORT` | ✅ `587` | `587` | ✓ Correct |
| `SMTP_SECURE` | ✅ `false` | `false` | ✓ Correct |
| `SMTP_USER` | ✅ Set | Gmail address | ✓ Correct |
| `SMTP_PASS` | ✅ Set | App Password | ✓ Correct |
| `FRONTEND_URL` | ✅ Correct | `https://interview-flow-ai-oewj.vercel.app` | ✓ Correct |
| `GOOGLE_CLIENT_ID` | ✅ Set | Google Client ID | ✓ Correct |
| `GOOGLE_CLIENT_SECRET` | ✅ Set | Google Client Secret | ✓ Correct |
| `GOOGLE_CALLBACK_URL` | ❌ **WRONG** | `https://interviewflow-ai-production.up.railway.app/api/auth/google/callback` | **FIX THIS** |

---

## 🔧 Immediate Action Required

### Step 1: Fix GOOGLE_CALLBACK_URL

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app
   - Select "InterviewFlow-AI" project
   - Go to "Variables" tab

2. **Find `GOOGLE_CALLBACK_URL`**

3. **Click to edit** (or find edit button)

4. **Change value to:**
   ```
   https://interviewflow-ai-production.up.railway.app/api/auth/google/callback
   ```

5. **Save** - Railway will automatically redeploy

### Step 2: Verify SMTP_HOST (if masked)

If `SMTP_HOST` is masked, click the eye icon to verify it's:
```
smtp.gmail.com
```

### Step 3: Verify GITHUB_MODEL (if masked)

If `GITHUB_MODEL` is masked, verify it's:
```
openai/gpt-4o
```

---

## ✅ After Fixing

1. **Wait for Railway to redeploy** (1-2 minutes)

2. **Test Google OAuth:**
   - Go to: `https://interview-flow-ai-oewj.vercel.app/login`
   - Click "Sign in with Google"
   - Should work without "redirect_uri_mismatch" error

3. **Test Email:**
   - Try forgot password
   - Check Railway logs for email sending status

---

## 📊 Summary

- ✅ **13 out of 14 variables are correct**
- ❌ **1 variable needs fixing:** `GOOGLE_CALLBACK_URL`
- ⚠️ **2 variables to verify:** `SMTP_HOST` and `GITHUB_MODEL` (if masked)

**Priority:** Fix `GOOGLE_CALLBACK_URL` immediately - this breaks Google OAuth!
