/**
 * Data models for the Vocabulary Learning App
 */

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
     id: string;
     word: string;
     phonetic?: string;
     audioUrl?: string; // Primary pronunciation
     meanings: Meaning[];
     imageUrl: string;
     topics: string[];
     nextReviewDate: string; // ISO Date String (YYYY-MM-DD)
     reviewCount: number;
     viewCount?: number; // Số lần xem từ (bấm "I Got It")
     createdAt?: string;
}

export type RootStackParamList = {
     Welcome: undefined;
     Home: undefined;
     WordDetail: { wordId: string };
     Review: undefined;
     Practice: { topic?: string }; // Topic-specific practice
     Settings: undefined;
};

export type TabType = 'home' | 'topics' | 'practice' | 'add' | 'search';
