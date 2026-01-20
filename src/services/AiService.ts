import { Word } from '../types';
import { Platform } from 'react-native';

const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY || '123';
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://onestudy.id.vn/api/v1'

export const AiService = {
     /**
      * Dùng Claude để tạo bộ thẻ từ vựng hoàn chỉnh từ con số 0
      */
     generateFullWordData: async (word: string): Promise<Partial<Word>> => {
          let apiUrl = 'https://api.anthropic.com/v1/messages';

          if (Platform.OS === 'web') {
               apiUrl = 'https://cors-anywhere.herokuapp.com/' + apiUrl;
          }

          const systemPrompt = `
          Provide accurate dictionary information for: "${word}"

          Return ONLY this JSON structure:
{
  "word": "${word}",
  "phonetic": "/IPA/",
  "imageThumbnailDescription": "Prompt to generate the thumbnail image that visually represents the word",
  "meanings": [
    {
      "partOfSpeech": "noun",
      "definition": "Simple definition",
      "example": "Simple contextual sentence using the word, avoid conjugated forms",
      "imageDescription": "Prompt to generate an image illustrating the word meaning in example"
    }
  ]
}

          STRICT RULES:
          - If current word is pass form, s, es, ed, ing, etc, return the base form
          - Check standard dictionaries (Oxford, Cambridge, Merriam-Webster)
          - Only include meanings that are in actual dictionaries
          - Do NOT create theoretical or derived meanings
          - Stick to literal, primary definitions
          - If a word has only 1 common meaning, return only 1 meaning
          - Maximum 5 meanings, only if they are all commonly used
          - Order by popular meanings first
          - No creative interpretations
          `;

          try {
               const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                         'x-api-key': CLAUDE_API_KEY,
                         'anthropic-version': '2023-06-01',
                         'content-type': 'application/json',
                         'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                         model: 'claude-sonnet-4-20250514',
                         max_tokens: 1000,
                         temperature: 0.1,
                         system: systemPrompt,
                         messages: [{ role: 'user', content: `Generate dictionary for the word: "${word}"` }],
                    }),
               });

               const responseText = await response.text();
               let result;
               try {
                    result = JSON.parse(responseText);
               } catch (e) {
                    if (responseText.includes('cors-anywhere')) {
                         throw new Error('CORS Proxy chưa được kích hoạt. Hãy truy cập herokuapp corsdemo.');
                    }
                    throw new Error('Claude response not valid JSON.');
               }

               const content = result.content[0].text;
               const jsonString = content.replace(/```json|```/g, '').trim();
               return JSON.parse(jsonString);
          } catch (error: any) {
               console.error('[AiService] ❌ Lỗi:', error.message);
               throw error;
          }
     },

     /**
      * Kiểm tra độ chính xác phát âm
      * @param text - Văn bản cần phát âm
      * @param base64Audio - Audio dạng base64 (data:audio/ogg;base64,...)
      * @returns Kết quả độ chính xác phát âm
      */
     checkPronunciationAccuracy: async (text: string, base64Audio: string): Promise<{
          meta: {
               code: number;
               message: string;
               requestId: string;
          };
          data: {
               recognizedText: string;
               accuracyScore: number;
               fluencyScore: number;
               completenessScore: number;
               pronScore: number;
               words: Array<{
                    word: string;
                    accuracyScore: number;
                    errorType: string;
                    offset: number;
                    duration: number;
                    syllables: Array<{
                         syllable: string;
                         accuracyScore: number;
                         phonemes: Array<{
                              phoneme: string;
                              accuracyScore: number;
                              nbestPhonemes: any;
                         }> | null;
                    }>;
               }>;
               // Legacy fields for backward compatibility
               start_time?: string;
               end_time?: string;
               ipa_transcript?: string;
               is_letter_correct_all_words?: string;
               matched_transcripts?: string;
               matched_transcripts_ipa?: string;
               pair_accuracy_category?: string;
               pronunciation_accuracy?: number;
               real_transcript?: string;
               real_transcripts?: string;
               real_transcripts_ipa?: string;
          };
     }> => {
          try {
               const body = JSON.stringify({
                    title: text,
                    base64Audio: base64Audio,
               });
               console.log(body)
               const response = await fetch(`${BASE_URL}/pub/pronunciations/accuracy`, {
                    method: 'POST',
                    headers: {
                         'Accept': '*/*',
                         'Content-Type': 'application/json',
                    },
                    body: body,
               });

               if (!response.ok) {
                    throw new Error(`API returned status ${response.status}`);
               }

               const result = await response.json();
               console.log('[AiService] ✅ Pronunciation Result:', JSON.stringify(result, null, 2));
               return result;
          } catch (error: any) {
               console.error('[AiService] ❌ Pronunciation check error:', error.message);
               throw error;
          }
     }
};
