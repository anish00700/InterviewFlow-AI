const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        // Initialize transporter based on environment
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        // Use environment variables for email configuration
        // Default to Gmail
        const emailConfig = {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // Gmail uses TLS on port 587
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        };

        // If using Gmail with app password
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            this.transporter = nodemailer.createTransport(emailConfig);
            console.log(`✓ Email service configured: ${emailConfig.host}`);
        } else {
            console.warn('⚠ Email service not configured. Set SMTP_USER and SMTP_PASS in .env');
            console.warn('⚠ For Gmail, you need an App Password. See GMAIL_SETUP.md for instructions.');
        }
    }

    async sendOTP(email, otp, retries = 3) {
        try {
            if (!this.transporter) {
                throw new Error('Email service not configured');
            }

            const mailOptions = {
                from: `"InterviewFlow AI" <${process.env.SMTP_USER || 'noreply@interviewflow.ai'}>`,
                to: email,
                subject: 'Verify Your Email - InterviewFlow AI',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Email Verification</title>
                    </head>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #0D9488 0%, #0891B2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="color: white; margin: 0;">InterviewFlow AI</h1>
                        </div>
                        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                            <h2 style="color: #0D9488; margin-top: 0;">Verify Your Email Address</h2>
                            <p>Thank you for registering with InterviewFlow AI! Please verify your email address by entering the OTP code below:</p>
                            <div style="background: white; border: 2px solid #0D9488; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                                <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;">Your verification code is:</p>
                                <h1 style="color: #0D9488; font-size: 36px; letter-spacing: 8px; margin: 10px 0; font-weight: bold;">${otp}</h1>
                            </div>
                            <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
                            <p style="color: #666; font-size: 14px; margin-top: 30px;">If you didn't create an account with InterviewFlow AI, please ignore this email.</p>
                            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} InterviewFlow AI. All rights reserved.</p>
                        </div>
                    </body>
                    </html>
                `,
                text: `
                    Verify Your Email - InterviewFlow AI
                    
                    Thank you for registering! Your verification code is: ${otp}
                    
                    This code will expire in 10 minutes.
                    
                    If you didn't create an account, please ignore this email.
                `
            };

            // Retry logic with exponential backoff for rate limiting
            let lastError;
            for (let attempt = 0; attempt < retries; attempt++) {
                try {
                    const info = await this.transporter.sendMail(mailOptions);
                    console.log('Email sent:', info.messageId);
                    return { success: true, messageId: info.messageId };
                } catch (error) {
                    lastError = error;
                    
                    // Check if it's a rate limit error
                    const isRateLimit = error.code === 'EAUTH' && 
                                       (error.responseCode === 403 || 
                                        error.message?.includes('rate limit') ||
                                        error.message?.includes('rate limited'));
                    
                    if (isRateLimit && attempt < retries - 1) {
                        // Extract wait time from error message if available
                        const waitMatch = error.message?.match(/Check again in (\d+) seconds?/i);
                        const waitSeconds = waitMatch ? parseInt(waitMatch[1]) : Math.pow(2, attempt + 1) * 5; // Exponential backoff: 10s, 20s, 40s
                        
                        console.log(`Rate limited. Waiting ${waitSeconds} seconds before retry ${attempt + 1}/${retries}...`);
                        await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
                        continue;
                    }
                    
                    // For other errors or last attempt, throw
                    throw error;
                }
            }
            
            // If we get here, all retries failed
            throw lastError;
        } catch (error) {
            console.error('Email sending error:', error);
            
            // Provide user-friendly error messages
            if (error.code === 'EAUTH') {
                if (error.responseCode === 403 && error.message?.includes('rate limit')) {
                    const waitMatch = error.message?.match(/Check again in (\d+) seconds?/i);
                    const waitTime = waitMatch ? waitMatch[1] : 'a few';
                    throw new Error(`Email service is temporarily rate limited. Please wait ${waitTime} seconds and try again. If this persists, check your SMTP credentials.`);
                }
                
                // Gmail BadCredentials error (535)
                if (error.responseCode === 535 || error.message?.includes('BadCredentials')) {
                    const detailedError = `
Email authentication failed! Gmail rejected your credentials.

SOLUTION: You MUST use a Gmail App Password, not your regular password.

Steps to create a Gmail App Password:
1. Go to: https://myaccount.google.com/apppasswords
2. Sign in with your Google account
3. Select "Mail" and "Other (Custom name)" 
4. Enter "InterviewFlow" as the app name
5. Click "Generate"
6. Copy the 16-character password (no spaces)
7. Update SMTP_PASS in your .env file with this App Password

Note: You need 2-Step Verification enabled on your Google account first.
If you don't have 2-Step Verification, enable it at: https://myaccount.google.com/security

Your current SMTP_USER: ${process.env.SMTP_USER || 'not set'}
                    `.trim();
                    throw new Error(detailedError);
                }
                
                throw new Error('Email authentication failed. Please check your SMTP_USER and SMTP_PASS in .env file. For Gmail, use an App Password, not your regular password.');
            }
            
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    async sendPasswordResetEmail(email, resetToken, retries = 3) {
        try {
            if (!this.transporter) {
                throw new Error('Email service not configured');
            }

            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

            const mailOptions = {
                from: `"InterviewFlow AI" <${process.env.SMTP_USER || 'noreply@interviewflow.ai'}>`,
                to: email,
                subject: 'Reset Your Password - InterviewFlow AI',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Reset Password</title>
                    </head>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #0D9488 0%, #0891B2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="color: white; margin: 0;">InterviewFlow AI</h1>
                        </div>
                        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                            <h2 style="color: #0D9488; margin-top: 0;">Reset Your Password</h2>
                            <p>We received a request to reset your password for your InterviewFlow AI account.</p>
                            <p>Click the button below to reset your password:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #0D9488 0%, #0891B2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Reset Password</a>
                            </div>
                            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                            <p style="color: #0D9488; font-size: 12px; word-break: break-all; background: white; padding: 10px; border-radius: 4px;">${resetUrl}</p>
                            <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour.</p>
                            <p style="color: #666; font-size: 14px;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
                            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} InterviewFlow AI. All rights reserved.</p>
                        </div>
                    </body>
                    </html>
                `,
                text: `
                    Reset Your Password - InterviewFlow AI
                    
                    We received a request to reset your password.
                    
                    Click this link to reset your password:
                    ${resetUrl}
                    
                    This link will expire in 1 hour.
                    
                    If you didn't request a password reset, please ignore this email.
                `
            };

            // Retry logic with exponential backoff for rate limiting
            let lastError;
            for (let attempt = 0; attempt < retries; attempt++) {
                try {
                    const info = await this.transporter.sendMail(mailOptions);
                    console.log('Password reset email sent:', info.messageId);
                    return { success: true, messageId: info.messageId };
                } catch (error) {
                    lastError = error;
                    
                    // Check if it's a rate limit error
                    const isRateLimit = error.code === 'EAUTH' && 
                                       (error.responseCode === 403 || 
                                        error.message?.includes('rate limit') ||
                                        error.message?.includes('rate limited'));
                    
                    if (isRateLimit && attempt < retries - 1) {
                        const waitMatch = error.message?.match(/Check again in (\d+) seconds?/i);
                        const waitSeconds = waitMatch ? parseInt(waitMatch[1]) : Math.pow(2, attempt + 1) * 5;
                        
                        console.log(`Rate limited. Waiting ${waitSeconds} seconds before retry ${attempt + 1}/${retries}...`);
                        await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
                        continue;
                    }
                    
                    throw error;
                }
            }
            
            throw lastError;
        } catch (error) {
            console.error('Password reset email sending error:', error);
            
            if (error.code === 'EAUTH') {
                if (error.responseCode === 403 && error.message?.includes('rate limit')) {
                    const waitMatch = error.message?.match(/Check again in (\d+) seconds?/i);
                    const waitTime = waitMatch ? waitMatch[1] : 'a few';
                    throw new Error(`Email service is temporarily rate limited. Please wait ${waitTime} seconds and try again.`);
                }
                
                if (error.responseCode === 535 || error.message?.includes('BadCredentials')) {
                    throw new Error('Email authentication failed. Please check your SMTP credentials.');
                }
                
                throw new Error('Email authentication failed. Please check your SMTP configuration.');
            }
            
            throw new Error(`Failed to send password reset email: ${error.message}`);
        }
    }

    async verifyEmailConfig() {
        try {
            if (!this.transporter) {
                return { configured: false, message: 'Email service not configured' };
            }
            await this.transporter.verify();
            return { configured: true, message: 'Email service is ready' };
        } catch (error) {
            return { configured: false, message: `Email service error: ${error.message}` };
        }
    }
}

module.exports = new EmailService();
