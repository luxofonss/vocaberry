import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
     View,
     Text,
     StyleSheet,
     TouchableOpacity,
     Alert,
     ActivityIndicator,
     FlatList,
     Modal,
     ListRenderItemInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, AVPlaybackStatus, ResizeMode, Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { colors, shadows, spacing, typography, borderRadius } from '../theme';
import { RootStackParamList, Word } from '../types';
import { AiService } from '../services/AiService';
import { ClickableText } from '../components/ClickableText';
import { DictionaryService } from '../services/DictionaryService';
import { StorageService } from '../services/StorageService';
import { WordPreviewModal } from '../components/WordPreviewModal';
import { PronunciationDetailView } from '../components/PronunciationDetailView';
import * as FileSystem from 'expo-file-system/legacy';
import { ShadowingService } from '../services/ShadowingService';
import { ShadowingLesson, ShadowingSubtitle } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShadowingPractice'>;
type RouteProps = RouteProp<RootStackParamList, 'ShadowingPractice'>;

interface Subtitle {
     id: number | string;
     start: number;
     end: number;
     text: string;
}

interface PronunciationData {
     pronScore: number;
     accuracyScore: number;
     fluencyScore: number;
     completenessScore: number;
     recognizedText: string;
     words: any[];
}

interface SubtitleItemProps {
     sub: Subtitle;
     index: number;
     isActive: boolean;
     hasRecording: boolean;
     score: number | undefined;
     isAnalyzing: boolean;
     isPlayingThis: boolean;
     pronunciations: Record<string | number, PronunciationData>;
     onSeek: () => void;
     onPlay: () => void;
     onPlayRecording: () => void;
     onWordPress: (text: string) => void;
     onScorePress: () => void;
}

const normalizeSubtitles = (subtitles: Subtitle[]): Subtitle[] => {
     if (!subtitles || subtitles.length === 0) return [];

     // Convert API subtitles to local format if needed (API format matches mostly)
     const normalized = subtitles.map(sub => ({ ...sub }));

     if (normalized.length > 0) {
          normalized[0] = {
               ...normalized[0],
               start: normalized[0].start / 2,
          };
     }

     for (let i = 1; i < normalized.length; i++) {
          const prevItem = normalized[i - 1];
          const currentItem = normalized[i];

          const gap = currentItem.start - prevItem.end;

          if (gap > 0) {
               const halfGap = gap / 2;

               normalized[i - 1] = {
                    ...prevItem,
                    end: prevItem.end + halfGap,
               };

               normalized[i] = {
                    ...currentItem,
                    start: currentItem.start - halfGap,
               };
          }
     }

     return normalized;
};

const SubtitleItem = React.memo<SubtitleItemProps>(({
     sub,
     index,
     isActive,
     hasRecording,
     score,
     isAnalyzing,
     isPlayingThis,
     pronunciations,
     onSeek,
     onPlay,
     onPlayRecording,
     onWordPress,
     onScorePress
}) => {
     return (
          <TouchableOpacity
               onPress={onSeek}
               activeOpacity={0.7}
               style={[
                    styles.subItem,
                    isActive && styles.subItemActive,
                    hasRecording && styles.subItemRecorded
               ]}
          >
               <View style={styles.subContent}>
                    <View style={[styles.subIndex, isActive && styles.subIndexActive]}>
                         <Text style={[styles.subIndexText, isActive && styles.subIndexTextActive]}>{index + 1}</Text>
                    </View>
                    <View style={styles.subBody}>
                         <ClickableText
                              text={sub.text}
                              onWordPress={onWordPress}
                              style={[styles.subText, isActive && styles.subActiveText]}
                              feedback={pronunciations[sub.id]}
                         />

                         {isAnalyzing && (
                              <View style={styles.analyzingRow}>
                                   <ActivityIndicator size="small" color={colors.primary} />
                                   <Text style={styles.analyzingText}>Analyzing...</Text>
                              </View>
                         )}

                         {!isAnalyzing && score !== undefined && (
                              <TouchableOpacity
                                   style={[
                                        styles.scoreBadge,
                                        score >= 80 ? styles.scoreHigh : score >= 50 ? styles.scoreMid : styles.scoreLow
                                   ]}
                                   onPress={onScorePress}
                                   activeOpacity={0.7}
                              >
                                   <Text style={styles.scoreText}>{score}%</Text>
                                   <Ionicons name="information-circle" size={14} color={colors.textSecondary} style={{ marginLeft: 4 }} />
                              </TouchableOpacity>
                         )}
                    </View>
               </View>

               <View style={styles.itemActions}>
                    <TouchableOpacity
                         style={styles.miniActionBtn}
                         onPress={onPlay}
                         activeOpacity={0.7}
                         hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                         <Ionicons name="volume-high-outline" size={22} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {hasRecording && (
                         <TouchableOpacity
                              style={styles.miniActionBtn}
                              onPress={onPlayRecording}
                              activeOpacity={0.7}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                         >
                              <Ionicons
                                   name={isPlayingThis ? "stop-circle" : "play-circle"}
                                   size={22}
                                   color={isPlayingThis ? colors.primary : colors.textSecondary}
                              />
                         </TouchableOpacity>
                    )}
               </View>
          </TouchableOpacity>
     );
});

SubtitleItem.displayName = 'SubtitleItem';

export const ShadowingPracticeScreen: React.FC = () => {
     const navigation = useNavigation<NavigationProp>();
     const route = useRoute<RouteProps>();

     // Handle params whether from legacy navigators or new API flow
     // @ts-ignore
     const { lessonId: paramLessonId, initialData, id: legacyId } = route.params;
     const lessonId = paramLessonId || legacyId?.toString();

     const [lessonDetail, setLessonDetail] = useState<ShadowingLesson | null>(initialData || null);
     const [loading, setLoading] = useState(!initialData);
     const [error, setError] = useState<string | null>(null);

     const videoRef = useRef<Video>(null);
     const flatListRef = useRef<FlatList<Subtitle>>(null);
     const audioRecorder = useRef<Audio.Recording | null>(null);
     const playbackSound = useRef<Audio.Sound | null>(null);
     const recordingStartTime = useRef<number>(0);
     const shouldBeRecording = useRef<boolean>(false);
     const shouldStopPlayingAll = useRef<boolean>(false);

     // Video Control Refs
     const isSeekingRef = useRef<boolean>(false); // Blocks status updates during seek
     const stopAtRef = useRef<number | null>(null);
     const isProcessingRef = useRef<boolean>(false);

     const [status, setStatus] = useState<AVPlaybackStatus>({} as AVPlaybackStatus);
     const [activeSubId, setActiveSubId] = useState<number | string | null>(null);
     const activeSubIdRef = useRef<number | string | null>(null);

     const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
     const [stopAt, setStopAt] = useState<number | null>(null);
     const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
     const [isSeeking, setIsSeeking] = useState<boolean>(false);
     const [rate, setRate] = useState<number>(1.0);
     const [showSpeedModal, setShowSpeedModal] = useState<boolean>(false);

     const [isRecording, setIsRecording] = useState<boolean>(false);
     const [analyzingId, setAnalyzingId] = useState<number | string | null>(null);
     const [userRecordings, setUserRecordings] = useState<Record<string | number, string>>({});
     const [scores, setScores] = useState<Record<string | number, number>>({});
     const [pronunciations, setPronunciations] = useState<Record<string | number, PronunciationData>>({});
     const [playingUserAudioId, setPlayingUserAudioId] = useState<number | string | null>(null);
     const [isPlayingAll, setIsPlayingAll] = useState<boolean>(false);

     useEffect(() => {
          const fetchDetail = async () => {
               if (!lessonId) return;

               try {
                    setLoading(true);
                    const data = await ShadowingService.getLessonById(lessonId);
                    setLessonDetail(data);

                    if (data.subtitles) {
                         // Helper locally defined above or just inline mapping? 
                         // normalizeSubtitles was defined locally.
                         // Map API subtitles to local format
                         const mappedSubtitles: Subtitle[] = data.subtitles.map(s => ({
                              id: s.id,
                              start: s.start,
                              end: s.end,
                              text: s.text
                         }));
                         setSubtitles(normalizeSubtitles(mappedSubtitles));
                    }
               } catch (err) {
                    console.error('Error fetching lesson:', err);
                    setError('Failed to load lesson details. Please try again.');
                    Alert.alert('Error', 'Failed to load lesson details.');
               } finally {
                    setLoading(false);
               }
          };

          fetchDetail();
     }, [lessonId]);

     // --- Manual Video Controls ---
     const handlePlayPause = async () => {
          if (!videoRef.current || isProcessingRef.current || !status.isLoaded) return;
          // @ts-ignore
          if (status.isPlaying) {
               await videoRef.current.pauseAsync();
          } else {
               stopAtRef.current = null;
               setIsPlayingAll(false);
               await videoRef.current.playAsync();
          }
     };

     const handlePrevNext = async (direction: -1 | 1) => {
          if (!videoRef.current || isProcessingRef.current || !status.isLoaded) return;

          let targetIndex = -1;

          if (currentSubtitle) {
               const currentIndex = subtitles.findIndex(s => s.id === currentSubtitle.id);
               if (currentIndex !== -1) {
                    targetIndex = currentIndex + direction;
               }
          } else {
               // If no subtitle is currently active, approximate based on time
               const time = status.positionMillis / 1000;
               if (direction === 1) {
                    targetIndex = subtitles.findIndex(s => s.start > time);
               } else {
                    // Find last one that ended before now
                    for (let i = subtitles.length - 1; i >= 0; i--) {
                         if (subtitles[i].end < time) {
                              targetIndex = i;
                              break;
                         }
                    }
               }
          }

          // Boundary checks
          if (targetIndex >= 0 && targetIndex < subtitles.length) {
               await seekToSubtitle(subtitles[targetIndex]);
          }
     };

     const handleSpeed = () => {
          setShowSpeedModal(true);
     };

     const handleSpeedSelect = async (newRate: number) => {
          if (!videoRef.current) return;
          setRate(newRate);
          await videoRef.current.setRateAsync(newRate, true);
          setShowSpeedModal(false);
     };

     const handleMute = async () => {
          if (!videoRef.current || !status.isLoaded) return;
          // @ts-ignore
          await videoRef.current.setIsMutedAsync(!status.isMuted);
     };

     const [modalVisible, setModalVisible] = useState<boolean>(false);
     const [selectedWordData, setSelectedWordData] = useState<Word | null>(null);
     const [isSelectedWordNew, setIsSelectedWordNew] = useState<boolean>(false);

     const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
     const [selectedPronunciation, setSelectedPronunciation] = useState<PronunciationData | null>(null);

     const currentSubtitle = subtitles.find(s => s.id === activeSubId);

     useEffect(() => {
          setupAudioMode();
          return () => {
               if (playbackSound.current) {
                    playbackSound.current.unloadAsync();
               }
          };
     }, []);


     const setupAudioMode = async (): Promise<void> => {
          try {
               await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                    shouldDuckAndroid: true,
                    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                    staysActiveInBackground: false,
                    playThroughEarpieceAndroid: false,
               });
          } catch (e) {
               console.error('Audio mode setup failed', e);
          }
     };

     // Simplified status update handler
     const onPlaybackStatusUpdate = useCallback((newStatus: AVPlaybackStatus): void => {
          setStatus(newStatus);

          if (!newStatus.isLoaded) return;

          // Don't update time or check stop triggers while seeking manually
          if (isSeekingRef.current) return;

          const timeInSeconds = newStatus.positionMillis / 1000;

          // 1. Check for Active Subtitle Change (Optimization: Only setState when ID changes)
          const foundSub = subtitles.find(s => timeInSeconds >= s.start && timeInSeconds < s.end);
          const foundId = foundSub ? foundSub.id : null;

          if (foundId !== activeSubIdRef.current) {
               activeSubIdRef.current = foundId;
               setActiveSubId(foundId);
          }

          // 2. Check for auto-stop point (for Play Segment functionality)
          if (stopAtRef.current !== null && timeInSeconds >= stopAtRef.current) {
               // Reached end of segment
               videoRef.current?.pauseAsync();

               // Auto-seek back to start
               const currentSub = subtitles.find(s => Math.abs(s.end - (stopAtRef.current || 0)) < 0.5);
               if (currentSub) {
                    // Add small buffer (100ms) to ensure we land inside the subtitle timeframe, avoiding floating point precision issues
                    videoRef.current?.setPositionAsync(currentSub.start * 1000 + 100);
                    // Update active state manually
                    activeSubIdRef.current = currentSub.id;
                    setActiveSubId(currentSub.id);
               }

               stopAtRef.current = null;
               setIsPlayingAll(false);
          }
     }, [subtitles]);

     // Simplified Play Segment
     const playSegment = useCallback(async (sub: Subtitle): Promise<void> => {
          if (!videoRef.current || isProcessingRef.current) return;

          // Optimistic UI: Update active state immediately
          activeSubIdRef.current = sub.id;
          setActiveSubId(sub.id);

          try {
               isProcessingRef.current = true;
               isSeekingRef.current = true;
               stopAtRef.current = sub.end; // Set stop point

               // 1. Hard Pause first to ensure stable state
               if (status.isLoaded && status.isPlaying) {
                    await videoRef.current.pauseAsync();
               }

               // 2. Seek securely with buffer
               await videoRef.current.setPositionAsync(sub.start * 1000 + 100, {
                    toleranceMillisBefore: 0,
                    toleranceMillisAfter: 0
               });

               // 3. Play
               await videoRef.current.playAsync();

          } catch (error) {
               console.error('Play segment failed:', error);
          } finally {
               setTimeout(() => {
                    isSeekingRef.current = false;
                    isProcessingRef.current = false;
               }, 100);
          }
     }, [status]);

     // Simplified Seek To Subtitle
     const seekToSubtitle = useCallback(async (sub: Subtitle): Promise<void> => {
          if (!videoRef.current || isProcessingRef.current) return;

          // Optimistic UI: Update active state immediately
          activeSubIdRef.current = sub.id;
          setActiveSubId(sub.id);

          try {
               isProcessingRef.current = true;
               isSeekingRef.current = true;
               stopAtRef.current = null; // Clear pending stop

               // 1. Hard Pause first
               if (status.isLoaded && status.isPlaying) {
                    await videoRef.current.pauseAsync();
               }

               // 2. Seek securely with buffer
               await videoRef.current.setPositionAsync(sub.start * 1000 + 100, {
                    toleranceMillisBefore: 0,
                    toleranceMillisAfter: 0
               });

               // 3. Just seek, don't play
               // await videoRef.current.playAsync();

          } catch (error) {
               console.error('Seek failed:', error);
          } finally {
               setTimeout(() => {
                    isSeekingRef.current = false;
                    isProcessingRef.current = false;
               }, 100);
          }
     }, [status]);

     useEffect(() => {
          // Auto-scroll to active subtitle
          if (activeSubId && flatListRef.current && !isPlayingAll) {
               const index = subtitles.findIndex(s => s.id === activeSubId);
               if (index !== -1) {
                    flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
               }
          }
     }, [activeSubId, isPlayingAll]);

     const cleanupRecorder = async (): Promise<void> => {
          if (audioRecorder.current) {
               try {
                    await audioRecorder.current.stopAndUnloadAsync();
               } catch (e) {
                    console.log('Cleanup warning:', e);
               }
               audioRecorder.current = null;
          }
     };

     const startRecording = async (): Promise<void> => {
          if (!currentSubtitle) {
               Alert.alert("Notice", "Wait for a subtitle to appear or select one first.");
               return;
          }

          shouldBeRecording.current = true;
          setIsRecording(true);

          try {
               const cleanupPromise = cleanupRecorder();
               const pausePromise = (status.isLoaded && status.isPlaying)
                    ? videoRef.current?.pauseAsync()
                    : Promise.resolve();

               await Promise.all([cleanupPromise, pausePromise]);

               await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                    shouldDuckAndroid: true,
                    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                    staysActiveInBackground: false,
                    playThroughEarpieceAndroid: false,
               });

               const { status: existingStatus } = await Audio.getPermissionsAsync();
               let finalStatus = existingStatus;

               if (existingStatus !== 'granted') {
                    const { status: newStatus } = await Audio.requestPermissionsAsync();
                    finalStatus = newStatus;
               }

               if (finalStatus !== 'granted') {
                    setIsRecording(false);
                    return;
               }

               if (!shouldBeRecording.current) {
                    setIsRecording(false);
                    return;
               }

               const recording = new Audio.Recording();
               try {
                    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);

                    if (!shouldBeRecording.current) {
                         try {
                              await recording.stopAndUnloadAsync();
                         } catch (cleanupErr) { }
                         setIsRecording(false);
                         return;
                    }

                    await recording.startAsync();

                    audioRecorder.current = recording;
                    recordingStartTime.current = Date.now();
                    setIsRecording(true);

                    if (!shouldBeRecording.current) {
                         await stopRecording();
                    }
               } catch (err) {
                    console.error('Recording prepare/start failed', err);
                    if (!audioRecorder.current) {
                         try {
                              await recording.stopAndUnloadAsync();
                         } catch (e) { }
                    }
                    await cleanupRecorder();
                    setIsRecording(false);
               }

          } catch (error) {
               console.error('Failed to start recording', error);
               setIsRecording(false);
          }
     };

     const stopRecording = async (): Promise<void> => {
          shouldBeRecording.current = false;

          if (!audioRecorder.current) {
               setIsRecording(false);
               return;
          }

          try {
               setIsRecording(false);
               await audioRecorder.current.stopAndUnloadAsync();
               const uri = audioRecorder.current.getURI();
               const duration = Date.now() - recordingStartTime.current;

               audioRecorder.current = null;

               if (duration < 600) {
                    Alert.alert("Hold to record", "Please hold the button while speaking.");
                    await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
                    return;
               }

               if (uri && currentSubtitle) {
                    const targetId = currentSubtitle.id;
                    setUserRecordings(prev => ({ ...prev, [targetId]: uri }));
                    analyzePronunciation(targetId, currentSubtitle.text, uri);
               }

               await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
               });

          } catch (error) {
               console.error('Failed to stop recording', error);
          }
     };

     const analyzePronunciation = async (id: string | number, text: string, uri: string): Promise<void> => {
          setAnalyzingId(id);
          try {
               const base64Audio = await FileSystem.readAsStringAsync(uri, {
                    encoding: 'base64',
               });

               const response = await AiService.checkPronunciationAccuracy(
                    text,
                    `data:audio/wav;base64,${base64Audio.trim()}`
               );

               if (!response || !response.data) {
                    throw new Error('Something went wrong, please try again later!');
               }

               const data = response.data;

               if (typeof data.pronScore === 'undefined') {
                    console.error('API Error Response:', data);
                    throw new Error('Invalid response from AI service.');
               }

               setScores(prev => ({ ...prev, [id]: data.pronScore }));
               setPronunciations(prev => ({ ...prev, [id]: data }));

          } catch (error) {
               console.error('Analysis failed', error);
               const errorMessage = error instanceof Error ? error.message : "Could not analyze pronunciation.";
               Alert.alert("Analysis Failed", errorMessage);
          } finally {
               setAnalyzingId(null);
          }
     };

     const playUserRecording = async (id: string | number): Promise<void> => {
          const uri = userRecordings[id];
          if (!uri) return;

          try {
               if (playbackSound.current) {
                    await playbackSound.current.unloadAsync();
               }
               setPlayingUserAudioId(id);
               const { sound } = await Audio.Sound.createAsync({ uri });
               playbackSound.current = sound;
               sound.setOnPlaybackStatusUpdate((playStatus) => {
                    if (playStatus.isLoaded && playStatus.didJustFinish) {
                         setPlayingUserAudioId(null);
                    }
               });
               await sound.playAsync();
          } catch (error) {
               console.error('Play user audio failed', error);
               setPlayingUserAudioId(null);
          }
     };

     const playAllRecordings = async (): Promise<void> => {
          shouldStopPlayingAll.current = false;
          setIsPlayingAll(true);
          const recordingIds = Object.keys(userRecordings);

          if (recordingIds.length === 0) {
               Alert.alert("No recordings", "You haven't recorded anything yet.");
               setIsPlayingAll(false);
               return;
          }

          for (const rawId of recordingIds) {
               // Check ref instead of state to properly break the loop
               if (shouldStopPlayingAll.current) break;

               // Try to treat as number if possible for consistent lookup, otherwise keep string
               const id = isNaN(Number(rawId)) ? rawId : Number(rawId);

               const index = subtitles.findIndex(s => s.id == id);
               if (index !== -1 && flatListRef.current) {
                    flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
               }

               await new Promise<void>(async (resolve) => {
                    const uri = userRecordings[id];
                    setPlayingUserAudioId(id);
                    try {
                         if (playbackSound.current) await playbackSound.current.unloadAsync();
                         const { sound } = await Audio.Sound.createAsync({ uri });
                         playbackSound.current = sound;
                         sound.setOnPlaybackStatusUpdate((playStatus) => {
                              if (playStatus.isLoaded && playStatus.didJustFinish) {
                                   resolve();
                              }
                         });
                         await sound.playAsync();
                    } catch {
                         resolve();
                    }
               });
               setPlayingUserAudioId(null);

               // Check again before delay
               if (shouldStopPlayingAll.current) break;
               await new Promise(r => setTimeout(r, 500));
          }

          // Cleanup
          if (playbackSound.current) {
               await playbackSound.current.unloadAsync();
               playbackSound.current = null;
          }
          setIsPlayingAll(false);
          setPlayingUserAudioId(null);
     };

     const stopPlayingAll = async (): Promise<void> => {
          shouldStopPlayingAll.current = true;
          if (playbackSound.current) {
               await playbackSound.current.stopAsync();
               await playbackSound.current.unloadAsync();
               playbackSound.current = null;
          }
          setIsPlayingAll(false);
          setPlayingUserAudioId(null);
     };

     const handleWordPress = useCallback(async (text: string): Promise<void> => {
          try {
               const result = await DictionaryService.lookup(text);

               if (!result) {
                    Alert.alert('Not Found', `Could not find "${text}" or it has no definition.`);
                    return;
               }

               if (!result.isNew) {
                    navigation.navigate('WordDetail', { wordId: result.word.id });
                    return;
               }

               setSelectedWordData(result.word);
               setIsSelectedWordNew(true);
               setModalVisible(true);
          } catch (error: any) {
               console.log('Lookup failed', error);
               Alert.alert('Error', error.message || 'Lookup failed');
          }
     }, [navigation]);

     const handleSaveNewWord = useCallback(async (newWord: Word): Promise<void> => {
          try {
               await StorageService.addWord(newWord);
               setIsSelectedWordNew(false);
               Alert.alert('Saved!', `"${newWord.word}" added to your library.`);
               setModalVisible(false);
          } catch (error: any) {
               Alert.alert('Error', error.message || 'Could not save word.');
          }
     }, []);

     const handleGoToDetail = useCallback((id: string): void => {
          setModalVisible(false);
          navigation.push('WordDetail', { wordId: id });
     }, [navigation]);

     const renderItem = useCallback(({ item, index }: ListRenderItemInfo<Subtitle>) => {
          const isActive = currentSubtitle?.id === item.id;
          const hasRecording = !!userRecordings[item.id];
          const score = scores[item.id];
          const isAnalyzing = analyzingId === item.id;
          const isPlayingThis = playingUserAudioId === item.id;

          return (
               <SubtitleItem
                    sub={item}
                    index={index}
                    isActive={isActive}
                    hasRecording={hasRecording}
                    score={score}
                    isAnalyzing={isAnalyzing}
                    isPlayingThis={isPlayingThis}
                    pronunciations={pronunciations}
                    onSeek={() => seekToSubtitle(item)}
                    onPlay={() => playSegment(item)}
                    onPlayRecording={() => playUserRecording(item.id)}
                    onWordPress={handleWordPress}
                    onScorePress={() => {
                         if (pronunciations[item.id]) {
                              setSelectedPronunciation(pronunciations[item.id]);
                              setDetailModalVisible(true);
                         }
                    }}
               />
          );
     }, [
          currentSubtitle,
          userRecordings,
          scores,
          analyzingId,
          playingUserAudioId,
          pronunciations,
          seekToSubtitle,
          playSegment,
          playUserRecording,
          handleWordPress
     ]);

     const getItemLayout = useCallback((data: ArrayLike<Subtitle> | null | undefined, index: number) => ({
          length: 90,
          offset: 90 * index,
          index,
     }), []);

     const keyExtractor = useCallback((item: Subtitle) => `sub-${item.id}`, []);

     return (
          <View style={styles.container}>
               <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                    <View style={styles.header}>
                         <TouchableOpacity
                              onPress={() => navigation.goBack()}
                              style={styles.backButton}
                         >
                              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                         </TouchableOpacity>
                         <View style={styles.headerInfo}>
                              <Text style={styles.headerTitle} numberOfLines={1}>{lessonDetail?.title || 'Loading...'}</Text>
                              <Text style={styles.headerSubtitle} numberOfLines={1}>{lessonDetail?.category || lessonDetail?.channel || 'Shadowing'} • {lessonDetail?.difficulty || lessonDetail?.level || 'Practice'}</Text>
                         </View>
                    </View>

                    <View style={styles.videoWrapper}>
                         <Video
                              ref={videoRef}
                              style={styles.video}
                              source={{ uri: lessonDetail?.video_url || 'https://d19o3szqkvjryx.cloudfront.net/videos/video.mp4' }}
                              useNativeControls
                              resizeMode={ResizeMode.CONTAIN}
                              isLooping={false}
                              volume={1.0}
                              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                              onLoad={() => setIsVideoReady(true)}
                         />
                    </View>

                    {/* Video Controls (Compact) */}
                    <View style={styles.controlsRow}>
                         <TouchableOpacity style={styles.speedBtn} onPress={handleSpeed}>
                              <Text style={styles.speedText}>{rate}x</Text>
                         </TouchableOpacity>

                         <View style={styles.centerControls}>
                              <TouchableOpacity style={styles.controlBtn} onPress={() => handlePrevNext(-1)}>
                                   <Ionicons name="play-back" size={20} color={colors.textPrimary} />
                              </TouchableOpacity>

                              <TouchableOpacity style={styles.playPauseBtn} onPress={handlePlayPause}>
                                   <Ionicons
                                        name={(status.isLoaded && status.isPlaying) ? "pause" : "play"}
                                        size={24}
                                        color={colors.white}
                                        style={{ marginLeft: (status.isLoaded && status.isPlaying) ? 0 : 2 }}
                                   />
                              </TouchableOpacity>

                              <TouchableOpacity style={styles.controlBtn} onPress={() => handlePrevNext(1)}>
                                   <Ionicons name="play-forward" size={20} color={colors.textPrimary} />
                              </TouchableOpacity>
                         </View>

                         <TouchableOpacity style={styles.controlBtn} onPress={handleMute}>
                              <Ionicons
                                   name={(status.isLoaded && status.isMuted) ? "volume-mute" : "volume-high"}
                                   size={20}
                                   color={(status.isLoaded && status.isMuted) ? colors.error : colors.textPrimary}
                              />
                         </TouchableOpacity>
                    </View>

                    <View style={styles.transcriptHeaderRow}>
                         <Text style={styles.sectionHeader}>Transcript ({subtitles.length})</Text>
                         <TouchableOpacity
                              style={styles.playAllBtn}
                              onPress={isPlayingAll ? stopPlayingAll : playAllRecordings}
                              disabled={Object.keys(userRecordings).length === 0}
                         >
                              <Ionicons
                                   name={isPlayingAll ? "stop" : "play-circle"}
                                   size={18}
                                   color={Object.keys(userRecordings).length === 0 ? colors.textSecondary : colors.primary}
                              />
                              <Text style={[
                                   styles.playAllText,
                                   Object.keys(userRecordings).length === 0 && { color: colors.textSecondary }
                              ]}>
                                   {isPlayingAll ? 'Stop Info' : 'Play My Recordings'}
                              </Text>
                         </TouchableOpacity>
                    </View>

                    {/* Subtitles List */}
                    <FlatList
                         ref={flatListRef}
                         data={subtitles}
                         style={styles.list}
                         contentContainerStyle={styles.listContent}
                         initialNumToRender={10}
                         maxToRenderPerBatch={10}
                         windowSize={10}
                         removeClippedSubviews={true}
                         showsVerticalScrollIndicator={false}
                         getItemLayout={getItemLayout}
                         renderItem={renderItem}
                         keyExtractor={keyExtractor}
                    />

                    {/* Recording Button */}
                    <View style={styles.recordContainer}>
                         <TouchableOpacity
                              onPressIn={startRecording}
                              onPressOut={stopRecording}
                              activeOpacity={0.8}
                              style={[
                                   styles.recordButton,
                                   isRecording && styles.recordButtonActive,
                                   !currentSubtitle && styles.recordButtonDisabled
                              ]}
                         >
                              <View style={[
                                   styles.recordInner,
                                   isRecording && styles.recordInnerActive
                              ]} />
                         </TouchableOpacity>
                         <Text style={styles.recordHint}>
                              {isRecording ? "Listening..." : "Hold to Record"}
                         </Text>
                    </View>

                    {/* Speed Control Modal */}
                    <Modal
                         transparent={true}
                         visible={showSpeedModal}
                         onRequestClose={() => setShowSpeedModal(false)}
                         animationType="fade"
                    >
                         <TouchableOpacity
                              style={styles.modalOverlay}
                              activeOpacity={1}
                              onPress={() => setShowSpeedModal(false)}
                         >
                              <View style={styles.speedModalContent}>
                                   <Text style={styles.speedModalTitle}>Playback Speed</Text>
                                   {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                                        <TouchableOpacity
                                             key={speed}
                                             style={[
                                                  styles.speedOption,
                                                  rate === speed && styles.speedOptionSelected
                                             ]}
                                             onPress={() => handleSpeedSelect(speed)}
                                        >
                                             <Text style={[
                                                  styles.speedOptionText,
                                                  rate === speed && styles.speedOptionTextSelected
                                             ]}>
                                                  {speed}x
                                             </Text>
                                             {rate === speed && (
                                                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                                             )}
                                        </TouchableOpacity>
                                   ))}
                              </View>
                         </TouchableOpacity>
                    </Modal>

                    {/* Word Preview Modal */}
                    <WordPreviewModal
                         visible={modalVisible}
                         wordData={selectedWordData}
                         isNew={isSelectedWordNew}
                         onClose={() => setModalVisible(false)}
                         onSave={handleSaveNewWord}
                         onGoToDetail={() => selectedWordData && handleGoToDetail(selectedWordData.id)}
                    />

                    {/* Pronunciation Detail Modal */}
                    <Modal
                         animationType="slide"
                         transparent={true}
                         visible={detailModalVisible}
                         onRequestClose={() => setDetailModalVisible(false)}
                    >
                         <View style={styles.detailModalOverlay}>
                              <View style={styles.detailModalContent}>
                                   <View style={styles.detailModalHeader}>
                                        <Text style={styles.detailModalTitle}>Pronunciation Feedback</Text>
                                        <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                                             <Ionicons name="close" size={24} color={colors.textPrimary} />
                                        </TouchableOpacity>
                                   </View>

                                   {selectedPronunciation && (
                                        <PronunciationDetailView
                                             {...selectedPronunciation}
                                        />
                                   )}
                              </View>
                         </View>
                    </Modal>

               </SafeAreaView>
          </View>
     );
};

const styles = StyleSheet.create({
     container: {
          flex: 1,
          backgroundColor: '#F8FAFC',
     },
     safeArea: {
          flex: 1,
     },
     header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: colors.white,
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
     },
     backButton: {
          marginRight: 16,
          padding: 4,
     },
     headerInfo: {
          flex: 1,
     },
     headerTitle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: colors.textPrimary,
     },
     headerSubtitle: {
          fontSize: 12,
          color: colors.textSecondary,
     },
     videoWrapper: {
          width: '100%',
          aspectRatio: 16 / 9,
          backgroundColor: 'black',
     },
     video: {
          flex: 1,
     },
     controlsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 12,
          backgroundColor: colors.white,
          borderBottomWidth: 1,
          borderBottomColor: '#F1F5F9',
     },
     centerControls: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 24,
     },
     controlBtn: {
          padding: 8,
     },
     playPauseBtn: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
     },
     speedBtn: {
          paddingHorizontal: 10,
          paddingVertical: 4,
          backgroundColor: '#F1F5F9',
          borderRadius: 8,
     },
     speedText: {
          fontSize: 12,
          fontWeight: 'bold',
          color: colors.textPrimary,
     },
     transcriptHeaderRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 12,
          backgroundColor: '#F8FAFC',
     },
     sectionHeader: {
          fontSize: 14,
          fontWeight: 'bold',
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
     },
     playAllBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
     },
     playAllText: {
          fontSize: 14,
          color: colors.primary,
          fontWeight: '600',
     },
     list: {
          flex: 1,
          backgroundColor: '#F8FAFC',
     },
     listContent: {
          paddingBottom: 120, // Space for recording button
     },
     subItem: {
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: colors.white,
          marginVertical: 4,
          marginHorizontal: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: 'transparent',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
     },
     subItemActive: {
          borderColor: colors.primary,
          backgroundColor: '#F0FDF4',
          transform: [{ scale: 1.02 }],
     },
     subItemRecorded: {
          borderLeftWidth: 4,
          borderLeftColor: colors.primary,
     },
     subContent: {
          flex: 1,
          flexDirection: 'row',
          gap: 12,
     },
     subIndex: {
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: '#F1F5F9',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
     },
     subIndexActive: {
          backgroundColor: colors.primary,
     },
     subIndexText: {
          fontSize: 10,
          fontWeight: 'bold',
          color: colors.textSecondary,
     },
     subIndexTextActive: {
          color: colors.white,
     },
     subBody: {
          flex: 1,
     },
     subText: {
          fontSize: 16,
          color: '#334155',
          lineHeight: 24,
     },
     subActiveText: {
          fontWeight: '600',
          color: '#0F172A',
     },
     analyzingRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 8,
          gap: 8,
     },
     analyzingText: {
          fontSize: 12,
          color: colors.textSecondary,
          fontStyle: 'italic',
     },
     scoreBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          marginTop: 8,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
          backgroundColor: '#F1F5F9',
     },
     scoreText: {
          fontSize: 12,
          fontWeight: 'bold',
          color: '#334155',
     },
     scoreHigh: {
          backgroundColor: '#DCFCE7',
     },
     scoreMid: {
          backgroundColor: '#FEF9C3',
     },
     scoreLow: {
          backgroundColor: '#FEE2E2',
     },
     itemActions: {
          justifyContent: 'space-between',
          paddingLeft: 12,
          borderLeftWidth: 1,
          borderLeftColor: '#F1F5F9',
          marginLeft: 8,
     },
     miniActionBtn: {
          padding: 8,
     },
     recordContainer: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.white,
          paddingBottom: 30, // Safe area
          paddingTop: 16,
          alignItems: 'center',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 10,
     },
     recordButton: {
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: '#F1F5F9',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 4,
          borderColor: colors.white,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
     },
     recordButtonActive: {
          backgroundColor: '#FEE2E2',
          transform: [{ scale: 1.1 }],
     },
     recordButtonDisabled: {
          opacity: 0.5,
     },
     recordInner: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.primary,
     },
     recordInnerActive: {
          backgroundColor: colors.error,
          width: 32,
          height: 32,
          borderRadius: 4,
     },
     recordHint: {
          marginTop: 8,
          fontSize: 12,
          color: colors.textSecondary,
          fontWeight: '500',
     },
     modalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
     },
     speedModalContent: {
          backgroundColor: colors.white,
          borderRadius: 24,
          padding: 24,
          width: 280,
     },
     speedModalTitle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: colors.textPrimary,
          marginBottom: 16,
          textAlign: 'center',
     },
     speedOption: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#F1F5F9',
     },
     speedOptionSelected: {
          backgroundColor: '#F0FDF4',
          marginHorizontal: -24,
          paddingHorizontal: 24,
     },
     speedOptionText: {
          fontSize: 16,
          color: colors.textPrimary,
     },
     speedOptionTextSelected: {
          color: colors.primary,
          fontWeight: '600',
     },
     detailModalOverlay: {
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.5)',
     },
     detailModalContent: {
          backgroundColor: colors.white,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 20,
          minHeight: '60%',
     },
     detailModalHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
     },
     detailModalTitle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: colors.textPrimary,
     },
});