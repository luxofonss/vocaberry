import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
     View,
     Text,
     StyleSheet,
     TouchableOpacity,
     Alert,
     ActivityIndicator,
     Dimensions,
     FlatList,
     Animated,
     ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode, Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, shadows, spacing, typography, borderRadius } from '../theme';
import { RootStackParamList } from '../types';
import { AiService } from '../services/AiService';
import { StorageService } from '../services/StorageService';
import { PronunciationDetailView } from '../components/PronunciationDetailView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface IpaItem {
     id: string;
     symbol: string;
     videoUrl: string;
     example: string;
     phonetic: string;
     instruction: string;
}

const getIpaVideoUrl = (id: string, symbol: string) => {
     return `https://d19o3szqkvjryx.cloudfront.net/ipa/${id}.+${encodeURIComponent(symbol)}.mp4`;
};

const IPA_DATA: IpaItem[] = [
     { id: '1', symbol: 'ɑː', videoUrl: getIpaVideoUrl('1', 'a'), example: 'Car', phonetic: '/kɑːr/', instruction: 'Open your mouth wide and relax your tongue low in your mouth.' },
     { id: '2', symbol: 'aʊ', videoUrl: getIpaVideoUrl('2', 'au'), example: 'How', phonetic: '/haʊ/', instruction: 'Start with an open "a" and slide your jaw up to a rounded "u".' },
     { id: '3', symbol: 'aɪ', videoUrl: getIpaVideoUrl('3', 'ai'), example: 'My', phonetic: '/maɪ/', instruction: 'Start with an open "a" and slide your tongue up to a high "i".' },
     { id: '4', symbol: 'ɔɪ', videoUrl: getIpaVideoUrl('4', 'ɔɪ'), example: 'Boy', phonetic: '/bɔɪ/', instruction: 'Start with rounded lips for "o" and slide to a high "i" sound.' },
     { id: '5', symbol: 'eə', videoUrl: getIpaVideoUrl('5', 'eə'), example: 'Hair', phonetic: '/heər/', instruction: 'Start with "e" and slide into a neutral, relaxed schwa sound.' },
     { id: '6', symbol: 'ei', videoUrl: getIpaVideoUrl('6', 'ei'), example: 'Say', phonetic: '/seɪ/', instruction: 'Start with "e" and slide your tongue up towards a high "i".' },
     { id: '7', symbol: 'ou', videoUrl: getIpaVideoUrl('7', 'ou'), example: 'Go', phonetic: '/ɡoʊ/', instruction: 'Start with a relaxed "o" and slide to a rounded "u" position.' },
     { id: '8', symbol: 'ɪə', videoUrl: getIpaVideoUrl('8', 'ɪə'), example: 'Near', phonetic: '/nɪər/', instruction: 'Start with a high "i" and slide into a neutral schwa sound.' },
     { id: '9', symbol: 'uː', videoUrl: getIpaVideoUrl('9', 'u'), example: 'Blue', phonetic: '/bluː/', instruction: 'Round your lips tightly into a small circle and push your tongue back.' },
     { id: '10', symbol: 'ʌ', videoUrl: getIpaVideoUrl('10', 'ʌ'), example: 'Cup', phonetic: '/kʌp/', instruction: 'Open your mouth slightly and keep your tongue relaxed in the center.' },
     { id: '11', symbol: 'ʊə', videoUrl: getIpaVideoUrl('11', 'ʊə'), example: 'Pure', phonetic: '/pjʊər/', instruction: 'Start with a rounded "u" and slide to a relaxed, neutral schwa.' },
     { id: '12', symbol: 'iː', videoUrl: getIpaVideoUrl('12', 'i'), example: 'See', phonetic: '/siː/', instruction: 'Smile slightly and pull your tongue high and forward in your mouth.' },
     { id: '13', symbol: 'ɜːr', videoUrl: getIpaVideoUrl('13', 'ɜr'), example: 'Bird', phonetic: '/bɜːrd/', instruction: 'Keep your tongue neutral and curl the sides or tip slightly up.' },
     { id: '14', symbol: 'ə', videoUrl: getIpaVideoUrl('14', 'ə'), example: 'About', phonetic: '/əˈbaʊt/', instruction: 'Relax all mouth muscles; it is a very short, neutral "lazy" sound.' },
     { id: '15', symbol: 'e', videoUrl: getIpaVideoUrl('15', 'e'), example: 'Bed', phonetic: '/bed/', instruction: 'Open your mouth halfway and keep your tongue flat and forward.' },
     { id: '16', symbol: 'ɔː', videoUrl: getIpaVideoUrl('16', 'ɔ'), example: 'Door', phonetic: '/dɔːr/', instruction: 'Round your lips into an "o" shape and lower your jaw significantly.' },
     { id: '17', symbol: 'æ', videoUrl: getIpaVideoUrl('17', 'æ'), example: 'Cat', phonetic: '/kæt/', instruction: 'Open your mouth wide and pull the corners of your lips back.' },
     { id: '18', symbol: 'ɒ', videoUrl: getIpaVideoUrl('18', 'ɒ'), example: 'Hot', phonetic: '/hɒt/', instruction: 'Open your mouth wide and keep your tongue low and at the back.' },
     { id: '19', symbol: 'ɪ', videoUrl: getIpaVideoUrl('19', 'ɪ'), example: 'Sit', phonetic: '/sɪt/', instruction: 'Relax your lips and keep your tongue high but not as tense as "i:".' },
     { id: '20', symbol: 'ʊ', videoUrl: getIpaVideoUrl('20', 'ʊ'), example: 'Book', phonetic: '/bʊk/', instruction: 'Relax your lips slightly and keep your tongue high and back.' },
     { id: '21', symbol: 'b', videoUrl: getIpaVideoUrl('21', 'b'), example: 'Bat', phonetic: '/bæt/', instruction: 'Press your lips together and release them with a vibrating puff.' },
     { id: '22', symbol: 'd', videoUrl: getIpaVideoUrl('22', 'd'), example: 'Dog', phonetic: '/dɒɡ/', instruction: 'Place your tongue tip behind your upper teeth and release with vibration.' },
     { id: '23', symbol: 'ð', videoUrl: getIpaVideoUrl('23', 'ð'), example: 'This', phonetic: '/ðɪs/', instruction: 'Place your tongue tip between your teeth and vibrate your vocal cords.' },
     { id: '24', symbol: 'ɡ', videoUrl: getIpaVideoUrl('24', 'g'), example: 'Go', phonetic: '/ɡoʊ/', instruction: 'Press the back of your tongue against the roof and release with vibration.' },
     { id: '25', symbol: 'f', videoUrl: getIpaVideoUrl('25', 'f'), example: 'Fish', phonetic: '/fɪʃ/', instruction: 'Place your upper teeth gently on your lower lip and blow air out.' },
     { id: '26', symbol: 'dʒ', videoUrl: getIpaVideoUrl('26', 'dʒ'), example: 'Just', phonetic: '/dʒʌst/', instruction: 'Start with "d" and slide into a vibrating "zh" sound quickly.' },
     { id: '27', symbol: 'h', videoUrl: getIpaVideoUrl('27', 'h'), example: 'Hat', phonetic: '/hæt/', instruction: 'Open your mouth and breathe out sharply from the back of your throat.' },
     { id: '28', symbol: 'j', videoUrl: getIpaVideoUrl('28', 'j'), example: 'Yes', phonetic: '/jes/', instruction: 'Push the middle of your tongue toward the roof of your mouth.' },
     { id: '29', symbol: 'k', videoUrl: getIpaVideoUrl('29', 'k'), example: 'Key', phonetic: '/kiː/', instruction: 'Press the back of your tongue against the roof and release air sharply.' },
     { id: '30', symbol: 'l', videoUrl: getIpaVideoUrl('30', 'l'), example: 'Leaf', phonetic: '/liːf/', instruction: 'Place your tongue tip behind your upper teeth and let air flow past sides.' },
     { id: '31', symbol: 'm', videoUrl: getIpaVideoUrl('31', 'm'), example: 'Moon', phonetic: '/muːn/', instruction: 'Press your lips together and let the sound vibrate through your nose.' },
     { id: '32', symbol: 'n', videoUrl: getIpaVideoUrl('32', 'n'), example: 'No', phonetic: '/noʊ/', instruction: 'Place your tongue tip behind upper teeth and let air flow through nose.' },
     { id: '33', symbol: 'ŋ', videoUrl: getIpaVideoUrl('33', 'ŋ'), example: 'Sing', phonetic: '/sɪŋ/', instruction: 'Press the back of your tongue against the roof and air flows through nose.' },
     { id: '34', symbol: 'p', videoUrl: getIpaVideoUrl('34', 'p'), example: 'Pen', phonetic: '/pen/', instruction: 'Press your lips together and release air sharply without vibration.' },
     { id: '35', symbol: 'r', videoUrl: getIpaVideoUrl('35', 'r'), example: 'Red', phonetic: '/red/', instruction: 'Curl your tongue tip up behind upper teeth without touching the roof.' },
     { id: '36', symbol: 's', videoUrl: getIpaVideoUrl('36', 's'), example: 'Sun', phonetic: '/sʌn/', instruction: 'Place your tongue tip near your upper teeth and blow air through.' },
     { id: '37', symbol: 't', videoUrl: getIpaVideoUrl('37', 't'), example: 'Tea', phonetic: '/tiː/', instruction: 'Place your tongue tip behind upper teeth and release air sharply.' },
     { id: '38', symbol: 'ʃ', videoUrl: getIpaVideoUrl('38', 'ʃ'), example: 'She', phonetic: '/ʃiː/', instruction: 'Round your lips slightly and blow air through your teeth like "shh".' },
     { id: '39', symbol: 'tʃ', videoUrl: getIpaVideoUrl('39', 'tʃ'), example: 'Check', phonetic: '/tʃek/', instruction: 'Start with "t" and slide into a sharp "sh" sound immediately.' },
     { id: '40', symbol: 'v', videoUrl: getIpaVideoUrl('40', 'v'), example: 'Very', phonetic: '/ˈveri/', instruction: 'Place upper teeth on lower lip and vibrate your vocal cords.' },
     { id: '41', symbol: 'w', videoUrl: getIpaVideoUrl('41', 'w'), example: 'Wet', phonetic: '/wet/', instruction: 'Round your lips into a small circle and push them forward quickly.' },
     { id: '42', symbol: 'z', videoUrl: getIpaVideoUrl('42', 'z'), example: 'Zoo', phonetic: '/zuː/', instruction: 'Place your tongue tip near upper teeth and vibrate your vocal cords.' },
     { id: '43', symbol: 'ʒ', videoUrl: getIpaVideoUrl('43', 'ʒ'), example: 'Vision', phonetic: '/ˈvɪʒn/', instruction: 'Round your lips and vibrate your vocal cords while blowing air out.' },
     { id: '44', symbol: 'θ', videoUrl: getIpaVideoUrl('44', 'θ'), example: 'Thin', phonetic: '/θɪn/', instruction: 'Place your tongue tip between your teeth and blow air without vibrating.' },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'IpaPractice'>;
type IpaPracticeRouteProp = RouteProp<RootStackParamList, 'IpaPractice'>;

const IpaPracticeItem = React.memo(({
     item,
     index,
     currentIndex,
     viewMode,
     results,
     onAnalyze
}: {
     item: IpaItem,
     index: number,
     currentIndex: number,
     viewMode: 'list' | 'practice',
     results: Record<string, any>,
     onAnalyze: (uri: string) => void
}) => {
     const [isVideoLoading, setIsVideoLoading] = useState(false);
     const [status, setStatus] = useState<any>({});
     const videoRef = useRef<Video>(null);
     const isVisible = index === currentIndex && viewMode === 'practice';
     const result = results[item.id];
     const [hasAutoPlayed, setHasAutoPlayed] = useState(false);

     useEffect(() => {
          if (isVisible && !hasAutoPlayed) {
               // Auto play once when it becomes the active slide
               if (videoRef.current) {
                    videoRef.current.playFromPositionAsync(0);
                    setHasAutoPlayed(true);
               }
          } else if (!isVisible && hasAutoPlayed) {
               // Reset auto-play flag when moving away so it can auto-play again if we return
               setHasAutoPlayed(false);
               if (videoRef.current) {
                    videoRef.current.pauseAsync();
               }
          }
     }, [isVisible]);

     const togglePlayPause = async () => {
          if (!videoRef.current) return;
          if (status.isPlaying) {
               await videoRef.current.pauseAsync();
          } else {
               // If at the end, replay from start
               if (status.didJustFinish || (status.positionMillis > 0 && status.positionMillis === status.durationMillis)) {
                    await videoRef.current.playFromPositionAsync(0);
               } else {
                    await videoRef.current.playAsync();
               }
          }
     };

     const handleReplay = () => {
          if (videoRef.current) {
               videoRef.current.playFromPositionAsync(0);
          }
     };

     const toggleMute = () => {
          if (videoRef.current) {
               videoRef.current.setIsMutedAsync(!status.isMuted);
          }
     };

     return (
          <ScrollView
               style={styles.practiceItemScroll}
               contentContainerStyle={styles.practiceItemContent}
               showsVerticalScrollIndicator={false}
          >
               <View style={styles.videoWrapper}>
                    {isVisible && (
                         <>
                              <Video
                                   ref={videoRef}
                                   source={{ uri: item.videoUrl }}
                                   style={styles.video}
                                   resizeMode={ResizeMode.COVER}
                                   shouldPlay={false}
                                   isLooping={false}
                                   useNativeControls={false}
                                   volume={1.0}
                                   onPlaybackStatusUpdate={status => setStatus(status)}
                                   onLoadStart={() => setIsVideoLoading(true)}
                                   onLoad={() => setIsVideoLoading(false)}
                                   onError={(e) => {
                                        console.error('Video error:', e);
                                        setIsVideoLoading(false);
                                   }}
                              />
                              {isVideoLoading && (
                                   <View style={styles.loadingOverlay}>
                                        <ActivityIndicator color={colors.white} />
                                   </View>
                              )}
                         </>
                    )}
                    {!isVisible && <View style={styles.videoPlaceholder} />}
               </View>

               {/* Custom Video Controls Bar */}
               <View style={styles.videoControlsBar}>
                    <TouchableOpacity style={styles.videoControlBtn} onPress={togglePlayPause}>
                         <Ionicons
                              name={status.isPlaying ? "pause" : "play"}
                              size={24}
                              color={colors.primary}
                         />
                         <Text style={styles.videoControlText}>
                              {status.isPlaying ? "Pause" : status.didJustFinish ? "Replay" : "Play"}
                         </Text>
                    </TouchableOpacity>

                    <View style={styles.controlDivider} />

                    <TouchableOpacity style={styles.videoControlBtn} onPress={handleReplay}>
                         <Ionicons name="refresh" size={20} color={colors.textSecondary} />
                         <Text style={styles.videoControlTextSmall}>Reset</Text>
                    </TouchableOpacity>

                    <View style={styles.controlDivider} />

                    <TouchableOpacity style={styles.videoControlBtn} onPress={toggleMute}>
                         <Ionicons
                              name={status.isMuted ? "volume-mute" : "volume-high"}
                              size={20}
                              color={colors.textSecondary}
                         />
                         <Text style={styles.videoControlTextSmall}>
                              {status.isMuted ? "Unmute" : "Mute"}
                         </Text>
                    </TouchableOpacity>
               </View>

               {/* English Pronunciation Tip */}
               <View style={styles.tipContainer}>
                    <Ionicons name="bulb-outline" size={16} color={colors.primary} />
                    <Text style={styles.tipText}>
                         {item.instruction}
                    </Text>
               </View>

               <View style={styles.recordInstructionSection}>
                    <Text style={styles.instructionTitle}>Pronounce this word:</Text>
                    <Text style={styles.instructionWord}>{item.example}</Text>
                    <Text style={styles.instructionPhonetic}>{item.phonetic}</Text>
               </View>

               {result && (
                    <View style={styles.practiceResultContainer}>
                         <Text style={styles.analysisTitle}>Detailed Analysis</Text>
                         <PronunciationDetailView
                              recognizedText={result.recognizedText}
                              accuracyScore={result.accuracyScore}
                              fluencyScore={result.fluencyScore}
                              completenessScore={result.completenessScore}
                              pronScore={result.pronScore}
                              words={result.words}
                              compact={true}
                         />
                    </View>
               )}

               <View style={{ height: 120 }} />
          </ScrollView>
     );
});

export const IpaPracticeScreen: React.FC = () => {
     const navigation = useNavigation<NavigationProp>();
     const route = useRoute<IpaPracticeRouteProp>();
     const [viewMode, setViewMode] = useState<'list' | 'practice'>('list');
     const [currentIndex, setCurrentIndex] = useState(0);
     const [isRecording, setIsRecording] = useState(false);
     const [isProcessing, setIsProcessing] = useState(false);
     const [results, setResults] = useState<Record<string, any>>({});
     const [isMuted, setIsMuted] = useState(false);
     const [isVideoLoading, setIsVideoLoading] = useState(false);

     const audioRecorder = useRef<Audio.Recording | null>(null);
     const flatListRef = useRef<FlatList>(null);
     const pulseAnim = useRef(new Animated.Value(1)).current;

     useEffect(() => {
          setupAudio();
          loadResults();

          if (route.params?.initialPhoneme) {
               const index = IPA_DATA.findIndex(item => item.symbol === route.params.initialPhoneme);
               if (index !== -1) {
                    setCurrentIndex(index);
                    setViewMode('practice');
               }
          }
     }, [route.params?.initialPhoneme]);

     const loadResults = async () => {
          const savedResults = await StorageService.getIpaResults();
          setResults(savedResults);
     };

     const setupAudio = async () => {
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
               console.error('Audio setup error:', e);
          }
     };

     const startPulse = useCallback(() => {
          Animated.loop(
               Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
               ])
          ).start();
     }, [pulseAnim]);

     const stopPulse = useCallback(() => {
          pulseAnim.stopAnimation();
          pulseAnim.setValue(1);
     }, [pulseAnim]);

     const startRecording = async () => {
          try {
               const { status } = await Audio.requestPermissionsAsync();
               if (status !== 'granted') {
                    Alert.alert('Permission denied', 'Microphone access is required for practice.');
                    return;
               }

               await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
               });

               const recording = new Audio.Recording();
               await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
               await recording.startAsync();
               audioRecorder.current = recording;
               setIsRecording(true);
               startPulse();
          } catch (e) {
               console.error('Start recording error:', e);
          }
     };

     const stopRecording = async () => {
          if (!audioRecorder.current) return;
          setIsRecording(false);
          stopPulse();

          try {
               await audioRecorder.current.stopAndUnloadAsync();
               const uri = audioRecorder.current.getURI();
               audioRecorder.current = null;

               if (uri) {
                    analyzePronunciation(uri);
               }
          } catch (e) {
               console.error('Stop recording error:', e);
          } finally {
               Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
               });
          }
     };

     const analyzePronunciation = async (uri: string) => {
          setIsProcessing(true);
          try {
               const currentItem = IPA_DATA[currentIndex];
               const base64Audio = await FileSystem.readAsStringAsync(uri, {
                    encoding: 'base64',
               });

               const response = await AiService.checkPronunciationAccuracy(
                    currentItem.example,
                    `data:audio/wav;base64,${base64Audio.trim()}`
               );

               if (response && response.data) {
                    const newResult = response.data;
                    setResults(prev => ({
                         ...prev,
                         [currentItem.id]: newResult
                    }));
                    // Persist result
                    await StorageService.saveIpaResult(currentItem.id, newResult);
               }
          } catch (e) {
               console.error('Analysis error:', e);
               Alert.alert('Analysis Failed', 'Could not analyze pronunciation. Please try again.');
          } finally {
               setIsProcessing(false);
          }
     };

     const selectIpa = (index: number) => {
          setCurrentIndex(index);
          setViewMode('practice');
     };

     const renderPracticeItem = ({ item, index }: { item: IpaItem, index: number }) => {
          return (
               <IpaPracticeItem
                    item={item}
                    index={index}
                    currentIndex={currentIndex}
                    viewMode={viewMode}
                    results={results}
                    onAnalyze={analyzePronunciation}
               />
          );
     };

     const onScroll = (event: any) => {
          const slideSize = event.nativeEvent.layoutMeasurement.width;
          const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
          if (index !== currentIndex) {
               setCurrentIndex(index);
          }
     };

     if (viewMode === 'list') {
          return (
               <View style={styles.container}>
                    <LinearGradient
                         colors={['#F5F3FF', '#FFFFFF']}
                         style={styles.gradientBg}
                    >
                         <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                              <View style={styles.header}>
                                   <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                                        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                                   </TouchableOpacity>
                                   <View style={styles.headerTextContainer}>
                                        <Text style={styles.headerTitle}>IPA Master</Text>
                                        <Text style={styles.headerSubtitle}>44 phonemes to practice</Text>
                                   </View>
                                   <View style={styles.headerIconContainer}>
                                        {/* Placeholder for balance */}
                                        <View style={{ width: 40 }} />
                                   </View>
                              </View>

                              <ScrollView
                                   contentContainerStyle={styles.listScrollContent}
                                   showsVerticalScrollIndicator={false}
                              >
                                   <View style={styles.statsRow}>
                                        <View style={[styles.statBox, { backgroundColor: '#EEF2FF', borderLeftWidth: 4, borderLeftColor: '#6366F1' }]}>
                                             <Text style={[styles.statValue, { color: '#312E81' }]}>{IPA_DATA.length}</Text>
                                             <Text style={styles.statLabel}>Total</Text>
                                        </View>
                                        <View style={[styles.statBox, { backgroundColor: '#ECFDF5', borderLeftWidth: 4, borderLeftColor: '#10B981' }]}>
                                             <Text style={[styles.statValue, { color: '#064E3B' }]}>{Object.keys(results).length}</Text>
                                             <Text style={styles.statLabel}>Practiced</Text>
                                        </View>
                                        <View style={[styles.statBox, { backgroundColor: '#FFFBEB', borderLeftWidth: 4, borderLeftColor: '#F59E0B' }]}>
                                             <Text style={[styles.statValue, { color: '#78350F' }]}>
                                                  {Object.keys(results).length > 0 ?
                                                       Math.round(Object.values(results).reduce((acc, curr) => acc + curr.pronScore, 0) / Object.keys(results).length)
                                                       : 0}%
                                             </Text>
                                             <Text style={styles.statLabel}>Avg Score</Text>
                                        </View>
                                   </View>

                                   <View style={styles.gridContainer}>
                                        {IPA_DATA.map((item, index) => {
                                             const result = results[item.id];
                                             return (
                                                  <TouchableOpacity
                                                       key={item.id}
                                                       style={[styles.ipaGridItem, shadows.claySoft]}
                                                       onPress={() => selectIpa(index)}
                                                  >
                                                       <Text style={styles.ipaGridSymbol}>{item.symbol}</Text>
                                                       <Text style={styles.ipaGridExample} numberOfLines={1}>{item.example}</Text>
                                                       {result && (
                                                            <View style={[
                                                                 styles.miniScoreBadge,
                                                                 { backgroundColor: result.pronScore >= 80 ? '#22C55E' : result.pronScore >= 50 ? '#EAB308' : '#EF4444' }
                                                            ]} />
                                                       )}
                                                  </TouchableOpacity>
                                             );
                                        })}
                                   </View>
                              </ScrollView>
                         </SafeAreaView>
                    </LinearGradient>
               </View>
          );
     }

     return (
          <SafeAreaView style={styles.container} edges={['top']}>
               <View style={styles.header}>
                    <TouchableOpacity onPress={() => setViewMode('list')} style={styles.backButton}>
                         <Ionicons name="grid-outline" size={22} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                         <Text style={styles.headerTitle}>{IPA_DATA[currentIndex].symbol}</Text>
                    </View>
                    <View style={styles.progressBadge}>
                         <Text style={styles.progressText}>{currentIndex + 1}/{IPA_DATA.length}</Text>
                    </View>
               </View>

               <FlatList
                    ref={flatListRef}
                    style={styles.practiceFlatList}
                    data={IPA_DATA}
                    renderItem={renderPracticeItem}
                    keyExtractor={(item) => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    initialScrollIndex={currentIndex}
                    getItemLayout={(_, index) => ({
                         length: SCREEN_WIDTH,
                         offset: SCREEN_WIDTH * index,
                         index,
                    })}
               />

               <View style={styles.footer}>
                    <View style={styles.micContainer}>
                         <Animated.View style={[
                              styles.micPulse,
                              { transform: [{ scale: pulseAnim }], opacity: isRecording ? 0.3 : 0 }
                         ]} />
                         <TouchableOpacity
                              onPressIn={startRecording}
                              onPressOut={stopRecording}
                              disabled={isProcessing}
                              style={[
                                   styles.micBtn,
                                   isRecording ? styles.micBtnActive : styles.micBtnInactive,
                                   isProcessing && { opacity: 0.5 },
                                   shadows.clayStrong
                              ]}
                         >
                              {isProcessing ? (
                                   <ActivityIndicator color={colors.white} />
                              ) : (
                                   <Ionicons name={isRecording ? "stop" : "mic"} size={32} color={colors.white} />
                              )}
                         </TouchableOpacity>
                         <Text style={styles.micHint}>
                              {isRecording ? "Recording..." : isProcessing ? "Analyzing..." : "Hold to Record Pronunciation"}
                         </Text>
                    </View>
               </View>
          </SafeAreaView>
     );
};

const styles = StyleSheet.create({
     container: {
          flex: 1,
          backgroundColor: '#F8F9FE',
     },
     gradientBg: {
          flex: 1,
     },
     header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          backgroundColor: 'transparent',
     },
     backButton: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.subtle,
     },
     headerTextContainer: {
          flex: 1,
          marginLeft: 12,
     },
     headerTitle: {
          fontSize: 26,
          fontWeight: '900',
          color: colors.primaryDark,
          flex: 1,
          textAlign: 'center',
     },
     headerSubtitle: {
          fontSize: 13,
          color: colors.textSecondary,
          fontWeight: '600',
     },
     headerIconContainer: {
          marginLeft: 'auto',
     },
     headerIconCircle: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
     },
     listScrollContent: {
          paddingHorizontal: 20,
          paddingBottom: 40,
     },
     statsRow: {
          flexDirection: 'row',
          gap: 12,
          marginBottom: 24,
          marginTop: 8,
     },
     statBox: {
          flex: 1,
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 12,
          alignItems: 'center',
          ...shadows.subtle,
     },
     statValue: {
          fontSize: 18,
          fontWeight: '800',
          color: colors.textPrimary,
     },
     statLabel: {
          fontSize: 10,
          color: colors.textSecondary,
          fontWeight: '700',
          textTransform: 'uppercase',
          marginTop: 2,
     },
     gridContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
          paddingBottom: 20,
     },
     ipaGridItem: {
          width: (SCREEN_WIDTH - 70) / 4,
          aspectRatio: 0.85, // Slightly taller to fit example word
          backgroundColor: 'white',
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          paddingVertical: 10,
          paddingHorizontal: 4,
     },
     ipaGridSymbol: {
          fontSize: 20,
          fontWeight: '900',
          color: '#000000',
          marginBottom: 2,
     },
     ipaGridExample: {
          fontSize: 10,
          fontWeight: '600',
          color: '#000000',
          textAlign: 'center',
     },
     miniScoreBadge: {
          position: 'absolute',
          top: 6,
          right: 6,
          width: 8,
          height: 8,
          borderRadius: 4,
     },

     // Practice Mode styles
     headerTitleSmall: {
          fontSize: 18,
          fontWeight: '800',
          color: colors.textPrimary,
          flex: 1,
          textAlign: 'center',
     },
     progressBadge: {
          backgroundColor: 'rgba(124, 58, 237, 0.1)',
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12,
     },
     progressText: {
          fontSize: 12,
          fontWeight: '700',
          color: colors.primary,
     },
     practicePage: {
          width: SCREEN_WIDTH,
          paddingHorizontal: 20,
          paddingTop: 10,
     },
     practiceItemScroll: {
          width: SCREEN_WIDTH,
          flex: 1,
     },
     practiceItemContent: {
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 40,
     },
     practiceFlatList: {
          flex: 1,
     },
     loadingOverlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0,0,0,0.3)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
     },
     videoWrapper: {
          width: '100%',
          aspectRatio: 16 / 9,
          marginBottom: 24,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
     },
     video: {
          width: '100%',
          height: '100%',
     },
     videoPlaceholder: {
          width: '100%',
          aspectRatio: 16 / 9,
          backgroundColor: '#F1F5F9',
     },
     recordInstructionSection: {
          paddingVertical: 20,
          alignItems: 'center',
          marginBottom: 16,
     },
     instructionTitle: {
          fontSize: 12,
          color: colors.textSecondary,
          fontWeight: '700',
          textTransform: 'uppercase',
          marginBottom: 8,
          letterSpacing: 1,
     },
     instructionWord: {
          fontSize: 32,
          fontWeight: '900',
          color: '#000000',
     },
     instructionPhonetic: {
          fontSize: 18,
          color: colors.textSecondary,
          fontStyle: 'italic',
          marginTop: 4,
     },
     // Video Controls Styles
     videoControlsBar: {
          flexDirection: 'row',
          backgroundColor: 'white',
          borderRadius: 20,
          marginHorizontal: 4,
          marginBottom: 24,
          paddingVertical: 10,
          paddingHorizontal: 16,
          alignItems: 'center',
          justifyContent: 'space-around',
          ...shadows.subtle,
     },
     videoControlBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 12,
          paddingVertical: 4,
     },
     videoControlText: {
          fontSize: 14,
          fontWeight: '800',
          color: colors.primary,
          width: 60,
     },
     videoControlTextSmall: {
          fontSize: 12,
          fontWeight: '600',
          color: colors.textSecondary,
     },
     controlDivider: {
          width: 1,
          height: 20,
          backgroundColor: '#F1F5F9',
     },
     tipContainer: {
          flexDirection: 'row',
          backgroundColor: 'rgba(124, 58, 237, 0.05)',
          padding: 12,
          borderRadius: 16,
          marginHorizontal: 4,
          marginBottom: 16,
          alignItems: 'center',
          gap: 10,
          borderWidth: 1,
          borderColor: 'rgba(124, 58, 237, 0.1)',
     },
     tipText: {
          flex: 1,
          fontSize: 12,
          color: colors.primaryDark,
          lineHeight: 18,
          fontWeight: '500',
     },
     analysisTitle: {
          fontSize: 16,
          fontWeight: '800',
          color: colors.textPrimary,
          marginBottom: 16,
          paddingHorizontal: 4,
     },
     practiceResultContainer: {
          width: '100%',
          backgroundColor: 'white',
          borderRadius: 24,
          paddingVertical: 20,
          paddingHorizontal: 0, // Remove horizontal padding for child analysis view to take full width
          ...shadows.subtle,
     },
     footer: {
          paddingBottom: 40,
          paddingHorizontal: 24,
          alignItems: 'center',
     },
     micContainer: {
          alignItems: 'center',
          width: '100%',
     },
     micBtn: {
          width: 72,
          height: 72,
          borderRadius: 36,
          alignItems: 'center',
          justifyContent: 'center',
     },
     micBtnActive: {
          backgroundColor: colors.error,
     },
     micBtnInactive: {
          backgroundColor: colors.primary,
     },
     micPulse: {
          position: 'absolute',
          width: 90,
          height: 90,
          borderRadius: 45,
          backgroundColor: colors.primary,
          zIndex: -1,
     },
     micHint: {
          marginTop: 12,
          fontSize: 14,
          color: colors.textSecondary,
          fontWeight: '600',
     },
});
