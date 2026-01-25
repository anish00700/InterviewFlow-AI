// Grok API Helper - OpenAI-compatible API wrapper
const grokModule = require('./grok');
const { GROK_API_BASE, GROK_API_KEY } = grokModule;
const MODEL_PRIORITY = grokModule.MODEL_PRIORITY;
const DEFAULT_MODEL = grokModule.DEFAULT_MODEL;

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
 * Generate content using Grok API (OpenAI-compatible format)
 * @param {string} prompt - The prompt to send to the model
 * @param {object} options - Additional options (temperature, max_tokens, etc.)
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<object>} - Response object with text content
 */
async function generateContentWithFallback(prompt, options = {}, maxRetries = 3) {
    const modelName = process.env.GROK_MODEL || DEFAULT_MODEL;
    const temperature = options.temperature || 0.7;
    const maxTokens = options.max_tokens || 4096;
    const responseFormat = options.response_format;
    
    // Log API call attempt
    console.log(`[Grok API] Calling model: ${modelName}`);
    
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
    
    // Grok API may not support response_format parameter
    // Instead, we'll rely on prompt instructions for JSON output
    // Only try response_format if explicitly requested (will retry without it if it fails)
    if (responseFormat && responseFormat.type === 'json_object' && attempt === 0) {
        requestBody.response_format = responseFormat;
    } else if (responseFormat && responseFormat.type === 'json_object') {
        // On retry, don't include response_format, rely on prompt instructions
        // The prompt should already have JSON instructions
    }
    
    // Try with retry logic
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                const delay = getRetryDelay(attempt - 1);
                console.log(`[Grok API] Retry attempt ${attempt}/${maxRetries} after ${Math.round(delay)}ms delay...`);
                await sleep(delay);
            }
            
            const response = await fetch(`${GROK_API_BASE}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROK_API_KEY}`
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
                console.error(`[Grok API] Error details:`, {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });
                
                // If it's a 400 error and we have response_format, try without it
                if (response.status === 400 && requestBody.response_format && attempt < maxRetries) {
                    console.log('[Grok API] 400 error with response_format, retrying without it...');
                    delete requestBody.response_format;
                    // Ensure prompt has JSON instruction
                    if (typeof requestBody.messages[0].content === 'string' && 
                        !requestBody.messages[0].content.includes('valid JSON only')) {
                        requestBody.messages[0].content = requestBody.messages[0].content + 
                            '\n\nIMPORTANT: Respond with valid JSON only, no markdown formatting, no code blocks.';
                    }
                    continue;
                }
                
                // If it's a 400 error about model, log it for debugging
                if (response.status === 400) {
                    console.error('[Grok API] 400 Bad Request - Full error:', JSON.stringify(errorData, null, 2));
                    // Check if it's a model name issue
                    if (errorData.error?.message?.toLowerCase().includes('model') || 
                        errorData.error?.message?.toLowerCase().includes('invalid')) {
                        console.error(`[Grok API] Model '${modelName}' may not be valid. Try: grok-beta, grok-2, or check docs.x.ai/docs/models`);
                    }
                }
                
                // If it's a retryable error and we have retries left, continue
                if (isRetryableError(error) && attempt < maxRetries) {
                    continue;
                }
                
                // If it's an auth error, throw immediately
                if (response.status === 401 || response.status === 403) {
                    throw new Error(`API authentication failed. Please check your Grok API key. Status: ${response.status}`);
                }
                
                // For 400 errors, provide more context
                if (response.status === 400) {
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
            
            console.log(`[Grok API] Successfully called model: ${modelName}`);
            
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
            console.error(`[Grok API] Error with model ${modelName} (attempt ${attempt + 1}):`, error.message);
            
            // If it's a retryable error and we have retries left, continue
            if (isRetryableError(error) && attempt < maxRetries) {
                continue;
            }
            
            // If it's a quota/rate limit error and we've exhausted retries, throw with helpful message
            if (isRetryableError(error) && attempt >= maxRetries) {
                throw new Error(`API quota/rate limit exceeded after ${maxRetries + 1} attempts. Please check your Grok API quota. You may need to upgrade your plan or wait before trying again. Original error: ${error.message}`);
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
