import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface PronunciationFeedbackTextProps {
     text: string;
     feedback?: string; // String of '1' (correct) and '0' (incorrect)
     onWordPress?: (word: string) => void; // Optional - if provided, words become clickable
     style?: any;
     numberOfLines?: number;
}

/**
 * Normalizes text by removing punctuation and converting to lowercase
 * for comparison purposes
 */
const normalizeText = (text: string): string => {
     return text.toLowerCase().replace(/[,.!?;:"']/g, '');
};

/**
 * Component to display text with pronunciation feedback highlighting.
 * - Green text for correct pronunciation
 * - Red text for incorrect pronunciation (no background)
 * - Optionally supports clickable words for dictionary lookup
 */
export const PronunciationFeedbackText: React.FC<PronunciationFeedbackTextProps> = ({
     text,
     feedback,
     onWordPress,
     style,
     numberOfLines
}) => {
     // Split text into words/punctuation
     const parts = text.split(/(\s+|[,.!?;:"'])/);

     let charOffset = 0;

     // Determine if we should use a specific clickable color or inherit
     const isWhiteText = style?.color === '#ffffff' || style?.color === 'white' || style?.color === colors.white;
     const activeClickableColor = isWhiteText ? colors.white : colors.primary;

     // If no feedback provided, render as normal clickable text
     if (!feedback) {
          if (!onWordPress) {
               return <Text style={[styles.baseText, style]} numberOfLines={numberOfLines}>{text}</Text>;
          }

          // Clickable text without feedback
          return (
               <Text style={[styles.baseText, style]} numberOfLines={numberOfLines}>
                    {parts.map((part, index) => {
                         const isWord = !/^(\s+|[,.!?;:"'])$/.test(part);

                         if (!isWord) {
                              return <Text key={index}>{part}</Text>;
                         }

                         return (
                              <Text
                                   key={index}
                                   onPress={() => onWordPress(part.toLowerCase().replace(/[^a-z0-9]/gi, ''))}
                                   style={[styles.clickableWord, { color: activeClickableColor }]}
                              >
                                   {part}
                              </Text>
                         );
                    })}
               </Text>
          );
     }

     // Render with feedback highlighting
     return (
          <Text style={[styles.baseText, style]} numberOfLines={numberOfLines}>
               {parts.map((part, index) => {
                    const isWord = !/^(\s+|[,.!?;:"'])$/.test(part);
                    const partLength = part.length;
                    const currentOffset = charOffset;
                    charOffset += partLength;

                    if (!isWord) {
                         // Punctuation/spacing with feedback colors
                         return (
                              <React.Fragment key={index}>
                                   {part.split('').map((char, charIdx) => {
                                        const globalIdx = currentOffset + charIdx;
                                        const isCorrect = feedback[globalIdx] === '1';
                                        return (
                                             <Text
                                                  key={charIdx}
                                                  style={[
                                                       isCorrect && char !== ' ' && styles.correctChar,
                                                       !isCorrect && char !== ' ' && styles.incorrectChar
                                                  ]}
                                             >
                                                  {char}
                                             </Text>
                                        );
                                   })}
                              </React.Fragment>
                         );
                    }

                    // It's a word - handle feedback highlighting and optional clickability
                    const wordElement = (
                         <Text key={index}>
                              {part.split('').map((char, charIdx) => {
                                   const globalIdx = currentOffset + charIdx;
                                   const isCorrect = feedback[globalIdx] === '1';

                                   return (
                                        <Text
                                             key={charIdx}
                                             style={[
                                                  isCorrect && char !== ' ' && styles.correctChar,
                                                  !isCorrect && char !== ' ' && styles.incorrectChar
                                             ]}
                                        >
                                             {char}
                                        </Text>
                                   );
                              })}
                         </Text>
                    );

                    // If onWordPress is provided, make the word clickable
                    if (onWordPress) {
                         return (
                              <Text
                                   key={index}
                                   onPress={() => onWordPress(part.toLowerCase().replace(/[^a-z0-9]/gi, ''))}
                                   style={styles.clickableWord}
                              >
                                   {part.split('').map((char, charIdx) => {
                                        const globalIdx = currentOffset + charIdx;
                                        const isCorrect = feedback[globalIdx] === '1';

                                        return (
                                             <Text
                                                  key={charIdx}
                                                  style={[
                                                       isCorrect && char !== ' ' && styles.correctChar,
                                                       !isCorrect && char !== ' ' && styles.incorrectChar
                                                  ]}
                                             >
                                                  {char}
                                             </Text>
                                        );
                                   })}
                              </Text>
                         );
                    }

                    return wordElement;
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
     correctChar: {
          color: colors.success, // Green for correct
     },
     incorrectChar: {
          color: colors.error, // Red for incorrect, NO background
     },
});
