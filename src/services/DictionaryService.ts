import { Word, Meaning } from '../types';
import { EventBus } from './EventBus';
import { StorageService } from './StorageService';

// Cấu hình Token Pollinations
const POLLINATIONS_AUTH_TOKEN = process.env.EXPO_PUBLIC_POLLINATIONS_AUTH_TOKEN || '';

export const DictionaryService = {
     /**
      * Tra cứu từ điển AI-First (Dùng Claude để tạo nội dung, Pollinations để tạo ảnh)
      * Trả về null nếu không tìm thấy từ hoặc từ không có nghĩa liên quan đến input của user
      */
     lookup: async (wordText: string, userExamples: string[] = [], customMainImage?: string): Promise<{ word: Word, isNew: boolean, originalText: string } | null> => {
          const inputWord = wordText.trim().toLowerCase();
          console.log(`[DictionaryService] 🧠 Đang dùng AI để phân tích từ: "${inputWord}"...`);

          // 0. Kiểm tra DB local (Tránh tạo trùng)
          try {
               const allWords = await StorageService.getWords();
               const existing = allWords.find(w => w.word.toLowerCase() === inputWord);
               if (existing) {
                    console.log(`[DictionaryService] ♻️ Tìm thấy từ "${inputWord}" đã có trong máy. Dùng luôn.`);
                    return { word: existing, isNew: false, originalText: wordText };
               }
          } catch (e) { }

          let apiParsedMeanings: Meaning[] = [];
          let apiPhonetic = `/${inputWord}/`;
          let aiData: any = {};

          // 1. Thực hiện gọi Claude AI để lấy dữ liệu Sạch (có imageDescription/imageThumbnailDescription)
          try {
               const { AiService } = require('./AiService');
               aiData = await AiService.generateFullWordData(inputWord);

               // Kiểm tra nếu AI không trả về dữ liệu hợp lệ hoặc không có nghĩa
               if (!aiData || !aiData.meanings || aiData.meanings.length === 0) {
                    console.log(`[DictionaryService] ⚠️ AI không tìm thấy nghĩa cho từ "${inputWord}". Trả về empty.`);
                    return null;
               }

               console.log(`[DictionaryService] ✨ AI đã tạo xong ${aiData.meanings.length} nghĩa cực chuẩn.`);
               apiPhonetic = aiData.phonetic || apiPhonetic;

               apiParsedMeanings = aiData.meanings.map((m: any) => ({
                    id: `m_ai_${Date.now()}_${Math.random()}`,
                    partOfSpeech: m.partOfSpeech,
                    definition: m.definition,
                    example: m.example || '',
                    imageDescription: m.imageDescription || '',
                    exampleAudioUrl: m.example ? DictionaryService.getGoogleAudioUrl(m.example) : '',
                    exampleImageUrl: '',
               }));
          } catch (error: any) {
               console.error('[DictionaryService] ❌ Lỗi AI Lookup:', error.message);
               // Trả về null thay vì throw error để caller xử lý
               return null;
          }

          // 2. Gộp với ví dụ từ người dùng (user examples phải được đẩy lên đầu, giữ nguyên thứ tự)
          // Tạo array user examples trước (giữ nguyên thứ tự)
          const userMeanings: Meaning[] = userExamples
               .filter(text => text.trim())
               .map((text, index) => ({
                    id: `user_m_${Date.now()}_${index}`,
                    partOfSpeech: 'user',
                    definition: 'Personal Context',
                    example: text.trim(),
                    exampleAudioUrl: DictionaryService.getGoogleAudioUrl(text),
                    exampleImageUrl: '',
                    imageDescription: '', // User examples không có AI prompt
               }));

          // Gộp: user examples ở đầu, sau đó là API meanings
          const combinedMeanings: Meaning[] = [...userMeanings, ...apiParsedMeanings];

          // Không dùng ảnh placeholder, image rỗng để hiển thị loading
          const previewMeanings = combinedMeanings.map(m => ({ ...m, exampleImageUrl: '' }));

          // Trả về luôn dữ liệu với imageUrl rỗng - UI sẽ show ActivityIndicator/skeleton
          const previewWord: Word = {
               id: inputWord,
               word: inputWord,
               phonetic: apiPhonetic,
               audioUrl: DictionaryService.getGoogleAudioUrl(inputWord),
               imageUrl: customMainImage || '',
               meanings: previewMeanings,
               nextReviewDate: new Date().toISOString().split('T')[0],
               reviewCount: 0,
               viewCount: 0, // Khởi tạo viewCount = 0
               topics: ['Uncategorized'],
               createdAt: new Date().toISOString(),
          };

          // Lưu lại dữ liệu preview luôn vào DB để view nhanh
          StorageService.addWord(previewWord);

          // LẤY PROMPT từ claude nếu có
          const mainImagePrompt = (aiData?.imageThumbnailDescription && typeof aiData.imageThumbnailDescription === 'string') ? aiData.imageThumbnailDescription : `Minimalist vector illustration of "${inputWord}". Simple flat design, clear symbolism, no text, no letters, white background.`;

          // Sau khi trả về, xử lý tạo image AI ở background
          (async () => {
               // 3. --- QUY TRÌNH "VẼ" AI THẬT ---
               console.log(`[DictionaryService] 🎨 [BG] Đang tạo ảnh AI cho ${combinedMeanings.length} nghĩa...`);

               // Nếu user đã chụp ảnh/chèn ảnh rồi thì KHÔNG gen ảnh AI cho thumbnail nữa
               const mainImagePromise = customMainImage
                    ? Promise.resolve(customMainImage)
                    : DictionaryService.generateAiImage(mainImagePrompt);

               const meaningImagesPromises = combinedMeanings.map((m, i) => {
                    // Ưu tiên dùng prompt từ AI (imageDescription)
                    let prompt = (typeof m.imageDescription === 'string' && m.imageDescription.trim()) ? m.imageDescription.trim() : "";

                    // Chỉ fallback về prompt tự viết nếu AI không có prompt (ví dụ: user examples)
                    if (!prompt) {
                         if (m.example) {
                              prompt = `A clear visualizing scene illustrating the concept: "${m.example}". \nPurpose: describe usage of the word ${inputWord} in that concept\nStyle: clean illustration or realistic photo. \nStrictly NO text, NO letters, NO characters, NO titles, NO subtitles. \nFocus entirely on the action and objects to convey meaning.`;
                         } else {
                              prompt = `A conceptual visual representation of "${m.definition}". \nPurpose: describe usage of the word ${inputWord} in that concept\nUse a clear symbol, icon, or diagram. \nPURELY VISUAL: No text, no labels, no words, no alphabet. \nEducational and minimalist style.`;
                         }
                    }

                    console.log(`[DictionaryService] 🎨 Meaning ${i + 1} prompt: ${prompt.substring(0, 100)}...`);
                    return DictionaryService.generateAiImage(prompt);
               });

               const imageResults = await Promise.all([mainImagePromise, ...meaningImagesPromises]);

               // Check xem user đã chọn ảnh khác chưa (tránh override ảnh user đã chọn)
               const currentWord = await StorageService.getWordById(inputWord);
               if (currentWord && currentWord.imageUrl && currentWord.imageUrl.trim() !== '' && currentWord.imageUrl !== previewWord.imageUrl) {
                    console.log('[DictionaryService] ⚠️ User đã chọn ảnh khác, bỏ qua việc update ảnh AI cho main image');
                    // Vẫn update ảnh cho meanings nếu chưa có
                    const updatedMeanings = combinedMeanings.map((m, i) => {
                         const currentMeaning = currentWord.meanings.find(cm => cm.id === m.id);
                         return {
                              ...m,
                              exampleImageUrl: (currentMeaning?.exampleImageUrl && currentMeaning.exampleImageUrl.trim() !== '')
                                   ? currentMeaning.exampleImageUrl
                                   : (imageResults[i + 1] || '')
                         };
                    });
                    const updatedWord: Word = {
                         ...currentWord,
                         meanings: updatedMeanings,
                    };
                    await StorageService.addWord(updatedWord);
                    EventBus.emit('wordImageUpdated', { wordId: updatedWord.id, word: updatedWord });
                    return;
               }

               const updatedWord: Word = {
                    ...previewWord,
                    imageUrl: imageResults[0],
                    meanings: combinedMeanings.map((m, i) => ({ ...m, exampleImageUrl: imageResults[i + 1] || '' })),
               };
               await StorageService.addWord(updatedWord);
               // Gửi event cập nhật realtime cho toàn bộ app
               console.log(`[DictionaryService] 📡 Emitting wordImageUpdated event for wordId: "${updatedWord.id}"`);
               EventBus.emit('wordImageUpdated', { wordId: updatedWord.id, word: updatedWord });
               console.log('[DictionaryService] ✅ [BG] Đã update lại Word với ảnh thật');
          })();

          return {
               word: previewWord,
               isNew: true,
               originalText: wordText
          };
     },

     /**
      * TẠO ẢNH AI + CONVERT BASE64
      * Model: flux - Chất lượng tốt, giá hợp lý (tốt hơn flux, rẻ hơn flux-pro)
      */
     generateAiImage: async (prompt: string): Promise<string> => {
          if (!prompt) return '';
          try {
               const encodedPrompt = encodeURIComponent(prompt);
               const seed = Math.floor(Math.random() * 1000000);
               // Model options: flux (default), turbo, gptimage, kontext, seedream, flux, flux-pro
               // Chọn flux: chất lượng tốt, giá hợp lý
               const finalUrl = `https://gen.pollinations.ai/image/prompt/${encodedPrompt}?width=320&height=320&seed=${seed}&model=turbo&nologo=true`;

               const headers: HeadersInit = { 'Content-Type': 'application/json' };
               if (POLLINATIONS_AUTH_TOKEN) headers['Authorization'] = `Bearer ${POLLINATIONS_AUTH_TOKEN}`;

               const response = await fetch(finalUrl, { headers });
               if (!response.ok) throw new Error('AI Gen failed');

               const blob = await response.blob();
               return await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
               });
          } catch (e) {
               return `https://images.unsplash.com/photo-1549490349-8643362247b5?w=512&q=80`;
          }
     },

     getGoogleAudioUrl: (text: string): string => {
          return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
     }
};
