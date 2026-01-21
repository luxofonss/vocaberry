import React, { useState, useRef, useEffect } from 'react';
import {
     View,
     Text,
     StyleSheet,
     TouchableOpacity,
     ScrollView,
     Animated,
     Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadows } from '../theme';
import { RootStackParamList } from '../types';
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShadowingPractice'>;
type RouteProps = RouteProp<RootStackParamList, 'ShadowingPractice'>;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SUBTITLES = [
     { id: 1, start: 0, end: 3, text: 'Hello everyone! Welcome to today\'s lesson.', translation: 'Hello everyone! Welcome to today\'s lesson.' },
     { id: 2, start: 3, end: 7, text: 'Today we\'re going to talk about daily routines.', translation: 'Today we\'re going to talk about daily routines.' },
     { id: 3, start: 7, end: 11, text: 'I usually wake up at 6 o\'clock in the morning.', translation: 'I usually wake up at 6 o\'clock in the morning.' },
     { id: 4, start: 11, end: 15, text: 'Then I brush my teeth and take a shower.', translation: 'Then I brush my teeth and take a shower.' },
     { id: 5, start: 15, end: 19, text: 'After that, I have breakfast with my family.', translation: 'After that, I have breakfast with my family.' },
     { id: 6, start: 19, end: 23, text: 'I usually have coffee and some toast.', translation: 'I usually have coffee and some toast.' },
     { id: 7, start: 23, end: 27, text: 'At 7:30, I leave home and go to work.', translation: 'At 7:30, I leave home and go to work.' },
     { id: 8, start: 27, end: 31, text: 'I work from 8 AM to 5 PM every day.', translation: 'I work from 8 AM to 5 PM every day.' },
];
export const ShadowingPracticeScreen: React.FC = () => {
     const navigation = useNavigation<NavigationProp>();
     const route = useRoute<RouteProps>();
     const lesson = route.params;
     const [isPlaying, setIsPlaying] = useState(false);
     const [currentTime, setCurrentTime] = useState(0);
     const [isMuted, setIsMuted] = useState(false);
     const [isRecording, setIsRecording] = useState(false);
     const [playbackSpeed, setPlaybackSpeed] = useState(1);
     const [showTranslation, setShowTranslation] = useState(true);
     const [mode, setMode] = useState<'watch' | 'shadow'>('watch');
     const [recordedSegments, setRecordedSegments] = useState<Set<number>>(new Set());
     // Animation refs
     const fadeAnim = useRef(new Animated.Value(0)).current;
     const intervalRef = useRef<NodeJS.Timeout | null>(null);
     const scrollViewRef = useRef<ScrollView>(null);
     const totalDuration = 31; // Mock total duration
     const getCurrentSubtitle = () => {
          return SUBTITLES.find(sub => currentTime >= sub.start && currentTime < sub.end);
     };
     const currentSubtitle = getCurrentSubtitle();
     useEffect(() => {
          Animated.timing(fadeAnim, {
               toValue: 1,
               duration: 500,
               useNativeDriver: true,
          }).start();
          return () => {
               if (intervalRef.current) clearInterval(intervalRef.current);
          };
     }, []);
     // Auto-scroll to current subtitle
     useEffect(() => {
          if (currentSubtitle && scrollViewRef.current && isPlaying) {
               const index = SUBTITLES.findIndex(s => s.id === currentSubtitle.id);
               if (index !== -1) {
                    // Calculate offset based on mode (Shadow mode has extra card at top)
                    let offset = 0;
                    if (mode === 'shadow') {
                         offset += 340; // Approximate height of Shadow Area
                    }
                    offset += 50; // Transcript Header "Subtitles (N)" height
                    const scrollY = offset + (index * 110); // 110 is approx item height
                    scrollViewRef.current.scrollTo({ y: scrollY, animated: true });
               }
          }
     }, [currentSubtitle, isPlaying, mode]);
     const togglePlay = () => {
          if (isPlaying) {
               setIsPlaying(false);
               if (intervalRef.current) clearInterval(intervalRef.current);
          } else {
               setIsPlaying(true);
               intervalRef.current = setInterval(() => {
                    setCurrentTime(prev => {
                         if (prev >= totalDuration) {
                              setIsPlaying(false);
                              if (intervalRef.current) clearInterval(intervalRef.current);
                              return 0;
                         }
                         return prev + 1;
                    });
               }, 1000 / playbackSpeed);
          }
     };
     const toggleRecording = () => {
          const nextState = !isRecording;
          setIsRecording(nextState);
          if (nextState) {
               // "Recording" started
               if (currentSubtitle) {
                    const newSet = new Set(recordedSegments);
                    newSet.add(currentSubtitle.id);
                    setRecordedSegments(newSet);
               }
          }
     };
     const formatTime = (seconds: number) => {
          const mins = Math.floor(seconds / 60);
          const secs = Math.floor(seconds % 60);
          return `${mins}:${secs.toString().padStart(2, '0')}`;
     };
     const handleSeek = (time: number) => {
          setCurrentTime(time);
          if (!isPlaying) {
               // If paused, just jump there
          } else {
               // If playing, continue playing from there (interval continues)
          }
     };
     return (
          <View style={styles.container}>
               <LinearGradient
                    colors={['#ECFDF5', '#FFFFFF', '#ECFDF5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBg}
               >
                    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
                         {/* Fixed Top Section */}
                         <View>
                              {/* Header */}
                              <LinearGradient
                                   colors={['#22C55E', '#10B981']}
                                   start={{ x: 0, y: 0 }}
                                   end={{ x: 1, y: 0 }}
                                   style={styles.header}
                              >
                                   <TouchableOpacity
                                        onPress={() => navigation.goBack()}
                                        style={styles.backButton}
                                   >
                                        <Ionicons name="arrow-back" size={24} color="white" />
                                   </TouchableOpacity>
                                   <View style={styles.headerContent}>
                                        <Text style={styles.headerTitle}>{lesson.title || 'Lesson Title'}</Text>
                                        <View style={styles.accentBadge}>
                                             <Text style={styles.accentText}>{lesson.accent || 'General'}</Text>
                                        </View>
                                   </View>
                                   <Text style={styles.channelText}>{lesson.channel || 'Channel Name'}</Text>
                              </LinearGradient>
                              {/* Video Player Placeholder */}
                              <View style={styles.videoContainer}>
                                   <View style={styles.videoPlaceholder}>
                                        <Text style={{ fontSize: 60 }}>{lesson.thumbnail || '🎬'}</Text>
                                   </View>
                                   {/* Subtitles Overlay */}
                                   {currentSubtitle && (
                                        <Animated.View style={styles.subtitleOverlay}>
                                             <Text style={styles.subtitleTextOverlay}>{currentSubtitle.text}</Text>
                                             {showTranslation && (
                                                  <Text style={styles.translationTextOverlay}>{currentSubtitle.translation}</Text>
                                             )}
                                        </Animated.View>
                                   )}
                                   {/* Play Overlay */}
                                   {!isPlaying && (
                                        <View style={styles.playButtonOverlayContainer}>
                                             <TouchableOpacity onPress={togglePlay} style={styles.bigPlayButton}>
                                                  <Ionicons name="play" size={40} color="#15803D" style={{ marginLeft: 4 }} />
                                             </TouchableOpacity>
                                        </View>
                                   )}
                              </View>
                              {/* Controls */}
                              <View style={[styles.controlsContainer, shadows.level1]}>
                                   {/* Progress Bar */}
                                   <View style={styles.progressBarRow}>
                                        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                                        <View style={styles.progressBarTrack}>
                                             <View style={[styles.progressBarFill, { width: `${(currentTime / totalDuration) * 100}%` }]}>
                                                  <LinearGradient colors={['#22C55E', '#10B981']} style={{ flex: 1 }} />
                                             </View>
                                        </View>
                                        <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
                                   </View>
                                   {/* Buttons */}
                                   <View style={styles.controlsRow}>
                                        <View style={styles.leftControls}>
                                             <TouchableOpacity onPress={togglePlay} style={styles.iconBtn}>
                                                  <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#374151" />
                                             </TouchableOpacity>
                                             <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={styles.iconBtn}>
                                                  <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={24} color="#374151" />
                                             </TouchableOpacity>
                                             <TouchableOpacity
                                                  onPress={() => { setCurrentTime(0); setIsPlaying(false); }}
                                                  style={styles.iconBtn}
                                             >
                                                  <Ionicons name="refresh" size={24} color="#374151" />
                                             </TouchableOpacity>
                                        </View>
                                        <View style={styles.rightControls}>
                                             <TouchableOpacity
                                                  onPress={() => setPlaybackSpeed(playbackSpeed === 1 ? 0.75 : playbackSpeed === 0.75 ? 0.5 : 1)}
                                                  style={styles.speedBtn}
                                             >
                                                  <Text style={styles.speedText}>{playbackSpeed}x</Text>
                                             </TouchableOpacity>
                                             <TouchableOpacity
                                                  onPress={() => setShowTranslation(!showTranslation)}
                                                  style={[styles.langBtn, showTranslation ? styles.langBtnActive : null]}
                                             >
                                                  <Text style={[styles.langText, showTranslation ? styles.langTextActive : null]}>EN</Text>
                                             </TouchableOpacity>
                                        </View>
                                   </View>
                              </View>
                              {/* Mode Switcher */}
                              <View style={styles.modeContainer}>
                                   <View style={styles.modeSwitch}>
                                        <TouchableOpacity
                                             style={[styles.modeBtn, mode === 'watch' && styles.modeBtnActive]}
                                             onPress={() => setMode('watch')}
                                        >
                                             <Text style={[styles.modeBtnText, mode === 'watch' && styles.modeBtnTextActive]}>👀 Watch</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                             style={[styles.modeBtn, mode === 'shadow' && styles.modeBtnActive]}
                                             onPress={() => setMode('shadow')}
                                        >
                                             <Text style={[styles.modeBtnText, mode === 'shadow' && styles.modeBtnTextActive]}>🎤 Shadow</Text>
                                        </TouchableOpacity>
                                   </View>
                              </View>
                         </View>
                         {/* Scrollable Bottom Section */}
                         <ScrollView
                              ref={scrollViewRef}
                              contentContainerStyle={styles.scrollContent}
                              showsVerticalScrollIndicator={false}
                              style={{ flex: 1 }}
                         >
                              {/* Shadow Mode - Recording Area */}
                              {mode === 'shadow' && (
                                   <Animated.View style={[styles.shadowArea, { opacity: fadeAnim }]}>
                                        <LinearGradient
                                             colors={['#22C55E', '#10B981']}
                                             style={styles.recordingCard}
                                        >
                                             <Text style={styles.shadowTitle}>🎯 Shadowing Mode</Text>
                                             <Text style={styles.shadowSubtitle}>Listen and repeat each sentence. Record your voice!</Text>
                                             <View style={{ alignItems: 'center', marginVertical: 20 }}>
                                                  <TouchableOpacity
                                                       onPress={toggleRecording}
                                                       style={[
                                                            styles.micButton,
                                                            isRecording && styles.micButtonActive
                                                       ]}
                                                  >
                                                       <Ionicons name="mic" size={32} color="white" />
                                                  </TouchableOpacity>
                                             </View>
                                             <Text style={styles.recordingStatus}>
                                                  {isRecording ? 'Recording... Speak now!' : 'Tap mic to start recording'}
                                             </Text>
                                             {currentSubtitle && (
                                                  <View style={styles.currentSentenceBox}>
                                                       <Text style={styles.currentSentenceText}>{currentSubtitle.text}</Text>
                                                  </View>
                                             )}
                                        </LinearGradient>
                                   </Animated.View>
                              )}
                              {/* Transcript List */}
                              <View style={styles.transcriptContainer}>
                                   <Text style={styles.sectionHeader}>Subtitles ({SUBTITLES.length})</Text>
                                   {SUBTITLES.map((sub, index) => {
                                        const isActive = currentSubtitle?.id === sub.id;
                                        const isRecorded = recordedSegments.has(sub.id);
                                        return (
                                             <TouchableOpacity
                                                  key={sub.id}
                                                  onPress={() => handleSeek(sub.start)}
                                                  style={[
                                                       styles.transcriptItem,
                                                       isActive && styles.transcriptItemActive
                                                  ]}
                                             >
                                                  <View style={styles.subNumberCircle}>
                                                       <Text style={styles.subNumberText}>{index + 1}</Text>
                                                  </View>
                                                  <View style={{ flex: 1 }}>
                                                       <Text style={[styles.subText, isActive && styles.subTextActive]}>{sub.text}</Text>
                                                       <Text style={[styles.subTranslation, isActive && styles.subTranslationActive]}>{sub.translation}</Text>
                                                       <View style={styles.subMetaRow}>
                                                            <Text style={styles.timestamp}>{formatTime(sub.start)} - {formatTime(sub.end)}</Text>
                                                            {isRecorded && (
                                                                 <View style={styles.recordedBadge}>
                                                                      <Text style={styles.recordedText}>✓ Recorded</Text>
                                                                 </View>
                                                            )}
                                                       </View>
                                                  </View>
                                                  <Ionicons name="play-circle-outline" size={20} color="#9CA3AF" />
                                             </TouchableOpacity>
                                        );
                                   })}
                              </View>
                              {/* Progress Stats */}
                              <View style={styles.statsContainer}>
                                   <LinearGradient
                                        colors={['#22C55E', '#10B981']}
                                        style={styles.statsCard}
                                   >
                                        <Text style={styles.statsTitle}>📊 Your Progress</Text>
                                        <View style={styles.statsGrid}>
                                             <View style={styles.statBox}>
                                                  <Text style={styles.statBigNum}>{recordedSegments.size}</Text>
                                                  <Text style={styles.statLabelSmall}>Practiced</Text>
                                             </View>
                                             <View style={styles.statBox}>
                                                  <Text style={styles.statBigNum}>{SUBTITLES.length}</Text>
                                                  <Text style={styles.statLabelSmall}>Total</Text>
                                             </View>
                                             <View style={styles.statBox}>
                                                  <Text style={styles.statBigNum}>{Math.round((recordedSegments.size / SUBTITLES.length) * 100)}%</Text>
                                                  <Text style={styles.statLabelSmall}>Completed</Text>
                                             </View>
                                        </View>
                                   </LinearGradient>
                              </View>
                         </ScrollView>
                    </SafeAreaView>
               </LinearGradient>
          </View>
     );
};
const styles = StyleSheet.create({
     container: { flex: 1 },
     gradientBg: { flex: 1 },
     scrollContent: { paddingBottom: 40 },
     header: {
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 20,
     },
     backButton: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
     },
     headerContent: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4,
     },
     headerTitle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: 'white',
          flex: 1,
          marginRight: 10,
     },
     accentBadge: {
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderRadius: 12,
          paddingHorizontal: 10,
          paddingVertical: 4,
     },
     accentText: {
          color: 'white',
          fontSize: 12,
          fontWeight: '600',
     },
     channelText: {
          color: '#DCFCE7',
          fontSize: 14,
     },
     videoContainer: {
          height: 220,
          backgroundColor: '#111827', // gray-900
          position: 'relative',
          justifyContent: 'center',
          alignItems: 'center',
     },
     videoPlaceholder: {
          alignItems: 'center',
          justifyContent: 'center',
     },
     subtitleOverlay: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          backgroundColor: 'rgba(0,0,0,0.6)',
          alignItems: 'center',
     },
     subtitleTextOverlay: {
          color: 'white',
          fontSize: 16,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 4,
          textShadowColor: 'rgba(0,0,0,0.75)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
     },
     translationTextOverlay: {
          color: '#BBF7D0', // green-200
          fontSize: 14,
          textAlign: 'center',
     },
     playButtonOverlayContainer: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
     },
     bigPlayButton: {
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: 'rgba(255,255,255,0.9)',
          alignItems: 'center',
          justifyContent: 'center',
     },
     controlsContainer: {
          backgroundColor: 'white',
          padding: 16,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          marginBottom: 24,
     },
     progressBarRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
     },
     timeText: {
          fontSize: 12,
          color: '#4B5563',
          fontWeight: '500',
          width: 35,
     },
     progressBarTrack: {
          flex: 1,
          height: 6,
          backgroundColor: '#E5E7EB',
          borderRadius: 3,
          overflow: 'hidden',
     },
     progressBarFill: {
          height: '100%',
          borderRadius: 3,
          overflow: 'hidden',
     },
     controlsRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
     },
     leftControls: {
          flexDirection: 'row',
          gap: 12,
     },
     rightControls: {
          flexDirection: 'row',
          gap: 12,
     },
     iconBtn: {
          padding: 8,
          borderRadius: 20,
          backgroundColor: '#F3F4F6',
     },
     speedBtn: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: '#F3F4F6',
          borderRadius: 16,
     },
     speedText: {
          fontSize: 12,
          fontWeight: '600',
          color: '#374151',
     },
     langBtn: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: '#F3F4F6',
          borderRadius: 16,
     },
     langBtnActive: {
          backgroundColor: '#DCFCE7',
     },
     langText: {
          fontSize: 12,
          fontWeight: '600',
          color: '#374151',
     },
     langTextActive: {
          color: '#15803D',
     },
     modeContainer: {
          paddingHorizontal: 20,
          marginBottom: 24,
     },
     modeSwitch: {
          flexDirection: 'row',
          backgroundColor: '#F3F4F6',
          padding: 4,
          borderRadius: 16,
     },
     modeBtn: {
          flex: 1,
          paddingVertical: 10,
          alignItems: 'center',
          borderRadius: 12,
     },
     modeBtnActive: {
          backgroundColor: 'white',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
     },
     modeBtnText: {
          fontSize: 14,
          fontWeight: '600',
          color: '#4B5563',
     },
     modeBtnTextActive: {
          color: '#1F2937',
     },
     shadowArea: {
          paddingHorizontal: 20,
          marginBottom: 24,
     },
     recordingCard: {
          borderRadius: 24,
          padding: 24,
          alignItems: 'center',
     },
     shadowTitle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: 'white',
          marginBottom: 8,
     },
     shadowSubtitle: {
          fontSize: 14,
          color: '#DCFCE7',
          textAlign: 'center',
          marginBottom: 4,
     },
     micButton: {
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: 'rgba(255,255,255,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.3)',
     },
     micButtonActive: {
          backgroundColor: '#EF4444',
          borderColor: '#EF4444',
     },
     recordingStatus: {
          color: 'white',
          fontSize: 14,
          marginBottom: 16,
     },
     currentSentenceBox: {
          backgroundColor: 'rgba(255,255,255,0.1)',
          padding: 12,
          borderRadius: 12,
          width: '100%',
     },
     currentSentenceText: {
          color: 'white',
          fontWeight: '600',
          textAlign: 'center',
          fontSize: 15,
     },
     transcriptContainer: {
          paddingHorizontal: 20,
          marginBottom: 24,
     },
     sectionHeader: {
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: 16,
          color: '#1F2937',
     },
     transcriptItem: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          padding: 16,
          backgroundColor: 'white',
          borderRadius: 16,
          marginBottom: 12,
          gap: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
     },
     transcriptItemActive: {
          backgroundColor: '#ECFDF5', // green-50
          borderColor: '#BBF7D0',
          borderWidth: 1,
     },
     subNumberCircle: {
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          alignItems: 'center',
          justifyContent: 'center',
     },
     subNumberText: {
          fontSize: 12,
          color: '#10B981',
          fontWeight: 'bold',
     },
     subText: {
          fontSize: 15,
          fontWeight: '600',
          color: '#374151',
          marginBottom: 4,
     },
     subTextActive: {
          color: '#065F46', // green-800
     },
     subTranslation: {
          fontSize: 13,
          color: '#6B7280',
     },
     subTranslationActive: {
          color: '#047857', // green-700
     },
     subMetaRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 8,
          gap: 8,
     },
     timestamp: {
          fontSize: 11,
          color: '#9CA3AF',
     },
     recordedBadge: {
          backgroundColor: '#22C55E',
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 8,
     },
     recordedText: {
          color: 'white',
          fontSize: 10,
          fontWeight: 'bold',
     },
     statsContainer: {
          paddingHorizontal: 20,
     },
     statsCard: {
          padding: 20,
          borderRadius: 24,
     },
     statsTitle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: 'white',
          marginBottom: 16,
     },
     statsGrid: {
          flexDirection: 'row',
          justifyContent: 'space-between',
     },
     statBox: {
          alignItems: 'center',
     },
     statBigNum: {
          fontSize: 24,
          fontWeight: 'bold',
          color: 'white',
     },
     statLabelSmall: {
          fontSize: 12,
          color: '#DCFCE7',
     },
});