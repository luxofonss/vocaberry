// Speech Service using Expo Speech

import * as Speech from 'expo-speech';

export const SpeechService = {
     // Speak a word or sentence
     speak(text: string, options?: { rate?: number; pitch?: number }): void {
          Speech.speak(text, {
               language: 'en-US',
               rate: options?.rate ?? 0.9,
               pitch: options?.pitch ?? 1.0,
               onError: (error) => {
                    console.error('Speech error:', error);
               },
          });
     },

     // Speak a word (slower for clarity)
     speakWord(word: string): void {
          this.speak(word, { rate: 0.8 });
     },

     // Speak a sentence (normal speed)
     speakSentence(sentence: string): void {
          this.speak(sentence, { rate: 0.9 });
     },

     // Stop speaking
     stop(): void {
          Speech.stop();
     },

     // Check if currently speaking
     async isSpeaking(): Promise<boolean> {
          return await Speech.isSpeakingAsync();
     },
};
