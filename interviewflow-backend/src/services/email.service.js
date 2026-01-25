const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        // Initialize transporter based on environment
        this.transporter = null;
        this.useSendGridAPI = false;
        this.sendGridClient = null;
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
            },
            // Connection timeout settings (increased for Railway/cloud environments)
            connectionTimeout: 60000, // 60 seconds
            greetingTimeout: 30000, // 30 seconds
            socketTimeout: 60000, // 60 seconds
            // Retry connection on timeout
            pool: true,
            maxConnections: 1,
            maxMessages: 3,
            // Additional options for better reliability
            tls: {
                rejectUnauthorized: false, // Allow self-signed certificates if needed
                minVersion: 'TLSv1.2'
            },
            // Try alternative connection method
            requireTLS: true,
            // Debug mode (set to true for more detailed logs)
            debug: process.env.NODE_ENV === 'development'
        };

        // Check if email service is configured
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            // Check if using SendGrid (SMTP_USER=apikey and SMTP_PASS starts with SG.)
            const isSendGrid = process.env.SMTP_USER === 'apikey' && 
                              process.env.SMTP_PASS.startsWith('SG.');
            
            if (isSendGrid) {
                // Use SendGrid REST API instead of SMTP (bypasses Railway SMTP blocking)
                try {
                    const sgMail = require('@sendgrid/mail');
                    sgMail.setApiKey(process.env.SMTP_PASS);
                    this.sendGridClient = sgMail;
                    this.useSendGridAPI = true;
                    console.log('✓ SendGrid REST API configured (bypassing SMTP)');
                    console.log(`✓ Using SendGrid API key: ${process.env.SMTP_PASS.substring(0, 5)}... (${process.env.SMTP_PASS.length} chars)`);
                } catch (error) {
                    console.error('⚠ Failed to initialize SendGrid API, falling back to SMTP:', error.message);
                    console.warn('⚠ Install @sendgrid/mail: npm install @sendgrid/mail');
                    // Fall back to SMTP
                    this.transporter = nodemailer.createTransport(emailConfig);
                    console.log(`✓ Email service configured (SMTP fallback): ${emailConfig.host}:${emailConfig.port}`);
                }
            } else {
                // Use SMTP for other providers (Gmail, etc.)
                this.transporter = nodemailer.createTransport(emailConfig);
                console.log(`✓ Email service configured: ${emailConfig.host}:${emailConfig.port}`);
                console.log(`✓ Connection timeout: ${emailConfig.connectionTimeout}ms`);
            }
            
            console.log(`✓ SMTP_USER: ${process.env.SMTP_USER.substring(0, 10)}...`);
            console.log(`✓ SMTP_PASS: ${process.env.SMTP_PASS.substring(0, 5)}... (${process.env.SMTP_PASS.length} chars)`);
            
            // Test transporter connection (non-blocking, only for SMTP)
            if (this.transporter && !this.useSendGridAPI) {
                this.transporter.verify().then(() => {
                    console.log('✓ Email transporter verified - ready to send emails');
                }).catch((verifyError) => {
                    console.error('⚠ Email transporter verification failed:', verifyError.message);
                    console.error('⚠ This may cause email sending to fail. Check SMTP credentials.');
                });
            }
        } else {
            console.warn('⚠ Email service not configured. Set SMTP_USER and SMTP_PASS in Railway variables');
            console.warn('⚠ For SendGrid: SMTP_USER=apikey, SMTP_PASS=your-api-key');
            console.warn('⚠ For Gmail: Use App Password. See GMAIL_SETUP.md for instructions.');
        }
    }

    async sendOTP(email, otp, retries = 3) {
        try {
            console.log(`📧 sendOTP called for ${email}, retries=${retries}`);
            
            // Use SendGrid REST API if configured
            if (this.useSendGridAPI && this.sendGridClient) {
                return await this.sendOTPViaSendGridAPI(email, otp);
            }
            
            // Fall back to SMTP
            if (!this.transporter) {
                console.error('❌ Email transporter not initialized!');
                throw new Error('Email service not configured');
            }
            console.log(`📧 Email transporter ready, attempting to send to ${email}...`);

            // Get sender email
            const senderEmail = process.env.SMTP_FROM_EMAIL || 
                              (process.env.SMTP_USER === 'apikey' ? 'noreply@interviewflow.ai' : process.env.SMTP_USER) ||
                              'noreply@interviewflow.ai';
            
            const mailOptions = {
                from: `"InterviewFlow AI" <${senderEmail}>`,
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

            // Retry logic with exponential backoff for rate limiting and connection timeouts
            let lastError;
            for (let attempt = 0; attempt < retries; attempt++) {
                try {
                    console.log(`📧 Attempt ${attempt + 1}/${retries}: Sending email to ${email}...`);
                    const info = await this.transporter.sendMail(mailOptions);
                    console.log(`✓ Email sent successfully! Message ID: ${info.messageId}`);
                    return { success: true, messageId: info.messageId };
                } catch (error) {
                    lastError = error;
                    
                    // Check if it's a connection timeout error
                    const isConnectionTimeout = error.code === 'ETIMEDOUT' || 
                                               error.code === 'ECONNRESET' ||
                                               error.message?.includes('Connection timeout') ||
                                               error.message?.includes('timeout');
                    
                    // Check if it's a rate limit error
                    const isRateLimit = error.code === 'EAUTH' && 
                                       (error.responseCode === 403 || 
                                        error.message?.includes('rate limit') ||
                                        error.message?.includes('rate limited'));
                    
                    // Retry on connection timeout or rate limit
                    if ((isConnectionTimeout || isRateLimit) && attempt < retries - 1) {
                        const waitSeconds = isConnectionTimeout 
                            ? Math.pow(2, attempt + 1) * 2 // 4s, 8s, 16s for timeouts
                            : (error.message?.match(/Check again in (\d+) seconds?/i) 
                                ? parseInt(error.message.match(/Check again in (\d+) seconds?/i)[1])
                                : Math.pow(2, attempt + 1) * 5); // Exponential backoff for rate limits
                        
                        console.log(`${isConnectionTimeout ? 'Connection timeout' : 'Rate limited'}. Waiting ${waitSeconds} seconds before retry ${attempt + 1}/${retries}...`);
                        await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
                        
                        // Recreate transporter on connection timeout to reset connection
                        if (isConnectionTimeout) {
                            console.log('Recreating email transporter after timeout...');
                            this.initializeTransporter();
                        }
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
            
            // Handle connection timeout errors
            if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.message?.includes('Connection timeout')) {
                throw new Error(`Email service connection timeout. This may be due to network restrictions from your hosting provider. Please try again later or consider using an alternative email service. Error: ${error.message}`);
            }
            
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
7. Update SMTP_PASS in Railway variables with this App Password

Note: You need 2-Step Verification enabled on your Google account first.
If you don't have 2-Step Verification, enable it at: https://myaccount.google.com/security

Your current SMTP_USER: ${process.env.SMTP_USER || 'not set'}
                    `.trim();
                    throw new Error(detailedError);
                }
                
                throw new Error('Email authentication failed. Please check your SMTP_USER and SMTP_PASS in environment variables. For Gmail, use an App Password, not your regular password.');
            }
            
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    async sendPasswordResetEmail(email, resetToken, retries = 3) {
        try {
            console.log(`📧 sendPasswordResetEmail called for ${email}, retries=${retries}`);
            
            // Use SendGrid REST API if configured
            if (this.useSendGridAPI && this.sendGridClient) {
                return await this.sendPasswordResetViaSendGridAPI(email, resetToken);
            }
            
            // Fall back to SMTP
            if (!this.transporter) {
                console.error('❌ Email transporter not initialized!');
                throw new Error('Email service not configured');
            }
            console.log(`📧 Email transporter ready, attempting to send password reset to ${email}...`);

            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

            // Get sender email
            const senderEmail = process.env.SMTP_FROM_EMAIL || 
                              (process.env.SMTP_USER === 'apikey' ? 'noreply@interviewflow.ai' : process.env.SMTP_USER) ||
                              'noreply@interviewflow.ai';
            
            const mailOptions = {
                from: `"InterviewFlow AI" <${senderEmail}>`,
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

            // Retry logic with exponential backoff for rate limiting and connection timeouts
            let lastError;
            for (let attempt = 0; attempt < retries; attempt++) {
                try {
                    console.log(`📧 Attempt ${attempt + 1}/${retries}: Sending password reset email to ${email}...`);
                    const info = await this.transporter.sendMail(mailOptions);
                    console.log(`✓ Password reset email sent successfully! Message ID: ${info.messageId}`);
                    return { success: true, messageId: info.messageId };
                } catch (error) {
                    lastError = error;
                    
                    // Check if it's a connection timeout error
                    const isConnectionTimeout = error.code === 'ETIMEDOUT' || 
                                               error.code === 'ECONNRESET' ||
                                               error.code === 'ETIMEDOUT' ||
                                               error.message?.includes('Connection timeout') ||
                                               error.message?.includes('timeout');
                    
                    // Check if it's a rate limit error
                    const isRateLimit = error.code === 'EAUTH' && 
                                       (error.responseCode === 403 || 
                                        error.message?.includes('rate limit') ||
                                        error.message?.includes('rate limited'));
                    
                    // Retry on connection timeout or rate limit
                    if ((isConnectionTimeout || isRateLimit) && attempt < retries - 1) {
                        const waitSeconds = isConnectionTimeout 
                            ? Math.pow(2, attempt + 1) * 2 // 4s, 8s, 16s for timeouts
                            : (error.message?.match(/Check again in (\d+) seconds?/i) 
                                ? parseInt(error.message.match(/Check again in (\d+) seconds?/i)[1])
                                : Math.pow(2, attempt + 1) * 5); // Exponential backoff for rate limits
                        
                        console.log(`${isConnectionTimeout ? 'Connection timeout' : 'Rate limited'}. Waiting ${waitSeconds} seconds before retry ${attempt + 1}/${retries}...`);
                        await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
                        
                        // Recreate transporter on connection timeout to reset connection
                        if (isConnectionTimeout) {
                            console.log('Recreating email transporter after timeout...');
                            this.initializeTransporter();
                        }
                        continue;
                    }
                    
                    throw error;
                }
            }
            
            throw lastError;
        } catch (error) {
            console.error('Password reset email sending error:', error);
            
            // Handle connection timeout errors
            if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.message?.includes('Connection timeout')) {
                throw new Error(`Email service connection timeout. This may be due to network restrictions. Please try again later or check your SMTP configuration. Error: ${error.message}`);
            }
            
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
            if (this.useSendGridAPI && this.sendGridClient) {
                return { configured: true, message: 'SendGrid REST API is ready' };
            }
            if (!this.transporter) {
                return { configured: false, message: 'Email service not configured' };
            }
            await this.transporter.verify();
            return { configured: true, message: 'Email service is ready' };
        } catch (error) {
            return { configured: false, message: `Email service error: ${error.message}` };
        }
    }

    /**
     * Send OTP via SendGrid REST API (bypasses SMTP blocking)
     */
    async sendOTPViaSendGridAPI(email, otp) {
        try {
            const senderEmail = process.env.SMTP_FROM_EMAIL || 'noreply@interviewflow.ai';
            
            const msg = {
                to: email,
                from: senderEmail,
                subject: 'Verify Your Email - InterviewFlow AI',
                text: `Verify Your Email - InterviewFlow AI\n\nThank you for registering! Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't create an account, please ignore this email.`,
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
                `
            };

            console.log(`📧 Sending OTP via SendGrid REST API to ${email}...`);
            await this.sendGridClient.send(msg);
            console.log(`✓ OTP sent successfully via SendGrid API to ${email}`);
            return { success: true, messageId: 'sendgrid-api' };
        } catch (error) {
            console.error('✗ SendGrid API error:', error);
            if (error.response) {
                console.error('✗ SendGrid response:', error.response.body);
            }
            throw new Error(`SendGrid API error: ${error.message}`);
        }
    }

    /**
     * Send password reset email via SendGrid REST API
     */
    async sendPasswordResetViaSendGridAPI(email, resetToken) {
        try {
            const senderEmail = process.env.SMTP_FROM_EMAIL || 'noreply@interviewflow.ai';
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

            const msg = {
                to: email,
                from: senderEmail,
                subject: 'Reset Your Password - InterviewFlow AI',
                text: `Reset Your Password - InterviewFlow AI\n\nWe received a request to reset your password.\n\nClick this link to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, please ignore this email.`,
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
                `
            };

            console.log(`📧 Sending password reset via SendGrid REST API to ${email}...`);
            await this.sendGridClient.send(msg);
            console.log(`✓ Password reset email sent successfully via SendGrid API to ${email}`);
            return { success: true, messageId: 'sendgrid-api' };
        } catch (error) {
            console.error('✗ SendGrid API error:', error);
            if (error.response) {
                console.error('✗ SendGrid response:', error.response.body);
            }
            throw new Error(`SendGrid API error: ${error.message}`);
        }
    }
}

module.exports = new EmailService();
