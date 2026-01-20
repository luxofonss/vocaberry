import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { getPronunciationColor } from '../utils/pronunciationUtils';

interface PronunciationFeedbackTextProps {
     text: string;
     feedback?: string | {
          words: Array<{
               word: string;
               accuracyScore: number;
               syllables?: Array<{
                    syllable: string;
                    accuracyScore: number;
               }>;
          }>;
     };
     onWordPress?: (word: string) => void;
     style?: any;
     numberOfLines?: number;
}

/**
 * Component hiển thị văn bản với màu sắc chi tiết đến từng chữ cái.
 * Tự động mapping Syllables -> Characters để lấy màu chính xác nhất.
 */
export const PronunciationFeedbackText: React.FC<PronunciationFeedbackTextProps> = ({
     text,
     feedback,
     onWordPress,
     style,
     numberOfLines
}) => {
     // Hàm map điểm số cho từng ký tự
     const getCharScores = (): (number | null)[] | undefined => {
          if (!feedback) return undefined;

          // Format cũ
          if (typeof feedback === 'string') {
               return feedback.split('').map(char => char === '1' ? 100 : 40);
          }

          // Format mới: Syllable mapping
          const parts = text.split(/(\s+|[,.!?;:\"'])/);
          const allCharScores: (number | null)[] = [];
          let wordIndex = 0;

          for (const part of parts) {
               const isWord = !/^(\s+|[,.!?;:\"'])$/.test(part);
               if (isWord && feedback.words[wordIndex]) {
                    const wordData = feedback.words[wordIndex];
                    let charScoresForWord: number[] = new Array(part.length).fill(wordData.accuracyScore);

                    if (wordData.syllables && wordData.syllables.length > 0) {
                         let wordLower = part.toLowerCase();
                         let currentPos = 0;

                         for (const syl of wordData.syllables) {
                              const sylText = syl.syllable.toLowerCase().replace(/[^a-z0-9]/gi, '');
                              if (!sylText) continue;

                              const foundIdx = wordLower.indexOf(sylText, currentPos);
                              if (foundIdx !== -1) {
                                   for (let i = 0; i < sylText.length; i++) {
                                        if (foundIdx + i < charScoresForWord.length) {
                                             charScoresForWord[foundIdx + i] = syl.accuracyScore;
                                        }
                                   }
                                   currentPos = foundIdx + sylText.length;
                              }
                         }
                    }
                    charScoresForWord.forEach(s => allCharScores.push(s));
                    wordIndex++;
               } else {
                    for (let i = 0; i < part.length; i++) {
                         allCharScores.push(null);
                    }
               }
          }
          return allCharScores;
     };

     const charScores = getCharScores();
     const parts = text.split(/(\s+|[,.!?;:\"'])/);
     let globalCharIndex = 0;

     return (
          <Text style={[styles.baseText, style]} numberOfLines={numberOfLines}>
               {parts.map((part, index) => {
                    const isWord = !/^(\s+|[,.!?;:\"'])$/.test(part);
                    const currentOffset = globalCharIndex;
                    globalCharIndex += part.length;

                    const renderedChars = part.split('').map((char, charIdx) => {
                         const score = charScores ? charScores[currentOffset + charIdx] : null;
                         const color = (score !== null && char !== ' ') ? getPronunciationColor(score) : undefined;

                         return (
                              <Text key={charIdx} style={color ? { color } : undefined}>
                                   {char}
                              </Text>
                         );
                    });

                    if (isWord && onWordPress) {
                         return (
                              <Text
                                   key={index}
                                   onPress={() => onWordPress(part.toLowerCase().replace(/[^a-z0-9]/gi, ''))}
                                   style={styles.clickableWord}
                              >
                                   {renderedChars}
                              </Text>
                         );
                    }

                    return <Text key={index}>{renderedChars}</Text>;
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
