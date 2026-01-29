// DiscoverApiService - Mock API for Shadowing and Conversations with caching
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShadowingService } from './ShadowingService';

const CACHE_KEYS = {
     SHADOWING: '@discover_shadowing_cache',
     CONVERSATIONS: '@discover_conversations_cache',
     SHADOWING_TIMESTAMP: '@discover_shadowing_timestamp',
     CONVERSATIONS_TIMESTAMP: '@discover_conversations_timestamp',
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Mock Shadowing Data
const MOCK_SHADOWING = [
     {
          id: 1,
          title: 'Daily Morning Routine',
          channel: 'English with Emma',
          duration: '3:45',
          level: 'Beginner',
          difficulty: 'Easy',
          completed: false,
          stars: 0,
          thumbnail: '🌅',
          accent: 'American',
          views: '1.2M',
          videoUrl: 'https://example.com/video1.mp4',
          subtitles: []
     },
     {
          id: 2,
          title: 'Coffee Shop Conversation',
          channel: 'Real English',
          duration: '4:20',
          level: 'Beginner',
          difficulty: 'Easy',
          completed: false,
          stars: 0,
          thumbnail: '☕',
          accent: 'British',
          views: '850K',
          videoUrl: 'https://example.com/video2.mp4',
          subtitles: []
     },
     {
          id: 3,
          title: 'At the Restaurant',
          channel: 'Speak Easy',
          duration: '5:10',
          level: 'Intermediate',
          difficulty: 'Medium',
          completed: false,
          stars: 0,
          thumbnail: '🍽️',
          accent: 'American',
          views: '620K',
          videoUrl: 'https://example.com/video3.mp4',
          subtitles: []
     },
     {
          id: 4,
          title: 'Job Interview Tips',
          channel: 'Business English',
          duration: '6:30',
          level: 'Advanced',
          difficulty: 'Hard',
          completed: false,
          stars: 0,
          thumbnail: '💼',
          accent: 'British',
          views: '980K',
          videoUrl: 'https://example.com/video4.mp4',
          subtitles: []
     },
     {
          id: 5,
          title: 'Shopping for Clothes',
          channel: 'English Daily',
          duration: '4:50',
          level: 'Beginner',
          difficulty: 'Easy',
          completed: false,
          stars: 0,
          thumbnail: '👕',
          accent: 'American',
          views: '720K',
          videoUrl: 'https://example.com/video5.mp4',
          subtitles: []
     },
     {
          id: 6,
          title: 'Travel Conversation',
          channel: 'World English',
          duration: '5:30',
          level: 'Intermediate',
          difficulty: 'Medium',
          completed: false,
          stars: 0,
          thumbnail: '✈️',
          accent: 'British',
          views: '1.1M',
          videoUrl: 'https://example.com/video6.mp4',
          subtitles: []
     },
];

// Mock Conversations Data
const MOCK_CONVERSATIONS = [
     {
          id: 'conv-1',
          title: 'Ordering Food at a Restaurant',
          category: 'Daily Life',
          difficulty: 'beginner',
          practiceCount: 0,
          messages: [
               { id: 'm1', speaker: 'Waiter', text: 'Good evening! Are you ready to order?', audioUrl: '' },
               { id: 'm2', speaker: 'Customer', text: 'Yes, I\'d like the grilled salmon, please.', audioUrl: '' },
               { id: 'm3', speaker: 'Waiter', text: 'Excellent choice! Would you like any sides with that?', audioUrl: '' },
               { id: 'm4', speaker: 'Customer', text: 'Yes, I\'ll have the roasted vegetables.', audioUrl: '' },
          ],
     },
     {
          id: 'conv-2',
          title: 'Asking for Directions',
          category: 'Travel',
          difficulty: 'beginner',
          practiceCount: 0,
          messages: [
               { id: 'm1', speaker: 'Tourist', text: 'Excuse me, how do I get to the train station?', audioUrl: '' },
               { id: 'm2', speaker: 'Local', text: 'Go straight for two blocks, then turn left.', audioUrl: '' },
               { id: 'm3', speaker: 'Tourist', text: 'Is it far from here?', audioUrl: '' },
               { id: 'm4', speaker: 'Local', text: 'No, it\'s about a 10-minute walk.', audioUrl: '' },
          ],
     },
     {
          id: 'conv-3',
          title: 'Job Interview Introduction',
          category: 'Business',
          difficulty: 'intermediate',
          practiceCount: 0,
          messages: [
               { id: 'm1', speaker: 'Interviewer', text: 'Tell me about yourself and your experience.', audioUrl: '' },
               { id: 'm2', speaker: 'Candidate', text: 'I have five years of experience in software development.', audioUrl: '' },
               { id: 'm3', speaker: 'Interviewer', text: 'What are your greatest strengths?', audioUrl: '' },
               { id: 'm4', speaker: 'Candidate', text: 'I\'m a quick learner and work well in teams.', audioUrl: '' },
          ],
     },
     {
          id: 'conv-4',
          title: 'Making a Doctor\'s Appointment',
          category: 'Health',
          difficulty: 'beginner',
          practiceCount: 0,
          messages: [
               { id: 'm1', speaker: 'Receptionist', text: 'How can I help you today?', audioUrl: '' },
               { id: 'm2', speaker: 'Patient', text: 'I\'d like to schedule an appointment with Dr. Smith.', audioUrl: '' },
               { id: 'm3', speaker: 'Receptionist', text: 'What day works best for you?', audioUrl: '' },
               { id: 'm4', speaker: 'Patient', text: 'Next Tuesday afternoon would be perfect.', audioUrl: '' },
          ],
     },
     {
          id: 'conv-5',
          title: 'Discussing Weekend Plans',
          category: 'Social',
          difficulty: 'beginner',
          practiceCount: 0,
          messages: [
               { id: 'm1', speaker: 'Friend A', text: 'What are you doing this weekend?', audioUrl: '' },
               { id: 'm2', speaker: 'Friend B', text: 'I\'m thinking about going to the beach.', audioUrl: '' },
               { id: 'm3', speaker: 'Friend A', text: 'That sounds fun! Can I join you?', audioUrl: '' },
               { id: 'm4', speaker: 'Friend B', text: 'Of course! Let\'s meet at 10 AM.', audioUrl: '' },
          ],
     },
     {
          id: 'conv-6',
          title: 'Negotiating a Salary',
          category: 'Business',
          difficulty: 'advanced',
          practiceCount: 0,
          messages: [
               { id: 'm1', speaker: 'Manager', text: 'We\'d like to offer you the position.', audioUrl: '' },
               { id: 'm2', speaker: 'Candidate', text: 'Thank you! I\'d like to discuss the compensation package.', audioUrl: '' },
               { id: 'm3', speaker: 'Manager', text: 'What are your salary expectations?', audioUrl: '' },
               { id: 'm4', speaker: 'Candidate', text: 'Based on my experience, I was hoping for $80,000.', audioUrl: '' },
          ],
     },
];

// Helper to check if cache is valid
const isCacheValid = async (timestampKey: string): Promise<boolean> => {
     try {
          const timestamp = await AsyncStorage.getItem(timestampKey);
          if (!timestamp) return false;

          const cacheAge = Date.now() - parseInt(timestamp, 10);
          return cacheAge < CACHE_DURATION;
     } catch (error) {
          console.error('Error checking cache validity:', error);
          return false;
     }
};

// Simulate API delay
const simulateDelay = (ms: number = 1000) =>
     new Promise(resolve => setTimeout(resolve, ms));

export const DiscoverApiService = {
     /**
      * Fetch shadowing lessons
      * Flow: Try API -> On error/timeout -> Try cache -> Return mock
      */
     async getShadowingLessons(): Promise<any[]> {
          try {
               // Real API Call
               const data = await ShadowingService.getLessons();

               // API success - cache the data
               await AsyncStorage.setItem(CACHE_KEYS.SHADOWING, JSON.stringify(data));
               await AsyncStorage.setItem(CACHE_KEYS.SHADOWING_TIMESTAMP, Date.now().toString());

               return data;
          } catch (error) {
               console.log('[DiscoverApi] Shadowing API failed, trying cache...', error);

               // Try to get from cache
               try {
                    const cached = await AsyncStorage.getItem(CACHE_KEYS.SHADOWING);
                    if (cached) {
                         console.log('[DiscoverApi] Returning cached shadowing data');
                         return JSON.parse(cached);
                    }
               } catch (cacheError) {
                    console.error('[DiscoverApi] Cache read failed:', cacheError);
               }

               // Fallback to mock data
               console.log('[DiscoverApi] Returning fallback shadowing data');
               return MOCK_SHADOWING;
          }
     },

     /**
      * Fetch conversations
      * Flow: Try API -> On error/timeout -> Try cache -> Return mock
      */
     async getConversations(): Promise<any[]> {
          try {
               // Simulate API call
               await simulateDelay(800);

               // Simulate random API failure (20% chance)
               if (Math.random() < 0.2) {
                    throw new Error('API timeout or network error');
               }

               // API success - cache the data
               await AsyncStorage.setItem(CACHE_KEYS.CONVERSATIONS, JSON.stringify(MOCK_CONVERSATIONS));
               await AsyncStorage.setItem(CACHE_KEYS.CONVERSATIONS_TIMESTAMP, Date.now().toString());

               return MOCK_CONVERSATIONS;
          } catch (error) {
               console.log('[DiscoverApi] Conversations API failed, trying cache...', error);

               // Try to get from cache
               try {
                    const cached = await AsyncStorage.getItem(CACHE_KEYS.CONVERSATIONS);
                    if (cached) {
                         console.log('[DiscoverApi] Returning cached conversations data');
                         return JSON.parse(cached);
                    }
               } catch (cacheError) {
                    console.error('[DiscoverApi] Cache read failed:', cacheError);
               }

               // Fallback to mock data
               console.log('[DiscoverApi] Returning fallback conversations data');
               return MOCK_CONVERSATIONS;
          }
     },

     /**
      * Get shadowing lesson by ID
      */
     async getShadowingLessonById(id: number): Promise<any | null> {
          const lessons = await this.getShadowingLessons();
          return lessons.find(lesson => lesson.id === id) || null;
     },

     /**
      * Get conversation by ID
      */
     async getConversationById(id: string): Promise<any | null> {
          const conversations = await this.getConversations();
          return conversations.find(conv => conv.id === id) || null;
     },

     /**
      * Clear all cache
      */
     async clearCache(): Promise<void> {
          try {
               await AsyncStorage.multiRemove([
                    CACHE_KEYS.SHADOWING,
                    CACHE_KEYS.CONVERSATIONS,
                    CACHE_KEYS.SHADOWING_TIMESTAMP,
                    CACHE_KEYS.CONVERSATIONS_TIMESTAMP,
               ]);
               console.log('[DiscoverApi] Cache cleared');
          } catch (error) {
               console.error('[DiscoverApi] Failed to clear cache:', error);
          }
     },
};
