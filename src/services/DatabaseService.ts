import AsyncStorage from '@react-native-async-storage/async-storage';
import { Word } from '../types';

const STORAGE_KEYS = {
     WORDS: 'vocaberry_words_v1',
};

/**
 * DatabaseService - Low-level storage implementation for Words
 */

const getAllWords = async (): Promise<Word[]> => {
     try {
          const data = await AsyncStorage.getItem(STORAGE_KEYS.WORDS);
          const words: Word[] = data ? JSON.parse(data) : [];
          // Sort by creation date descending (newest first)
          return words.sort((a, b) => {
               const dateA = a.localCreatedAt || a.createdAt || '';
               const dateB = b.localCreatedAt || b.createdAt || '';
               return dateB.localeCompare(dateA);
          });
     } catch (e) {
          console.error('[DatabaseService] Failed to get all words', e);
          return [];
     }
};

const saveWord = async (word: Word): Promise<void> => {
     try {
          const words = await getAllWords();
          const existingIndex = words.findIndex((w) => w.id === word.id);

          if (existingIndex >= 0) {
               words[existingIndex] = word;
          } else {
               // New word: add to the beginning
               words.unshift(word);
          }

          await AsyncStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(words));
     } catch (e) {
          console.error('[DatabaseService] Failed to save word', e);
          throw e;
     }
};

const deleteWord = async (id: string): Promise<void> => {
     try {
          const words = await getAllWords();
          const filteredWords = words.filter((w) => w.id !== id);
          await AsyncStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(filteredWords));
     } catch (e) {
          console.error('[DatabaseService] Failed to delete word', e);
          throw e;
     }
};

const clearAllData = async (): Promise<void> => {
     try {
          await AsyncStorage.removeItem(STORAGE_KEYS.WORDS);
     } catch (e) {
          console.error('[DatabaseService] Failed to clear all data', e);
          throw e;
     }
};

export const DatabaseService = {
     getAllWords,
     saveWord,
     deleteWord,
     clearAllData,
};

export default DatabaseService;
