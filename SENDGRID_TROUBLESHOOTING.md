# SendGrid Email Not Working - Troubleshooting

## Problem
Emails are not being sent even though SendGrid is configured.

## Quick Checks

### 1. Verify Railway Variables

Make sure these are set in Railway (exactly as shown):

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.your-actual-api-key-here
```

**Important:**
- `SMTP_USER` must be the literal string `apikey` (not your email)
- `SMTP_PASS` must be your SendGrid API key (starts with `SG.`)

### 2. Check Railway Logs

After requesting an OTP or password reset, look for:

**Good signs:**
- `📧 Attempting to send OTP email to...`
- `📧 sendOTP called for...`
- `✓ Email sent successfully! Message ID: ...`

**Bad signs:**
- `❌ Email transporter not initialized!`
- `✗ Registration OTP email sending failed (async):`
- `⚠ Email transporter verification failed:`

### 3. Verify SendGrid API Key

1. **Go to SendGrid Dashboard:**
   - Visit: https://app.sendgrid.com
   - Sign in

2. **Check API Keys:**
   - Go to Settings → API Keys
   - Verify your API key exists
   - Make sure it has "Mail Send" permissions

3. **Test API Key:**
   - The API key should start with `SG.`
   - Should be 69 characters long
   - Copy it exactly (no spaces)

### 4. Check SendGrid Activity

1. **Go to SendGrid Dashboard:**
   - Visit: https://app.sendgrid.com
   - Go to "Activity" tab

2. **Look for:**
   - Email sending attempts
   - Bounce/delivery status
   - Any error messages

### 5. Verify Sender Email

SendGrid requires a verified sender email:

1. **Go to SendGrid:**
   - Settings → Sender Authentication
   - Verify your sender email or domain

2. **For testing:**
   - You can use a single sender verification
   - Or verify your entire domain

---

## Common Issues

### Issue 1: "Email transporter not initialized"
**Cause:** `SMTP_USER` or `SMTP_PASS` not set in Railway
**Fix:** Set both variables in Railway and redeploy

### Issue 2: "Email transporter verification failed"
**Cause:** Wrong SendGrid credentials
**Fix:** 
- Verify `SMTP_USER=apikey` (literal string)
- Verify `SMTP_PASS` is your actual SendGrid API key
- Make sure API key has "Mail Send" permissions

### Issue 3: "Invalid API key" or "Authentication failed"
**Cause:** Wrong API key or expired key
**Fix:**
- Generate a new API key in SendGrid
- Update `SMTP_PASS` in Railway
- Redeploy

### Issue 4: Emails sent but not received
**Cause:** 
- Email in spam folder
- Sender not verified in SendGrid
- Email address typo

**Fix:**
- Check spam folder
- Verify sender email in SendGrid
- Check Railway logs for the email address used

---

## Debugging Steps

### Step 1: Check Railway Logs

Look for these messages in order:

1. `✓ Email service configured: smtp.sendgrid.net:587` - Service initialized
2. `✓ Email transporter verified - ready to send emails` - Connection test passed
3. `📧 Attempting to send OTP email to...` - Email function called
4. `📧 sendOTP called for...` - Email service method called
5. `📧 Attempt 1/3: Sending email to...` - Sending attempt
6. `✓ Email sent successfully! Message ID: ...` - Success!

If any step is missing, that's where the problem is.

### Step 2: Test SendGrid API Key

You can test your SendGrid API key manually:

```bash
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [{"to": [{"email": "your-email@example.com"}]}],
    "from": {"email": "noreply@yourdomain.com"},
    "subject": "Test",
    "content": [{"type": "text/plain", "value": "Test"}]
  }'
```

Replace `YOUR_API_KEY` with your actual SendGrid API key.

### Step 3: Check SendGrid Dashboard

1. Go to: https://app.sendgrid.com
2. Check "Activity" tab for email attempts
3. Check "Settings → API Keys" for key status
4. Check "Settings → Sender Authentication" for verified senders

---

## Quick Fixes

1. **Regenerate SendGrid API Key:**
   - SendGrid Dashboard → Settings → API Keys
   - Delete old key
   - Create new key with "Mail Send" permissions
   - Update `SMTP_PASS` in Railway

2. **Verify Sender Email:**
   - SendGrid Dashboard → Settings → Sender Authentication
   - Verify your sender email address

3. **Check Railway Variables:**
   - Make sure `SMTP_USER=apikey` (exact string)
   - Make sure `SMTP_PASS` is your full API key
   - No extra spaces or quotes

4. **Redeploy Railway:**
   - After changing variables, Railway auto-redeploys
   - Wait 1-2 minutes
   - Check logs for email service initialization

---

## Still Not Working?

1. **Check Railway logs** for email sending attempts
2. **Verify SendGrid API key** in SendGrid dashboard
3. **Test API key** manually with curl (see above)
4. **Check SendGrid Activity** for delivery status
5. **Verify sender email** is authenticated in SendGrid

If emails are being sent but not received:
- Check spam folder
- Verify sender email in SendGrid
- Check SendGrid Activity for bounce/delivery status
