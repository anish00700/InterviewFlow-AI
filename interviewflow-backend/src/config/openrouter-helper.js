// OpenRouter API Helper - OpenAI-compatible API wrapper
const openrouterModule = require('./openrouter');
const { OPENROUTER_API_BASE, OPENROUTER_API_KEY } = openrouterModule;
const MODEL_PRIORITY = openrouterModule.MODEL_PRIORITY;
const DEFAULT_MODEL = openrouterModule.DEFAULT_MODEL;

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
 * Generate content using OpenRouter API (OpenAI-compatible format)
 * @param {string} prompt - The prompt to send to the model
 * @param {object} options - Additional options (temperature, max_tokens, response_format, etc.)
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<object>} - Response object with text content
 */
async function generateContentWithFallback(prompt, options = {}, maxRetries = 3) {
    // Check API key first
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.trim() === '') {
        throw new Error('OPENROUTER_API_KEY is not configured. Please set it in your .env file and restart the server.');
    }
    
    const modelName = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
    const temperature = options.temperature || 0.7;
    // Default max_tokens reduced to 1500 to work within credit limits
    // Can be overridden per request if needed
    const maxTokens = options.max_tokens || 1500;
    const responseFormat = options.response_format;
    
    // Log API call attempt
    console.log(`[OpenRouter API] Calling model: ${modelName}`);
    
    // Prepare the request body (OpenAI-compatible format)
    const requestBody = {
        model: modelName,
        messages: [
            {
                role: 'user',
                content: prompt
            }
        ],
        temperature: temperature,
        max_tokens: maxTokens
    };
    
    // Add response_format if requested (OpenRouter supports this for compatible models)
    if (responseFormat && responseFormat.type === 'json_object') {
        requestBody.response_format = responseFormat;
    }
    
    // Try with retry logic
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                const delay = getRetryDelay(attempt - 1);
                console.log(`[OpenRouter API] Retry attempt ${attempt}/${maxRetries} after ${Math.round(delay)}ms delay...`);
                await sleep(delay);
            }
            
            const response = await fetch(`${OPENROUTER_API_BASE}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'https://interviewflow.ai', // Optional but recommended
                    'X-Title': process.env.OPENROUTER_APP_NAME || 'InterviewFlow' // Optional but recommended
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                let errorData;
                try {
                    const errorText = await response.text();
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    errorData = { error: { message: response.statusText } };
                }
                
                const errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
                const error = new Error(errorMessage);
                error.status = response.status;
                error.statusCode = response.status;
                error.details = errorData;
                
                // Log detailed error for debugging
                console.error(`[OpenRouter API] Error details:`, {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });
                
                // If it's a retryable error and we have retries left, continue
                if (isRetryableError(error) && attempt < maxRetries) {
                    continue;
                }
                
                // If it's an auth error, throw immediately
                if (response.status === 401 || response.status === 403) {
                    throw new Error(`API authentication failed. Please check your OpenRouter API key. Status: ${response.status}`);
                }
                
                // For 400 errors, provide more context
                if (response.status === 400) {
                    // Check if it's a credit limit issue
                    if (errorData.error?.message?.toLowerCase().includes('credit') || 
                        errorData.error?.message?.toLowerCase().includes('afford') ||
                        errorData.error?.message?.toLowerCase().includes('max_tokens')) {
                        const creditError = new Error(errorMessage);
                        creditError.isCreditLimit = true;
                        throw creditError;
                    }
                    // Check if it's a model name issue
                    if (errorData.error?.message?.toLowerCase().includes('model') || 
                        errorData.error?.message?.toLowerCase().includes('invalid')) {
                        console.error(`[OpenRouter API] Model '${modelName}' may not be valid. Check available models at https://openrouter.ai/models`);
                    }
                    throw new Error(`Bad Request: ${errorMessage}. Please check your request format and parameters.`);
                }
                
                throw error;
            }
            
            const data = await response.json();
            
            // Extract the content from OpenAI-compatible response
            const content = data.choices?.[0]?.message?.content;
            if (!content) {
                throw new Error('No content in API response');
            }
            
            console.log(`[OpenRouter API] Successfully called model: ${modelName}`);
            
            // Return in a format compatible with existing code
            // responseText is the primary field, response is for backward compatibility
            return {
                response: {
                    text: () => content,
                    textAsync: async () => content
                },
                responseText: content
            };
            
        } catch (error) {
            console.error(`[OpenRouter API] Error with model ${modelName} (attempt ${attempt + 1}):`, error.message);
            
            // If it's a retryable error and we have retries left, continue
            if (isRetryableError(error) && attempt < maxRetries) {
                continue;
            }
            
            // If it's a quota/rate limit error and we've exhausted retries, throw with helpful message
            if (isRetryableError(error) && attempt >= maxRetries) {
                throw new Error(`API quota/rate limit exceeded after ${maxRetries + 1} attempts. Please check your OpenRouter API quota. You may need to upgrade your plan or wait before trying again. Original error: ${error.message}`);
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
