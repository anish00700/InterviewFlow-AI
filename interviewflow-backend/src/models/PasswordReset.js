const mongoose = require('mongoose');
const crypto = require('crypto');

const PasswordResetSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        index: true
    },
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 } // Auto-delete expired tokens
    },
    used: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Generate reset token
PasswordResetSchema.statics.generateToken = function() {
    return crypto.randomBytes(32).toString('hex');
};

// Create reset token for user
PasswordResetSchema.statics.createResetToken = async function(email) {
    // Delete any existing reset tokens for this email
    await this.deleteMany({ email, used: false });
    
    // Generate token
    const token = this.generateToken();
    
    // Set expiration to 1 hour from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    // Create and save
    const resetToken = await this.create({
        email,
        token,
        expiresAt
    });
    
    return resetToken;
};

// Verify and mark token as used
PasswordResetSchema.statics.verifyAndUseToken = async function(token) {
    const resetToken = await this.findOne({ 
        token, 
        used: false,
        expiresAt: { $gt: new Date() }
    });
    
    if (!resetToken) {
        return null;
    }
    
    // Mark as used
    resetToken.used = true;
    await resetToken.save();
    
    return resetToken;
};

module.exports = mongoose.model('PasswordReset', PasswordResetSchema);
