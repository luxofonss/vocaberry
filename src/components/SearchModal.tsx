import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
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
import { useDebounce } from '../hooks';
import { UI_LIMITS } from '../constants';

interface SearchModalProps {
    visible: boolean;
    words: Word[];
    onClose: () => void;
    onSelectWord: (word: Word) => void;
}

// Memoized result item to prevent re-renders
const SearchResultItem = memo(({
    item,
    onPress
}: {
    item: Word;
    onPress: () => void;
}) => (
    <TouchableOpacity
        style={styles.resultItem}
        onPress={onPress}
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
));

export const SearchModal: React.FC<SearchModalProps> = ({
    visible,
    words,
    onClose,
    onSelectWord,
}) => {
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 200);

    useEffect(() => {
        if (visible) {
            setQuery('');
        }
    }, [visible]);

    // Memoized search results
    const results = useMemo(() => {
        if (!debouncedQuery.trim()) return [];

        const lowerQuery = debouncedQuery.toLowerCase();
        const filtered = words.filter(w =>
            w.word.toLowerCase().includes(lowerQuery) ||
            w.meanings.some(m => m.definition.toLowerCase().includes(lowerQuery))
        );
        return filtered.slice(0, UI_LIMITS.maxSearchResults);
    }, [debouncedQuery, words]);

    const handleSelectWord = useCallback((word: Word) => {
        onSelectWord(word);
        onClose();
    }, [onSelectWord, onClose]);

    const renderItem = useCallback(({ item }: { item: Word }) => (
        <SearchResultItem
            item={item}
            onPress={() => handleSelectWord(item)}
        />
    ), [handleSelectWord]);

    const keyExtractor = useCallback((item: Word) => item.id, []);

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.searchBar}>  <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Search vocabulary..."
                            placeholderTextColor={colors.textLight}
                            value={query}
                            onChangeText={setQuery}
                            autoFocus={true}
                            returnKeyType="search"
                            clearButtonMode="while-editing"
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
                            keyExtractor={keyExtractor}
                            contentContainerStyle={styles.listContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            removeClippedSubviews={true}
                            maxToRenderPerBatch={10}
                            windowSize={5}
                            initialNumToRender={10}
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
