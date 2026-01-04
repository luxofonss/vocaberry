// Word Preview Modal - Supports Multiple Meanings List

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';
import { Word } from '../types';
import { SpeakButton } from './SpeakButton';
import { ImageViewerModal } from './ImageViewerModal';
import { EventBus } from '../services/EventBus';
import { StorageService } from '../services/StorageService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WordPreviewModalProps {
  visible: boolean;
  wordData: Word | null;
  isNew: boolean;
  isLoading?: boolean;
  loadingStatus?: string;
  onClose: () => void;
  onSave: (word: Word) => void;
  onGoToDetail: (wordId: string) => void;
}

export const WordPreviewModal: React.FC<WordPreviewModalProps> = ({
  visible,
  wordData,
  isNew,
  isLoading = false,
  loadingStatus = "Looking up...",
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
    if (!currentWordData?.id || !visible || currentWordData.imageUrl) return;
    
    console.log('[WordPreviewModal] 🔄 Bắt đầu polling để check ảnh...');
    const interval = setInterval(async () => {
      const reloaded = await StorageService.getWordById(currentWordData.id);
      if (reloaded && reloaded.imageUrl) {
        console.log('[WordPreviewModal] ✅ Polling: Tìm thấy ảnh mới!');
        setCurrentWordData(reloaded);
        clearInterval(interval);
      }
    }, 2000); // Check mỗi 2 giây

    // Timeout sau 30 giây
    const timeout = setTimeout(() => {
      console.log('[WordPreviewModal] ⏱️ Polling timeout sau 30s');
      clearInterval(interval);
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [currentWordData?.id, currentWordData?.imageUrl, visible]);

  if (!visible) return null;
  if (!currentWordData && !isLoading) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()} 
            style={styles.modalContent}
        >
          {isLoading ? (
              <View style={styles.loadingWrapper}>
                  <View style={styles.loaderCircle}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                  <Text style={styles.loadingTitle}>Thinking...</Text>
                  <Text style={styles.loadingSub}>{loadingStatus}</Text>
                  <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                      <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
              </View>
          ) : currentWordData ? (
             <>
                {/* Header Image */}
                <View style={styles.imageWrapper}>
                    {currentWordData.imageUrl && currentWordData.imageUrl.trim() !== '' ? (
                        <TouchableOpacity 
                          activeOpacity={0.9}
                          onPress={() => setImageViewerVisible(true)}
                        >
                          <Image 
                              source={{ uri: currentWordData.imageUrl }} 
                              style={styles.image} 
                              resizeMode="cover" 
                          />
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.image, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F2F5' }]}>
                            <ActivityIndicator size="large" color="#5D5FEF" />
                        </View>
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
                                <Text style={styles.phoneticText}>{currentWordData.phonetic || '/.../'}</Text>
                            </View>
                        </View>
                        <SpeakButton text={currentWordData.word} size="medium" />
                    </View>

                    <View style={styles.divider} />

                    {/* Scrollable Definition List */}
                    <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                        {currentWordData.meanings.slice(0, 3).map((meaning, index) => (
                            <View key={index} style={styles.meaningRow}>
                                <View style={styles.posBadge}>
                                    <Text style={styles.posText}>{meaning.partOfSpeech || 'def'}</Text>
                                </View>
                                <Text style={styles.definitionText}>
                                    {meaning.definition}
                                </Text>
                            </View>
                        ))}
                        {currentWordData.meanings.length > 3 && (
                            <Text style={styles.moreText}>
                                + {currentWordData.meanings.length - 3} more meanings...
                            </Text>
                        )}
                    </ScrollView>
                    
                    <View style={styles.footerSpacing} />

                    {/* Action Button */}
                    {isNew ? (
                        <TouchableOpacity 
                            style={styles.saveButton} 
                            onPress={() => onSave(currentWordData)}
                        >
                            <Text style={styles.buttonIcon}>➕</Text>
                            <Text style={styles.buttonText}>Add to Library</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity 
                            style={[styles.saveButton, styles.viewButton]} 
                            onPress={() => {
                                onClose();
                                onGoToDetail(currentWordData.id);
                            }}
                        >
                            <Text style={[styles.buttonText, styles.viewButtonText]}>View Full Details →</Text>
                        </TouchableOpacity>
                    )}
                </View>
             </>
          ) : null}
        </TouchableOpacity>
      </TouchableOpacity>

      {currentWordData && (
        <ImageViewerModal
          visible={imageViewerVisible}
          imageUrl={currentWordData.imageUrl}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    maxHeight: '80%', // Avoid too tall
    backgroundColor: colors.white,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  imageWrapper: {
      width: '100%',
      height: 120, // Slightly shorter header for preview
      backgroundColor: colors.backgroundSoft,
      position: 'relative',
  },
  image: {
      width: '100%',
      height: '100%',
  },
  closeButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: 'rgba(0,0,0,0.3)',
      alignItems: 'center',
      justifyContent: 'center',
  },
  closeText: {
      color: 'white',
      fontWeight: 'bold',
      marginTop: -2,
  },
  body: {
      padding: 20,
      paddingBottom: 24, // extra pad for button
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
      maxHeight: 200, // Limit scrolling height inside popup
      marginBottom: 16,
  },
  meaningRow: {
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'flex-start',
  },
  posBadge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      marginRight: 8,
      marginTop: 2,
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
  saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
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
  viewButton: {
      backgroundColor: colors.backgroundSoft,
  },
  viewButtonText: {
      color: colors.textPrimary,
  },
  // Loading Styles
  loadingWrapper: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
  },
  loaderCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.backgroundSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
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
  cancelButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.backgroundSoft,
  },
  cancelText: {
      color: colors.textSecondary,
      fontWeight: '700',
  }
});
