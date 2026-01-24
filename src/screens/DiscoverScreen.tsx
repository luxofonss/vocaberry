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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, spacing, shadows } from '../theme';
import { Conversation, RootStackParamList } from '../types';
import { ConversationService } from '../services/ConversationService';
import { DictionaryService } from '../services/DictionaryService';
import { StorageService } from '../services/StorageService';
import { WordPreviewModal } from '../components';
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
          setLookupStatus('Checking library...');

          try {
               const existingWords = await StorageService.getWords();
               const existing = existingWords.find(w => w.word.toLowerCase() === word.toLowerCase());

               if (existing) {
                    setIsLookupLoading(false);
                    navigation.navigate('WordDetail', { wordId: existing.id });
                    return;
               }

               setModalVisible(true);
               setLookupStatus('Looking up...');

               const data = await DictionaryService.lookup(word);
               if (data) {
                    setSelectedWordData(data.word);
                    setIsSelectedWordNew(true);
                    setLookupStatus('');
               } else {
                    Alert.alert("Notice", `Could not find details for "${word}".`);
                    setModalVisible(false);
               }
          } catch (error) {
               console.error('Lookup error:', error);
               setModalVisible(false);
          } finally {
               setIsLookupLoading(false);
          }
     };

     const renderShadowingCard = (lesson: any) => (
          <TouchableOpacity
               key={lesson.id}
               style={[styles.sectionCard, shadows.claySoft]}
               activeOpacity={0.9}
               onPress={() => navigation.navigate('ShadowingPractice', lesson)}
          >
               <View style={styles.cardIconContainer}>
                    <View style={[styles.cardIcon, { backgroundColor: '#DCFCE7' }]}>
                         <Text style={{ fontSize: 32 }}>{lesson.thumbnail}</Text>
                    </View>
               </View>

               <View style={styles.cardContent}>
                    <Text style={styles.cardMainTitle} numberOfLines={2}>{lesson.title}</Text>
                    <View style={styles.cardMetaRow}>
                         <Ionicons name="person-outline" size={12} color="#64748B" />
                         <Text style={styles.cardMetaText} numberOfLines={1}>{lesson.channel}</Text>
                    </View>
                    <View style={styles.cardMetaRow}>
                         <Ionicons name="time-outline" size={12} color="#64748B" />
                         <Text style={styles.cardMetaText}>{lesson.duration}</Text>
                         <View style={styles.metaDivider} />
                         <Text style={[styles.cardMetaText, { color: '#15803D', fontWeight: '600' }]}>{lesson.level}</Text>
                    </View>
               </View>

               <View style={[styles.cardPlayButton, { backgroundColor: '#15803D' }]}>
                    <Ionicons name="play" size={16} color={colors.white} />
               </View>
          </TouchableOpacity>
     );

     const renderWordCard = (word: { id: string, word: string, definition: string }) => (
          <TouchableOpacity
               key={word.id}
               style={[styles.sectionCard, shadows.claySoft]}
               activeOpacity={0.9}
               onPress={() => handleWordPress(word.word)}
          >
               <View style={styles.cardIconContainer}>
                    <View style={[styles.cardIcon, { backgroundColor: '#DBEAFE' }]}>
                         <Ionicons name="book" size={28} color="#1D4ED8" />
                    </View>
               </View>

               <View style={styles.cardContent}>
                    <Text style={styles.cardMainTitle} numberOfLines={1}>{word.word}</Text>
                    <Text style={styles.cardDefinition} numberOfLines={3}>{word.definition}</Text>
               </View>

               <View style={[styles.cardPlayButton, { backgroundColor: '#1D4ED8' }]}>
                    <Ionicons name="add" size={20} color={colors.white} />
               </View>
          </TouchableOpacity>
     );

     const renderConversationCard = (item: Conversation) => (
          <TouchableOpacity
               key={item.id}
               style={[styles.sectionCard, shadows.claySoft]}
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
                         <Ionicons name="chatbubbles-outline" size={12} color="#64748B" />
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
                                        {[
                                             { id: 1, title: 'Daily Morning Routine', channel: 'English with Emma', duration: '3:45', level: 'Beginner', difficulty: 'Easy', completed: true, stars: 3, thumbnail: '🌅', accent: 'American', views: '1.2M' },
                                             { id: 2, title: 'Coffee Shop Conversation', channel: 'Real English', duration: '4:20', level: 'Beginner', difficulty: 'Easy', completed: true, stars: 2, thumbnail: '☕', accent: 'British', views: '850K' },
                                             { id: 3, title: 'At the Restaurant', channel: 'Speak Easy', duration: '5:10', level: 'Intermediate', difficulty: 'Medium', completed: false, stars: 0, thumbnail: '🍽️', accent: 'American', views: '620K' },
                                             { id: 4, title: 'Job Interview Tips', channel: 'Business English', duration: '6:30', level: 'Advanced', difficulty: 'Hard', completed: false, stars: 0, thumbnail: '💼', accent: 'British', views: '980K' },
                                        ].map(lesson => renderShadowingCard(lesson))}
                                   </ScrollView>
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
                                   <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.horizontalScroll}
                                   >
                                        {suggestedWords.slice(0, 4).map(word => renderWordCard(word))}
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

               <WordPreviewModal
                    visible={modalVisible}
                    wordData={selectedWordData}
                    isNew={isSelectedWordNew}
                    isLoading={isLookupLoading}
                    statusText={lookupStatus}
                    onClose={() => setModalVisible(false)}
                    onSave={(newWord) => {
                         setIsSelectedWordNew(false);
                         setSelectedWordData(newWord);
                    }}
                    onGoToDetail={(wordId) => {
                         navigation.navigate('WordDetail', { wordId });
                    }}
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
          paddingTop: spacing.xs,
          paddingBottom: spacing.sm,
     },
     headerTop: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
     },
     greetingContainer: {
          marginRight: spacing.md,
     },
     title: {
          fontSize: 28,
          fontWeight: 'bold',
          color: '#1E293B',
     },
     subtitle: {
          fontSize: 15,
          color: '#64748B',
          marginTop: 4,
     },
     listContent: {
          paddingHorizontal: spacing.screenPadding,
          paddingBottom: 100,
     },
     headerComponents: {
          marginBottom: spacing.xs,
     },
     sectionContainer: {
          marginBottom: 28,
     },
     sectionHeaderRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
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
          gap: 14,
          paddingRight: 4,
     },

     // Unified Section Card Styles
     sectionCard: {
          backgroundColor: colors.white,
          borderRadius: 20,
          padding: 16,
          width: 280,
          borderWidth: 1,
          borderColor: '#F1F5F9',
          flexDirection: 'column',
     },
     cardIconContainer: {
          marginBottom: 12,
     },
     cardIcon: {
          width: 56,
          height: 56,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
     },
     cardContent: {
          flex: 1,
     },
     cardMainTitle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#1E293B',
          marginBottom: 8,
          lineHeight: 22,
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
          flexWrap: 'wrap',
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
          position: 'absolute',
          bottom: 16,
          right: 16,
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
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

     // Empty State
     emptyContainer: { alignItems: 'center', marginTop: 40 },
     emptyText: { color: '#94A3B8', fontSize: 16 },
});
