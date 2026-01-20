// Practice Screen - Optimized Performance & Styling
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Animated,
  Easing,
  Dimensions,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Audio, AVPlaybackStatus, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

import { theme, colors, typography, spacing, borderRadius, shadows } from '../theme';
import { gradients } from '../theme/styles';
import { Word, RootStackParamList } from '../types';
import { StorageService } from '../services/StorageService';
import { SpeakButton, ImageViewerModal } from '../components';
import { EventBus } from '../services/EventBus';
import { AiService } from '../services/AiService';
import { PronunciationDetailView } from '../components/PronunciationDetailView';
import {
  ANIMATION,
  PRACTICE_CONFIG,
  PRACTICE_TEXTS,
  TIME_FORMAT,
  DEFAULTS,
  MESSAGES
} from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface PracticeScreenProps {
  onQuizStateChange?: (isVisible: boolean) => void;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({ onQuizStateChange }) => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  // -- Setup State --
  const [questionCount, setQuestionCount] = useState<number>(PRACTICE_CONFIG.defaultQuestionCount);
  const [loading, setLoading] = useState(false);
  const [practiceStats, setPracticeStats] = useState<{
    totalSessions: number;
    currentStreak: number;
    longestStreak: number;
    totalWordsPracticed: number;
    totalSentencesPracticed: number;
    lastPracticeTime: number | null;
    lastSentencePracticeTime: number | null;
  } | null>(null);

  // -- Quiz Session --
  const [isQuizVisible, setIsQuizVisible] = useState(false);
  const [quizList, setQuizList] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [meaningIndex, setMeaningIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [inputMode, setInputMode] = useState<'TYPE' | 'SPEAK'>('TYPE');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);

  // -- Quiz Results Tracking --
  const [quizResults, setQuizResults] = useState<Array<{
    word: Word;
    status: 'correct' | 'incorrect' | 'skipped';
    userAnswer?: string;
    inputMethod?: 'text' | 'audio' | 'both' | 'skipped';
    audioAccuracy?: number;
    pronunciationData?: any;
  }>>([]);
  const [showReview, setShowReview] = useState(false);

  // -- Voice Interaction --
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const popupAnim = useRef(new Animated.Value(-150)).current; // Start off-screen (top)
  const audioRecorder = useRef<Audio.Recording | null>(null);
  const [pronunciationResult, setPronunciationResult] = useState<{
    recognizedText: string;
    accuracyScore: number;
    fluencyScore: number;
    completenessScore: number;
    pronScore: number;
    words: Array<{
      word: string;
      accuracyScore: number;
      errorType: string;
      syllables: Array<{
        syllable: string;
        accuracyScore: number;
        phonemes: Array<{
          phoneme: string;
          accuracyScore: number;
        }> | null;
      }>;
    }>;
  } | null>(null);

  // Detail modal state
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // -- Sound Effects --
  const successSound = useRef<Audio.Sound | null>(null);
  const errorSound = useRef<Audio.Sound | null>(null);

  // -- ScrollView Ref for auto-scroll --
  const quizScrollRef = useRef<ScrollView>(null);


  // -- Image Viewer --
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  // -- User Audio Playback --
  const [userAudioUri, setUserAudioUri] = useState<string | null>(null);
  const [playingUserAudio, setPlayingUserAudio] = useState(false);
  const userAudioSound = useRef<Audio.Sound | null>(null);

  // -- Load Practice Stats --
  useEffect(() => {
    const loadStats = async () => {
      const stats = await StorageService.getPracticeStats();
      setPracticeStats(stats);
    };
    loadStats();
  }, [isQuizVisible]);

  // -- Toggle TabBar visibility based on quiz state --
  useEffect(() => {
    if (onQuizStateChange) {
      onQuizStateChange(isQuizVisible);
    }
  }, [isQuizVisible, onQuizStateChange]);

  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // -- Load Sound Effects --
  useEffect(() => {
    const loadSounds = async () => {
      try {
        // Load success sound (high pitch beep)
        const { sound: success } = await Audio.Sound.createAsync(
          { uri: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3' },
          { shouldPlay: false, volume: 1.0 }
        );
        successSound.current = success;

        // Load error sound (low buzz)
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
      // Cleanup sounds on unmount
      successSound.current?.unloadAsync();
      errorSound.current?.unloadAsync();

      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
      if (audioRecorder.current) {
        audioRecorder.current.stopAndUnloadAsync().catch(() => { });
        audioRecorder.current = null;
      }
      if (userAudioSound.current) {
        userAudioSound.current.unloadAsync().catch(() => { });
      }
    };
  }, []);


  // -- Listen for event to start practice with specific words --
  useEffect(() => {
    const handleStartPractice = async ({ words }: { words: Word[] }) => {
      if (words && words.length > 0) {
        setQuizList(words);
        setQuestionCount(words.length);
        setCurrentIndex(0);
        setScore(0);
        resetQuestion();
        setIsQuizVisible(true);
        await StorageService.saveLastPracticeTime();
      }
    };

    EventBus.on('startPracticeWithWords', handleStartPractice);
    return () => {
      EventBus.off('startPracticeWithWords', handleStartPractice);
    };
  }, []);

  // -- Animations --
  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: ANIMATION.pulse, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: ANIMATION.pulse, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, [pulseAnim]);

  const startPractice = useCallback(async () => {
    setLoading(true);
    try {
      const words = await StorageService.getLeastViewedWords(questionCount);
      if (words.length === 0) {
        Alert.alert(PRACTICE_TEXTS.noWordsYet, PRACTICE_TEXTS.addWordsFirst);
        return;
      }
      setQuizList(words);
      setCurrentIndex(0);
      setScore(0);
      setQuizResults([]);
      resetQuestion();
      setIsQuizVisible(true);
      await StorageService.saveLastPracticeTime();
    } finally {
      setLoading(false);
    }
  }, [questionCount]);

  const startPronunciationPractice = useCallback(async () => {
    setLoading(true);
    try {
      // Check if we have sentences
      const sentences = await StorageService.getSentences();
      if (sentences.length === 0) {
        Alert.alert('No Sentences', 'Add some sentences to your collection first!');
        return;
      }

      // Navigate to SentencePractice screen with limit
      navigation.navigate('SentencePractice', { sentencesLimit: questionCount });
    } finally {
      setLoading(false);
    }
  }, [questionCount, navigation]);

  const resetQuestion = useCallback(() => {
    setUserAnswer('');
    setIsAnswered(false);
    setIsCorrect(false);
    setShowHint(false);
    setIsRecording(false);
    setIsProcessing(false);
    setPronunciationResult(null);
    setMeaningIndex(0);
    setUserAudioUri(null);
    setPlayingUserAudio(false);
    stopPulse();
    // Hide popup immediately on reset
    popupAnim.setValue(-150);

    if (userAudioSound.current) {
      userAudioSound.current.unloadAsync().catch(() => { });
      userAudioSound.current = null;
    }

    if (audioRecorder.current) {
      audioRecorder.current.stopAndUnloadAsync().catch(() => { });
      audioRecorder.current = null;
    }
  }, [stopPulse, popupAnim]);

  // -- Play Sound Effect --
  const playSound = useCallback(async (isCorrect: boolean) => {
    try {
      const sound = isCorrect ? successSound.current : errorSound.current;
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.log('Failed to play sound:', error);
    }
  }, []);

  // -- Get Feedback Data Based on Score --
  const getFeedbackData = useCallback((score: number, isPronunciation: boolean = false) => {
    if (isPronunciation) {
      if (score >= 80) {
        return {
          emoji: '🎉',
          title: 'Excellent!',
          message: 'Your pronunciation is amazing!',
          color: colors.success,
          bgColor: '#D1FAE5',
        };
      } else if (score >= 50) {
        return {
          emoji: '👍',
          title: 'Good job!',
          message: 'Pretty good, keep practicing!',
          color: '#F59E0B',
          bgColor: '#FEF3C7',
        };
      } else {
        return {
          emoji: '💪',
          title: 'Keep trying!',
          message: 'Give it another shot!',
          color: colors.error,
          bgColor: '#FEE2E2',
        };
      }
    } else {
      // For text input
      return score > 0 ? {
        emoji: '✅',
        title: 'Correct!',
        message: 'You got it right!',
        color: colors.success,
        bgColor: '#D1FAE5',
      } : {
        emoji: '❌',
        title: 'Incorrect',
        message: 'Don\'t worry, check the answer and try again!',
        color: colors.error,
        bgColor: '#FEE2E2',
      };
    }
  }, []);

  // -- Scroll to Bottom (for showing results) --
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      quizScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const checkAnswer = useCallback(async (customAnswer?: string) => {
    const answerToUse = customAnswer !== undefined ? customAnswer : userAnswer;
    const currentWord = quizList[currentIndex];
    const normalizedInput = answerToUse.toLowerCase().trim();
    const normalizedTarget = currentWord.word.toLowerCase().trim();
    const isSkipped = customAnswer === '?';

    let finalCorrect = false;

    // If we have a recording, process it through AI first
    if (userAudioUri && !isSkipped) {
      setIsProcessing(true);
      try {
        const fileInfo = await FileSystem.getInfoAsync(userAudioUri);
        if (!('exists' in fileInfo) || !fileInfo.exists) {
          throw new Error('Recording file does not exist');
        }

        const base64Audio = await FileSystem.readAsStringAsync(userAudioUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const result = await AiService.checkPronunciationAccuracy(
          currentWord.word,
          `data:audio/wav;base64,${base64Audio.trim()}`
        );

        // Validate new API format
        if (!result.data.pronScore || !result.data.words) {
          throw new Error('Invalid API response format');
        }

        const audioAnalysis = {
          recognizedText: result.data.recognizedText,
          accuracyScore: result.data.accuracyScore,
          fluencyScore: result.data.fluencyScore,
          completenessScore: result.data.completenessScore,
          pronScore: result.data.pronScore,
          words: result.data.words.map(w => ({
            word: w.word,
            accuracyScore: w.accuracyScore,
            errorType: w.errorType,
            syllables: w.syllables.map(s => ({
              syllable: s.syllable,
              accuracyScore: s.accuracyScore,
              phonemes: s.phonemes || null
            }))
          }))
        };

        setPronunciationResult(audioAnalysis);

        const audioCorrect = result.data.pronScore >= 85;

        // If user typed something, we check both. 
        // If they ONLY spoke, we only check audio and fill in the transcribed text.
        if (normalizedInput.length > 0) {
          const textCorrect = normalizedInput === normalizedTarget;
          finalCorrect = audioCorrect && textCorrect;
        } else {
          finalCorrect = audioCorrect;
          // Set the transcribed text so user can see what the AI heard
          setUserAnswer(result.data.recognizedText || '');
        }

      } catch (error: any) {
        console.error('Audio processing error:', error);
        Alert.alert('Processing Error', error.message || 'Failed to analyze pronunciation');
        setIsProcessing(false);
        return;
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Just text check (or skipped)
      finalCorrect = isSkipped ? false : (normalizedInput === normalizedTarget);
    }

    setIsCorrect(finalCorrect);
    if (finalCorrect) setScore(s => s + 1);

    setIsAnswered(true);
    setShowHint(true);

    // Play sound effect
    playSound(finalCorrect && !isSkipped);

    // Scroll to bottom to show results
    scrollToBottom();

    // Animate popup feedback (slide down from top, hold 5s, then slide up)
    popupAnim.setValue(-150); // Reset start position
    Animated.sequence([
      Animated.spring(popupAnim, {
        toValue: 20, // Final visible offset
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.delay(5000), // Wait 5 seconds
      Animated.timing(popupAnim, {
        toValue: -150, // Hide again
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();

    setQuizResults(prev => [...prev, {
      word: currentWord,
      status: isSkipped ? 'skipped' : (finalCorrect ? 'correct' : 'incorrect'),
      userAnswer: isSkipped ? undefined : (normalizedInput || userAnswer),
      inputMethod: isSkipped ? 'skipped' : (userAudioUri ? (normalizedInput.length > 0 ? 'both' : 'audio') : 'text'),
      audioAccuracy: pronunciationResult?.pronScore,
      pronunciationData: pronunciationResult,
    }]);

    StorageService.markAsReviewed(currentWord.id, finalCorrect);
  }, [userAnswer, userAudioUri, quizList, currentIndex, playSound, scrollToBottom, popupAnim, pronunciationResult]);

  const handleRetry = useCallback(() => {
    // If last entry in quizResults is for THIS word, remove it and adjust score
    const currentWord = quizList[currentIndex];
    setQuizResults(prev => {
      if (prev.length > 0) {
        const lastEntry = prev[prev.length - 1];
        if (lastEntry.word.id === currentWord.id) {
          if (lastEntry.status === 'correct') {
            setScore(s => Math.max(0, s - 1));
          }
          return prev.slice(0, -1);
        }
      }
      return prev;
    });
    resetQuestion();
  }, [currentIndex, quizList, resetQuestion]);

  const handlePlayUserAudio = useCallback(async () => {
    if (!userAudioUri) return;
    try {
      if (userAudioSound.current) {
        await userAudioSound.current.unloadAsync();
      }
      setPlayingUserAudio(true);
      const { sound } = await Audio.Sound.createAsync(
        { uri: userAudioUri },
        { shouldPlay: true, volume: 1.0 }
      );
      userAudioSound.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingUserAudio(false);
          sound.unloadAsync();
          userAudioSound.current = null;
        }
      });
    } catch (error) {
      console.error('Error playing user audio:', error);
      setPlayingUserAudio(false);
    }
  }, [userAudioUri]);


  const handleMicPress = useCallback(async () => {
    if (isRecording) {
      setIsRecording(false);
      stopPulse();

      try {
        if (!audioRecorder.current) {
          throw new Error('No active recording');
        }


        const status = await audioRecorder.current.getStatusAsync();
        await audioRecorder.current.stopAndUnloadAsync();
        const uri = audioRecorder.current.getURI();

        if (!uri) {
          throw new Error('No recording URI - recording may have failed');
        }

        if (status.durationMillis) {
          // check logic removed - relies on auto-stop now
        }

        setUserAudioUri(uri);
      } catch (error: any) {
        console.error('Recording stop error:', error);
        Alert.alert('Recording Error', error.message || 'Failed to stop recording');
      } finally {
        audioRecorder.current = null;
        // Reset audio mode after recording to ensure playback uses speaker at full volume on iOS
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
      setUserAudioUri(null); // Clear previous recording when starting new
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Microphone permission not granted');
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
            extension: '.wav',
            outputFormat: Audio.AndroidOutputFormat.THREE_GPP,
            audioEncoder: Audio.AndroidAudioEncoder.AMR_WB,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          ios: {
            extension: '.wav',
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/wav',
            bitsPerSecond: 128000,
          },
        };

        await audioRecorder.current.prepareToRecordAsync(recordingOptions);
        await audioRecorder.current.startAsync();

        // START AUTO-STOP TIMER
        const currentWord = quizList[currentIndex];
        const wordCount = currentWord.word.split(' ').length;
        const maxDurationMs = (wordCount * 1500) + 3000;

        recordingTimerRef.current = setTimeout(async () => {
          if (audioRecorder.current) {
            try {
              stopPulse();
              setIsRecording(false);
              await audioRecorder.current.stopAndUnloadAsync();
              const uri = audioRecorder.current.getURI();
              audioRecorder.current = null;

              // Delete the file since it's invalid (too long)
              if (uri) {
                await FileSystem.deleteAsync(uri, { idempotent: true });
              }

              Alert.alert('Recording Canceled', 'Time limit exceeded.');
            } catch (err) {
              console.log('Auto-stop error:', err);
            }
          }
        }, maxDurationMs);

        setUserAnswer('');
        setPronunciationResult(null);
        setIsRecording(true);
        startPulse();
      } catch (error: any) {
        console.error('Failed to start recording:', error);

        if (error.message?.includes('permission') || error.message?.includes('Permission')) {
          Alert.alert(
            MESSAGES.errors.permissionDenied,
            'We need microphone access to analyze your pronunciation.'
          );
        } else {
          Alert.alert('Start Recording Error', error.message || 'Failed to start recording');
        }
        setIsRecording(false);
        if (audioRecorder.current) {
          audioRecorder.current = null;
        }
      }
    }
  }, [isRecording, stopPulse, startPulse, quizList, currentIndex, checkAnswer, playSound]);

  const handleNext = useCallback(() => {
    if (currentIndex < quizList.length - 1) {
      setCurrentIndex(c => c + 1);
      resetQuestion();
    } else {
      setCurrentIndex(c => c + 1);
      setShowReview(true); // Go straight to review instead of intermediate summary
      StorageService.updatePracticeStats(quizList.length, 'word').then(() => {
        StorageService.getPracticeStats().then(setPracticeStats);
      });
    }
  }, [currentIndex, quizList.length, resetQuestion]);

  const formatTimeAgo = useCallback((timestamp: number | null): string => {
    if (!timestamp) return TIME_FORMAT.never;
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return TIME_FORMAT.justNow;
    if (minutes < 60) return TIME_FORMAT.minutesAgo.replace('{count}', String(minutes));
    if (hours < 24) return TIME_FORMAT.hoursAgo.replace('{count}', String(hours));
    return TIME_FORMAT.daysAgo.replace('{count}', String(days));
  }, []);

  const renderSetup = () => (
    <View style={{ flex: 1 }}>
      {/* Header with Back Button */}
      <View style={styles.setupHeader}>
        <View style={styles.headerTop}>
          <View style={styles.greetingContainer}>
            <Text style={styles.setupHeaderTitle}>
              Practice Time <Text style={styles.wavingEmoji}>🎯</Text>
            </Text>
            <Text style={styles.subGreeting}>Ready to level up your skills?</Text>
          </View>
        </View>
      </View>

      <View style={styles.centerContent}>
        <View style={styles.setupImageContainer}>
          <Image
            source={require('../../assets/practice.png')}
            style={styles.setupImage}
            resizeMode="contain"
          />
        </View>

        {practiceStats && (
          <View style={styles.statsContainer}>
            {(practiceStats.lastPracticeTime || practiceStats.lastSentencePracticeTime) && (
              <View style={styles.lastPracticeInfo}>
                <Text style={styles.lastPracticeText}>
                  {PRACTICE_TEXTS.lastPractice} {formatTimeAgo(Math.max(practiceStats.lastPracticeTime || 0, practiceStats.lastSentencePracticeTime || 0))}
                </Text>
                {practiceStats.longestStreak > 0 && practiceStats.longestStreak > practiceStats.currentStreak && (
                  <Text style={styles.bestStreakText}>
                    {PRACTICE_TEXTS.bestStreak} {practiceStats.longestStreak} days
                  </Text>
                )}
              </View>
            )}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>🔥</Text>
                <Text style={styles.statValue}>{practiceStats.currentStreak}</Text>
                <Text style={styles.statLabel}>{PRACTICE_TEXTS.dayStreak}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>📚</Text>
                <Text style={styles.statValue}>{practiceStats.totalWordsPracticed}</Text>
                <Text style={styles.statLabel}>Words</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>🎙️</Text>
                <Text style={styles.statValue}>{practiceStats.totalSentencesPracticed || 0}</Text>
                <Text style={styles.statLabel}>Pronun.</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.label}>How many items?</Text>
          <View style={styles.countRow}>
            {PRACTICE_CONFIG.questionCountOptions.map(num => (
              <TouchableOpacity
                key={num}
                style={[styles.countBtn, questionCount === num && styles.countBtnActive]}
                onPress={() => setQuestionCount(num)}
              >
                <Text style={[styles.countText, questionCount === num && styles.countTextActive]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.startButtonsRow}>
          <TouchableOpacity
            style={[styles.modeButton, { backgroundColor: colors.primary }]}
            onPress={startPractice}
            disabled={loading}
          >
            <Ionicons name="book" size={24} color={colors.white} />
            <Text style={styles.modeButtonText}>
              {loading ? '...' : 'Vocabulary'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, { backgroundColor: colors.secondary || '#7C3AED' }]}
            onPress={startPronunciationPractice}
            disabled={loading}
          >
            <Ionicons name="mic" size={24} color={colors.white} />
            <Text style={styles.modeButtonText}>
              {loading ? '...' : 'Pronunciation'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderReviewScreen = () => {
    const isFinished = currentIndex >= quizList.length;
    const finalScore = quizResults.filter(r => r.status === 'correct').length;
    const totalCount = quizList.length;
    const performanceRatio = totalCount > 0 ? finalScore / totalCount : 0;

    return (
      <View style={{ flex: 1 }}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => {
              setShowReview(false);
              if (isFinished) setIsQuizVisible(false);
            }}
            style={styles.closeBtn}
          >
            <Text style={styles.closeText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.progressText}>{PRACTICE_TEXTS.reviewResults}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.reviewContent} showsVerticalScrollIndicator={false}>

          <View style={styles.reviewHeaderRow}>
            <View style={styles.reviewTopSummary}>
              <Image
                source={performanceRatio > 0.8 ? require('../../assets/aplus.png') : require('../../assets/bad.png')}
                style={styles.reviewSummaryImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.reviewStatsColumn}>
              <View style={[styles.reviewStatRow, styles.reviewStatCorrect]}>
                <View style={styles.reviewStatInfo}>
                  <Text style={[styles.reviewStatIcon, { color: '#059669' }]}>✓</Text>
                  <Text style={styles.reviewStatLabelBold}>{PRACTICE_TEXTS.correct}</Text>
                </View>
                <Text style={[styles.reviewStatNumberBold, { color: '#059669' }]}>{finalScore}</Text>
              </View>

              <View style={[styles.reviewStatRow, styles.reviewStatIncorrect]}>
                <View style={styles.reviewStatInfo}>
                  <Text style={[styles.reviewStatIcon, { color: '#DC2626' }]}>✗</Text>
                  <Text style={styles.reviewStatLabelBold}>{PRACTICE_TEXTS.incorrect}</Text>
                </View>
                <Text style={[styles.reviewStatNumberBold, { color: '#DC2626' }]}>{quizResults.filter(r => r.status === 'incorrect').length}</Text>
              </View>

              <View style={[styles.reviewStatRow, styles.reviewStatSkipped]}>
                <View style={styles.reviewStatInfo}>
                  <Text style={[styles.reviewStatIcon, { color: '#4B5563' }]}>⏭</Text>
                  <Text style={styles.reviewStatLabelBold}>{PRACTICE_TEXTS.skipped}</Text>
                </View>
                <Text style={[styles.reviewStatNumberBold, { color: '#4B5563' }]}>{quizResults.filter(r => r.status === 'skipped').length}</Text>
              </View>
            </View>
          </View>

          <View style={styles.reviewList}>
            {quizResults.map((result, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.reviewItem,
                  result.status === 'correct' && styles.reviewItemCorrect,
                  result.status === 'incorrect' && styles.reviewItemIncorrect,
                ]}
                onPress={() => {
                  requestAnimationFrame(() => {
                    navigation.navigate('WordDetail', { wordId: result.word.id });
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={styles.reviewItemContent}>
                  <View style={styles.reviewItemRow}>
                    <Text style={styles.reviewItemLabel}>Correct:</Text>
                    <Text style={styles.reviewItemWord}>{result.word.word}</Text>
                  </View>

                  {result.status !== 'skipped' && (
                    <>
                      <View style={styles.reviewItemRow}>
                        <Text style={styles.reviewItemLabel}>Method:</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                          <Text style={styles.reviewItemMethodText}>
                            {result.inputMethod === 'both' ? '⌨️ + 🎙️' : (result.inputMethod === 'audio' ? '🎙️' : '⌨️')}
                            {result.inputMethod !== 'text' && result.audioAccuracy !== undefined && ` (${Math.round(result.audioAccuracy)}%)`}
                          </Text>
                          {result.inputMethod !== 'text' && result.pronunciationData && (
                            <TouchableOpacity
                              style={styles.detailButton}
                              onPress={() => {
                                setPronunciationResult(result.pronunciationData);
                                setDetailModalVisible(true);
                              }}
                            >
                              <Ionicons name="information-circle" size={20} color={colors.primary} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                      <View style={styles.reviewItemRow}>
                        <Text style={styles.reviewItemLabel}>You:</Text>
                        <Text style={[
                          styles.reviewItemUserAnswer,
                          result.status === 'correct' ? styles.answerCorrect : styles.answerIncorrect
                        ]}>
                          {result.userAnswer || '—'}
                        </Text>
                      </View>
                    </>
                  )}

                  {result.status === 'skipped' && (
                    <Text style={styles.reviewItemSkippedText}>Skipped</Text>
                  )}
                </View>

                <View style={[
                  styles.reviewItemIconContainer,
                  result.status === 'correct' && styles.iconContainerCorrect,
                  result.status === 'incorrect' && styles.iconContainerIncorrect,
                  result.status === 'skipped' && styles.iconContainerSkipped,
                ]}>
                  <Text style={styles.reviewItemIcon}>
                    {result.status === 'correct' ? '✓' : result.status === 'incorrect' ? '✗' : '⏭'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.reviewDoneButton}
            onPress={() => {
              setShowReview(false);
              setIsQuizVisible(false);
            }}
          >
            <Text style={styles.primaryButtonText}>{PRACTICE_TEXTS.done}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const renderQuizContent = () => {
    if (currentIndex >= quizList.length) {
      return null;
    }

    const currentWord = quizList[currentIndex];

    const renderMeaningContent = (meaning: any, index: number) => (
      <View key={meaning.id} style={styles.meaningSlide}>
        <View style={styles.clueImageWrapper}>
          {((meaning.exampleImageUrl && meaning.exampleImageUrl.trim() !== '') || (currentWord.imageUrl && currentWord.imageUrl.trim() !== '')) ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                const imgUrl = meaning.exampleImageUrl || currentWord.imageUrl;
                if (imgUrl) {
                  setViewingImageUrl(imgUrl);
                  setImageViewerVisible(true);
                }
              }}
            >
              <Image
                source={{ uri: meaning.exampleImageUrl || currentWord.imageUrl }}
                style={styles.clueImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <View style={[styles.clueImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSoft }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        </View>

        {!showHint ? (
          <TouchableOpacity style={styles.hintButton} onPress={() => setShowHint(true)}>
            <Text style={styles.hintIcon}>💡</Text>
            <Text style={styles.hintText}>{PRACTICE_TEXTS.showHint}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.hintContent}>
            <Text style={styles.clueLabel}>{PRACTICE_TEXTS.definition} ({meaning.partOfSpeech || '?'})</Text>
            <Text style={styles.clueText}>{meaning.definition}</Text>
            {meaning.example && (
              <Text style={styles.clueExample}>
                "{meaning.example.replace(new RegExp(currentWord.word, 'gi'), '_____')}"
              </Text>
            )}
          </View>
        )}
      </View>
    );

    const displayedMeanings = [...currentWord.meanings].reverse();
    const cardInnerWidth = SCREEN_WIDTH - (spacing.lg * 4);

    const feedback = isAnswered
      ? (pronunciationResult
        ? getFeedbackData(pronunciationResult.accuracy, true)
        : getFeedbackData(isCorrect ? 1 : 0, false))
      : null;

    const currentResult = isAnswered ? quizResults.find(r => r.word.id === currentWord.id) : null;
    const isSkipped = currentResult?.status === 'skipped';

    return (
      <View style={{ flex: 1 }}>
        {feedback && (
          <Animated.View style={[styles.topPopup, { transform: [{ translateY: popupAnim }], backgroundColor: feedback.bgColor }]}>
            <View style={styles.topPopupContent}>
              <Text style={styles.topPopupEmoji}>{feedback.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.topPopupTitle, { color: feedback.color }]}>{feedback.title}</Text>
                <Text style={styles.topPopupMessage}>{feedback.message}</Text>
              </View>
            </View>
          </Animated.View>
        )}

        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setIsQuizVisible(false)} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.progressText}>
            {PRACTICE_TEXTS.step.replace('{current}', String(currentIndex + 1)).replace('{total}', String(quizList.length))}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          ref={quizScrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.quizContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.clueCard, shadows.medium]}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(ev) => {
                const newIndex = Math.round(ev.nativeEvent.contentOffset.x / cardInnerWidth);
                setMeaningIndex(newIndex);
              }}
              style={styles.meaningScrollView}
              contentContainerStyle={styles.meaningScrollContent}
            >
              {displayedMeanings.map((meaning, index) => renderMeaningContent(meaning, index))}
            </ScrollView>

            {displayedMeanings.length > 1 && (
              <View style={styles.paginationContainer}>
                {displayedMeanings.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setMeaningIndex(i)}
                    hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                  >
                    <View style={[styles.paginationDot, meaningIndex === i && styles.paginationDotActive]} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {!isAnswered ? (
            <View style={styles.inputArea}>
              <View style={styles.speechContainer}>
                <View style={styles.micWrapper}>
                  <Animated.View style={[
                    styles.micPulse,
                    { transform: [{ scale: pulseAnim }], opacity: isRecording ? 0.3 : 0 }
                  ]} />
                  <TouchableOpacity
                    style={[
                      styles.micButtonLarge,
                      isRecording ? styles.micButtonRecording : styles.micButtonInactive,
                      isProcessing && styles.micButtonProcessing,
                      shadows.clayStrong
                    ]}
                    onPress={handleMicPress}
                    disabled={isProcessing}
                    activeOpacity={0.8}
                  >
                    {isProcessing ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Ionicons
                        name={isRecording ? "stop" : "mic"}
                        size={36}
                        color={colors.white}
                      />
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.speechStatus}>
                  {isRecording ? PRACTICE_TEXTS.listening : (isProcessing ? PRACTICE_TEXTS.thinking : (userAudioUri ? 'Ready to check' : 'Tap to Speak'))}
                </Text>

                {userAudioUri && !isRecording && (
                  <View style={styles.audioActionsRow}>
                    <TouchableOpacity
                      style={styles.cancelAudioButton}
                      onPress={() => {
                        setUserAudioUri(null);
                        setPronunciationResult(null);
                        if (userAudioSound.current) {
                          userAudioSound.current.unloadAsync().catch(() => { });
                          userAudioSound.current = null;
                        }
                      }}
                    >
                      <Text style={styles.cancelAudioEmoji}>✕</Text>
                      <Text style={styles.cancelAudioText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.playbackButton, playingUserAudio && styles.playbackButtonActive]}
                      onPress={handlePlayUserAudio}
                      disabled={playingUserAudio}
                    >
                      <Text style={styles.playbackEmoji}>{playingUserAudio ? '🔊' : '👂'}</Text>
                      <Text style={styles.playbackText}>{playingUserAudio ? 'Playing...' : 'Review'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <TextInput
                style={styles.textInput}
                placeholder={PRACTICE_TEXTS.whatIsThisWord}
                placeholderTextColor={colors.textLight}
                value={userAnswer}
                onChangeText={setUserAnswer}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={() => checkAnswer()}
              />

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.giveUpButton} onPress={() => checkAnswer('?')}>
                  <Text style={styles.giveUpText}>{PRACTICE_TEXTS.showAnswer}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.checkButton, (userAnswer.trim() || userAudioUri) && styles.checkButtonActive]}
                  onPress={() => (userAnswer.trim() || userAudioUri) && checkAnswer()}
                  disabled={(!userAnswer.trim() && !userAudioUri) || isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.checkButtonText}>{PRACTICE_TEXTS.submit}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.resultArea}>


              {/* Correct Answer Display */}
              <View style={[styles.correctAnswerBox, shadows.subtle]}>
                <Text style={styles.labelSmall}>{PRACTICE_TEXTS.correctWordIs}</Text>
                <View style={styles.answerRow}>
                  <Text style={styles.correctWord}>{currentWord.word}</Text>
                  <SpeakButton audioUrl={currentWord.audioUrl} text={currentWord.word} size="medium" />
                </View>
                <Text style={styles.phoneticText}>{currentWord.phonetic || DEFAULTS.phonetic}</Text>
              </View>

              {/* Text Feedback */}
              {userAnswer.trim().length > 0 && !isSkipped && (
                <View style={[styles.feedbackCard, shadows.subtle, { backgroundColor: '#F8FAFF' }]}>
                  <View style={styles.feedbackHeader}>
                    <View style={styles.feedbackTitleRow}>
                      <Text style={styles.feedbackIconTiny}>{userAudioUri && userAnswer.trim() === pronunciationResult?.recognizedText ? '🎙️' : '⌨️'}</Text>
                      <Text style={styles.feedbackTitleTiny}>{userAudioUri && userAnswer.trim() === pronunciationResult?.recognizedText ? 'Recognized Text' : 'Text Answer'}</Text>
                    </View>
                    <View style={[
                      styles.tinyStatusBadge,
                      userAnswer.toLowerCase().trim() === currentWord.word.toLowerCase().trim() ? styles.badgeSuccess : styles.badgeError
                    ]}>
                      <Text style={styles.tinyStatusText}>
                        {userAnswer.toLowerCase().trim() === currentWord.word.toLowerCase().trim() ? 'Correct' : 'Incorrect'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.userAnswerContent}>
                    <Text style={styles.userAnswerLabel}>Input:</Text>
                    <Text style={styles.userAnswerValue}>{userAnswer}</Text>
                  </View>
                </View>
              )}

              {/* Pronunciation Feedback - Detailed Version */}
              {pronunciationResult && (
                <View style={[styles.pronunciationFeedback, shadows.subtle, { padding: 0, overflow: 'hidden' }]}>
                  <PronunciationDetailView
                    recognizedText={pronunciationResult.recognizedText}
                    accuracyScore={pronunciationResult.accuracyScore}
                    fluencyScore={pronunciationResult.fluencyScore}
                    completenessScore={pronunciationResult.completenessScore}
                    pronScore={pronunciationResult.pronScore}
                    words={pronunciationResult.words}
                    compact={true}
                  />

                  {userAudioUri && !isRecording && (
                    <TouchableOpacity
                      style={styles.listenBackBtn}
                      onPress={handlePlayUserAudio}
                      disabled={playingUserAudio}
                    >
                      <Ionicons
                        name={playingUserAudio ? "volume-high" : "play-circle"}
                        size={22}
                        color={colors.primary}
                      />
                      <Text style={styles.listenBackText}>{playingUserAudio ? "Playing..." : "Listen to my recording"}</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={styles.miniRetryBtnCenter} onPress={handleRetry}>
                    <Ionicons name="refresh" size={18} color={colors.textSecondary} />
                    <Text style={styles.miniRetryText}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              )}


              {/* Next Button */}
              <TouchableOpacity style={[styles.nextButton, shadows.strong, { marginTop: spacing.md }]} onPress={handleNext}>
                <Text style={styles.nextButtonText}>
                  {currentIndex === quizList.length - 1 ? PRACTICE_TEXTS.finishTest : PRACTICE_TEXTS.continue}
                </Text>
              </TouchableOpacity>
            </View>
          )
          }
        </ScrollView >
      </View >
    );
  };

  if (isQuizVisible) {
    return (
      <LinearGradient
        colors={gradients.backgroundMain.colors as [string, string, ...string[]]}
        start={gradients.backgroundMain.start}
        end={gradients.backgroundMain.end}
        style={styles.container}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
          {showReview ? renderReviewScreen() : (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              {renderQuizContent()}
            </KeyboardAvoidingView>
          )}

          <ImageViewerModal
            visible={imageViewerVisible}
            imageUrl={viewingImageUrl}
            onClose={() => setImageViewerVisible(false)}
            allowEdit={false}
          />

          <Modal
            visible={detailModalVisible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setDetailModalVisible(false)}
          >
            {pronunciationResult && (
              <PronunciationDetailView
                recognizedText={pronunciationResult.recognizedText}
                accuracyScore={pronunciationResult.accuracyScore}
                fluencyScore={pronunciationResult.fluencyScore}
                completenessScore={pronunciationResult.completenessScore}
                pronScore={pronunciationResult.pronScore}
                words={pronunciationResult.words}
                onClose={() => setDetailModalVisible(false)}
                compact={false}
              />
            )}
          </Modal>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={gradients.backgroundMain.colors as [string, string, ...string[]]}
      start={gradients.backgroundMain.start}
      end={gradients.backgroundMain.end}
      style={styles.container}
    >
      <SafeAreaView style={styles.innerContainer} edges={['bottom', 'left', 'right']}>
        {renderSetup()}

        <ImageViewerModal
          visible={imageViewerVisible}
          imageUrl={viewingImageUrl}
          onClose={() => setImageViewerVisible(false)}
          allowEdit={false}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  innerContainer: { flex: 1 },
  startButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.clayCard,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    ...shadows.clayMedium,
  },
  modeButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md
  },

  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extraBold,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center'
  },

  card: {
    width: '100%',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
    marginTop: 8
  },
  countBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.clayInput,
    borderWidth: 0,
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    ...shadows.claySoft,
  },
  countBtnActive: {
    backgroundColor: colors.primary,
    ...shadows.clayPrimary,
  },
  countText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary
  },
  countTextActive: {
    color: colors.white,
    fontWeight: typography.weights.bold
  },

  primaryButton: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.clayButton,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.clayPrimary,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.3
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xs
  },
  closeBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: colors.cardSurface,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.claySoft,
  },
  closeText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary
  },
  progressText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1
  },

  quizContent: {
    paddingTop: spacing.sm,
    flexGrow: 1,
    paddingBottom: spacing.massive
  },

  clueCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: borderRadius.xs,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.clayMedium,
  },
  clueImageWrapper: {
    width: SCREEN_WIDTH * 0.35,
    height: SCREEN_WIDTH * 0.35,
    borderRadius: borderRadius.clayCard,
    backgroundColor: colors.backgroundSoft,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.shadowInnerLight,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  clueImage: { width: '100%', height: '100%' },

  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.clayBadge,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    marginBottom: 8,
    ...shadows.claySoft,
  },
  hintIcon: { marginRight: 2, fontSize: typography.sizes.lg },
  hintText: {
    fontWeight: typography.weights.bold,
    color: colors.primary,
    fontSize: typography.sizes.base
  },

  hintContent: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing.sm,
  },
  clueLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.extraBold,
    color: colors.primary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  clueText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xs,
    fontWeight: typography.weights.semibold,
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  clueExample: {
    fontSize: typography.sizes.sm,
    fontStyle: 'italic',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    flexWrap: 'wrap',
    maxWidth: '100%',
  },

  inputArea: { width: '100%', paddingHorizontal: spacing.lg },

  modeSwitch: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
    backgroundColor: colors.backgroundSoft,
    padding: 6,
    borderRadius: borderRadius.clayInput,
    alignSelf: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.shadowInnerLight,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  switchBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderRadius: borderRadius.md
  },
  switchBtnActive: {
    backgroundColor: colors.white,
    ...shadows.claySoft,
  },
  switchText: {
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    fontSize: typography.sizes.base
  },
  switchTextActive: { color: colors.primary },

  textInput: {
    backgroundColor: colors.cardSurface,
    borderWidth: 0,
    borderRadius: borderRadius.clayInput,
    padding: spacing.md,
    fontSize: typography.sizes.lg,
    textAlign: 'center',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.shadowInnerLight,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.claySoft,
  },

  speechContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg
  },

  micWrapper: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  micPulse: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary,
  },
  micButtonLarge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonInactive: {
    backgroundColor: colors.primary,
  },
  micButtonRecording: {
    backgroundColor: colors.error,
  },
  micButtonProcessing: {
    backgroundColor: colors.primary,
    opacity: 0.6,
  },
  micIconLarge: {
    fontSize: 32
  },
  speechContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  speechStatus: {
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    fontSize: typography.sizes.sm
  },

  actionRow: { flexDirection: 'row', gap: spacing.md },

  giveUpButton: {
    flex: 1,
    backgroundColor: colors.cardSurface,
    borderRadius: borderRadius.clayInput,
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.claySoft,
  },
  giveUpText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold
  },

  checkButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.clayInput,
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.clayPrimary,
  },
  checkButtonText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold
  },

  resultArea: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg
  },

  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderRadius: borderRadius.clayBadge,
    marginBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.claySoft,
  },
  badgeCorrect: { backgroundColor: '#D1FAE5' },
  badgeWrong: { backgroundColor: '#FEE2E2' },
  resultEmoji: { fontSize: typography.sizes.xl, marginRight: 8 },
  resultTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.extraBold,
    color: colors.textPrimary
  },

  correctAnswerBox: {
    alignItems: 'center',
    marginBottom: spacing.sm,
    width: '100%',
    padding: spacing.md,
    backgroundColor: colors.cardSurface,
    borderRadius: borderRadius.clayCard,
    borderWidth: 0,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    ...shadows.clayMedium,
  },
  labelSmall: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  correctWord: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.5
  },
  phoneticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  phoneticText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontStyle: 'italic'
  },

  pronunciationFeedback: {
    width: '100%',
    backgroundColor: colors.cardSurface,
    borderRadius: borderRadius.clayCard,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    ...shadows.clayMedium,
  },
  accuracyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  accuracyLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  accuracyBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.clayBadge,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
  },
  accuracyGood: {
    backgroundColor: '#D1FAE5',
  },
  accuracyOk: {
    backgroundColor: '#FEF3C7',
  },
  accuracyPoor: {
    backgroundColor: '#FEE2E2',
  },
  accuracyScore: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  transcriptRow: {
    marginBottom: spacing.sm,
  },
  transcriptLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transcriptText: {
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  ipaText: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  nextButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.clayInput,
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.clayPrimary,
  },
  nextButtonText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.3
  },

  summaryContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg
  },
  summaryEmoji: { fontSize: 56, marginBottom: spacing.md },

  statsContainer: {
    width: '100%',
    marginBottom: spacing.xs,
    marginTop: 0,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
    marginBottom: spacing.xs,
  },

  statCard: {
    flex: 1,
    backgroundColor: colors.cardSurface,
    borderRadius: borderRadius.xxxl,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 0,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    ...shadows.claySoft,
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extraBold,
    color: colors.primary,
    marginBottom: 2,
  },
  setupImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    marginBottom: spacing.sm,
  },
  setupImage: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.6,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },

  lastPracticeInfo: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  lastPracticeText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xxs,
  },
  bestStreakText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },

  meaningScrollView: {
    width: '100%',
  },
  meaningScrollContent: {
    alignItems: 'flex-start',
  },
  meaningSlide: {
    width: SCREEN_WIDTH - (spacing.lg * 4),
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderMedium,
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    width: 16,
    borderRadius: 3,
  },

  secondaryButtonOutline: {
    width: '100%',
    backgroundColor: colors.cardSurface,
    borderWidth: 0,
    paddingVertical: 16,
    borderRadius: borderRadius.clayInput,
    alignItems: 'center',
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    ...shadows.claySoft,
  },
  secondaryButtonOutlineText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  reviewContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 120,
    flexGrow: 1,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  reviewStatsColumn: {
    flex: 1.3,
    gap: spacing.xs,
  },
  reviewStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    ...shadows.subtle,
  },
  reviewStatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewStatIcon: {
    fontSize: 16,
    fontWeight: '900',
  },
  reviewStatCorrect: {
    backgroundColor: '#ECFDF5',
    borderLeftColor: '#10B981',
  },
  reviewStatIncorrect: {
    backgroundColor: '#FEF2F2',
    borderLeftColor: '#EF4444',
  },
  reviewStatSkipped: {
    backgroundColor: '#F9FAFB',
    borderLeftColor: '#9CA3AF',
  },
  reviewStatLabelBold: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reviewStatNumberBold: {
    fontSize: 18,
    fontWeight: '900',
  },
  reviewList: {
    gap: spacing.sm,
  },

  reviewItem: {
    backgroundColor: colors.cardSurface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 3,
    borderLeftColor: colors.borderMedium,
    ...shadows.claySoft,
  },
  reviewItemCorrect: {
    borderLeftColor: colors.success,
    backgroundColor: 'rgba(52, 211, 153, 0.05)',
  },
  reviewItemIncorrect: {
    borderLeftColor: colors.error,
    backgroundColor: 'rgba(248, 113, 113, 0.05)',
  },
  reviewItemContent: {
    flex: 1,
  },
  reviewItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewItemLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    fontWeight: typography.weights.medium,
    width: 55,
  },
  reviewItemWord: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  reviewItemUserAnswer: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    flex: 1,
  },
  answerCorrect: {
    color: colors.success,
  },
  answerIncorrect: {
    color: colors.error,
  },
  reviewItemSkippedText: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  reviewItemMethodText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    flex: 1,
  },
  detailButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: colors.backgroundViolet,
  },
  reviewItemIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  iconContainerCorrect: {
    backgroundColor: colors.success,
  },
  iconContainerIncorrect: {
    backgroundColor: colors.error,
  },
  iconContainerSkipped: {
    backgroundColor: colors.textLight,
  },
  reviewItemIcon: {
    fontSize: 16,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  reviewDoneButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.puffyMd,
    borderRadius: borderRadius.clayButton,
    alignItems: 'center',
    marginTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    ...shadows.clayPrimary,
  },
  wordReviewContainer: {
    marginVertical: spacing.sm,
    alignItems: 'center',
    width: '100%',
  },
  reviewLabelLarge: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  coloredWordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  coloredChar: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginHorizontal: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  ipaComparisonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    backgroundColor: colors.backgroundViolet,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    width: '100%',
  },
  ipaBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ipaLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: spacing.xxs,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  ipaValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '500',
  },
  ipaDivider: {
    width: 1,
    height: '80%',
    backgroundColor: colors.borderMedium,
    marginHorizontal: spacing.sm,
  },
  feedbackCard: {
    width: '100%',
    borderRadius: borderRadius.clayCard,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
    ...shadows.clayMedium,
  },
  feedbackEmoji: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  feedbackTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extraBold,
    marginBottom: spacing.xxs,
    letterSpacing: 0.5,
  },
  feedbackMessage: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: typography.weights.medium,
  },

  // Compact Answer Row
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxs,
  },

  // Score Row & Badges
  scoreRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    width: '100%',
  },
  scoreLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  scoreBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.clayBadge,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.5)',
    ...shadows.claySoft,
  },
  scoreExcellent: {
    backgroundColor: '#D1FAE5',
  },
  scoreGood: {
    backgroundColor: '#FEF3C7',
  },
  scorePoor: {
    backgroundColor: '#FEE2E2',
  },
  scoreValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },

  // Character Accuracy Container
  charAccuracyContainer: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  charAccuracyLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // IPA Row (Horizontal Layout)
  ipaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundViolet,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    width: '100%',
  },
  ipaItem: {
    flex: 1,
    alignItems: 'center',
  },
  ipaItemLabel: {
    fontSize: 11,
    color: colors.textLight,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  ipaItemValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
  ipaDividerVertical: {
    width: 1,
    height: '70%',
    backgroundColor: colors.borderMedium,
    marginHorizontal: spacing.xs,
  },

  // -- Setup Header --
  setupHeader: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 0, // Removed extra padding since it's inside SafeAreaView
    paddingBottom: spacing.xs,
    width: '100%',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xxs,
  },
  greetingContainer: {
    // Removed flex: 1 to prevent collapsing without fixed height
    marginRight: spacing.md,
  },
  setupHeaderTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.extraBold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  wavingEmoji: {
    fontSize: typography.sizes.xxl,
  },
  subGreeting: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    marginTop: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },

  // -- Top Popup Notification --
  topPopup: {
    position: 'absolute',
    top: 20, // Moved higher as requested (was 50)
    left: spacing.md,
    right: spacing.md,
    borderRadius: borderRadius.clayCard,
    padding: spacing.md,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    ...shadows.clayStrong,
  },
  topPopupContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  topPopupEmoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  topPopupTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: 2,
    color: colors.textPrimary,
  },
  topPopupMessage: {
    fontSize: typography.sizes.sm,
    color: 'rgba(0,0,0,0.7)',
    fontWeight: typography.weights.medium,
  },

  // Result Actions (Retry/Listen back)
  actionRowResult: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginBottom: spacing.sm,
  },
  smallActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardSurface,
    paddingVertical: 12,
    borderRadius: borderRadius.clayInput,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    ...shadows.claySoft,
  },
  smallActionButtonActive: {
    backgroundColor: '#F0F7FF',
  },
  smallActionEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  smallActionText: {
    fontSize: 13,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
  },

  // Compact IPA row actions
  ipaValueWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniPlayBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.cardSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    ...shadows.claySoft,
  },
  miniPlayBtnActive: {
    backgroundColor: '#D1FAE5',
    ...shadows.clayPressed,
  },
  miniPlayEmoji: {
    fontSize: 12,
  },
  miniRetryBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniRetryEmoji: {
    fontSize: 20,
  },

  // Playback Button in Input Area
  playbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    marginTop: spacing.xs,
    ...shadows.claySoft,
  },
  playbackButtonActive: {
    backgroundColor: '#F0F7FF',
    ...shadows.clayPressed,
  },
  playbackEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  playbackText: {
    fontSize: 12,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  audioActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cancelAudioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    ...shadows.claySoft,
  },
  cancelAudioEmoji: {
    fontSize: 14,
    marginRight: 4,
    color: colors.error,
  },
  cancelAudioText: {
    fontSize: 12,
    fontWeight: typography.weights.bold,
    color: colors.error,
  },
  checkButtonActive: {
    backgroundColor: colors.primary,
  },
  summaryResultImage: {
    width: 200,
    height: 200,
    marginBottom: spacing.lg,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  feedbackTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  feedbackIconTiny: {
    fontSize: 14,
  },
  feedbackTitleTiny: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tinyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeSuccess: {
    backgroundColor: '#D1FAE5',
  },
  badgeError: {
    backgroundColor: '#FEE2E2',
  },
  tinyStatusText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  userAnswerContent: {
    alignItems: 'center',
    width: '100%',
  },
  userAnswerLabel: {
    fontSize: 10,
    color: colors.textLight,
    marginBottom: 2,
    fontWeight: '600',
  },
  userAnswerValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  reviewItemMethodText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  reviewTopSummary: {
    alignItems: 'center',
  },
  reviewSummaryImage: {
    width: 160,
    height: 160,
    marginBottom: spacing.md,
  },
  reviewSummaryText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  reviewSummaryScoreText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  listenBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.08)',
    paddingVertical: 10,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  listenBackText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  miniRetryBtnCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  miniRetryText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
});
