/**
 * Data models for the Vocabulary Learning App
 */

// ============================================
// Server Response Types (from API)
// ============================================

/**
 * Server meaning structure returned from API
 */
export interface ServerMeaning {
     id: string;
     partOfSpeech: string;
     definition: string;
     example: string;
     exampleAudioUrl: string;
     exampleImageUrl: string;
     imageDescription: string;
}

/**
 * Server word structure returned from API
 */
export interface ServerWord {
     id: string;
     word: string;
     phonetic: string;
     audioUrl: string;
     imageUrl: string;
     meanings: ServerMeaning[];
     createdAt: string;
     updatedAt: string;
}

// ============================================
// Local Data Types (Client-side)
// ============================================

/**
 * User-created example sentence with optional audio and image
 */
export interface UserExample {
     id: string;
     text: string;
     audioUrl: string;
     customImageUrl?: string;
}

export interface Meaning {
     id: string;
     partOfSpeech?: string;
     definition: string;
     example?: string;
     exampleImageUrl?: string; // VIP: Each example can have its own AI image
     exampleAudioUrl?: string; // VIP: Each example can have its own audio
     phonetic?: string;
     imageDescription?: string; // AI-generated prompt for generating the meaning's image
}

export interface Word {
     // Server fields
     id: string;
     word: string;
     phonetic?: string;
     audioUrl?: string; // Primary pronunciation
     imageUrl: string;
     meanings: Meaning[];

     // User customization fields
     customImageUrl?: string;      // Base64 or file:// path for user's custom image
     isUsingCustomImage?: boolean; // Flag to indicate if custom image should be displayed
     userExamples?: UserExample[]; // User-created example sentences
     userTopics?: string[];        // User's personal categorization
     userNotes?: string;           // User's personal notes about the word

     // Existing fields (preserved for review system)
     topics: string[];
     nextReviewDate: string; // ISO Date String (YYYY-MM-DD)
     reviewCount: number;
     viewCount?: number; // Số lần xem từ (bấm "I Got It")
     createdAt?: string;

     // New timestamps for local tracking
     localCreatedAt?: string;  // When word was added locally
     localUpdatedAt?: string;  // When word was last modified locally
}

/**
 * Word processing status from server
 */
export type WordStatus = 'PROCESSING' | 'COMPLETED';

// ============================================
// Navigation Types
// ============================================

export type RootStackParamList = {
     Welcome: undefined;
     Home: undefined;
     WordDetail: { wordId: string };
     Review: undefined;
     Practice: { topic?: string }; // Topic-specific practice
     Settings: undefined;
};

export type TabType = 'home' | 'topics' | 'practice' | 'add' | 'search';
