# Email Connection Timeout Fix

## Problem
Getting `Connection timeout` errors when sending emails from Railway to Gmail SMTP.

## Root Cause
Railway (or other cloud providers) may have network restrictions or firewall rules that block or delay outbound SMTP connections to Gmail.

## Solutions Implemented

### 1. Increased Connection Timeouts
- Connection timeout: 60 seconds (was default ~10s)
- Socket timeout: 60 seconds
- Greeting timeout: 30 seconds

### 2. Added Retry Logic for Timeouts
- Automatically retries on connection timeout
- Exponential backoff: 4s, 8s, 16s between retries
- Recreates transporter connection after timeout

### 3. Better Error Handling
- Specific error messages for connection timeouts
- Logs connection issues for debugging

## Alternative Solutions

If connection timeouts persist, consider:

### Option 1: Use Alternative SMTP Service
Services that work better with cloud providers:

1. **SendGrid** (Recommended)
   - Free tier: 100 emails/day
   - Better cloud provider compatibility
   - Setup: https://sendgrid.com

2. **Mailgun**
   - Free tier: 5,000 emails/month
   - Good for cloud deployments
   - Setup: https://mailgun.com

3. **AWS SES**
   - Very cheap ($0.10 per 1,000 emails)
   - Excellent reliability
   - Setup: https://aws.amazon.com/ses

### Option 2: Use Railway's Network Settings
1. Check Railway's network/firewall settings
2. Ensure outbound SMTP connections are allowed
3. Contact Railway support if needed

### Option 3: Use Gmail API Instead of SMTP
- More reliable than SMTP
- Better for cloud environments
- Requires OAuth setup

## Testing

After deploying the fix:

1. **Check Railway Logs:**
   - Look for retry attempts
   - Check if connection succeeds after retry

2. **Test Email Sending:**
   - Request password reset
   - Request email update OTP
   - Check if emails arrive

3. **Monitor Connection:**
   - Watch for timeout errors
   - Check retry success rate

## If Still Failing

If connection timeouts persist after the fix:

1. **Check Railway Network:**
   - Railway may be blocking SMTP ports
   - Contact Railway support

2. **Switch to Alternative Service:**
   - Use SendGrid or Mailgun
   - Better cloud provider compatibility

3. **Check Gmail Settings:**
   - Ensure "Less secure app access" is enabled (if using regular password)
   - Use App Password (recommended)

## Current Configuration

The email service now:
- ✅ Has 60-second connection timeout
- ✅ Retries on connection timeout (3 attempts)
- ✅ Recreates connection after timeout
- ✅ Provides better error messages

## Next Steps

1. **Deploy the fix** (already done in code)
2. **Test email sending** from Railway
3. **Check Railway logs** for retry attempts
4. **If still failing**, consider switching to SendGrid/Mailgun
