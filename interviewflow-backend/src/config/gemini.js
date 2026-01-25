const { GoogleGenerativeAI } = require('@google/generative-ai');

// Validate API key
if (!process.env.GEMINI_API_KEY) {
    console.error('WARNING: GEMINI_API_KEY is not set in environment variables!');
    console.error('Please set GEMINI_API_KEY in your .env file');
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Model priority list (most basic/available first, then newer models)
const MODEL_PRIORITY = [
    'gemini-pro',                 // Most basic, should be available on all keys
    'gemini-1.5-flash',           // Fast, widely available
    'gemini-1.5-pro',             // High quality
    'gemini-2.0-flash',           // Newer stable
    'gemini-2.5-flash-preview',   // Latest preview
    'gemini-2.5-pro-preview',     // Latest preview
];

// Determine which model to use
// Default to gemini-pro (most basic and widely available)
// You can override by setting GEMINI_MODEL in .env
let modelName = process.env.GEMINI_MODEL;
let model = null;
let modelInitialized = false;

/**
 * Initialize the model
 * This creates a model instance but doesn't test it (testing happens on first use)
 */
async function initializeModel() {
    if (modelInitialized && model) return model;
    
    try {
        // Use specified model or default
        if (!modelName) {
            modelName = process.env.GEMINI_MODEL || 'gemini-pro';
        }
        
        console.log(`Initializing Gemini model: ${modelName}`);
        
        // Create model
        model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.7,
                topP: 0.95,
                topK: 40,
            }
        });
        
        modelInitialized = true;
        console.log(`✓ Model instance created: ${modelName}`);
        return model;
    } catch (error) {
        console.error('Error initializing Gemini model:', error);
        // Fallback to gemini-pro
        modelName = 'gemini-pro';
        model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.7,
            }
        });
        modelInitialized = true;
        console.log(`Using fallback model: ${modelName}`);
        return model;
    }
}

// Initialize model name (actual model instance will be created lazily)
if (!modelName) {
    modelName = process.env.GEMINI_MODEL || 'gemini-pro';
}
console.log(`Gemini model configured: ${modelName} (will be initialized on first use)`);

/**
 * Discover and return available models for this API key
 * Since listModels() isn't available in the SDK, we test models by trying to use them
 * This is a lightweight test that just checks if the model can be instantiated
 */
async function discoverAvailableModels() {
    const available = [];
    
    // Test each model in priority order with a minimal test
    for (const modelName of MODEL_PRIORITY) {
        try {
            const testModel = genAI.getGenerativeModel({ 
                model: modelName,
                generationConfig: {
                    maxOutputTokens: 1, // Minimal test
                }
            });
            // Try a very minimal test call (just to see if model exists)
            // Use a very short prompt to minimize API usage
            const testResult = await testModel.generateContent('Hi');
            // If we get here, the model works
            available.push({
                name: modelName,
                displayName: modelName,
                supportedMethods: ['generateContent']
            });
            console.log(`✓ Model ${modelName} is available`);
        } catch (error) {
            // Model not available or error accessing it, skip it
            // Don't log every failure to avoid spam
            continue;
        }
    }
    
    return available;
}

/**
 * Find the first available model from priority list
 */
async function findAvailableModel() {
    const available = await discoverAvailableModels();
    const availableNames = available.map(m => m.name);
    
    for (const modelName of MODEL_PRIORITY) {
        if (availableNames.includes(modelName)) {
            console.log(`Found available model: ${modelName}`);
            return modelName;
        }
    }
    
    // If none found, return first available or default
    if (available.length > 0) {
        console.log(`Using first available model: ${available[0].name}`);
        return available[0].name;
    }
    
    console.warn('No models found, using default: gemini-pro');
    return 'gemini-pro';
}

// Export functions and constants
// Note: model will be initialized asynchronously, use getModel() to access it
const geminiModule = {
    initializeModel,
    discoverAvailableModels,
    findAvailableModel,
    MODEL_PRIORITY,
    getModel: async () => {
        if (!modelInitialized) {
            await initializeModel();
        }
        return model;
    }
};

// For backward compatibility, also export model directly (may be null initially)
// But prefer using getModel() instead
Object.defineProperty(geminiModule, 'model', {
    get: () => model,
    enumerable: true
});

module.exports = geminiModule;
