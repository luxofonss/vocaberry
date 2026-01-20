import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { getPronunciationColor } from '../utils/pronunciationUtils';
import { PronunciationFeedbackText } from './PronunciationFeedbackText';

interface PronunciationWord {
     word: string;
     accuracyScore: number;
     errorType: string;
     syllables: Array<{
          syllable: string;
          accuracyScore: number;
          phonemes: Array<{
               phoneme: string;
               accuracyScore: number;
          }> | null;
     }>;
}

interface PronunciationDetailViewProps {
     targetText?: string; // Văn bản gốc cần đọc
     recognizedText: string; // Văn bản AI nghe được
     accuracyScore: number;
     fluencyScore: number;
     completenessScore: number;
     pronScore: number;
     words: PronunciationWord[];
     onClose?: () => void;
     compact?: boolean;
}

/**
 * Hiển thị chi tiết phát âm.
 * Đã cập nhật để hiện Target Text với màu sắc chi tiết từng chữ cái ở đầu bảng kết quả.
 */
export const PronunciationDetailView: React.FC<PronunciationDetailViewProps> = ({
     targetText,
     recognizedText,
     accuracyScore,
     fluencyScore,
     completenessScore,
     pronScore,
     words,
     onClose,
     compact = false
}) => {

     const getErrorTypeColor = (errorType: string) => {
          switch (errorType) {
               case 'None': return colors.success;
               case 'Mispronunciation': return colors.error;
               case 'Omission': return '#F59E0B';
               case 'Insertion': return '#8B5CF6';
               default: return colors.textSecondary;
          }
     };

     const ScoreCard = ({ label, score, icon }: { label: string; score: number; icon: string }) => (
          <View style={styles.scoreCard}>
               <Ionicons name={icon as any} size={20} color={getPronunciationColor(score)} />
               <Text style={styles.scoreCardValue}>{Math.round(score)}%</Text>
               <Text style={styles.scoreCardLabel}>{label}</Text>
          </View>
     );

     const renderWordAnalysis = (word: PronunciationWord, idx: number) => (
          <View key={idx} style={styles.wordItem}>
               <View style={styles.wordHeader}>
                    <PronunciationFeedbackText
                         text={word.word}
                         feedback={{ words: [word] }}
                         style={styles.wordTitleText}
                    />
                    <View style={[styles.errorBadge, { backgroundColor: getErrorTypeColor(word.errorType) + '20' }]}>
                         <Text style={[styles.errorText, { color: getErrorTypeColor(word.errorType) }]}>
                              {word.errorType}
                         </Text>
                    </View>
                    <Text style={[styles.wordScoreTotal, { color: getPronunciationColor(word.accuracyScore) }]}>
                         {Math.round(word.accuracyScore)}%
                    </Text>
               </View>

               {word.syllables && word.syllables.length > 0 && (
                    <View style={styles.syllablesContainer}>
                         {word.syllables.map((syllable, sIdx) => (
                              <View key={sIdx} style={styles.syllableItem}>
                                   <View style={styles.syllableHeader}>
                                        <Text style={styles.syllableText}>
                                             /
                                             {syllable.phonemes ? syllable.phonemes.map((p, pIdx) => (
                                                  <Text key={pIdx} style={{ color: getPronunciationColor(p.accuracyScore) }}>
                                                       {p.phoneme}
                                                  </Text>
                                             )) : (
                                                  <Text style={{ color: getPronunciationColor(syllable.accuracyScore) }}>
                                                       {syllable.syllable}
                                                  </Text>
                                             )}
                                             /
                                        </Text>
                                        <Text style={[styles.syllableScore, { color: getPronunciationColor(syllable.accuracyScore) }]}>
                                             {Math.round(syllable.accuracyScore)}%
                                        </Text>
                                   </View>
                                   {syllable.phonemes && syllable.phonemes.length > 0 && (
                                        <View style={styles.phonemesRow}>
                                             {syllable.phonemes.map((phoneme, pIdx) => (
                                                  <View
                                                       key={pIdx}
                                                       style={[
                                                            styles.phonemeChip,
                                                            { backgroundColor: getPronunciationColor(phoneme.accuracyScore) + '20' }
                                                       ]}
                                                  >
                                                       <Text style={[styles.phonemeText, { color: getPronunciationColor(phoneme.accuracyScore) }]}>
                                                            {phoneme.phoneme}
                                                       </Text>
                                                       <Text style={[styles.phonemeScore, { color: getPronunciationColor(phoneme.accuracyScore) }]}>
                                                            {Math.round(phoneme.accuracyScore)}
                                                       </Text>
                                                  </View>
                                             ))}
                                        </View>
                                   )}
                              </View>
                         ))}
                    </View>
               )}
          </View>
     );

     const Content = () => (
          <>
               <View style={styles.scoresRow}>
                    <ScoreCard label="Accuracy" score={accuracyScore} icon="checkmark-circle" />
                    <ScoreCard label="Fluency" score={fluencyScore} icon="speedometer" />
                    <ScoreCard label="Complete" score={completenessScore} icon="list-circle" />
                    <ScoreCard label="Overall" score={pronScore} icon="star" />
               </View>

               <View style={styles.wordsSection}>
                    <Text style={styles.sectionTitle}>Detail analysis</Text>
                    {words.map((word, idx) => renderWordAnalysis(word, idx))}
               </View>
          </>
     );

     if (compact) {
          return (
               <View style={styles.compactContainer}>
                    <Content />
               </View>
          );
     }

     return (
          <View style={styles.modalContainer}>
               <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Pronunciation Analysis</Text>
                    {onClose && (
                         <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                              <Ionicons name="close" size={24} color={colors.textPrimary} />
                         </TouchableOpacity>
                    )}
               </View>
               <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                    <Content />
               </ScrollView>
          </View>
     );
};

const styles = StyleSheet.create({
     compactContainer: {
          gap: spacing.md,
     },
     modalContainer: {
          flex: 1,
          backgroundColor: colors.white,
     },
     modalHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: '#F1F5F9',
     },
     modalTitle: {
          fontSize: 20,
          fontWeight: '800',
          color: colors.textPrimary,
     },
     closeButton: {
          padding: spacing.xs,
     },
     modalContent: {
          flex: 1,
          padding: spacing.lg,
     },
     targetTextCard: {
          backgroundColor: '#F0FDF4',
          padding: spacing.lg,
          borderRadius: borderRadius.lg,
          marginBottom: spacing.md,
          borderWidth: 1,
          borderColor: '#DCFCE7',
          ...shadows.claySoft,
     },
     targetTextDisplay: {
          fontSize: 22,
          fontWeight: '800',
          lineHeight: 30,
     },
     recognizedTextCard: {
          backgroundColor: '#F8F9FE',
          padding: spacing.lg,
          borderRadius: borderRadius.lg,
          marginBottom: spacing.lg,
     },
     cardLabel: {
          fontSize: 10,
          fontWeight: '700',
          color: colors.textSecondary,
          marginBottom: spacing.xs,
          textTransform: 'uppercase',
          letterSpacing: 1,
     },
     recognizedText: {
          fontSize: 18,
          fontWeight: '600',
          color: colors.textPrimary,
          lineHeight: 26,
          fontStyle: 'italic',
     },
     scoresRow: {
          flexDirection: 'row',
          gap: spacing.sm,
          marginBottom: spacing.lg,
     },
     scoreCard: {
          flex: 1,
          backgroundColor: '#F8F9FE',
          padding: spacing.md,
          borderRadius: borderRadius.md,
          alignItems: 'center',
          gap: 4,
          ...shadows.claySoft,
     },
     scoreCardValue: {
          fontSize: 16,
          fontWeight: '800',
          color: colors.textPrimary,
     },
     scoreCardLabel: {
          fontSize: 9,
          fontWeight: '600',
          color: colors.textSecondary,
          textTransform: 'uppercase',
     },
     wordsSection: {
          gap: spacing.md,
     },
     sectionTitle: {
          fontSize: 16,
          fontWeight: '700',
          color: colors.textPrimary,
          marginBottom: spacing.xs,
     },
     wordItem: {
          backgroundColor: '#F8F9FE',
          padding: spacing.md,
          borderRadius: borderRadius.md,
          gap: spacing.sm,
     },
     wordHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
     },
     wordTitleText: {
          fontSize: 16,
          fontWeight: '700',
          color: colors.textPrimary,
          flex: 1,
     },
     errorBadge: {
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: borderRadius.sm,
     },
     errorText: {
          fontSize: 11,
          fontWeight: '600',
     },
     wordScoreTotal: {
          fontSize: 14,
          fontWeight: '800',
     },
     syllablesContainer: {
          gap: spacing.md,
          marginTop: spacing.xs,
          paddingLeft: spacing.md,
          borderLeftWidth: 2,
          borderLeftColor: '#E2E8F0',
     },
     syllableItem: {
          gap: spacing.xs,
     },
     syllableHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
     },
     syllableText: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.textSecondary,
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
     },
     syllableScore: {
          fontSize: 12,
          fontWeight: '700',
     },
     phonemesRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.xs,
          marginTop: spacing.xs,
     },
     phonemeChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: borderRadius.sm,
     },
     phonemeText: {
          fontSize: 12,
          fontWeight: '600',
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
     },
     phonemeScore: {
          fontSize: 10,
          fontWeight: '700',
     },
});
