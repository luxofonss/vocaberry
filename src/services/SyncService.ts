import { StorageService } from './StorageService';
import { DatabaseService } from './DatabaseService';
import { ApiClient } from './ApiClient';
import { Word, Sentence, Conversation } from '../types';

export const SyncService = {
     /**
      * Merges all local data to server and updates local with the unified result.
      * Typically called after Login.
      */
     mergeLocalDataToServer: async (): Promise<void> => {
          try {
               console.log('[SyncService] Starting merge...');

               // 1. Gather Local Data
               const [
                    words,
                    sentences,
                    conversations,
                    stats,
                    userName,
                    motherLanguage,
                    avatarId
               ] = await Promise.all([
                    DatabaseService.getAllWords(),
                    DatabaseService.getAllSentences(),
                    DatabaseService.getAllConversations(),
                    StorageService.getPracticeStats(),
                    StorageService.getUserName(),
                    StorageService.getMotherLanguage(),
                    StorageService.getUserAvatar()
               ]);

               const payload = {
                    strategy: 'MERGE',
                    data: {
                         profile: {
                              displayName: userName,
                              motherLanguage: motherLanguage,
                              avatarId: avatarId
                         },
                         stats: stats,
                         words: words,
                         sentences: sentences,
                         conversations: conversations
                    }
               };

               // 2. Push to Server
               const response = await ApiClient.syncPush(payload);

               // 3. Process Response (Update Local DB)
               if (response && response.data) {
                    await SyncService.updateLocalDatabase(response.data);
               }

               console.log('[SyncService] Merge completed successfully.');
          } catch (e) {
               console.error('[SyncService] Merge failed', e);
               throw e;
          }
     },

     /**
      * Pulls latest data from server and replaces local data.
      * Typically called on App Launch.
      */
     pullServerData: async (): Promise<void> => {
          try {
               console.log('[SyncService] Pulling server data...');
               const response = await ApiClient.syncPull();

               if (response && response.data) {
                    await SyncService.updateLocalDatabase(response.data);
               }
               console.log('[SyncService] Pull completed.');
          } catch (e) {
               console.error('[SyncService] Pull failed', e);
               // Don't throw, just log. App can continue with local data.
          }
     },

     /**
      * Updates local database with data from server
      */
     updateLocalDatabase: async (data: any): Promise<void> => {
          // Clear existing data? Or upsert?
          // User requested "merge", and server returns unified state.
          // Safest is to overwrite to ensure consistency with server.

          // However, DatabaseService doesn't have "saveAll".
          // We should implement bulk save or iteration.

          // To be safe and clean, we might want to clear and re-populate, 
          // BUT checking for "syncedAt" or conflicts might be better in future.
          // For now: Clear and Re-populate is simplest and most robust for ensuring consistency.

          // DATA: words, sentences, conversations, stats, profile

          // 1. Profile
          if (data.profile) {
               if (data.profile.displayName) await StorageService.saveUserName(data.profile.displayName);
               if (data.profile.motherLanguage) await StorageService.saveMotherLanguage(data.profile.motherLanguage);
               if (data.profile.avatarId) await StorageService.saveUserAvatar(data.profile.avatarId);
          }

          // 2. Stats
          if (data.stats) {
               // We need a way to set stats directly. StorageService only has update or get.
               // We will add a method to StorageService or use AsyncStorage directly here?
               // Using AsyncStorage directly here avoids modifying StorageService just for this.
               // Or better, add `setPracticeStats` to StorageService.
               // For now, I'll use the key import if possible, or just string key.
               // STORAGE_KEYS is not exported. I should add `setPracticeStats` to StorageService.
               await StorageService.setPracticeStats(data.stats);
          }

          // 3. Words
          if (data.words && Array.isArray(data.words)) {
               // Ideally clear old words first to remove deleted ones
               // But DatabaseService `clearAllData` wipes everything.
               // Let's implement partial updates or clear-all strategy.
               // Since we are syncing EVERYTHING, clearing DB is acceptable.

               await DatabaseService.clearAllData();

               // Re-populate Words
               for (const w of data.words) {
                    await DatabaseService.saveWord(w);
               }
          }

          // 4. Sentences
          if (data.sentences && Array.isArray(data.sentences)) {
               for (const s of data.sentences) {
                    await DatabaseService.saveSentence(s);
               }
          }

          // 5. Conversations
          if (data.conversations && Array.isArray(data.conversations)) {
               for (const c of data.conversations) {
                    await DatabaseService.saveConversation(c);
               }
          }
     }
};
