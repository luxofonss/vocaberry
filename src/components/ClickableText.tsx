import React, { useState } from 'react';
import { Text, StyleSheet, View, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { colors, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ClickableTextProps {
  text: string;
  onWordPress: (word: string) => void;
  style?: any;
  feedback?: string; // String of '1' (correct) and '0' (incorrect)
  numberOfLines?: number;
}

export const ClickableText: React.FC<ClickableTextProps> = ({ text, onWordPress, style, feedback, numberOfLines }) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

  // Split text into words/punctuation
  const parts = text.split(/(\s+|[,.!?;"'])/);

  let charOffset = 0;

  // Determine if we should use a specific clickable color or inherit
  const isWhiteText = style?.color === '#ffffff' || style?.color === 'white' || style?.color === colors.white;
  const activeClickableColor = isWhiteText ? colors.white : colors.textPrimary;

  const handleWordPress = (word: string, event: any) => {
    const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/gi, '');
    if (!cleanWord) return;

    // Get touch coordinates for positioning
    const { pageX, pageY } = event.nativeEvent;

    // Adjust position to be above the touch point
    // We try to center it horizontally relative to touch
    let x = pageX - 60;
    let y = pageY - 70;

    // Basic boundary checks
    if (x < 10) x = 10;
    if (x > SCREEN_WIDTH - 130) x = SCREEN_WIDTH - 130;
    if (y < 40) y = pageY + 20; // Show below if too high

    setSelectedWord(cleanWord);
    setPopupPos({ x, y });
    setPopupVisible(true);
  };

  const executeLookup = () => {
    if (selectedWord) {
      onWordPress(selectedWord);
    }
    setPopupVisible(false);
    setSelectedWord(null);
  };

  // Extract layout styles from the passed style prop to apply to the container
  const flattenedStyle = StyleSheet.flatten(style);
  const containerStyle = flattenedStyle?.flex !== undefined ? { flex: flattenedStyle.flex } : undefined;

  return (
    <View style={containerStyle}>
      <Text style={[styles.baseText, style]} numberOfLines={numberOfLines}>
        {parts.map((part, index) => {
          const isWord = !/^(\s+|[,.!?;"'])$/.test(part);
          const partLength = part.length;
          const currentOffset = charOffset;
          charOffset += partLength;

          if (!isWord) {
            return (
              <React.Fragment key={index}>
                {part.split('').map((char, charIdx) => {
                  const globalIdx = currentOffset + charIdx;
                  const isCorrect = feedback ? feedback[globalIdx] === '1' : null;
                  return (
                    <Text
                      key={charIdx}
                      style={[
                        isCorrect === true && char !== ' ' && { color: colors.success },
                        isCorrect === false && char !== ' ' && { color: colors.error }
                      ]}
                    >
                      {char}
                    </Text>
                  );
                })}
              </React.Fragment>
            );
          }

          return (
            <Text
              key={index}
              onPress={(e) => handleWordPress(part, e)}
              style={[styles.clickableWord, { color: activeClickableColor }]}
            >
              {part.split('').map((char, charIdx) => {
                const globalIdx = currentOffset + charIdx;
                const isCorrect = feedback ? feedback[globalIdx] === '1' : null;

                return (
                  <Text
                    key={charIdx}
                    style={[
                      isCorrect === true && char !== ' ' && { color: colors.success },
                      isCorrect === false && char !== ' ' && { color: colors.error }
                    ]}
                  >
                    {char}
                  </Text>
                );
              })}
            </Text>
          );
        })}
      </Text>

      <Modal
        visible={popupVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPopupVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPopupVisible(false)}
        >
          <View style={[styles.popupContainer, { top: popupPos.y, left: popupPos.x }]}>
            <TouchableOpacity
              style={styles.lookupButton}
              onPress={executeLookup}
            >
              <Ionicons name="search-outline" size={16} color={colors.textPrimary} />
              <Text style={styles.lookupText}>Lookup "{selectedWord}"</Text>
            </TouchableOpacity>
            <View style={styles.popupTriangle} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  baseText: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  clickableWord: {
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  popupContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: 150,
  },
  lookupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    ...shadows.clayMedium,
  },
  lookupText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  popupTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.warning,
    marginTop: -1,
  },
});