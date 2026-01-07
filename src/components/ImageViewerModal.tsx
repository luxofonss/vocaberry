// Image Viewer Modal - Full Screen Image with Edit Option
import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius } from '../theme';
import { ImageSearchModal } from './ImageSearchModal';
import { IMAGE_VIEWER_TEXTS, UI_LIMITS } from '../constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageViewerModalProps {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
  onImageChange?: (newImageUrl: string) => void;
  allowEdit?: boolean;
  initialQuery?: string; // For Unsplash search
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  visible,
  imageUrl,
  onClose,
  onImageChange,
  allowEdit = false,
  initialQuery = '',
}) => {
  const [imageSearchVisible, setImageSearchVisible] = useState(false);

  const handlePickImage = useCallback(() => {
    if (!allowEdit || !onImageChange) return;

    Alert.alert(
      IMAGE_VIEWER_TEXTS.changeImage,
      IMAGE_VIEWER_TEXTS.howToUpdate,
      [
        {
          text: IMAGE_VIEWER_TEXTS.searchUnsplash,
          onPress: () => setImageSearchVisible(true)
        },
        {
          text: IMAGE_VIEWER_TEXTS.takePhoto,
          onPress: () => handleCaptureImage()
        },
        {
          text: IMAGE_VIEWER_TEXTS.library,
          onPress: () => handleChooseFromLibrary()
        },
        { text: IMAGE_VIEWER_TEXTS.cancel, style: "cancel" }
      ]
    );
  }, [allowEdit, onImageChange]);

  const handleCaptureImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(IMAGE_VIEWER_TEXTS.notification, IMAGE_VIEWER_TEXTS.cameraPermission);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: UI_LIMITS.imageAspectRatio.square,
        quality: UI_LIMITS.imageQuality,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64 && onImageChange) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        onImageChange(base64Image);
        onClose();
      }
    } catch (error) {
      Alert.alert(IMAGE_VIEWER_TEXTS.error, IMAGE_VIEWER_TEXTS.cannotTakePhoto);
    }
  }, [onImageChange, onClose]);

  const handleChooseFromLibrary = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: UI_LIMITS.imageAspectRatio.square,
        quality: UI_LIMITS.imageQuality,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64 && onImageChange) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        onImageChange(base64Image);
        onClose();
      }
    } catch (error) {
      Alert.alert(IMAGE_VIEWER_TEXTS.error, IMAGE_VIEWER_TEXTS.cannotOpenLibrary);
    }
  }, [onImageChange, onClose]);

  const handleSearchSelect = useCallback((url: string) => {
    if (onImageChange) {
      onImageChange(url);
      onClose();
    }
  }, [onImageChange, onClose]);

  if (!visible || !imageUrl || imageUrl.trim() === '') return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={100} tint="dark" style={styles.overlay}>
        <TouchableOpacity
          style={styles.closeArea}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.fullImage}
              resizeMode="contain"
            />

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            {/* Edit Button (if allowed) */}
            {allowEdit && onImageChange && (
              <TouchableOpacity style={styles.editButton} onPress={handlePickImage}>
                <Text style={styles.editIcon}>📸</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </BlurView>

      {allowEdit && (
        <ImageSearchModal
          visible={imageSearchVisible}
          onClose={() => setImageSearchVisible(false)}
          onSelect={handleSearchSelect}
          initialQuery={initialQuery}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  closeText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  editButton: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  editIcon: {
    fontSize: 24,
  },
});

