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
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { colors, theme, shadows, typography } from '../theme';
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
    setResults(filtered);
  }, [query, words]);

  const renderItem = ({ item }: { item: Word }) => (
    <TouchableOpacity 
        style={styles.resultItem} 
        onPress={() => {
            onSelectWord(item);
            onClose();
        }}
    >
        {item.imageUrl && item.imageUrl.trim() !== '' ? (
            <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
        ) : (
            <View style={[styles.thumbnail, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F2F5' }]}>
                <ActivityIndicator size="small" color="#5D5FEF" />
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
        <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="fade" transparent>
        <TouchableOpacity 
            style={styles.overlay} 
            activeOpacity={1} 
            onPress={onClose}
        >
             <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={styles.container}
             >
                <TouchableOpacity 
                    activeOpacity={1} 
                    onPress={(e) => e.stopPropagation()}
                    style={{ flex: 1 }}
                >
                    {/* Search Header */}
                    <View style={styles.searchHeader}>
                        <Text style={styles.searchIcon}>🔍</Text>
                        <TextInput 
                            style={styles.input}
                            placeholder="Search your vocabulary..."
                            placeholderTextColor={colors.textLight}
                            value={query}
                            onChangeText={setQuery}
                            autoFocus={true}
                        />
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Results List */}
                    {results.length > 0 ? (
                        <FlatList 
                            data={results}
                            renderItem={renderItem}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContent}
                            keyboardShouldPersistTaps="handled"
                        />
                    ) : (
                        query.length > 0 && (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyEmoji}>🤔</Text>
                                <Text style={styles.emptyText}>No matches found</Text>
                            </View>
                        )
                    )}
                    
                     {/* Quick Hint */}
                     {!query && (
                         <View style={styles.hintContainer}>
                             <Text style={styles.hintText}>Type to find words definitions...</Text>
                         </View>
                     )}
                </TouchableOpacity>
             </KeyboardAvoidingView>
        </TouchableOpacity>
    </Modal>

  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Glassy white background
  },
  container: {
      flex: 1,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  searchHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
  },
  searchIcon: {
      fontSize: 20,
      marginRight: 10,
  },
  input: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      height: 40,
  },
  closeBtn: {
      marginLeft: 10,
      padding: 4,
  },
  closeText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '600',
  },

  listContent: {
      paddingHorizontal: 20,
      paddingTop: 10,
  },
  resultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
  },
  thumbnail: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: colors.backgroundSoft,
      marginRight: 12,
  },
  textContainer: {
      flex: 1,
  },
  wordText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
  },
  defText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
  },
  arrow: {
      fontSize: 18,
      color: colors.textLight,
  },

  emptyContainer: {
      alignItems: 'center',
      marginTop: 60,
      opacity: 0.6,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 16, color: colors.textSecondary },

  hintContainer: { alignItems: 'center', marginTop: 100, opacity: 0.5 },
  hintText: { fontSize: 14, color: colors.textLight },
});
