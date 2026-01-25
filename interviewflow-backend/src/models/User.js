const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: function() {
            // Password required only for local (non-OAuth) users
            const provider = this.provider || 'local';
            return provider === 'local';
        },
        minlength: 6,
        select: false // Don't return password by default
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerifiedAt: {
        type: Date
    },
    // OAuth provider information
    provider: {
        type: String,
        enum: ['local', 'google', 'github'],
        default: 'local'
    },
    providerId: {
        type: String // OAuth provider user ID
    },
    avatar: {
        type: String // Profile picture URL from OAuth
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password using bcrypt (only for local users)
UserSchema.pre('save', async function () {
    // Skip password hashing for OAuth users or if password not modified
    if (!this.isModified('password') || this.provider !== 'local') {
        return;
    }

    // Only hash if password exists and is not already hashed
    if (this.password && !this.password.startsWith('$2')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
