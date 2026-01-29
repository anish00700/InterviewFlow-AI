const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars FIRST before requiring passport
dotenv.config();

const passport = require('./config/passport');

const connectDB = require('./config/db');
const { initializeModel } = require('./config/github-models');

// Connect to database
connectDB();

// Initialize GitHub Models on startup
if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim() !== '') {
    initializeModel().then(() => {
        console.log('✓ GitHub Models API initialization complete');
    }).catch(err => {
        console.error('✗ GitHub Models API initialization failed:', err.message);
        console.error('The system will attempt to use GitHub Models API on first use.');
    });
} else {
    console.warn('⚠ GITHUB_TOKEN not set - GitHub Models API features will not work');
    console.warn('⚠ Make sure GITHUB_TOKEN is set in your .env file and restart the server');
    console.warn('⚠ Token must have models:read permissions');
}

const app = express();

// Middleware - CORS configuration
// Allow multiple origins for development and production
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173', // Local development
    'https://interview-flow-ai-oewj.vercel.app', // Vercel deployment
    // Add any other frontend URLs here
].filter(Boolean); // Remove undefined values

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // In development, allow all origins
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        
        // In production, only allow whitelisted origins
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(passport.initialize());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/interview', require('./routes/interview.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/resume', require('./routes/resume.routes'));

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Diagnostic endpoint to check API configuration
app.get('/api/diagnostics', async (req, res) => {
    const { discoverAvailableModels, findAvailableModel, MODEL_PRIORITY, DEFAULT_MODEL, GITHUB_MODELS_ENDPOINT } = require('./config/github-models');
    const emailService = require('./services/email.service');
    
    const hasToken = !!process.env.GITHUB_TOKEN;
    const tokenLength = process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN.length : 0;
    const currentModel = process.env.GITHUB_MODEL || DEFAULT_MODEL;
    
    let availableModels = [];
    let recommendedModel = null;
    let modelTest = { status: 'not_tested', error: null };
    
    if (hasToken) {
        try {
            // Discover available models
            availableModels = await discoverAvailableModels();
            
            // Find recommended model
            try {
                recommendedModel = await findAvailableModel();
            } catch (e) {
                console.error('Error finding available model:', e);
            }
            
            // Test if current model works
            try {
                const { generateContentWithFallback } = require('./config/github-models-helper');
                await generateContentWithFallback('test', { max_tokens: 10 });
                modelTest = { status: 'working', model: currentModel };
            } catch (testError) {
                modelTest = { 
                    status: 'error', 
                    model: currentModel,
                    error: testError.message 
                };
            }
        } catch (error) {
            modelTest = { status: 'error', error: error.message };
        }
    }
    
    // Check email service configuration
    const emailConfig = {
        smtpHost: process.env.SMTP_HOST || 'not set',
        smtpPort: process.env.SMTP_PORT || 'not set',
        smtpUser: process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 5)}...` : 'not set',
        smtpPass: process.env.SMTP_PASS ? '***configured***' : 'not set',
        transporterConfigured: !!emailService.transporter
    };
    
    // Test email service if configured
    let emailTest = { status: 'not_tested', message: null };
    if (emailService.transporter) {
        try {
            emailTest = await emailService.verifyEmailConfig();
        } catch (error) {
            emailTest = { 
                status: 'error', 
                message: error.message || 'Email service verification failed' 
            };
        }
    } else {
        emailTest = {
            status: 'not_configured',
            message: 'SMTP_USER and/or SMTP_PASS not set in environment variables'
        };
    }
    
    res.status(200).json({
        status: 'ok',
        githubModels: {
            tokenConfigured: hasToken,
            tokenLength: hasToken ? tokenLength : 0,
            tokenPreview: hasToken ? `${process.env.GITHUB_TOKEN.substring(0, 10)}...` : 'Not set',
            currentModel: currentModel,
            recommendedModel: recommendedModel,
            modelTest: modelTest,
            availableModels: availableModels,
            modelPriority: MODEL_PRIORITY,
            endpoint: GITHUB_MODELS_ENDPOINT,
            note: 'Token must have models:read permissions'
        },
        emailService: {
            ...emailConfig,
            test: emailTest,
            note: 'For Gmail, use App Password (not regular password). See EMAIL_TROUBLESHOOTING.md'
        },
        timestamp: new Date()
    });
});

module.exports = app;
