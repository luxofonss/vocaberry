// Word Detail Screen - Optimized for Maintainability
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Word, RootStackParamList, Meaning } from '../types';
import { StorageService } from '../services/StorageService';
import { DatabaseService } from '../services/DatabaseService';
import { DictionaryService } from '../services/DictionaryService';
import { SpeakButton, ClickableText, WordPreviewModal, ImageSearchModal, ImageViewerModal, SkeletonLoader, CameraIcon, BackIcon, TrashIcon, MicroIcon, TargetIcon, CheckIcon } from '../components';
import * as ImagePicker from 'expo-image-picker';
import { EventBus } from '../services/EventBus';
import { Ionicons } from '@expo/vector-icons';
import {
  DEFAULTS,
  MESSAGES,
  UI_LIMITS,
  IMAGE_VIEWER_TEXTS
} from '../constants';
import { getDisplayImageUrl, isValidImageUrl, isWordLoading } from '../utils/imageUtils';

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

  useEffect(() => {
    loadWord();
  }, [wordId]);

  // Refresh word from server when entering screen to get latest data
  useEffect(() => {
    const refreshFromServer = async () => {
      console.log('[WordDetail] 🔍 Checking if word needs refresh...', { wordId });

      // Refresh if word is still processing (no imageUrl, empty imageUrl, or no meanings)
      const localWord = await StorageService.getWordById(wordId);

      if (!localWord) {
        console.log('[WordDetail] ⚠️ No local word found!');
        return;
      }

      // Check if any meaning is missing images or audio
      const hasMissingMeaningData = localWord.meanings?.some(m =>
        !m.exampleImageUrl ||
        m.exampleImageUrl.trim() === '' ||
        !m.exampleAudioUrl ||
        m.exampleAudioUrl.trim() === ''
      ) || false;

      const needsRefresh = (
        !localWord.imageUrl ||
        localWord.imageUrl.trim() === '' ||
        !localWord.meanings ||
        localWord.meanings.length === 0 ||
        hasMissingMeaningData
      );

      console.log('[WordDetail] 🎯 Needs refresh?', needsRefresh, {
        missingMainImage: !localWord.imageUrl || localWord.imageUrl.trim() === '',
        missingMeanings: !localWord.meanings || localWord.meanings.length === 0,
        hasMissingMeaningData
      });

      if (needsRefresh) {
        console.log('[WordDetail] 🔄 Word incomplete, calling refreshWord API...');
        const result = await DictionaryService.refreshWord(wordId);
        console.log('[WordDetail] ✅ refreshWord result:', result ? 'Success' : 'Failed');
      } else {
        console.log('[WordDetail] ✓ Word is complete, no refresh needed');
      }
    };
    refreshFromServer();
  }, [wordId]);

  useEffect(() => {
    // Listen for word update event - reload từ DB để đảm bảo đồng bộ
    const cb = async ({ wordId: wId, word: updatedWord }: { wordId: string; word?: Word }) => {
      console.log(`[WordDetail] 📡 Nhận event wordImageUpdated - wId: "${wId}", current wordId: "${wordId}"`);
      // So sánh case-insensitive để đảm bảo khớp
      if (wId && wordId && wId.toLowerCase() === wordId.toLowerCase()) {
        console.log('[WordDetail] 📸 WordId khớp! Updating word...');
        // Use word from event if available, otherwise reload from DB
        if (updatedWord) {
          setWord(updatedWord);
          console.log('[WordDetail] ✅ Đã update từ event');
        } else {
          const reloaded = await StorageService.getWordById(wordId);
          if (reloaded) {
            setWord(reloaded);
            console.log('[WordDetail] ✅ Đã update từ DB');
          }
        }
      }
    };
    EventBus.on('wordImageUpdated', cb);
    return () => EventBus.off('wordImageUpdated', cb);
  }, [wordId]);

  // Remove old polling fallback - DictionaryService handles this now
  /*
  useEffect(() => {
    if (!word || word.imageUrl) return;
    return () => {
      // Cleanup removed - DictionaryService handles polling now
    };
  }, []);
  */

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
      setIsLookupLoading(true);
      setLookupStatus(DETAIL_TEXTS.analyzing.replace('{word}', text));

      const result = await DictionaryService.lookup(text);

      if (!result) {
        Alert.alert(DETAIL_TEXTS.notFound, DETAIL_TEXTS.notFoundMessage.replace('{word}', text));
        return;
      }

      if (!result.isNew) {
        setIsLookupLoading(false);
        navigation.push('WordDetail', { wordId: result.word.id });
        return;
      }

      setSelectedWordData(result.word);
      setIsSelectedWordNew(true);
      setModalVisible(true);
    } catch (error: any) {
      console.log('[WordDetail] Lookup failed', error);
      Alert.alert(DETAIL_TEXTS.error, error.message || MESSAGES.errors.lookupFailed);
    } finally {
      setIsLookupLoading(false);
    }
  }, [navigation]);

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
          updatedWord = {
            ...word,
            customImageUrl: base64Image,
            isUsingCustomImage: true,
            localUpdatedAt: new Date().toISOString()
          };
        } else {
          const updatedMeanings = word.meanings.map((m: Meaning) =>
            m.id === meaningId ? { ...m, exampleImageUrl: base64Image } : m
          );
          updatedWord = {
            ...word,
            meanings: updatedMeanings,
            localUpdatedAt: new Date().toISOString()
          };
        }

        await DatabaseService.saveWord(updatedWord);
        setWord(updatedWord);
      }
    } catch (error) {
      Alert.alert(DETAIL_TEXTS.error, DETAIL_TEXTS.cannotUpdateImage);
    }
  }, [word]);

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
  }, [executePick]);

  const handleSearchSelect = useCallback(async (imageUrl: string) => {
    if (!word) return;

    let updatedWord: Word;
    if (searchTarget.type === 'main') {
      updatedWord = {
        ...word,
        customImageUrl: imageUrl,
        isUsingCustomImage: true,
        localUpdatedAt: new Date().toISOString()
      };
    } else {
      const updatedMeanings = word.meanings.map((m: Meaning) =>
        m.id === searchTarget.meaningId ? { ...m, exampleImageUrl: imageUrl } : m
      );
      updatedWord = { ...word, meanings: updatedMeanings, localUpdatedAt: new Date().toISOString() };
    }

    await DatabaseService.saveWord(updatedWord);
    setWord(updatedWord);
  }, [word, searchTarget]);

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
      updatedWord = {
        ...word,
        customImageUrl: newImageUrl,
        isUsingCustomImage: true,
        localUpdatedAt: new Date().toISOString()
      };
    } else {
      const updatedMeanings = word.meanings.map((m: Meaning) =>
        m.id === viewingMeaningId ? { ...m, exampleImageUrl: newImageUrl } : m
      );
      updatedWord = {
        ...word,
        meanings: updatedMeanings,
        localUpdatedAt: new Date().toISOString()
      };
    }

    await DatabaseService.saveWord(updatedWord);
    setWord(updatedWord);
  }, [word, viewingImageType, viewingMeaningId]);

  const handleGoToDetail = useCallback((id: string) => {
    setModalVisible(false);
    navigation.push('WordDetail', { wordId: id });
  }, [navigation]);

  const handlePracticePronunciation = useCallback(() => {
    if (!word) return;
    // Navigate to SentencePractice screen with current word for pronunciation practice
    navigation.navigate('SentencePractice', { customText: word.word });
  }, [word, navigation]);

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
            <SpeakButton audioUrl={word?.audioUrl} text={word?.word || ''} size="small" isLoading={isImageLoading} />
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
                <SkeletonLoader width="100%" height="100%" borderRadius={0} />
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
                    <CameraIcon size={24} />
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
                <SpeakButton audioUrl={item.exampleAudioUrl} text={item.example} size="small" />
              </View>
            </View>
          </View>
        )}

        {/* Requirements 9.3: Display userExamples separately from server meanings */}
        {word?.userExamples && word.userExamples.length > 0 && (
          <View style={styles.userExamplesSection}>
            <Text style={styles.userExamplesSectionTitle}>My Examples</Text>
            {word.userExamples.map((userExample) => (
              <View key={userExample.id} style={styles.userExampleCard}>
                {userExample.customImageUrl && isValidImageUrl(userExample.customImageUrl) && (
                  <View style={styles.userExampleImageWrapper}>
                    <Image
                      source={{ uri: userExample.customImageUrl }}
                      style={styles.userExampleImage}
                      resizeMode="cover"
                    />
                  </View>
                )}
                <View style={styles.userExampleContent}>
                  <View style={styles.exampleTextRow}>
                    <ClickableText
                      text={`"${userExample.text}"`}
                      onWordPress={handleWordPress}
                      style={styles.userExampleText}
                    />
                    <SpeakButton audioUrl={userExample.audioUrl} text={userExample.text} size="small" />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
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

  const displayImageUrl = word ? getDisplayImageUrl(word) : '';

  const isImageLoading = useMemo(() => {
    if (!word) return false;
    return isWordLoading(word);
  }, [word]);

  // Create a reversed copy for display so newest/user-added meanings usually show first
  const displayedMeanings = displayWord.meanings;
  const currentMeaning = displayedMeanings[currentIndex];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.headerSafe}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.navHeader}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <BackIcon size={20} />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.wordTitleRow}>
              <Text style={styles.wordTitle}>{displayWord.word}</Text>

            </View>
          </View>
        </View>

        <View style={styles.fixedHeader}>
          <View style={styles.headerImageWrapper}>
            {loading ? (
              <SkeletonLoader width="100%" height="100%" borderRadius={0} />
            ) : (
              !displayImageUrl || displayImageUrl.trim() === '' ? (
                <SkeletonLoader width="100%" height="100%" borderRadius={0} />
              ) : (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => handleViewImage(displayImageUrl, 'main')}
                  style={{ width: '100%', height: '100%' }}
                >
                  <Image source={{ uri: displayImageUrl }} style={styles.headerImage} resizeMode="cover" />
                </TouchableOpacity>
              )
            )}

            {!loading && (
              <TouchableOpacity style={styles.editImageBtn} onPress={handleEditMainImage}>
                <CameraIcon size={32} />
              </TouchableOpacity>
            )}
          </View>

        </View>
        <View style={styles.divider} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <SkeletonLoader width={200} height={24} borderRadius={8} />
        </View>
      ) : (
        <View style={{ flex: 1, position: 'relative', flexDirection: 'column' }}>
          <FlatList
            data={displayedMeanings}
            keyExtractor={(item) => item.id}
            renderItem={renderMeaningSlide}
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            snapToInterval={SCREEN_WIDTH}
            snapToAlignment="start"
            decelerationRate="fast"
            onScroll={(ev) => {
              const newIndex = Math.round(ev.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentIndex(newIndex);
            }}
            scrollEventThrottle={16}
            initialNumToRender={1}
            windowSize={3}
            style={{ flex: 1 }}
          />
          {displayedMeanings.length > 1 && (
            <View style={[styles.paginationColumn]}>
              <View style={styles.paginationContainer}>
                {displayedMeanings.map((_, i) => (
                  <View key={i} style={[styles.dot, currentIndex === i && styles.activeDot]} />
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      <View style={styles.actionBarSafe}>
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.squareDeleteButton} onPress={handleDelete}>
            <TrashIcon size={32} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.micButton}
            onPress={handlePracticePronunciation}
          >
            <MicroIcon size={32} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
            <TargetIcon size={34} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGotIt}>
            <CheckIcon size={34} />
          </TouchableOpacity>
        </View>
      </View>

      <WordPreviewModal
        visible={modalVisible}
        wordData={selectedWordData}
        isNew={isSelectedWordNew}
        isLoading={isLookupLoading}
        statusText={lookupStatus}
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


    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerSafe: {
    backgroundColor: colors.background, zIndex: 10,
    ...shadows.clayMedium,
  },
  navHeader: { paddingLeft: spacing.xl, paddingRight: spacing.xs, paddingVertical: spacing.sm },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Claymorphism back button - soft clay with inner highlight
  backButton: {
    width: 30,
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: typography.sizes.xl, color: colors.textPrimary, fontWeight: typography.weights.semibold },

  fixedHeader: { paddingHorizontal: spacing.xxl, paddingBottom: spacing.sm },
  // Claymorphism header image wrapper - floating 3D clay tile
  headerImageWrapper: {
    width: '100%',
    height: 130,
    borderRadius: borderRadius.xs,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    backgroundColor: colors.backgroundSoft,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    ...shadows.clayMedium,
  },
  headerImage: { width: '100%', height: '100%' },
  wordTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 0 },
  wordTitle: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.extraBold, color: colors.textPrimary, letterSpacing: -0.4 },
  paginationColumn: { paddingTop: 4, paddingBottom: 4 },
  paginationContainer: { display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.borderMedium },
  activeDot: { backgroundColor: colors.primary, width: 18, height: 6, borderRadius: 3 },
  divider: { height: 1, backgroundColor: colors.borderLight, opacity: 0.3 },

  slideContainer: { width: SCREEN_WIDTH, flex: 1 },
  slideContent: { paddingHorizontal: spacing.xxl, paddingTop: spacing.xs, paddingBottom: spacing.xl },
  slideHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  // Claymorphism type tag - soft clay badge
  typeTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  typeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.extraBold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4 },
  phoneticContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  phoneticText: { fontSize: typography.sizes.base, fontWeight: typography.weights.medium, color: colors.textSecondary, fontStyle: 'italic', opacity: 0.7 },
  slideDivider: { height: 1, backgroundColor: colors.borderLight, marginBottom: spacing.sm, opacity: 0.3 },

  definitionText: { fontSize: typography.sizes.md, color: colors.textPrimary, lineHeight: 20, fontWeight: typography.weights.semibold, marginBottom: spacing.md },
  // Claymorphism example card - floating 3D clay tile
  exampleCard: {
    padding: 4,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  exampleImageWrapper: {
    width: '100%',
    height: 150,
    overflow: 'hidden',
    borderRadius: borderRadius.xs,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.shadowInnerLight,
  },
  exampleImage: { width: '100%', height: '100%' },
  exampleContent: { padding: spacing.lg, paddingTop: spacing.md },
  exampleTextRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, alignItems: 'center' },
  exampleText: { fontSize: typography.sizes.base, fontStyle: 'italic', color: colors.textSecondary, lineHeight: 20, flex: 1 },

  // Claymorphism action bar - floating 3D clay container
  actionBarSafe: {
    // backgroundColor: colors.cardSurface,
    // borderTopWidth: 1,
    // borderTopColor: colors.shadowInnerLight,
    // ...shadows.clayMedium,
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 10 : spacing.md,
    backgroundColor: colors.cardSurface,
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Claymorphism delete button - soft clay with debossed effect
  squareDeleteButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Claymorphism microphone button - vibrant primary with gradient feel
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.secondary || '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Claymorphism done button - square icon button with checkmark
  doneButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.accent3Light,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Claymorphism primary button - square icon button with checkmark
  primaryButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.backgroundPurple,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { fontSize: typography.sizes.base, fontWeight: typography.weights.bold, color: colors.white, letterSpacing: 0.2 },

  // Claymorphism edit image buttons - floating 3D clay circles
  editImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.6)',
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  editImageBtnMini: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.6)',
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },

  // Claymorphism user examples section
  userExamplesSection: {
    marginTop: spacing.lg,
  },
  userExamplesSectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  // Claymorphism user example card - soft clay with primary tint
  userExampleCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: borderRadius.clayCard,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 0,
    borderTopWidth: 1,
    borderTopColor: colors.primaryLighter,
    ...shadows.claySoft,
  },
  userExampleImageWrapper: {
    width: '100%',
    height: 100,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.shadowInnerLight,
  },
  userExampleImage: {
    width: '100%',
    height: '100%',
  },
  userExampleContent: {
    paddingHorizontal: spacing.xs,
  },
  userExampleText: {
    fontSize: typography.sizes.sm,
    fontStyle: 'italic',
    color: colors.textPrimary,
    lineHeight: 18,
    flex: 1,
  },
});