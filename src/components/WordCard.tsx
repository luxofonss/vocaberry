// WordCard Component - Claymorphism 3D Clay Design

import React, { useEffect, useState, useRef, useCallback, memo, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { colors } from '../theme/colors';
import { Word } from '../types';
import { EventBus } from '../services/EventBus';
import { calculateCardWidth, isWordLearned } from '../utils';
import { getDisplayImageUrl, isValidImageUrl } from '../utils/imageUtils';
import { spacing, borderRadius } from '../theme';
import { shadows } from '../theme/shadows';
import { SkeletonLoader } from './SkeletonLoader';
import { SpeechService } from '../services/SpeechService';

// Grid configuration
const GRID_CONFIG = {
  standard: { columns: 2, sidePadding: spacing.screenPadding, gap: spacing.itemGap },
  compact: { columns: 3, sidePadding: spacing.screenPadding, gap: spacing.itemGap },
} as const;

type CardVariant = 'standard' | 'compact';

interface WordCardProps {
  word: Word;
  onPress: () => void;
  variant?: CardVariant;
}

interface ImageUpdateEvent {
  wordId: string;
  word: Word;
}

const WordCardComponent: React.FC<WordCardProps> = ({
  word: originalWord,
  onPress,
  variant = 'standard'
}) => {
  const [word, setWord] = useState(originalWord);
  const [isPressed, setIsPressed] = useState(false);
  const scaleValue = useRef(new Animated.Value(1)).current;

  const isCompact = variant === 'compact';
  const cardWidth = useMemo(() => calculateCardWidth(GRID_CONFIG[variant]), [variant]);

  useEffect(() => {
    setWord(originalWord);
  }, [originalWord]);

  // Listen for live update
  useEffect(() => {
    const onImageUpdate = ({ wordId, word: updated }: ImageUpdateEvent) => {
      if (wordId === word.id) setWord(updated);
    };

    EventBus.on('wordImageUpdated', onImageUpdate);
    return () => {
      EventBus.off('wordImageUpdated', onImageUpdate);
    };
  }, [word.id]);

  const isLearned = useMemo(() => isWordLearned(word.reviewCount), [word.reviewCount]);

  // Use getDisplayImageUrl for priority logic: customImageUrl > imageUrl
  // Requirements: 7.1, 7.2
  const displayImageUrl = useMemo(() => getDisplayImageUrl(word), [word]);
  const hasValidImage = useMemo(() => isValidImageUrl(displayImageUrl), [displayImageUrl]);

  const handlePressIn = useCallback(() => {
    setIsPressed(true);
    Animated.spring(scaleValue, {
      toValue: 0.94,
      useNativeDriver: true,
      tension: 100,
      friction: 5
    }).start();
  }, [scaleValue]);

  const handlePressOut = useCallback(() => {
    setIsPressed(false);
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 5
    }).start();
  }, [scaleValue]);

  const handleAudioPress = useCallback((e: any) => {
    e.stopPropagation(); // Prevent card press event
    if (word.audioUrl && word.word) {
      SpeechService.speakWord(word.word);
    }
  }, [word.audioUrl, word.word]);

  const containerStyle = useMemo(() => [
    styles.container,
    { width: cardWidth, transform: [{ scale: scaleValue }] }
  ], [cardWidth, scaleValue]);

  return (
    <Animated.View style={containerStyle}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchable}
      >
        <View style={[
          styles.imageContainer,
          isPressed && styles.imageContainerPressed
        ]}>
          {!hasValidImage ? (
            <SkeletonLoader width="100%" height="100%" borderRadius={borderRadius.clayCard} />
          ) : (
            <Image
              source={{ uri: displayImageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          {isLearned && (
            <View style={styles.learnedBadge}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>
          )}
        </View>

        <View style={styles.textContainer}>
          <Text
            style={[styles.wordLabel, isCompact && styles.wordLabelCompact]}
            numberOfLines={1}
          >
            {word.word}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Memoize component to prevent unnecessary re-renders
export const WordCard = memo(WordCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.word.id === nextProps.word.id &&
    prevProps.word.imageUrl === nextProps.word.imageUrl &&
    prevProps.word.customImageUrl === nextProps.word.customImageUrl &&
    prevProps.word.isUsingCustomImage === nextProps.word.isUsingCustomImage &&
    prevProps.word.reviewCount === nextProps.word.reviewCount &&
    prevProps.word.word === nextProps.word.word &&
    prevProps.variant === nextProps.variant
  );
});

// Style constants for claymorphism
const STYLES = {
  learnedBadgeSize: 24,
  textColor: '#1f2937',
} as const;

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  touchable: {
    width: '100%',
  },
  // Claymorphism image container - clayMedium shadow, increased border radius
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.xxxl,
    backgroundColor: colors.cardSurface,
    overflow: 'hidden',
    position: 'relative',
    // Inner highlight for 3D depth effect
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.clayMedium,
  },
  // Pressed state - compressed clay effect
  imageContainerPressed: {
    ...shadows.clayPressed,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  // Floating 3D learned badge - clayBadge radius, claySoft shadow, inner highlight
  learnedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: STYLES.learnedBadgeSize,
    height: STYLES.learnedBadgeSize,
    borderRadius: borderRadius.clayBadge,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    // Inner highlight for 3D pill effect
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.claySoft,
  },
  checkIcon: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Audio icon overlay - translucent grey circle bottom right
  audioIconContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(156, 163, 175, 0.85)', // Translucent grey per design
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.subtle,
  },
  audioIcon: {
    fontSize: 16,
  },
  textContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  wordLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: STYLES.textColor,
    textAlign: 'center',
  },
  wordLabelCompact: {
    fontSize: 14,
  },
});