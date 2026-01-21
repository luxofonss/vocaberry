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
     // ... (keep logic: navigation, state, loadData, handleRefresh, handleWordPress) ...
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
                    data={conversations}
                    renderItem={renderConversationCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                         <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
                    }
                    ListHeaderComponent={
                         <View style={styles.headerComponents}>
                              {/* Shadowing Section */}
                              <View style={{ marginBottom: 24 }}>
                                   <View style={[styles.sectionHeaderRow, { paddingHorizontal: spacing.xs }]}>
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
                                   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                                        {[
                                             { id: 1, title: 'Daily Morning Routine', channel: 'English with Emma', duration: '3:45', level: 'Beginner', difficulty: 'Easy', completed: true, stars: 3, thumbnail: '🌅', accent: 'American', views: '1.2M' },
                                             { id: 2, title: 'Coffee Shop Conversation', channel: 'Real English', duration: '4:20', level: 'Beginner', difficulty: 'Easy', completed: true, stars: 2, thumbnail: '☕', accent: 'British', views: '850K' },
                                        ].map(lesson => (
                                             <TouchableOpacity
                                                  key={lesson.id}
                                                  style={[styles.shadowingCard]}
                                                  onPress={() => navigation.navigate('ShadowingPractice', lesson)}
                                             >
                                                  <View style={styles.shadowingIcon}>
                                                       <Text style={{ fontSize: 24 }}>{lesson.thumbnail}</Text>
                                                  </View>
                                                  <View style={{ flex: 1 }}>
                                                       <Text style={styles.shadowingTitle}>{lesson.title}</Text>
                                                       <Text style={styles.shadowingSubtitle} numberOfLines={1}>{lesson.channel}</Text>
                                                  </View>
                                                  <View style={styles.playIconContainer}>
                                                       <Ionicons name="play" size={10} color={colors.white} />
                                                  </View>
                                             </TouchableOpacity>
                                        ))}
                                   </ScrollView>
                              </View>

                              {/* New Words Section */}
                              <View style={{ marginBottom: 24 }}>
                                   <View style={[styles.sectionHeaderRow, { paddingHorizontal: spacing.xs }]}>
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
                                   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                                        {suggestedWords.map(sw => (
                                             <TouchableOpacity
                                                  key={sw.id}
                                                  style={[styles.wordChip]}
                                                  onPress={() => handleWordPress(sw.word)}
                                             >
                                                  <Text style={styles.wordChipText}>{sw.word}</Text>
                                                  <Text style={styles.wordChipDef} numberOfLines={1}>{sw.definition}</Text>
                                             </TouchableOpacity>
                                        ))}
                                   </ScrollView>
                              </View>

                              {/* Conversations Header */}
                              <View style={[styles.sectionHeaderRow, { marginTop: spacing.lg, paddingHorizontal: spacing.xs }]}>
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
     sectionHeaderRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
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
          gap: 12,
          paddingRight: 4,
     },
     // Card Styles
     card: {
          backgroundColor: colors.white,
          borderRadius: 24,
          padding: spacing.lg,
          marginBottom: spacing.md,
          borderWidth: 1,
          borderColor: '#F1F5F9', // light border
     },
     cardHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: spacing.sm,
     },
     categoryBadge: {
          backgroundColor: '#F8FAFC',
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 10,
     },
     categoryText: {
          fontSize: 12,
          fontWeight: '700',
          color: '#64748B',
     },
     difficultyBadge: {
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 10,
     },
     beginnerBadge: { backgroundColor: '#ECFDF5' },
     intermediateBadge: { backgroundColor: '#FFFBEB' },
     advancedBadge: { backgroundColor: '#FEF2F2' },
     difficultyText: {
          fontSize: 11,
          fontWeight: '800',
          textTransform: 'uppercase',
          color: '#059669',
     },
     cardTitle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#1E293B',
          marginBottom: 8,
     },
     cardDescription: {
          fontSize: 14,
          color: '#64748B',
          lineHeight: 20,
          marginBottom: spacing.md,
     },
     cardFooter: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          paddingTop: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
     },
     messageCount: { flexDirection: 'row', alignItems: 'center', gap: 6 },
     practiceInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
     footerText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
     arrowContainer: { marginLeft: 'auto' },

     // Shadowing & Word Cards
     shadowingCard: {
          backgroundColor: colors.white,
          borderRadius: 16,
          padding: 12,
          width: 200,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginRight: 4,
     },
     shadowingIcon: {
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: '#FFEDD5',
          alignItems: 'center',
          justifyContent: 'center',
     },
     shadowingTitle: {
          fontSize: 14,
          fontWeight: 'bold',
          color: '#1E293B',
          marginBottom: 2,
     },
     shadowingSubtitle: { fontSize: 10, color: '#64748B' },
     playIconContainer: {
          position: 'absolute', bottom: 10, right: 10,
          width: 20, height: 20, borderRadius: 10,
          backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
     },
     wordChip: {
          backgroundColor: colors.white,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 12,
          minWidth: 140,
          marginRight: 4,
     },
     wordChipText: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: 4 },
     wordChipDef: { fontSize: 12, color: '#64748B' },

     // Empty State
     emptyContainer: { alignItems: 'center', marginTop: 40 },
     emptyText: { color: '#94A3B8', fontSize: 16 },
});
