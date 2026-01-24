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
import { colors, spacing, borderRadius, shadows } from '../theme';
import { ImageSearchModal } from './ImageSearchModal';
import { CameraIcon } from './icons/CameraIcon';
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
                <CameraIcon size={28} tintColor={colors.white} />
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
  // Claymorphism close button - floating 3D clay circle
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cardSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    shadowColor: colors.shadowOuter,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  closeText: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  // Claymorphism edit button - floating 3D clay circle with primary color
  editButton: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  editIcon: {
    fontSize: 24,
  },
});
