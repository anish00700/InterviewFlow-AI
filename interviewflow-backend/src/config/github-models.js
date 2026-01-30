// GitHub Models API Configuration (Azure AI Inference)
// GitHub Models provides access to AI models through Azure

// Validate API key
if (!process.env.GITHUB_TOKEN) {
    console.error('WARNING: GITHUB_TOKEN is not set in environment variables!');
    console.error('Please set GITHUB_TOKEN in your .env file');
    console.error('Make sure the token has models:read permissions');
}

// GitHub Models API endpoint
const GITHUB_MODELS_ENDPOINT = 'https://models.github.ai/inference';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

// Available models (you can use any model available through GitHub Models)
// Note: These are common model identifiers - actual available models may vary
// The system will try to discover available models from the catalog API
const MODEL_PRIORITY = [
    'openai/gpt-4o',                   // OpenAI GPT-4o (default)
    'openai/gpt-4o-mini',              // OpenAI GPT-4o mini (fallback)
    'openai/gpt-4-turbo',              // OpenAI GPT-4 Turbo
    'anthropic/claude-3-5-sonnet',     // Claude 3.5 Sonnet
    'anthropic/claude-3-opus',         // Claude 3 Opus
    'google/gemini-pro-1.5',           // Google Gemini
    'meta-llama/llama-3.1-70b-instruct', // Llama 3.1
    'ai21-labs/AI21-Jamba-1.5-Large',  // AI21 Jamba (original format)
    'ai21-labs/ai21-jamba-1.5-large',  // AI21 Jamba (lowercase)
    // Add other models as needed
];

// Default model - GPT-4o
const DEFAULT_MODEL = process.env.GITHUB_MODEL || 'openai/gpt-4o';

// Determine which model to use
let modelName = process.env.GITHUB_MODEL || DEFAULT_MODEL;

console.log(`GitHub Models configured: ${modelName}`);

// Validate API key (with better error message)
if (!GITHUB_TOKEN || GITHUB_TOKEN.trim() === '') {
    console.error('WARNING: GITHUB_TOKEN is not set in environment variables!');
    console.error('Please set GITHUB_TOKEN in your .env file');
    console.error('Make sure to restart your server after updating .env file');
    console.error('Token must have models:read permissions');
} else {
    console.log(`✓ GitHub token configured (length: ${GITHUB_TOKEN.length})`);
}

/**
 * Initialize the model (no-op for REST API, but kept for compatibility)
 */
async function initializeModel() {
    console.log(`GitHub Models API initialized with model: ${modelName}`);
    return { model: modelName, token: GITHUB_TOKEN };
}

/**
 * Discover available models from GitHub Models catalog
 */
async function discoverAvailableModels() {
    // Check if fetch is available (Node.js 18+)
    const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
    
    try {
        // Try to fetch from GitHub Models catalog API
        const response = await fetchFn('https://models.github.ai/catalog/models', {
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'X-GitHub-Api-Version': '2022-11-28',
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const models = await response.json();
            console.log(`✓ Found ${models.length} available models from GitHub Models catalog`);
            // Extract model IDs and add to priority list
            const availableModelIds = models.map(m => m.id || m.name).filter(Boolean);
            if (availableModelIds.length > 0) {
                console.log(`Available model IDs: ${availableModelIds.slice(0, 5).join(', ')}${availableModelIds.length > 5 ? '...' : ''}`);
            }
            return models.map(m => ({
                id: m.id || m.name,
                name: m.name || m.id,
                displayName: m.name || m.id,
                publisher: m.publisher,
                supportedMethods: ['chat', 'completions']
            }));
        } else {
            const errorText = await response.text().catch(() => '');
            console.warn(`Could not fetch models catalog (${response.status}), using fallback list. Error: ${errorText}`);
        }
    } catch (error) {
        console.warn('Error fetching models catalog:', error.message);
        console.warn('Using fallback model list. You can check available models at: https://models.github.ai');
    }
    
    // Fallback: Return known models
    return MODEL_PRIORITY.map(name => ({
        id: name,
        name: name,
        displayName: name,
        supportedMethods: ['chat', 'completions']
    }));
}

/**
 * Find the first available model from priority list
 */
async function findAvailableModel() {
    // For GitHub Models, we'll return the default model
    return DEFAULT_MODEL;
}

/**
 * Get the active model
 */
async function getModel() {
    return {
        model: modelName,
        token: GITHUB_TOKEN,
        endpoint: GITHUB_MODELS_ENDPOINT
    };
}

// Export functions and constants
const githubModelsModule = {
    initializeModel,
    discoverAvailableModels,
    findAvailableModel,
    MODEL_PRIORITY,
    getModel,
    DEFAULT_MODEL,
    GITHUB_MODELS_ENDPOINT,
    GITHUB_TOKEN
};

module.exports = githubModelsModule;
