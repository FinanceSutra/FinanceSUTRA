import { apiRequest } from './queryClient';

/**
 * Checks if a specific set of environment secrets are configured
 * @param secretKeys Array of secret keys to check
 * @returns Promise that resolves to an object with each key and its availability status
 */
export async function checkSecrets(secretKeys: string[]): Promise<Record<string, boolean>> {
  try {
    const response = await apiRequest('POST', '/api/check-secrets', { secretKeys });
    const data = await response.json();
    return data.secrets || {};
  } catch (error) {
    console.error('Error checking secrets:', error);
    return {};
  }
}

/**
 * Specifically checks if the OpenAI API key is configured
 * @returns Promise that resolves to a boolean indicating if the API key is available
 */
export async function openAPIKeyCheck(): Promise<boolean> {
  try {
    const secrets = await checkSecrets(['OPENAI_API_KEY']);
    return !!secrets.OPENAI_API_KEY;
  } catch (error) {
    console.error('Error checking OpenAI API key:', error);
    return false;
  }
}

/**
 * Specifically checks if the Perplexity API key is configured
 * @returns Promise that resolves to a boolean indicating if the API key is available
 */
export async function perplexityAPIKeyCheck(): Promise<boolean> {
  try {
    const secrets = await checkSecrets(['PERPLEXITY_API_KEY']);
    return !!secrets.PERPLEXITY_API_KEY;
  } catch (error) {
    console.error('Error checking Perplexity API key:', error);
    return false;
  }
}

/**
 * Checks if any AI API key is configured (OpenAI or Perplexity)
 * @returns Promise that resolves to an object indicating which AI services are available
 */
export async function checkAIServices(): Promise<{
  openAI: boolean;
  perplexity: boolean;
  anyServiceAvailable: boolean;
}> {
  try {
    const secrets = await checkSecrets(['OPENAI_API_KEY', 'PERPLEXITY_API_KEY']);
    return {
      openAI: !!secrets.OPENAI_API_KEY,
      perplexity: !!secrets.PERPLEXITY_API_KEY,
      anyServiceAvailable: !!secrets.OPENAI_API_KEY || !!secrets.PERPLEXITY_API_KEY
    };
  } catch (error) {
    console.error('Error checking AI services:', error);
    return {
      openAI: false,
      perplexity: false,
      anyServiceAvailable: false
    };
  }
}

/**
 * Determines the likely error type based on the error message and status
 * @param error Error object or string
 * @param status HTTP status code if available
 * @returns Error type classification
 */
export function classifyAPIError(error: any, status?: number): {
  type: 'api_key_missing' | 'api_key_invalid' | 'server_error' | 'timeout' | 'preferences_invalid' | 'unknown';
  message: string;
} {
  const errorMsg = typeof error === 'string' 
    ? error 
    : error?.message || 'Unknown error occurred';
  
  // Check for missing or invalid API key
  if (errorMsg.includes('API key') || errorMsg.includes('authentication') || errorMsg.includes('auth')) {
    if (errorMsg.includes('missing') || errorMsg.includes('not found') || errorMsg.includes('not configured')) {
      return { type: 'api_key_missing', message: errorMsg };
    } else {
      return { type: 'api_key_invalid', message: errorMsg };
    }
  }
  
  // Check for timeout
  if (errorMsg.includes('timeout') || errorMsg.includes('timed out') || status === 408) {
    return { type: 'timeout', message: errorMsg };
  }
  
  // Check for server errors
  if (status && status >= 500) {
    return { type: 'server_error', message: errorMsg };
  }
  
  // Check for preference validation errors
  if (errorMsg.includes('preference') || errorMsg.includes('validation') || status === 400) {
    return { type: 'preferences_invalid', message: errorMsg };
  }
  
  // Default to unknown
  return { type: 'unknown', message: errorMsg };
}