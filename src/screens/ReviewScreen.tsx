// Review Screen - Minimalistic Purple Pastel Style

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, borderRadius, shadow } from '../theme';
import { Word, RootStackParamList } from '../types';
import { StorageService } from '../services/StorageService';
import { SpeakButton, ImageViewerModal, BackIcon } from '../components';
import { ANIMATION, SWIPE_THRESHOLD, REVIEW_TEXTS } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Review'>;

export const ReviewScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

  const position = useRef(new Animated.ValueXY()).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const revealAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadWordsForReview();
  }, []);

  const loadWordsForReview = useCallback(async () => {
    try {
      const reviewWords = await StorageService.getWordsForReview();
      if (reviewWords.length === 0) {
        const allWords = await StorageService.getWords();
        setWords(allWords);
      } else {
        setWords(reviewWords);
      }
    } catch (error) {
      console.error('Error loading words for review:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => revealed,
      onMoveShouldSetPanResponder: () => revealed,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: 0 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          handleSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          handleSwipe('left');
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const toValue = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;

    Animated.parallel([
      Animated.timing(position, {
        toValue: { x: toValue, y: 0 },
        duration: ANIMATION.normal,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: ANIMATION.normal,
        useNativeDriver: true,
      }),
    ]).start(() => {
      handleAnswer(direction === 'right');
    });
  }, [position, cardOpacity]);

  const handleAnswer = useCallback(async (remembered: boolean) => {
    const currentWord = words[currentIndex];

    try {
      await StorageService.markAsReviewed(currentWord.id, remembered);
    } catch (error) {
      console.error('Error marking word as reviewed:', error);
    }

    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setRevealed(false);
      position.setValue({ x: 0, y: 0 });
      cardOpacity.setValue(1);
      revealAnim.setValue(0);
    } else {
      setCompleted(true);
    }
  }, [words, currentIndex, position, cardOpacity, revealAnim]);

  const handleReveal = useCallback(() => {
    setRevealed(true);
    Animated.spring(revealAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [revealAnim]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleButtonPress = useCallback((remembered: boolean) => {
    handleSwipe(remembered ? 'right' : 'left');
  }, [handleSwipe]);

  const getCardRotation = () => {
    return position.x.interpolate({
      inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      outputRange: ['-8deg', '0deg', '8deg'],
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <View style={styles.loadingIconBg}>
            <Text style={styles.loadingEmoji}>📖</Text>
          </View>
          <Text style={styles.loadingText}>{REVIEW_TEXTS.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (words.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <BackIcon size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{REVIEW_TEXTS.practice}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconBg}>
            <Text style={styles.emptyEmoji}>🎉</Text>
          </View>
          <Text style={styles.emptyTitle}>{REVIEW_TEXTS.noWordsToReview}</Text>
          <Text style={styles.emptySubtitle}>
            {REVIEW_TEXTS.addWordsToStart}
          </Text>
          <TouchableOpacity style={styles.backButtonLarge} onPress={handleBack}>
            <Text style={styles.backButtonLargeText}>{REVIEW_TEXTS.goBack}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (completed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <View style={styles.completedCard}>
            <View style={styles.completedIconBg}>
              <Text style={styles.completedEmoji}>🎉</Text>
            </View>
            <Text style={styles.completedTitle}>{REVIEW_TEXTS.amazing}</Text>
            <Text style={styles.completedSubtitle}>
              {REVIEW_TEXTS.reviewedAllWords.replace('{count}', String(words.length))}
            </Text>
          </View>

          <TouchableOpacity style={styles.doneButton} onPress={handleBack}>
            <Text style={styles.doneButtonText}>{REVIEW_TEXTS.continueBtn}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backIcon}>✕</Text>
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <Text style={styles.progressText}>
          {currentIndex + 1}/{words.length}
        </Text>
      </View>

      {/* Card */}
      <View style={styles.cardContainer}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                { translateX: position.x },
                { rotate: getCardRotation() },
              ],
              opacity: cardOpacity,
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Image */}
          {currentWord.imageUrl && currentWord.imageUrl.trim() !== '' ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setImageViewerVisible(true)}
            >
              <Image
                source={{ uri: currentWord.imageUrl }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <View style={[styles.cardImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLighter }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {/* Question or Answer */}
          {!revealed ? (
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>{REVIEW_TEXTS.whatIsThis}</Text>
              <TouchableOpacity style={styles.revealButton} onPress={handleReveal}>
                <Text style={styles.revealButtonText}>{REVIEW_TEXTS.tapToReveal}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Animated.View
              style={[
                styles.answerContainer,
                {
                  opacity: revealAnim,
                  transform: [
                    {
                      translateY: revealAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.wordRow}>
                <Text style={styles.wordText}>{currentWord.word}</Text>
                <SpeakButton audioUrl={currentWord.audioUrl} text={currentWord.word} size="small" />
              </View>
              <Text style={styles.definitionText}>{currentWord.meanings[0]?.definition || REVIEW_TEXTS.noDefinition}</Text>
            </Animated.View>
          )}
        </Animated.View>
      </View>

      {/* Action Buttons */}
      {revealed && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.forgotButton]}
            onPress={() => handleButtonPress(false)}
          >
            <Text style={styles.forgotButtonText}>{REVIEW_TEXTS.forgot}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rememberedButton]}
            onPress={() => handleButtonPress(true)}
          >
            <Text style={styles.rememberedButtonText}>{REVIEW_TEXTS.gotIt}</Text>
          </TouchableOpacity>
        </View>
      )}

      {currentWord && (
        <ImageViewerModal
          visible={imageViewerVisible}
          imageUrl={currentWord.imageUrl}
          onClose={() => setImageViewerVisible(false)}
          allowEdit={false}
          initialQuery={currentWord.word}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  // Claymorphism loading icon - floating 3D pill with inner highlight
  loadingIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.cardSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    shadowColor: colors.shadowOuter,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  loadingEmoji: {
    fontSize: 36,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 16,
  },
  // Claymorphism back button - soft clay with inner highlight
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    shadowColor: colors.shadowOuter,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  backIcon: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
  progressContainer: {
    flex: 1,
  },
  // Claymorphism progress bar - soft rounded with inner shadow
  progressBar: {
    height: 10,
    backgroundColor: colors.backgroundSoft,
    borderRadius: 5,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.shadowInnerLight,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    minWidth: 40,
    textAlign: 'right',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  // Claymorphism card - floating 3D clay tile with soft shadows
  card: {
    width: SCREEN_WIDTH - 48,
    backgroundColor: colors.cardSurface,
    borderRadius: 28,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    shadowColor: colors.shadowOuter,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 12,
  },
  cardImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.backgroundSoft,
  },
  questionContainer: {
    padding: 28,
    alignItems: 'center',
  },
  questionText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 24,
  },
  // Claymorphism reveal button - gradient fill with clay shadow
  revealButton: {
    paddingVertical: 18,
    paddingHorizontal: 44,
    borderRadius: 50,
    backgroundColor: colors.primary,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  revealButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '700',
  },
  answerContainer: {
    padding: 24,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  wordText: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  definitionText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 36,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
  },
  // Claymorphism forgot button - soft clay with debossed effect
  forgotButton: {
    backgroundColor: colors.cardSurface,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.shadowInnerLight,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    shadowColor: colors.shadowOuter,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  forgotButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  // Claymorphism remembered button - gradient fill with colored shadow
  rememberedButton: {
    backgroundColor: colors.success,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  rememberedButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  // Claymorphism empty icon - floating 3D pill
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.cardSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    shadowColor: colors.shadowOuter,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  emptyEmoji: {
    fontSize: 44,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  // Claymorphism large button - pill shape with clay shadow
  backButtonLarge: {
    paddingVertical: 18,
    paddingHorizontal: 48,
    backgroundColor: colors.primary,
    borderRadius: 50,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  backButtonLargeText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  // Claymorphism completed card - floating 3D clay tile
  completedCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: 28,
    padding: 40,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    shadowColor: colors.shadowOuter,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 12,
  },
  // Claymorphism completed icon - floating 3D pill
  completedIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    shadowColor: colors.shadowOuter,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  completedEmoji: {
    fontSize: 48,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Claymorphism done button - pill shape with clay shadow
  doneButton: {
    width: '100%',
    paddingVertical: 18,
    backgroundColor: colors.primary,
    borderRadius: 50,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});
