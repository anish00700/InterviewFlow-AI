const User = require('../models/User');
const OTP = require('../models/OTP');
const PasswordReset = require('../models/PasswordReset');
const emailService = require('../services/email.service');
const jwt = require('jsonwebtoken');
const passport = require('../config/passport');

// Generate JWT Logic
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d'
    });
};

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Send OTP for email verification
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email
        if (!email || !email.trim()) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Validate email format
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Delete any existing unverified OTPs for this email
        await OTP.deleteMany({ email, verified: false });

        // Generate new OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Save OTP to database
        await OTP.create({
            email,
            otp,
            expiresAt
        });

        // Send OTP via email
        try {
            await emailService.sendOTP(email, otp);
            res.status(200).json({
                message: 'OTP sent successfully to your email',
                email: email // Return email for frontend confirmation
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            
            // Check if it's a rate limit error
            const isRateLimit = emailError.message?.includes('rate limit') || 
                               emailError.message?.includes('rate limited');
            
            if (isRateLimit) {
                // Return rate limit error to user
                return res.status(429).json({
                    message: emailError.message || 'Email service is temporarily unavailable. Please try again in a few moments.',
                    email: email,
                    retryAfter: 30 // Suggest retry after 30 seconds
                });
            }
            
            // Check if it's a bad credentials error (Gmail App Password issue)
            const isBadCredentials = emailError.message?.includes('BadCredentials') || 
                                    emailError.message?.includes('Username and Password not accepted') ||
                                    emailError.message?.includes('Email authentication failed');
            
            if (isBadCredentials) {
                // Return detailed error about App Password
                return res.status(401).json({
                    message: emailError.message || 'Gmail authentication failed. Please use an App Password instead of your regular password.',
                    email: email,
                    errorType: 'bad_credentials',
                    helpUrl: 'https://myaccount.google.com/apppasswords'
                });
            }
            
            // For other email errors, still allow registration in dev mode
            // In production, you might want to fail here
            if (process.env.NODE_ENV === 'development') {
                console.warn('⚠ Email sending failed, but allowing registration in dev mode');
                console.warn('⚠ OTP for testing:', otp);
                res.status(200).json({
                    message: 'OTP generated. Check your email for verification code. (Email service error in dev mode)',
                    email: email,
                    otp: otp, // Show OTP in dev mode for testing
                    warning: 'Email service not working. Using OTP for testing.'
                });
            } else {
                // In production, return error
                res.status(500).json({
                    message: emailError.message || 'Failed to send verification email. Please check your email configuration or try again later.',
                    email: email
                });
            }
        }
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ message: error.message || 'Failed to send OTP' });
    }
};

// @desc    Verify OTP and complete registration
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp, name, password } = req.body;

        // Validate required fields
        if (!email || !email.trim()) {
            return res.status(400).json({ message: 'Email is required' });
        }
        if (!otp || !otp.trim()) {
            return res.status(400).json({ message: 'OTP is required' });
        }
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Name is required' });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Find the OTP record
        const otpRecord = await OTP.findOne({
            email,
            verified: false
        }).sort({ createdAt: -1 }); // Get the most recent OTP

        if (!otpRecord) {
            return res.status(400).json({ message: 'No OTP found for this email. Please request a new OTP.' });
        }

        // Check if OTP is expired
        if (new Date() > otpRecord.expiresAt) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        // Check if too many attempts
        if (otpRecord.attempts >= 5) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ message: 'Too many failed attempts. Please request a new OTP.' });
        }

        // Verify OTP
        if (otpRecord.otp !== otp.trim()) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            return res.status(400).json({
                message: 'Invalid OTP',
                attemptsRemaining: 5 - otpRecord.attempts
            });
        }

        // Check if user already exists (double-check)
        const userExists = await User.findOne({ email });
        if (userExists) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Mark OTP as verified
        otpRecord.verified = true;
        await otpRecord.save();

        // Create user with verified email
        const user = await User.create({
            name,
            email,
            password,
            emailVerified: true,
            emailVerifiedAt: new Date()
        });

        // Delete the OTP record after successful registration
        await OTP.deleteOne({ _id: otpRecord._id });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Verify OTP error:', error);
        // Handle validation errors from Mongoose
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        if (error.code === 11000) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

// @desc    Register user (legacy - now requires OTP verification)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    // Redirect to new flow
    return res.status(400).json({
        message: 'Please use the email verification flow. Send OTP first, then verify.',
        steps: [
            '1. POST /api/auth/send-otp with { email }',
            '2. POST /api/auth/verify-otp with { email, otp, name, password }'
        ]
    });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !email.trim()) {
            return res.status(400).json({ message: 'Email is required' });
        }
        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        // Check for user email
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Google OAuth login
// @route   GET /api/auth/google
// @access  Public
exports.googleAuth = passport.authenticate('google', {
    scope: ['profile', 'email']
});

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleCallback = (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user) => {
        if (err) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent(err.message)}`);
        }
        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent('Google authentication failed')}`);
        }
        
        // Generate JWT token
        const token = generateToken(user._id);
        
        // Redirect to frontend with token
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}&provider=google`;
        res.redirect(redirectUrl);
    })(req, res, next);
};

// @desc    GitHub OAuth login
// @route   GET /api/auth/github
// @access  Public
exports.githubAuth = passport.authenticate('github', {
    scope: ['user:email']
});

// @desc    GitHub OAuth callback
// @route   GET /api/auth/github/callback
// @access  Public
exports.githubCallback = (req, res, next) => {
    passport.authenticate('github', { session: false }, (err, user) => {
        if (err) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent(err.message)}`);
        }
        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent('GitHub authentication failed')}`);
        }
        
        // Generate JWT token
        const token = generateToken(user._id);
        
        // Redirect to frontend with token
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}&provider=github`;
        res.redirect(redirectUrl);
    })(req, res, next);
};

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Check if user exists (but don't reveal if they don't for security)
        const user = await User.findOne({ email: email.trim().toLowerCase() });

        if (!user) {
            // Return success even if user doesn't exist (security best practice)
            return res.status(200).json({
                message: 'If an account exists with this email, a password reset link has been sent.'
            });
        }

        // Check if user is OAuth-only (no password to reset)
        if (user.provider !== 'local') {
            return res.status(400).json({
                message: 'This account was created with Google. Please sign in with Google instead.'
            });
        }

        // Create reset token
        const resetToken = await PasswordReset.createResetToken(email.trim().toLowerCase());

        // Return response immediately (don't wait for email)
        res.status(200).json({
            message: 'If an account exists with this email, a password reset link has been sent.'
        });

        // Send reset email asynchronously (fire and forget)
        // This prevents blocking the response while email is being sent
        emailService.sendPasswordResetEmail(email.trim().toLowerCase(), resetToken.token)
            .then(() => {
                console.log(`✓ Password reset email sent successfully to ${email.trim().toLowerCase()}`);
            })
            .catch((emailError) => {
                console.error('✗ Password reset email sending failed (async):', emailError);
                // Delete the token if email fails (but don't block the response)
                PasswordReset.deleteOne({ _id: resetToken._id }).catch(err => {
                    console.error('Failed to delete reset token:', err);
                });
                
                // In development, log the token for testing
                if (process.env.NODE_ENV === 'development') {
                    console.warn('⚠ Password reset token (email failed):', resetToken.token);
                    console.warn('⚠ Reset URL:', `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken.token}`);
                }
            });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'Reset token is required' });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Verify and use token
        const resetToken = await PasswordReset.verifyAndUseToken(token);

        if (!resetToken) {
            return res.status(400).json({
                message: 'Invalid or expired reset token. Please request a new password reset.'
            });
        }

        // Find user (need to select password field even though it's select: false)
        const user = await User.findOne({ email: resetToken.email }).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is OAuth-only
        if (user.provider !== 'local') {
            return res.status(400).json({
                message: 'This account was created with Google. Please sign in with Google instead.'
            });
        }

        // Update password
        user.password = password;
        await user.save();

        res.status(200).json({
            message: 'Password reset successful. You can now sign in with your new password.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

// @desc    Send OTP for email update verification
// @route   POST /api/auth/send-email-update-otp
// @access  Private
exports.sendEmailUpdateOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const userId = req.user.id;

        if (!email || !email.trim()) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Validate email format
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        const newEmail = email.trim().toLowerCase();

        // Get current user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if OAuth-only
        if (user.provider !== 'local') {
            return res.status(400).json({
                message: 'This account was created with Google. Please update your email in your Google account settings.'
            });
        }

        // Check if email is the same
        if (user.email === newEmail) {
            return res.status(400).json({ message: 'This is already your current email address' });
        }

        // Check if email is already taken
        const existingUser = await User.findOne({ 
            email: newEmail,
            _id: { $ne: userId }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Email is already in use' });
        }

        // Delete any existing unverified OTPs for this email update
        await OTP.deleteMany({ email: newEmail, verified: false });

        // Generate new OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Save OTP to database with userId for email update context
        await OTP.create({
            email: newEmail,
            otp,
            expiresAt,
            userId: userId.toString() // Store userId to verify this is for email update
        });

        // Return response immediately (don't wait for email)
        res.status(200).json({
            message: 'Verification code sent to your new email address',
            email: newEmail
        });

        // Send OTP via email asynchronously (fire and forget)
        // This prevents blocking the response while email is being sent
        emailService.sendOTP(newEmail, otp).then(() => {
            console.log(`✓ Email update OTP sent successfully to ${newEmail}`);
        }).catch((emailError) => {
            console.error('✗ Email sending failed (async):', emailError);
            // Log error but don't fail the request since OTP is already saved
            // User can request a new OTP if email doesn't arrive
            // In dev mode, log OTP for testing
            if (process.env.NODE_ENV === 'development') {
                console.warn('⚠ OTP for testing (email failed):', otp);
            }
        });
    } catch (error) {
        console.error('Send email update OTP error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

// @desc    Verify OTP and update email
// @route   PUT /api/auth/update-email
// @access  Private
exports.updateEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const userId = req.user.id;

        if (!email || !email.trim()) {
            return res.status(400).json({ message: 'Email is required' });
        }

        if (!otp) {
            return res.status(400).json({ message: 'Verification code is required' });
        }

        const newEmail = email.trim().toLowerCase();

        // Validate email format
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(newEmail)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if OAuth-only
        if (user.provider !== 'local') {
            return res.status(400).json({
                message: 'This account was created with Google. Please update your email in your Google account settings.'
            });
        }

        // Verify OTP (check userId to ensure it's for this user's email update)
        const otpRecord = await OTP.findOne({
            email: newEmail,
            otp: otp.trim(),
            userId: userId.toString(),
            verified: false,
            expiresAt: { $gt: new Date() },
            attempts: { $lt: 5 }
        });

        if (!otpRecord) {
            // Increment attempts if OTP exists but is wrong
            const existingOTP = await OTP.findOne({ email: newEmail, verified: false });
            if (existingOTP) {
                existingOTP.attempts += 1;
                await existingOTP.save();
            }
            return res.status(400).json({
                message: 'Invalid or expired verification code. Please request a new code.'
            });
        }

        // Check if email is already taken (double-check)
        const existingUser = await User.findOne({ 
            email: newEmail,
            _id: { $ne: userId }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Email is already in use' });
        }

        // Mark OTP as verified
        otpRecord.verified = true;
        await otpRecord.save();

        // Update email
        user.email = newEmail;
        user.emailVerified = true; // Verified via OTP
        user.emailVerifiedAt = new Date();
        await user.save();

        res.status(200).json({
            message: 'Email updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified
            }
        });
    } catch (error) {
        console.error('Update email error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

// @desc    Update user password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword) {
            return res.status(400).json({ message: 'Current password is required' });
        }

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        // Get user with password field
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if OAuth-only
        if (user.provider !== 'local') {
            return res.status(400).json({
                message: 'This account was created with Google. Please update your password in your Google account settings.'
            });
        }

        // Verify current password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};
