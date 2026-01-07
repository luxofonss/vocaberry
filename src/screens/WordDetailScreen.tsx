// Word Detail Screen - Optimized for Maintainability
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { theme, colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Word, RootStackParamList, Meaning } from '../types';
import { StorageService } from '../services/StorageService';
import { DatabaseService } from '../services/DatabaseService';
import { DictionaryService } from '../services/DictionaryService';
import { SpeakButton, ClickableText, WordPreviewModal, ImageSearchModal, ImageViewerModal, AddMeaningModal } from '../components';
import * as ImagePicker from 'expo-image-picker';
import { EventBus } from '../services/EventBus';
import { Ionicons } from '@expo/vector-icons';
import {
  DEFAULTS,
  MESSAGES,
  UI_LIMITS,
  POLLING_CONFIG,
  IMAGE_VIEWER_TEXTS
} from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Screen-specific texts
const DETAIL_TEXTS = {
  deleteWord: 'Delete Word',
  deleteConfirm: 'Are you sure you want to delete "{word}"?',
  cancel: 'Cancel',
  delete: 'Delete',
  confirmTitle: 'Xác nhận',
  confirmMessage: 'Bạn đã học xong và nhớ từ này chưa?',
  keepLearning: 'Để lại',
  remembered: 'Đã nhớ',
  analyzing: 'Analyzing "{word}"...',
  notFound: 'Không tìm thấy',
  notFoundMessage: 'Không tìm thấy từ "{word}" hoặc từ này không có nghĩa. Vui lòng kiểm tra lại chính tả.',
  error: 'Lỗi',
  saved: 'Saved!',
  addedToLibrary: '"{word}" added to your library.',
  cannotSave: 'Could not save word.',
  cannotUpdateImage: 'Không thể cập nhật ảnh.',
  done: 'Done',
  gotIt: 'I Got It!',
  loading: 'Loading...',
} as const;

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'WordDetail'>;
type DetailRouteProp = RouteProp<RootStackParamList, 'WordDetail'>;

export const WordDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DetailRouteProp>();
  const { wordId } = route.params;

  const [word, setWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Popup State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWordData, setSelectedWordData] = useState<Word | null>(null);
  const [isSelectedWordNew, setIsSelectedWordNew] = useState(false);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [lookupStatus, setLookupStatus] = useState('');

  // Image Search State
  const [imageSearchVisible, setImageSearchVisible] = useState(false);
  const [searchTarget, setSearchTarget] = useState<{ type: 'main' | 'meaning', meaningId?: string }>({ type: 'main' });

  // Image Viewer State
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
  const [viewingImageType, setViewingImageType] = useState<'main' | 'meaning' | null>(null);
  const [viewingMeaningId, setViewingMeaningId] = useState<string | undefined>(undefined);

  // Add Meaning Modal State
  const [addMeaningVisible, setAddMeaningVisible] = useState(false);

  useEffect(() => {
    loadWord();
  }, [wordId]);

  useEffect(() => {
    // Listen for image update realtime - reload từ DB để đảm bảo đồng bộ
    const cb = async ({ wordId: wId }: { wordId: string }) => {
      console.log(`[WordDetail] 📡 Nhận event wordImageUpdated - wId: "${wId}", current wordId: "${wordId}"`);
      // So sánh case-insensitive để đảm bảo khớp
      if (wId && wordId && wId.toLowerCase() === wordId.toLowerCase()) {
        console.log('[WordDetail] 📸 WordId khớp! Reloading word từ DB...');
        const reloaded = await StorageService.getWordById(wordId);
        if (reloaded) {
          setWord(reloaded);
          console.log('[WordDetail] ✅ Đã update ảnh thành công');
        } else {
          console.warn('[WordDetail] ⚠️ Không tìm thấy word sau khi reload');
        }
      } else {
        console.log('[WordDetail] ⏭️ WordId không khớp, bỏ qua');
      }
    };
    EventBus.on('wordImageUpdated', cb);
    return () => EventBus.off('wordImageUpdated', cb);
  }, [wordId]);

  // Polling fallback: Nếu word chưa có ảnh, check lại mỗi 2 giây
  useEffect(() => {
    if (!word || word.imageUrl) return; // Chỉ poll khi chưa có ảnh

    console.log('[WordDetail] 🔄 Bắt đầu polling để check ảnh...');
    const interval = setInterval(async () => {
      const reloaded = await StorageService.getWordById(wordId);
      if (reloaded && reloaded.imageUrl) {
        console.log('[WordDetail] ✅ Polling: Tìm thấy ảnh mới!');
        setWord(reloaded);
        clearInterval(interval);
      }
    }, POLLING_CONFIG.intervalMs);

    // Timeout sau 30 giây
    const timeout = setTimeout(() => {
      console.log('[WordDetail] ⏱️ Polling timeout sau 30s');
      clearInterval(interval);
    }, POLLING_CONFIG.timeoutMs);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [word, wordId]);

  const loadWord = useCallback(async () => {
    try {
      const loadedWord = await StorageService.getWordById(wordId);
      setWord(loadedWord || null);
    } catch (error) {
      console.error('[WordDetail] Error loading word:', error);
    } finally {
      setLoading(false);
    }
  }, [wordId]);

  const handleDelete = useCallback(() => {
    Alert.alert(DETAIL_TEXTS.deleteWord, DETAIL_TEXTS.deleteConfirm.replace('{word}', word?.word || ''), [
      { text: DETAIL_TEXTS.cancel, style: 'cancel' },
      {
        text: DETAIL_TEXTS.delete, style: 'destructive', onPress: async () => {
          try {
            await StorageService.deleteWord(wordId);
            navigation.goBack();
          } catch (e) { }
        }
      },
    ]);
  }, [word?.word, wordId, navigation]);

  const handleGotIt = useCallback(async () => {
    try {
      // Increment viewCount khi bấm "I Got It"
      await StorageService.incrementViewCount(wordId);
      navigation.goBack();
    } catch (e) { }
  }, [wordId, navigation]);

  const handleDone = useCallback(() => {
    Alert.alert(
      DETAIL_TEXTS.confirmTitle,
      DETAIL_TEXTS.confirmMessage,
      [
        {
          text: DETAIL_TEXTS.keepLearning,
          style: "cancel"
        },
        {
          text: DETAIL_TEXTS.remembered,
          style: "default",
          onPress: async () => {
            try {
              // Set viewCount = max integer (không nhắc nữa)
              await StorageService.markAsDone(wordId);
              navigation.goBack();
            } catch (e) { }
          }
        }
      ]
    );
  }, [wordId, navigation]);

  const handleWordPress = useCallback(async (text: string) => {
    try {
      setModalVisible(true);
      setIsLookupLoading(true);
      setLookupStatus(DETAIL_TEXTS.analyzing.replace('{word}', text));

      const result = await DictionaryService.lookup(text);

      if (!result) {
        Alert.alert(DETAIL_TEXTS.notFound, DETAIL_TEXTS.notFoundMessage.replace('{word}', text));
        setModalVisible(false);
        return;
      }

      setSelectedWordData(result.word);
      setIsSelectedWordNew(result.isNew);
    } catch (error: any) {
      console.log('[WordDetail] Lookup failed', error);
      Alert.alert(DETAIL_TEXTS.error, error.message || MESSAGES.errors.lookupFailed);
      setModalVisible(false); // Close if fails
    } finally {
      setIsLookupLoading(false);
    }
  }, []);

  const handleSaveNewWord = useCallback(async (newWord: Word) => {
    try {
      await StorageService.addWord(newWord);
      setIsSelectedWordNew(false);
      Alert.alert(DETAIL_TEXTS.saved, DETAIL_TEXTS.addedToLibrary.replace('{word}', newWord.word));
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert(DETAIL_TEXTS.error, error.message || DETAIL_TEXTS.cannotSave);
    }
  }, []);

  const pickAndSaveImage = useCallback(async (type: 'main' | 'meaning', meaningId?: string) => {
    const aspect: [number, number] = type === 'main' ? UI_LIMITS.imageAspectRatio.square : UI_LIMITS.imageAspectRatio.wide;

    Alert.alert(
      IMAGE_VIEWER_TEXTS.changeImage,
      IMAGE_VIEWER_TEXTS.howToUpdate,
      [
        {
          text: IMAGE_VIEWER_TEXTS.searchUnsplash,
          onPress: () => {
            setSearchTarget({ type, meaningId });
            setImageSearchVisible(true);
          }
        },
        {
          text: IMAGE_VIEWER_TEXTS.takePhoto,
          onPress: () => executePick('camera', type, aspect, meaningId)
        },
        {
          text: IMAGE_VIEWER_TEXTS.library,
          onPress: () => executePick('library', type, aspect, meaningId)
        },
        { text: IMAGE_VIEWER_TEXTS.cancel, style: "cancel" }
      ]
    );
  }, []);

  const handleSearchSelect = useCallback(async (imageUrl: string) => {
    if (!word) return;

    let updatedWord: Word;
    if (searchTarget.type === 'main') {
      updatedWord = { ...word, imageUrl };
    } else {
      const updatedMeanings = word.meanings.map((m: Meaning) =>
        m.id === searchTarget.meaningId ? { ...m, exampleImageUrl: imageUrl } : m
      );
      updatedWord = { ...word, meanings: updatedMeanings };
    }

    await DatabaseService.saveWord(updatedWord);
    setWord(updatedWord);
  }, [word, searchTarget]);

  const executePick = useCallback(async (mode: 'camera' | 'library', type: 'main' | 'meaning', aspect: [number, number], meaningId?: string) => {
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect,
        quality: UI_LIMITS.imageQuality,
        base64: true,
      };

      let result;
      if (mode === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(IMAGE_VIEWER_TEXTS.notification, IMAGE_VIEWER_TEXTS.cameraPermission);
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets[0].base64 && word) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        let updatedWord: Word;

        if (type === 'main') {
          updatedWord = { ...word, imageUrl: base64Image };
        } else {
          const updatedMeanings = word.meanings.map((m: Meaning) =>
            m.id === meaningId ? { ...m, exampleImageUrl: base64Image } : m
          );
          updatedWord = { ...word, meanings: updatedMeanings };
        }

        await DatabaseService.saveWord(updatedWord);
        setWord(updatedWord);
      }
    } catch (error) {
      Alert.alert(DETAIL_TEXTS.error, DETAIL_TEXTS.cannotUpdateImage);
    }
  }, [word]);

  const handleEditMainImage = useCallback(() => pickAndSaveImage('main'), [pickAndSaveImage]);
  const handleEditMeaningImage = useCallback((id: string) => pickAndSaveImage('meaning', id), [pickAndSaveImage]);

  const handleViewImage = useCallback((imageUrl: string, type: 'main' | 'meaning', meaningId?: string) => {
    setViewingImageUrl(imageUrl);
    setViewingImageType(type);
    setViewingMeaningId(meaningId);
    setImageViewerVisible(true);
  }, []);

  const handleImageViewerChange = useCallback(async (newImageUrl: string) => {
    if (!word || !viewingImageType) return;

    let updatedWord: Word;
    if (viewingImageType === 'main') {
      updatedWord = { ...word, imageUrl: newImageUrl };
    } else {
      const updatedMeanings = word.meanings.map((m: Meaning) =>
        m.id === viewingMeaningId ? { ...m, exampleImageUrl: newImageUrl } : m
      );
      updatedWord = { ...word, meanings: updatedMeanings };
    }

    await DatabaseService.saveWord(updatedWord);
    setWord(updatedWord);
  }, [word, viewingImageType, viewingMeaningId]);

  const handleGoToDetail = useCallback((id: string) => {
    setModalVisible(false);
    navigation.push('WordDetail', { wordId: id });
  }, [navigation]);

  const handleAddMeaning = useCallback(async (newMeaning: Meaning) => {
    if (!word) return;

    const updatedMeanings = [...word.meanings, newMeaning];
    const updatedWord: Word = {
      ...word,
      meanings: updatedMeanings,
    };

    await StorageService.addWord(updatedWord);
    setWord(updatedWord);
    setCurrentIndex(0);
  }, [word]);

  // --- RENDERING ---

  const renderMeaningSlide = ({ item }: { item: Meaning }) => (
    <View style={styles.slideContainer}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.slideContent}
      >
        <View style={styles.slideHeader}>
          <View style={styles.typeTag}>
            <Text style={styles.typeText}>{item.partOfSpeech || 'def'}</Text>
          </View>
          <View style={styles.phoneticContainer}>
            <Text style={styles.phoneticText}>{item.phonetic || word?.phonetic || DEFAULTS.phonetic}</Text>
            <SpeakButton text={word?.word || ''} size="small" />
          </View>
        </View>

        <View style={styles.slideDivider} />

        <ClickableText
          text={item.definition}
          onWordPress={handleWordPress}
          style={styles.definitionText}
        />

        {item.example && (
          <View style={styles.exampleCard}>
            <View style={styles.exampleImageWrapper}>
              {!item.exampleImageUrl || item.exampleImageUrl.trim() === '' ? (
                <View style={[styles.exampleImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSoft }]}>
                  <Ionicons name="image-outline" size={40} color={colors.textLight} />
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => handleViewImage(item.exampleImageUrl || '', 'meaning', item.id)}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <Image source={{ uri: item.exampleImageUrl }} style={styles.exampleImage} resizeMode="cover" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editImageBtnMini}
                    onPress={() => handleEditMeaningImage(item.id)}
                  >
                    <Text style={styles.editIconBtn}>📷</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            <View style={styles.exampleContent}>
              <View style={styles.exampleTextRow}>
                <ClickableText
                  text={`"${item.example}"`}
                  onWordPress={handleWordPress}
                  style={styles.exampleText}
                />
                <SpeakButton text={item.example} size="small" />
              </View>
            </View>
          </View>
        )}
        <View style={{ height: spacing.huge }} />
      </ScrollView>
    </View>
  );

  // Render an empty/loading state if word is not ready, maintaining layout structure
  const displayWord = word || {
    word: DETAIL_TEXTS.loading,
    phonetic: '...',
    meanings: [],
    imageUrl: null,
    id: 'loading'
  } as unknown as Word;

  // Create a reversed copy for display so newest/user-added meanings usually show first
  const displayedMeanings = [...displayWord.meanings].reverse();
  const currentMeaning = displayedMeanings[currentIndex];
  const posAbbr = currentMeaning?.partOfSpeech ? (currentMeaning.partOfSpeech.length > 4 ? currentMeaning.partOfSpeech.substring(0, 3) + '.' : currentMeaning.partOfSpeech.toLowerCase()) : '';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.headerSafe}>
        <View style={styles.navHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.fixedHeader}>
          <View style={styles.headerImageWrapper}>
            {loading ? (
              <View style={[styles.headerImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSoft }]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              !displayWord.imageUrl || displayWord.imageUrl.trim() === '' ? (
                <View style={[styles.headerImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSoft }]}>
                  <Ionicons name="image-outline" size={48} color={colors.textLight} />
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => handleViewImage(displayWord.imageUrl!, 'main')}
                  style={{ width: '100%', height: '100%' }}
                >
                  <Image source={{ uri: displayWord.imageUrl! }} style={styles.headerImage} resizeMode="cover" />
                </TouchableOpacity>
              )
            )}

            {!loading && (
              <TouchableOpacity style={styles.editImageBtn} onPress={handleEditMainImage}>
                <Text style={styles.editIconBtn}>📸</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.wordInfoRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.wordTitleRow}>
                <Text style={styles.wordTitle}>{displayWord.word}</Text>
                {posAbbr && !loading ? (
                  <View style={styles.metaTag}>
                    <Text style={styles.metaTagText}>{posAbbr}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            {!loading && displayedMeanings.length > 0 && (
              <View style={styles.paginationColumn}>
                <View style={styles.paginationContainer}>
                  {displayedMeanings.map((_, i) => (
                    <View key={i} style={[styles.dot, currentIndex === i && styles.activeDot]} />
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
        <View style={styles.divider} />
      </View>

      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={displayedMeanings}
            keyExtractor={(item) => item.id}
            renderItem={renderMeaningSlide}
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(ev) => {
              const newIndex = Math.round(ev.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentIndex(newIndex);
            }}
            initialNumToRender={1} windowSize={3}
            style={{ flex: 1 }}
          />
        )}
      </View>

      <View style={styles.actionBarSafe}>
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.squareDeleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color="#DC2626" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addMeaningButton}
            onPress={() => setAddMeaningVisible(true)}
          >
            <Ionicons name="add-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleDone}>
            <Text style={styles.secondaryButtonText}>{DETAIL_TEXTS.done}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGotIt}>
            <Text style={styles.primaryButtonText}>{DETAIL_TEXTS.gotIt}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <WordPreviewModal
        visible={modalVisible}
        wordData={selectedWordData}
        isNew={isSelectedWordNew}
        isLoading={isLookupLoading}
        loadingStatus={lookupStatus}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveNewWord}
        onGoToDetail={handleGoToDetail}
      />

      {word && (
        <ImageSearchModal
          visible={imageSearchVisible}
          onClose={() => setImageSearchVisible(false)}
          onSelect={handleSearchSelect}
          initialQuery={word.word}
        />
      )}

      <ImageViewerModal
        visible={imageViewerVisible}
        imageUrl={viewingImageUrl}
        onClose={() => setImageViewerVisible(false)}
        onImageChange={handleImageViewerChange}
        allowEdit={true}
        initialQuery={word?.word || ''}
      />

      <AddMeaningModal
        visible={addMeaningVisible}
        word={word}
        onClose={() => setAddMeaningVisible(false)}
        onSave={handleAddMeaning}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerSafe: {
    backgroundColor: colors.background, zIndex: 10,
    ...shadows.subtle,
  },
  navHeader: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.textSecondary, fontSize: typography.sizes.base },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.xl, backgroundColor: colors.backgroundSoft },
  backIcon: { fontSize: typography.sizes.xl, color: colors.textPrimary, fontWeight: typography.weights.semibold },

  fixedHeader: { paddingHorizontal: spacing.xxl, paddingBottom: spacing.sm },
  headerImageWrapper: {
    width: '100%', height: 130, borderRadius: borderRadius.xl, overflow: 'hidden', marginBottom: spacing.sm, backgroundColor: colors.backgroundSoft
  },
  headerImage: { width: '100%', height: '100%' },
  wordInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  wordTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 0 },
  wordTitle: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.extraBold, color: colors.textPrimary, letterSpacing: -0.4 },
  metaTag: {
    backgroundColor: colors.primarySoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, marginTop: 4
  },
  metaTagText: { color: colors.primary, fontWeight: typography.weights.extraBold, fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  paginationColumn: { justifyContent: 'flex-end', marginBottom: 6 },
  paginationContainer: { flexDirection: 'row', gap: 6 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.borderMedium },
  activeDot: { backgroundColor: colors.primary, width: 10, height: 4, borderRadius: 2 },
  divider: { height: 1, backgroundColor: colors.borderLight, opacity: 0.5 },

  slideContainer: { width: SCREEN_WIDTH, flex: 1 },
  slideContent: { paddingHorizontal: spacing.xxl, paddingTop: spacing.xs, paddingBottom: spacing.xl },
  slideHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  typeTag: { backgroundColor: colors.backgroundSoft, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 5 },
  typeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.extraBold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4 },
  phoneticContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  phoneticText: { fontSize: typography.sizes.base, fontWeight: typography.weights.medium, color: colors.textSecondary, fontStyle: 'italic', opacity: 0.7 },
  slideDivider: { height: 1, backgroundColor: colors.borderLight, marginBottom: spacing.sm, opacity: 0.3 },

  definitionText: { fontSize: typography.sizes.lg, color: colors.textPrimary, lineHeight: 28, fontWeight: typography.weights.semibold, marginBottom: spacing.md },
  exampleCard: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: 3, borderWidth: 1, borderColor: colors.borderLight, overflow: 'hidden', marginTop: spacing.xs, ...shadows.subtle },
  exampleImageWrapper: { width: '100%', height: 150, borderRadius: borderRadius.lg, overflow: 'hidden', backgroundColor: colors.backgroundSoft },
  exampleImage: { width: '100%', height: '100%' },
  exampleContent: { padding: spacing.lg, paddingTop: spacing.md },
  exampleTextRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  exampleText: { fontSize: typography.sizes.base, fontStyle: 'italic', color: colors.textSecondary, lineHeight: 24, flex: 1 },

  actionBarSafe: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.rowGap,
    paddingBottom: Platform.OS === 'ios' ? 10 : spacing.lg,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  squareDeleteButton: { width: 48, height: 48, borderRadius: 15, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  addMeaningButton: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primaryLight },
  secondaryButton: { flex: 0.8, height: 48, backgroundColor: colors.backgroundSoft, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderMedium },
  secondaryButtonText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.textSecondary, letterSpacing: 0.2 },
  primaryButton: { flex: 1, height: 48, backgroundColor: colors.primary, borderRadius: 15, alignItems: 'center', justifyContent: 'center', ...shadows.strong },
  primaryButtonText: { fontSize: typography.sizes.base, fontWeight: typography.weights.bold, color: colors.white, letterSpacing: 0.3 },

  // Edit Image Buttons
  editImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editImageBtnMini: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editIconBtn: {
    fontSize: 14,
  }
});
