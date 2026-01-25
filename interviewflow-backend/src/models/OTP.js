const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        index: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 } // Auto-delete expired OTPs
    },
    attempts: {
        type: Number,
        default: 0,
        max: 5 // Max 5 verification attempts
    },
    verified: {
        type: Boolean,
        default: false
    },
    userId: {
        type: String, // For email update context
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster lookups
OTPSchema.index({ email: 1, verified: 1 });

module.exports = mongoose.model('OTP', OTPSchema);
