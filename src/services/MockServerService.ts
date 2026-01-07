[1 / 3] // Mock Server Service to simulate backend AI processing

import { Word, Meaning } from '../types';

const MOCK_IMAGE = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtkzZMTh_n9DE3CznuCnA8wVdQI7IQT9sDng&s';

// Helper to generate Google TTS URL
const getGoogleAudioUrl = (text: string): string => {
     return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
};

// Mock data definitions - matching Word/Meaning interface
const MOCK_DEFINITIONS: Record<string, { phonetic: string; topics: string[]; meanings: Meaning[] }> = {
     apple: {
          phonetic: '/ˈæp.əl/',
          topics: ['Food', 'Daily Life'],
          meanings: [
               {
                    id: 'm1',
                    partOfSpeech: 'noun',
                    definition: 'A round fruit with red or green skin and a white inside.',
                    example: 'I eat an apple every day for breakfast.',
                    exampleImageUrl: MOCK_IMAGE,
                    exampleAudioUrl: getGoogleAudioUrl('I eat an apple every day for breakfast.'),
                    imageDescription: 'A fresh red apple on a white background'
               },
               {
                    id: 'm2',
                    partOfSpeech: 'noun',
                    definition: 'A city in New York, usually referred to as "The Big Apple".',
                    example: 'We are planning a trip to the Big Apple next summer.',
                    exampleImageUrl: MOCK_IMAGE,
                    exampleAudioUrl: getGoogleAudioUrl('We are planning a trip to the Big Apple next summer.'),
                    imageDescription: 'New York City skyline'
               }
          ]
     },
     book: {
          phonetic: '/bʊk/',
          topics: ['Daily Life', 'Education'],
          meanings: [
               {
                    id: 'm1',
                    partOfSpeech: 'noun',
                    definition: 'A written or printed work consisting of pages glued or sewn together along one side and bound in covers.',
                    example: 'She sat in the garden reading a book.',
                    exampleImageUrl: MOCK_IMAGE,
                    exampleAudioUrl: getGoogleAudioUrl('She sat in the garden reading a book.'),
                    imageDescription: 'An open book on a wooden table'
               },
               {
                    id: 'm2',
                    partOfSpeech: 'verb',
                    definition: 'To make a reservation for (accommodation, a place, etc.); reserve.',
                    example: 'I need to book a flight to London.',
                    exampleImageUrl: MOCK_IMAGE,
                    exampleAudioUrl: getGoogleAudioUrl('I need to book a flight to London.'),
                    image
[2 / 3] Description: 'A person booking a flight on laptop'
               }
          ]
     },
     computer: {
          phonetic: '/kəmˈpjuː.tər/',
          topics: ['Technology'],
          meanings: [
               {
                    id: 'm1',
                    partOfSpeech: 'noun',
                    definition: 'An electronic machine that is used for storing, organizing, and finding words, numbers, and pictures.',
                    example: 'My computer crashed and I lost all my work.',
                    exampleImageUrl: MOCK_IMAGE,
                    exampleAudioUrl: getGoogleAudioUrl('My computer crashed and I lost all my work.'),
                    imageDescription: 'A modern laptop computer'
               }
          ]
     },
     // Default fallback
     default: {
          phonetic: '/wɜːd/',
          topics: ['Other'],
          meanings: [
               {
                    id: 'm1',
                    partOfSpeech: 'noun',
                    definition: 'A single distinct meaningful element of speech or writing.',
                    example: 'Can you spell that word for me?',
                    exampleImageUrl: MOCK_IMAGE,
                    exampleAudioUrl: getGoogleAudioUrl('Can you spell that word for me?'),
                    imageDescription: 'Dictionary page with words'
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
                         audioUrl: getGoogleAudioUrl(wordText),
                         meanings: mockData.meanings,
                         imageUrl: MOCK_IMAGE,
                         topics: mockData.topics,
                         nextReviewDate: new Date().toISOString().split('T')[0],
                         reviewCount: 0,
                         viewCount: 0,
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
                         audioUrl: getGoogleAudioUrl(wordText),
                         meanings: mockData.meanings,
                         imageUrl: imageUri, // USE USER'S IMAGE
                         topics: mockData.topics,
                         nextReviewDate: new Date().toISOString().split('T')[0],
                         reviewCount: 0,
                         viewCount: 0,
                         createdAt: new Date().toISOString(),
                    };
                    resolve(newWord);
               }, 2000);
          });
     },

};
