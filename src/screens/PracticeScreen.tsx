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

import { theme, colors, typography, spacing, borderRadius, shadows } from '../theme';
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
        <View style={styles.reviewSummary}>
          <Text style={styles.reviewTitle}>{PRACTICE_TEXTS.yourPerformance}</Text>
          <View style={styles.reviewStatsRow}>
            <View style={styles.reviewStatItem}>
              <Text style={styles.reviewStatEmoji}>✅</Text>
              <Text style={styles.reviewStatNumber}>{quizResults.filter(r => r.status === 'correct').length}</Text>
              <Text style={styles.reviewStatLabel}>{PRACTICE_TEXTS.correct}</Text>
            </View>
            <View style={styles.reviewStatItem}>
              <Text style={styles.reviewStatEmoji}>❌</Text>
              <Text style={styles.reviewStatNumber}>{quizResults.filter(r => r.status === 'incorrect').length}</Text>
              <Text style={styles.reviewStatLabel}>{PRACTICE_TEXTS.incorrect}</Text>
            </View>
            <View style={styles.reviewStatItem}>
              <Text style={styles.reviewStatEmoji}>⏭️</Text>
              <Text style={styles.reviewStatNumber}>{quizResults.filter(r => r.status === 'skipped').length}</Text>
              <Text style={styles.reviewStatLabel}>{PRACTICE_TEXTS.skipped}</Text>
            </View>
          </View>
        </View>

        <View style={styles.reviewList}>
          {quizResults.map((result, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.reviewItem, shadows.subtle]}
              onPress={() => {
                requestAnimationFrame(() => {
                  navigation.navigate('WordDetail', { wordId: result.word.id });
                });
              }}
            >
              <View style={styles.reviewItemHeader}>
                <Text style={styles.reviewItemNumber}>#{index + 1}</Text>
                <Text style={styles.reviewItemStatus}>
                  {result.status === 'correct' ? '✅' : result.status === 'incorrect' ? '❌' : '⏭️'}
                </Text>
              </View>
              <Text style={styles.reviewItemWord}>{result.word.word}</Text>
              {result.userAnswer && (
                <Text style={[
                  styles.reviewItemAnswer,
                  result.status === 'correct' ? styles.reviewItemAnswerCorrect : styles.reviewItemAnswerIncorrect
                ]}>
                  Your answer: "{result.userAnswer}"
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { marginTop: spacing.xl }]}
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

    // Render individual meaning content (not the card wrapper)
    const renderMeaningContent = ({ item: meaning, index }: { item: any, index: number }) => (
      <View style={styles.meaningContent}>
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
              <ActivityIndicator size="large" color={colors.primary} />         </View>
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
          {/* Fixed card with sliding content inside */}
          <View style={[styles.clueCard, shadows.medium]}>
            {/* Create a reversed copy for display so newest meanings show first */}
            <FlatList
              data={[...currentWord.meanings].reverse()}
              keyExtractor={(item) => item.id}
              renderItem={renderMeaningContent}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(ev) => {
                const newIndex = Math.round(ev.nativeEvent.contentOffset.x / (SCREEN_WIDTH - (spacing.xl * 2)));
                setMeaningIndex(newIndex);
              }}
              style={{ flexGrow: 0 }}
            />

            {/* Pagination dots inside card */}
            {currentWord.meanings.length > 1 && (
              <View style={styles.paginationContainer}>
                {currentWord.meanings.map((_, i) => (
                  <View key={i} style={[styles.paginationDot, meaningIndex === i && styles.paginationDotActive]} />
                ))}               </View>
            )}
          </View>

          {!isAnswered ? (
            <View style={styles.inputArea}>
              <View style={styles.modeSwitch}>
                {(['TYPE', 'SPEAK'] as const).map(mode => (
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
              </View>

              {inputMode === 'TYPE' ? (
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
              ) : (
                <View style={styles.speechContainer}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.micButtonLarge,
                      isRecording && styles.micButtonRecording,
                      isProcessing && styles.micButtonProcessing,
                      shadows.medium
                    ]}
                    onPress={handleMicPress}
                    disabled={isProcessing}
                  >
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                      <Text style={styles.micIconLarge}>{isProcessing ? '⏳' : '🎙️'}</Text>
                    </Animated.View>
                  </TouchableOpacity>
                  <Text style={styles.speechStatus}>
                    {isRecording ? PRACTICE_TEXTS.listening : isProcessing ? PRACTICE_TEXTS.thinking : PRACTICE_TEXTS.tapToAnswer}
                  </Text>
                </View>
              )}

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.giveUpButton} onPress={() => checkAnswer('?')}>
                  <Text style={styles.giveUpText}>{PRACTICE_TEXTS.showAnswer}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.checkButton, (!userAnswer && inputMode === 'TYPE') && styles.checkButtonDisabled]}
                  onPress={() => checkAnswer()}
                  disabled={!userAnswer && inputMode === 'TYPE' || isProcessing || isRecording}
                >
                  <Text style={styles.checkButtonText}>{PRACTICE_TEXTS.verify}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.resultArea}>
              <View style={[styles.resultBadge, isCorrect ? styles.badgeCorrect : styles.badgeWrong]}>
                <Text style={styles.resultEmoji}>{isCorrect ? '🎉' : '❌'}</Text>
                <Text style={styles.resultTitle}>{isCorrect ? PRACTICE_TEXTS.splendid : PRACTICE_TEXTS.notQuite}</Text>
              </View>

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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
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
    );
  }

  return (
    <View style={styles.container}>
      {renderSetup()}

      <ImageViewerModal
        visible={imageViewerVisible}
        imageUrl={viewingImageUrl}
        onClose={() => setImageViewerVisible(false)}
        allowEdit={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },

  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.extraBold, color: colors.textPrimary, marginBottom: spacing.xs, textAlign: 'center' },
  subtitle: { fontSize: typography.sizes.md, color: colors.textSecondary, marginBottom: spacing.xxl, textAlign: 'center' },

  card: { width: '100%', backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.xl, marginBottom: spacing.xxl, borderWidth: 1, borderColor: colors.borderLight },
  label: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.textPrimary, marginBottom: spacing.lg },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  countBtn: { flex: 1, paddingVertical: 12, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderMedium, alignItems: 'center' },
  countBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  countText: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.textSecondary },
  countTextActive: { color: colors.white },

  primaryButton: { width: '100%', backgroundColor: colors.primary, paddingVertical: 16, borderRadius: borderRadius.lg, alignItems: 'center', ...shadows.medium },
  primaryButtonText: { color: colors.white, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, letterSpacing: 0.3 },

  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  closeBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: colors.backgroundSoft },
  closeText: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textSecondary },
  progressText: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.textLight, textTransform: 'uppercase', letterSpacing: 1 },

  quizContent: { paddingTop: spacing.xl, flexGrow: 1, paddingBottom: spacing.massive },
  clueCard: { backgroundColor: colors.white, borderRadius: borderRadius.xxxl, padding: spacing.xl, marginBottom: spacing.xxl, alignItems: 'center', marginHorizontal: spacing.xl },
  clueImageWrapper: { width: SCREEN_WIDTH * 0.45, height: SCREEN_WIDTH * 0.45, borderRadius: borderRadius.lg, backgroundColor: colors.backgroundSoft, marginBottom: spacing.lg, overflow: 'hidden' },
  clueImage: { width: '100%', height: '100%' },

  hintButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundSoft, paddingVertical: 10, paddingHorizontal: 20, borderRadius: borderRadius.round },
  hintIcon: { marginRight: 8, fontSize: typography.sizes.lg },
  hintText: { fontWeight: typography.weights.bold, color: colors.primary, fontSize: typography.sizes.base },

  hintContent: { alignItems: 'center', width: '100%' },
  clueLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.extraBold, color: colors.primary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  clueText: { fontSize: typography.sizes.lg, color: colors.textPrimary, textAlign: 'center', lineHeight: 26, marginBottom: spacing.md, fontWeight: typography.weights.semibold },
  clueExample: { fontSize: typography.sizes.md, fontStyle: 'italic', color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },

  inputArea: { width: '100%', paddingHorizontal: spacing.xl },
  modeSwitch: { flexDirection: 'row', justifyContent: 'center', marginBottom: spacing.xxl, backgroundColor: colors.backgroundSoft, padding: 4, borderRadius: borderRadius.lg, alignSelf: 'center' },
  switchBtn: { paddingHorizontal: spacing.xl, paddingVertical: 10, borderRadius: 12 },
  switchBtnActive: { backgroundColor: colors.white, ...shadows.subtle },
  switchText: { fontWeight: typography.weights.bold, color: colors.textSecondary, fontSize: typography.sizes.base },
  switchTextActive: { color: colors.primary },

  textInput: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderMedium, borderRadius: borderRadius.xl, padding: spacing.lg, fontSize: typography.sizes.xxl, textAlign: 'center', color: colors.textPrimary, marginBottom: spacing.xxl, ...shadows.subtle },

  speechContainer: { alignItems: 'center', marginBottom: spacing.xxxl },
  micButtonLarge: { backgroundColor: colors.white, width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg, borderWidth: 6, borderColor: colors.backgroundSoft },
  micButtonRecording: { borderColor: '#FFDEDE', backgroundColor: '#FFF5F5' },
  micButtonProcessing: { borderColor: '#E0E7FF', backgroundColor: '#F8FAFF' },
  micIconLarge: { fontSize: 40 },
  speechStatus: { fontWeight: typography.weights.semibold, color: colors.textSecondary, fontSize: typography.sizes.base },

  actionRow: { flexDirection: 'row', gap: spacing.md },
  giveUpButton: { flex: 1, backgroundColor: colors.backgroundSoft, borderRadius: borderRadius.lg, paddingVertical: 16, alignItems: 'center' },
  giveUpText: { color: colors.textSecondary, fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  checkButton: { flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: 16, alignItems: 'center', ...shadows.medium },
  checkButtonDisabled: { backgroundColor: colors.borderMedium, elevation: 0, shadowOpacity: 0 },
  checkButtonText: { color: colors.white, fontSize: typography.sizes.md, fontWeight: typography.weights.bold },

  resultArea: { alignItems: 'center', width: '100%', paddingVertical: spacing.sm, paddingHorizontal: spacing.xl },
  resultBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: 10, borderRadius: borderRadius.round, marginBottom: spacing.xl },
  badgeCorrect: { backgroundColor: '#D1FAE5' },
  badgeWrong: { backgroundColor: '#FEE2E2' },
  resultEmoji: { fontSize: typography.sizes.xl, marginRight: 8 },
  resultTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.extraBold, color: colors.textPrimary },

  correctAnswerBox: { alignItems: 'center', marginBottom: spacing.xxl, width: '100%', padding: spacing.xl, backgroundColor: colors.white, borderRadius: borderRadius.xxxl, borderWidth: 1, borderColor: colors.borderLight },
  labelSmall: { fontSize: typography.sizes.base, color: colors.textLight, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  correctWord: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.heavy, color: colors.textPrimary, marginBottom: spacing.sm, letterSpacing: -0.5 },
  phoneticRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  phoneticText: { fontSize: typography.sizes.lg, color: colors.textSecondary, fontStyle: 'italic' },

  nextButton: { width: '100%', backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: 14, alignItems: 'center', ...shadows.strong },
  nextButtonText: { color: colors.white, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, letterSpacing: 0.3 },

  summaryContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  summaryEmoji: { fontSize: 72, marginBottom: spacing.lg },

  // Gamification Stats Styles
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
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.subtle,
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
  lastPracticeInfo: {
    backgroundColor: colors.backgroundSoft,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md
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

  // Carousel styles
  meaningContent: {
    width: SCREEN_WIDTH - (spacing.xl * 4), // Trừ padding của card và margin
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderMedium,
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },

  // Review Screen Styles
  secondaryButtonOutline: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.borderMedium,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  secondaryButtonOutlineText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  reviewContent: {
    padding: spacing.xl,
    flexGrow: 1,
  },
  reviewSummary: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.medium,
  },
  reviewTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extraBold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  reviewStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.sm,
  },
  reviewStatItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.backgroundSoft,
    borderRadius: borderRadius.md,
  },
  reviewStatEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  reviewStatNumber: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.extraBold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  reviewStatLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  reviewList: {
    gap: spacing.md,
  },
  reviewItem: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reviewItemNumber: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
    fontWeight: typography.weights.bold,
  },
  reviewItemStatus: {
    fontSize: 24,
  },
  reviewItemWord: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extraBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  reviewItemAnswer: {
    fontSize: typography.sizes.sm,
    fontStyle: 'italic',
  },
  reviewItemAnswerCorrect: {
    color: '#059669',
  },
  reviewItemAnswerIncorrect: {
    color: '#DC2626',
  },
});
