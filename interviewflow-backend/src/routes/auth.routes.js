const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    getMe, 
    sendOTP, 
    verifyOTP,
    googleAuth,
    googleCallback,
    githubAuth,
    githubCallback,
    forgotPassword,
    resetPassword,
    sendEmailUpdateOTP,
    updateEmail,
    updatePassword
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// OTP-based registration
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/register', register); // Legacy endpoint

// Traditional login
router.post('/login', login);

// Password reset
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.get('/github', githubAuth);
router.get('/github/callback', githubCallback);

// Protected routes
router.get('/me', protect, getMe);
router.post('/send-email-update-otp', protect, sendEmailUpdateOTP);
router.put('/update-email', protect, updateEmail);
router.put('/update-password', protect, updatePassword);

module.exports = router;
