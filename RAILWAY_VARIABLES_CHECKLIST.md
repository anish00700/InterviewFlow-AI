# Railway Environment Variables Checklist

## ✅ SMTP Configuration (Email) - CORRECT

Based on your Railway variables, these are **correctly configured**:

- ✅ `SMTP_HOST`: `smtp.gmail.com` ✓
- ✅ `SMTP_PORT`: `587` ✓
- ✅ `SMTP_SECURE`: `false` ✓ (Correct for STARTTLS on port 587)
- ✅ `SMTP_USER`: Set (Gmail address) ✓
- ✅ `SMTP_PASS`: Set (Gmail App Password) ✓

**Note:** The SMTP configuration is correct. The connection timeout issue is likely due to Railway's network restrictions, not incorrect variables.

---

## ⚠️ Required Variables to Verify

These variables are masked in your screenshot, but they need to be set correctly:

### 1. `FRONTEND_URL` (Critical for OAuth & Email Links)
**Should be:**
```
https://interview-flow-ai-oewj.vercel.app
```

**Why it matters:**
- Used for OAuth redirects
- Used in password reset email links
- Used in email update OTP emails

**To check:**
- Click the eye icon next to `FRONTEND_URL` in Railway
- Verify it's exactly: `https://interview-flow-ai-oewj.vercel.app`
- No trailing slash!

### 2. `GOOGLE_CALLBACK_URL` (Critical for OAuth)
**Should be:**
```
https://interviewflow-ai-production.up.railway.app/api/auth/google/callback
```

**Why it matters:**
- Must match exactly what's in Google Cloud Console
- Used for OAuth redirects after Google authentication

**To check:**
- Click the eye icon next to `GOOGLE_CALLBACK_URL` in Railway
- Verify it's exactly: `https://interviewflow-ai-production.up.railway.app/api/auth/google/callback`
- No trailing slash!

### 3. Other Variables (Should be set)
- `PORT`: Should be set (Railway usually auto-sets this)
- `MONGO_URI`: Should be your MongoDB connection string
- `JWT_SECRET`: Should be a secure random string
- `GITHUB_TOKEN`: Should be your GitHub token for AI models
- `GITHUB_MODEL`: Should be `openai/gpt-4o` or similar
- `GOOGLE_CLIENT_ID`: Should match Google Cloud Console
- `GOOGLE_CLIENT_SECRET`: Should match Google Cloud Console

---

## 🔍 How to Verify

### Step 1: Check FRONTEND_URL
1. In Railway → Variables tab
2. Find `FRONTEND_URL`
3. Click the eye icon to reveal
4. Should be: `https://interview-flow-ai-oewj.vercel.app`

### Step 2: Check GOOGLE_CALLBACK_URL
1. In Railway → Variables tab
2. Find `GOOGLE_CALLBACK_URL`
3. Click the eye icon to reveal
4. Should be: `https://interviewflow-ai-production.up.railway.app/api/auth/google/callback`

### Step 3: Test Email Configuration
Visit: `https://interviewflow-ai-production.up.railway.app/api/diagnostics`

Check the `emailService` section:
- `transporterConfigured: true` - Email service is set up
- `test.status: "working"` - Email service is working
- If `not_configured` or `error`, check the message

---

## 🚨 Connection Timeout Issue

**The SMTP variables are correct**, but you're getting connection timeouts. This suggests:

1. **Railway Network Restrictions:**
   - Railway may be blocking outbound SMTP connections
   - Port 587 might be restricted
   - Firewall rules may prevent SMTP access

2. **Possible Solutions:**
   - ✅ **Already implemented:** Increased timeouts and retry logic
   - 🔄 **Try again:** The retry logic should help
   - 🔄 **Alternative:** Consider using SendGrid or Mailgun (better cloud compatibility)

---

## ✅ Quick Verification Checklist

- [ ] `SMTP_HOST` = `smtp.gmail.com ✓
- [ ] `SMTP_PORT` = `587` ✓
- [ ] `SMTP_SECURE` = `false` ✓
- [ ] `SMTP_USER` = Your Gmail address ✓
- [ ] `SMTP_PASS` = App Password (16 chars, no spaces) ✓
- [ ] `FRONTEND_URL` = `https://interview-flow-ai-oewj.vercel.app` (verify)
- [ ] `GOOGLE_CALLBACK_URL` = `https://interviewflow-ai-production.up.railway.app/api/auth/google/callback` (verify)

---

## 📝 Next Steps

1. **Verify masked variables:**
   - Check `FRONTEND_URL` and `GOOGLE_CALLBACK_URL` are set correctly
   - Use the eye icon to reveal and verify

2. **Test after recent fixes:**
   - The code now has retry logic for connection timeouts
   - Try sending an email again
   - Check Railway logs for retry attempts

3. **If still timing out:**
   - Consider switching to SendGrid or Mailgun
   - These services work better with cloud providers
   - See `EMAIL_CONNECTION_TIMEOUT_FIX.md` for details

---

## Summary

✅ **SMTP variables are CORRECT** - The configuration is proper for Gmail
⚠️ **Verify masked variables** - Check `FRONTEND_URL` and `GOOGLE_CALLBACK_URL`
🔄 **Connection timeout** - Likely Railway network restrictions, retry logic should help
