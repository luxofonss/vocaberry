import AsyncStorage from '@react-native-async-storage/async-storage';
import { Word } from '../types';

/**
 * Client-Side Database Service using AsyncStorage.
 * Stores each word as a single JSON object under 'word_{id}'.
 */
const DB_KEYS = {
     PREFIX_WORD: 'word_',
};

export const DatabaseService = {
     init: async () => {
          // No explicit init needed
     },

     /**
      * Get all words - Reads all keys starting with 'word_'
      */
     getAllWords: async (): Promise<Word[]> => {
          try {
               const allKeys = await AsyncStorage.getAllKeys();
               const wordKeys = allKeys.filter(k => k.startsWith(DB_KEYS.PREFIX_WORD));
               const wordPairs = await AsyncStorage.multiGet(wordKeys);

               const words = wordPairs
                    .map(p => {
                         try {
                              return JSON.parse(p[1] || '{}');
                         } catch (e) {
                              return null;
                         }
                    })
                    .filter(w => w && w.id)
                    .sort((a, b) => (b.localCreatedAt || b.createdAt || '').localeCompare(a.localCreatedAt || a.createdAt || ''));

               return words;
          } catch (error) {
               console.error('[DatabaseService] getAllWords Error:', error);
               return [];
          }
     },

     /**
      * Get word by ID
      */
     getWordById: async (wordId: string): Promise<Word | null> => {
          try {
               const wordData = await AsyncStorage.getItem(DB_KEYS.PREFIX_WORD + wordId);
               if (!wordData) return null;
               return JSON.parse(wordData);
          } catch (e) { return null; }
     },

     /**
      * Save word (Upsert)
      */
     saveWord: async (wordData: Word) => {
          try {
               if (!wordData.id) throw new Error('Word ID is required');
               const key = DB_KEYS.PREFIX_WORD + wordData.id;
               await AsyncStorage.setItem(key, JSON.stringify(wordData));
               return wordData;
          } catch (error) {
               console.error('[DatabaseService] saveWord Error:', error);
               throw error;
          }
     },

     /**
      * Delete word
      */
     deleteWord: async (wordId: string) => {
          try {
               const key = DB_KEYS.PREFIX_WORD + wordId;
               await AsyncStorage.removeItem(key);
          } catch (error) {
               console.error('[DatabaseService] deleteWord Error:', error);
          }
     },

     /**
      * Emergency Clear Cache
      */
     clearAllData: async () => {
          try {
               const keys = await AsyncStorage.getAllKeys();
               // Only clear words, or everything? method name implies everything.
               await AsyncStorage.multiRemove(keys);
          } catch (e) {
               console.error('Failed to clear data', e);
          }
     }
};
