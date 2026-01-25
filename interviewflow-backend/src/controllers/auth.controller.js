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

// @desc    Send OTP for email verification (REMOVED - no longer needed)
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOTP = async (req, res) => {
    return res.status(410).json({ message: 'OTP verification has been removed. Please register directly using /api/auth/register' });
};

// @desc    Verify OTP (REMOVED - no longer needed)
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
    return res.status(410).json({ message: 'OTP verification has been removed. Please register directly using /api/auth/register' });
};
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

        // Normalize email (lowercase for consistency)
        const normalizedEmail = email.trim().toLowerCase();

        // Check if user already exists
        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Delete any existing unverified OTPs for this email
        await OTP.deleteMany({ email: normalizedEmail, verified: false });

        // Generate new OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Save OTP to database (with normalized email)
        await OTP.create({
            email: normalizedEmail,
            otp,
            expiresAt
        });

        // Return response immediately (don't wait for email)
        // In development, include OTP for testing (if email fails)
        const responseData = {
            message: 'OTP sent successfully to your email',
            email: normalizedEmail // Return normalized email for frontend confirmation
        };

        // In development mode, include OTP in response for testing
        if (process.env.NODE_ENV === 'development') {
            responseData.devOTP = otp; // Include OTP for testing when email fails
            console.log(`🔑 Dev Mode - OTP for ${normalizedEmail}: ${otp}`);
        }

        res.status(200).json(responseData);

        // Send OTP via email asynchronously (fire and forget)
        // This prevents blocking the response while email is being sent
        console.log(`📧 Attempting to send OTP email to ${normalizedEmail}...`);
        emailService.sendOTP(normalizedEmail, otp).then(() => {
            console.log(`✓ Registration OTP sent successfully to ${normalizedEmail}`);
        }).catch((emailError) => {
            console.error('✗ Registration OTP email sending failed (async):', emailError);
            console.error('✗ Error details:', {
                code: emailError.code,
                message: emailError.message,
                response: emailError.response,
                responseCode: emailError.responseCode
            });
            
            // Log error but don't fail the request since OTP is already saved
            // User can request a new OTP if email doesn't arrive
            
            // Always log OTP for debugging (especially useful when email fails)
            console.warn(`⚠ OTP for ${normalizedEmail} (email failed): ${otp}`);
            console.warn(`⚠ Users can still verify with this OTP if they have it`);
            
            // Log specific error types for debugging
            const isRateLimit = emailError.message?.includes('rate limit') || 
                               emailError.message?.includes('rate limited');
            const isConnectionTimeout = emailError.code === 'ETIMEDOUT' || 
                                       emailError.code === 'ECONNRESET' ||
                                       emailError.message?.includes('Connection timeout');
            const isBadCredentials = emailError.message?.includes('BadCredentials') || 
                                    emailError.message?.includes('Username and Password not accepted') ||
                                    emailError.message?.includes('Email authentication failed');
            
            if (isConnectionTimeout) {
                console.error('⚠ Connection timeout - Railway may be blocking SMTP. Check Railway logs.');
            } else if (isRateLimit) {
                console.warn('⚠ Email rate limited - user can retry after delay');
            } else if (isBadCredentials) {
                console.error('⚠ Email authentication failed - check SMTP credentials in Railway');
            } else {
                console.error('⚠ Email sending failed:', emailError.message);
            }
        });
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

        // Normalize email (lowercase for consistency) - MUST match sendOTP normalization
        const normalizedEmail = email.trim().toLowerCase();

        // Find the OTP record (use normalized email)
        const otpRecord = await OTP.findOne({
            email: normalizedEmail,
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

        // Check if user already exists (double-check, use normalized email)
        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Mark OTP as verified
        otpRecord.verified = true;
        await otpRecord.save();

        // Create user with verified email (use normalized email)
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
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

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Name is required' });
        }
        if (!email || !email.trim()) {
            return res.status(400).json({ message: 'Email is required' });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Normalize email (lowercase for consistency)
        const normalizedEmail = email.trim().toLowerCase();

        // Validate email format
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Create user
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
            emailVerified: true, // No OTP verification needed
            emailVerifiedAt: new Date()
        });

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
        console.error('Register error:', error);
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

// @desc    Forgot password - send reset email (DISABLED - SMTP limit reached)
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    return res.status(503).json({ 
        message: 'Forgot password functionality has been temporarily disabled due to SMTP service limits. Please contact support or try again later.',
        reason: 'SMTP limit reached'
    });
};

// @desc    Reset password with token (DISABLED - SMTP limit reached)
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    return res.status(503).json({ 
        message: 'Password reset functionality has been temporarily disabled due to SMTP service limits. Please contact support or try again later.',
        reason: 'SMTP limit reached'
    });
};

// OLD CODE - DISABLED
const _resetPassword_OLD = async (req, res) => {
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

// @desc    Send OTP for email update verification (REMOVED - email editing disabled)
// @route   POST /api/auth/send-email-update-otp
// @access  Private
exports.sendEmailUpdateOTP = async (req, res) => {
    return res.status(410).json({ message: 'Email editing has been disabled. Users can only change their password.' });
};

// @desc    Verify OTP and update email (REMOVED - email editing disabled)
// @route   PUT /api/auth/update-email
// @access  Private
exports.updateEmail = async (req, res) => {
    return res.status(410).json({ message: 'Email editing has been disabled. Users can only change their password.' });
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
