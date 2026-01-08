/**
 * Utility Helper Functions
 * Reusable functions across the application
 */

import { Dimensions } from 'react-native';
import { NOTIFICATION_MESSAGES, NotificationMessage } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// LAYOUT CALCULATIONS
// ============================================

interface GridConfig {
     columns: number;
     sidePadding: number;
     gap: number;
}

/**
 * Calculate card width for grid layouts
 */
export const calculateCardWidth = (config: GridConfig): number => {
     const { columns, sidePadding, gap } = config;
     return (SCREEN_WIDTH - sidePadding * 2 - gap * (columns - 1)) / columns;
};

/**
 * Get screen dimensions
 */
export const getScreenDimensions = () => ({
     width: SCREEN_WIDTH,
     height: Dimensions.get('window').height,
});

// ============================================
// STRING UTILITIES
// ============================================

/**
 * Get plural suffix based on count
 */
export const getPlural = (count: number): string => (count > 1 ? 's' : '');

/**
 * Format notification message with count
 */
export const formatNotificationMessage = (
     template: string,
     count: number
): string => {
     return template
          .replace('{count}', count.toString())
          .replace('{plural}', getPlural(count));
};

/**
 * Get notification message based on time since last practice
 */
export const getNotificationByTime = (
     minutesSinceLastPractice: number,
     wordCount: number
): { emoji: string; title: string; message: string } => {
     let messageKey: keyof typeof NOTIFICATION_MESSAGES;

     if (minutesSinceLastPractice < 30) {
          messageKey = 'recent';
     } else if (minutesSinceLastPractice < 60) {
          messageKey = 'halfHour';
     } else if (minutesSinceLastPractice < 120) {
          messageKey = 'oneHour';
     } else if (minutesSinceLastPractice < 360) {
          messageKey = 'twoHours';
     } else if (minutesSinceLastPractice < 1440) {
          messageKey = 'sixHours';
     } else {
          messageKey = 'dayPlus';
     }

     const notification = NOTIFICATION_MESSAGES[messageKey];
     return {
          emoji: notification.emoji,
          title: notification.title,
          message: formatNotificationMessage(notification.messageTemplate, wordCount),
     };
};

/**
 * Format time ago string
 */
export const formatTimeAgo = (timestamp: number | null): string => {
     if (!timestamp) return 'Never';

     const now = Date.now();
     const diff = now - timestamp;
     const minutes = Math.floor(diff / (1000 * 60));
     const hours = Math.floor(diff / (1000 * 60 * 60));
     const days = Math.floor(diff / (1000 * 60 * 60 * 24));

     if (minutes < 1) return 'Just now';
     if (minutes < 60) return `${minutes}m ago`;
     if (hours < 24) return `${hours}h ago`;
     return `${days}d ago`;
};

/**
 * Abbreviate part of speech
 */
export const abbreviatePartOfSpeech = (pos: string | undefined): string => {
     if (!pos) return '';
     return pos.length > 4 ? `${pos.substring(0, 3)}.` : pos.toLowerCase();
};

/**
 * Get user initial from name
 */
export const getUserInitial = (name: string | null): string => {
     return name ? name.charAt(0).toUpperCase() : 'A';
};

/**
 * Generate greeting text
 */
export const getGreetingText = (name: string | null): string => {
     return name ? `Hello ${name}! 👋` : 'Hello! 👋';
};

// ============================================
// VALIDATION
// ============================================

/**
 * Check if string is empty or whitespace only
 */
export const isEmpty = (str: string | null | undefined): boolean => {
     return !str || str.trim().length === 0;
};

// ============================================
// ID GENERATION
// ============================================

/**
 * Generate unique ID for meanings
 */
export const generateMeaningId = (wordId: string): string => {
     return `${wordId}-meaning-${Date.now()}`;
};

// ============================================
// IMAGE UTILITIES
// ============================================

/**
 * Convert image result to base64 URI
 */
export const toBase64Uri = (base64: string | undefined, fallbackUri: string): string => {
     return base64 ? `data:image/jpeg;base64,${base64}` : fallbackUri;
};

// ============================================
// WORD UTILITIES
// ============================================

/**
 * Check if word is learned (based on review count)
 */
export const isWordLearned = (reviewCount: number, threshold = 5): boolean => {
     return reviewCount >= threshold;
};

/**
 * Normalize string for comparison
 */
export const normalizeString = (str: string): string => {
     return str.trim().toLowerCase();
};

/**
 * Check if answer is correct
 */
export const checkAnswer = (userAnswer: string, correctAnswer: string): boolean => {
     return normalizeString(userAnswer) === normalizeString(correctAnswer);
};