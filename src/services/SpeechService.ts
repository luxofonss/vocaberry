// Speech Service using Expo Speech and Audio

import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

export const SpeechService = {
     // Speak a word or sentence (TTS fallback)
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

     // Speak a word (slower for clarity) - TTS fallback
     speakWord(word: string): void {
          this.speak(word, { rate: 0.8 });
     },

     // Speak a sentence (normal speed) - TTS fallback
     speakSentence(sentence: string): void {
          this.speak(sentence, { rate: 0.9 });
     },

     // Play audio from URL (preferred method)
     async playAudio(audioUrl: string): Promise<void> {
          let sound: Audio.Sound | null = null;
          try {
               if (!audioUrl || audioUrl.trim() === '') {
                    console.warn('[SpeechService] No audio URL provided');
                    return;
               }

               // Stop any currently playing audio
               await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    shouldDuckAndroid: true,
               });

               const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: audioUrl },
                    { shouldPlay: true }
               );
               sound = newSound;

               // Wait for playback to finish
               await new Promise<void>((resolve, reject) => {
                    const timeout = setTimeout(() => {
                         reject(new Error('Audio playback timeout'));
                    }, 10000); // 10 second timeout

                    sound?.setOnPlaybackStatusUpdate((status) => {
                         if (status.isLoaded) {
                              if (status.didJustFinish) {
                                   clearTimeout(timeout);
                                   resolve();
                              } else if (status.error) {
                                   clearTimeout(timeout);
                                   reject(new Error(`Audio playback error: ${status.error}`));
                              }
                         } else {
                              // Status not loaded yet, wait
                         }
                    });
               });

               // Cleanup
               if (sound) {
                    await sound.unloadAsync();
               }
          } catch (error: any) {
               console.error('[SpeechService] Error playing audio:', error);
               // Cleanup on error
               if (sound) {
                    try {
                         await sound.unloadAsync();
                    } catch (cleanupError) {
                         console.error('[SpeechService] Error cleaning up sound:', cleanupError);
                    }
               }
               // Re-throw error so caller can handle fallback
               throw error;
          }
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
