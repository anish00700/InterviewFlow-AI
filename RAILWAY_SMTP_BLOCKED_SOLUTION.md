# Railway SMTP Blocked - Alternative Solutions

## Problem
Railway is blocking outbound SMTP connections to Gmail, causing connection timeouts. Even with retry logic, emails cannot be sent.

## Evidence
- Connection timeout errors in Railway logs
- Retry attempts failing
- "Connection timeout. Waiting X seconds before retry..." messages

## Solutions

### Option 1: Use SendGrid (Recommended) ⭐

**Why SendGrid:**
- Works reliably with cloud providers
- Free tier: 100 emails/day
- Better API than SMTP
- No connection timeout issues

**Setup Steps:**

1. **Create SendGrid Account:**
   - Go to: https://sendgrid.com
   - Sign up for free account
   - Verify your email

2. **Create API Key:**
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name: "InterviewFlow AI"
   - Permissions: "Full Access" (or just "Mail Send")
   - Copy the API key

3. **Update Railway Variables:**
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key-here
   SMTP_FROM_EMAIL=your-verified-email@example.com
   ```
   
   **Important:**
   - `SMTP_USER` must be the literal string `apikey`
   - `SMTP_PASS` is your SendGrid API key
   - `SMTP_FROM_EMAIL` should be a verified sender email in SendGrid (optional but recommended)

4. **Railway will auto-redeploy** - emails should work immediately

**Benefits:**
- ✅ No connection timeouts
- ✅ Better reliability
- ✅ Email analytics
- ✅ Free tier sufficient for testing

---

### Option 2: Use Mailgun

**Why Mailgun:**
- Free tier: 5,000 emails/month
- Good cloud provider compatibility
- Simple SMTP setup

**Setup Steps:**

1. **Create Mailgun Account:**
   - Go to: https://mailgun.com
   - Sign up for free account
   - Verify your domain (or use sandbox domain for testing)

2. **Get SMTP Credentials:**
   - Go to Sending → Domain Settings
   - Find "SMTP credentials"
   - Copy username and password

3. **Update Railway Variables:**
   ```
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-mailgun-username
   SMTP_PASS=your-mailgun-password
   ```

---

### Option 3: Use AWS SES

**Why AWS SES:**
- Very cheap ($0.10 per 1,000 emails)
- Excellent reliability
- Works with all cloud providers

**Setup Steps:**

1. **Create AWS Account** (if you don't have one)
2. **Set up SES:**
   - Go to AWS SES Console
   - Verify your email address
   - Get SMTP credentials

3. **Update Railway Variables:**
   ```
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-ses-smtp-username
   SMTP_PASS=your-ses-smtp-password
   ```

---

### Option 4: Temporary Workaround - Use Railway Logs

**For Testing/Development:**

Since OTPs are now logged in Railway logs when email fails:

1. **Request OTP** from registration page
2. **Check Railway Logs:**
   - Go to Railway → Deployments → Latest → View Logs
   - Look for: `⚠ OTP for [email] (email failed): XXXXXX`
3. **Use the OTP from logs** to complete registration

**Note:** This is only for testing. For production, use a proper email service.

---

## Quick Comparison

| Service | Free Tier | Setup Difficulty | Reliability |
|---------|-----------|------------------|-------------|
| **SendGrid** | 100/day | Easy ⭐ | Excellent |
| **Mailgun** | 5,000/month | Easy ⭐ | Excellent |
| **AWS SES** | 62,000/month* | Medium | Excellent |
| **Gmail SMTP** | Unlimited | Easy | ❌ Blocked by Railway |

*After verification and moving out of sandbox

---

## Recommended Action

**For immediate fix:** Use **SendGrid**
- Fastest setup (5 minutes)
- Works immediately
- Free tier is sufficient
- No connection issues

**Steps:**
1. Sign up at https://sendgrid.com
2. Create API key
3. Update Railway variables:
   - `SMTP_HOST=smtp.sendgrid.net`
   - `SMTP_USER=apikey`
   - `SMTP_PASS=your-api-key`
4. Railway redeploys automatically
5. Test - emails should work!

---

## Why Gmail SMTP Fails on Railway

Railway (and many cloud providers) block outbound SMTP connections on port 587/465 to prevent spam. This is a security measure, not a bug.

**Solutions:**
- Use transactional email services (SendGrid, Mailgun, SES)
- These services are designed for cloud deployments
- They use different ports/protocols that aren't blocked

---

## After Switching

1. **Test email sending:**
   - Request password reset
   - Request registration OTP
   - Check if emails arrive

2. **Monitor Railway logs:**
   - Should see: `✓ Email sent successfully`
   - No more timeout errors

3. **Verify in inbox:**
   - Check email inbox
   - Check spam folder (initially)

---

## Need Help?

If you need help setting up SendGrid or another service, let me know which one you'd like to use and I can provide detailed step-by-step instructions.
