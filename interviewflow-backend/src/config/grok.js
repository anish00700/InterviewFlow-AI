// Grok API Configuration (xAI)
// Grok API is compatible with OpenAI API format

// Validate API key
if (!process.env.GROK_API_KEY) {
    console.error('WARNING: GROK_API_KEY is not set in environment variables!');
    console.error('Please set GROK_API_KEY in your .env file');
}

// Grok API endpoint (OpenAI-compatible)
const GROK_API_BASE = 'https://api.x.ai/v1';
const GROK_API_KEY = process.env.GROK_API_KEY || '';

// Available Grok models
// Note: Check https://docs.x.ai/docs/models for latest model names
// Common model names: grok-beta, grok-2, grok-2-1212
const MODEL_PRIORITY = [
    'grok-beta',           // Main Grok model (128k context) - most common
    'grok-2',              // Alternative naming
    'grok-2-1212',        // Versioned model if available
];

// Default model
const DEFAULT_MODEL = 'grok-beta';

// Determine which model to use
let modelName = process.env.GROK_MODEL || DEFAULT_MODEL;

console.log(`Grok model configured: ${modelName}`);

/**
 * Initialize the model (no-op for REST API, but kept for compatibility)
 */
async function initializeModel() {
    console.log(`Grok API initialized with model: ${modelName}`);
    return { model: modelName, apiKey: GROK_API_KEY };
}

/**
 * Discover available models
 * Grok API doesn't have a list endpoint, so we return the known models
 */
async function discoverAvailableModels() {
    // Grok API doesn't provide a list endpoint
    // Return the known available models
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
    // For Grok, we'll just return the default model
    // In practice, you'd test each one, but for now we'll use grok-beta
    return DEFAULT_MODEL;
}

/**
 * Get the active model
 */
async function getModel() {
    return {
        model: modelName,
        apiKey: GROK_API_KEY,
        baseURL: GROK_API_BASE
    };
}

// Export functions and constants
const grokModule = {
    initializeModel,
    discoverAvailableModels,
    findAvailableModel,
    MODEL_PRIORITY,
    getModel,
    DEFAULT_MODEL,
    GROK_API_BASE,
    GROK_API_KEY
};

module.exports = grokModule;
