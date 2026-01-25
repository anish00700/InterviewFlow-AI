# Email Not Receiving - Troubleshooting Guide

## Quick Checks

### 1. Check Railway Logs (Most Important)

Since emails are sent asynchronously, errors are logged but not shown to users.

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app
   - Select your backend project
   - Click on "Deployments" → Latest deployment → "View Logs"

2. **Look for these messages:**
   - ✅ `✓ Password reset email sent successfully to...` - Email sent successfully
   - ✅ `✓ Email update OTP sent successfully to...` - Email sent successfully
   - ❌ `✗ Password reset email sending failed (async):` - Email failed
   - ❌ `✗ Email sending failed (async):` - Email failed
   - ⚠️ `⚠ Email service not configured` - SMTP not set up

3. **Common errors you might see:**
   - `Email authentication failed` - Wrong SMTP credentials
   - `Rate limit exceeded` - Too many emails sent
   - `Connection timeout` - Network/SMTP server issue

### 2. Verify Railway Environment Variables

**Critical:** Your local `.env` file is NOT used in production. You must set these in Railway:

1. **Go to Railway Dashboard** → Your Project → **Variables** tab
2. **Verify these are set:**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```
3. **Important:** `SMTP_PASS` must be a Gmail App Password, not your regular password

### 3. Check Email Spam Folder

- Gmail sometimes filters automated emails to spam
- Check your spam/junk folder
- Look for emails from "InterviewFlow AI"

### 4. Verify Gmail App Password

If you're using Gmail, you MUST use an App Password:

1. **Go to:** https://myaccount.google.com/apppasswords
2. **Sign in** with your Google account
3. **Select:**
   - App: "Mail"
   - Device: "Other (Custom name)" → Enter "InterviewFlow"
4. **Click "Generate"**
5. **Copy the 16-character password** (no spaces)
6. **Update in Railway:**
   - Go to Railway → Variables
   - Set `SMTP_PASS` to the new App Password
   - Railway will auto-redeploy

**Note:** You need 2-Step Verification enabled first:
- Enable at: https://myaccount.google.com/security

### 5. Test Email Configuration

You can test if email is working by checking Railway logs after:
- Requesting a password reset
- Requesting an email update OTP

Look for success/failure messages in the logs.

## Common Issues & Solutions

### Issue 1: "Email authentication failed"
**Solution:** 
- Use Gmail App Password (not regular password)
- Verify `SMTP_USER` and `SMTP_PASS` in Railway variables
- Make sure there are no extra spaces in the password

### Issue 2: "Rate limit exceeded"
**Solution:**
- Wait a few minutes and try again
- Gmail has rate limits for automated emails
- The system will retry automatically

### Issue 3: Emails sent but not received
**Solution:**
- Check spam folder
- Verify email address is correct
- Check Railway logs to confirm email was sent
- Wait a few minutes (email delivery can be delayed)

### Issue 4: "Email service not configured"
**Solution:**
- Set `SMTP_USER` and `SMTP_PASS` in Railway variables
- Restart Railway service after setting variables

## Debugging Steps

1. **Check Railway Logs:**
   ```bash
   # In Railway Dashboard → View Logs
   # Look for email-related messages
   ```

2. **Verify Environment Variables:**
   - Railway Dashboard → Variables
   - All SMTP variables should be set

3. **Test Locally (if possible):**
   - Use your local `.env` file
   - Test email sending locally
   - If it works locally but not in production, it's a Railway config issue

4. **Check Email Service Status:**
   - Railway logs should show: `✓ Email service configured: smtp.gmail.com`
   - If you see warnings, SMTP is not configured correctly

## Next Steps

1. **Check Railway logs** for email sending errors
2. **Verify SMTP credentials** in Railway variables
3. **Check spam folder** for emails
4. **If still not working**, share the error messages from Railway logs

## Important Notes

- ⚠️ **Local `.env` is NOT used in production** - Set variables in Railway
- ⚠️ **Emails are sent asynchronously** - Errors only appear in logs
- ⚠️ **Gmail requires App Password** - Regular password won't work
- ⚠️ **Check spam folder** - Automated emails often go to spam initially
