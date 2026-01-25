const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user exists with this Google ID
            let user = await User.findOne({ 
                $or: [
                    { providerId: profile.id, provider: 'google' },
                    { email: profile.emails[0].value }
                ]
            });

            if (user) {
                // Update existing user with OAuth info if needed
                if (!user.providerId) {
                    user.provider = 'google';
                    user.providerId = profile.id;
                    user.emailVerified = true;
                    user.emailVerifiedAt = new Date();
                    if (profile.photos && profile.photos[0]) {
                        user.avatar = profile.photos[0].value;
                    }
                    await user.save();
                }
            } else {
                // Create new user
                user = await User.create({
                    name: profile.displayName || profile.name.givenName + ' ' + profile.name.familyName,
                    email: profile.emails[0].value,
                    provider: 'google',
                    providerId: profile.id,
                    emailVerified: true,
                    emailVerifiedAt: new Date(),
                    avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined,
                    password: 'oauth-user-' + Date.now() // Dummy password for OAuth users
                });
            }

            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));
} else {
    console.warn('⚠ Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
}

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // GitHub profile structure
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : 
                         profile.username + '@github.local'; // Fallback if email not provided
            
            // Check if user exists with this GitHub ID
            let user = await User.findOne({ 
                $or: [
                    { providerId: profile.id.toString(), provider: 'github' },
                    { email: email }
                ]
            });

            if (user) {
                // Update existing user with OAuth info if needed
                if (!user.providerId) {
                    user.provider = 'github';
                    user.providerId = profile.id.toString();
                    user.emailVerified = true;
                    user.emailVerifiedAt = new Date();
                    if (profile.photos && profile.photos[0]) {
                        user.avatar = profile.photos[0].value;
                    }
                    await user.save();
                }
            } else {
                // Create new user
                user = await User.create({
                    name: profile.displayName || profile.username,
                    email: email,
                    provider: 'github',
                    providerId: profile.id.toString(),
                    emailVerified: true,
                    emailVerifiedAt: new Date(),
                    avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined,
                    password: 'oauth-user-' + Date.now() // Dummy password for OAuth users
                });
            }

            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));
} else {
    console.warn('⚠ GitHub OAuth not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env');
}

module.exports = passport;
