import React, { useState, useEffect, useCallback } from 'react';
import {
     View,
     Text,
     StyleSheet,
     FlatList,
     TouchableOpacity,
     Image,
     RefreshControl,
     Animated,
     ScrollView,
     Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { gradients } from '../theme/styles';
import { Conversation, RootStackParamList, Word } from '../types';
import { ConversationService } from '../services/ConversationService';
import { DictionaryService } from '../services/DictionaryService';
import { StorageService } from '../services/StorageService';
import { WordPreviewModal, ClickableText } from '../components';
import { SafeAreaView } from 'react-native-safe-area-context';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const DiscoverScreen: React.FC = () => {
     const navigation = useNavigation<NavigationProp>();
     const [conversations, setConversations] = useState<Conversation[]>([]);
     const [suggestedWords, setSuggestedWords] = useState<{ id: string, word: string, definition: string }[]>([]);
     const [loading, setLoading] = useState(true);
     const [refreshing, setRefreshing] = useState(false);

     // Lookup state
     const [modalVisible, setModalVisible] = useState(false);
     const [selectedWordData, setSelectedWordData] = useState<any>(null);
     const [isSelectedWordNew, setIsSelectedWordNew] = useState(false);
     const [isLookupLoading, setIsLookupLoading] = useState(false);
     const [lookupStatus, setLookupStatus] = useState('');

     const loadData = useCallback(async () => {
          try {
               const [convs, words] = await Promise.all([
                    ConversationService.getConversations(),
                    ConversationService.getSuggestedWords()
               ]);
               setConversations(convs);
               setSuggestedWords(words);
          } catch (error) {
               console.error('Failed to load conversations:', error);
          } finally {
               setLoading(false);
               setRefreshing(false);
          }
     }, []);

     useEffect(() => {
          loadData();
     }, [loadData]);

     const handleRefresh = () => {
          setRefreshing(true);
          loadData();
     };

     const handleWordPress = async (word: string) => {
          setIsLookupLoading(true);
          setModalVisible(true);
          setLookupStatus('Looking up...');

          try {
               // 1. Check if word exists in library
               const existingWords = await StorageService.getWords();
               const existing = existingWords.find(w => w.word.toLowerCase() === word.toLowerCase());

               if (existing) {
                    setSelectedWordData(existing);
                    setIsSelectedWordNew(false);
                    setLookupStatus('');
               } else {
                    // 2. Lookup from dictionary service
                    const data = await DictionaryService.lookup(word);
                    if (data) {
                         setSelectedWordData(data.word);
                         setIsSelectedWordNew(true);
                         setLookupStatus('');
                    } else {
                         Alert.alert("Notice", `Could not find details for "${word}".`);
                         setModalVisible(false);
                    }
               }
          } catch (error) {
               console.error('Lookup error:', error);
               setModalVisible(false);
          } finally {
               setIsLookupLoading(false);
          }
     };

     const renderConversationCard = ({ item }: { item: Conversation }) => (
          <TouchableOpacity
               style={[styles.card, shadows.claySoft]}
               activeOpacity={0.9}
               onPress={() => navigation.navigate('ConversationDetail', { conversationId: item.id })}
          >
               <View style={styles.cardHeader}>
                    <View style={styles.categoryBadge}>
                         <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                    <View style={[
                         styles.difficultyBadge,
                         item.difficulty === 'beginner' ? styles.beginnerBadge :
                              item.difficulty === 'intermediate' ? styles.intermediateBadge : styles.advancedBadge
                    ]}>
                         <Text style={styles.difficultyText}>{item.difficulty}</Text>
                    </View>
               </View>

               <Text style={styles.cardTitle}>{item.title}</Text>
               <ClickableText
                    text={item.description || ''}
                    style={styles.cardDescription}
                    onWordPress={handleWordPress}
                    numberOfLines={2}
               />

               <View style={styles.cardFooter}>
                    <View style={styles.messageCount}>
                         <Ionicons name="chatbubbles-outline" size={16} color={colors.textSecondary} />
                         <Text style={styles.footerText}>{item.messages.length} messages</Text>
                    </View>
                    <View style={styles.practiceInfo}>
                         <Ionicons name="stats-chart-outline" size={16} color={colors.textSecondary} />
                         <Text style={styles.footerText}>{item.practiceCount} practices</Text>
                    </View>
                    <TouchableOpacity style={styles.arrowContainer}>
                         <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                    </TouchableOpacity>
               </View>
          </TouchableOpacity>
     );

     return (
          <LinearGradient
               colors={gradients.backgroundMain.colors as [string, string, ...string[]]}
               start={gradients.backgroundMain.start}
               end={gradients.backgroundMain.end}
               style={styles.container}
          >
               <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
                    <View style={styles.header}>
                         <View style={styles.headerTop}>
                              <View style={styles.greetingContainer}>
                                   <Text style={styles.title}>Discovery 🚀</Text>
                                   <Text style={styles.subtitle}>Suggested practice for you</Text>
                              </View>
                         </View>
                    </View>

                    <FlatList
                         data={conversations}
                         renderItem={renderConversationCard}
                         keyExtractor={(item) => item.id}
                         contentContainerStyle={styles.listContent}
                         showsVerticalScrollIndicator={false}
                         refreshControl={
                              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
                         }
                         ListHeaderComponent={
                              <View style={styles.suggestedWordsSection}>
                                   <Text style={styles.sectionTitle}>New Words for You</Text>
                                   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wordsScroll}>
                                        {suggestedWords.map(sw => (
                                             <TouchableOpacity
                                                  key={sw.id}
                                                  style={[styles.wordChip, shadows.claySoft]}
                                                  onPress={() => handleWordPress(sw.word)}
                                             >
                                                  <Text style={styles.wordChipText}>{sw.word}</Text>
                                                  <Text style={styles.wordChipDef} numberOfLines={1}>{sw.definition}</Text>
                                             </TouchableOpacity>
                                        ))}
                                   </ScrollView>
                                   <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Conversations</Text>
                              </View>
                         }
                         ListEmptyComponent={
                              !loading ? (
                                   <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>No suggestions found.</Text>
                                   </View>
                              ) : null
                         }
                    />

                    <WordPreviewModal
                         visible={modalVisible}
                         wordData={selectedWordData}
                         isNew={isSelectedWordNew}
                         isLoading={isLookupLoading}
                         statusText={lookupStatus}
                         onClose={() => setModalVisible(false)}
                         onSave={(newWord) => {
                              // Optional: refresh any local state if needed
                              setIsSelectedWordNew(false);
                              setSelectedWordData(newWord);
                         }}
                         onGoToDetail={(wordId) => {
                              navigation.navigate('WordDetail', { wordId });
                         }}
                    />
               </SafeAreaView>
          </LinearGradient>
     );
};

const styles = StyleSheet.create({
     container: {
          flex: 1,
     },
     header: {
          paddingHorizontal: spacing.screenPadding,
          paddingTop: 0, // Removed extra padding since it's inside SafeAreaView
          paddingBottom: spacing.xs,
     },
     headerTop: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: spacing.xxs,
     },
     greetingContainer: {
          // Removed flex: 1 to prevent collapsing
          marginRight: spacing.md,
     },
     title: {
          fontSize: typography.sizes.xxl,
          fontWeight: typography.weights.extraBold,
          color: colors.textPrimary,
     },
     subtitle: {
          fontSize: typography.sizes.base,
          color: colors.textSecondary,
          marginTop: 4,
     },
     listContent: {
          paddingHorizontal: spacing.screenPadding,
          paddingBottom: 100,
     },
     card: {
          backgroundColor: colors.white,
          borderRadius: 24,
          padding: spacing.lg,
          marginBottom: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.shadowInnerLight,
     },
     cardHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: spacing.sm,
     },
     categoryBadge: {
          backgroundColor: '#F3F4F6',
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12,
     },
     categoryText: {
          fontSize: 12,
          fontWeight: '700',
          color: '#4B5563',
     },
     difficultyBadge: {
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12,
     },
     beginnerBadge: {
          backgroundColor: '#ECFDF5',
     },
     intermediateBadge: {
          backgroundColor: '#FFFBEB',
     },
     advancedBadge: {
          backgroundColor: '#FEF2F2',
     },
     difficultyText: {
          fontSize: 11,
          fontWeight: '800',
          textTransform: 'uppercase',
          color: '#059669', // Default for beginner
     },
     cardTitle: {
          fontSize: 20,
          fontWeight: '800',
          color: colors.textPrimary,
          marginBottom: 8,
     },
     cardDescription: {
          fontSize: 14,
          color: colors.textSecondary,
          lineHeight: 20,
          marginBottom: spacing.md,
     },
     cardFooter: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          paddingTop: spacing.md,
     },
     messageCount: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
     },
     practiceInfo: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
     },
     footerText: {
          fontSize: 13,
          color: colors.textSecondary,
          fontWeight: '600',
     },
     arrowContainer: {
          marginLeft: 'auto',
     },
     emptyContainer: {
          alignItems: 'center',
          marginTop: 40,
     },
     emptyText: {
          color: colors.textSecondary,
          fontSize: 16,
     },
     suggestedWordsSection: {
          marginBottom: spacing.lg,
          paddingTop: spacing.sm,
     },
     sectionTitle: {
          fontSize: 18,
          fontWeight: '800',
          color: colors.textPrimary,
          marginBottom: spacing.md,
     },
     wordsScroll: {
          gap: spacing.md,
          paddingBottom: spacing.sm,
     },
     wordChip: {
          backgroundColor: colors.white,
          borderRadius: 20,
          paddingHorizontal: 20,
          paddingVertical: 14,
          minWidth: 150,
          maxWidth: 200,
          borderTopWidth: 1,
          borderTopColor: colors.shadowInnerLight,
     },
     wordChipText: {
          fontSize: 17,
          fontWeight: '800',
          color: colors.primary,
          marginBottom: 4,
     },
     wordChipDef: {
          fontSize: 12,
          color: colors.textSecondary,
          fontWeight: '500',
     }
});
