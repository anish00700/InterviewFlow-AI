const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    getMe, 
    googleAuth,
    googleCallback,
    githubAuth,
    githubCallback,
    forgotPassword,
    resetPassword,
    updatePassword
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Registration (no OTP required)
router.post('/register', register);

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
router.put('/update-password', protect, updatePassword);

module.exports = router;
