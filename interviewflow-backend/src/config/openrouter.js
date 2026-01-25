// OpenRouter API Configuration
// OpenRouter provides unified access to multiple AI models

// OpenRouter API endpoint
const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

// Validate API key (with better error message)
if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.trim() === '') {
    console.error('WARNING: OPENROUTER_API_KEY is not set in environment variables!');
    console.error('Please set OPENROUTER_API_KEY in your .env file');
    console.error('Make sure to restart your server after updating .env file');
} else {
    console.log(`✓ OpenRouter API key configured (length: ${OPENROUTER_API_KEY.length})`);
}

// Recommended models for interview evaluation (in priority order)
// OpenRouter supports many models - these are good choices for structured outputs
const MODEL_PRIORITY = [
    'anthropic/claude-3.5-sonnet',  // Excellent for structured outputs and reasoning
    'openai/gpt-4o',                 // Great for complex evaluations
    'anthropic/claude-3-opus',       // High quality reasoning
    'google/gemini-pro-1.5',         // Good alternative
    'openai/gpt-4-turbo',            // Reliable fallback
    'anthropic/claude-3-sonnet',     // Good balance
    'meta-llama/llama-3.1-70b-instruct', // Open source option
];

// Default model - Claude 3.5 Sonnet is excellent for structured JSON outputs
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';

// Determine which model to use
let modelName = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

console.log(`OpenRouter model configured: ${modelName}`);

/**
 * Initialize the model (no-op for REST API, but kept for compatibility)
 */
async function initializeModel() {
    console.log(`OpenRouter API initialized with model: ${modelName}`);
    return { model: modelName, apiKey: OPENROUTER_API_KEY };
}

/**
 * Discover available models
 * OpenRouter has a models endpoint, but for simplicity we'll use known good models
 */
async function discoverAvailableModels() {
    // OpenRouter supports many models
    // Return the recommended models for this use case
    return MODEL_PRIORITY.map(name => ({
        name: name,
        displayName: name,
        supportedMethods: ['chat', 'completions']
    }));
}

/**
 * Find the first available model from priority list
 */
async function findAvailableModel() {
    // For OpenRouter, we'll return the default model
    // In practice, you could test each one, but OpenRouter models are generally available
    return DEFAULT_MODEL;
}

/**
 * Get the active model
 */
async function getModel() {
    return {
        model: modelName,
        apiKey: OPENROUTER_API_KEY,
        baseURL: OPENROUTER_API_BASE
    };
}

// Export functions and constants
const openrouterModule = {
    initializeModel,
    discoverAvailableModels,
    findAvailableModel,
    MODEL_PRIORITY,
    getModel,
    DEFAULT_MODEL,
    OPENROUTER_API_BASE,
    OPENROUTER_API_KEY
};

module.exports = openrouterModule;
