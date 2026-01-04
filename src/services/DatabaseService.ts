import AsyncStorage from '@react-native-async-storage/async-storage';
import { Word, Meaning } from '../types';

/**
 * Client-Side Database Service simulating a Relational DB using AsyncStorage.
 * Structured to support 'words' and 'meanings' tables logic.
 */
const DB_KEYS = {
     PREFIX_WORD: 'dw_',
     PREFIX_MEANING: 'dm_',
};

export const DatabaseService = {
     init: async () => {
          // No explicit init needed for this pattern
     },

     /**
      * Get all words - Reads all keys starting with prefix
      */
     getAllWords: async (): Promise<Word[]> => {
          try {
               const allKeys = await AsyncStorage.getAllKeys();
               const wordKeys = allKeys.filter(k => k.startsWith(DB_KEYS.PREFIX_WORD));
               const meaningKeys = allKeys.filter(k => k.startsWith(DB_KEYS.PREFIX_MEANING));

               const wordPairs = await AsyncStorage.multiGet(wordKeys);
               const meaningPairs = await AsyncStorage.multiGet(meaningKeys);

               const words: any[] = wordPairs.map(p => JSON.parse(p[1] || '{}'));
               const meanings: any[] = meaningPairs.map(p => JSON.parse(p[1] || '{}'));

               // Join meanings to their words
               return words.map(word => ({
                    ...word,
                    meanings: meanings.filter(m => m.word_id === word.id)
               })).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
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

               const word = JSON.parse(wordData);
               const allKeys = await AsyncStorage.getAllKeys();
               const meaningKeys = allKeys.filter(k => k.startsWith(DB_KEYS.PREFIX_MEANING) && k.includes(wordId));
               const meaningPairs = await AsyncStorage.multiGet(meaningKeys);

               word.meanings = meaningPairs.map(p => JSON.parse(p[1] || '{}'));
               return word;
          } catch (e) { return null; }
     },

     /**
      * Save word atomically - Each word and meaning is its own row
      */
     saveWord: async (wordData: Word) => {
          try {
               const wordId = wordData.id || Date.now().toString();
               const { meanings: wordMeanings = [], ...wordEntry } = wordData;

               const wordToSave = {
                    ...wordEntry,
                    id: wordId,
                    createdAt: wordEntry.createdAt || new Date().toISOString(),
               };

               // 1. Prepare word operation
               const ops: [string, string][] = [
                    [DB_KEYS.PREFIX_WORD + wordId, JSON.stringify(wordToSave)]
               ];

               // 2. Prepare meaning operations
               wordMeanings.forEach((m, index) => {
                    const mid = m.id || `${wordId}_m${index}`;
                    ops.push([
                         DB_KEYS.PREFIX_MEANING + mid,
                         JSON.stringify({ ...m, id: mid, word_id: wordId })
                    ]);
               });

               await AsyncStorage.multiSet(ops);
               return wordToSave;
          } catch (error) {
               console.error('[DatabaseService] saveWord Error:', error);
               throw error;
          }
     },

     /**
      * Delete word and all its meanings
      */
     deleteWord: async (wordId: string) => {
          try {
               const allKeys = await AsyncStorage.getAllKeys();
               const wordKey = DB_KEYS.PREFIX_WORD + wordId;

               // Find associated meaning keys
               const meaningKeys = allKeys.filter(k => k.startsWith(DB_KEYS.PREFIX_MEANING));
               const meaningPairs = await AsyncStorage.multiGet(meaningKeys);

               const meaningsToDelete = meaningPairs
                    .filter(p => {
                         try {
                              const m = JSON.parse(p[1] || '{}');
                              return m.word_id === wordId;
                         } catch (e) { return false; }
                    })
                    .map(p => p[0]);

               const keysToDelete = [wordKey, ...meaningsToDelete];
               await AsyncStorage.multiRemove(keysToDelete);
          } catch (error) {
               console.error('[DatabaseService] deleteWord Error:', error);
          }
     },

     /**
      * Emergency Clear Cache (Cứu cánh khi đã bị lỗi Row too big)
      */
     clearAllData: async () => {
          const keys = await AsyncStorage.getAllKeys();
          await AsyncStorage.multiRemove(keys);
     }
};
