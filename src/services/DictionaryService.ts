import { Word, LocalWord, ServerWord, LookupResponse, Meaning } from '../types';
import { EventBus } from './EventBus';
import { StorageService } from './StorageService';

// Base URL configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/v1';

export const DictionaryService = {
     /**
      * Tra cứu từ điển theo kiến trúc Server-Client mới.
      * 1. Check Local
      * 2. Call Server (Global Dictionary)
      * 3. Sync to Local (Private Notebook)
      */
     lookup: async (wordText: string, userExamples: string[] = [], customMainImage?: string): Promise<{ word: Word, isNew: boolean, originalText: string } | null> => {
          const inputWord = wordText.trim().toLowerCase();
          console.log(`[DictionaryService] 🔍 Lookup: "${inputWord}"`);

          // 1. Kiểm tra Local DB (Offline-first / Cache)
          try {
               const allWords = await StorageService.getWords();
               const existing = allWords.find(w => w.word.toLowerCase() === inputWord);
               if (existing) {
                    console.log(`[DictionaryService] ♻️ Found locally: "${inputWord}"`);
                    return { word: existing, isNew: false, originalText: wordText };
               }
          } catch (e) {
               console.error('[DictionaryService] Local check failed', e);
          }

          // 2. Call Server API
          try {
               // Use a mock response if API fails (for demo purposes) or implement real fetch
               const response = await fetch(`${API_BASE_URL}/dictionary/lookup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ word: inputWord })
               });

               if (!response.ok) {
                    const errorText = await response.text();
                    console.error('[DictionaryService] Server error:', response.status, errorText);
                    // Fallback or throw? Returning null as per original behavior on failure
                    return null;
               }

               const json: LookupResponse = await response.json();

               if (!json.success || !json.data) {
                    return null;
               }

               const { word: serverWord, status } = json.data;

               // 3. Transform & Save to Local
               const localWord = await DictionaryService.saveToLocal(serverWord, userExamples, customMainImage);

               // 4. Handle Processing Status (Background Polling)
               if (status === 'processing') {
                    console.log(`[DictionaryService] ⏳ Word is processing. Starting polling...`);
                    DictionaryService.pollWordUntilReady(serverWord.id);
               }

               return {
                    word: localWord,
                    isNew: true,
                    originalText: wordText
               };

          } catch (error) {
               console.error('[DictionaryService] ❌ Network/Server Error:', error);
               return null;
          }
     },

     /**
      * Converts ServerWord to LocalWord and saves it.
      */
     saveToLocal: async (serverWord: ServerWord, userExamples: string[] = [], customMainImage?: string): Promise<LocalWord> => {
          const localWord: LocalWord = {
               ...serverWord,
               // Client-side fields
               customImageUrl: customMainImage || '',
               isUsingCustomImage: !!customMainImage,
               userExamples: userExamples.map((text, i) => ({
                    id: `user_${Date.now()}_${i}`,
                    text,
                    audioUrl: DictionaryService.getGoogleAudioUrl(text),
                    customImageUrl: '' // User can add later
               })),
               userTopics: [],
               userNotes: '',
               isFavorite: false,
               nextReviewDate: new Date().toISOString().split('T')[0],
               reviewCount: 0,
               viewCount: 0,
               localCreatedAt: new Date().toISOString(),
               localUpdatedAt: new Date().toISOString()
          };

          await StorageService.addWord(localWord);
          return localWord;
     },

     /**
      * Polls the server until the word is 'completed' (images generated).
      */
     pollWordUntilReady: async (wordId: string) => {
          const maxAttempts = 20; // 100 seconds max
          const interval = 5000;

          // Run in background (don't await this function in UI)
          (async () => {
               for (let attempt = 0; attempt < maxAttempts; attempt++) {
                    await new Promise(resolve => setTimeout(resolve, interval));

                    try {
                         console.log(`[DictionaryService] 🔄 Polling attempt ${attempt + 1} for "${wordId}"`);
                         const response = await fetch(`${API_BASE_URL}/dictionary/${wordId}`);
                         if (!response.ok) continue;

                         const json: LookupResponse = await response.json();
                         if (json.success && json.data.status === 'completed') {
                              console.log(`[DictionaryService] ✅ Word "${wordId}" ready! Syncing updates.`);

                              // Update local word with new data from server (mainly images)
                              await DictionaryService.syncServerUpdates(json.data.word);
                              break;
                         }
                    } catch (e) {
                         console.log('[DictionaryService] Polling error (transient)', e);
                    }
               }
          })();
     },

     /**
      * Syncs server updates (like generated images) to local storage without overwriting user data.
      */
     syncServerUpdates: async (newServerWord: ServerWord) => {
          const currentLocal = await StorageService.getWordById(newServerWord.id);
          if (!currentLocal) return;

          // Merge: keep user custom fields, update server fields (images, definitions)
          const updatedWord: LocalWord = {
               ...currentLocal,
               ...newServerWord, // Overwrites server fields (imageUrl, meanings)

               // Restore local fields that might be lost if strictly spreading
               customImageUrl: currentLocal.customImageUrl,
               isUsingCustomImage: currentLocal.isUsingCustomImage,
               userExamples: currentLocal.userExamples,
               userTopics: currentLocal.userTopics,
               userNotes: currentLocal.userNotes,
               isFavorite: currentLocal.isFavorite,
               nextReviewDate: currentLocal.nextReviewDate,
               reviewCount: currentLocal.reviewCount,
               viewCount: currentLocal.viewCount,
               localUpdatedAt: new Date().toISOString(),
          };

          // Special handling for Meanings example images:
          // If server meaning has image, update it.
          // Note: LocalWord logic assumes meanings come from server.

          await StorageService.addWord(updatedWord);
          EventBus.emit('wordImageUpdated', { wordId: updatedWord.id, word: updatedWord });
     },

     /**
      * Updates a word's custom image (User feature).
      */
     updateCustomImage: async (wordId: string, base64Image: string) => {
          const word = await StorageService.getWordById(wordId);
          if (!word) return;

          const updated: LocalWord = {
               ...word,
               customImageUrl: base64Image,
               isUsingCustomImage: true,
               localUpdatedAt: new Date().toISOString()
          };

          await StorageService.addWord(updated);
          EventBus.emit('wordImageUpdated', { wordId: wordId, word: updated });
     },

     /**
      * Resets to server image.
      */
     resetToServerImage: async (wordId: string) => {
          const word = await StorageService.getWordById(wordId);
          if (!word) return;

          const updated: LocalWord = {
               ...word,
               isUsingCustomImage: false,
               localUpdatedAt: new Date().toISOString()
          };

          await StorageService.addWord(updated);
          EventBus.emit('wordImageUpdated', { wordId: wordId, word: updated });
     },

     getGoogleAudioUrl: (text: string): string => {
          return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
     }
};
