import { ShadowingLesson } from '../types';

const API_BASE_URL = 'https://onestudy.id.vn/v1';

interface ApiResponse<T> {
     meta: {
          code: number;
          message: string;
          [key: string]: any;
     };
     data: T;
}

export const ShadowingService = {
     getLessons: async (page: number = 0, size: number = 10): Promise<ShadowingLesson[]> => {
          try {
               const response = await fetch(`${API_BASE_URL}/shadowing/lessons?page=${page}&size=${size}`);
               const json: ApiResponse<ShadowingLesson[]> = await response.json();

               if (json.meta.code === 200000) {
                    return json.data;
               } else {
                    throw new Error(json.meta.message || 'Failed to fetch shadowing lessons');
               }
          } catch (error) {
               console.error('[ShadowingService] Error fetching lessons:', error);
               throw error;
          }
     },

     getLessonById: async (id: string): Promise<ShadowingLesson> => {
          try {
               const response = await fetch(`${API_BASE_URL}/shadowing/lessons/${id}`);
               const json: ApiResponse<ShadowingLesson> = await response.json();

               if (json.meta.code === 200000) {
                    return json.data;
               } else {
                    throw new Error(json.meta.message || 'Failed to fetch lesson detail');
               }
          } catch (error) {
               console.error('[ShadowingService] Error fetching lesson detail:', error);
               throw error;
          }
     }
};
