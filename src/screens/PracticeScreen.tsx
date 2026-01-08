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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { theme, colors, typography, spacing, borderRadius, shadows } from '../theme';
import { gradients } from '../theme/styles';
import { Word, RootStackParamList } from '../types';
import { StorageService } from '../services/StorageService';
import { SpeakButton, ImageViewerModal } from '../components';
import { EventBus } from '../services/EventBus';
import {
  ANIMATION,
  PRACTICE_CONFIG,
  PRACTICE_TEXTS,
  TIME_FORMAT,
  DEFAULTS
} from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Quiz & Review Module
 * Supports both typing and speech recognition modes.
 */
export const PracticeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  // -- Setup State --
  const [questionCount, setQuestionCount] = useState<number>(PRACTICE_CONFIG.defaultQuestionCount);
  const [loading, setLoading] = useState(false);
  const [practiceStats, setPracticeStats] = useState<{
    totalSessions: number;
    currentStreak: number;
    longestStreak: number;
    totalWordsPracticed: number;
    lastPracticeTime: number | null;
  } | null>(null);

  // -- Quiz Session --
  const [isQuizVisible, setIsQuizVisible] = useState(false);
  const [quizList, setQuizList] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [meaningIndex, setMeaningIndex] = useState(0); // Track current meaning in carousel
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
  }>>([]);
  const [showReview, setShowReview] = useState(false);

  // -- Voice Interaction --
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // -- Image Viewer --
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  // -- Load Practice Stats --
  useEffect(() => {
    const loadStats = async () => {
      const stats = await StorageService.getPracticeStats();
      setPracticeStats(stats);
    };
    loadStats();
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
        // Lưu timestamp khi bắt đầu practice từ notification
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
  }, [pulseAnim]);

  // -- Logic Handlers --
  const startPractice = useCallback(async () => {
    setLoading(true);
    try {
      // Lấy các từ ít xem nhất để practice
      const words = await StorageService.getLeastViewedWords(questionCount);
      if (words.length === 0) {
        Alert.alert(PRACTICE_TEXTS.noWordsYet, PRACTICE_TEXTS.addWordsFirst);
        return;
      }
      setQuizList(words);
      setCurrentIndex(0);
      setScore(0);
      setQuizResults([]); // Reset results
      resetQuestion();
      setIsQuizVisible(true);
      // Lưu timestamp khi bắt đầu practice
      await StorageService.saveLastPracticeTime();
    } finally {
      setLoading(false);
    }
  }, [questionCount]);

  const resetQuestion = useCallback(() => {
    setUserAnswer('');
    setIsAnswered(false);
    setIsCorrect(false);
    setShowHint(false);
    setIsRecording(false);
    setIsProcessing(false);
    setMeaningIndex(0); // Reset carousel to first meaning
    stopPulse();
  }, [stopPulse]);

  const checkAnswer = useCallback((customAnswer?: string) => {
    const answerToUse = customAnswer !== undefined ? customAnswer : userAnswer;
    const currentWord = quizList[currentIndex];
    const normalizedInput = answerToUse.trim().toLowerCase();
    const normalizedTarget = currentWord.word.trim().toLowerCase();

    const correct = normalizedInput === normalizedTarget;
    const skipped = customAnswer === '?'; // User clicked "Show Answer"

    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);

    setIsAnswered(true);
    setShowHint(true);

    // Track result for review
    setQuizResults(prev => [...prev, {
      word: currentWord,
      status: skipped ? 'skipped' : (correct ? 'correct' : 'incorrect'),
      userAnswer: skipped ? undefined : answerToUse,
    }]);

    // Track review outcome in storage
    StorageService.markAsReviewed(currentWord.id, correct);
  }, [userAnswer, quizList, currentIndex]);

  const handleMicPress = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
      stopPulse();
      setIsProcessing(true);

      // Simulated STT Result
      setTimeout(() => {
        setIsProcessing(false);
        const correctWord = quizList[currentIndex].word;
        const result = Math.random() > 0.2 ? correctWord : "something else";
        setUserAnswer(result);
        checkAnswer(result);
      }, 1500);
    } else {
      setUserAnswer('');
      setIsRecording(true);
      startPulse();
    }
  }, [isRecording, stopPulse, startPulse, quizList, currentIndex, checkAnswer]);

  const handleNext = useCallback(() => {
    if (currentIndex < quizList.length - 1) {
      setCurrentIndex(c => c + 1);
      resetQuestion();
    } else {
      setCurrentIndex(c => c + 1);
      // Update practice stats when session completes
      StorageService.updatePracticeStats(quizList.length).then(() => {
        StorageService.getPracticeStats().then(setPracticeStats);
      });
    }
  }, [currentIndex, quizList.length, resetQuestion]);

  // -- Sub-renderers --

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
    <View style={styles.centerContent}>
      <Text style={styles.title}>{PRACTICE_TEXTS.title}</Text>
      <Text style={styles.subtitle}>{PRACTICE_TEXTS.subtitle}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>{PRACTICE_TEXTS.howManyWords}</Text>
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

      <TouchableOpacity style={styles.primaryButton} onPress={startPractice} disabled={loading}>
        <Text style={styles.primaryButtonText}>
          {loading ? PRACTICE_TEXTS.preparing : PRACTICE_TEXTS.startNow}
        </Text>
      </TouchableOpacity>


      {/* Gamification Stats */}
      {practiceStats && (
        <View style={styles.statsContainer}>
          {practiceStats.lastPracticeTime && (
            <View style={styles.lastPracticeInfo}>
              <Text style={styles.lastPracticeText}>
                {PRACTICE_TEXTS.lastPractice} {formatTimeAgo(practiceStats.lastPracticeTime)}
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
              <Text style={styles.statValue}>{practiceStats.currentStreak}</Text>
              <Text style={styles.statLabel}>{PRACTICE_TEXTS.dayStreak}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{practiceStats.totalSessions}</Text>
              <Text style={styles.statLabel}>{PRACTICE_TEXTS.sessions}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{practiceStats.totalWordsPracticed}</Text>
              <Text style={styles.statLabel}>{PRACTICE_TEXTS.words}</Text>
            </View>
          </View>

        </View>
      )}
    </View>
  );

  const renderReviewScreen = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => setShowReview(false)} style={styles.closeBtn}>
          <Text style={styles.closeText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.progressText}>{PRACTICE_TEXTS.reviewResults}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.reviewContent} showsVerticalScrollIndicator={false}>
        {/* Compact Summary Card */}
        <View style={styles.reviewSummary}>
          <View style={styles.reviewStatsRow}>
            <View style={[styles.reviewStatItem, styles.reviewStatCorrect]}>
              <Text style={styles.reviewStatNumber}>{quizResults.filter(r => r.status === 'correct').length}</Text>
              <Text style={styles.reviewStatLabel}>✓ {PRACTICE_TEXTS.correct}</Text>
            </View>
            <View style={[styles.reviewStatItem, styles.reviewStatIncorrect]}>
              <Text style={styles.reviewStatNumber}>{quizResults.filter(r => r.status === 'incorrect').length}</Text>
              <Text style={styles.reviewStatLabel}>✗ {PRACTICE_TEXTS.incorrect}</Text>
            </View>
            <View style={[styles.reviewStatItem, styles.reviewStatSkipped]}>
              <Text style={styles.reviewStatNumber}>{quizResults.filter(r => r.status === 'skipped').length}</Text>
              <Text style={styles.reviewStatLabel}>⏭ {PRACTICE_TEXTS.skipped}</Text>
            </View>
          </View>
        </View>

        {/* Word List with full details */}
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
                {/* Correct Answer */}
                <View style={styles.reviewItemRow}>
                  <Text style={styles.reviewItemLabel}>Correct:</Text>
                  <Text style={styles.reviewItemWord}>{result.word.word}</Text>
                </View>

                {/* User's Answer */}
                {result.status !== 'skipped' && (
                  <View style={styles.reviewItemRow}>
                    <Text style={styles.reviewItemLabel}>You:</Text>

                    <Text style={[
                      styles.reviewItemUserAnswer,
                      result.status === 'correct' ? styles.answerCorrect : styles.answerIncorrect
                    ]}>
                      {result.userAnswer || '—'}
                    </Text>
                  </View>
                )}

                {result.status === 'skipped' && (
                  <Text style={styles.reviewItemSkippedText}>Skipped</Text>
                )}
              </View>

              {/* Status Icon */}
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

        {/* Done Button */}
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

  const renderQuizContent = () => {
    if (currentIndex >= quizList.length) {
      return (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryEmoji}>{score === quizList.length ? '🏆' : '👍'}</Text>
          <Text style={styles.title}>{PRACTICE_TEXTS.practiceComplete}</Text>
          <Text style={styles.subtitle}>
            {PRACTICE_TEXTS.scoreText.replace('{score}', String(score)).replace('{total}', String(quizList.length))}
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={() => setShowReview(true)}>
            <Text style={styles.primaryButtonText}>{PRACTICE_TEXTS.reviewResultsBtn}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButtonOutline} onPress={() => setIsQuizVisible(false)}>
            <Text style={styles.secondaryButtonOutlineText}>{PRACTICE_TEXTS.close}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const currentWord = quizList[currentIndex];

    // Render individual meaning content for horizontal scroll
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

    // Get meanings in reverse order (newest first)
    const displayedMeanings = [...currentWord.meanings].reverse();

    // Calculate card inner width (card has marginHorizontal: spacing.xl and padding: spacing.xl)
    const cardInnerWidth = SCREEN_WIDTH - (spacing.xl * 4);

    return (
      <View style={{ flex: 1 }}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setIsQuizVisible(false)} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.progressText}>
            {PRACTICE_TEXTS.step.replace('{current}', String(currentIndex + 1)).replace('{total}', String(quizList.length))}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.quizContent} showsVerticalScrollIndicator={false}>
          {/* Fixed card with swipeable meaning content */}
          <View style={[styles.clueCard, shadows.medium]}>
            {/* Horizontal ScrollView for swiping meanings */}
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

            {/* Pagination dots - larger and tappable */}
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
              {/* Mode switch temporarily disabled - only TYPE mode available */}
              {/* <View style={styles.modeSwitch}>
                            { (['TYPE', 'SPEAK'] as const).map(mode => (
                                <TouchableOpacity 
                                    key={mode}
                                    style={[styles.switchBtn, inputMode === mode && styles.switchBtnActive]}
                                      onPress={() => setInputMode(mode)}
                                      disabled={isProcessing || isRecording}
                                  >
                                      <Text style={[styles.switchText, inputMode === mode && styles.switchTextActive]}>
                                        {mode === 'TYPE' ? PRACTICE_TEXTS.type : PRACTICE_TEXTS.speak}
                                      </Text>
                                  </TouchableOpacity>
                            ))}
                        </View> */}

              {/* Always show TYPE input - SPEAK mode temporarily disabled */}
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
                  style={[styles.checkButton]}
                  onPress={() => userAnswer && checkAnswer()}
                  disabled={!userAnswer}
                >
                  <Text style={styles.checkButtonText}>{PRACTICE_TEXTS.verify}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.resultArea}>
              <View style={[styles.correctAnswerBox, shadows.subtle]}>
                <Text style={styles.labelSmall}>{PRACTICE_TEXTS.correctWordIs}</Text>
                <Text style={styles.correctWord}>{currentWord.word}</Text>

                <View style={styles.phoneticRow}>
                  <Text style={styles.phoneticText}>{currentWord.phonetic || DEFAULTS.phonetic}</Text>
                  <SpeakButton text={currentWord.word} size="medium" />
                </View>
              </View>

              <TouchableOpacity style={[styles.nextButton, shadows.strong]} onPress={handleNext}>
                <Text style={styles.nextButtonText}>
                  {currentIndex === quizList.length - 1 ? PRACTICE_TEXTS.finishTest : PRACTICE_TEXTS.continue}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  if (isQuizVisible) {
    return (
      <LinearGradient
        colors={gradients.backgroundMain.colors as [string, string, ...string[]]}
        start={gradients.backgroundMain.start}
        end={gradients.backgroundMain.end}
        style={styles.container}
      >
        <SafeAreaView style={{ flex: 1 }}>
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
      <View style={styles.innerContainer}>
        {renderSetup()}

        <ImageViewerModal
          visible={imageViewerVisible}
          imageUrl={viewingImageUrl}
          onClose={() => setImageViewerVisible(false)}
          allowEdit={false}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  innerContainer: { flex: 1 },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },

  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.extraBold, color: colors.textPrimary, marginBottom: spacing.xs, textAlign: 'center' },
  subtitle: { fontSize: typography.sizes.md, color: colors.textSecondary, marginBottom: spacing.xxl, textAlign: 'center' },

  // Claymorphism card - floating 3D clay tile with soft shadows
  card: {
    width: '100%',
    backgroundColor: colors.cardSurface,
    borderRadius: borderRadius.clayCard,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    borderWidth: 0,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    ...shadows.clayMedium,
  },
  label: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.textPrimary, marginBottom: spacing.lg },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  countBtn: {
    flex: 1,
    paddingVertical: 14,
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
  countText: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.textSecondary },
  countTextActive: { color: colors.white, fontWeight: typography.weights.bold },

  // Claymorphism primary button - pill shape with clay shadow
  primaryButton: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: spacing.puffyMd,
    borderRadius: borderRadius.clayButton,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.clayPrimary,
  },
  primaryButtonText: { color: colors.white, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, letterSpacing: 0.3 },

  // Claymorphism modal header
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xs },
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
  closeText: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textSecondary },
  progressText: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.textLight, textTransform: 'uppercase', letterSpacing: 1 },

  quizContent: { paddingTop: spacing.sm, flexGrow: 1, paddingBottom: spacing.massive },
  // Claymorphism clue card - floating 3D clay tile
  clueCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: borderRadius.xxxl,
    padding: spacing.xl,
    marginBottom: spacing.sm,
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.clayMedium,
  },
  clueImageWrapper: {
    width: SCREEN_WIDTH * 0.45,
    height: SCREEN_WIDTH * 0.45,
    borderRadius: borderRadius.clayCard,
    backgroundColor: colors.backgroundSoft,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.shadowInnerLight,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  clueImage: { width: '100%', height: '100%' },

  // Claymorphism hint button - soft clay pill
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: borderRadius.clayBadge,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.claySoft,
  },
  hintIcon: { marginRight: 8, fontSize: typography.sizes.lg },
  hintText: { fontWeight: typography.weights.bold, color: colors.primary, fontSize: typography.sizes.base },

  hintContent: { alignItems: 'center', width: '100%' },
  clueLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.extraBold, color: colors.primary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  clueText: { fontSize: typography.sizes.lg, color: colors.textPrimary, textAlign: 'center', lineHeight: 26, marginBottom: spacing.md, fontWeight: typography.weights.semibold },
  clueExample: { fontSize: typography.sizes.md, fontStyle: 'italic', color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },

  inputArea: { width: '100%', paddingHorizontal: spacing.xl },
  // Claymorphism mode switch - soft clay container
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
  switchBtn: { paddingHorizontal: spacing.xl, paddingVertical: 12, borderRadius: borderRadius.md },
  switchBtnActive: {
    backgroundColor: colors.white,
    ...shadows.claySoft,
  },
  switchText: { fontWeight: typography.weights.bold, color: colors.textSecondary, fontSize: typography.sizes.base },
  switchTextActive: { color: colors.primary },

  // Claymorphism text input - soft clay with inner shadow
  textInput: {
    backgroundColor: colors.cardSurface,
    borderWidth: 0,
    borderRadius: borderRadius.clayInput,
    padding: spacing.lg,
    fontSize: typography.sizes.xxl,
    textAlign: 'center',
    color: colors.textPrimary,
    marginBottom: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.shadowInnerLight,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.claySoft,
  },

  speechContainer: { alignItems: 'center', marginBottom: spacing.xxxl },
  // Claymorphism mic button - floating 3D clay circle
  micButtonLarge: {
    backgroundColor: colors.cardSurface,
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 0,
    borderTopWidth: 2,
    borderTopColor: colors.shadowInnerLight,
    ...shadows.clayMedium,
  },
  micButtonRecording: {
    backgroundColor: '#FFF5F5',
    borderTopColor: 'rgba(255, 200, 200, 0.6)',
  },
  micButtonProcessing: {
    backgroundColor: '#F8FAFF',
    borderTopColor: 'rgba(200, 210, 255, 0.6)',
  },
  micIconLarge: { fontSize: 40 },
  speechStatus: { fontWeight: typography.weights.semibold, color: colors.textSecondary, fontSize: typography.sizes.base },

  actionRow: { flexDirection: 'row', gap: spacing.md },
  // Claymorphism give up button - soft clay
  giveUpButton: {
    flex: 1,
    backgroundColor: colors.cardSurface,
    borderRadius: borderRadius.clayInput,
    paddingVertical: 18,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.claySoft,
  },
  giveUpText: { color: colors.textSecondary, fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  // Claymorphism check button - primary clay
  checkButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.clayInput,
    paddingVertical: 18,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.clayPrimary,
  },
  checkButtonText: { color: colors.white, fontSize: typography.sizes.md, fontWeight: typography.weights.bold },

  resultArea: { alignItems: 'center', width: '100%', paddingVertical: spacing.sm, paddingHorizontal: spacing.xl },
  // Claymorphism result badge - floating 3D pill
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
  resultTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.extraBold, color: colors.textPrimary },

  // Claymorphism correct answer box - floating 3D clay tile
  correctAnswerBox: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    width: '100%',
    padding: spacing.xl,
    backgroundColor: colors.cardSurface,
    borderRadius: borderRadius.clayCard,
    borderWidth: 0,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    ...shadows.clayMedium,
  },
  labelSmall: { fontSize: typography.sizes.base, color: colors.textLight, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  correctWord: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.heavy, color: colors.textPrimary, marginBottom: spacing.sm, letterSpacing: -0.5 },
  phoneticRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  phoneticText: { fontSize: typography.sizes.lg, color: colors.textSecondary, fontStyle: 'italic' },

  // Claymorphism next button - primary clay
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
  nextButtonText: { color: colors.white, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, letterSpacing: 0.3 },

  summaryContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  summaryEmoji: { fontSize: 72, marginBottom: spacing.lg },

  // Gamification Stats Styles - Claymorphism
  statsContainer: {
    width: '100%',
    marginBottom: spacing.md,
    marginTop: spacing.md
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  // Claymorphism stat card - floating 3D clay tile
  statCard: {
    flex: 1,
    backgroundColor: colors.cardSurface,
    borderRadius: borderRadius.clayCard,
    padding: spacing.md,
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
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.extraBold,
    color: colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  // Claymorphism last practice info - soft clay container
  lastPracticeInfo: {
    backgroundColor: colors.cardSurface,
    borderRadius: borderRadius.clayCard,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.claySoft,
  },
  lastPracticeText: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  bestStreakText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },

  // Meaning carousel styles
  meaningScrollView: {
    width: '100%',
  },
  meaningScrollContent: {
    alignItems: 'flex-start',
  },
  meaningSlide: {
    width: SCREEN_WIDTH - (spacing.xl * 4),
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderMedium,
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    width: 20,
    borderRadius: 4,
  },

  // Review Screen Styles - Claymorphism
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
  // Claymorphism review summary - compact floating card
  reviewSummary: {
    backgroundColor: colors.cardSurface,
    borderRadius: borderRadius.clayCard,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    ...shadows.clayMedium,
  },
  reviewStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  // Claymorphism review stat item - compact pill
  reviewStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  reviewStatCorrect: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  reviewStatIncorrect: {
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
  },
  reviewStatSkipped: {
    backgroundColor: 'rgba(156, 163, 175, 0.15)',
  },
  reviewStatNumber: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extraBold,
    color: colors.textPrimary,
  },
  reviewStatLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.
      weights.semibold,
    marginTop: 2,
  },
  reviewList: {
    gap: spacing.sm,
  },
  // Claymorphism review item - compact card
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
});
