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
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://onestudy.id.vn/v1/api',
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

import * as SecureStore from 'expo-secure-store';

// ... (existing imports)

// Helper to get auth headers
const getAuthHeaders = async () => {
  const token = await SecureStore.getItemAsync('accessToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

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
   */
  lookupWord: async (word: string): Promise<LookupResponse> => {
    const url = `${config.baseUrl}/dictionary/lookup`;
    try {
      console.log(`[ApiClient] 🔍 Looking up word: "${word}"`);
      const response = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word: word.trim().toLowerCase() }),
        },
        config.timeout
      );

      const text = await response.text();
      let rawData: RawApiResponse<LookupData>;

      try {
        rawData = JSON.parse(text);
      } catch (e) {
        throw new Error(`JSON Parse error: ${e.message}. Status: ${response.status}. Body: ${text.substring(0, 100)}`);
      }

      if (!rawData || !rawData.meta) throw new Error('Invalid response format: missing meta');
      if (!isSuccessCode(rawData.meta.code)) throw handleApiError(null, `lookupWord("${word}")`, rawData.meta);
      if (!rawData.data || !rawData.data.word) throw new Error(`No word data returned for "${word}"`);
      return { success: true, data: rawData.data, meta: rawData.meta };
    } catch (error) {
      throw handleApiError(error, `lookupWord("${word}")`);
    }
  },

  /**
   * Get the current status of a word
   */
  getWordStatus: async (word: string): Promise<LookupResponse> => {
    const encodedWord = encodeURIComponent(word.trim().toLowerCase());
    const url = `${config.baseUrl}/dictionary/${encodedWord}`;
    try {
      const response = await fetchWithTimeout(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } }, config.timeout);
      const rawData: RawApiResponse<LookupData> = await response.json();
      if (!rawData || !rawData.meta) throw new Error('Invalid response format');
      if (!isSuccessCode(rawData.meta.code)) throw handleApiError(null, `getWordStatus`, rawData.meta);
      return { success: true, data: rawData.data!, meta: rawData.meta };
    } catch (error) {
      throw handleApiError(error, `getWordStatus("${word}")`);
    }
  },

  /**
   * Get paginated dictionary words
   */
  getDictionaryWords: async (page: number = 0, size: number = 5): Promise<any> => {
    const url = `${config.baseUrl}/dictionary?page=${page}&size=${size}`;
    try {
      const response = await fetchWithTimeout(url, { method: 'GET', headers: { 'Accept': '*/*', 'Content-Type': 'application/json' } }, config.timeout);
      const rawData = await response.json();
      if (!isSuccessCode(rawData.meta.code)) throw handleApiError(null, 'getDictionaryWords', rawData.meta);
      return rawData;
    } catch (error) {
      throw handleApiError(error, 'getDictionaryWords');
    }
  },

  /**
   * Sync Push: Upload local data to server
   * POST /api/sync/push
   */
  syncPush: async (data: any): Promise<any> => {
    const url = `${config.baseUrl}/sync/push`;
    try {
      const headers = await getAuthHeaders();
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      }, 60000); // Longer timeout for sync

      if (!response.ok) {
        throw new Error(`Sync Push failed: ${response.status}`);
      }
      return await response.json();
    } catch (e) {
      console.warn('[ApiClient] Sync Push failed', e);
      throw e;
    }
  },

  /**
   * Sync Pull: Download server data
   * GET /api/sync/pull
   */
  syncPull: async (): Promise<any> => {
    const url = `${config.baseUrl}/sync/pull`;
    try {
      const headers = await getAuthHeaders();
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers,
      }, 60000);

      if (!response.ok) {
        throw new Error(`Sync Pull failed: ${response.status}`);
      }
      return await response.json();
    } catch (e) {
      // Silent fail acceptable for background pull?
      console.warn('[ApiClient] Sync Pull failed', e);
      throw e;
    }
  },

  /**
   * Sync a single word (Fire and Forget)
   * POST /api/sync/word
   */
  syncWord: async (word: any): Promise<void> => {
    const url = `${config.baseUrl}/sync/word`;
    try {
      const headers = await getAuthHeaders();
      // Fire and forget, don't await response strictly but catch error
      fetchWithTimeout(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ word }),
      }, 10000).catch(e => console.warn('[ApiClient] Sync word failed', e));
    } catch (e) {
      // Ignore
    }
  },

  /**
   * Sync stats (Fire and Forget)
   * POST /api/sync/stats
   */
  syncStats: async (stats: any): Promise<void> => {
    const url = `${config.baseUrl}/sync/stats`;
    try {
      const headers = await getAuthHeaders();
      fetchWithTimeout(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ stats }),
      }, 10000).catch(e => console.warn('[ApiClient] Sync stats failed', e));
    } catch (e) {
      // Ignore
    }
  },

  /**
    * Sync sentence (Fire and Forget)
    */
  syncSentence: async (sentence: any): Promise<void> => {
    const url = `${config.baseUrl}/sync/sentence`;
    try {
      const headers = await getAuthHeaders();
      fetchWithTimeout(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sentence }),
      }, 10000).catch(e => console.warn('[ApiClient] Sync sentence failed', e));
    } catch (e) { }
  },

  /**
   * Sync conversation (Fire and Forget)
   */
  syncConversation: async (conversation: any): Promise<void> => {
    const url = `${config.baseUrl}/sync/conversation`;
    try {
      const headers = await getAuthHeaders();
      fetchWithTimeout(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ conversation }),
      }, 10000).catch(e => console.warn('[ApiClient] Sync conversation failed', e));
    } catch (e) { }
  },
};
