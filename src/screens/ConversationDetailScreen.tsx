import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
     View,
     Text,
     StyleSheet,
     ScrollView,
     TouchableOpacity,
     SafeAreaView,
     Animated,
     Alert,
     ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Conversation, Word, RootStackParamList } from '../types';
import { ConversationService } from '../services/ConversationService';
import { ClickableText } from '../components/ClickableText';
import { StorageService } from '../services/StorageService';
import { AiService } from '../services/AiService';
import { SpeechService } from '../services/SpeechService';
import { DictionaryService } from '../services/DictionaryService';
import { WordPreviewModal } from '../components/WordPreviewModal';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DetailRouteProp = RouteProp<RootStackParamList, 'ConversationDetail'>;

export const ConversationDetailScreen: React.FC = () => {
     const navigation = useNavigation<NavigationProp>();
     const route = useRoute<DetailRouteProp>();
     const { conversationId } = route.params;

     const [conversation, setConversation] = useState<Conversation | null>(null);
     const [loading, setLoading] = useState(true);
     const [isFollowing, setIsFollowing] = useState(false);
     const [showTranslations, setShowTranslations] = useState(false);

     // Practice state
     const [recordingId, setRecordingId] = useState<string | null>(null);
     const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
     const [pronunciations, setPronunciations] = useState<{ [msgId: string]: string }>({});
     const [messageAccuracies, setMessageAccuracies] = useState<{ [msgId: string]: number }>({});
     const audioRecorder = useRef<Audio.Recording | null>(null);

     // Refs for auto-saving on unmount
     const accuraciesRef = useRef(messageAccuracies);
     const convRef = useRef(conversation);
     const isFollowingRef = useRef(isFollowing);
     const hasSavedRef = useRef(false);

     useEffect(() => { accuraciesRef.current = messageAccuracies; }, [messageAccuracies]);
     useEffect(() => { convRef.current = conversation; }, [conversation]);
     useEffect(() => { isFollowingRef.current = isFollowing; }, [isFollowing]);

     useEffect(() => {
          return () => {
               if (hasSavedRef.current) return;

               const finalAccuracies = accuraciesRef.current;
               const finalConv = convRef.current;
               const finalIsFollowing = isFollowingRef.current;

               const practicedIds = Object.keys(finalAccuracies);
               if (finalConv && finalIsFollowing && practicedIds.length > 0) {
                    const sum = practicedIds.reduce((acc, id) => acc + finalAccuracies[id], 0);
                    const sessionAvg = sum / finalConv.messages.length;

                    hasSavedRef.current = true;
                    // Fire and forget save on unmount
                    StorageService.incrementConversationPractice(finalConv.id, sessionAvg).catch(e =>
                         console.error('[ConversationDetail] Auto-save error:', e)
                    );
               }
          };
     }, []);

     // Sound effects for feedback
     const successSound = useRef<Audio.Sound | null>(null);
     const errorSound = useRef<Audio.Sound | null>(null);

     // Lookup state
     const [modalVisible, setModalVisible] = useState(false);
     const [selectedWordData, setSelectedWordData] = useState<any>(null);
     const [isSelectedWordNew, setIsSelectedWordNew] = useState(false);
     const [isLookupLoading, setIsLookupLoading] = useState(false);
     const [lookupStatus, setLookupStatus] = useState('');

     useEffect(() => {
          const fetchConversation = async () => {
               const [data, practicing] = await Promise.all([
                    ConversationService.getConversationById(conversationId),
                    StorageService.getPracticingConversations()
               ]);

               if (data) {
                    setConversation(data);
                    const isPracticing = practicing.some(c => c.id === conversationId);
                    setIsFollowing(isPracticing);
               }
               setLoading(false);
          };
          fetchConversation();

          // Initialize audio mode for the screen
          Audio.setAudioModeAsync({
               allowsRecordingIOS: false,
               playsInSilentModeIOS: true,
               interruptionModeIOS: InterruptionModeIOS.DoNotMix,
               shouldDuckAndroid: true,
               interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
               staysActiveInBackground: false,
               playThroughEarpieceAndroid: false,
          }).catch(() => { });
     }, [conversationId]);

     // Load feedback sounds
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

     const playFeedbackSound = async (isCorrect: boolean) => {
          try {
               // Ensure audio mode is correct for playback
               await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
                    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                    shouldDuckAndroid: true,
                    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                    staysActiveInBackground: false,
                    playThroughEarpieceAndroid: false,
               });

               const sound = isCorrect ? successSound.current : errorSound.current;
               if (sound) {
                    await sound.replayAsync();
               }
          } catch (e) {
               console.log('Error playing feedback sound:', e);
          }
     };

     const handleSpeak = (text: string) => {
          SpeechService.speakSentence(text);
     };

     const handleWordPress = useCallback(async (text: string) => {
          try {
               setIsLookupLoading(true);
               setLookupStatus(`Analyzing "${text}"...`);

               const result = await DictionaryService.lookup(text);

               if (!result) {
                    Alert.alert('Not Found', `Could not find "${text}" or it has no definition.`);
                    return;
               }

               // Navigation logic for existing words is now handled automatically by WordPreviewModal
               // but we can also handle it here for zero-flicker experience
               if (!result.isNew) {
                    setIsLookupLoading(false);
                    navigation.navigate('WordDetail', { wordId: result.word.id });
                    return;
               }

               setSelectedWordData(result.word);
               setIsSelectedWordNew(true);
               setModalVisible(true);
          } catch (error: any) {
               console.log('[ConversationDetail] Lookup failed', error);
               Alert.alert('Error', error.message || 'Lookup failed');
          } finally {
               setIsLookupLoading(false);
          }
     }, [navigation]);

     const handleSaveNewWord = useCallback(async (newWord: Word) => {
          try {
               await StorageService.addWord(newWord);
               setIsSelectedWordNew(false);
               Alert.alert('Saved!', `"${newWord.word}" added to your library.`);
               setModalVisible(false);
          } catch (error: any) {
               Alert.alert('Error', error.message || 'Could not save word.');
          }
     }, []);

     const handleGoToDetail = useCallback((id: string) => {
          setModalVisible(false);
          // Use push for WordDetail to allow stacking multiple word depths
          navigation.push('WordDetail', { wordId: id });
     }, [navigation]);

     const handleAddToPractice = async () => {
          if (!conversation) return;
          try {
               await StorageService.addPracticingConversation(conversation);
               setIsFollowing(true);
               Alert.alert('Success', 'Conversation added to your practice list!');
          } catch (error) {
               Alert.alert('Error', 'Could not add to practice.');
          }
     };

     const handleFinishSession = async () => {
          if (!conversation) return;

          const practicedIds = Object.keys(messageAccuracies);
          const sum = practicedIds.reduce((acc, id) => acc + messageAccuracies[id], 0);
          const sessionAvg = sum / conversation.messages.length;
          const displayScore = Math.round(sessionAvg);

          if (practicedIds.length === 0) {
               navigation.goBack();
               return;
          }

          Alert.alert(
               'Finish Session? 🏁',
               `Your session score is ${displayScore}%. Do you want to save your progress and finish?`,
               [
                    { text: 'Keep Practicing', style: 'cancel' },
                    {
                         text: 'Finish',
                         onPress: async () => {
                              try {
                                   hasSavedRef.current = true;
                                   await StorageService.incrementConversationPractice(conversation.id, sessionAvg);
                                   navigation.goBack();
                              } catch (e) {
                                   console.error('[ConversationDetail] Save error:', e);
                                   navigation.goBack();
                              }
                         }
                    }
               ]
          );
     };

     const analyzeSpeech = async (msgId: string, text: string, uri: string) => {
          setIsProcessingId(msgId);
          try {
               const base64Audio = await FileSystem.readAsStringAsync(uri, {
                    encoding: FileSystem.EncodingType.Base64,
               });

               const response = await AiService.checkPronunciationAccuracy(
                    text,
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

               setPronunciations(prev => ({
                    ...prev,
                    [msgId]: data.is_letter_correct_all_words
               }));

               setMessageAccuracies(prev => ({
                    ...prev,
                    [msgId]: Math.max(prev[msgId] || 0, data.pronunciation_accuracy)
               }));

               playFeedbackSound(data.pronunciation_accuracy >= 80);
          } catch (error) {
               console.error('Analysis error:', error);
               const errorMessage = error instanceof Error
                    ? error.message
                    : 'Không thể phân tích phát âm. Vui lòng thử lại.';
               Alert.alert('Phân tích thất bại', errorMessage);
          } finally {
               setIsProcessingId(null);
          }
     };

     const handleMicPress = async (msgId: string, text: string) => {
          if (recordingId === msgId) {
               setRecordingId(null);
               try {
                    if (!audioRecorder.current) return;
                    await audioRecorder.current.stopAndUnloadAsync();
                    const uri = audioRecorder.current.getURI();
                    if (uri) {
                         analyzeSpeech(msgId, text, uri);
                    }
               } catch (e) {
                    console.error('Stop recording error:', e);
               } finally {
                    audioRecorder.current = null;
                    // Reset audio mode after recording
                    Audio.setAudioModeAsync({
                         allowsRecordingIOS: false,
                         playsInSilentModeIOS: true,
                         interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                         shouldDuckAndroid: true,
                         interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                         staysActiveInBackground: false,
                         playThroughEarpieceAndroid: false,
                    }).catch(err => console.log('Error resetting audio mode:', err));
               }
          } else {
               setRecordingId(msgId);
               try {
                    const { status } = await Audio.requestPermissionsAsync();
                    if (status !== 'granted') return;

                    await Audio.setAudioModeAsync({
                         allowsRecordingIOS: true,
                         playsInSilentModeIOS: true,
                         interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                         shouldDuckAndroid: true,
                         interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                         staysActiveInBackground: false,
                         playThroughEarpieceAndroid: false,
                    });

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
               } catch (e) {
                    console.error('Start recording error:', e);
                    setRecordingId(null);
               }
          }
     };

     if (loading || !conversation) {
          return (
               <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
               </View>
          );
     }

     return (
          <View style={styles.container}>
               <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                         <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>{conversation.title}</Text>
                    <TouchableOpacity onPress={() => setShowTranslations(!showTranslations)} style={styles.actionBtn}>
                         <Ionicons name={showTranslations ? "eye-off-outline" : "eye-outline"} size={24} color={colors.primary} />
                    </TouchableOpacity>
               </View>

               <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.descriptionCard}>
                         <Text style={styles.descriptionText}>{conversation.description}</Text>
                         <View style={styles.infoRow}>
                              <View style={styles.infoBadge}>
                                   <Text style={styles.infoBadgeText}>{conversation.category}</Text>
                              </View>
                              <View style={styles.infoBadge}>
                                   <Text style={styles.infoBadgeText}>{conversation.difficulty}</Text>
                              </View>
                         </View>
                    </View>

                    <View style={styles.chatContainer}>
                         {conversation.messages.map((msg, index) => (
                              <View
                                   key={msg.id}
                                   style={[
                                        styles.messageWrapper,
                                        msg.role === 'user' ? styles.userWrapper : styles.assistantWrapper
                                   ]}
                              >
                                   <View style={[
                                        styles.messageBubble,
                                        msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
                                        shadows.subtle
                                   ]}>
                                        <ClickableText
                                             text={msg.text}
                                             onWordPress={handleWordPress}
                                             style={msg.role === 'user' ? styles.userText : styles.assistantText}
                                             feedback={pronunciations[msg.id]}
                                        />

                                        {showTranslations && msg.translation && (
                                             <Text style={styles.translationText}>{msg.translation}</Text>
                                        )}

                                        {isProcessingId === msg.id ? (
                                             <ActivityIndicator size="small" color={msg.role === 'user' ? colors.white : colors.primary} style={styles.actionBtnsContainer} />
                                        ) : (
                                             <View style={styles.actionBtnsContainer}>
                                                  <TouchableOpacity
                                                       style={styles.actionIconBtn}
                                                       onPress={() => handleSpeak(msg.text)}
                                                  >
                                                       <Ionicons
                                                            name="volume-high-outline"
                                                            size={18}
                                                            color={msg.role === 'user' ? colors.white : colors.primary}
                                                       />
                                                  </TouchableOpacity>

                                                  <TouchableOpacity
                                                       style={[styles.actionIconBtn, recordingId === msg.id && styles.micBtnActive]}
                                                       onPress={() => handleMicPress(msg.id, msg.text)}
                                                  >
                                                       <Ionicons
                                                            name={recordingId === msg.id ? "stop" : "mic-outline"}
                                                            size={18}
                                                            color={msg.role === 'user' ? (recordingId === msg.id ? colors.white : colors.white) : (recordingId === msg.id ? colors.white : colors.primary)}
                                                       />
                                                  </TouchableOpacity>
                                             </View>
                                        )}
                                   </View>
                              </View>
                         ))}
                    </View>
               </ScrollView>

               <View style={styles.footer}>
                    {!isFollowing ? (
                         <TouchableOpacity
                              style={[styles.practiceBtn, shadows.clayStrong]}
                              onPress={handleAddToPractice}
                         >
                              <LinearGradient
                                   colors={[colors.primary, '#8B5CF6']}
                                   start={{ x: 0, y: 0 }}
                                   end={{ x: 1, y: 0 }}
                                   style={styles.gradientBtn}
                              >
                                   <Ionicons name="add" size={24} color={colors.white} />
                                   <Text style={styles.practiceBtnText}>Add to Practice</Text>
                              </LinearGradient>
                         </TouchableOpacity>
                    ) : (
                         <TouchableOpacity
                              style={[styles.practiceBtn, shadows.clayStrong]}
                              onPress={handleFinishSession}
                         >
                              <LinearGradient
                                   colors={[colors.primary, colors.primary]}
                                   start={{ x: 0, y: 0 }}
                                   end={{ x: 1, y: 0 }}
                                   style={styles.gradientBtn}
                              >
                                   <Ionicons name="checkmark-circle-outline" size={24} color={colors.white} />
                                   <Text style={styles.practiceBtnText}>Finish</Text>
                              </LinearGradient>
                         </TouchableOpacity>
                    )}
               </View>

               <WordPreviewModal
                    visible={modalVisible}
                    wordData={selectedWordData}
                    isNew={isSelectedWordNew}
                    isLoading={isLookupLoading}
                    statusText={lookupStatus}
                    onClose={() => setModalVisible(false)}
                    onSave={handleSaveNewWord}
                    onGoToDetail={handleGoToDetail}
               />
          </View>
     );
};

const styles = StyleSheet.create({
     container: {
          flex: 1,
          backgroundColor: '#F8F9FE',
     },
     loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
     },
     header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.screenPadding,
          paddingTop: 60,
          paddingBottom: 15,
          backgroundColor: colors.white,
          ...shadows.subtle,
     },
     backBtn: {
          padding: 4,
     },
     headerTitle: {
          fontSize: 18,
          fontWeight: '800',
          color: colors.textPrimary,
          flex: 1,
          textAlign: 'center',
          marginHorizontal: spacing.md,
     },
     actionBtn: {
          padding: 4,
     },
     scrollContent: {
          padding: spacing.screenPadding,
          paddingBottom: 120,
     },
     descriptionCard: {
          backgroundColor: colors.white,
          borderRadius: 20,
          padding: spacing.lg,
          marginBottom: spacing.xl,
          ...shadows.subtle,
     },
     descriptionText: {
          fontSize: 15,
          color: colors.textSecondary,
          lineHeight: 22,
          marginBottom: spacing.md,
     },
     infoRow: {
          flexDirection: 'row',
          gap: spacing.sm,
     },
     infoBadge: {
          backgroundColor: '#F1F5F9',
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 10,
     },
     infoBadgeText: {
          fontSize: 12,
          fontWeight: '700',
          color: colors.textSecondary,
          textTransform: 'capitalize',
     },
     chatContainer: {
          gap: spacing.lg,
     },
     messageWrapper: {
          flexDirection: 'row',
          width: '100%',
     },
     userWrapper: {
          justifyContent: 'flex-end',
     },
     assistantWrapper: {
          justifyContent: 'flex-start',
     },
     messageBubble: {
          maxWidth: '85%',
          padding: spacing.md,
          paddingRight: 80,
          paddingBottom: spacing.md,
          borderRadius: 20,
          position: 'relative',
     },
     userBubble: {
          backgroundColor: colors.primary,
          borderTopRightRadius: 4,
     },
     assistantBubble: {
          backgroundColor: colors.white,
          borderTopLeftRadius: 4,
     },
     userText: {
          fontSize: 16,
          color: colors.white,
          lineHeight: 24,
     },
     assistantText: {
          fontSize: 16,
          color: colors.textPrimary,
          lineHeight: 24,
     },
     translationText: {
          marginTop: 8,
          fontSize: 14,
          color: 'rgba(0,0,0,0.5)',
          fontStyle: 'italic',
          paddingRight: 10,
     },
     actionBtnsContainer: {
          position: 'absolute',
          right: 8,
          bottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
     },
     actionIconBtn: {
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: 'rgba(0,0,0,0.05)',
          alignItems: 'center',
          justifyContent: 'center',
     },
     micBtnActive: {
          backgroundColor: colors.error,
     },
     footer: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: spacing.screenPadding,
          paddingBottom: 40,
          paddingTop: 20,
          backgroundColor: 'rgba(248, 249, 254, 0.9)',
     },
     practiceBtn: {
          borderRadius: 20,
          overflow: 'hidden',
     },
     gradientBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 16,
          gap: 8,
     },
     practiceBtnText: {
          color: colors.white,
          fontSize: 16,
          fontWeight: '800',
     },
     finishBtnText: {
          color: colors.white,
          fontSize: 16,
          fontWeight: '700',
     },
});
