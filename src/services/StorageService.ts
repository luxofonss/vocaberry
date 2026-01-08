// Storage Service - Proxying calls to DatabaseService for relational storage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Word } from '../types';
import DatabaseService from './DatabaseService';

const STORAGE_KEYS = {
     IS_SEEDED: 'vocaberry_is_seeded_v12', // Bumped version for mock data
     USER_NAME: 'vocaberry_user_name', // User's name
     MOTHER_LANGUAGE: 'vocaberry_mother_language', // User's mother language code (e.g., 'vi', 'zh', 'es')
     LAST_PRACTICE_TIME: 'vocaberry_last_practice_time', // Timestamp of last practice session
     LAST_NOTIFICATION_SHOWN: 'vocaberry_last_notification_shown', // Timestamp of last notification shown
     PRACTICE_STATS: 'vocaberry_practice_stats', // Practice statistics (JSON)
};

// Mock data for initial seeding
const MOCK_IMAGE = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtkzZMTh_n9DE3CznuCnA8wVdQI7IQT9sDng&s';

// Helper to generate Google TTS URL
const getGoogleAudioUrl = (text: string): string => {
     return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
};

const MOCK_WORDS: Word[] = [
     {
          id: 'mock_1',
          word: 'apple',
          phonetic: '/ˈæp.əl/',
          audioUrl: getGoogleAudioUrl('apple'),
          imageUrl: MOCK_IMAGE,
          topics: ['Food', 'Daily Life'],
          nextReviewDate: new Date().toISOString().split('T')[0],
          reviewCount: 0,
          viewCount: 0,
          createdAt: new Date().toISOString(),
          meanings: [
               {
                    id: 'mock_1_m1',
                    partOfSpeech: 'noun',
                    definition: 'A round fruit with red or green skin and a white inside.',
                    example: 'I eat an apple every day for breakfast.',
                    exampleImageUrl: MOCK_IMAGE,
                    exampleAudioUrl: getGoogleAudioUrl('I eat an apple every day for breakfast.'),
                    imageDescription: 'A fresh red apple on white background'
               }
          ]
     },
     {
          id: 'mock_2',
          word: 'book',
          phonetic: '/bʊk/',
          audioUrl: getGoogleAudioUrl('book'),
          imageUrl: MOCK_IMAGE,
          topics: ['Daily Life', 'Education'],
          nextReviewDate: new Date().toISOString().split('T')[0],
          reviewCount: 0,
          viewCount: 1,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          meanings: [
               {
                    id: 'mock_2_m1',
                    partOfSpeech: 'noun',
                    definition: 'A written or printed work consisting of pages glued or sewn together.',
                    example: 'She sat in the garden reading a book.',
                    exampleImageUrl: MOCK_IMAGE,
                    exampleAudioUrl: getGoogleAudioUrl('She sat in the garden reading a book.'),
                    imageDescription: 'An open book on a wooden table'
               },
               {
                    id: 'mock_2_m2',
                    partOfSpeech: 'verb',
                    definition: 'To make a reservation for accommodation or a place.',
                    example: 'I need to book a flight to London.',
                    exampleImageUrl: MOCK_IMAGE,
                    exampleAudioUrl: getGoogleAudioUrl('I need to book a flight to London.'),
                    imageDescription: 'A person booking a flight on laptop'
               }
          ]
     },
     {
          id: 'mock_3',
          word: 'computer',
          phonetic: '/kəmˈpjuː.tər/',
          audioUrl: getGoogleAudioUrl('computer'),
          imageUrl: MOCK_IMAGE,
          topics: ['Technology'],
          nextReviewDate: new Date().toISOString().split('T')[0],
          reviewCount: 0,
          viewCount: 2,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          meanings: [
               {
                    id: 'mock_3_m1',
                    partOfSpeech: 'noun',
                    definition: 'An electronic machine used for storing, organizing, and finding information.',
                    example: 'My computer crashed and I lost all my work.',
                    exampleImageUrl: MOCK_IMAGE,
                    exampleAudioUrl: getGoogleAudioUrl('My computer crashed and I lost all my work.'),
                    imageDescription: 'A modern laptop computer'
               }
          ]
     },
     {
          id: 'mock_4',
          word: 'sunshine',
          phonetic: '/ˈsʌn.ʃaɪn/',
          audioUrl: getGoogleAudioUrl('sunshine'),
          imageUrl: MOCK_IMAGE,
          topics: ['Nature', 'Weather'],
          nextReviewDate: new Date().toISOString().split('T')[0],
          reviewCount: 0,
          viewCount: 0,
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          meanings: [
               {
                    id: 'mock_4_m1',
                    partOfSpeech: 'noun',
                    definition: 'The light and warmth that come from the sun.',
                    example: 'The sunshine made everyone feel happy.',
                    exampleImageUrl: MOCK_IMAGE,
                    exampleAudioUrl: getGoogleAudioUrl('The sunshine made everyone feel happy.'),
                    imageDescription: 'Bright sunshine through clouds'
               }
          ]
     },
     {
          id: 'mock_5',
          word: 'coffee',
          phonetic: '/ˈkɒf.i/',
          audioUrl: getGoogleAudioUrl('coffee'),
          imageUrl: MOCK_IMAGE,
          topics: ['Food', 'Daily Life'],
          nextReviewDate: new Date().toISOString().split('T')[0],
          reviewCount: 0,
          viewCount: 3,
          createdAt: new Date(Date.now() - 345600000).toISOString(),
          meanings: [
               {
                    id: 'mock_5_m1',
                    partOfSpeech: 'noun',
                    definition: 'A dark brown drink made from roasted coffee beans.',
                    example: 'I need a cup of coffee to wake up in the morning.',
                    exampleImageUrl: MOCK_IMAGE,
                    exampleAudioUrl: getGoogleAudioUrl('I need a cup of coffee to wake up in the morning.'),
                    imageDescription: 'A steaming cup of coffee'
               }
          ]
     }
];

export const StorageService = {
     /**
      * Seeds the initial data if the app is launched for the first time.
      */
     seedSampleData: async (): Promise<Word[]> => {
          try {
               // Save all mock words to database
               for (const word of MOCK_WORDS) {
                    await DatabaseService.saveWord(word);
               }
               await AsyncStorage.setItem(STORAGE_KEYS.IS_SEEDED, STORAGE_KEYS.IS_SEEDED);
               return await DatabaseService.getAllWords();
          } catch (e) {
               console.error('[StorageService] Failed to seed data', e);
               return [];
          }
     },

     /**
      * Checks if data has been seeded, otherwise triggers seeding.
      */
     checkAndSeedData: async (): Promise<void> => {
          try {
               const isSeededKey = await AsyncStorage.getItem(STORAGE_KEYS.IS_SEEDED);
               if (isSeededKey !== STORAGE_KEYS.IS_SEEDED) {
                    await StorageService.seedSampleData();
               }
          } catch (e) {
               console.error('[StorageService] Failed to check seed status', e);
          }
     },

     /**
      * Force reset and re-seed mock data (useful for testing/refresh)
      */
     forceSeedMockData: async (): Promise<Word[]> => {
          try {
               await DatabaseService.clearAllData();
               return await StorageService.seedSampleData();
          } catch (e) {
               console.error('[StorageService] Failed to force seed data', e);
               return [];
          }
     },

     /**
      * Fetches all words from the relational-style local DB.
      */
     getWords: async (): Promise<Word[]> => {
          return await DatabaseService.getAllWords();
     },

     /**
      * Gets a specific word by its ID.
      */
     getWordById: async (id: string): Promise<Word | undefined> => {
          const words = await DatabaseService.getAllWords();
          return words.find((w) => w.id === id);
     },

     /**
      * Extracts a unique list of all topics across all words.
      */
     getAllTopics: async (): Promise<string[]> => {
          const words = await DatabaseService.getAllWords();
          const topicSet = new Set<string>();
          words.forEach(w => {
               w.topics?.forEach(t => topicSet.add(t));
          });
          return Array.from(topicSet).sort();
     },

     /**
      * Adds a new word to the library.
      */
     addWord: async (newWord: Word): Promise<Word[]> => {
          await DatabaseService.saveWord(newWord);
          return await DatabaseService.getAllWords();
     },

     /**
      * Deletes a word by ID.
      */
     deleteWord: async (id: string): Promise<Word[]> => {
          await DatabaseService.deleteWord(id);
          return await DatabaseService.getAllWords();
     },

     /**
      * Updates review metadata for a word using spaced-repetition logic.
      * Trong practice: forgot (-2 viewCount), got it (+2 viewCount)
      */
     markAsReviewed: async (id: string, remembered: boolean): Promise<void> => {
          const word = await StorageService.getWordById(id);
          if (!word) return;

          const now = new Date();
          let nextReview = new Date();

          if (remembered) {
               const daysToAdd = word.reviewCount === 0 ? 1 : Math.pow(2, word.reviewCount);
               nextReview.setDate(now.getDate() + daysToAdd);
               word.reviewCount = (word.reviewCount || 0) + 1;
               // Practice: đúng thì +2 viewCount
               word.viewCount = Math.max(0, (word.viewCount || 0) + 2);
          } else {
               nextReview.setDate(now.getDate() + 1);
               word.reviewCount = 0;
               // Practice: sai (phải show answer) thì -2 viewCount
               word.viewCount = Math.max(0, (word.viewCount || 0) - 2);
          }

          word.nextReviewDate = nextReview.toISOString().split('T')[0];
          await DatabaseService.saveWord(word);
     },

     /**
      * Increment viewCount khi bấm "I Got It" ở màn detail
      */
     incrementViewCount: async (id: string): Promise<void> => {
          const word = await StorageService.getWordById(id);
          if (!word) return;
          word.viewCount = (word.viewCount || 0) + 1;
          await DatabaseService.saveWord(word);
     },

     /**
      * Set viewCount = max integer khi bấm "Done" (không nhắc nữa)
      */
     markAsDone: async (id: string): Promise<void> => {
          const word = await StorageService.getWordById(id);
          if (!word) return;
          word.viewCount = Number.MAX_SAFE_INTEGER;
          await DatabaseService.saveWord(word);
     },

     /**
      * Lấy các từ ít xem nhất để practice
      */
     getLeastViewedWords: async (limit: number): Promise<Word[]> => {
          const words = await DatabaseService.getAllWords();
          // Lọc bỏ các từ đã done (viewCount = max)
          const activeWords = words.filter(w => (w.viewCount || 0) < Number.MAX_SAFE_INTEGER);
          // Sắp xếp theo viewCount tăng dần (ít xem nhất trước)
          const sorted = activeWords.sort((a, b) => (a.viewCount || 0) - (b.viewCount || 0));
          return sorted.slice(0, limit);
     },

     /**
      * Selects words for practice based on SRS priority and a limit.
      */
     getPracticeWords: async (limit: number): Promise<Word[]> => {
          try {
               const words = await DatabaseService.getAllWords();
               const today = new Date().toISOString().split('T')[0];

               let dueWords = words.filter(w => w.nextReviewDate <= today);

               if (dueWords.length < limit) {
                    const remainingCount = limit - dueWords.length;
                    const otherWords = words
                         .filter(w => w.nextReviewDate > today)
                         .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
                         .slice(0, remainingCount);

                    dueWords = [...dueWords, ...otherWords];
               }

               // Shuffle logic
               const result = dueWords.slice(0, limit);
               for (let i = result.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [result[i], result[j]] = [result[j], result[i]];
               }

               return result;
          } catch (e) {
               console.error("[StorageService] Error getting practice words", e);
               return [];
          }
     },

     /**
      * Helper for count (used in HomeScreen Review badge)
      * Trả về 5 từ ít xem nhất để nhắc user practice
      */
     getWordsForReview: async (): Promise<Word[]> => {
          const words = await DatabaseService.getAllWords();
          const today = new Date().toISOString().split('T')[0];
          const dueWords = words.filter(w => w.nextReviewDate <= today);

          // Nếu có từ cần review theo SRS, ưu tiên những từ đó
          if (dueWords.length > 0) {
               return dueWords;
          }

          // Nếu không có, trả về 5 từ ít xem nhất
          return await StorageService.getLeastViewedWords(5);
     },

     /**
      * Saves the user's name to AsyncStorage.
      */
     saveUserName: async (name: string): Promise<void> => {
          try {
               await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, name);
          } catch (e) {
               console.error('[StorageService] Failed to save user name', e);
               throw e;
          }
     },

     /**
      * Gets the user's name from AsyncStorage.
      */
     getUserName: async (): Promise<string | null> => {
          try {
               return await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
          } catch (e) {
               console.error('[StorageService] Failed to get user name', e);
               return null;
          }
     },

     /**
      * Checks if the user has completed the welcome screen.
      */
     hasCompletedWelcome: async (): Promise<boolean> => {
          try {
               const userName = await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
               return userName !== null && userName.trim() !== '';
          } catch (e) {
               console.error('[StorageService] Failed to check welcome status', e);
               return false;
          }
     },

     /**
      * Saves the user's mother language code to AsyncStorage.
      * @param languageCode - Language code (e.g., 'vi', 'zh', 'es', 'fr')
      */
     saveMotherLanguage: async (languageCode: string): Promise<void> => {
          try {
               await AsyncStorage.setItem(STORAGE_KEYS.MOTHER_LANGUAGE, languageCode);
          } catch (e) {
               console.error('[StorageService] Failed to save mother language', e);
               throw e;
          }
     },

     /**
      * Gets the user's mother language code from AsyncStorage.
      * @returns Language code or null if not set
      */
     getMotherLanguage: async (): Promise<string | null> => {
          try {
               return await AsyncStorage.getItem(STORAGE_KEYS.MOTHER_LANGUAGE);
          } catch (e) {
               console.error('[StorageService] Failed to get mother language', e);
               return null;
          }
     },

     /**
      * Saves the timestamp of the last practice session.
      */
     saveLastPracticeTime: async (): Promise<void> => {
          try {
               const timestamp = Date.now().toString();
               await AsyncStorage.setItem(STORAGE_KEYS.LAST_PRACTICE_TIME, timestamp);
          } catch (e) {
               console.error('[StorageService] Failed to save last practice time', e);
          }
     },

     /**
      * Gets the timestamp of the last practice session.
      * @returns Timestamp in milliseconds or null if never practiced
      */
     getLastPracticeTime: async (): Promise<number | null> => {
          try {
               const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_PRACTICE_TIME);
               return timestamp ? parseInt(timestamp, 10) : null;
          } catch (e) {
               console.error('[StorageService] Failed to get last practice time', e);
               return null;
          }
     },

     /**
      * Saves the timestamp of the last notification shown.
      */
     saveLastNotificationShown: async (): Promise<void> => {
          try {
               const timestamp = Date.now().toString();
               await AsyncStorage.setItem(STORAGE_KEYS.LAST_NOTIFICATION_SHOWN, timestamp);
          } catch (e) {
               console.error('[StorageService] Failed to save last notification shown', e);
          }
     },

     /**
      * Gets the timestamp of the last notification shown.
      * @returns Timestamp in milliseconds or null if never shown
      */
     getLastNotificationShown: async (): Promise<number | null> => {
          try {
               const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_NOTIFICATION_SHOWN);
               return timestamp ? parseInt(timestamp, 10) : null;
          } catch (e) {
               console.error('[StorageService] Failed to get last notification shown', e);
               return null;
          }
     },

     /**
      * Checks if notification should be shown (15 minutes since last practice or last notification).
      * @returns true if should show notification
      */
     shouldShowPracticeNotification: async (): Promise<boolean> => {
          try {
               const lastPractice = await StorageService.getLastPracticeTime();
               const lastNotification = await StorageService.getLastNotificationShown();
               const now = Date.now();
               const FIFTEEN_MINUTES = 15 * 60 * 1000;

               // Nếu chưa practice lần nào, không hiện notification
               if (!lastPractice) {
                    return false;
               }

               // Nếu đã hiện notification gần đây (trong 15 phút), không hiện lại
               if (lastNotification && (now - lastNotification) < FIFTEEN_MINUTES) {
                    return false;
               }

               // Hiện notification nếu đã qua 15 phút từ lần practice cuối
               return (now - lastPractice) >= FIFTEEN_MINUTES;
          } catch (e) {
               console.error('[StorageService] Failed to check notification status', e);
               return false;
          }
     },

     /**
      * Gets practice statistics (total sessions, streak, total words practiced, etc.)
      */
     getPracticeStats: async (): Promise<{
          totalSessions: number;
          currentStreak: number;
          longestStreak: number;
          totalWordsPracticed: number;
          lastPracticeTime: number | null;
     }> => {
          try {
               const statsJson = await AsyncStorage.getItem(STORAGE_KEYS.PRACTICE_STATS);
               const lastPractice = await StorageService.getLastPracticeTime();

               if (!statsJson) {
                    return {
                         totalSessions: 0,
                         currentStreak: 0,
                         longestStreak: 0,
                         totalWordsPracticed: 0,
                         lastPracticeTime: lastPractice,
                    };
               }

               const stats = JSON.parse(statsJson);
               return {
                    ...stats,
                    lastPracticeTime: lastPractice,
               };
          } catch (e) {
               console.error('[StorageService] Failed to get practice stats', e);
               return {
                    totalSessions: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                    totalWordsPracticed: 0,
                    lastPracticeTime: null,
               };
          }
     },

     /**
      * Updates practice statistics after a practice session.
      * @param wordsPracticed - Number of words practiced in this session
      */
     updatePracticeStats: async (wordsPracticed: number): Promise<void> => {
          try {
               const stats = await StorageService.getPracticeStats();
               const now = Date.now();
               const lastPractice = stats.lastPracticeTime;

               // Calculate streak
               let currentStreak = stats.currentStreak;
               if (lastPractice) {
                    const lastDate = new Date(lastPractice);
                    const today = new Date();
                    lastDate.setHours(0, 0, 0, 0);
                    today.setHours(0, 0, 0, 0);

                    const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

                    if (daysDiff === 0) {
                         // Same day, keep streak
                         currentStreak = stats.currentStreak;
                    } else if (daysDiff === 1) {
                         // Consecutive day, increment streak
                         currentStreak = stats.currentStreak + 1;
                    } else {
                         // Streak broken, reset to 1
                         currentStreak = 1;
                    }
               } else {
                    // First practice
                    currentStreak = 1;
               }

               const updatedStats = {
                    totalSessions: stats.totalSessions + 1,
                    currentStreak: currentStreak,
                    longestStreak: Math.max(stats.longestStreak, currentStreak),
                    totalWordsPracticed: stats.totalWordsPracticed + wordsPracticed,
                    lastPracticeTime: now,
               };

               await AsyncStorage.setItem(STORAGE_KEYS.PRACTICE_STATS, JSON.stringify(updatedStats));
          } catch (e) {
               console.error('[StorageService] Failed to update practice stats', e);
          }
     },
};
