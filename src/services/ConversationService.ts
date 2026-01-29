import { Conversation, ConversationMessage } from '../types';
import { StorageService } from './StorageService';

const API_BASE_URL = 'https://onestudy.id.vn/v1';

// API Response Types
interface ApiConversationListItem {
     id: string;
     title: string;
     description: string;
     category: string;
     difficulty: 'beginner' | 'intermediate' | 'advanced';
     thumbnail: string;
     created_at: string;
     updated_at: string;
}

interface ApiMessage {
     id: string;
     speaker: string;
     text: string;
     phonetic: string;
     order: number;
}

interface ApiConversationDetail {
     id: string;
     title: string;
     description: string;
     category: string;
     difficulty: 'beginner' | 'intermediate' | 'advanced';
     thumbnail: string;
     messages: ApiMessage[];
     created_at: string;
     updated_at: string;
}

interface ApiResponse<T> {
     meta: {
          code: number;
          message: string;
          pageIndex?: number;
          pageSize?: number;
          totalItems?: number;
          requestId?: string;
     };
     data: T;
}

// Map API message to local ConversationMessage
const mapApiMessageToLocal = (apiMsg: ApiMessage, index: number): ConversationMessage => {
     // Determine role based on speaker or order (odd = user, even = assistant)
     const role: 'user' | 'assistant' = index % 2 === 0 ? 'assistant' : 'user';

     return {
          id: apiMsg.id,
          role,
          text: apiMsg.text,
          translation: undefined, // API doesn't provide translation yet
          audioUrl: undefined, // API doesn't provide audio URL yet
     };
};

// Map API conversation list item to local Conversation (without messages)
const mapApiListItemToLocal = async (apiConv: ApiConversationListItem): Promise<Conversation> => {
     // Get practice data from local storage
     const practicingConvs = await StorageService.getPracticingConversations();
     const localData = practicingConvs.find(c => c.id === apiConv.id);

     return {
          id: apiConv.id,
          title: apiConv.title,
          description: apiConv.description,
          category: apiConv.category,
          difficulty: apiConv.difficulty,
          messages: [], // Will be loaded when detail is fetched
          practiceCount: localData?.practiceCount || 0,
          lastPracticedAt: localData?.lastPracticedAt,
          totalScore: localData?.totalScore,
          isFavorite: localData?.isFavorite,
     };
};

// Map API conversation detail to local Conversation
const mapApiDetailToLocal = async (apiConv: ApiConversationDetail): Promise<Conversation> => {
     // Get practice data from local storage
     const practicingConvs = await StorageService.getPracticingConversations();
     const localData = practicingConvs.find(c => c.id === apiConv.id);

     return {
          id: apiConv.id,
          title: apiConv.title,
          description: apiConv.description,
          category: apiConv.category,
          difficulty: apiConv.difficulty,
          messages: (apiConv.messages || []).map((msg, idx) => mapApiMessageToLocal(msg, idx)),
          practiceCount: localData?.practiceCount || 0,
          lastPracticedAt: localData?.lastPracticedAt,
          totalScore: localData?.totalScore,
          isFavorite: localData?.isFavorite,
     };
};

const MOCK_SUGGESTED_WORDS = [
     { id: 'sw1', word: 'Innovative', definition: 'Featuring new methods; advanced and original.' },
     { id: 'sw2', word: 'Collaborate', definition: 'Work jointly on an activity or project.' },
     { id: 'sw3', word: 'Sustainable', definition: 'Able to be maintained at a certain rate or level.' },
     { id: 'sw4', word: 'Appointment', definition: 'An arrangement to meet someone at a particular time.' },
     { id: 'sw5', word: 'Persist', definition: 'Continue in an opinion or course of action in spite of difficulty.' },
     { id: 'sw6', word: 'Diagnostic', definition: 'Characteristic of a particular disease or condition.' },
     { id: 'sw7', word: 'Fascinating', definition: 'Extremely interesting.' },
     { id: 'sw8', word: 'Breathtaking', definition: 'Astonishing or awe-inspiring in quality, so as to take one\'s breath away.' },
     { id: 'sw9', word: 'Subtle', definition: 'So delicate or precise as to be difficult to analyze or describe.' },
];

export const ConversationService = {
     /**
      * Fetch list of conversations from API
      */
     getConversations: async (page: number = 0, size: number = 10): Promise<Conversation[]> => {
          try {
               const response = await fetch(`${API_BASE_URL}/conversations?page=${page}&size=${size}`);

               if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
               }

               const apiResponse: ApiResponse<ApiConversationListItem[]> = await response.json();

               if (apiResponse.meta.code !== 200000) {
                    throw new Error(apiResponse.meta.message || 'Failed to fetch conversations');
               }

               // Map API data to local format
               const conversations = await Promise.all(
                    apiResponse.data.map(item => mapApiListItemToLocal(item))
               );

               return conversations;
          } catch (error) {
               console.error('[ConversationService] Error fetching conversations:', error);
               throw error;
          }
     },

     /**
      * Fetch conversation detail by ID from API
      */
     getConversationById: async (id: string): Promise<Conversation | undefined> => {
          try {
               const response = await fetch(`${API_BASE_URL}/conversations/${id}`);

               if (!response.ok) {
                    if (response.status === 404) {
                         // If not found in API, check local storage
                         const userConversations = await StorageService.getPracticingConversations();
                         return userConversations.find(c => c.id === id);
                    }
                    throw new Error(`API error: ${response.status}`);
               }

               const apiResponse: ApiResponse<ApiConversationDetail> = await response.json();

               if (apiResponse.meta.code !== 200000) {
                    throw new Error(apiResponse.meta.message || 'Failed to fetch conversation detail');
               }

               // Map API data to local format
               const conversation = await mapApiDetailToLocal(apiResponse.data);
               return conversation;
          } catch (error) {
               console.error(`[ConversationService] Error fetching conversation ${id}:`, error);

               // Fallback to local storage
               const userConversations = await StorageService.getPracticingConversations();
               return userConversations.find(c => c.id === id);
          }
     },

     getSuggestedWords: async (): Promise<{ id: string, word: string, definition: string }[]> => {
          return MOCK_SUGGESTED_WORDS;
     },

     addConversationToPractice: async (conversation: Conversation): Promise<void> => {
          await StorageService.addPracticingConversation(conversation);
     },

     incrementPracticeCount: async (id: string): Promise<void> => {
          // This is now handled by StorageService.incrementConversationPractice
          // Keep for backward compatibility
     }
};
