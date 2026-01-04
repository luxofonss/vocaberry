import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  Image,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing } from '../theme';
import { Word } from '../types';

interface SearchModalProps {
  visible: boolean;
  words: Word[];
  onClose: () => void;
  onSelectWord: (word: Word) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  visible,
  words,
  onClose,
  onSelectWord,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Word[]>([]);

  useEffect(() => {
    if (visible) {
        setQuery('');
        setResults([]);
    }
  }, [visible]);

  useEffect(() => {
    if (!query.trim()) {
        setResults([]);
        return;
    }
    
    const lowerQuery = query.toLowerCase();
    const filtered = words.filter(w => 
        w.word.toLowerCase().includes(lowerQuery) || 
        w.meanings.some(m => m.definition.toLowerCase().includes(lowerQuery))
    );
    // Limit results for better performance
    setResults(filtered.slice(0, 50));
  }, [query, words]);

  const renderItem = ({ item }: { item: Word }) => (
    <TouchableOpacity 
        style={styles.resultItem} 
        onPress={() => {
            onSelectWord(item);
            onClose();
        }}
        activeOpacity={0.7}
    >
        {item.imageUrl && item.imageUrl.trim() !== '' ? (
            <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
        ) : (
            <View style={styles.placeholderThumbnail}>
                <Ionicons name="image-outline" size={20} color={colors.primary} />
            </View>
        )}
        <View style={styles.textContainer}>
            <Text style={styles.wordText}>{item.word}</Text>
            {item.meanings[0] && (
                <Text style={styles.defText} numberOfLines={1}>
                    {item.meanings[0].definition}
                </Text>
            )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                    <TextInput 
                        style={styles.input}
                        placeholder="Search vocabulary..."
                        placeholderTextColor={colors.textLight}
                        value={query}
                        onChangeText={setQuery}
                        autoFocus={true}
                        returnKeyType="search"
                        clearButtonMode="while-editing" // iOS only native clear btn
                    />
                    {query.length > 0 && Platform.OS !== 'ios' && (
                         <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
                             <Ionicons name="close-circle" size={18} color={colors.textLight} />
                         </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {results.length > 0 ? (
                    <FlatList 
                        data={results}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    query.length > 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="search-outline" size={64} color={colors.borderMedium} />
                            <Text style={styles.emptyText}>No matches found</Text>
                            <Text style={styles.emptySubText}>Try checking your spelling</Text>
                        </View>
                    ) : (
                         <View style={styles.emptyContainer}>
                             <Ionicons name="book-outline" size={64} color={colors.borderMedium} />
                             <Text style={styles.emptyText}>Find your words</Text>
                             <Text style={styles.emptySubText}>Type to search across your vocabulary</Text>
                         </View>
                    )
                )}
            </View>
        </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
      flex: 1,
      backgroundColor: colors.background, // Solid white background
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      backgroundColor: colors.white,
  },
  searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSoft,
      borderRadius: borderRadius.lg,
      height: 44,
      paddingHorizontal: spacing.sm,
  },
  searchIcon: {
      marginLeft: spacing.xs,
      marginRight: spacing.xs,
  },
  input: {
      flex: 1,
      fontSize: 16,
      color: colors.textPrimary,
      height: '100%',
  },
  clearBtn: {
      padding: spacing.xs,
  },
  cancelBtn: {
      marginLeft: spacing.md,
      paddingVertical: spacing.xs,
  },
  cancelText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '600',
  },

  content: {
      flex: 1,
      backgroundColor: colors.background,
  },
  listContent: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl,
  },

  resultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      backgroundColor: colors.white,
  },
  thumbnail: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.md,
      backgroundColor: colors.backgroundSoft,
      marginRight: spacing.md,
  },
  placeholderThumbnail: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
  },
  textContainer: {
      flex: 1,
      justifyContent: 'center',
  },
  wordText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 2,
  },
  defText: {
      fontSize: 14,
      color: colors.textSecondary,
  },

  emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 100,
  },
  emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      marginTop: spacing.md,
  },
  emptySubText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: spacing.xs,
  },
});
