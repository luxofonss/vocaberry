// WordCard Component - Modern Minimal Design

import React, { useEffect, useState, useRef, useCallback, memo, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import { Word } from '../types';
import { EventBus } from '../services/EventBus';
import { calculateCardWidth, isWordLearned, isValidImageUrl } from '../utils';
import { spacing } from '../theme';

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
  const hasValidImage = useMemo(() => isValidImageUrl(word.imageUrl), [word.imageUrl]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: 0.94,
      useNativeDriver: true,
      tension: 100,
      friction: 5
    }).start();
  }, [scaleValue]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 5
    }).start();
  }, [scaleValue]);

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
        <View style={styles.imageContainer}>
          {!hasValidImage ? (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <Image
              source={{ uri: word.imageUrl }}
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
    prevProps.word.reviewCount === nextProps.word.reviewCount &&
    prevProps.word.word === nextProps.word.word &&
    prevProps.variant === nextProps.variant
  );
});

// Style constants
const STYLES = {
  borderRadius: 28,
  learnedBadgeSize: 24,
  learnedBadgeColor: '#4ade80',
  textColor: '#1f2937',
} as const;

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  touchable: {
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: STYLES.borderRadius,
    backgroundColor: colors.backgroundSoft,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      }
    })
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSoft,
  },
  learnedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: STYLES.learnedBadgeSize,
    height: STYLES.learnedBadgeSize,
    borderRadius: STYLES.learnedBadgeSize / 2,
    backgroundColor: STYLES.learnedBadgeColor,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  checkIcon: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  textContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  wordLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: STYLES.textColor,
    textAlign: 'center',
  },
  wordLabelCompact: {
    fontSize: 13,
  },
});