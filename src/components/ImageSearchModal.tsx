import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GAP = spacing.sm;
const PADDING = spacing.md;
const ITEM_SIZE = (SCREEN_WIDTH - PADDING * 2 - GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

const UNSPLASH_ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY || '';

interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  user: {
    name: string;
  };
}

interface ImageSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  initialQuery?: string;
}

export const ImageSearchModal: React.FC<ImageSearchModalProps> = ({
  visible,
  onClose,
  onSelect,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && initialQuery) {
      setQuery(initialQuery);
      searchImages(initialQuery);
    }
  }, [visible, initialQuery]);

  const searchImages = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    setImages([]);
    
    try {
      if (!UNSPLASH_ACCESS_KEY) {
        setError('Vui lòng cấu hình EXPO_PUBLIC_UNSPLASH_ACCESS_KEY trong file .env để sử dụng Unsplash.');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=30&orientation=squarish`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }
      );
      
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.errors?.[0] || 'Failed to fetch from Unsplash');
      }
      
      const data = await response.json();
      setImages(data.results);
    } catch (err: any) {
      setError(err.message);
      console.error('[ImageSearch] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (imageUrl: string) => {
    setLoading(true);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      onSelect(base64);
      onClose();
    } catch (e) {
      onSelect(imageUrl);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: UnsplashImage }) => (
    <TouchableOpacity 
      style={styles.imageCard} 
      onPress={() => handleSelect(item.urls.regular)}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: item.urls.small }} 
        style={styles.thumbnail} 
        resizeMode="cover"
      />
      <View style={styles.creditBadge}>
        <Text style={styles.creditText} numberOfLines={1}>
          By {item.user.name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chọn ảnh từ Unsplash</Text>
            <View style={styles.placeholderIcon} /> 
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm ảnh (ví dụ: cat, office...)"
                placeholderTextColor={colors.textLight}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => searchImages(query)}
                returnKeyType="search"
                autoFocus={false}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={18} color={colors.textLight} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Content */}
          {loading && images.length === 0 ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
            </View>
          ) : (
            <FlatList
              data={images}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              numColumns={COLUMN_COUNT}
              contentContainerStyle={styles.listContent}
              columnWrapperStyle={styles.columnWrapper}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                !loading && initialQuery ? (
                  <View style={styles.centered}>
                    <Ionicons name="images-outline" size={80} color={colors.borderMedium} style={{ marginBottom: spacing.md }} />
                    <Text style={styles.emptyText}>Không tìm thấy ảnh nào</Text>
                    <Text style={styles.suggestionText}>Hãy thử từ khóa tiếng Anh (VD: Apple, Book)</Text>
                  </View>
                ) : null
              }
            />
          )}

          {loading && images.length > 0 && (
            <View style={styles.overlayLoading}>
               <View style={styles.loadingBox}>
                 <ActivityIndicator color={colors.white} size="large" />
                 <Text style={styles.processingText}>Đang tải ảnh...</Text>
               </View>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.cardWhite,
    marginTop: Platform.OS === 'android' ? 30 : 0
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundSoft,
  },
  placeholderIcon: {
    width: 32,
  },
  
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.cardWhite,
    ...shadows.sm,
    zIndex: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSoft,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    height: '100%',
  },
  clearButton: {
    padding: spacing.xs,
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
  errorText: {
    color: colors.error,
    marginLeft: spacing.sm,
    flex: 1,
    fontSize: 14,
  },

  listContent: {
    padding: PADDING,
    paddingBottom: spacing.xxl,
  },
  columnWrapper: {
    gap: GAP,
  },
  imageCard: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSoft,
    overflow: 'hidden',
    marginBottom: GAP,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  creditBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  creditText: {
    color: colors.white,
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },

  centered: {
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 14,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  overlayLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingBox: {
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  processingText: {
    color: colors.white,
    marginTop: spacing.sm,
    fontSize: 14,
    fontWeight: '500',
  }
});
