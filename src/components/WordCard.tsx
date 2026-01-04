// WordCard Component - Modern Minimal Design

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import { Word } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Logic for grid sizing - 20px side padding, 8px gap between cards
const SIDE_PADDING = 20;
const GAP = 8;
const CARD_WIDTH_STANDARD = (SCREEN_WIDTH - (SIDE_PADDING * 2) - GAP) / 2;
const CARD_WIDTH_COMPACT = (SCREEN_WIDTH - (SIDE_PADDING * 2) - (GAP * 2)) / 3;

import { EventBus } from '../services/EventBus';
import { ActivityIndicator } from 'react-native';

interface WordCardProps {
  word: Word;
  onPress: () => void;
  variant?: 'standard' | 'compact';
}

export const WordCard: React.FC<WordCardProps> = ({ word: originalWord, onPress, variant = 'standard' }) => {
  const [word, setWord] = useState(originalWord);
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const isCompact = variant === 'compact';
  const cardWidth = isCompact ? CARD_WIDTH_COMPACT : CARD_WIDTH_STANDARD;

  useEffect(() => {
    setWord(originalWord);
  }, [originalWord]);

  // Listen for live update
  useEffect(() => {
    function onImageUpdate({ wordId, word: updated }) {
      if (wordId === word.id) setWord(updated);
    }
    EventBus.on('wordImageUpdated', onImageUpdate);
    return () => { EventBus.off('wordImageUpdated', onImageUpdate); };
  }, [word.id]);

  // Custom logic for "learned" status
  const isLearned = word.reviewCount >= 5;

  const handlePressIn = () => {
    Animated.spring(scaleValue, { 
      toValue: 0.94, 
      useNativeDriver: true,
      tension: 100,
      friction: 5 
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, { 
      toValue: 1, 
      useNativeDriver: true,
      tension: 100,
      friction: 5 
    }).start();
  };

  return (
    <Animated.View style={[
      styles.container, 
      { width: cardWidth, transform: [{ scale: scaleValue }] }
    ]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchable}
      >
        {/* Image Container with Square Aspect Ratio and Soft Borders */}
        <View style={styles.imageContainer}>
          {!word.imageUrl || word.imageUrl.trim() === '' ? (
            <View style={[styles.image, {alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSoft}]}> 
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <Image
              source={{ uri: word.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          )}
          
          {/* Learned Badge (Checkmark) */}
          {isLearned && (
            <View style={styles.learnedBadge}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>
          )}
        </View>
        
        {/* Word Text below image */}
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

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  touchable: {
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1, // Keep it square
    borderRadius: 28, // rounded-3xl approx
    backgroundColor: colors.backgroundSoft,
    overflow: 'hidden',
    // Gradient effect emulation using background color
    position: 'relative',
    
    // Modern soft shadow
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
  learnedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4ade80', // green-400
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
    fontWeight: '600', // font-medium approx
    color: '#1f2937', // gray-800
    textAlign: 'center',
  },
  wordLabelCompact: {
    fontSize: 13,
  },
});
