import React, { useState } from 'react';
import { Text, StyleSheet, View, TouchableOpacity, Modal, Dimensions, ActivityIndicator } from 'react-native';
import { colors, shadows, borderRadius, spacing } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { PronunciationFeedbackText } from './PronunciationFeedbackText';
import { AiService } from '../services/AiService';
import { StorageService } from '../services/StorageService';
import { TranslateService } from '../services/TranslateService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ClickableTextProps {
  text: string;
  onWordPress: (word: string) => void;
  style?: any;
  feedback?: string | {
    words: Array<{
      word: string;
      accuracyScore: number;
      errorType: string;
      syllables?: Array<{ syllable: string; accuracyScore: number }>;
    }>;
  };
  numberOfLines?: number;
}

export const ClickableText: React.FC<ClickableTextProps> = ({ text, onWordPress, style, feedback, numberOfLines }) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

  // Translation State
  const [translation, setTranslation] = useState<string | null>(null);
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [mode, setMode] = useState<'MENU' | 'TRANSLATION' | 'LOOKUP'>('MENU');

  const handleWordPress = (word: string, event: any) => {
    const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/gi, '');
    if (!cleanWord) return;

    // Get touch coordinates
    const { pageX, pageY } = event.nativeEvent;

    // Adjust position to be above the touch point
    let x = pageX - 75; // Center horizontally (assuming width ~150)
    let y = pageY - 60; // Show above

    // Boundary checks
    if (x < 10) x = 10;
    if (x > SCREEN_WIDTH - 160) x = SCREEN_WIDTH - 160;
    if (y < 50) y = pageY + 30; // Show below if too close to top

    setSelectedWord(cleanWord);
    setPopupPos({ x, y });
    setMode('MENU');
    setTranslation(null);
    setPopupVisible(true);
  };

  const handleTranslate = async () => {
    if (!selectedWord) return;

    setMode('TRANSLATION');
    setLoadingTranslation(true);

    try {
      const targetLang = await StorageService.getMotherLanguage() || 'vi'; // Default to vietnamese if not set
      const result = await TranslateService.translate(selectedWord.trim(), 'en', targetLang);
      setTranslation(result);
    } catch (error) {
      setTranslation('Error translating');
    } finally {
      setLoadingTranslation(false);
    }
  };

  const executeLookup = async () => {
    if (!selectedWord) return;

    setMode('LOOKUP');
    setLoadingLookup(true);

    try {
      // Call the lookup function and wait for it
      await onWordPress(selectedWord);
    } finally {
      setLoadingLookup(false);
      setPopupVisible(false);
      setSelectedWord(null);
    }
  };

  // Close popup
  const closePopup = () => {
    setPopupVisible(false);
    setSelectedWord(null);
    setTranslation(null);
  };

  // Helper to close and reset only visual state
  const handleOverlayPress = () => closePopup();

  return (
    <View style={StyleSheet.flatten(style)?.flex !== undefined ? { flex: StyleSheet.flatten(style)?.flex } : undefined}>
      <PronunciationFeedbackText
        text={text}
        feedback={feedback}
        onWordPress={(word, event) => handleWordPress(word, event)}
        style={style}

        numberOfLines={numberOfLines}
      />

      <Modal
        visible={popupVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closePopup}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleOverlayPress}
        >
          <View style={[styles.popupContainer, { top: popupPos.y, left: popupPos.x }]}>

            {/* MODE: MENU SELECTION */}
            {mode === 'MENU' && (
              <View style={styles.menuContainer}>
                <TouchableOpacity style={styles.menuButton} onPress={handleTranslate}>
                  <Ionicons name="language" size={18} color={colors.white} />
                  <Text style={styles.menuText}>Trans</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.menuButton} onPress={executeLookup}>
                  <Ionicons name="book" size={18} color={colors.white} />
                  <Text style={styles.menuText}>Dict</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* MODE: TRANSLATION RESULT */}
            {mode === 'TRANSLATION' && (
              <View style={styles.translationContainer}>
                {loadingTranslation ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.translationText}>{translation}</Text>
                )}
              </View>
            )}

            {/* MODE: LOOKUP LOADING */}
            {mode === 'LOOKUP' && (
              <View style={styles.translationContainer}>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={[styles.translationText, { marginLeft: 8, fontSize: 12 }]}>Looking up...</Text>
              </View>
            )}

            <View style={styles.popupTriangle} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  popupContainer: {
    position: 'absolute',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 16,
  },
  menuContainer: {
    flexDirection: 'row',
    backgroundColor: colors.textPrimary, // Dark background
    borderRadius: borderRadius.lg,
    padding: 0,
    overflow: 'hidden',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  menuText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 6,
  },
  translationContainer: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.lg,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  translationText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
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
    borderTopColor: colors.textPrimary, // Matches menuContainer background
    marginTop: -1,
  },
});