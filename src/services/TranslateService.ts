// Translate Service - Google Translate API

export const TranslateService = {
     /**
      * Translate text from source language to target language using Google Translate API
      * @param text - Text to translate
      * @param sourceLang - Source language code (e.g., 'vi', 'zh', 'es')
      * @param targetLang - Target language code (default: 'en')
      * @returns Translated text or null if translation fails
      */
     translate: async (text: string, sourceLang: string, targetLang: string = 'en'): Promise<string | null> => {
          if (!text || !text.trim()) {
               return null;
          }

          try {
               const encodedText = encodeURIComponent(text);
               const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodedText}`;

               const response = await fetch(url);
               if (!response.ok) {
                    console.error('[TranslateService] API request failed:', response.status);
                    return null;
               }

               const data = await response.json();
               
               // Parse response: data[0][0][0] contains the translated text
               if (data && Array.isArray(data) && data[0] && Array.isArray(data[0]) && data[0][0] && Array.isArray(data[0][0])) {
                    const translatedText = data[0][0][0];
                    if (translatedText && typeof translatedText === 'string') {
                         return translatedText.trim();
                    }
               }

               console.warn('[TranslateService] Unexpected response format:', data);
               return null;
          } catch (error: any) {
               console.error('[TranslateService] Translation error:', error.message);
               return null;
          }
     }
};

