import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface ClickableTextProps {
  text: string;
  onWordPress: (word: string) => void;
  style?: any;
  feedback?: string; // String of '1' (correct) and '0' (incorrect)
  numberOfLines?: number;
}

export const ClickableText: React.FC<ClickableTextProps> = ({ text, onWordPress, style, feedback, numberOfLines }) => {
  // Split text into words/punctuation
  const parts = text.split(/(\s+|[,.!?;"'])/);

  let charOffset = 0;

  // Determine if we should use a specific clickable color or inherit
  // If the passed style has white color (e.g. user bubble), we should probably use white or a lighter tint
  const isWhiteText = style?.color === '#ffffff' || style?.color === 'white' || style?.color === colors.white;
  const activeClickableColor = isWhiteText ? colors.white : colors.primary;

  return (
    <Text style={[styles.baseText, style]} numberOfLines={numberOfLines}>
      {parts.map((part, index) => {
        const isWord = !/^(\s+|[,.!?;"'])$/.test(part);
        const partLength = part.length;
        const currentOffset = charOffset;
        charOffset += partLength;

        if (!isWord) {
          // Normal punctuation/spacing, but apply feedback color if available
          return (
            <React.Fragment key={index}>
              {part.split('').map((char, charIdx) => {
                const globalIdx = currentOffset + charIdx;
                const isCorrect = feedback ? feedback[globalIdx] === '1' : null;
                return (
                  <Text
                    key={charIdx}
                    style={[
                      isCorrect === true && char !== ' ' && { color: '#10B981' },
                      isCorrect === false && char !== ' ' && { color: '#EF4444' }
                    ]}
                  >
                    {char}
                  </Text>
                );
              })}
            </React.Fragment>
          );
        }

        // It's a word, make it clickable and handle feedback highlighting
        return (
          <Text
            key={index}
            onPress={() => onWordPress(part.toLowerCase().replace(/[^a-z0-9]/gi, ''))}
            style={[styles.clickableWord, { color: activeClickableColor }]}
          >
            {part.split('').map((char, charIdx) => {
              const globalIdx = currentOffset + charIdx;
              const isCorrect = feedback ? feedback[globalIdx] === '1' : null;

              return (
                <Text
                  key={charIdx}
                  style={[
                    isCorrect === true && char !== ' ' && { color: '#10B981' },
                    isCorrect === false && char !== ' ' && { color: '#EF4444' }
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
});