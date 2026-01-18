// Speech Service using Expo Speech and Audio

import * as Speech from 'expo-speech';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

export const SpeechService = {
     // Speak a word or sentence (TTS fallback)
     async speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }): Promise<void> {
          try {
               await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
                    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                    shouldDuckAndroid: true,
                    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                    staysActiveInBackground: false,
                    playThroughEarpieceAndroid: false,
               });
          } catch (e) {
               console.log('Failed to set audio mode for speech:', e);
          }

          Speech.speak(text, {
               language: 'en-US',
               rate: options?.rate ?? 0.9,
               pitch: options?.pitch ?? 1.0,
               volume: options?.volume ?? 1.0,
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
          console.log(`[SpeechService] 🎵 playAudio called with URL: ${audioUrl}`);
          let sound: Audio.Sound | null = null;
          try {
               if (!audioUrl || audioUrl.trim() === '') {
                    console.warn('[SpeechService] No audio URL provided');
                    return;
               }

               // Stop any currently playing audio and optimize for playback
               console.log('[SpeechService] Setting audio mode for playback...');
               await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
                    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                    shouldDuckAndroid: true,
                    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                    staysActiveInBackground: false,
                    playThroughEarpieceAndroid: false, // Ensure it plays through speaker
               });

               console.log('[SpeechService] Creating Sound object...');
               const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: audioUrl },
                    { shouldPlay: true, volume: 1.0 }
               );
               sound = newSound;
               console.log('[SpeechService] Sound created and playing started');

               // Wait for playback to finish
               await new Promise<void>((resolve, reject) => {
                    const timeout = setTimeout(() => {
                         console.warn('[SpeechService] Playback timeout hit');
                         reject(new Error('Audio playback timeout'));
                    }, 10000); // 10 second timeout

                    sound?.setOnPlaybackStatusUpdate((status) => {
                         if (!status.isLoaded) {
                              if (status.error) {
                                   console.error(`[SpeechService] Status error: ${status.error}`);
                                   clearTimeout(timeout);
                                   reject(new Error(`Audio playback error: ${status.error}`));
                              }
                         } else {
                              if (status.didJustFinish) {
                                   console.log('[SpeechService] Playback finished naturally');
                                   clearTimeout(timeout);
                                   resolve();
                              }
                         }
                    });
               });

               // Cleanup
               if (sound) {
                    console.log('[SpeechService] Unloading sound...');
                    await sound.unloadAsync();
               }
          } catch (error: any) {
               console.error('[SpeechService] ❌ Error playing audio:', error);
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

     // Generate Google TTS URL for audio
     getAudioUrl(text: string): string {
          return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
     },

     // Fetch and play native audio
     async playNativeAudio(text: string): Promise<void> {
          console.log(`[SpeechService] 🔊 playNativeAudio called for: "${text}"`);
          const url = this.getAudioUrl(text);
          console.log(`[SpeechService] Generated URL: ${url}`);
          await this.playAudio(url);
     },
};
