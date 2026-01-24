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

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShadowingPractice'>;
type RouteProps = RouteProp<RootStackParamList, 'ShadowingPractice'>;

interface Subtitle {
     id: number;
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
     pronunciations: Record<number, PronunciationData>;
     onSeek: () => void;
     onPlay: () => void;
     onPlayRecording: () => void;
     onWordPress: (text: string) => void;
     onScorePress: () => void;
}

const RAW_SUBTITLES: Subtitle[] = [
     { id: 1, start: 2.35, end: 4.99, text: "What's stopping you? Are you too tired?" },
     { id: 2, start: 5.509, end: 7.629, text: "Didn't get enough sleep?" },
     { id: 3, start: 7.629, end: 10.38, text: "Don't have enough energy?" },
     { id: 4, start: 10.38, end: 12.98, text: "Don't have enough time? Is that what's stopping you right now?" },
     { id: 5, start: 13.58, end: 21.449, text: "Don't have enough money? Is that the thing? Or is the thing that's stopping you?" },
     { id: 6, start: 22.78, end: 26.239, text: "You." },
     { id: 7, start: 26.239, end: 30.66, text: "Excuses sound best to the person that's making them up." },
     { id: 8, start: 31.469, end: 35.27, text: "Stop feeling sorry for yourself. Get off the pity potty." },
     { id: 9, start: 36.14, end: 43.06, text: "Telling everybody your sad and soft stories trying to get people to show up to your pity potty's and your pity parades." },
     { id: 10, start: 43.659, end: 50.14, text: "If you ever see me in a Rolls Royce, a six or seven star hotel living my life to the fullest," },
     { id: 11, start: 50.659, end: 52.659, text: "don't get jealous of me" },
     { id: 12, start: 52.7, end: 55.299, text: "because I worked my ass off to get it." },
     { id: 13, start: 56.049, end: 58.049, text: "Nobody handed me nothing." },
     { id: 14, start: 58.289, end: 62.59, text: "Wake your ass up." },
     { id: 15, start: 62.75, end: 64.75, text: "Awaken the beast inside." },
     { id: 16, start: 65.189, end: 67.319, text: "It's game on." },
     { id: 17, start: 67.359, end: 69.219, text: "It's golf season." },
     { id: 18, start: 69.219, end: 74.26, text: "It's time for you to take advantage of the access and the resources that you have" },
     { id: 19, start: 74.739, end: 79.099, text: "in your country and your community. You got a problem with your life?" },
     { id: 20, start: 79.659, end: 82.109, text: "You got a problem with your environment?" },
     { id: 21, start: 82.79, end: 87.379, text: "Do something about it. If you want it, go get it." },
     { id: 22, start: 89.26, end: 92.939, text: "Recognize the excuses are not valid." },
     { id: 23, start: 95.14, end: 97.9, text: "Conjured up. They're fabricated. They're lies." },
     { id: 24, start: 98.5, end: 104.859, text: "And how do you stop the lies? You stop the lies with the truth. That the truth is you have time." },
     { id: 25, start: 105.42, end: 113.219, text: "You have the skill. You have the knowledge and the support and the willpower and the discipline" },
     { id: 26, start: 113.62, end: 115.379, text: "to get it done." },
     { id: 27, start: 115.379, end: 119.54, text: "The fruit of everything good in life" },
     { id: 28, start: 120.489, end: 122.579, text: "begins with the challenge." },
     { id: 29, start: 122.78, end: 124.78, text: "Everything is a pill that's worth a lot." },
     { id: 30, start: 124.78, end: 129.9, text: "And it's not going to come to you and it's not going to fall in your lap and it's not going to be" },
     { id: 31, start: 129.9, end: 135.58, text: "something that, oh my God, it just was so simple. It's always going to be difficult." },
     { id: 32, start: 135.659, end: 146, text: "This is your chance. This is your shot. This is your moment. This is your time. This is your place." },
     { id: 33, start: 146.24, end: 148.24, text: "This is your opportunity." },
     { id: 34, start: 148.24, end: 153.759, text: "This is my time. This is my moment. Tomorrow, tomorrow, tomorrow. Ain't no such thing as tomorrow." },
     { id: 35, start: 153.759, end: 159.439, text: "We only got today. It's your dream. If you want it to happen, get your butt up and make it happen." },
     { id: 36, start: 159.439, end: 162.319, text: "If you want it to happen, rise and grind." },
     { id: 37, start: 162.319, end: 169.86, text: "You still got work to do. Stay on that basketball court. Stay on that football field. It's grind season, homie." },
];

const normalizeSubtitles = (subtitles: Subtitle[]): Subtitle[] => {
     if (subtitles.length === 0) return [];

     const normalized = subtitles.map(sub => ({ ...sub }));

     normalized[0] = {
          ...normalized[0],
          start: normalized[0].start / 2,
     };

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

const SUBTITLES: Subtitle[] = RAW_SUBTITLES;

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
                         <Ionicons name="volume-high-outline" size={18} color={colors.textSecondary} />
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
                                   size={18}
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
     const lesson = route.params;

     const videoRef = useRef<Video>(null);
     const flatListRef = useRef<FlatList<Subtitle>>(null);
     const audioRecorder = useRef<Audio.Recording | null>(null);
     const playbackSound = useRef<Audio.Sound | null>(null);
     const recordingStartTime = useRef<number>(0);
     const shouldBeRecording = useRef<boolean>(false);

     // Video Control Refs
     const isSeekingRef = useRef<boolean>(false); // Blocks status updates during seek
     const stopAtRef = useRef<number | null>(null);
     const isProcessingRef = useRef<boolean>(false);

     const [status, setStatus] = useState<AVPlaybackStatus>({} as AVPlaybackStatus);
     const [currentTime, setCurrentTime] = useState<number>(0);
     const [subtitles, setSubtitles] = useState<Subtitle[]>(SUBTITLES);
     const [stopAt, setStopAt] = useState<number | null>(null);
     const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
     const [isSeeking, setIsSeeking] = useState<boolean>(false);

     const [isRecording, setIsRecording] = useState<boolean>(false);
     const [analyzingId, setAnalyzingId] = useState<number | null>(null);
     const [userRecordings, setUserRecordings] = useState<Record<number, string>>({});
     const [scores, setScores] = useState<Record<number, number>>({});
     const [pronunciations, setPronunciations] = useState<Record<number, PronunciationData>>({});
     const [playingUserAudioId, setPlayingUserAudioId] = useState<number | null>(null);
     const [isPlayingAll, setIsPlayingAll] = useState<boolean>(false);

     const [modalVisible, setModalVisible] = useState<boolean>(false);
     const [selectedWordData, setSelectedWordData] = useState<Word | null>(null);
     const [isSelectedWordNew, setIsSelectedWordNew] = useState<boolean>(false);

     const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
     const [selectedPronunciation, setSelectedPronunciation] = useState<PronunciationData | null>(null);

     const currentSubtitle = subtitles.find(sub => currentTime >= sub.start && currentTime < sub.end);

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
          setCurrentTime(timeInSeconds);

          // Check for auto-stop point (for Play Segment functionality)
          // Check for auto-stop point (for Play Segment functionality)
          if (stopAtRef.current !== null && timeInSeconds >= stopAtRef.current) {
               // Reached end of segment
               videoRef.current?.pauseAsync();

               // Auto-seek back to start to keep the item active and ready for replay/recording
               // Find the subtitle that ends at this stop point
               const currentSub = subtitles.find(s => Math.abs(s.end - (stopAtRef.current || 0)) < 0.5);
               if (currentSub) {
                    videoRef.current?.setPositionAsync(currentSub.start * 1000);
                    setCurrentTime(currentSub.start);
               }

               stopAtRef.current = null;
               setIsPlayingAll(false); // Stop "Play My Recordings" loop if active
          }
     }, [subtitles]);

     // Simplified Play Segment
     const playSegment = useCallback(async (sub: Subtitle): Promise<void> => {
          if (!videoRef.current || isProcessingRef.current) return;

          // Optimistic UI: Update active state immediately
          setCurrentTime(sub.start);

          try {
               isProcessingRef.current = true;
               isSeekingRef.current = true;
               stopAtRef.current = sub.end; // Set stop point

               // 1. Hard Pause first to ensure stable state
               if (status.isLoaded && status.isPlaying) {
                    await videoRef.current.pauseAsync();
               }

               // 2. Seek securely
               await videoRef.current.setPositionAsync(sub.start * 1000, {
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
     }, []);

     // Simplified Seek To Subtitle
     const seekToSubtitle = useCallback(async (sub: Subtitle): Promise<void> => {
          if (!videoRef.current || isProcessingRef.current) return;

          // Optimistic UI: Update active state immediately
          setCurrentTime(sub.start);

          try {
               isProcessingRef.current = true;
               isSeekingRef.current = true;
               stopAtRef.current = null; // Clear pending stop

               // 1. Hard Pause first
               if (status.isLoaded && status.isPlaying) {
                    await videoRef.current.pauseAsync();
               }

               // 2. Seek securely
               await videoRef.current.setPositionAsync(sub.start * 1000, {
                    toleranceMillisBefore: 0,
                    toleranceMillisAfter: 0
               });

               // Force update current time immediately for UI responsiveness
               setCurrentTime(sub.start);

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
          if (currentSubtitle && flatListRef.current && !isPlayingAll) {
               const index = subtitles.findIndex(s => s.id === currentSubtitle.id);
               if (index !== -1) {
                    flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
               }
          }
     }, [currentSubtitle?.id, isPlayingAll]);

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

     const analyzePronunciation = async (id: number, text: string, uri: string): Promise<void> => {
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

     const playUserRecording = async (id: number): Promise<void> => {
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
          setIsPlayingAll(true);
          const recordingIds = Object.keys(userRecordings).map(Number).sort((a, b) => a - b);

          if (recordingIds.length === 0) {
               Alert.alert("No recordings", "You haven't recorded anything yet.");
               setIsPlayingAll(false);
               return;
          }

          for (const id of recordingIds) {
               if (!isPlayingAll) break;

               const index = subtitles.findIndex(s => s.id === id);
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
               await new Promise(r => setTimeout(r, 500));
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
          isSeeking,
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
                              <Text style={styles.headerTitle} numberOfLines={1}>{lesson.title}</Text>
                              <Text style={styles.headerSubtitle} numberOfLines={1}>{lesson.channel} • {lesson.level}</Text>
                         </View>
                    </View>

                    <View style={styles.videoWrapper}>
                         <Video
                              ref={videoRef}
                              style={styles.video}
                              source={{ uri: 'https://d19o3szqkvjryx.cloudfront.net/videos/video.mp4' }}
                              useNativeControls
                              resizeMode={ResizeMode.CONTAIN}
                              isLooping={false}
                              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                              onLoad={() => setIsVideoReady(true)}
                         />
                    </View>

                    <View style={styles.transcriptHeaderRow}>
                         <Text style={styles.sectionHeader}>Transcript ({subtitles.length})</Text>
                         <TouchableOpacity
                              style={styles.playAllBtn}
                              onPress={isPlayingAll ? () => setIsPlayingAll(false) : playAllRecordings}
                         >
                              <Ionicons name={isPlayingAll ? "square" : "play-circle"} size={20} color={colors.primary} />
                              <Text style={styles.playAllText}>
                                   {isPlayingAll ? "Stop Playback" : "Play My Recordings"}
                              </Text>
                         </TouchableOpacity>
                    </View>

                    <FlatList<Subtitle>
                         ref={flatListRef}
                         data={subtitles}
                         style={styles.transcriptList}
                         contentContainerStyle={styles.transcriptContent}
                         showsVerticalScrollIndicator={false}
                         keyExtractor={keyExtractor}
                         renderItem={renderItem}
                         getItemLayout={getItemLayout}
                         removeClippedSubviews={true}
                         maxToRenderPerBatch={10}
                         windowSize={11}
                         initialNumToRender={10}
                         onScrollToIndexFailed={info => {
                              const wait = new Promise(resolve => setTimeout(resolve, 500));
                              wait.then(() => {
                                   flatListRef.current?.scrollToIndex({
                                        index: info.index,
                                        animated: true,
                                        viewPosition: 0.3
                                   });
                              });
                         }}
                    />

                    <View style={styles.bottomControls}>
                         <View style={styles.recordContainer}>
                              <TouchableOpacity
                                   style={[styles.mainMicBtn, isRecording && styles.mainMicBtnActive]}
                                   onPressIn={startRecording}
                                   onPressOut={stopRecording}
                                   disabled={!currentSubtitle}
                              >
                                   <Ionicons name="mic" size={32} color="white" />
                              </TouchableOpacity>
                         </View>
                    </View>

                    <WordPreviewModal
                         visible={modalVisible}
                         wordData={selectedWordData}
                         isNew={isSelectedWordNew}
                         onClose={() => setModalVisible(false)}
                         onSave={handleSaveNewWord}
                         onGoToDetail={handleGoToDetail}
                    />

                    <Modal
                         visible={detailModalVisible}
                         animationType="slide"
                         presentationStyle="pageSheet"
                         onRequestClose={() => setDetailModalVisible(false)}
                    >
                         {selectedPronunciation && (
                              <PronunciationDetailView
                                   recognizedText={selectedPronunciation.recognizedText}
                                   accuracyScore={selectedPronunciation.accuracyScore}
                                   fluencyScore={selectedPronunciation.fluencyScore}
                                   completenessScore={selectedPronunciation.completenessScore}
                                   pronScore={selectedPronunciation.pronScore}
                                   words={selectedPronunciation.words}
                                   onClose={() => setDetailModalVisible(false)}
                                   compact={false}
                              />
                         )}
                    </Modal>

               </SafeAreaView>
          </View>
     );
};

const styles = StyleSheet.create({
     container: {
          flex: 1,
          backgroundColor: '#FFFFFF',
     },
     safeArea: {
          flex: 1,
     },
     header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.screenPadding,
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: '#F1F5F9',
     },
     backButton: {
          marginRight: spacing.sm,
          padding: 4,
     },
     headerInfo: {
          flex: 1,
     },
     headerTitle: {
          fontSize: 16,
          fontWeight: '700',
          color: colors.textPrimary,
     },
     headerSubtitle: {
          fontSize: 12,
          color: colors.textSecondary,
     },
     videoWrapper: {
          width: '100%',
          aspectRatio: 16 / 9,
          backgroundColor: '#000',
     },
     video: {
          flex: 1,
     },
     transcriptHeaderRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.screenPadding,
          paddingVertical: 12,
          backgroundColor: '#F8FAFC',
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
     },
     sectionHeader: {
          fontSize: 16,
          fontWeight: '700',
          color: colors.textPrimary,
     },
     playAllBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 4,
          backgroundColor: '#EFF6FF',
          borderRadius: 20,
     },
     playAllText: {
          fontSize: 12,
          fontWeight: '600',
          color: colors.primary,
     },
     transcriptList: {
          flex: 1,
          backgroundColor: '#F8FAFC',
     },
     transcriptContent: {
          paddingHorizontal: spacing.screenPadding,
          paddingTop: 16,
          paddingBottom: 100,
     },
     subItem: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          backgroundColor: 'white',
          borderRadius: 12,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: '#E2E8F0',
     },
     subItemActive: {
          borderColor: colors.primary,
          backgroundColor: '#EFF6FF',
          borderWidth: 1.5,
     },
     subItemRecorded: {
          borderColor: '#BBF7D0',
     },
     subContent: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'flex-start',
     },
     subIndex: {
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: '#F1F5F9',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
          marginTop: 2,
     },
     subIndexActive: {
          backgroundColor: colors.primary,
     },
     subIndexText: {
          fontSize: 11,
          fontWeight: '700',
          color: '#64748B',
     },
     subIndexTextActive: {
          color: 'white',
     },
     subBody: {
          flex: 1,
     },
     subText: {
          fontSize: 15,
          color: '#334155',
          lineHeight: 22,
     },
     subActiveText: {
          fontWeight: '600',
          color: '#0F172A',
     },
     analyzingRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 4,
          gap: 6,
     },
     analyzingText: {
          fontSize: 12,
          color: colors.textSecondary,
          fontStyle: 'italic',
     },
     scoreBadge: {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          marginTop: 6,
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 6,
     },
     scoreHigh: { backgroundColor: '#DCFCE7' },
     scoreMid: { backgroundColor: '#FEF9C3' },
     scoreLow: { backgroundColor: '#FEE2E2' },
     scoreText: {
          fontSize: 11,
          fontWeight: '700',
          color: '#334155',
     },
     itemActions: {
          flexDirection: 'row',
          alignItems: 'center',
          marginLeft: 8,
          gap: 4,
     },
     miniActionBtn: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: '#F1F5F9',
          alignItems: 'center',
          justifyContent: 'center',
     },
     bottomControls: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          paddingVertical: 16,
          paddingHorizontal: 20,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 10,
     },
     recordContainer: {
          alignItems: 'center',
          width: '100%',
     },
     mainMicBtn: {
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
     },
     mainMicBtnActive: {
          backgroundColor: '#EF4444',
          shadowColor: '#EF4444',
     },
     mainMicBtnDisabled: {
          backgroundColor: '#CBD5E1', // Gray color
          shadowColor: 'transparent',
          elevation: 0,
     },
});