import React, { useState, useEffect, useCallback } from 'react';
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
import { BlurView } from 'expo-blur';
import { colors, spacing, borderRadius, shadows } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_SIZE = (SCREEN_WIDTH - spacing.xl * 2 - spacing.md) / COLUMN_COUNT;

// This would ideally be in a service or .env
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
      // Convert to base64 for offline storage if possible or just use the URL
      // Since our app uses base64 for local persistence of custom images, we should ideally convert it.
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const base64: string = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      onSelect(base64);
      onClose();
    } catch (e) {
      // If conversion fails, just use the URL
      onSelect(imageUrl);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: UnsplashImage }) => (
    <TouchableOpacity 
      style={styles.imageWrapper} 
      onPress={() => handleSelect(item.urls.regular)}
    >
      <Image source={{ uri: item.urls.small }} style={styles.image} />
      <View style={styles.authorBadge}>
        <Text style={styles.authorText}>{item.user.name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Search Photos</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.searchBar}>
            <TextInput
              style={styles.input}
              placeholder="Search high-quality photos..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => searchImages(query)}
              returnKeyType="search"
              autoFocus
            />
            <TouchableOpacity 
              style={styles.searchBtn} 
              onPress={() => searchImages(query)}
            >
              <Text style={styles.searchIcon}>🔍</Text>
            </TouchableOpacity>
          </View>

          {loading && !images.length ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.white} />
              <Text style={styles.statusText}>Searching Unsplash...</Text>
            </View>
          ) : (
            <FlatList
              data={images}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              numColumns={COLUMN_COUNT}
              contentContainerStyle={styles.listContent}
              columnWrapperStyle={styles.columnWrapper}
              ListEmptyComponent={
                !loading ? (
                    <View style={styles.center}>
                        <Text style={styles.statusText}>No photos found. Try another word!</Text>
                    </View>
                ) : null
              }
            />
          )}

          {loading && images.length > 0 && (
              <View style={styles.bottomLoading}>
                <ActivityIndicator color={colors.white} />
              </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'transparent' },
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: spacing.md, 
    marginTop: Platform.OS === 'android' ? 40 : 0 
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  closeIcon: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
  title: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
  
  searchBar: { 
    flexDirection: 'row', 
    margin: spacing.md, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    borderRadius: borderRadius.lg, 
    paddingHorizontal: spacing.md, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  input: { flex: 1, height: 50, color: colors.white, fontSize: 16 },
  searchBtn: { padding: spacing.sm },
  searchIcon: { fontSize: 18 },

  listContent: { padding: spacing.xl, paddingBottom: 100 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: spacing.md },
  imageWrapper: { 
    width: ITEM_SIZE, 
    height: ITEM_SIZE, 
    borderRadius: borderRadius.md, 
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    ...shadows.soft
  },
  image: { width: '100%', height: '100%' },
  authorBadge: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
      padding: spacing.xs,
  },
  authorText: { color: colors.white, fontSize: 10, textAlign: 'center' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  statusText: { color: 'rgba(255,255,255,0.7)', marginTop: spacing.md, textAlign: 'center' },
  bottomLoading: { padding: spacing.md },
});
