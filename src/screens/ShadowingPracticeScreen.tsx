import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
     View,
     Text,
     StyleSheet,
     TouchableOpacity,
     ScrollView,
     Animated,
     Dimensions,
     Platform,
     Alert,
     ActivityIndicator,
     FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, AVPlaybackStatus, ResizeMode, Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { colors, shadows, spacing, typography, borderRadius } from '../theme';
import { RootStackParamList } from '../types';
import { AiService } from '../services/AiService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShadowingPractice'>;
type RouteProps = RouteProp<RootStackParamList, 'ShadowingPractice'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SUBTITLES = [
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

export const ShadowingPracticeScreen: React.FC = () => {
     const navigation = useNavigation<NavigationProp>();
     const route = useRoute<RouteProps>();
     const lesson = route.params;

     const videoRef = useRef<Video>(null);
     const flatListRef = useRef<FlatList>(null);
     const audioRecorder = useRef<Audio.Recording | null>(null);
     const playbackSound = useRef<Audio.Sound | null>(null);

     const [status, setStatus] = useState<AVPlaybackStatus>({} as AVPlaybackStatus);
     const [currentTime, setCurrentTime] = useState(0);

     type Subtitle = typeof SUBTITLES[number];
     const [subtitles, setSubtitles] = useState<Subtitle[]>(SUBTITLES);

     // Recording & Scoring State
     const [isRecording, setIsRecording] = useState(false);
     const [analyzingId, setAnalyzingId] = useState<number | null>(null);
     const [userRecordings, setUserRecordings] = useState<Record<number, string>>({});
     const [scores, setScores] = useState<Record<number, number>>({});
     const [playingUserAudioId, setPlayingUserAudioId] = useState<number | null>(null);
     const [isPlayingAll, setIsPlayingAll] = useState(false);

     // Helper for single segment playback
     const [stopAt, setStopAt] = useState<number | null>(null);

     const currentSubtitle = subtitles.find(sub => currentTime >= sub.start && currentTime < sub.end);

     useEffect(() => {
          setupAudioMode();
          return () => {
               if (playbackSound.current) {
                    playbackSound.current.unloadAsync();
               }
          };
     }, []);

     const setupAudioMode = async () => {
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

     // Handle status updates from the video player
     const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
          setStatus(status);
          if (status.isLoaded) {
               const timeInSeconds = status.positionMillis / 1000;
               setCurrentTime(timeInSeconds);

               // Stop partial playback
               if (stopAt !== null && timeInSeconds >= stopAt) {
                    videoRef.current?.pauseAsync();
                    setStopAt(null);
               }
          }
     };

     // Auto-scroll logic
     useEffect(() => {
          if (currentSubtitle && flatListRef.current && !isPlayingAll) {
               const index = subtitles.findIndex(s => s.id === currentSubtitle.id);
               if (index !== -1) {
                    // Center the active item (viewPosition: 0.3 means 30% from top)
                    flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
               }
          }
     }, [currentSubtitle?.id, isPlayingAll]);

     const playSegment = async (sub: Subtitle) => {
          if (!videoRef.current) return;
          setStopAt(sub.end);
          await videoRef.current.setPositionAsync(sub.start * 1000);
          await videoRef.current.playAsync();
     };

     const startRecording = async () => {
          if (!currentSubtitle) {
               Alert.alert("Notice", "Wait for a subtitle to appear or select one first.");
               return;
          }

          try {
               // Pause video if playing
               if (status.isLoaded && status.isPlaying) {
                    await videoRef.current?.pauseAsync();
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

               const { status: permStatus } = await Audio.requestPermissionsAsync();
               if (permStatus !== 'granted') return;

               const recording = new Audio.Recording();
               await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
               await recording.startAsync();

               audioRecorder.current = recording;
               setIsRecording(true);

          } catch (error) {
               console.error('Failed to start recording', error);
          }
     };

     const stopRecording = async () => {
          if (!audioRecorder.current || !currentSubtitle) return;

          try {
               setIsRecording(false);
               await audioRecorder.current.stopAndUnloadAsync();
               const uri = audioRecorder.current.getURI();
               audioRecorder.current = null;

               if (uri) {
                    const targetId = currentSubtitle.id;
                    setUserRecordings(prev => ({ ...prev, [targetId]: uri }));
                    analyzePronunciation(targetId, currentSubtitle.text, uri);
               }

               // Restore audio mode for playback
               await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
               });

          } catch (error) {
               console.error('Failed to stop recording', error);
          }
     };

     const analyzePronunciation = async (id: number, text: string, uri: string) => {
          setAnalyzingId(id);
          try {
               // 1. Give the OS time to flush the file content to disk
               await new Promise(resolve => setTimeout(resolve, 500));

               // 2. Validate file health
               const fileInfo = await FileSystem.getInfoAsync(uri);
               if (!fileInfo.exists || fileInfo.size === 0) {
                    throw new Error('Recording file is missing or empty. Please record again.');
               }

               const base64Audio = await FileSystem.readAsStringAsync(uri, {
                    encoding: 'base64',
               });

               const response = await AiService.checkPronunciationAccuracy(
                    text,
                    `data:audio/wav;base64,${base64Audio.trim()}`
               );

               // Validate response data
               if (!response || !response.data) {
                    throw new Error('Something went wrong, please try again later!');
               }

               const data = response.data;

               // Check if required fields exist
               if (typeof data.pronScore === 'undefined') {
                    console.error('API Error Response:', data);
                    throw new Error('Invalid response from AI service.');
               }

               setScores(prev => ({ ...prev, [id]: data.pronScore }));

          } catch (error) {
               console.error('Analysis failed', error);
               const errorMessage = error instanceof Error ? error.message : "Could not analyze pronunciation.";
               Alert.alert("Analysis Failed", errorMessage);
          } finally {
               setAnalyzingId(null);
          }
     };

     const playUserRecording = async (id: number) => {
          const uri = userRecordings[id];
          if (!uri) return;

          try {
               if (playbackSound.current) {
                    await playbackSound.current.unloadAsync();
               }
               setPlayingUserAudioId(id);
               const { sound } = await Audio.Sound.createAsync({ uri });
               playbackSound.current = sound;
               sound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                         setPlayingUserAudioId(null);
                    }
               });
               await sound.playAsync();
          } catch (error) {
               console.error('Play user audio failed', error);
               setPlayingUserAudioId(null);
          }
     };

     const playAllRecordings = async () => {
          setIsPlayingAll(true);
          const recordingIds = Object.keys(userRecordings).map(Number).sort((a, b) => a - b);

          if (recordingIds.length === 0) {
               Alert.alert("No recordings", "You haven't recorded anything yet.");
               setIsPlayingAll(false);
               return;
          }

          for (const id of recordingIds) {
               if (!isPlayingAll) break; // Check cancel flag (imperfect but helps)

               // Scroll to item
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
                         sound.setOnPlaybackStatusUpdate((status) => {
                              if (status.isLoaded && status.didJustFinish) {
                                   resolve();
                              }
                         });
                         await sound.playAsync();
                    } catch {
                         resolve();
                    }
               });
               setPlayingUserAudioId(null);
               await new Promise(r => setTimeout(r, 500)); // gap
          }
          setIsPlayingAll(false);
          setPlayingUserAudioId(null);
     };

     return (
          <View style={styles.container}>
               <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                    {/* Header */}
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

                    {/* Video Section - Top */}
                    <View style={styles.videoWrapper}>
                         <Video
                              ref={videoRef}
                              style={styles.video}
                              source={{ uri: 'https://d19o3szqkvjryx.cloudfront.net/videos/video.mp4' }}
                              useNativeControls
                              resizeMode={ResizeMode.CONTAIN}
                              isLooping={false}
                              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                         />
                    </View>

                    {/* Transcript Header */}
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

                    {/* Transcript List - Middle */}
                    <FlatList
                         ref={flatListRef}
                         data={subtitles}
                         style={styles.transcriptList}
                         contentContainerStyle={styles.transcriptContent}
                         showsVerticalScrollIndicator={false}
                         keyExtractor={(item) => item.id.toString()}
                         onScrollToIndexFailed={info => {
                              const wait = new Promise(resolve => setTimeout(resolve, 500));
                              wait.then(() => {
                                   flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.3 });
                              });
                         }}
                         renderItem={({ item: sub, index }) => {
                              const isActive = currentSubtitle?.id === sub.id;
                              const hasRecording = !!userRecordings[sub.id];
                              const score = scores[sub.id];
                              const isAnalyzing = analyzingId === sub.id;
                              const isPlayingThis = playingUserAudioId === sub.id;

                              return (
                                   <View
                                        style={[
                                             styles.subItem,
                                             isActive && styles.subItemActive,
                                             hasRecording && styles.subItemRecorded
                                        ]}
                                   >
                                        <TouchableOpacity
                                             style={styles.subContent}
                                             onPress={() => playSegment(sub)}
                                        >
                                             <View style={[styles.subIndex, isActive && styles.subIndexActive]}>
                                                  <Text style={[styles.subIndexText, isActive && styles.subIndexTextActive]}>{index + 1}</Text>
                                             </View>
                                             <View style={styles.subBody}>
                                                  <Text style={[styles.subText, isActive && styles.subActiveText]}>{sub.text}</Text>

                                                  {/* Score & Loading Indicator */}
                                                  {isAnalyzing && (
                                                       <View style={styles.analyzingRow}>
                                                            <ActivityIndicator size="small" color={colors.primary} />
                                                            <Text style={styles.analyzingText}>Analyzing...</Text>
                                                       </View>
                                                  )}

                                                  {!isAnalyzing && score !== undefined && (
                                                       <View style={[styles.scoreBadge, score >= 80 ? styles.scoreHigh : score >= 50 ? styles.scoreMid : styles.scoreLow]}>
                                                            <Text style={styles.scoreText}>{score}%</Text>
                                                       </View>
                                                  )}
                                             </View>
                                        </TouchableOpacity>

                                        {/* Action Buttons for this item */}
                                        <View style={styles.itemActions}>
                                             {/* Play Original */}
                                             <TouchableOpacity
                                                  style={styles.miniActionBtn}
                                                  onPress={() => playSegment(sub)}
                                             >
                                                  <Ionicons name="volume-high-outline" size={18} color={colors.textSecondary} />
                                             </TouchableOpacity>

                                             {/* Play Recording */}
                                             {hasRecording && (
                                                  <TouchableOpacity
                                                       style={styles.miniActionBtn}
                                                       onPress={() => playUserRecording(sub.id)}
                                                  >
                                                       <Ionicons
                                                            name={isPlayingThis ? "stop-circle" : "play-circle"}
                                                            size={18}
                                                            color={isPlayingThis ? colors.primary : colors.textSecondary}
                                                       />
                                                  </TouchableOpacity>
                                             )}
                                        </View>
                                   </View>
                              );
                         }}
                    />

                    {/* Bottom Controls - Sticky */}
                    <View style={[
                         styles.bottomControls,
                         {
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: -4 },
                              shadowOpacity: 0.1,
                              shadowRadius: 4,
                              elevation: 10,
                         }
                    ]}>
                         {/* Big Mic Button */}
                         <View style={styles.recordContainer}>
                              <Text style={styles.recordHint}>
                                   {isRecording
                                        ? "Recording... Tap to stop"
                                        : currentSubtitle
                                             ? "Tap mic to record this sentence"
                                             : "Play video to select a sentence"}
                              </Text>
                              <TouchableOpacity
                                   style={[styles.mainMicBtn, isRecording && styles.mainMicBtnActive]}
                                   onPress={isRecording ? stopRecording : startRecording}
                                   disabled={!currentSubtitle && !isRecording}
                              >
                                   <Ionicons name="mic" size={32} color="white" />
                              </TouchableOpacity>
                         </View>
                    </View>

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
          paddingBottom: 100, // Space for bottom controls
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
          borderColor: '#BBF7D0', // Greenish border if recorded
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
          marginTop: 6,
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 6,
     },
     scoreHigh: { backgroundColor: '#DCFCE7' }, // Green
     scoreMid: { backgroundColor: '#FEF9C3' }, // Yellow
     scoreLow: { backgroundColor: '#FEE2E2' }, // Red
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
          elevation: 10,
     },
     recordContainer: {
          alignItems: 'center',
          width: '100%',
     },
     recordHint: {
          fontSize: 13,
          color: colors.textSecondary,
          marginBottom: 12,
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
          backgroundColor: '#EF4444', // Red
          shadowColor: '#EF4444',
     },
});