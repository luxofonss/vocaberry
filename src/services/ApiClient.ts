/**
 * API Client Service for Dictionary App
 * Handles all server communication for word lookup and status polling
 */

import { ServerWord, WordStatus } from '../types';

// ============================================
// Configuration
// ============================================

interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

const config: ApiConfig = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://onestudy.id.vn/v1',
  timeout: 30000, // 30 seconds
};

// ============================================
// Response Types
// ============================================

/**
 * API Response Meta information
 */
export interface ApiMeta {
  code: number;
  message: string;
  requestId: string;
}

/**
 * Raw API Response format from server
 * Success: { meta: {...}, data: {...} }
 * Failed: { meta: {...} }
 */
export interface RawApiResponse<T = any> {
  meta: ApiMeta;
  data?: T;
}

/**
 * Lookup data structure from server
 */
export interface LookupData {
  word: ServerWord;
  status: WordStatus;
  cacheHit: boolean;
  estimatedTime?: number;
  pollingUrl?: string;
}

/**
 * Normalized response for internal use
 */
export interface LookupResponse {
  success: boolean;
  data: LookupData;
  meta: ApiMeta;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Fetch with timeout support
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Handle API errors and throw descriptive messages
 */
const handleApiError = (error: unknown, context: string, meta?: ApiMeta): Error => {
  // If we have meta info from server, use it
  if (meta) {
    return new Error(`[${meta.code}] ${meta.message} (requestId: ${meta.requestId})`);
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return new Error(`Request timeout: ${context} took too long to respond`);
    }
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return new Error(`Network error: Unable to connect to server for ${context}`);
    }
    return new Error(`${context} failed: ${error.message}`);
  }
  return new Error(`${context} failed: Unknown error`);
};

/**
 * Check if response is successful based on meta.code
 * Success codes: 200000-299999
 */
const isSuccessCode = (code: number): boolean => {
  return code >= 200000 && code < 300000;
};

// ============================================
// API Client
// ============================================

export const ApiClient = {
  /**
   * Get current configuration
   */
  getConfig: (): ApiConfig => ({ ...config }),

  /**
   * Update configuration (useful for testing or environment switching)
   */
  setConfig: (newConfig: Partial<ApiConfig>): void => {
    if (newConfig.baseUrl) config.baseUrl = newConfig.baseUrl;
    if (newConfig.timeout) config.timeout = newConfig.timeout;
  },

  /**
   * Lookup a word from the server dictionary
   * POST /dictionary/lookup
   * 
   * @param word - The word to lookup
   * @returns LookupResponse with word data and status
   * @throws Error with descriptive message on failure
   * 
   * Requirements: 1.1, 1.3, 1.4, 1.5
   */
  lookupWord: async (word: string): Promise<LookupResponse> => {
    const url = `${config.baseUrl}/dictionary/lookup`;

    try {
      console.log(`[ApiClient] 🔍 Looking up word: "${word}"`);

      const response = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ word: word.trim().toLowerCase() }),
        },
        config.timeout
      );

      const rawData: RawApiResponse<LookupData> = await response.json();

      // Validate response structure - must have meta
      if (!rawData || !rawData.meta) {
        throw new Error('Invalid response format from server: missing meta');
      }

      const { meta, data } = rawData;

      // Check if request failed based on meta.code
      if (!isSuccessCode(meta.code)) {
        throw handleApiError(null, `lookupWord("${word}")`, meta);
      }

      // Success but no data
      if (!data || !data.word) {
        throw new Error(`No word data returned for "${word}"`);
      }

      console.log(`[ApiClient] ✅ Lookup successful, status: ${data.status}, requestId: ${meta.requestId}`);

      return {
        success: true,
        data,
        meta,
      };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('[')) {
        // Already formatted error from handleApiError with meta
        throw error;
      }
      throw handleApiError(error, `lookupWord("${word}")`);
    }
  },

  /**
   * Get the current status of a word (for polling during processing)
   * GET /dictionary/:word
   * 
   * @param word - The word to check status for
   * @returns LookupResponse with current word data and status
   * @throws Error with descriptive message on failure
   * 
   * Requirements: 1.2
   */
  getWordStatus: async (word: string): Promise<LookupResponse> => {
    const encodedWord = encodeURIComponent(word.trim().toLowerCase());
    const url = `${config.baseUrl}/dictionary/${encodedWord}`;
    try {
      console.log(`[ApiClient] 🔄 Checking status for word: "${word}"`);

      const response = await fetchWithTimeout(
        url,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        config.timeout
      );

      const rawData: RawApiResponse<LookupData> = await response.json();

      // Validate response structure - must have meta
      if (!rawData || !rawData.meta) {
        throw new Error('Invalid response format from server: missing meta');
      }

      const { meta, data } = rawData;

      // Check if request failed based on meta.code
      if (!isSuccessCode(meta.code)) {
        throw handleApiError(null, `getWordStatus("${word}")`, meta);
      }

      // Success but no data
      if (!data || !data.word) {
        throw new Error(`No word data returned for "${word}"`);
      }

      console.log(`[ApiClient] ✅ Status check successful, status: ${data.status}, requestId: ${meta.requestId}`);

      return {
        success: true,
        data,
        meta,
      };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('[')) {
        // Already formatted error from handleApiError with meta
        throw error;
      }
      throw handleApiError(error, `getWordStatus("${word}")`);
    }
  },

  /**
   * Get paginated dictionary words
   * GET /dictionary?page=0&size=5
   * 
   * @param page - Page index (0-based)
   * @param size - Page size
   * @returns List of dictionary words
   */
  getDictionaryWords: async (page: number = 0, size: number = 5): Promise<any> => {
    const url = `${config.baseUrl}/dictionary?page=${page}&size=${size}`;
    try {
      console.log(`[ApiClient] 📚 Fetching dictionary words: page=${page}, size=${size}`);

      const response = await fetchWithTimeout(
        url,
        {
          method: 'GET',
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json',
          },
        },
        config.timeout
      );

      const rawData = await response.json();

      if (!rawData || !rawData.meta) {
        throw new Error('Invalid response format from server: missing meta');
      }

      if (!isSuccessCode(rawData.meta.code)) {
        throw handleApiError(null, 'getDictionaryWords', rawData.meta);
      }

      return rawData;
    } catch (error) {
      throw handleApiError(error, 'getDictionaryWords');
    }
  },
};
