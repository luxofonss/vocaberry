// Word Preview Modal - Supports Multiple Meanings List

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors, borderRadius, shadows } from '../theme';
import { Word } from '../types';
import { SpeakButton } from './SpeakButton';
import { ImageViewerModal } from './ImageViewerModal';
import { SkeletonLoader } from './SkeletonLoader';
import { EventBus } from '../services/EventBus';
import { StorageService } from '../services/StorageService';
import { getDisplayImageUrl, isValidImageUrl, isWordLoading } from '../utils/imageUtils';
import { DEFAULTS, WORD_PREVIEW_TEXTS, POLLING_CONFIG, UI_LIMITS } from '../constants';

interface WordPreviewModalProps {
  visible: boolean;
  wordData: Word | null;
  isNew: boolean;
  isLoading?: boolean;
  statusText?: string;
  onClose: () => void;
  onSave?: (word: Word) => void;
  onGoToDetail?: (wordId: string) => void;
}

export const WordPreviewModal: React.FC<WordPreviewModalProps> = ({
  visible,
  wordData,
  isNew,
  isLoading = false,
  statusText = "Looking up...",
  onClose,
  onSave,
  onGoToDetail
}) => {
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  // Local state để có thể update khi nhận event
  const [currentWordData, setCurrentWordData] = useState<Word | null>(wordData);

  // Sync với props khi wordData thay đổi
  useEffect(() => {
    setCurrentWordData(wordData);
  }, [wordData]);

  // Listen event wordImageUpdated để update image khi được generate
  useEffect(() => {
    if (!currentWordData?.id || !visible) return;

    const handleImageUpdate = async ({ wordId, word }: { wordId: string; word?: Word }) => {
      console.log(`[WordPreviewModal] 📡 Nhận event wordImageUpdated - wordId: "${wordId}", current wordId: "${currentWordData.id}"`);

      // So sánh case-insensitive để đảm bảo khớp
      if (wordId && currentWordData.id && wordId.toLowerCase() === currentWordData.id.toLowerCase()) {
        console.log('[WordPreviewModal] 📸 WordId khớp! Updating image...');

        if (word) {
          // Nếu event có word data, dùng luôn
          setCurrentWordData(word);
          console.log('[WordPreviewModal] ✅ Đã update ảnh từ event');
        } else {
          // Nếu không có, reload từ DB
          const reloaded = await StorageService.getWordById(wordId);
          if (reloaded) {
            setCurrentWordData(reloaded);
            console.log('[WordPreviewModal] ✅ Đã update ảnh từ DB');
          }
        }
      }
    };

    EventBus.on('wordImageUpdated', handleImageUpdate);
    return () => {
      EventBus.off('wordImageUpdated', handleImageUpdate);
    };
  }, [currentWordData?.id, visible]);

  // Polling fallback: Nếu word chưa có ảnh, check lại mỗi 2 giây
  useEffect(() => {
    if (!currentWordData?.id || !visible) return;

    // Use getDisplayImageUrl to check if we have a valid image (custom or server)
    const displayUrl = getDisplayImageUrl(currentWordData);
    if (isValidImageUrl(displayUrl)) return;

    console.log('[WordPreviewModal] 🔄 Bắt đầu polling để check ảnh...');
    const interval = setInterval(async () => {
      const reloaded = await StorageService.getWordById(currentWordData.id);
      if (reloaded) {
        const reloadedDisplayUrl = getDisplayImageUrl(reloaded);
        if (isValidImageUrl(reloadedDisplayUrl)) {
          console.log('[WordPreviewModal] ✅ Polling: Tìm thấy ảnh mới!');
          setCurrentWordData(reloaded);
          clearInterval(interval);
        }
      }
    }, POLLING_CONFIG.intervalMs);

    // Timeout sau 30 giây
    const timeout = setTimeout(() => {
      console.log('[WordPreviewModal] ⏱️ Polling timeout sau 30s');
      clearInterval(interval);
    }, POLLING_CONFIG.timeoutMs);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [currentWordData?.id, currentWordData?.imageUrl, currentWordData?.customImageUrl, currentWordData?.isUsingCustomImage, visible]);

  // Compute display image URL using priority logic: customImageUrl > imageUrl
  // Requirements: 8.1
  const displayImageUrl = useMemo(() => {
    if (!currentWordData) return '';
    return getDisplayImageUrl(currentWordData);
  }, [currentWordData]);

  const hasValidImage = useMemo(() => isValidImageUrl(displayImageUrl), [displayImageUrl]);

  // Check if word is loading (for disabling audio button)
  const isImageLoading = useMemo(() => {
    if (!currentWordData) return false;
    return isWordLoading(currentWordData);
  }, [currentWordData]);

  if (!visible) return null;
  if (!currentWordData && !isLoading) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              {isLoading ? (
                <View style={styles.loadingWrapper}>
                  <View style={styles.loaderCircle}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                  <Text style={styles.loadingTitle}>{WORD_PREVIEW_TEXTS.thinking}</Text>
                  <Text style={styles.loadingSub}>{statusText}</Text>
                  <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelText}>{WORD_PREVIEW_TEXTS.cancel}</Text>
                  </TouchableOpacity>
                </View>
              ) : currentWordData ? (
                <>
                  {/* Header Image - Uses priority logic: customImageUrl > imageUrl */}
                  {/* Requirements: 8.1, 8.2 */}
                  <View style={styles.imageWrapper}>
                    {hasValidImage ? (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setImageViewerVisible(true)}
                      >
                        <Image
                          source={{ uri: displayImageUrl }}
                          style={styles.image}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ) : (
                      <SkeletonLoader width="100%" height="100%" borderRadius={0} />
                    )}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                      <Text style={styles.closeText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Body */}
                  <View style={styles.body}>
                    <View style={styles.headerRow}>
                      <View>
                        <Text style={styles.wordTitle}>{currentWordData.word}</Text>
                        <View style={styles.subMeta}>
                          <Text style={styles.phoneticText}>{currentWordData.phonetic || DEFAULTS.phonetic}</Text>
                        </View>
                      </View>
                      <SpeakButton audioUrl={currentWordData.audioUrl} text={currentWordData.word} size="medium" isLoading={isImageLoading} />
                    </View>

                    <View style={styles.divider} />

                    {/* Scrollable Definition List */}
                    <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                      {(currentWordData.meanings || []).slice(0, UI_LIMITS.maxMeaningsPreview).map((meaning, index) => (
                        <View key={index} style={styles.meaningRow}>
                          <View style={styles.posBadge}>
                            <Text style={styles.posText}>{meaning.partOfSpeech || 'def'}</Text>
                          </View>
                          <Text style={styles.definitionText}>
                            {meaning.definition}
                          </Text>
                        </View>
                      ))}
                      {(currentWordData.meanings || []).length > UI_LIMITS.maxMeaningsPreview && (
                        <Text style={styles.moreText}>
                          {WORD_PREVIEW_TEXTS.moreDefinitions.replace('{count}', String(currentWordData.meanings.length - UI_LIMITS.maxMeaningsPreview))}
                        </Text>
                      )}
                    </ScrollView>

                    <View style={styles.footerSpacing} />

                    {/* Action Button */}
                    {isNew ? (
                      onSave && (
                        <TouchableOpacity
                          style={styles.saveButton}
                          onPress={() => currentWordData && onSave(currentWordData)}
                        >
                          <Text style={styles.buttonIcon}>➕</Text>
                          <Text style={styles.buttonText}>{WORD_PREVIEW_TEXTS.addToLibrary}</Text>
                        </TouchableOpacity>
                      )
                    ) : (
                      onGoToDetail && (
                        <TouchableOpacity
                          style={[styles.saveButton, styles.viewButton]}
                          onPress={() => {
                            if (currentWordData) {
                              onClose();
                              onGoToDetail(currentWordData.id);
                            }
                          }}
                        >
                          <Text style={[styles.buttonText, styles.viewButtonText]}>{WORD_PREVIEW_TEXTS.viewFullDetails}</Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </>
              ) : null}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>

      {currentWordData && (
        <ImageViewerModal
          visible={imageViewerVisible}
          imageUrl={displayImageUrl}
          onClose={() => setImageViewerVisible(false)}
          allowEdit={false}
          initialQuery={currentWordData.word}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // Claymorphism modal content - floating 3D clay tile
  modalContent: {
    width: '100%',
    maxWidth: 340,
    maxHeight: '80%',
    backgroundColor: colors.cardSurface,
    borderRadius: borderRadius.clayCard,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    shadowColor: colors.shadowOuter,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 12,
  },
  imageWrapper: {
    width: '100%',
    height: 120,
    backgroundColor: colors.backgroundSoft,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  // Claymorphism close button - soft clay circle
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.cardSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.claySoft,
  },
  closeText: {
    color: colors.textSecondary,
    fontWeight: 'bold',
    marginTop: -2,
  },
  body: {
    padding: 20,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  wordTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  phoneticText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginBottom: 12,
  },
  scrollArea: {
    maxHeight: 300,
    marginBottom: 8,
  },
  meaningRow: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  // Claymorphism POS badge - floating 3D pill
  posBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    marginRight: 8,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  posText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  definitionText: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
    flex: 1,
  },
  moreText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  footerSpacing: {
    height: 0,
  },
  // Claymorphism save button - primary clay pill
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.clayInput,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.clayPrimary,
  },
  buttonIcon: {
    color: 'white',
    marginRight: 8,
    fontSize: 16,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  // Claymorphism view button - soft clay
  viewButton: {
    backgroundColor: colors.cardSurface,
    borderTopColor: colors.shadowInnerLight,
    ...shadows.claySoft,
  },
  viewButtonText: {
    color: colors.textPrimary,
  },
  // Loading Styles - Claymorphism
  loadingWrapper: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Claymorphism loader circle - soft clay
  loaderCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.shadowInnerLight,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  loadingSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  // Claymorphism cancel button - soft clay
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: borderRadius.clayInput,
    backgroundColor: colors.cardSurface,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.claySoft,
  },
  cancelText: {
    color: colors.textSecondary,
    fontWeight: '700',
  }
});