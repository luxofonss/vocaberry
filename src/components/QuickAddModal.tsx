// QuickAddModal - Hashtag Popup Style

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Pressable,
    TextInput,
    Image,
    Platform,
    ScrollView,
    Alert,
    LayoutAnimation,
    UIManager,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, innerShadows, borderRadius, spacing } from '../theme';
import { Word } from '../types';
import { DatabaseService } from '../services/DatabaseService';
import { DictionaryService } from '../services/DictionaryService';
import { StorageService } from '../services/StorageService';
import { TranslateService } from '../services/TranslateService';
import { ImageSearchModal } from './ImageSearchModal';
import * as ImagePicker from 'expo-image-picker';
import { LANGUAGES, UI_LIMITS, ANIMATION, MESSAGES, DEFAULTS } from '../constants';
import { toBase64Uri, getScreenDimensions } from '../utils';

const { height: SCREEN_HEIGHT } = getScreenDimensions();

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
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
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
                aspect: UI_LIMITS.imageAspectRatio.standard,
                quality: UI_LIMITS.imageQuality,
                base64: true,
            });

            if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];
                setImageUri(toBase64Uri(asset.base64 ?? undefined, asset.uri));
            }
        } catch (error) {
            Alert.alert('Error', MESSAGES.errors.couldNotOpenCamera);
        }
    };

    const handleChooseFromLibrary = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: UI_LIMITS.imageAspectRatio.standard,
                quality: UI_LIMITS.imageQuality,
                base64: true,
            });

            if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];
                setImageUri(toBase64Uri(asset.base64 ?? undefined, asset.uri));
            }
        } catch (error) {
            Alert.alert('Error', MESSAGES.errors.couldNotOpenGallery);
        }
    };

    const handlePickImage = useCallback(() => {
        Alert.alert(
            MESSAGES.prompts.addImage,
            MESSAGES.prompts.imageSourceTitle,
            [
                {
                    text: MESSAGES.prompts.searchUnsplash,
                    onPress: () => setImageSearchVisible(true)
                },
                {
                    text: MESSAGES.prompts.takePhoto,
                    onPress: handleCaptureImage
                },
                {
                    text: MESSAGES.prompts.chooseFromLibrary,
                    onPress: handleChooseFromLibrary
                },
                { text: MESSAGES.prompts.cancel, style: "cancel" }
            ]
        );
    }, []);

    // Topic State
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [availableTopics, setAvailableTopics] = useState<string[]>([]);

    // Topic Popup State
    const [isTopicPopupVisible, setIsTopicPopupVisible] = useState(false);
    const [topicSearch, setTopicSearch] = useState('');

    // UI State
    const [isLookingUp, setIsLookingUp] = useState(false);

    // Focus State for inputs
    const [isHeroInputFocused, setIsHeroInputFocused] = useState(false);
    const [focusedExampleIndex, setFocusedExampleIndex] = useState<number | null>(null);
    const [isTopicSearchFocused, setIsTopicSearchFocused] = useState(false);
    const [isTranslateInputFocused, setIsTranslateInputFocused] = useState(false);

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
                    duration: ANIMATION.slow,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: ANIMATION.spring.tension,
                    friction: ANIMATION.spring.friction,
                }
                )
            ]).start();
        }
    }, [visible, fadeAnim, slideAnim]);

    const handleClose = useCallback(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: ANIMATION.normal,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: ANIMATION.normal,
                useNativeDriver: true,
            })
        ]).start(() => {
            onClose();
        });
    }, [fadeAnim, slideAnim, onClose]);

    const loadTopics = useCallback(async () => {
        const topics = await StorageService.getAllTopics();
        setAvailableTopics(topics);
    }, []);

    const loadMotherLanguage = useCallback(async () => {
        try {
            const lang = await StorageService.getMotherLanguage();
            setMotherLanguage(lang);
        } catch (error) {
            console.error('[QuickAddModal] Failed to load mother language:', error);
        }
    }, []);

    const resetForm = useCallback(() => {
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
    }, []);

    // --- TOPIC ACTIONS ---

    const handleTopicToggle = useCallback((topic: string) => {
        if (selectedTopics.includes(topic)) {
            setSelectedTopics(selectedTopics.filter(t => t !== topic));
        } else {
            setSelectedTopics([...selectedTopics, topic]);
        }
    }, [selectedTopics]);

    const createNewTopic = useCallback(() => {
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
    }, [topicSearch, availableTopics, selectedTopics]);

    // Filter topics based on search AND Sort Alphabetically
    const filteredTopics = availableTopics
        .filter(t => t.toLowerCase().includes(topicSearch.toLowerCase()));

    // --- EXAMPLE ACTIONS ---
    const handleExampleChange = useCallback((text: string, index: number) => {
        const newExamples = [...examples];
        newExamples[index] = text;
        setExamples(newExamples);
    }, [examples]);

    const addExampleSlot = useCallback(() => {
        if (examples.length >= UI_LIMITS.maxExamples) {
            Alert.alert('Maximum reached', `You can add up to ${UI_LIMITS.maxExamples} example lines only.`);
            return;
        }
        const hasEmptyExample = examples.some(ex => !ex.trim());
        if (hasEmptyExample) {
            Alert.alert('Please fill in', 'Please fill in the current example before adding a new one.');
            return;
        }
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExamples([...examples, '']);
    }, [examples]);

    const removeExampleSlot = useCallback((index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const newExamples = examples.filter((_, i) => i !== index);
        setExamples(newExamples.length > 0 ? newExamples : ['']);
    }, [examples]);

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

    const handleSave = useCallback(async () => {
        if (!word.trim()) {
            Alert.alert('Missing Info', 'Please enter a word.');
            return;
        }

        setIsLookingUp(true);

        try {
            console.log('[QuickAddModal] 🔍 Looking up word via DictionaryService...');

            // Collect user examples (Requirements 6.4)
            const customExampleTexts = examples.filter(e => e.trim().length > 0);

            // Show loading status (Requirements 6.2)
            setLoadingStatus("Looking up word...");

            // Call DictionaryService.lookup() (Requirements 6.1)
            // Pass customMainImage to preserve user's custom image (Requirements 6.3)
            const result = await DictionaryService.lookup(
                word.trim(),
                customExampleTexts,
                imageUri || undefined
            );

            if (!result) {
                Alert.alert("Not Found", MESSAGES.errors.wordNotFound);
                return;
            }

            const fetchedWord = result.word;

            // Update loading status based on whether word is still processing
            if (!fetchedWord.imageUrl || fetchedWord.imageUrl.trim() === '') {
                setLoadingStatus("Word is processing, image will load shortly...");
            } else {
                setLoadingStatus("Saving to your private library...");
            }

            // Apply selected topics
            fetchedWord.topics = selectedTopics.length > 0 ? selectedTopics : [DEFAULTS.topic];

            // Save word to database
            await DatabaseService.saveWord(fetchedWord);
            onSuccess(fetchedWord);

            // Close modal and navigate to WordDetail (Requirements 6.5)
            handleClose();
            setTimeout(() => {
                navigation.navigate('WordDetail', { wordId: fetchedWord.id });
            }, 100);
        } catch (error: any) {
            Alert.alert("Notice", error.message || MESSAGES.errors.networkError);
            console.error(error);
        } finally {
            setIsLookingUp(false);
        }
    }, [word, examples, imageUri, selectedTopics, navigation, onSuccess, handleClose]);

    // --- RENDER POPUP ---
    const renderTopicPopup = useCallback(() => {
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
                                style={[
                                    styles.popupInput,
                                    isTopicSearchFocused && styles.popupInputFocused
                                ]}
                                placeholder="Search or Create Tag..."
                                value={topicSearch}
                                onChangeText={setTopicSearch}
                                onFocus={() => setIsTopicSearchFocused(true)}
                                onBlur={() => setIsTopicSearchFocused(false)}
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
                                        </Text>             </TouchableOpacity>
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
    }, [isTopicPopupVisible, topicSearch, filteredTopics, selectedTopics, handleTopicToggle, createNewTopic, availableTopics]);

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
                                            style={[styles.heroInput,
                                            isHeroInputFocused && styles.heroInputFocused
                                            ]}
                                            placeholder="Type word..."
                                            placeholderTextColor={colors.textLight}
                                            value={word}
                                            onChangeText={setWord}
                                            onFocus={() => setIsHeroInputFocused(true)}
                                            onBlur={() => setIsHeroInputFocused(false)}
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
                                                style={[
                                                    styles.exampleInput,
                                                    focusedExampleIndex === index && styles.exampleInputFocused
                                                ]}
                                                placeholder="Use it in a sentence..."
                                                value={ex}
                                                onChangeText={(text) => handleExampleChange(text, index)}
                                                onFocus={() => setFocusedExampleIndex(index)}
                                                onBlur={() => setFocusedExampleIndex(null)}
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

                            <Pressable
                                style={({ pressed }) => [
                                    pressed && !isLookingUp ? styles.saveButtonPressed : styles.saveButton,
                                    isLookingUp && styles.saveButtonDisabled
                                ]}
                                onPress={handleSave}
                                disabled={isLookingUp}
                            >
                                {isLookingUp ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Add to Vocabulary</Text>
                                )}
                            </Pressable>

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
                {
                    isLookingUp && (
                        <View style={styles.loadingOverlay}>
                            <BlurView intensity={95} tint="light" style={StyleSheet.absoluteFill}>
                                <View style={styles.loadingOverlayContent}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                    <Text style={styles.loadingOverlayTitle}>Magic is happening...</Text>
                                    <Text style={styles.loadingOverlaySub}>{loadingStatus}</Text>
                                </View>
                            </BlurView>
                        </View>
                    )
                }

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
                    <View style={styles.translateModalOverlay}>
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                        <TouchableOpacity
                            style={StyleSheet.absoluteFill}
                            activeOpacity={1}
                            onPress={() => {
                                setTranslateModalVisible(false);
                                setTranslateInput('');
                                setTranslateResult(null);
                            }}
                        />
                        <View style={styles.translateModalContainer}>
                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={(e) => e.stopPropagation()}
                            >
                                <View style={styles.translateModalContent}>
                                    <View style={styles.translateModalHeader}>
                                        <View style={styles.translateModalHeaderLeft}>
                                            <Text style={styles.translateModalIcon}>🌐</Text>
                                            <Text style={styles.translateModalTitle}>Translate</Text>
                                        </View>                              <TouchableOpacity
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
                                            <View style={[
                                                styles.translateInputContainer,
                                                isTranslateInputFocused && styles.translateInputContainerFocused
                                            ]}>
                                                <TextInput
                                                    style={styles.translateModalInput}
                                                    placeholder="Enter word..."
                                                    placeholderTextColor={colors.textLight}
                                                    value={translateInput}
                                                    onChangeText={setTranslateInput}
                                                    onFocus={() => setIsTranslateInputFocused(true)}
                                                    onBlur={() => setIsTranslateInputFocused(false)}
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
                                                <View style={styles.translateOutputContainer}>                             <Text style={styles.translateResultText}>{translateResult}</Text>
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
                        </View>
                    </View>
                </Modal>

                {/* LANGUAGE SELECT MODAL */}
                <Modal
                    visible={languageSelectModalVisible}
                    animationType="fade"
                    transparent
                    onRequestClose={() => setLanguageSelectModalVisible(false)}
                >
                    <View style={styles.languageSelectModalOverlay}>
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                        <TouchableOpacity
                            style={StyleSheet.absoluteFill}
                            activeOpacity={1}
                            onPress={() => setLanguageSelectModalVisible(false)}
                        />
                        <View style={styles.languageSelectModalContainer}>
                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={(e) => e.stopPropagation()}
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
                                                >                                    <Text style={styles.languageSelectFlag}>{lang.flag}</Text>
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
                        </View>
                    </View >
                </Modal >
            </Animated.View >
        </Modal >
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(31, 41, 55, 0.4)', justifyContent: 'flex-end' },
    keyboardView: { width: '100%', maxHeight: '90%' },
    card: {
        backgroundColor: colors.background,
        borderTopLeftRadius: borderRadius.xxxl,
        borderTopRightRadius: borderRadius.xxxl,
        padding: spacing.xxl,
        paddingBottom: 30,
        height: '100%',
        borderWidth: 0,  // No hard borders for claymorphism
        borderTopWidth: 1,
        borderTopColor: colors.shadowInnerLight,  // Inner highlight for 3D depth
        ...shadows.clayStrong,
    },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
    closeBtn: {
        width: 36,
        height: 36,
        backgroundColor: colors.cardSurface,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        ...innerShadows.embossed,  // Embossed effect for close button
        ...shadows.claySoft,
    },
    closeText: {
        fontSize: 14, color: colors.textSecondary,
        fontWeight: '600'
    },

    scrollContent: { paddingBottom: 40 },

    // Hero
    heroSection: { marginBottom: 24 },
    heroImage: { width: 60, height: 60, borderRadius: 12, marginBottom: 12, backgroundColor: colors.borderMedium },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    heroInput: {
        flex: 1,
        flexShrink: 1,
        minWidth: 0,
        fontSize: 26,
        fontWeight: '600',
        color: colors.textPrimary,
        borderBottomWidth: 2,
        borderBottomColor: colors.primaryLight,  // Soft bottom border only
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        paddingVertical: 8,
    },
    // Hero input focused state - glow effect with enhanced border
    heroInputFocused: {
        borderBottomColor: colors.primary,
        borderBottomWidth: 3,
    },
    translateButton: {
        width: 44,
        height: 44,
        flexShrink: 0,
        borderRadius: borderRadius.clayIcon,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0,  // No border for claymorphism
        ...shadows.claySoft,
    },

    // Camera & Image Styles
    cameraRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        paddingVertical: 14,
        paddingHorizontal: 18,
        backgroundColor: colors.primarySoft,
        borderColor: colors.primaryLight,
        borderWidth: 1.5,
        borderRadius: 16,
        borderStyle: 'dashed',
        width: '100%',
    },
    cameraIcon: { fontSize: 22, marginRight: 10 },
    cameraText: { fontSize: 15, color: colors.primary, fontWeight: '600' },

    imagePreviewContainer: { marginTop: 16, width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: colors.borderMedium },
    previewImage: { width: '100%', height: '100%' },
    removeImageBtn: {
        position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'white'
    },
    removeImageText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    helperText: { fontSize: 13, color: colors.textSecondary, marginTop: 16, fontStyle: 'italic', textAlign: 'center' },

    // Sections
    sectionContainer: { marginBottom: 24 },
    sectionLabel: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    placeholderText: { color: colors.textLight, fontStyle: 'italic', marginTop: 8 },

    // Mini Tags Preview
    previewTagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    miniTag: {
        backgroundColor: colors.accent1Soft,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 2,
        borderRadius: borderRadius.sm,
        borderWidth: 0,  // No border for claymorphism
        ...shadows.claySoft,
    },
    miniTagText: { color: colors.accent1, fontWeight: '600', fontSize: 13 },
    addTopicSmallBtn: { backgroundColor: colors.backgroundSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    addTopicSmallText: { color: colors.primary, fontWeight: '600', fontSize: 13 },

    // Examples
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    addLink: { color: colors.primary, fontWeight: '600', fontSize: 14 },
    exampleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    exampleInput: {
        flex: 1,
        backgroundColor: colors.white,
        borderWidth: 1.5,
        borderColor: colors.borderLight,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        ...shadows.subtle,
    },
    // Example input focused state - glow effect with primary border
    exampleInputFocused: {
        borderColor: colors.primary,
        borderWidth: 2,
        ...shadows.clayGlow,
    },
    deleteBtn: { padding: 8, marginLeft: 4 },
    deleteText: { fontSize: 22, color: colors.textLight, marginTop: -4 },

    saveButton: {
        backgroundColor: colors.primary,
        padding: spacing.puffyMd,
        borderRadius: borderRadius.clayInput,
        alignItems: 'center',
        marginTop: 12,
        marginBottom: Platform.OS === 'ios' ? 20 : 0,
        borderWidth: 0,  // No border for claymorphism
        ...shadows.clayPrimary,
    },
    saveButtonPressed: {
        backgroundColor: colors.primaryDark,
        padding: spacing.puffyMd,
        borderRadius: borderRadius.clayInput,
        alignItems: 'center',
        marginTop: 12,
        marginBottom: Platform.OS === 'ios' ? 20 : 0,
        borderWidth: 0,
        transform: [{ scale: 0.97 }],
        ...shadows.clayPressed,
    },
    saveButtonDisabled: { opacity: 0.6 },
    saveButtonText: { color: 'white', fontSize: 17, fontWeight: '600', letterSpacing: 0.3 },

    // --- POPUP STYLES ---
    popupOverlay: {
        flex: 1,
        backgroundColor: 'rgba(31, 41, 55, 0.4)',
        justifyContent: 'flex-end',
    },
    popupContainer: {
        backgroundColor: colors.white,
        maxHeight: '80%',
        minHeight: '50%',
        padding: spacing.xxl,
        borderTopLeftRadius: borderRadius.xxl,
        borderTopRightRadius: borderRadius.xxl,
        borderWidth: 0,  // No hard borders for claymorphism
        borderTopWidth: 1,
        borderTopColor: colors.shadowInnerLight,  // Inner highlight for 3D depth
        ...shadows.clayStrong,
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
    popupInput: {
        flex: 1,
        backgroundColor: colors.backgroundSoft,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    // Popup input focused state - glow effect with primary border
    popupInputFocused: {
        borderColor: colors.primary,
        backgroundColor: colors.white,
        ...shadows.clayGlow,
    },
    popupAddBtn: { backgroundColor: colors.primary, justifyContent: 'center', paddingHorizontal: spacing.lg, borderRadius: borderRadius.sm, ...shadows.clayPrimary },
    popupAddText: { color: 'white', fontWeight: 'bold' },

    popupTagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 40 },
    tag: {
        paddingHorizontal: spacing.puffySm,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        borderWidth: 0,  // No border for claymorphism
        backgroundColor: colors.white,
        ...shadows.claySoft,
    },
    tagSelected: {
        backgroundColor: colors.secondary,
        ...shadows.clayPrimary,
    },
    tagText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
    tagTextSelected: { color: 'white', fontWeight: '600' },
    emptyText: { width: '100%', textAlign: 'center', color: colors.textLight, marginTop: 40, fontStyle: 'italic' },

    // Loading Overlay
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 251, 248, 0.85)',
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
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: 20,
        marginBottom: 8,
    },
    loadingOverlaySub: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },

    // Translate Modal - Apple Style
    translateModalOverlay: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 120 : 80,
    },
    translateModalContainer: {
        width: '100%',
        maxWidth: 380,
    },
    translateModalContent: {
        width: '100%',
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: 0,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.borderSoft,
        ...shadows.clayStrong,
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
    // Translate input container focused state - glow effect with primary border
    translateInputContainerFocused: {
        borderColor: colors.primary,
        borderWidth: 2,
        backgroundColor: colors.white,
        ...shadows.clayGlow,
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
        paddingVertical: 14,
        paddingHorizontal: 22,
        borderRadius: 16,
        marginTop: 4,
        ...shadows.clayPrimary,
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
        backgroundColor: colors.secondary,
        paddingVertical: 14,
        paddingHorizontal: 22,
        borderRadius: 16,
        marginTop: 8,
        ...shadows.claySecondary,
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
        paddingHorizontal: 20,
    },
    languageSelectModalContainer: {
        width: '100%',
        maxWidth: 380,
        maxHeight: SCREEN_HEIGHT - 160,
    },
    languageSelectModalContent: {
        width: '100%',
        maxHeight: '100%',
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: 0,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.borderSoft,
        ...shadows.clayStrong,
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
        flex: 1,
        maxHeight: SCREEN_HEIGHT - 320,
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
        padding: 14,
        backgroundColor: colors.white,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: colors.borderLight,
        ...shadows.subtle,
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
