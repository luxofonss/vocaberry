import { Word } from '../types';
import { Platform } from 'react-native';

const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY || '';

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
     }
};
