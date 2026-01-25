// GitHub Models API Helper - Azure AI Inference wrapper
// Note: These packages need to be installed: @azure-rest/ai-inference, @azure/core-auth
let ModelClient, isUnexpected, AzureKeyCredential;

try {
    const aiInference = require('@azure-rest/ai-inference');
    // ModelClient is the default export, isUnexpected is a named export
    ModelClient = aiInference.default;
    isUnexpected = aiInference.isUnexpected;
    AzureKeyCredential = require('@azure/core-auth').AzureKeyCredential;
} catch (error) {
    console.error('ERROR: Azure AI Inference packages not installed!');
    console.error('Please run: npm install @azure-rest/ai-inference @azure/core-auth @azure/core-sse');
    console.error('Error:', error.message);
}

const githubModelsModule = require('./github-models');
const { GITHUB_MODELS_ENDPOINT, GITHUB_TOKEN } = githubModelsModule;
const MODEL_PRIORITY = githubModelsModule.MODEL_PRIORITY;
const DEFAULT_MODEL = githubModelsModule.DEFAULT_MODEL;

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
    const status = error.status || error.statusCode || '';
    return (
        status === 429 ||
        status === 503 ||
        status === 500 ||
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

/**
 * Generate content using GitHub Models API (Azure AI Inference)
 * @param {string} prompt - The prompt to send to the model
 * @param {object} options - Additional options (temperature, max_tokens, response_format, etc.)
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<object>} - Response object with text content
 */
async function generateContentWithFallback(prompt, options = {}, maxRetries = 3) {
    // Check if packages are installed
    if (!ModelClient || !isUnexpected || !AzureKeyCredential) {
        throw new Error('Azure AI Inference packages not installed. Please run: npm install @azure-rest/ai-inference @azure/core-auth @azure/core-sse');
    }
    
    // Check API key first
    if (!GITHUB_TOKEN || GITHUB_TOKEN.trim() === '') {
        throw new Error('GITHUB_TOKEN is not configured. Please set it in your .env file and restart the server.');
    }
    
    // Use fallback model if provided, otherwise use configured model
    let modelName = options._fallbackModel || process.env.GITHUB_MODEL || DEFAULT_MODEL;
    const temperature = options.temperature || 0.7;
    const maxTokens = options.max_tokens || 1500; // Default reduced for credit limits
    const responseFormat = options.response_format;
    
    // Log API call attempt
    console.log(`[GitHub Models] Calling model: ${modelName}`);
    
    // Create the client
    const client = ModelClient(
        GITHUB_MODELS_ENDPOINT,
        new AzureKeyCredential(GITHUB_TOKEN)
    );
    
    // Prepare the request body
    // Note: Model name should match exactly what GitHub Models expects
    const requestBody = {
        messages: [
            {
                role: 'user',
                content: prompt
            }
        ],
        model: modelName,  // Use the model name as-is
        temperature: temperature,
        max_tokens: maxTokens
    };
    
    // Add response_format if requested (if supported by the model)
    if (responseFormat && responseFormat.type === 'json_object') {
        // Note: GitHub Models may not support response_format the same way
        // We'll add it but handle errors gracefully
        requestBody.response_format = responseFormat;
    }
    
    // Try with retry logic
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                const delay = getRetryDelay(attempt - 1);
                console.log(`[GitHub Models] Retry attempt ${attempt}/${maxRetries} after ${Math.round(delay)}ms delay...`);
                await sleep(delay);
            }
            
            const response = await client.path("/chat/completions").post({
                body: requestBody
            });
            
            if (isUnexpected(response)) {
                const errorData = response.body?.error || {};
                const errorMessage = errorData.message || `HTTP ${response.status}: Unexpected response`;
                const error = new Error(errorMessage);
                error.status = response.status;
                error.statusCode = response.status;
                error.details = errorData;
                
                // Log detailed error for debugging
                console.error(`[GitHub Models] Error details:`, {
                    status: response.status,
                    error: errorData
                });
                
                // If it's a retryable error and we have retries left, continue
                if (isRetryableError(error) && attempt < maxRetries) {
                    continue;
                }
                
                // If it's an auth error, throw immediately
                if (response.status === 401 || response.status === 403) {
                    throw new Error(`API authentication failed. Please check your GitHub token has models:read permissions. Status: ${response.status}`);
                }
                
                // For 400 errors, provide more context
                if (response.status === 400) {
                    // Check if it's a model name issue
                    if (errorData.message?.toLowerCase().includes('unknown model') || 
                        errorData.message?.toLowerCase().includes('model') && 
                        (errorData.message?.toLowerCase().includes('not found') || 
                         errorData.message?.toLowerCase().includes('invalid'))) {
                        const modelError = new Error(`Model '${modelName}' not found. Please check available models. Error: ${errorMessage}`);
                        modelError.isModelError = true;
                        throw modelError;
                    }
                    // Check if it's a credit limit issue
                    if (errorData.message?.toLowerCase().includes('credit') || 
                        errorData.message?.toLowerCase().includes('afford') ||
                        errorData.message?.toLowerCase().includes('max_tokens')) {
                        const creditError = new Error(errorMessage);
                        creditError.isCreditLimit = true;
                        throw creditError;
                    }
                    throw new Error(`Bad Request: ${errorMessage}. Please check your request format and parameters.`);
                }
                
                throw error;
            }
            
            // Extract the content from the response
            const content = response.body.choices?.[0]?.message?.content;
            if (!content) {
                throw new Error('No content in API response');
            }
            
            console.log(`[GitHub Models] Successfully called model: ${modelName}`);
            
            // Return in a format compatible with existing code
            return {
                response: {
                    text: () => content,
                    textAsync: async () => content
                },
                responseText: content
            };
            
        } catch (error) {
            console.error(`[GitHub Models] Error with model ${modelName} (attempt ${attempt + 1}):`, error.message);
            
            // If it's a model name error, try fallback models (only on first attempt to avoid infinite recursion)
            if (error.isModelError && attempt === 0 && !options._fallbackModel) {
                console.log(`[GitHub Models] Model '${modelName}' not found, trying fallback models...`);
                // Try alternative model names
                const fallbackModels = MODEL_PRIORITY.filter(m => m !== modelName);
                for (const fallbackModel of fallbackModels) {
                    try {
                        console.log(`[GitHub Models] Trying fallback model: ${fallbackModel}`);
                        // Retry with fallback model (with reduced max retries to avoid too many attempts)
                        return await generateContentWithFallback(prompt, { ...options, _fallbackModel: fallbackModel }, 2);
                    } catch (fallbackError) {
                        // Only log if it's not another model error (to avoid spam)
                        if (!fallbackError.isModelError) {
                            console.warn(`[GitHub Models] Fallback model ${fallbackModel} failed: ${fallbackError.message}`);
                        }
                        continue; // Try next fallback
                    }
                }
                // If all fallbacks failed, provide helpful error message
                throw new Error(`None of the configured models are available. Please check available models at https://models.github.ai or update GITHUB_MODEL in .env. Last error: ${error.message}`);
            }
            
            // If it's a retryable error and we have retries left, continue
            if (isRetryableError(error) && attempt < maxRetries) {
                continue;
            }
            
            // If it's a quota/rate limit error and we've exhausted retries, throw with helpful message
            if (isRetryableError(error) && attempt >= maxRetries) {
                throw new Error(`API quota/rate limit exceeded after ${maxRetries + 1} attempts. Please check your GitHub Models usage or wait before trying again. Original error: ${error.message}`);
            }
            
            // For other errors, throw immediately
            throw error;
        }
    }
    
    throw new Error(`Failed to generate content after ${maxRetries + 1} attempts.`);
}

module.exports = {
    generateContentWithFallback
};
