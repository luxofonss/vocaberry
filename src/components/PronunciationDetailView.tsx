import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { getPronunciationColor } from '../utils/pronunciationUtils';
import { PronunciationFeedbackText } from './PronunciationFeedbackText';

export interface PronunciationWord {
     word: string;
     accuracyScore: number;
     errorType: string;
     syllables: Array<{
          syllable: string;
          actualSyllable?: string;
          grapheme?: string;
          accuracyScore: number;
          phonemes: Array<{
               phoneme: string;
               actualPhoneme?: string;
               accuracyScore: number;
          }> | null;
     }> | null;
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
     const navigation = useNavigation<any>();
     const [expandedWord, setExpandedWord] = React.useState<string | null>(null);

     const handlePhonemePress = (phoneme: string) => {
          // Navigate to IpaPractice with the phoneme parameter
          navigation.navigate('IpaPractice', { initialPhoneme: phoneme });
     };

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

     const renderWordAnalysis = (word: PronunciationWord, idx: number) => {
          const isOmission = word.errorType === 'Omission';
          const isInsertion = word.errorType === 'Insertion';

          return (
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

                    {/* Omission: Word was skipped */}
                    {isOmission && (
                         <View style={styles.errorMessageContainer}>
                              <Ionicons name="alert-circle-outline" size={16} color="#F59E0B" />
                              <Text style={styles.errorMessageText}>
                                   You didn't pronounce this word
                              </Text>
                         </View>
                    )}

                    {/* Insertion: Extra word */}
                    {isInsertion && (
                         <View style={styles.errorMessageContainer}>
                              <Ionicons name="add-circle-outline" size={16} color="#8B5CF6" />
                              <Text style={styles.errorMessageText}>
                                   This word was not in the original text
                              </Text>
                         </View>
                    )}

                    {/* Pronunciation details for None and Mispronunciation */}
                    {!isOmission && !isInsertion && word.syllables && word.syllables.length > 0 && (
                         <View style={styles.wordPronunciationCard}>
                              {/* IPA with colors + Actual IPA */}
                              <View style={styles.ipaRow}>
                                   {/* Expected IPA with colors */}
                                   <View style={styles.ipaContainer}>
                                        <Text style={styles.ipaSlash}>/</Text>
                                        {word.syllables.map((syllable, sIdx) =>
                                             syllable.phonemes?.map((phoneme, pIdx) => (
                                                  <TouchableOpacity
                                                       key={`${sIdx}-${pIdx}`}
                                                       onPress={() => handlePhonemePress(phoneme.phoneme)}
                                                  >
                                                       <Text
                                                            style={[
                                                                 styles.ipaPhoneme,
                                                                 { color: getPronunciationColor(phoneme.accuracyScore) }
                                                            ]}
                                                       >
                                                            {phoneme.phoneme}
                                                       </Text>
                                                  </TouchableOpacity>
                                             ))
                                        )}
                                        <Text style={styles.ipaSlash}>/</Text>
                                   </View>

                                   {/* Arrow + Actual IPA */}
                                   <Text style={styles.ipaArrow}>→</Text>
                                   <View style={styles.ipaContainer}>
                                        <Text style={styles.ipaSlash}>/</Text>
                                        {word.syllables.map((syllable, sIdx) =>
                                             syllable.phonemes?.map((phoneme, pIdx) => (
                                                  <Text
                                                       key={`${sIdx}-${pIdx}`}
                                                       style={styles.ipaPhoneme}
                                                  >
                                                       {phoneme.actualPhoneme || phoneme.phoneme}
                                                  </Text>
                                             ))
                                        )}
                                        <Text style={styles.ipaSlash}>/</Text>
                                   </View>

                                   {/* Info button */}
                                   <TouchableOpacity
                                        style={styles.infoButton}
                                        onPress={() => {
                                             // Toggle detailed view for this word
                                             const wordKey = `word-${word.word}`;
                                             setExpandedWord(expandedWord === wordKey ? null : wordKey);
                                        }}
                                   >
                                        <Ionicons
                                             name={expandedWord === `word-${word.word}` ? "close-circle" : "information-circle"}
                                             size={20}
                                             color={colors.primary}
                                        />
                                   </TouchableOpacity>
                              </View>

                              {/* Detailed popup/table - only show when expanded */}
                              {expandedWord === `word-${word.word}` && (
                                   <View style={styles.detailedPopup}>
                                        <Text style={styles.popupTitle}>Detailed Analysis</Text>

                                        <View style={styles.phonemeTable}>
                                             {/* Row 1: Expected */}
                                             <View style={styles.phonemeTableRow}>
                                                  <Text style={styles.phonemeTableLabel}>Expected:</Text>
                                                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.phonemeTableCells}>
                                                       {word.syllables.map((syllable, sIdx) =>
                                                            syllable.phonemes?.map((phoneme, pIdx) => (
                                                                 <TouchableOpacity
                                                                      key={`${sIdx}-${pIdx}`}
                                                                      style={styles.phonemeTableCell}
                                                                      onPress={() => handlePhonemePress(phoneme.phoneme)}
                                                                 >
                                                                      <Text style={[styles.phonemeTableText, { color: getPronunciationColor(phoneme.accuracyScore) }]}>
                                                                           /{phoneme.phoneme}/
                                                                      </Text>
                                                                 </TouchableOpacity>
                                                            ))
                                                       )}
                                                  </ScrollView>
                                             </View>

                                             {/* Row 2: Actual */}
                                             <View style={styles.phonemeTableRow}>
                                                  <Text style={styles.phonemeTableLabel}>Actual:</Text>
                                                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.phonemeTableCells}>
                                                       {word.syllables.map((syllable, sIdx) =>
                                                            syllable.phonemes?.map((phoneme, pIdx) => (
                                                                 <TouchableOpacity
                                                                      key={`${sIdx}-${pIdx}`}
                                                                      style={styles.phonemeTableCell}
                                                                      onPress={() => handlePhonemePress(phoneme.phoneme)}
                                                                 >
                                                                      <Text style={[
                                                                           styles.phonemeTableText,
                                                                           {
                                                                                color: phoneme.actualPhoneme && phoneme.actualPhoneme !== phoneme.phoneme
                                                                                     ? '#F59E0B'
                                                                                     : getPronunciationColor(phoneme.accuracyScore)
                                                                           }
                                                                      ]}>
                                                                           /{phoneme.actualPhoneme || phoneme.phoneme}/
                                                                      </Text>
                                                                 </TouchableOpacity>
                                                            ))
                                                       )}
                                                  </ScrollView>
                                             </View>

                                             {/* Row 3: Scores */}
                                             <View style={styles.phonemeTableRow}>
                                                  <Text style={styles.phonemeTableLabel}>Score:</Text>
                                                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.phonemeTableCells}>
                                                       {word.syllables.map((syllable, sIdx) =>
                                                            syllable.phonemes?.map((phoneme, pIdx) => (
                                                                 <TouchableOpacity
                                                                      key={`${sIdx}-${pIdx}`}
                                                                      style={styles.phonemeTableCell}
                                                                      onPress={() => handlePhonemePress(phoneme.phoneme)}
                                                                 >
                                                                      <Text style={[styles.phonemeTableScore, { color: getPronunciationColor(phoneme.accuracyScore) }]}>
                                                                           {Math.round(phoneme.accuracyScore)}
                                                                      </Text>
                                                                 </TouchableOpacity>
                                                            ))
                                                       )}
                                                  </ScrollView>
                                             </View>
                                        </View>
                                   </View>
                              )}
                         </View>
                    )}
               </View>
          );
     };

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
     errorMessageContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          backgroundColor: '#FEF3C7',
          borderRadius: borderRadius.sm,
          marginTop: spacing.xs,
     },
     errorMessageText: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.textSecondary,
          flex: 1,
     },
     syllablesContainer: {
          gap: spacing.md,
          marginTop: spacing.xs,
          paddingLeft: spacing.md,
          borderLeftWidth: 2,
          borderLeftColor: '#E2E8F0',
     },
     wordPronunciationCard: {
          marginTop: spacing.xs,
          gap: spacing.xs,
     },
     wordIPA: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.textSecondary,
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
          fontStyle: 'italic',
     },
     ipaRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          flexWrap: 'wrap',
     },
     ipaContainer: {
          flexDirection: 'row',
          alignItems: 'center',
     },
     ipaSlash: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.textSecondary,
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
     },
     ipaPhoneme: {
          fontSize: 14,
          fontWeight: '700',
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
     },
     ipaArrow: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.textSecondary,
          marginHorizontal: 4,
     },
     infoButton: {
          padding: 4,
          marginLeft: 4,
     },
     detailedPopup: {
          marginTop: spacing.md,
          padding: spacing.md,
          backgroundColor: '#F8F9FE',
          borderRadius: borderRadius.md,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          gap: spacing.sm,
     },
     popupTitle: {
          fontSize: 12,
          fontWeight: '700',
          color: colors.textPrimary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
     },
     syllableItem: {
          gap: spacing.xs,
     },
     syllableHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
     },
     syllableCompactHeader: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.sm,
     },
     graphemeText: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.textPrimary,
          marginBottom: 2,
     },
     syllableText: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.textSecondary,
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
     },
     syllableScore: {
          fontSize: 12,
          fontWeight: '700',
     },
     actualSyllableText: {
          fontSize: 11,
          fontWeight: '500',
          color: colors.textSecondary,
          fontStyle: 'italic',
          marginTop: 2,
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
     },
     actualSyllableTextInline: {
          fontSize: 12,
          fontWeight: '500',
          color: '#F59E0B',
          fontStyle: 'italic',
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
     },
     phonemesRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.xs,
          marginTop: spacing.xs,
     },
     phonemesCompactRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 6,
          marginTop: spacing.xs,
          paddingLeft: spacing.sm,
     },
     phonemeChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: borderRadius.sm,
     },
     phonemeCompactChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: borderRadius.sm,
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.05)',
     },
     phonemeText: {
          fontSize: 12,
          fontWeight: '600',
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
     },
     phonemeCompactText: {
          fontSize: 11,
          fontWeight: '600',
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
     },
     phonemeScore: {
          fontSize: 10,
          fontWeight: '700',
     },
     phonemeCompactScore: {
          fontSize: 9,
          fontWeight: '700',
          marginLeft: 4,
     },
     actualPhonemeText: {
          fontSize: 9,
          fontWeight: '500',
          color: colors.textSecondary,
          fontStyle: 'italic',
          marginTop: 1,
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
     },
     phonemeActualText: {
          fontSize: 10,
          fontWeight: '500',
          color: '#F59E0B',
          fontStyle: 'italic',
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
          marginLeft: 4,
     },
     // Table-based layout styles
     syllableTableCard: {
          backgroundColor: 'transparent',
          padding: spacing.sm,
          paddingHorizontal: 0,
          borderRadius: borderRadius.sm,
          gap: spacing.xs,
     },
     syllableTableHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
     },
     syllableGrapheme: {
          fontSize: 14,
          fontWeight: '700',
          color: colors.textPrimary,
     },
     syllableScoreCompact: {
          fontSize: 13,
          fontWeight: '800',
     },
     phonemeTable: {
          gap: 4,
     },
     phonemeTableRow: {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 32,
     },
     phonemeTableLabel: {
          fontSize: 10,
          fontWeight: '700',
          color: colors.textSecondary,
          width: 60,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
     },
     phonemeTableCells: {
          flexDirection: 'row',
          gap: 4,
          paddingRight: 10,
     },
     phonemeTableCell: {
          minWidth: 40,
          height: 32,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 4,
          backgroundColor: '#F1F5F9',
          borderRadius: 6,
     },
     phonemeTableText: {
          fontSize: 13,
          fontWeight: '700',
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
          textAlign: 'center',
     },
     phonemeTableScore: {
          fontSize: 12,
          fontWeight: '800',
          textAlign: 'center',
     },
});
