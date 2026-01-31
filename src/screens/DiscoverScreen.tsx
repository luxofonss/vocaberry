import React, { useState, useEffect, useCallback } from 'react';
import {
     View,
     Text,
     StyleSheet,
     FlatList,
     TouchableOpacity,
     RefreshControl,
     ScrollView,
     Alert,
     ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, spacing, shadows, typography } from '../theme';
import { Conversation, RootStackParamList } from '../types';
import { ConversationService } from '../services/ConversationService';
import { DictionaryService } from '../services/DictionaryService';
import { StorageService } from '../services/StorageService';
import { ApiClient } from '../services/ApiClient';
import { DiscoverApiService } from '../services/DiscoverApiService';
import { WordCard } from '../components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Word } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const DiscoverScreen: React.FC = () => {
     const navigation = useNavigation<NavigationProp>();
     const [conversations, setConversations] = useState<Conversation[]>([]);
     const [shadowingLessons, setShadowingLessons] = useState<any[]>([]);
     const [suggestedWords, setSuggestedWords] = useState<{ id: string, word: string, definition: string, imageUrl?: string }[]>([]);
     const [loading, setLoading] = useState(true);
     const [refreshing, setRefreshing] = useState(false);

     // Dictionary pagination state
     const [dictionaryPage, setDictionaryPage] = useState(0);
     const [hasMoreWords, setHasMoreWords] = useState(true);
     const [isFetchingMoreWords, setIsFetchingMoreWords] = useState(false);

     const fetchDictionaryWords = async (page: number, shouldRefresh = false) => {
          try {
               if (isFetchingMoreWords) return;
               if (!shouldRefresh && !hasMoreWords) return;

               setIsFetchingMoreWords(true);

               // API default size is 5 as requested
               const response = await ApiClient.getDictionaryWords(page, 20);

               if (response && response.data) {
                    // Get existing words to filter out
                    const existingWords = await StorageService.getWords();
                    const existingWordTexts = new Set(existingWords.map(w => w.word.toLowerCase()));

                    const mappedWords = response.data
                         .filter((item: any) => !existingWordTexts.has(item.word.word.toLowerCase()))
                         .map((item: any) => ({
                              id: item.word.id,
                              word: item.word.word,
                              definition: item.word.meanings?.[0]?.definition || 'No definition available',
                              imageUrl: item.word.imageUrl
                         }));

                    if (shouldRefresh) {
                         setSuggestedWords(mappedWords);
                         setDictionaryPage(0);
                    } else {
                         setSuggestedWords(prev => [...prev, ...mappedWords]);
                         setDictionaryPage(page);
                    }

                    // Check if we have loaded all items
                    // meta: { code, pageIndex, pageSize, totalItems, message }
                    const { totalItems, pageIndex, pageSize } = response.meta;
                    // simple check: if we received fewer items than requested size, or if predicted next index is out of bounds
                    // actually totalItems is the most reliable
                    const currentCount = (pageIndex + 1) * pageSize;
                    // Note: response.meta.pageIndex is 0-based from server

                    setHasMoreWords(mappedWords.length > 0 && (page + 1) * 5 < totalItems);
               }
          } catch (error) {
               console.error('Failed to fetch dictionary words:', error);
          } finally {
               setIsFetchingMoreWords(false);
          }
     };

     const loadData = useCallback(async () => {
          try {
               // Load shadowing lessons from API with caching
               const lessons = await DiscoverApiService.getShadowingLessons();
               setShadowingLessons(lessons);

               // Load conversations from API with caching
               const convs = await DiscoverApiService.getConversations();
               setConversations(convs);

               // Load first page of dictionary
               await fetchDictionaryWords(0, true);
          } catch (error) {
               console.error('Failed to load data:', error);
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
          console.log('[DiscoverScreen] handleWordPress called for:', word);

          try {
               const existingWords = await StorageService.getWords();
               const existing = existingWords.find(w => w.word.toLowerCase() === word.toLowerCase());

               if (existing) {
                    console.log('[DiscoverScreen] Word exists, navigating to detail');
                    navigation.navigate('WordDetail', { wordId: existing.id });
                    return;
               }

               console.log('[DiscoverScreen] Calling API with autoSave=true...');

               // Lookup with autoSave=true (default) - will save automatically
               const data = await DictionaryService.lookup(word);
               console.log('[DiscoverScreen] Lookup result:', data ? 'Success' : 'Failed');

               if (data) {
                    // Word has been saved, navigate to detail
                    console.log('[DiscoverScreen] Navigating to WordDetail:', data.word.id);
                    navigation.navigate('WordDetail', { wordId: data.word.id });
               } else {
                    Alert.alert("Notice", `Could not find details for "${word}".`);
               }
          } catch (error) {
               console.error('[DiscoverScreen] Lookup error:', error);
               Alert.alert("Error", "Failed to lookup word. Please try again.");
          }
     };

     const handleLoadMoreWords = () => {
          if (!loading && hasMoreWords && !isFetchingMoreWords && suggestedWords.length > 0) {
               fetchDictionaryWords(dictionaryPage + 1);
          }
     };

     const renderShadowingCard = (lesson: any) => (
          <TouchableOpacity
               key={lesson.id}
               style={styles.shadowingCard}
               activeOpacity={0.9}
               onPress={() => {
                    (navigation as any).navigate('ShadowingPractice', {
                         lessonId: lesson.id,
                         initialData: lesson
                    });
               }}
          >
               <View style={styles.videoThumbnail}>
                    <View style={[styles.thumbnailPlaceholder, { backgroundColor: '#F1F5F9' }]}>
                         <Text style={{ fontSize: 40 }}>🎬</Text>
                    </View>
                    <View style={styles.durationBadge}>
                         <Text style={styles.durationText}>{lesson.duration || '0:00'}</Text>
                    </View>
               </View>

               <View style={styles.videoContent}>
                    <Text style={styles.videoTitle} numberOfLines={2}>{lesson.title}</Text>
                    <Text style={styles.videoMeta} numberOfLines={1}>
                         {lesson.category || 'General'} • {lesson.views} views • {lesson.difficulty || 'Easy'}
                    </Text>
               </View>
          </TouchableOpacity>
     );

     const renderWordCard = (wordData: { id: string, word: string, definition: string, imageUrl?: string }) => {
          const dummyWord: Word = {
               id: wordData.id,
               word: wordData.word,
               meanings: [{ id: '1', definition: wordData.definition }],
               imageUrl: wordData.imageUrl || '',
               topics: [],
               nextReviewDate: new Date().toISOString(),
               reviewCount: 0,
          };

          return (
               <View key={wordData.id} style={{ marginRight: 4 }}>
                    <WordCard
                         word={dummyWord}
                         variant="standard"
                         onPress={() => handleWordPress(wordData.word)}
                    />
               </View>
          );
     };

     const renderConversationCard = (item: Conversation) => (
          <TouchableOpacity
               key={item.id}
               style={styles.sectionCard}
               activeOpacity={0.9}
               onPress={() => navigation.navigate('ConversationDetail', { conversationId: item.id })}
          >
               <View style={styles.cardIconContainer}>
                    <View style={[styles.cardIcon, { backgroundColor: '#FFEDD5' }]}>
                         <Ionicons name="chatbubbles" size={28} color="#C2410C" />
                    </View>
               </View>

               <View style={styles.cardContent}>
                    <View style={styles.conversationBadges}>
                         <View style={styles.categoryBadgeSmall}>
                              <Text style={styles.categoryTextSmall}>{item.category}</Text>
                         </View>
                         <View style={[
                              styles.difficultyBadgeSmall,
                              item.difficulty === 'beginner' ? styles.beginnerBadge :
                                   item.difficulty === 'intermediate' ? styles.intermediateBadge : styles.advancedBadge
                         ]}>
                              <Text style={styles.difficultyTextSmall}>{item.difficulty}</Text>
                         </View>
                    </View>
                    <Text style={styles.cardMainTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.cardMetaRow}>
                         <Text style={styles.cardMetaText}>{item.messages.length} messages</Text>
                         <View style={styles.metaDivider} />
                         <Ionicons name="stats-chart-outline" size={12} color="#64748B" />
                         <Text style={styles.cardMetaText}>{item.practiceCount} practices</Text>
                    </View>
               </View>

               <View style={[styles.cardPlayButton, { backgroundColor: '#C2410C' }]}>
                    <Ionicons name="chevron-forward" size={16} color={colors.white} />
               </View>
          </TouchableOpacity>
     );

     return (
          <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
               <View style={styles.header}>
                    <View style={styles.headerTop}>
                         <View style={styles.greetingContainer}>
                              <Text style={styles.title}>Discovery 🚀</Text>
                              <Text style={styles.subtitle}>Explore new ways to learn</Text>
                         </View>
                    </View>
               </View>

               <FlatList
                    data={[]}
                    renderItem={() => null}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                         <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
                    }
                    ListHeaderComponent={
                         <View style={styles.headerComponents}>
                              {/* IPA Pronunciation Section */}
                              <View style={styles.sectionContainer}>
                                   <View style={styles.sectionHeaderRow}>
                                        <View style={styles.titleRow}>
                                             <View style={[styles.iconBox, { backgroundColor: '#F5E6FF' }]}>
                                                  <Ionicons name="mic-outline" size={18} color="#A855F7" />
                                             </View>
                                             <Text style={styles.sectionTitle}>IPA Pronunciation</Text>
                                        </View>
                                   </View>
                                   <TouchableOpacity
                                        style={styles.ipaBanner}
                                        onPress={() => navigation.navigate('IpaPractice')}
                                        activeOpacity={0.9}
                                   >
                                        <View style={styles.ipaBannerContent}>
                                             <Text style={styles.ipaBannerTitle}>Master your IPA symbols</Text>
                                             <Text style={styles.ipaBannerSubtitle}>44 phonemes with video & AI feedback</Text>
                                        </View>
                                        <View style={styles.ipaBannerIcons}>
                                             <Text style={styles.ipaSymbolPreview}>æ</Text>
                                             <View style={styles.ipaPlayBtn}>
                                                  <Ionicons name="play" size={16} color={colors.white} />
                                             </View>
                                        </View>
                                   </TouchableOpacity>
                              </View>

                              {/* New Words Section */}
                              <View style={styles.sectionContainer}>
                                   <View style={styles.sectionHeaderRow}>
                                        <View style={styles.titleRow}>
                                             <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                                                  <Ionicons name="book" size={18} color="#1D4ED8" />
                                             </View>
                                             <Text style={styles.sectionTitle}>New Words</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => navigation.navigate('NewWordsList')}>
                                             <Text style={styles.seeAllText}>See All</Text>
                                        </TouchableOpacity>
                                   </View>
                                   <FlatList
                                        horizontal
                                        data={suggestedWords}
                                        renderItem={({ item }) => renderWordCard(item)}
                                        keyExtractor={(item, index) => `${item.id}-${index}`}
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.horizontalScroll}
                                        onEndReached={handleLoadMoreWords}
                                        onEndReachedThreshold={0.5}
                                        ListFooterComponent={
                                             isFetchingMoreWords ? (
                                                  <View style={{ width: 50, justifyContent: 'center', alignItems: 'center' }}>
                                                       <ActivityIndicator size="small" color={colors.primary} />
                                                  </View>
                                             ) : null
                                        }
                                   />
                              </View>

                              {/* Shadowing Section */}
                              <View style={styles.sectionContainer}>
                                   <View style={styles.sectionHeaderRow}>
                                        <View style={styles.titleRow}>
                                             <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                                                  <Ionicons name="videocam" size={18} color="#15803D" />
                                             </View>
                                             <Text style={styles.sectionTitle}>Shadowing</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => navigation.navigate('ShadowingList')}>
                                             <Text style={styles.seeAllText}>See All</Text>
                                        </TouchableOpacity>
                                   </View>
                                   <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.horizontalScroll}
                                   >
                                        {shadowingLessons.slice(0, 6).map(lesson => renderShadowingCard(lesson))}
                                   </ScrollView>
                              </View>

                              {/* Conversations Section */}
                              <View style={styles.sectionContainer}>
                                   <View style={styles.sectionHeaderRow}>
                                        <View style={styles.titleRow}>
                                             <View style={[styles.iconBox, { backgroundColor: '#FFEDD5' }]}>
                                                  <Ionicons name="chatbubbles" size={18} color="#C2410C" />
                                             </View>
                                             <Text style={styles.sectionTitle}>Conversations</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => navigation.navigate('ConversationList')}>
                                             <Text style={styles.seeAllText}>See All</Text>
                                        </TouchableOpacity>
                                   </View>
                                   <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.horizontalScroll}
                                   >
                                        {conversations.slice(0, 4).map(item => renderConversationCard(item))}
                                   </ScrollView>
                              </View>

                              {/* Empty State */}
                              {!loading && conversations.length === 0 && (
                                   <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>No conversations found.</Text>
                                   </View>
                              )}
                         </View>
                    }
               />
          </SafeAreaView>
     );
};

const styles = StyleSheet.create({
     container: {
          flex: 1,
     },
     header: {
          paddingHorizontal: spacing.screenPadding,
          paddingBottom: spacing.xs
     },
     headerTop: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: spacing.xxs
     },
     greetingContainer: {
          flex: 1,
          marginRight: spacing.md
     },
     title: {
          fontSize: typography.sizes.xxl,
          fontWeight: typography.weights.extraBold,
          color: colors.textPrimary,
          letterSpacing: -0.5
     },
     subtitle: {
          fontSize: typography.sizes.base,
          color: colors.textSecondary,
          marginTop: 2
     },
     listContent: {
          paddingHorizontal: spacing.screenPadding,
          paddingBottom: 100,
     },
     headerComponents: {
          marginBottom: spacing.xs,
     },
     sectionContainer: {
          marginBottom: 20,
     },
     sectionHeaderRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
     },
     titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
     },
     iconBox: {
          width: 32,
          height: 32,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
     },
     sectionTitle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#1E293B',
     },
     seeAllText: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.primary,
     },
     horizontalScroll: {
          paddingHorizontal: spacing.screenPadding,
          paddingRight: 32,
          paddingBottom: 8,
     },

     // Shadowing Video Card Styles
     shadowingCard: {
          width: 220,
          marginRight: 16,
          backgroundColor: colors.white,
          borderRadius: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: '#E2E8F0',
     },
     videoThumbnail: {
          width: '100%',
          aspectRatio: 16 / 9,
          backgroundColor: '#F8FAFC',
          position: 'relative',
     },
     thumbnailPlaceholder: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
     },
     durationBadge: {
          position: 'absolute',
          bottom: 8,
          right: 8,
          backgroundColor: 'rgba(0,0,0,0.8)',
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
     },
     durationText: {
          color: colors.white,
          fontSize: 11,
          fontWeight: 'bold',
     },
     videoContent: {
          padding: 12,
     },
     videoTitle: {
          fontSize: 15,
          fontWeight: 'bold',
          color: '#1E293B',
          lineHeight: 20,
          marginBottom: 4,
     },
     videoMeta: {
          fontSize: 12,
          color: '#64748B',
     },

     // Unified Section Card Styles
     sectionCard: {
          backgroundColor: colors.white,
          borderRadius: 16,
          padding: 16,
          width: 280,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          flexDirection: 'row',
          marginRight: 16,
          alignItems: 'center',
     },
     cardIconContainer: {
          marginRight: 14,
     },
     cardIcon: {
          width: 52,
          height: 52,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
     },
     cardContent: {
          flex: 1,
     },
     cardMainTitle: {
          fontSize: 15,
          fontWeight: 'bold',
          color: '#1E293B',
          marginBottom: 4,
          lineHeight: 20,
     },
     cardDefinition: {
          fontSize: 13,
          color: '#64748B',
          lineHeight: 18,
     },
     cardMetaRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          marginTop: 4,
     },
     cardMetaText: {
          fontSize: 11,
          color: '#64748B',
          fontWeight: '500',
     },
     metaDivider: {
          width: 3,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: '#CBD5E1',
          marginHorizontal: 4,
     },
     cardPlayButton: {
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 8,
     },

     // Conversation specific badges
     conversationBadges: {
          flexDirection: 'row',
          gap: 6,
          marginBottom: 8,
     },
     categoryBadgeSmall: {
          backgroundColor: '#F8FAFC',
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 8,
     },
     categoryTextSmall: {
          fontSize: 10,
          fontWeight: '700',
          color: '#64748B',
     },
     difficultyBadgeSmall: {
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 8,
     },
     beginnerBadge: { backgroundColor: '#ECFDF5' },
     intermediateBadge: { backgroundColor: '#FFFBEB' },
     advancedBadge: { backgroundColor: '#FEF2F2' },
     difficultyTextSmall: {
          fontSize: 9,
          fontWeight: '800',
          textTransform: 'uppercase',
          color: '#059669',
     },

     // IPA Banner Styles
     ipaBanner: {
          backgroundColor: '#A855F7',
          borderRadius: 16,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          ...shadows.clayMedium,
     },
     ipaBannerContent: {
          flex: 1,
     },
     ipaBannerTitle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: colors.white,
          marginBottom: 4,
     },
     ipaBannerSubtitle: {
          fontSize: 13,
          color: 'rgba(255, 255, 255, 0.8)',
          fontWeight: '500',
     },
     ipaBannerIcons: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
     },
     ipaSymbolPreview: {
          fontSize: 32,
          fontWeight: '900',
          color: 'rgba(255, 255, 255, 0.3)',
     },
     ipaPlayBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.4)',
     },

     // Empty State
     emptyContainer: { alignItems: 'center', marginTop: 40 },
     emptyText: { color: '#94A3B8', fontSize: 16 },
});
