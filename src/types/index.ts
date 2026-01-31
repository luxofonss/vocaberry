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

export interface Verb {
     id: number;
     type: string;
     text: string;
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
     verbs?: Verb[];
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
     verbs?: Verb[];
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
     Login: undefined;
     Home: undefined;
     Discover: undefined;
     ConversationDetail: { conversationId: string };
     WordDetail: { wordId: string };
     Review: undefined;
     Practice: { topic?: string }; // Topic-specific practice
     Settings: undefined;
     SentencePractice: { sentenceId?: string, sentencesLimit?: number, customText?: string }; // Practice mode for sentences
     CreateConversation: undefined;
     ShadowingList: undefined;
     NewWordsList: undefined;
     ConversationList: undefined;
     ShadowingPractice: {
          id: number;
          title: string;
          channel: string;
          duration: string;
          level: string;
          difficulty: string;
          thumbnail: string;
          accent: string;
          // Add other optional fields if needed
          [key: string]: any;
     };
};

export interface Sentence {
     id: string;
     text: string;
     practiceCount: number;
     lastPracticedAt?: string; // ISO Date String
     totalScore?: number;      // Accumulated score
     createdAt: string;
     localCreatedAt?: string;
}

export type TabType = 'home' | 'discover' | 'practice' | 'add' | 'search';

export interface ConversationMessage {
     id: string;
     role: 'user' | 'assistant' | 'other';
     text: string;
     translation?: string;
     audioUrl?: string;
}

export interface Conversation {
     id: string;
     title: string;
     description?: string;
     category: string;
     difficulty: 'beginner' | 'intermediate' | 'advanced';
     messages: ConversationMessage[];
     isFavorite?: boolean;
     practiceCount: number;
     lastPracticedAt?: string;
     totalScore?: number;
}

export interface ShadowingSubtitle {
     id: string;
     start: number;
     end: number;
     text: string;
}

export interface ShadowingLesson {
     id: string;
     title: string;
     description: string;
     difficulty: string; // 'beginner' | 'intermediate' | 'advanced'
     thumbnail: string;
     category: string;
     views: number;
     video_url: string;
     created_at: string;
     updated_at: string;
     subtitles?: ShadowingSubtitle[];
     // Computed/Local fields
     duration?: string;
     channel?: string; // Not in API, maybe derive or remove?
     level?: string; // Map from difficulty
     accent?: string;
     completed?: boolean;
     locked?: boolean;
     stars?: number;
}
