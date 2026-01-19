/**
 * Dictionary Service - Refactored for Server-Client Architecture
 * 
 * Local-first approach:
 * 1. Check local storage first
 * 2. Return immediately if completed (has imageUrl and all meaning images)
 * 3. Start polling if processing (missing images)
 * 4. Call API only if not in local storage
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { Word, Meaning, ServerWord, UserExample } from '../types';
import { EventBus } from './EventBus';
import { StorageService } from './StorageService';
import { ApiClient } from './ApiClient';
import { isValidImageUrl, isWordLoading } from '../utils/imageUtils';

// ============================================
// Configuration
// ============================================

const POLLING_CONFIG = {
     INTERVAL_MS: 4000,      // Poll every 4 seconds (between 3-5s as per requirements)
     TIMEOUT_MS: 60000,      // Stop polling after 60 seconds
     MAX_RETRIES: 3,         // Retry up to 3 times on failure
     RETRY_DELAY_MS: 2000,   // Wait 2 seconds before retry
};

// ============================================
// Helper Functions
// ============================================

/**
 * Generate Google TTS URL for audio
 */
const getGoogleAudioUrl = (text: string): string => {
     return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
};

/**
 * Delay helper for polling
 */
const delay = (ms: number): Promise<void> => {
     return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Check if a word is completely processed
 */
const isWordCompleted = (word: Word): boolean => {
     return !isWordLoading(word);
};

// ============================================
// Dictionary Service
// ============================================

export const DictionaryService = {
     /**
      * Lookup word - checks local first, only calls API if needed
      */
     lookup: async (
          wordText: string,
          userExamples: string[] = [],
          customMainImage?: string
     ): Promise<{ word: Word; isNew: boolean; originalText: string } | null> => {
          const inputWord = wordText.trim().toLowerCase();
          console.log(`[DictionaryService] 🔍 Looking up word: "${inputWord}"...`);

          // 1. Check local storage first (Requirement 3.1)
          try {
               const localWord = await StorageService.getWordById(inputWord);

               // 2. If exists locally and completed, return immediately (Requirement 3.2)
               if (localWord && isWordCompleted(localWord)) {
                    console.log(`[DictionaryService] ♻️ Found completed word locally`);
                    return { word: localWord, isNew: false, originalText: wordText };
               }

               // 3. If exists locally but still processing, start polling (Requirement 3.3)
               if (localWord && !isWordCompleted(localWord)) {
                    console.log(`[DictionaryService] 🔄 Word exists but incomplete, starting poll...`);
                    DictionaryService.pollUntilReady(inputWord);
                    return { word: localWord, isNew: false, originalText: wordText };
               }
          } catch (e) {
               console.log(`[DictionaryService] ⚠️ Error checking local storage:`, e);
          }

          // 4. Not in local storage, call API (Requirement 3.3)
          console.log(`[DictionaryService] 🌐 Word not found locally, calling API...`);

          try {
               const response = await ApiClient.lookupWord(inputWord);
               if (!response.success || !response.data?.word) {
                    console.log(`[DictionaryService] ⚠️ API returned no data for "${inputWord}"`);
                    return null;
               }

               const serverWord = response.data.word;
               const status = response.data.status;

               // Convert user examples
               const userExampleObjects: UserExample[] = userExamples
                    .filter(text => text.trim())
                    .map((text, index) => ({
                         id: `user_ex_${Date.now()}_${index}`,
                         text: text.trim(),
                         audioUrl: getGoogleAudioUrl(text.trim()),
                    }));

               // Merge with customizations
               const localData: Partial<Word> = {
                    customImageUrl: customMainImage || undefined,
                    isUsingCustomImage: !!customMainImage,
                    userExamples: userExampleObjects,
               };

               const mergedWord = DictionaryService.mergeWithLocalData(serverWord, localData);

               // Save to local
               await StorageService.addWord(mergedWord);
               console.log(`[DictionaryService] 💾 Saved word to local storage`);

               // If still processing, start background polling
               if (status === 'PROCESSING' || isWordLoading(mergedWord)) {
                    console.log(`[DictionaryService] ⏳ Starting background poll...`);
                    DictionaryService.pollUntilReady(inputWord);
               }

               return {
                    word: mergedWord,
                    isNew: true,
                    originalText: wordText,
               };
          } catch (error: any) {
               console.error(`[DictionaryService] ❌ API lookup failed:`, error.message);
               return null;
          }
     },

     /**
      * Merge server word data with local user customizations
      */
     mergeWithLocalData: (serverWord: ServerWord, localData?: Partial<Word>): Word => {
          const meanings: Meaning[] = (serverWord.meanings || []).map(sm => ({
               id: sm.id,
               partOfSpeech: sm.partOfSpeech,
               definition: sm.definition,
               example: sm.example,
               exampleAudioUrl: sm.exampleAudioUrl || getGoogleAudioUrl(sm.example || ''),
               exampleImageUrl: sm.exampleImageUrl || '',
               imageDescription: sm.imageDescription || '',
          }));

          const wordText = serverWord.word.toLowerCase();

          return {
               id: wordText,
               word: serverWord.word,
               phonetic: serverWord.phonetic || `/${serverWord.word}/`,
               audioUrl: serverWord.audioUrl || getGoogleAudioUrl(serverWord.word),
               imageUrl: serverWord.imageUrl || '',
               meanings: meanings,
               createdAt: serverWord.createdAt || new Date().toISOString(),

               // Preserve user customizations
               customImageUrl: localData?.customImageUrl || '',
               isUsingCustomImage: localData?.isUsingCustomImage || false,
               userExamples: localData?.userExamples || [],
               userTopics: localData?.userTopics || [],
               userNotes: localData?.userNotes || '',

               // Review system
               topics: localData?.topics || ['Uncategorized'],
               nextReviewDate: localData?.nextReviewDate || new Date().toISOString().split('T')[0],
               reviewCount: localData?.reviewCount ?? 0,
               viewCount: localData?.viewCount ?? 0,

               localCreatedAt: localData?.localCreatedAt || new Date().toISOString(),
               localUpdatedAt: new Date().toISOString(),
          };
     },

     /**
      * Poll for completion until all images are ready
      */
     pollUntilReady: async (wordText: string): Promise<void> => {
          const startTime = Date.now();
          let retryCount = 0;
          const maxRetries = POLLING_CONFIG.MAX_RETRIES;
          const id = wordText.toLowerCase();

          console.log(`[DictionaryService] 🔄 Starting poll for: "${id}"`);

          while (true) {
               if (Date.now() - startTime >= POLLING_CONFIG.TIMEOUT_MS) {
                    console.log(`[DictionaryService] ⏰ Polling timeout for "${id}"`);
                    return;
               }

               await delay(POLLING_CONFIG.INTERVAL_MS);

               try {
                    const response = await ApiClient.getWordStatus(id);
                    if (!response.success || !response.data?.word) {
                         throw new Error('Invalid server response');
                    }

                    const serverWord = response.data.word;
                    const status = response.data.status;

                    const currentLocal = await StorageService.getWordById(id);
                    const updatedWord = DictionaryService.mergeWithLocalData(serverWord, currentLocal);

                    await StorageService.addWord(updatedWord);

                    console.log(`[DictionaryService] 📡 Poll update for "${id}" (status: ${status})`);
                    EventBus.emit('wordImageUpdated', { wordId: id, word: updatedWord });

                    if (status === 'COMPLETED' && !isWordLoading(updatedWord)) {
                         console.log(`[DictionaryService] ✅ Word "${id}" processing complete`);
                         return;
                    }
                    retryCount = 0;
               } catch (error: any) {
                    retryCount++;
                    if (retryCount >= maxRetries) return;
                    await delay(POLLING_CONFIG.RETRY_DELAY_MS);
               }
          }
     },

     /**
      * Resume polling for processing words
      */
     checkAndResumePolling: async (words: Word | Word[]): Promise<void> => {
          const wordArray = Array.isArray(words) ? words : [words];
          for (const word of wordArray) {
               if (isWordLoading(word)) {
                    DictionaryService.pollUntilReady(word.id);
               }
          }
     },

     /**
      * Force refresh word data
      */
     refreshWord: async (wordText: string): Promise<Word | null> => {
          const id = wordText.toLowerCase();
          console.log(`[DictionaryService.refreshWord] 🔄 Starting refresh for: "${id}"`);

          try {
               console.log(`[DictionaryService.refreshWord] 🌐 Calling API getWordStatus...`);
               const response = await ApiClient.getWordStatus(id);

               console.log(`[DictionaryService.refreshWord] 📡 API response:`, {
                    success: response.success,
                    hasData: !!response.data,
                    hasWord: !!response.data?.word,
                    status: response.data?.status
               });

               if (!response.success || !response.data?.word) {
                    console.log(`[DictionaryService.refreshWord] ❌ Invalid response, returning null`);
                    return null;
               }

               const currentLocal = await StorageService.getWordById(id);
               console.log(`[DictionaryService.refreshWord] 📊 Current local data:`, {
                    hasLocal: !!currentLocal,
                    localImageUrl: currentLocal?.imageUrl,
                    localMeaningsCount: currentLocal?.meanings?.length || 0
               });

               const updatedWord = DictionaryService.mergeWithLocalData(response.data.word, currentLocal);

               console.log(`[DictionaryService.refreshWord] 🔀 Merged word data:`, {
                    imageUrl: updatedWord.imageUrl,
                    meaningsCount: updatedWord.meanings?.length || 0,
                    isLoading: isWordLoading(updatedWord)
               });

               await StorageService.addWord(updatedWord);
               console.log(`[DictionaryService.refreshWord] 💾 Saved to storage`);

               EventBus.emit('wordImageUpdated', { wordId: id, word: updatedWord });
               console.log(`[DictionaryService.refreshWord] 📢 Emitted wordImageUpdated event`);

               if (response.data.status === 'PROCESSING' || isWordLoading(updatedWord)) {
                    console.log(`[DictionaryService.refreshWord] ⏳ Still processing, starting poll...`);
                    DictionaryService.pollUntilReady(id);
               } else {
                    console.log(`[DictionaryService.refreshWord] ✅ Word is complete!`);
               }

               return updatedWord;
          } catch (e) {
               console.error(`[DictionaryService.refreshWord] ❌ Error:`, e);
               return null;
          }
     },

     getGoogleAudioUrl,
};
