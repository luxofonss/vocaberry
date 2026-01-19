// SentencePracticeScreen - Dedicated screen for sentence speaking practice
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
     View,
     Text,
     StyleSheet,
     TouchableOpacity,
     Alert,
     Animated,
     Easing,
     Platform,
     Dimensions,
     ActivityIndicator,
     ScrollView,
     Image,
     FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { gradients } from '../theme/styles';
import { Sentence, RootStackParamList } from '../types';
import { StorageService } from '../services/StorageService';
import { AiService } from '../services/AiService';
import { SpeechService } from '../services/SpeechService';
import { ANIMATION, PRACTICE_TEXTS } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SentencePractice'>;
type SentencePracticeRouteProp = RouteProp<RootStackParamList, 'SentencePractice'>;

export const SentencePracticeScreen: React.FC = () => {
     const navigation = useNavigation<NavigationProp>();
     const route = useRoute<SentencePracticeRouteProp>();
     const { sentenceId } = route.params || {};

     // -- State --
     const [sentences, setSentences] = useState<Sentence[]>([]);
     const [currentIndex, setCurrentIndex] = useState(0);
     const [loading, setLoading] = useState(true);

     // Audio state
     const [isRecording, setIsRecording] = useState(false);
     const [isProcessing, setIsProcessing] = useState(false);
     const [userAudioUri, setUserAudioUri] = useState<string | null>(null);
     const [playingUserAudio, setPlayingUserAudio] = useState(false);
     const [isPlayingNative, setIsPlayingNative] = useState(false);

     // Final results
     const [results, setResults] = useState<any[]>([]);
     const [showReview, setShowReview] = useState(false);

     const currentSentence = sentences[currentIndex];

     // Result state
     const [result, setResult] = useState<{
          accuracy: number;
          realTranscript: string;
          ipaTranscript: string;
          isLetterCorrect: string;
          userIpa: string;
     } | null>(null);

     // Refs
     const audioRecorder = useRef<Audio.Recording | null>(null);
     const userAudioSound = useRef<Audio.Sound | null>(null);
     const successSound = useRef<Audio.Sound | null>(null);
     const errorSound = useRef<Audio.Sound | null>(null);
     const pulseAnim = useRef(new Animated.Value(1)).current;
     const fadeAnim = useRef(new Animated.Value(0)).current;

     // -- Load Data --
     useEffect(() => {
          const loadData = async () => {
               try {
                    let allSentences: Sentence[] = [];
                    const { sentenceId, sentencesLimit, customText } = route.params || {};

                    if (customText) {
                         // Mode: practice a specific custom text
                         allSentences = [{
                              id: 'temp',
                              text: customText,
                              practiceCount: 0,
                              createdAt: new Date().toISOString()
                         }];
                    } else if (sentencesLimit) {
                         // Mode: practice weakest sentences
                         allSentences = await StorageService.getLowestScoreSentences(sentencesLimit);
                    } else {
                         // Mode: practice all or specific
                         allSentences = await StorageService.getSentences();
                    }

                    if (allSentences.length === 0) {
                         Alert.alert('No Sentences', 'Please add some sentences first!');
                         navigation.goBack();
                         return;
                    }

                    setSentences(allSentences);

                    if (sentenceId && !sentencesLimit && !customText) {
                         const idx = allSentences.findIndex(s => s.id === sentenceId);
                         if (idx !== -1) setCurrentIndex(idx);
                    }
               } catch (e) {
                    console.error('Failed to load sentences', e);
               } finally {
                    setLoading(false);
                    Animated.timing(fadeAnim, {
                         toValue: 1,
                         duration: 500,
                         useNativeDriver: true,
                    }).start();
               }
          };
          loadData();
     }, [route.params]); // Changed dependency to handle param updates

     // -- Load Sound Effects --
     useEffect(() => {
          const loadSounds = async () => {
               try {
                    const { sound: success } = await Audio.Sound.createAsync(
                         { uri: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3' },
                         { shouldPlay: false, volume: 1.0 }
                    );
                    successSound.current = success;

                    const { sound: error } = await Audio.Sound.createAsync(
                         { uri: 'https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3' },
                         { shouldPlay: false, volume: 1.0 }
                    );
                    errorSound.current = error;
               } catch (error) {
                    console.log('Failed to load sound effects:', error);
               }
          };
          loadSounds();

          return () => {
               successSound.current?.unloadAsync();
               errorSound.current?.unloadAsync();
          };
     }, []);

     useEffect(() => {
          return () => {
               if (audioRecorder.current) {
                    audioRecorder.current.stopAndUnloadAsync().catch(() => { });
                    audioRecorder.current = null;
               }
               if (userAudioSound.current) {
                    userAudioSound.current.unloadAsync().catch(() => { });
               }
          };
     }, []);

     // -- Animations --
     const startPulse = useCallback(() => {
          Animated.loop(
               Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
               ])
          ).start();
     }, [pulseAnim]);

     const stopPulse = useCallback(() => {
          pulseAnim.stopAnimation();
          pulseAnim.setValue(1);
     }, [pulseAnim]);

     // -- Play Sound Effect --
     const playSound = useCallback(async (isCorrect: boolean) => {
          try {
               const sound = isCorrect ? successSound.current : errorSound.current;
               if (sound) {
                    await sound.replayAsync();
               }
          } catch (e) {
               console.log('Error playing sound:', e);
          }
     }, []);

     // -- Analysis Logic --
     const analyzeSpeech = useCallback(async (uri: string) => {
          setIsProcessing(true);
          try {
               const currentSentence = sentences[currentIndex];
               const base64Audio = await FileSystem.readAsStringAsync(uri, {
                    encoding: FileSystem.EncodingType.Base64,
               });

               const response = await AiService.checkPronunciationAccuracy(
                    currentSentence.text,
                    `data:audio/m4a;base64,${base64Audio}`
               );

               // Validate response data
               if (!response || !response.data) {
                    throw new Error('Không nhận được dữ liệu từ API');
               }

               const data = response.data;

               // Check if required fields exist
               if (typeof data.pronunciation_accuracy === 'undefined' ||
                    typeof data.is_letter_correct_all_words === 'undefined') {
                    console.error('API Error Response:', data);
                    throw new Error('Dữ liệu API không đầy đủ');
               }

               setResult({
                    accuracy: data.pronunciation_accuracy,
                    realTranscript: data.real_transcript || '',
                    ipaTranscript: data.real_transcripts_ipa || '', // Chuẩn IPA
                    isLetterCorrect: data.is_letter_correct_all_words,
                    userIpa: data.ipa_transcript || '', // IPA người dùng nói
               });

               // Save progress
               if (currentSentence.id !== 'temp') {
                    await StorageService.incrementSentencePractice(currentSentence.id, data.pronunciation_accuracy);
               }

               // Play sound based on accuracy (threshold 80%)
               // Save result for review
               const newResult = {
                    sentence: currentSentence,
                    accuracy: data.pronunciation_accuracy,
                    ipaTranscript: data.real_transcripts_ipa || '',
                    userIpa: data.ipa_transcript || '',
                    isCorrect: data.pronunciation_accuracy >= 80,
                    isLetterCorrect: data.is_letter_correct_all_words
               };

               setResults(prev => {
                    const next = [...prev];
                    next[currentIndex] = newResult;
                    return next;
               });

               // Play sound based on accuracy (threshold 80%)
               playSound(data.pronunciation_accuracy >= 80);
          } catch (error) {
               console.error('Analysis error:', error);

               // Show more specific error message
               const errorMessage = error instanceof Error
                    ? error.message
                    : 'Sorry, we couldn\'t analyze your speech. Please try again.';

               Alert.alert('Analysis Failed', errorMessage);

               // Reset recording state so user can try again
               setUserAudioUri(null);
          } finally {
               setIsProcessing(false);
          }
     }, [sentences, currentIndex]);

     // -- Audio Interaction --
     const handleMicPress = useCallback(async () => {
          if (isRecording) {
               // STOP RECORDING
               setIsRecording(false);
               stopPulse();
               try {
                    if (!audioRecorder.current) return;
                    await audioRecorder.current.stopAndUnloadAsync();
                    const uri = audioRecorder.current.getURI();
                    setUserAudioUri(uri);
                    if (uri) {
                         analyzeSpeech(uri); // AUTO CALL
                    }
               } catch (error) {
                    console.error('Stop recording error:', error);
               } finally {
                    audioRecorder.current = null;
                    Audio.setAudioModeAsync({
                         allowsRecordingIOS: false,
                         playsInSilentModeIOS: true,
                         interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                         shouldDuckAndroid: true,
                         interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                         staysActiveInBackground: false,
                         playThroughEarpieceAndroid: false,
                    }).catch(() => { });
               }
          } else {
               // START RECORDING
               setResult(null);
               setUserAudioUri(null);
               try {
                    const { status } = await Audio.requestPermissionsAsync();
                    if (status !== 'granted') {
                         Alert.alert('Permission denied', 'Microphone access is required for practice.');
                         return;
                    }

                    await Audio.setAudioModeAsync({
                         allowsRecordingIOS: true,
                         playsInSilentModeIOS: true,
                         interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                         shouldDuckAndroid: true,
                         interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                         staysActiveInBackground: false,
                         playThroughEarpieceAndroid: false,
                    });

                    // CLEANUP previous recorder if any
                    if (audioRecorder.current) {
                         try {
                              await audioRecorder.current.stopAndUnloadAsync();
                         } catch (e) {
                              // ignore
                         }
                         audioRecorder.current = null;
                    }

                    audioRecorder.current = new Audio.Recording();
                    const recordingOptions: any = {
                         android: {
                              extension: '.m4a',
                              outputFormat: Audio.AndroidOutputFormat.MPEG_4,
                              audioEncoder: Audio.AndroidAudioEncoder.AAC,
                              sampleRate: 44100,
                              numberOfChannels: 1,
                              bitRate: 128000,
                         },
                         ios: {
                              extension: '.m4a',
                              audioQuality: Audio.IOSAudioQuality.HIGH,
                              sampleRate: 44100,
                              numberOfChannels: 1,
                              bitRate: 128000,
                              linearPCMBitDepth: 16,
                              linearPCMIsBigEndian: false,
                              linearPCMIsFloat: false,
                         },
                    };

                    await audioRecorder.current.prepareToRecordAsync(recordingOptions);
                    await audioRecorder.current.startAsync();
                    setIsRecording(true);
                    startPulse();
               } catch (error) {
                    console.error('Start recording error:', error);
                    setIsRecording(false);
               }
          }
     }, [isRecording, stopPulse, startPulse, analyzeSpeech]);

     const handlePlayBack = useCallback(async () => {
          if (!userAudioUri) return;
          try {
               if (userAudioSound.current) {
                    await userAudioSound.current.unloadAsync();
               }
               setPlayingUserAudio(true);
               const { sound } = await Audio.Sound.createAsync(
                    { uri: userAudioUri },
                    { shouldPlay: true }
               );
               userAudioSound.current = sound;
               sound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                         setPlayingUserAudio(false);
                    }
               });
          } catch (error) {
               console.error('Playback error:', error);
               setPlayingUserAudio(false);
          }
     }, [userAudioUri]);

     const handleNext = useCallback(() => {
          if (currentIndex < sentences.length - 1) {
               setCurrentIndex(prev => prev + 1);
               setResult(null);
               setUserAudioUri(null);
          } else {
               setShowReview(true);
          }
     }, [currentIndex, sentences]);

     const handlePlayNative = useCallback(async () => {
          console.log('[SentencePracticeScreen] 🔊 handlePlayNative triggered');
          if (!currentSentence) {
               console.warn('[SentencePracticeScreen] No current sentence found');
               return;
          }
          console.log(`[SentencePracticeScreen] Speaking: "${currentSentence.text}"`);
          setIsPlayingNative(true);
          try {
               await SpeechService.playNativeAudio(currentSentence.text);
               console.log('[SentencePracticeScreen] playNativeAudio finished successfully');
          } catch (e) {
               console.error('[SentencePracticeScreen] Native play error:', e);
               // Fallback to basic TTS
               console.log('[SentencePracticeScreen] Attempting fallback to speakSentence...');
               SpeechService.speakSentence(currentSentence.text);
          } finally {
               setIsPlayingNative(false);
          }
     }, [sentences, currentIndex]);
     // -- Render Helpers --
     const renderWordWithFeedback = (text: string, isCorrectStr: string) => {
          return text.split('').map((char, index) => {
               const isCorrect = isCorrectStr[index] === '1';
               const isSpace = char === ' ' || char === '\n' || char === '\t';

               if (isSpace) {
                    return (
                         <Text key={index} style={styles.charText}>
                              {char}
                         </Text>
                    );
               }

               return (
                    <Text
                         key={index}
                         style={[
                              styles.charText,
                              isCorrect ? styles.charCorrect : styles.charIncorrect
                         ]}
                    >
                         {char}
                    </Text>
               );
          });
     };

     const renderReviewScreen = () => {
          const finalScore = results.filter(r => r?.isCorrect).length;
          const totalCount = sentences.length;
          const performanceRatio = totalCount > 0 ? finalScore / totalCount : 0;

          return (
               <View style={styles.reviewContainer}>
                    <View style={styles.reviewHeader}>
                         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                              <Ionicons name="arrow-back" size={28} color={colors.textPrimary} />
                         </TouchableOpacity>
                         <Text style={styles.reviewTitle}>{PRACTICE_TEXTS.reviewResults}</Text>
                         <View style={{ width: 40 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.reviewContent} showsVerticalScrollIndicator={false}>
                         <View style={styles.reviewSummaryCard}>
                              <Image
                                   source={performanceRatio >= 0.8 ? require('../../assets/aplus.png') : require('../../assets/bad.png')}
                                   style={styles.reviewImage}
                                   resizeMode="contain"
                              />
                              <Text style={styles.performanceTitle}>
                                   {performanceRatio >= 0.8 ? 'Excellent!' : 'Keep Practicing!'}
                              </Text>
                              <Text style={styles.performanceScore}>
                                   You Got {finalScore} out of {totalCount} Correct
                              </Text>
                         </View>

                         <Text style={styles.detailsTitle}>Session Breakdown</Text>
                         {results.filter(r => !!r).map((item, index) => (
                              <View key={index} style={[styles.resultItem, item?.isCorrect ? styles.resultItemCorrect : styles.resultItemIncorrect]}>
                                   <View style={styles.resultItemHeader}>
                                        <View style={[styles.resultBadge, { backgroundColor: item?.isCorrect ? colors.success + '20' : colors.error + '20' }]}>
                                             <Ionicons
                                                  name={item?.isCorrect ? 'checkmark-circle' : 'close-circle'}
                                                  size={20}
                                                  color={item?.isCorrect ? colors.success : colors.error}
                                             />
                                             <Text style={[styles.resultBadgeText, { color: item?.isCorrect ? colors.success : colors.error }]}>
                                                  {item?.accuracy}%
                                             </Text>
                                        </View>
                                        <Text style={styles.resultItemIndex}>#{index + 1}</Text>
                                   </View>
                                   <Text style={styles.resultSentenceText} numberOfLines={2}>
                                        {item?.sentence?.text}
                                   </Text>
                                   <View style={styles.resultIpaRow}>
                                        <Text style={styles.resultIpaLabel}>IPA:</Text>
                                        <Text style={styles.resultIpaValue}>{item?.ipaTranscript}</Text>
                                   </View>
                              </View>
                         ))}

                         <TouchableOpacity
                              style={styles.finishBtn}
                              onPress={() => navigation.goBack()}
                         >
                              <Text style={styles.finishBtnText}>{PRACTICE_TEXTS.done}</Text>
                         </TouchableOpacity>
                    </ScrollView>
               </View>
          );
     };

     if (loading) {
          return (
               <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
               </View>
          );
     }

     return (
          <LinearGradient
               colors={gradients.backgroundMain.colors as [string, string, ...string[]]}
               style={styles.container}
          >
               <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                    {showReview ? (
                         renderReviewScreen()
                    ) : (
                         <>
                              {/* Header */}
                              <View style={styles.header}>
                                   <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                                        <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
                                   </TouchableOpacity>
                                   <Text style={styles.headerTitle}>Practice Speaking</Text>
                                   <View style={styles.progressBadge}>
                                        <Text style={styles.progressText}>{currentIndex + 1}/{sentences.length}</Text>
                                   </View>
                              </View>

                              <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                                   <Animated.View style={[styles.mainCard, shadows.claySoft, { opacity: fadeAnim }]}>
                                        <View style={styles.sentenceHeader}>
                                             <Text style={styles.sentenceText}>{currentSentence.text}</Text>
                                             <TouchableOpacity
                                                  onPress={handlePlayNative}
                                                  disabled={isPlayingNative}
                                                  style={styles.playNativeBtn}
                                             >
                                                  <Ionicons
                                                       name={isPlayingNative ? "volume-high" : "volume-medium-outline"}
                                                       size={28}
                                                       color={colors.primary}
                                                  />
                                             </TouchableOpacity>
                                        </View>

                                        <View style={styles.divider} />

                                        {result ? (
                                             <View style={styles.resultContainer}>
                                                  <View style={styles.scoreRow}>
                                                       <View style={[styles.scoreCircle, { borderColor: result.accuracy >= 80 ? colors.success : colors.warning }]}>
                                                            <Text style={[styles.scoreValue, { color: result.accuracy >= 80 ? colors.success : colors.warning }]}>
                                                                 {result.accuracy}%
                                                            </Text>
                                                            <Text style={styles.scoreLabel}>Accuracy</Text>
                                                       </View>

                                                       <View style={styles.ipaSection}>
                                                            <Text style={styles.ipaTitle}>IPA Transcription</Text>
                                                            <Text style={styles.ipaValue}>{result.ipaTranscript || '—'}</Text>
                                                            <Text style={styles.ipaUserTitle}>Your IPA</Text>
                                                            <Text style={styles.ipaUserValue}>{result.userIpa || '—'}</Text>
                                                       </View>
                                                  </View>

                                                  <View style={styles.feedbackSection}>
                                                       <View style={styles.feedbackHeader}>
                                                            <Text style={styles.feedbackTitle}>Character Correction</Text>
                                                            {userAudioUri && !isRecording && (
                                                                 <TouchableOpacity
                                                                      style={styles.listenCardBtn}
                                                                      onPress={handlePlayBack}
                                                                      disabled={playingUserAudio}
                                                                 >
                                                                      <Ionicons
                                                                           name={playingUserAudio ? "volume-high" : "play-circle"}
                                                                           size={22}
                                                                           color={colors.primary}
                                                                      />
                                                                      <Text style={styles.listenSmallText}>{playingUserAudio ? "Playing..." : "Listen to me"}</Text>
                                                                 </TouchableOpacity>
                                                            )}
                                                       </View>
                                                       <View style={styles.charContainer}>
                                                            {renderWordWithFeedback(currentSentence.text, result.isLetterCorrect)}
                                                       </View>
                                                  </View>

                                                  {currentIndex < sentences.length - 1 ? (
                                                       <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                                                            <Text style={styles.nextBtnText}>Next Sentence</Text>
                                                            <Ionicons name="arrow-forward" size={20} color={colors.white} />
                                                       </TouchableOpacity>
                                                  ) : (
                                                       <TouchableOpacity style={styles.finishBtn} onPress={handleNext}>
                                                            <Text style={styles.finishBtnText}>Finish & View Results</Text>
                                                       </TouchableOpacity>
                                                  )}
                                             </View>
                                        ) : (
                                             <View style={styles.placeholderContainer}>
                                                  {isProcessing ? (
                                                       <>
                                                            <ActivityIndicator size="large" color={colors.primary} />
                                                            <Text style={styles.placeholderText}>Analyzing your speech...</Text>
                                                       </>
                                                  ) : (
                                                       <>
                                                            <Ionicons name="mic-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
                                                            <Text style={styles.placeholderText}>Tap the mic to start speaking</Text>
                                                       </>
                                                  )}
                                             </View>
                                        )}
                                   </Animated.View>

                                   {/* Centered Mic Controls below card */}
                                   <View style={styles.controlsPlaceholder}>
                                        <View style={styles.micContainer}>
                                             <Animated.View style={[
                                                  styles.micPulse,
                                                  { transform: [{ scale: pulseAnim }], opacity: isRecording ? 0.3 : 0 }
                                             ]} />
                                             <TouchableOpacity
                                                  onPress={handleMicPress}
                                                  disabled={isProcessing}
                                                  style={[
                                                       styles.micBtnLarge,
                                                       isRecording ? styles.micBtnActive : styles.micBtnInactive,
                                                       isProcessing && { opacity: 0.5 },
                                                       shadows.clayStrong
                                                  ]}
                                                  activeOpacity={0.8}
                                             >
                                                  <Ionicons
                                                       name={isRecording ? "stop" : "mic"}
                                                       size={40}
                                                       color={colors.white}
                                                  />
                                             </TouchableOpacity>
                                             <Text style={styles.micStatusTextLarge}>
                                                  {isRecording ? "Recording..." : (userAudioUri ? "Re-record" : "Tap to Speak")}
                                             </Text>
                                        </View>
                                   </View>
                              </ScrollView>
                         </>
                    )}
               </SafeAreaView>
          </LinearGradient>
     );
};

const styles = StyleSheet.create({
     container: {
          flex: 1,
     },
     safeArea: {
          flex: 1,
     },
     loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
     },
     header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.screenPadding,
          paddingVertical: spacing.md,
     },
     backButton: {
          padding: spacing.xs,
     },
     headerTitle: {
          fontSize: 20,
          fontWeight: '800',
          color: colors.textPrimary,
     },
     progressBadge: {
          backgroundColor: 'rgba(124, 58, 237, 0.1)',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 100,
     },
     progressText: {
          fontSize: 14,
          fontWeight: '700',
          color: colors.primary,
     },
     scrollContent: {
          paddingHorizontal: spacing.screenPadding,
          paddingTop: spacing.lg,
          paddingBottom: 40,
     },
     mainCard: {
          backgroundColor: colors.white,
          borderRadius: 32,
          padding: spacing.xxl,
          minHeight: 380,
     },
     cardHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: spacing.md,
     },
     sentenceHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: spacing.sm,
     },
     playNativeBtn: {
          padding: 4,
          marginTop: 2,
     },
     listenCardBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F5F3FF',
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 10,
          gap: 4,
     },
     listenSmallText: {
          fontSize: 12,
          fontWeight: '700',
          color: colors.primary,
     },
     quoteIconContainer: {
          // marginBottom: spacing.md,
     },
     sentenceText: {
          fontSize: 24,
          fontWeight: '700',
          color: colors.textPrimary,
          lineHeight: 34,
          marginBottom: spacing.xl,
     },
     divider: {
          height: 1,
          backgroundColor: 'rgba(0,0,0,0.05)',
          marginBottom: spacing.xl,
     },
     placeholderContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 40,
     },
     placeholderText: {
          marginTop: spacing.md,
          color: colors.textSecondary,
          fontSize: 16,
          fontWeight: '500',
     },
     resultContainer: {
          flex: 1,
     },
     scoreRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing.xxl,
          gap: spacing.xl,
     },
     scoreCircle: {
          width: 90,
          height: 90,
          borderRadius: 45,
          borderWidth: 6,
          justifyContent: 'center',
          alignItems: 'center',
     },
     scoreValue: {
          fontSize: 22,
          fontWeight: '800',
     },
     scoreLabel: {
          fontSize: 10,
          color: colors.textSecondary,
          fontWeight: '600',
          textTransform: 'uppercase',
     },
     ipaSection: {
          flex: 1,
     },
     ipaTitle: {
          fontSize: 12,
          color: colors.textSecondary,
          fontWeight: '700',
          marginBottom: 4,
     },
     ipaValue: {
          fontSize: 16,
          color: colors.primary,
          fontWeight: '600',
          marginBottom: 12,
     },
     ipaUserTitle: {
          fontSize: 11,
          color: colors.textSecondary,
          fontWeight: '700',
          marginBottom: 2,
     },
     ipaUserValue: {
          fontSize: 14,
          color: colors.textPrimary,
          fontStyle: 'italic',
     },
     feedbackSection: {
          marginTop: spacing.md,
          marginBottom: 20,
     },
     feedbackHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.md,
     },
     feedbackTitle: {
          fontSize: 14,
          fontWeight: '800',
          color: colors.textPrimary,
     },
     charContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          backgroundColor: '#F9FAFB',
          padding: spacing.md,
          borderRadius: 16,
     },
     charText: {
          fontSize: 18,
          fontWeight: '600',
          fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
     },
     charCorrect: {
          color: colors.success,
     },
     charIncorrect: {
          color: colors.error,
     },
     nextBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary,
          paddingVertical: 14,
          borderRadius: 20,
          gap: 10,
          ...shadows.claySoft,
     },
     nextBtnText: {
          color: colors.white,
          fontSize: 16,
          fontWeight: '700',
     },
     controlsPlaceholder: {
          marginTop: 40,
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: 40,
     },
     micContainer: {
          alignItems: 'center',
     },
     micPulse: {
          position: 'absolute',
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: colors.primary,
     },
     micBtnLarge: {
          width: 88,
          height: 88,
          borderRadius: 44,
          justifyContent: 'center',
          alignItems: 'center',
     },
     micBtnActive: {
          backgroundColor: colors.error,
     },
     micBtnInactive: {
          backgroundColor: colors.primary,
     },
     micStatusTextLarge: {
          marginTop: 12,
          fontSize: 14,
          fontWeight: '800',
          color: colors.textSecondary,
     },
     reviewContainer: {
          flex: 1,
     },
     reviewHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.screenPadding,
          paddingVertical: spacing.md,
     },
     reviewTitle: {
          fontSize: 20,
          fontWeight: '800',
          color: colors.textPrimary,
     },
     reviewContent: {
          paddingHorizontal: spacing.screenPadding,
          paddingBottom: 40,
     },
     reviewSummaryCard: {
          backgroundColor: colors.white,
          borderRadius: 24,
          padding: spacing.xl,
          alignItems: 'center',
          ...shadows.claySoft,
          marginBottom: spacing.xl,
     },
     reviewImage: {
          width: 120,
          height: 120,
          marginBottom: spacing.md,
     },
     performanceTitle: {
          fontSize: 24,
          fontWeight: '800',
          color: colors.textPrimary,
          marginBottom: 4,
     },
     performanceScore: {
          fontSize: 16,
          color: colors.textSecondary,
          fontWeight: '600',
     },
     detailsTitle: {
          fontSize: 18,
          fontWeight: '800',
          color: colors.textPrimary,
          marginBottom: spacing.md,
          marginTop: spacing.md,
     },
     resultItem: {
          backgroundColor: colors.white,
          borderRadius: 20,
          padding: spacing.lg,
          marginBottom: spacing.md,
          borderWidth: 1,
     },
     resultItemCorrect: {
          borderColor: colors.success + '30',
     },
     resultItemIncorrect: {
          borderColor: colors.error + '30',
     },
     resultItemHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.sm,
     },
     resultBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
          gap: 4,
     },
     resultBadgeText: {
          fontSize: 12,
          fontWeight: '800',
     },
     resultItemIndex: {
          fontSize: 12,
          color: colors.textSecondary,
          fontWeight: '700',
     },
     resultSentenceText: {
          fontSize: 16,
          fontWeight: '700',
          color: colors.textPrimary,
          marginBottom: spacing.sm,
     },
     resultIpaRow: {
          flexDirection: 'row',
          gap: 6,
     },
     resultIpaLabel: {
          fontSize: 12,
          color: colors.textSecondary,
          fontWeight: '600',
     },
     resultIpaValue: {
          fontSize: 12,
          color: colors.primary,
          fontWeight: '600',
     },
     finishBtn: {
          backgroundColor: colors.primary,
          borderRadius: 20,
          paddingVertical: 16,
          alignItems: 'center',
          marginTop: spacing.xl,
          ...shadows.clayStrong,
     },
     finishBtnText: {
          color: colors.white,
          fontSize: 18,
          fontWeight: '800',
     },
});
