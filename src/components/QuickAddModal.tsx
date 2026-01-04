// QuickAddModal - Hashtag Popup Style

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  LayoutAnimation,
  UIManager,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme, colors, typography, spacing, shadows, borderRadius } from '../theme';
import { Word } from '../types';
import { DatabaseService } from '../services/DatabaseService';
import { DictionaryService } from '../services/DictionaryService';
import { StorageService } from '../services/StorageService';
import { TranslateService } from '../services/TranslateService';
import { ImageSearchModal } from './ImageSearchModal';

import * as ImagePicker from 'expo-image-picker';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Common languages with their codes and display names
const LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'zh', name: '中文 (Chinese)', flag: '🇨🇳' },
  { code: 'es', name: 'Español (Spanish)', flag: '🇪🇸' },
  { code: 'fr', name: 'Français (French)', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch (German)', flag: '🇩🇪' },
  { code: 'ja', name: '日本語 (Japanese)', flag: '🇯🇵' },
  { code: 'ko', name: '한국어 (Korean)', flag: '🇰🇷' },
  { code: 'pt', name: 'Português (Portuguese)', flag: '🇵🇹' },
  { code: 'it', name: 'Italiano (Italian)', flag: '🇮🇹' },
  { code: 'ru', name: 'Русский (Russian)', flag: '🇷🇺' },
  { code: 'ar', name: 'العربية (Arabic)', flag: '🇸🇦' },
  { code: 'th', name: 'ไทย (Thai)', flag: '🇹🇭' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
];

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (word: Word) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const navigation = useNavigation<any>();
  // Form State
  const [word, setWord] = useState('');
  const [examples, setExamples] = useState<string[]>(['']); 
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState('');

  // Animation State
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [imageSearchVisible, setImageSearchVisible] = useState(false);

  const handleCaptureImage = async () => {
      try {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Sorry, we need camera permissions to make this work!');
              return;
          }

          const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.7,
              base64: true,
          });

          if (!result.canceled && result.assets && result.assets.length > 0) {
              const asset = result.assets[0];
              const base64Uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
              setImageUri(base64Uri);
          }
      } catch (error) {
          Alert.alert('Error', 'Could not open camera.');
      }
  }; 

  const handleChooseFromLibrary = async () => {
    try {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            const base64Uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
            setImageUri(base64Uri);
        }
    } catch (error) {
        Alert.alert('Error', 'Could not open gallery.');
    }
  };

  const handlePickImage = () => {
      Alert.alert(
          "Thêm ảnh",
          "Bạn muốn thêm ảnh bằng cách nào?",
          [
              { 
                  text: "🔍 Tìm trên Unflash", 
                  onPress: () => setImageSearchVisible(true) 
              },
              { 
                  text: "📸 Chụp ảnh", 
                  onPress: handleCaptureImage 
              },
              { 
                  text: "🖼️ Thư viện", 
                  onPress: handleChooseFromLibrary 
              },
              { text: "Hủy", style: "cancel" }
          ]
      );
  };

  // Topic State
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  
  // Topic Popup State
  const [isTopicPopupVisible, setIsTopicPopupVisible] = useState(false);
  const [topicSearch, setTopicSearch] = useState('');
  
  // UI State
  const [isLookingUp, setIsLookingUp] = useState(false);
  
  // Translation State
  const [motherLanguage, setMotherLanguage] = useState<string | null>(null);
  const [translateModalVisible, setTranslateModalVisible] = useState(false);
  const [translateInput, setTranslateInput] = useState('');
  const [translateResult, setTranslateResult] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [languageSelectModalVisible, setLanguageSelectModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
        resetForm();
        loadTopics();
        loadMotherLanguage();
        
        // Entry Animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 60,
                friction: 12,
            })
        ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const handleClose = () => {
      Animated.parallel([
          Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
              toValue: SCREEN_HEIGHT,
              duration: 250,
              useNativeDriver: true,
          })
      ]).start(() => {
          onClose();
      });
  };

  const loadTopics = async () => {
    const topics = await StorageService.getAllTopics();
    setAvailableTopics(topics);
  };

  const loadMotherLanguage = async () => {
    try {
      const lang = await StorageService.getMotherLanguage();
      setMotherLanguage(lang);
    } catch (error) {
      console.error('[QuickAddModal] Failed to load mother language:', error);
    }
  };

  const resetForm = () => {
    setWord('');
    setExamples(['']);
    setImageUri(null);
    setSelectedTopics([]);
    setTopicSearch('');
    setIsTopicPopupVisible(false);
    setIsLookingUp(false);
    setTranslateModalVisible(false);
    setTranslateInput('');
    setTranslateResult(null);
  };

  // --- TOPIC ACTIONS ---

  const handleTopicToggle = (topic: string) => {
      // Toggle selection
      if (selectedTopics.includes(topic)) {
          setSelectedTopics(selectedTopics.filter(t => t !== topic));
      } else {
          setSelectedTopics([...selectedTopics, topic]);
      }
  };

  const createNewTopic = () => {
      const trimmed = topicSearch.trim();
      if (trimmed) {
          if (!availableTopics.includes(trimmed)) {
              setAvailableTopics([...availableTopics, trimmed].sort());
          }
          if (!selectedTopics.includes(trimmed)) {
              setSelectedTopics([...selectedTopics, trimmed]);
          }
          setTopicSearch('');
      }
  };

  // Filter topics based on search AND Sort Alphabetically
  const filteredTopics = availableTopics
    .filter(t => t.toLowerCase().includes(topicSearch.toLowerCase()));

  // --- EXAMPLE ACTIONS ---
  const handleExampleChange = (text: string, index: number) => {
      const newExamples = [...examples];
      newExamples[index] = text;
      setExamples(newExamples);
  };
  const addExampleSlot = () => {
      // Validate: Không cho add nếu đã đạt tối đa 3 lines
      if (examples.length >= 3) {
          Alert.alert('Maximum reached', 'You can add up to 3 example lines only.');
          return;
      }
      // Validate: Không cho add nếu có example nào đang empty
      const hasEmptyExample = examples.some(ex => !ex.trim());
      if (hasEmptyExample) {
          Alert.alert('Please fill in', 'Please fill in the current example before adding a new one.');
          return;
      }
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExamples([...examples, '']);
  };
  const removeExampleSlot = (index: number) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const newExamples = examples.filter((_, i) => i !== index);
      setExamples(newExamples.length > 0 ? newExamples : ['']);
  };

  const handleTranslate = async () => {
    if (!translateInput.trim() || !motherLanguage) {
      return;
    }

    setIsTranslating(true);
    try {
      const translated = await TranslateService.translate(translateInput.trim(), motherLanguage, 'en');
      if (translated && translated.trim()) {
        setTranslateResult(translated.trim());
      } else {
        Alert.alert("Translation Error", "Could not translate the word. Please try again.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Translation failed. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleAcceptTranslation = () => {
    if (translateResult) {
      setWord(translateResult);
      setTranslateModalVisible(false);
      setTranslateInput('');
      setTranslateResult(null);
    }
  };

  const handleLanguageSelect = async (languageCode: string) => {
    try {
      await StorageService.saveMotherLanguage(languageCode);
      setMotherLanguage(languageCode);
      setLanguageSelectModalVisible(false);
      // Mở translate modal ngay sau khi chọn language
      setTimeout(() => {
        setTranslateModalVisible(true);
      }, 300);
    } catch (error) {
      console.error('[QuickAddModal] Failed to save mother language:', error);
      Alert.alert("Error", "Failed to save language. Please try again.");
    }
  };

  const handleSave = async () => {
    if (!word.trim()) {
      Alert.alert('Missing Info', 'Please enter a word.');
      return;
    }

    setIsLookingUp(true);

    try {
        // 1. Fetch ALL DATA (Text + Dictionary Images + User Example Images)
        // Tất cả quy trình Enrichment (lọc, gộp, gen ảnh AI Base64) đã được đóng gói trong Service
        console.log('[QuickAddModal] 🔍 Đang thực hiện quy trình tra cứu & Enrichment toàn diện...');
        
        const customExampleTexts = examples.filter(e => e.trim().length > 0);
        
        setLoadingStatus("AI is analyzing your word...");
        // Wait a bit to show first message
        await new Promise(r => setTimeout(r, 600)); 
        
        setLoadingStatus("Generating high-quality definitions...");
        const result = await DictionaryService.lookup(word.trim(), customExampleTexts, imageUri || undefined);
        
        if (!result) {
            Alert.alert("Không tìm thấy", `Không tìm thấy từ "${word.trim()}" hoặc từ này không có nghĩa. Vui lòng kiểm tra lại chính tả.`);
            return;
        }
        
        const fetchedWord = result.word;
        
        setLoadingStatus("Saving to your private library...");
        fetchedWord.topics = selectedTopics.length > 0 ? selectedTopics : ['Uncategorized'];

        // 3. Save to Local DB
        await DatabaseService.saveWord(fetchedWord);

        onSuccess(fetchedWord);
        
        // 4. Chuyển hướng đến màn hình chi tiết ngay lập tức
        setTimeout(() => {
          navigation.navigate('WordDetail', { wordId: fetchedWord.id });
        }, 100);
    } catch (error: any) {
        Alert.alert("Thông báo", error.message || "Không thể lấy thông tin từ vựng. Vui lòng kiểm tra kết nối mạng.");
        console.error(error);
    } finally {
        setIsLookingUp(false);
    }
  };

  // --- RENDER POPUP ---
  const renderTopicPopup = () => {
      if (!isTopicPopupVisible) return null;
      
      return (
          <Modal
            visible={isTopicPopupVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setIsTopicPopupVisible(false)}
          >
              <View style={styles.popupOverlay}>
                  <TouchableOpacity 
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1} 
                    onPress={() => setIsTopicPopupVisible(false)}
                  />
                  <View style={styles.popupContainer}>
                      <View style={styles.popupHeader}>
                          <Text style={styles.popupTitle}>Manage Tags</Text>
                          <TouchableOpacity onPress={() => setIsTopicPopupVisible(false)}>
                              <Text style={styles.popupClose}>Done</Text>
                          </TouchableOpacity>
                      </View>

                      <View style={styles.popupSearchRow}>
                          <TextInput 
                              style={styles.popupInput}
                              placeholder="Search or Create Tag..."
                              value={topicSearch}
                              onChangeText={setTopicSearch}
                          />
                          {topicSearch.length > 0 && !availableTopics.includes(topicSearch) && (
                              <TouchableOpacity style={styles.popupAddBtn} onPress={createNewTopic}>
                                  <Text style={styles.popupAddText}>+ Create</Text>
                              </TouchableOpacity>
                          )}
                      </View>

                      <ScrollView 
                          style={styles.popupScrollView}
                          contentContainerStyle={styles.popupTagsContainer} 
                          keyboardShouldPersistTaps="handled"
                          showsVerticalScrollIndicator={false}
                          keyboardDismissMode="interactive"
                      >
                          {filteredTopics.map(topic => {
                              const isSelected = selectedTopics.includes(topic);
                              return (
                                  <TouchableOpacity 
                                      key={topic} 
                                      style={[styles.tag, isSelected && styles.tagSelected]}
                                      onPress={() => handleTopicToggle(topic)}
                                  >
                                      <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                                          {isSelected ? '# ' : ''}{topic}
                                      </Text>
                                  </TouchableOpacity>
                              );
                          })}
                          {filteredTopics.length === 0 && topicSearch.length === 0 && (
                              <Text style={styles.emptyText}>No tags yet. Create one!</Text>
                          )}
                      </ScrollView>
                  </View>
              </View>
          </Modal>
      );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <Animated.View 
          style={[styles.overlay, { opacity: fadeAnim }]} 
      >
          <TouchableOpacity 
              style={{ flex: 1 }} 
              activeOpacity={1} 
              onPress={handleClose}
          />
         <Animated.View 
            style={[
                styles.keyboardView, 
                { transform: [{ translateY: slideAnim }] }
            ]}
         >
            <TouchableOpacity 
                activeOpacity={1} 
                onPress={(e) => e.stopPropagation()}
            >
                <View style={styles.card}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>New Word</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {/* Word Input */}
                        <View style={styles.heroSection}>
                            <View style={styles.inputRow}>
                                <TextInput 
                                    style={styles.heroInput} 
                                    placeholder="Type word..." 
                                    placeholderTextColor={colors.textLight}
                                    value={word}
                                    onChangeText={setWord}
                                    autoFocus={true}
                                />
                                {/* Translate Button - Always show */}
                                <TouchableOpacity
                                    style={styles.translateButton}
                                    onPress={() => {
                                        if (!motherLanguage) {
                                            setLanguageSelectModalVisible(true);
                                        } else {
                                            setTranslateModalVisible(true);
                                        }
                                    }}
                                    disabled={isLookingUp}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons 
                                        name="language" 
                                        size={22} 
                                        color={motherLanguage ? colors.primary : colors.textSecondary} 
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Camera Access Button - Luôn enabled, kể cả khi đang processing */}
                            <TouchableOpacity 
                                style={styles.cameraRow} 
                                onPress={handlePickImage}
                                disabled={false}
                            >
                                <Text style={styles.cameraIcon}>📸</Text>
                                <Text style={styles.cameraText}>
                                    {imageUri ? 'Change Photo' : 'Take a photo of the word'}
                                </Text>
                            </TouchableOpacity>
                            {isLookingUp && !imageUri && (
                                <Text style={styles.helperText}>
                                    💡 Tip: Bạn có thể upload ảnh ngay bây giờ, ảnh AI sẽ không override ảnh bạn chọn
                                </Text>
                            )}

                             {/* Image Preview */}
                             {imageUri && (
                                <View style={styles.imagePreviewContainer}>
                                    <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
                                        <Text style={styles.removeImageText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* TOPIC SECTION - PREVIEW ONLY */}
                        <View style={styles.sectionContainer}>
                            <View style={styles.rowBetween}>
                                <Text style={styles.sectionLabel}>Topics</Text>
                                <TouchableOpacity onPress={() => setIsTopicPopupVisible(true)} style={styles.addTopicSmallBtn}>
                                    <Text style={styles.addTopicSmallText}>+ Manage Tags</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.previewTagsContainer}>
                                {selectedTopics.length > 0 ? (
                                    selectedTopics.map(topic => (
                                        <View key={topic} style={styles.miniTag}>
                                            <Text style={styles.miniTagText}>#{topic}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.placeholderText}>No topics selected</Text>
                                )}
                            </View>
                        </View>

                        {/* EXAMPLES SECTION */}
                        <View style={styles.sectionContainer}>
                             <View style={styles.rowBetween}>
                                <Text style={styles.sectionLabel}>My Examples</Text>
                                {examples.length < 3 && (
                                    <TouchableOpacity onPress={addExampleSlot}>
                                        <Text style={styles.addLink}>+ Add line</Text>
                                    </TouchableOpacity>
                                )}
                             </View>
                             
                             {examples.map((ex, index) => (
                                 <View key={index} style={styles.exampleRow}>
                                     <TextInput 
                                        style={styles.exampleInput}
                                        placeholder="Use it in a sentence..."
                                        value={ex}
                                        onChangeText={(text) => handleExampleChange(text, index)}
                                     />
                                     {index > 0 && (
                                         <TouchableOpacity onPress={() => removeExampleSlot(index)} style={styles.deleteBtn}>
                                             <Text style={styles.deleteText}>×</Text>
                                         </TouchableOpacity>
                                     )}
                                 </View>
                             ))}
                        </View>
                    </ScrollView>

                    <TouchableOpacity 
                        style={[styles.saveButton, isLookingUp && styles.saveButtonDisabled]} 
                        onPress={handleSave}
                        disabled={isLookingUp}
                    >
                        {isLookingUp ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.saveButtonText}>Add to Vocabulary</Text>
                        )}
                    </TouchableOpacity>

                    {/* NESTED POPUP */}
                    {renderTopicPopup()}

                </View>
            </TouchableOpacity>
         </Animated.View>

         {/* IMAGE SEARCH MODAL */}
         <ImageSearchModal 
            visible={imageSearchVisible}
            onClose={() => setImageSearchVisible(false)}
            onSelect={(url) => setImageUri(url)}
            initialQuery={word}
         />

         {/* FULL SCREEN LOADING OVERLAY */}
         {isLookingUp && (
             <View style={styles.loadingOverlay}>
                 <BlurView intensity={95} tint="light" style={StyleSheet.absoluteFill}>
                    <View style={styles.loadingOverlayContent}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingOverlayTitle}>Magic is happening...</Text>
                        <Text style={styles.loadingOverlaySub}>{loadingStatus}</Text>
                    </View>
                 </BlurView>
             </View>
         )}

         {/* TRANSLATE MODAL */}
         <Modal
            visible={translateModalVisible}
            animationType="fade"
            transparent
            onRequestClose={() => {
                setTranslateModalVisible(false);
                setTranslateInput('');
                setTranslateResult(null);
            }}
         >
            <TouchableOpacity
                style={styles.translateModalOverlay}
                activeOpacity={1}
                onPress={() => {
                    setTranslateModalVisible(false);
                    setTranslateInput('');
                    setTranslateResult(null);
                }}
            >
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                        style={styles.translateModalContainer}
                    >
                        <View style={styles.translateModalContent}>
                            <View style={styles.translateModalHeader}>
                                <View style={styles.translateModalHeaderLeft}>
                                    <Text style={styles.translateModalIcon}>🌐</Text>
                                    <Text style={styles.translateModalTitle}>Translate</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        setTranslateModalVisible(false);
                                        setTranslateInput('');
                                        setTranslateResult(null);
                                    }}
                                    style={styles.translateModalCloseBtn}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="close" size={22} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView 
                                style={styles.translateModalBodyScroll}
                                contentContainerStyle={styles.translateModalBody}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                {/* Input Section */}
                                <View style={styles.translateSection}>
                                    <View style={styles.translateInputContainer}>
                                        <TextInput
                                            style={styles.translateModalInput}
                                            placeholder="Enter word..."
                                            placeholderTextColor={colors.textLight}
                                            value={translateInput}
                                            onChangeText={setTranslateInput}
                                            autoFocus={true}
                                            editable={!isTranslating}
                                            multiline={false}
                                        />
                                    </View>
                                </View>

                                {/* Translate Button */}
                                <TouchableOpacity
                                    style={[
                                        styles.translateActionButton,
                                        (!translateInput.trim() || isTranslating) && styles.translateActionButtonDisabled
                                    ]}
                                    onPress={handleTranslate}
                                    disabled={!translateInput.trim() || isTranslating}
                                    activeOpacity={0.7}
                                >
                                    {isTranslating ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <>
                                            <Ionicons name="swap-horizontal" size={20} color="white" />
                                            <Text style={styles.translateActionButtonText}>Translate</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                {/* Output Section */}
                                {translateResult && (
                                    <View style={styles.translateSection}>
                                        <Text style={styles.translateSectionLabel}>English</Text>
                                        <View style={styles.translateOutputContainer}>
                                            <Text style={styles.translateResultText}>{translateResult}</Text>
                                        </View>
                                    </View>
                                )}

                                {/* Accept Button */}
                                {translateResult && (
                                    <TouchableOpacity
                                        style={styles.acceptButton}
                                        onPress={handleAcceptTranslation}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="checkmark-circle" size={22} color="white" />
                                        <Text style={styles.acceptButtonText}>Use This Word</Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </BlurView>
            </TouchableOpacity>
         </Modal>

         {/* LANGUAGE SELECT MODAL */}
         <Modal
            visible={languageSelectModalVisible}
            animationType="fade"
            transparent
            onRequestClose={() => setLanguageSelectModalVisible(false)}
         >
            <TouchableOpacity
                style={styles.languageSelectModalOverlay}
                activeOpacity={1}
                onPress={() => setLanguageSelectModalVisible(false)}
            >
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                        style={styles.languageSelectModalContainer}
                    >
                        <View style={styles.languageSelectModalContent}>
                            <View style={styles.languageSelectModalHeader}>
                                <View style={styles.languageSelectModalHeaderLeft}>
                                    <Text style={styles.languageSelectModalIcon}>🌐</Text>
                                    <Text style={styles.languageSelectModalTitle}>Choose Your Language</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setLanguageSelectModalVisible(false)}
                                    style={styles.languageSelectModalCloseBtn}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="close" size={22} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView 
                                style={styles.languageSelectModalBodyScroll}
                                contentContainerStyle={styles.languageSelectModalBody}
                                showsVerticalScrollIndicator={false}
                            >
                                <Text style={styles.languageSelectModalDescription}>
                                    Select your native language to enable translation feature.
                                </Text>

                                <View style={styles.languageSelectList}>
                                    {LANGUAGES.map((lang) => (
                                        <TouchableOpacity
                                            key={lang.code}
                                            style={styles.languageSelectItem}
                                            onPress={() => handleLanguageSelect(lang.code)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.languageSelectFlag}>{lang.flag}</Text>
                                            <Text style={styles.languageSelectName}>{lang.name}</Text>
                                            <Ionicons 
                                                name="chevron-forward" 
                                                size={20} 
                                                color={colors.textLight} 
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </BlurView>
            </TouchableOpacity>
         </Modal>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  keyboardView: { width: '100%', maxHeight: '90%' },
  card: { backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 30, height: '100%', shadowColor: '#000', shadowOffset:{width:0,height:-2}, shadowOpacity:0.1, shadowRadius:10 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  closeBtn: { width: 32, height: 32, backgroundColor: colors.backgroundSoft, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 14, color: colors.textSecondary, fontWeight: 'bold' },

  scrollContent: { paddingBottom: 40 },
  
  // Hero
  heroSection: { marginBottom: 24 },
  heroImage: { width: 60, height: 60, borderRadius: 12, marginBottom: 12, backgroundColor: colors.borderMedium },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroInput: { 
    flex: 1,
    fontSize: 32, 
    fontWeight: 'bold', 
    color: colors.textPrimary, 
    borderBottomWidth: 2, 
    borderBottomColor: colors.primaryLight, 
    paddingVertical: 8 
  },
  translateButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderMedium,
    ...shadows.soft,
  },
  
  // Camera & Image Styles
  cameraRow: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center',
      marginTop: 16, 
      paddingVertical: 14, 
      paddingHorizontal: 16, 
      backgroundColor: colors.cardWhite, 
      borderColor: colors.primary,
      borderWidth: 1,
      borderRadius: 16, 
      borderStyle: 'dashed', 
      width: '100%',
  },
  cameraIcon: { fontSize: 24, marginRight: 10 },
  cameraText: { fontSize: 16, color: colors.primary, fontWeight: '700' },

  imagePreviewContainer: { marginTop: 16, width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: colors.borderMedium },
  previewImage: { width: '100%', height: '100%' },
  removeImageBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'white' },
  removeImageText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  helperText: { fontSize: 13, color: colors.textSecondary, marginTop: 16, fontStyle: 'italic', textAlign: 'center' },

  // Sections
  sectionContainer: { marginBottom: 24 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  placeholderText: { color: colors.textLight, fontStyle: 'italic', marginTop: 8 },

  // Mini Tags Preview
  previewTagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  miniTag: { backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  miniTagText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  addTopicSmallBtn: { backgroundColor: colors.backgroundSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  addTopicSmallText: { color: colors.primary, fontWeight: '600', fontSize: 13 },

  // Examples
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addLink: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  exampleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  exampleInput: { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  deleteBtn: { padding: 8, marginLeft: 4 },
  deleteText: { fontSize: 24, color: colors.textLight, marginTop: -4 },

  saveButton: { backgroundColor: colors.primary, padding: 18, borderRadius: 20, alignItems: 'center', marginTop: 10, marginBottom: Platform.OS === 'ios' ? 20 : 0, shadowColor: colors.primary, shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:8 },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  // --- POPUP STYLES ---
  popupOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end',
  },
  popupContainer: { 
    backgroundColor: colors.white, 
    maxHeight: '80%',
    minHeight: '50%',
    padding: 20, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  popupScrollView: {
    flex: 1,
    maxHeight: 400,
  },
  popupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  popupTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  popupClose: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  
  popupSearchRow: { flexDirection: 'row', marginBottom: 20, gap: 10 },
  popupInput: { flex: 1, backgroundColor: colors.backgroundSoft, borderRadius: 12, padding: 12, fontSize: 16 },
  popupAddBtn: { backgroundColor: colors.primary, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 12 },
  popupAddText: { color: 'white', fontWeight: 'bold' },

  popupTagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 40 },
  tag: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.borderMedium },
  tagSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  tagText: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
  tagTextSelected: { color: 'white', fontWeight: 'bold' },
  emptyText: { width: '100%', textAlign: 'center', color: colors.textLight, marginTop: 40, fontStyle: 'italic' },
  
  // Loading Overlay
  loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255,255,255,0.4)',
      zIndex: 1000,
  },
  loadingOverlayContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
  },
  loadingOverlayTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 20,
      marginBottom: 10,
  },
  loadingOverlaySub: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
  },

  // Translate Modal - Apple Style
  translateModalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 40,
      marginTop: 60
  },
  translateModalContainer: {
      width: '100%',
      maxWidth: 420,
      maxHeight: '90%',
      alignItems: 'center',
      justifyContent: 'center',
  },
  translateModalContent: {
      width: '100%',
      backgroundColor: colors.white,
      borderRadius: 28,
      padding: 0,
      overflow: 'hidden',
      ...shadows.strong,
  },
  translateModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
  },
  translateModalHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  translateModalIcon: {
      fontSize: 24,
  },
  translateModalTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.5,
  },
  translateModalCloseBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.backgroundSoft,
      alignItems: 'center',
      justifyContent: 'center',
  },
  translateModalBodyScroll: {
      flexGrow: 0,
  },
  translateModalBody: {
      padding: 24,
      gap: 20,
  },
  translateSection: {
      gap: 10,
  },
  translateSectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      marginBottom: 4,
  },
  translateInputContainer: {
      backgroundColor: colors.backgroundSoft,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      overflow: 'hidden',
  },
  translateModalInput: {
      padding: 18,
      fontSize: 18,
      color: colors.textPrimary,
      fontWeight: '500',
      minHeight: 56,
  },
  translateOutputContainer: {
      backgroundColor: colors.primaryLight + '15',
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.primaryLight,
      padding: 18,
      minHeight: 56,
      justifyContent: 'center',
  },
  translateResultText: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.primary,
      letterSpacing: -0.3,
  },
  translateActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 16,
      marginTop: 4,
      ...shadows.medium,
  },
  translateActionButtonDisabled: {
      opacity: 0.5,
  },
  translateActionButtonText: {
      color: 'white',
      fontSize: 17,
      fontWeight: '600',
      letterSpacing: -0.3,
  },
  acceptButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 16,
      marginTop: 8,
      ...shadows.medium,
  },
  acceptButtonText: {
      color: 'white',
      fontSize: 17,
      fontWeight: '600',
      letterSpacing: -0.3,
  },

  // Language Select Modal
  languageSelectModalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 40,
      marginTop: 90,
  },
  languageSelectModalContainer: {
      width: '100%',
      maxWidth: 420,
      maxHeight: '85%',
      alignItems: 'center',
      justifyContent: 'center',
  },
  languageSelectModalContent: {
      width: '100%',
      backgroundColor: colors.white,
      borderRadius: 28,
      padding: 0,
      overflow: 'hidden',
      ...shadows.strong,
  },
  languageSelectModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
  },
  languageSelectModalHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  languageSelectModalIcon: {
      fontSize: 24,
  },
  languageSelectModalTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.5,
  },
  languageSelectModalCloseBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.backgroundSoft,
      alignItems: 'center',
      justifyContent: 'center',
  },
  languageSelectModalBodyScroll: {
      flexGrow: 0,
  },
  languageSelectModalBody: {
      padding: 24,
  },
  languageSelectModalDescription: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: 20,
  },
  languageSelectList: {
      gap: 8,
  },
  languageSelectItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.white,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      ...shadows.soft,
  },
  languageSelectFlag: {
      fontSize: 24,
      marginRight: 16,
  },
  languageSelectName: {
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
      color: colors.textPrimary,
  },
});
