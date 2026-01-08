/**
 * Image utility functions for handling word images
 * 
 * Supports both CDN URLs (server) and Base64 data URIs (local)
 * Requirements: 5.1, 5.2, 5.6
 */

import { Word } from '../types';

/**
 * Check if an image URL is valid (not empty, not placeholder)
 * Supports both CDN URLs and Base64 data URIs
 * 
 * @param url - The image URL to validate
 * @returns true if the URL is valid and usable
 */
export const isValidImageUrl = (url?: string): boolean => {
     if (!url) return false;
     const trimmed = url.trim();
     if (trimmed === '') return false;

     // Support CDN URLs (http/https) and Base64 data URIs
     return trimmed.startsWith('http://') ||
          trimmed.startsWith('https://') ||
          trimmed.startsWith('data:') ||
          trimmed.startsWith('file://');
};

/**
 * Get display image URL with priority logic:
 * 1. customImageUrl if isUsingCustomImage = true AND customImageUrl is valid
 * 2. Server imageUrl if valid
 * 3. Empty string (show loading indicator)
 * 
 * Requirements:
 * - 5.1: Prioritize customImageUrl if isUsingCustomImage is true
 * - 5.2: Fallback to server imageUrl if no custom image
 * - 5.6: Support both CDN URLs and Base64 data URIs
 * 
 * @param word - The word object containing image URLs
 * @returns The URL to display, or empty string if no valid image
 */
export const getDisplayImageUrl = (word: Word): string => {
     // Priority 1: Custom image if user has set it
     if (word.isUsingCustomImage && isValidImageUrl(word.customImageUrl)) {
          return word.customImageUrl!;
     }

     // Priority 2: Server image URL
     if (isValidImageUrl(word.imageUrl)) {
          return word.imageUrl;
     }

     // No valid image available - return empty string for loading state
     return '';
};

/**
 * Check if word is still loading (polling for images)
 * Used to determine skeleton/loading state and disable audio button
 * 
 * Requirements:
 * - 14.5: Audio button disabled state determined by image loading status
 * 
 * @param word - The word object to check
 * @returns true if word is still loading (no valid image URL)
 */
export const isWordLoading = (word: Word): boolean => {
     const imageUrl = getDisplayImageUrl(word);
     return !isValidImageUrl(imageUrl);
};
