// Mock Server Service to simulate backend AI processing

import { Word, Topic, Meaning } from '../types';

// Mock data definitions
const MOCK_DEFINITIONS: Record<string, Partial<Word>> = {
     apple: {
          phonetic: '/ˈæp.əl/',
          imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800', // Start with generic image
          topic: 'Food',
          meanings: [
               {
                    id: 'm1',
                    partOfSpeech: 'noun',
                    definition: 'A round fruit with red or green skin and a white inside.',
                    example: 'I eat an apple every day for breakfast.',
                    exampleTranslation: 'Tôi ăn một quả táo mỗi ngày cho bữa sáng.',
                    exampleImage: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600'
               },
               {
                    id: 'm2',
                    partOfSpeech: 'noun',
                    definition: 'A city in New York, usually referred to as "The Big Apple".',
                    example: 'We are planning a trip to the Big Apple next summer.',
                    exampleTranslation: 'Chúng tôi đang lên kế hoạch đi New York vào mùa hè tới.'
               }
          ]
     },
     book: {
          phonetic: '/bʊk/',
          imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
          topic: 'Daily Life',
          meanings: [
               {
                    id: 'm1',
                    partOfSpeech: 'noun',
                    definition: 'A written or printed work consisting of pages glued or sewn together along one side and bound in covers.',
                    example: 'She sat in the garden reading a book.',
                    exampleTranslation: 'Cô ấy ngồi trong vườn đọc sách.',
                    exampleImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600'
               },
               {
                    id: 'm2',
                    partOfSpeech: 'verb',
                    definition: 'To make a reservation for (accommodation, a place, etc.); reserve.',
                    example: 'I need to book a flight to London.',
                    exampleTranslation: 'Tôi cần đặt vé máy bay đi London.'
               }
          ]
     },
     computer: {
          phonetic: '/kəmˈpjuː.tər/',
          imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
          topic: 'Technology',
          meanings: [
               {
                    id: 'm1',
                    partOfSpeech: 'noun',
                    definition: 'An electronic machine that is used for storing, organizing, and finding words, numbers, and pictures.',
                    example: 'My computer crashed and I lost all my work.',
                    exampleTranslation: 'Máy tính của tôi bị hỏng và tôi mất hết dữ liệu.'
               }
          ]
     },
     // Default fallback
     default: {
          phonetic: '/wɜːd/',
          imageUrl: 'https://images.unsplash.com/photo-1499336315816-097655dcfbda?w=800',
          topic: 'Other',
          meanings: [
               {
                    id: 'm1',
                    definition: 'A single distinct meaningful element of speech or writing.',
                    example: 'Can you spell that word for me?',
                    exampleTranslation: 'Bạn có thể đánh vần từ đó cho tôi không?'
               }
          ]
     }
};

export const MockServerService = {
     // Simulate processing a word input
     processWord: async (wordText: string): Promise<Word> => {
          return new Promise((resolve) => {
               setTimeout(() => {
                    const lowerWord = wordText.toLowerCase().trim();
                    const mockData = MOCK_DEFINITIONS[lowerWord] || MOCK_DEFINITIONS['default'];

                    const newWord: Word = {
                         id: Date.now().toString(),
                         word: wordText,
                         phonetic: mockData.phonetic,
                         meanings: mockData.meanings || [],
                         imageUrl: mockData.imageUrl!,
                         topic: mockData.topic || 'Other',
                         nextReviewDate: new Date().toISOString().split('T')[0],
                         reviewCount: 0,
                         createdAt: new Date().toISOString(),
                    };
                    resolve(newWord);
               }, 1500);
          });
     },

     // Simulate processing an image input (Camera)
     processImageWord: async (wordText: string, imageUri: string): Promise<Word> => {
          return new Promise((resolve) => {
               setTimeout(() => {
                    const lowerWord = wordText.toLowerCase().trim();
                    const mockData = MOCK_DEFINITIONS[lowerWord] || MOCK_DEFINITIONS['default'];

                    const newWord: Word = {
                         id: Date.now().toString(),
                         word: wordText,
                         phonetic: mockData.phonetic,
                         meanings: mockData.meanings || [],
                         imageUrl: imageUri, // USE USER'S IMAGE
                         topic: mockData.topic || 'Other',
                         nextReviewDate: new Date().toISOString().split('T')[0],
                         reviewCount: 0,
                         createdAt: new Date().toISOString(),
                    };
                    resolve(newWord);
               }, 2000);
          });
     },
};
