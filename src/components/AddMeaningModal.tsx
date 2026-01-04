// Add Meaning Modal - Form to add new meaning to a word

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
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, shadows, borderRadius } from '../theme';
import { Meaning, Word } from '../types';
import { ImageSearchModal } from './ImageSearchModal';
import { ImageViewerModal } from './ImageViewerModal';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PARTS_OF_SPEECH = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'pronoun',
  'preposition',
  'conjunction',
  'interjection',
];

interface AddMeaningModalProps {
  visible: boolean;
  word: Word | null;
  onClose: () => void;
  onSave: (meaning: Meaning) => void;
}

export const AddMeaningModal: React.FC<AddMeaningModalProps> = ({
  visible,
  word,
  onClose,
  onSave,
}) => {
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [definition, setDefinition] = useState('');
  const [example, setExample] = useState('');
  const [exampleImageUrl, setExampleImageUrl] = useState<string>('');
  const [imageSearchVisible, setImageSearchVisible] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && word) {
      // Reset form and set defaults
      setPartOfSpeech('');
      setPhonetic(word.phonetic || '');
      setDefinition('');
      setExample('');
      setExampleImageUrl('');
    }
  }, [visible, word]);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need access to your photos to add images.');
        return;
      }

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
        setExampleImageUrl(base64Uri);
      }
    } catch (error) {
      console.error('[AddMeaningModal] Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera access to take photos.');
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
        setExampleImageUrl(base64Uri);
      }
    } catch (error) {
      console.error('[AddMeaningModal] Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleSearchImage = () => {
    setImageSearchVisible(true);
  };

  const handleImageSearchSelect = (imageUrl: string) => {
    setExampleImageUrl(imageUrl);
    setImageSearchVisible(false);
  };

  const handleViewImage = () => {
    if (exampleImageUrl) {
      setImageViewerVisible(true);
    }
  };

  const handleImageChange = (newImageUrl: string) => {
    setExampleImageUrl(newImageUrl);
    setImageViewerVisible(false);
  };

  const handleSave = () => {
    if (!definition.trim()) {
      Alert.alert('Required Field', 'Please enter a definition.');
      return;
    }

    if (!word) return;

    const newMeaning: Meaning = {
      id: `${word.id}-meaning-${Date.now()}`,
      partOfSpeech: partOfSpeech.trim() || undefined,
      phonetic: phonetic.trim() || word.phonetic || undefined,
      definition: definition.trim(),
      example: example.trim() || undefined,
      exampleImageUrl: exampleImageUrl || undefined,
    };

    setIsSaving(true);
    try {
      onSave(newMeaning);
      // Reset form
      setPartOfSpeech('');
      setPhonetic(word.phonetic || '');
      setDefinition('');
      setExample('');
      setExampleImageUrl('');
      onClose();
    } catch (error) {
      console.error('[AddMeaningModal] Error saving:', error);
      Alert.alert('Error', 'Failed to save meaning');
    } finally {
      setIsSaving(false);
    }
  };

  if (!word) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Add Meaning</Text>
            <View style={{ width: 40 }} />
          </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Part of Speech */}
              <View style={styles.section}>
                <Text style={styles.label}>Part of Speech (Optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.posScroll}>
                  {PARTS_OF_SPEECH.map((pos) => (
                    <TouchableOpacity
                      key={pos}
                      style={[
                        styles.posChip,
                        partOfSpeech === pos && styles.posChipActive,
                      ]}
                      onPress={() => setPartOfSpeech(partOfSpeech === pos ? '' : pos)}
                    >
                      <Text
                        style={[
                          styles.posChipText,
                          partOfSpeech === pos && styles.posChipTextActive,
                        ]}
                      >
                        {pos}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Phonetic */}
              <View style={styles.section}>
                <Text style={styles.label}>Pronunciation (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder={word.phonetic || '/.../'}
                  placeholderTextColor={colors.textLight}
                  value={phonetic}
                  onChangeText={setPhonetic}
                />
              </View>

              {/* Definition */}
              <View style={styles.section}>
                <Text style={styles.label}>Definition *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter definition..."
                  placeholderTextColor={colors.textLight}
                  value={definition}
                  onChangeText={setDefinition}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Example */}
              <View style={styles.section}>
                <Text style={styles.label}>Example (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter example sentence..."
                  placeholderTextColor={colors.textLight}
                  value={example}
                  onChangeText={setExample}
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Image */}
              <View style={styles.section}>
                <Text style={styles.label}>Example Image (Optional)</Text>
                {exampleImageUrl ? (
                  <TouchableOpacity
                    style={styles.imagePreview}
                    onPress={handleViewImage}
                  >
                    <Image
                      source={{ uri: exampleImageUrl }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    <View style={styles.imageOverlay}>
                      <Text style={styles.imageOverlayText}>Tap to view/edit</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.imageButtons}>
                    <TouchableOpacity
                      style={styles.imageButton}
                      onPress={handlePickImage}
                    >
                      <Text style={styles.imageButtonText}>📷 Upload</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.imageButton}
                      onPress={handleTakePhoto}
                    >
                      <Text style={styles.imageButtonText}>📸 Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.imageButton}
                      onPress={handleSearchImage}
                    >
                      <Text style={styles.imageButtonText}>🔍 Search</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isSaving || !definition.trim()}
              >
                {isSaving ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Save Meaning</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <ImageSearchModal
        visible={imageSearchVisible}
        onClose={() => setImageSearchVisible(false)}
        onSelect={handleImageSearchSelect}
        initialQuery={word.word}
      />

      <ImageViewerModal
        visible={imageViewerVisible}
        imageUrl={exampleImageUrl}
        onClose={() => setImageViewerVisible(false)}
        onImageChange={handleImageChange}
        allowEdit={true}
        initialQuery={word.word}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: colors.textSecondary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.sizes.base,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  posScroll: {
    marginTop: spacing.xs,
  },
  posChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.backgroundSoft,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  posChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  posChipText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  posChipTextActive: {
    fontWeight: typography.weights.bold,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  imageButton: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  imageButtonText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.base,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: spacing.sm,
    alignItems: 'center',
  },
  imageOverlayText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadows.medium,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
});

