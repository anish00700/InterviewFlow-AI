const { GoogleGenerativeAI } = require('@google/generative-ai');
const geminiModule = require('./gemini');
const findAvailableModel = geminiModule.findAvailableModel;
const discoverAvailableModels = geminiModule.discoverAvailableModels;
const MODEL_PRIORITY = geminiModule.MODEL_PRIORITY;

/**
 * Sleep/delay helper for retries
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable (rate limit, quota, temporary errors)
 */
function isRetryableError(error) {
    const message = error.message || '';
    return (
        message.includes('429') ||
        message.includes('rate limit') ||
        message.includes('quota') ||
        message.includes('Too Many Requests') ||
        message.includes('503') ||
        message.includes('500') ||
        message.includes('timeout')
    );
}

/**
 * Get retry delay based on attempt number (exponential backoff)
 */
function getRetryDelay(attempt, baseDelay = 1000) {
    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000);
    // Add jitter to avoid thundering herd
    const jitter = Math.random() * 0.3 * delay;
    return delay + jitter;
}

// Cache for available model to avoid repeated discovery
let cachedAvailableModel = null;

/**
 * Generate content with automatic fallback to available models and retry logic
 * This ensures the system works even if the configured model isn't available
 * Includes retry logic for rate limits and temporary errors
 */
async function generateContentWithFallback(prompt, maxRetries = 3) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Ensure model is initialized and get the active model
    const { getModel, initializeModel } = require('./gemini');
    let activeModel;
    let activeModelName;
    
    try {
        // Try to get initialized model
        activeModel = await getModel();
        // Get the model name from the initialized model
        activeModelName = process.env.GEMINI_MODEL || 'gemini-pro';
    } catch (err) {
        // If initialization failed, try to initialize now
        console.warn('Model not initialized, initializing now...');
        activeModel = await initializeModel();
        activeModelName = process.env.GEMINI_MODEL || 'gemini-pro';
    }
    
    // Log API call attempt
    console.log(`[Gemini API] Calling model: ${activeModelName}`);
    
    // Try the configured model first with retry logic
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                const delay = getRetryDelay(attempt - 1);
                console.log(`[Gemini API] Retry attempt ${attempt}/${maxRetries} after ${Math.round(delay)}ms delay...`);
                await sleep(delay);
            }
            
            const result = await activeModel.generateContent(prompt);
            console.log(`[Gemini API] Successfully called model: ${activeModelName}`);
            return result;
        } catch (error) {
            console.error(`[Gemini API] Error with model ${activeModelName} (attempt ${attempt + 1}):`, error.message);
            
            // If it's a retryable error (rate limit/quota) and we have retries left, continue
            if (isRetryableError(error) && attempt < maxRetries) {
                continue; // Will retry with exponential backoff
            }
            
            // If it's a model not found error, try fallback models
            if (error.message?.includes('not found') || 
                error.message?.includes('404') ||
                error.message?.includes('is not found for API version')) {
                break; // Exit retry loop, will try fallback models below
            }
            
            // If it's a quota/rate limit error and we've exhausted retries, throw with helpful message
            if (isRetryableError(error) && attempt >= maxRetries) {
                throw new Error(`API quota/rate limit exceeded after ${maxRetries + 1} attempts. Please check your Gemini API quota at https://ai.dev/rate-limit. You may need to upgrade your plan or wait before trying again. Original error: ${error.message}`);
            }
            
            // For other errors, throw immediately
            throw error;
        }
    }
    
    // If we get here, the model wasn't found, try fallback models
    console.warn(`Model ${activeModelName} not available, discovering available models...`);
    
    // Find an available model
    if (!cachedAvailableModel) {
        try {
            cachedAvailableModel = await findAvailableModel();
        } catch (discoverError) {
            console.error('Error discovering models:', discoverError.message);
            // Try to discover available models directly
            const available = await discoverAvailableModels();
            if (available.length > 0) {
                cachedAvailableModel = available[0].name;
                console.log(`Using first discovered model: ${cachedAvailableModel}`);
            } else {
                cachedAvailableModel = 'gemini-pro';
            }
        }
    }
    
    if (cachedAvailableModel === activeModelName) {
        // Already tried the available model, try any available model
        const available = await discoverAvailableModels();
        if (available.length > 0) {
            cachedAvailableModel = available[0].name;
            console.log(`Trying first available model: ${cachedAvailableModel}`);
        } else {
            throw new Error(`No Gemini models are available for your API key. Please check your API key at https://ai.dev/rate-limit or verify your API access. Available models would be listed at https://ai.google.dev/gemini-api/docs/models`);
        }
    }
    
    console.log(`Trying fallback model: ${cachedAvailableModel}`);
    
    // Try the discovered available model with retry logic
    const fallbackModel = genAI.getGenerativeModel({
        model: cachedAvailableModel,
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
        }
    });
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                const delay = getRetryDelay(attempt - 1);
                console.log(`[Gemini API] Fallback retry attempt ${attempt}/${maxRetries} after ${Math.round(delay)}ms delay...`);
                await sleep(delay);
            }
            
            const result = await fallbackModel.generateContent(prompt);
            console.log(`Successfully using fallback model: ${cachedAvailableModel}`);
            return result;
        } catch (fallbackError) {
            if (isRetryableError(fallbackError) && attempt < maxRetries) {
                continue; // Retry
            }
            
            // If fallback also fails, try other models in priority list
            if (attempt >= maxRetries) {
                console.error(`Fallback model ${cachedAvailableModel} also failed, trying other models...`);
                
                for (const tryModel of MODEL_PRIORITY) {
                    if (tryModel === activeModelName || tryModel === cachedAvailableModel) continue;
                    
                    try {
                        const testModel = genAI.getGenerativeModel({
                            model: tryModel,
                            generationConfig: {
                                responseMimeType: "application/json",
                                temperature: 0.7,
                            }
                        });
                        const result = await testModel.generateContent(prompt);
                        console.log(`Successfully using model: ${tryModel}`);
                        cachedAvailableModel = tryModel; // Cache the working model
                        return result;
                    } catch (e) {
                        console.warn(`Model ${tryModel} also not available: ${e.message}`);
                        continue;
                    }
                }
                
                throw new Error(`No available Gemini models found. Please check your API key and model availability.`);
            }
        }
    }
    
    throw new Error(`Failed to generate content after trying multiple models and retries.`);
}

module.exports = {
    generateContentWithFallback
};
