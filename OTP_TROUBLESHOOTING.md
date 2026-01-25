# OTP Not Working - Troubleshooting Guide

## Common Issues

### 1. Email Not Received
**Symptoms:**
- OTP request succeeds but no email arrives
- Check spam folder
- Check Railway logs for email errors

**Solutions:**
- Check Railway logs for email sending errors
- Verify SMTP credentials in Railway
- Check spam/junk folder
- Wait a few minutes (email delivery can be delayed)

### 2. OTP Verification Fails
**Symptoms:**
- "Invalid OTP" or "No OTP found" errors
- OTP expires too quickly

**Possible Causes:**
- Email case mismatch (now fixed - emails are normalized)
- OTP expired (10 minutes)
- Too many failed attempts (5 max)
- Wrong OTP entered

**Solutions:**
- Request a new OTP
- Double-check the OTP code
- Make sure you're using the most recent OTP

### 3. Connection Timeout
**Symptoms:**
- Email sending fails with timeout errors
- Railway logs show "Connection timeout"

**Solutions:**
- The system now retries automatically
- Check Railway logs for retry attempts
- Consider switching to SendGrid/Mailgun if timeouts persist

---

## Debugging Steps

### Step 1: Check Railway Logs

1. Go to Railway Dashboard → Your Project → Deployments → Latest → View Logs
2. Look for:
   - `✓ Registration OTP sent successfully to...` - Email sent
   - `✗ Registration OTP email sending failed (async):` - Email failed
   - `⚠ OTP for ... (email failed): XXXXXX` - OTP code (if email failed)

### Step 2: Check OTP in Development Mode

If `NODE_ENV=development` is set in Railway:
- The OTP will be included in the API response
- Check browser console or network response
- Look for `devOTP` field in the response

### Step 3: Verify Email Configuration

Visit: `https://interviewflow-ai-production.up.railway.app/api/diagnostics`

Check the `emailService` section:
- `transporterConfigured: true` - Email service is set up
- `test.status: "working"` - Email service is working

### Step 4: Test OTP Flow

1. **Request OTP:**
   - Go to registration page
   - Enter email
   - Click "Send OTP
   - Check Railway logs for OTP generation

2. **Verify OTP:**
   - Enter the OTP from email (or logs if email failed)
   - Check Railway logs for verification attempts

---

## Common Error Messages

### "No OTP found for this email"
- **Cause:** OTP expired, deleted, or never created
- **Solution:** Request a new OTP

### "OTP has expired"
- **Cause:** OTP is older than 10 minutes
- **Solution:** Request a new OTP

### "Too many failed attempts"
- **Cause:** 5 incorrect OTP attempts
- **Solution:** Request a new OTP

### "Invalid OTP"
- **Cause:** Wrong OTP code entered
- **Solution:** Double-check the code, try again

### "Connection timeout"
- **Cause:** Railway can't connect to Gmail SMTP
- **Solution:** System will retry automatically, check logs

---

## Development Mode

If `NODE_ENV=development` is set:
- OTP will be logged in Railway logs
- OTP will be included in API response (`devOTP` field)
- You can verify OTP even if email fails

**To enable development mode:**
1. Go to Railway → Variables
2. Add: `NODE_ENV=development`
3. Railway will redeploy

**Note:** Only use in development/testing, not production!

---

## Quick Fixes

1. **Request New OTP:**
   - Go back to registration
   - Enter email again
   - Click "Send OTP" again

2. **Check Email:**
   - Check inbox
   - Check spam folder
   - Wait 1-2 minutes

3. **Check Railway Logs:**
   - Look for OTP code in logs
   - Use that code to verify

4. **Verify SMTP:**
   - Check `/api/diagnostics` endpoint
   - Verify email service status

---

## Still Not Working?

1. **Check Railway Logs** - Most important step
2. **Verify SMTP credentials** in Railway variables
3. **Test email service** via `/api/diagnostics`
4. **Check spam folder** for emails
5. **Request new OTP** and try again

If emails are consistently failing, consider switching to SendGrid or Mailgun for better cloud provider compatibility.
