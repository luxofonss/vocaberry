// HomeScreen - Optimized Core View
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Dimensions,
  Animated,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { theme, colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Word, RootStackParamList, TabType } from '../types';
import { StorageService } from '../services/StorageService';
import { 
    WordCard, 
    QuickAddModal,
    SearchModal 
} from '../components';
import { EventBus } from '../services/EventBus';
import { PracticeScreen } from './PracticeScreen';
import { BottomTabBar } from '../components/BottomTabBar';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Main Application Hub
 * Manages Home (Grid), Topics (Inventory), and Practice views.
 */
export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  
  // -- State --
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [wordsForReview, setWordsForReview] = useState(0);
  const [leastViewedCount, setLeastViewedCount] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [isSearchVisible, setSearchVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'alphabet' | 'newest' | 'views'>('newest');
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [userName, setUserName] = useState<string | null>(null);
  const [leastViewedWords, setLeastViewedWords] = useState<Word[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState<{ emoji: string; title: string; message: string } | null>(null);
  const notificationAnim = useRef(new Animated.Value(-100)).current;

  // -- Effects --
  // Chạy 1 lần duy nhất khi khởi động App
  useEffect(() => {
    StorageService.checkAndSeedData();
  }, []);

  // Listen for image update event to update word list UI instantly
  useEffect(() => {
    const cb = ({ wordId, word: updated }: { wordId: string; word: Word }) => {
      setWords((prev) => prev.map(w => w.id === wordId ? updated : w));
    };
    EventBus.on('wordImageUpdated', cb);
    return () => EventBus.off('wordImageUpdated', cb);
  }, []);

  // Tự động load lại dữ liệu mỗi khi màn hình được Focus (quay lại từ màn hình khác)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const getNotificationMessage = (minutesSinceLastPractice: number): { emoji: string; title: string; message: string } => {
    if (minutesSinceLastPractice < 30) {
      return {
        emoji: '⚡',
        title: 'Keep the momentum!',
        message: `${leastViewedCount} word${leastViewedCount > 1 ? 's' : ''} are waiting for you!`
      };
    } else if (minutesSinceLastPractice < 60) {
      return {
        emoji: '🎯',
        title: 'Time to level up!',
        message: `Your vocabulary needs attention - ${leastViewedCount} word${leastViewedCount > 1 ? 's' : ''} ready to practice!`
      };
    } else if (minutesSinceLastPractice < 120) {
      return {
        emoji: '🔥',
        title: 'Don\'t lose your streak!',
        message: `It's been a while! ${leastViewedCount} word${leastViewedCount > 1 ? 's' : ''} are calling your name!`
      };
    } else if (minutesSinceLastPractice < 360) {
      return {
        emoji: '💪',
        title: 'Come back, champion!',
        message: `Your words miss you! ${leastViewedCount} word${leastViewedCount > 1 ? 's' : ''} need your practice!`
      };
    } else if (minutesSinceLastPractice < 1440) {
      return {
        emoji: '🌟',
        title: 'Ready for a comeback?',
        message: `It's been hours! ${leastViewedCount} word${leastViewedCount > 1 ? 's' : ''} are ready to be mastered!`
      };
    } else {
      return {
        emoji: '🚀',
        title: 'Let\'s get back on track!',
        message: `Time to refresh your memory! ${leastViewedCount} word${leastViewedCount > 1 ? 's' : ''} need your attention!`
      };
    }
  };

  const loadData = async () => {
    try {
      const allWords = await StorageService.getWords();
      setWords(allWords);
      
      const reviewList = await StorageService.getWordsForReview();
      setWordsForReview(reviewList.length);
      
      // Đếm số từ ít xem nhất (viewCount < max)
      const leastViewed = await StorageService.getLeastViewedWords(5);
      setLeastViewedCount(leastViewed.length > 0 ? leastViewed.length : 5);
      setLeastViewedWords(leastViewed);
      
      // Check xem có nên hiển thị notification không
      const shouldShow = await StorageService.shouldShowPracticeNotification();
      
      if (shouldShow && leastViewed.length > 0) {
        // Lấy thời gian từ lần practice cuối để tạo message động
        const lastPractice = await StorageService.getLastPracticeTime();
        const minutesSince = lastPractice ? Math.floor((Date.now() - lastPractice) / (60 * 1000)) : 0;
        const notificationData = getNotificationMessage(minutesSince);
        
        setShowNotification(true);
        setNotificationData(notificationData);
        
        // Lưu timestamp khi hiển thị notification
        await StorageService.saveLastNotificationShown();
        
        Animated.spring(notificationAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start();
      } else {
        setShowNotification(false);
        notificationAnim.setValue(-100);
      }
      
      // Load user name
      const name = await StorageService.getUserName();
      setUserName(name);
    } catch (error) {
      console.error('[HomeScreen] Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAddWordSuccess = async (newWord: Word) => {
      setQuickAddVisible(false);
      const updatedWords = await StorageService.addWord(newWord);
      setWords(updatedWords);
  };

  const toggleTopicExpand = (topic: string) => {
      setExpandedTopics(prev => ({ ...prev, [topic]: !prev[topic] }));
  };

  const handleNotificationPress = () => {
    // Ẩn notification
    Animated.timing(notificationAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowNotification(false);
    });
    
    // Chuyển sang tab practice và tự động start với leastViewed words
    setActiveTab('practice');
    
    // Emit event để PracticeScreen nhận danh sách từ
    setTimeout(() => {
      EventBus.emit('startPracticeWithWords', { words: leastViewedWords });
    }, 100);
  };

  const handleNotificationDismiss = () => {
    Animated.timing(notificationAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowNotification(false);
    });
  };

  // -- Computed Data --
  const inventoryData = useMemo(() => {
    const groups: Record<string, Word[]> = {};
    words.forEach(w => {
      const wordTopics = w.topics || ['Uncategorized'];
      wordTopics.forEach(t => {
        if (!groups[t]) groups[t] = [];
        groups[t].push(w);
      });
    });

    // Object comparison for sorting
    const topicList = Object.keys(groups).sort().map(topic => {
      let sortedItems = [...groups[topic]];
      if (sortBy === 'alphabet') {
        sortedItems.sort((a, b) => a.word.localeCompare(b.word));
      } else if (sortBy === 'newest') {
        sortedItems.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      }
      return { title: topic, data: sortedItems };
    });
    
    return topicList;
  }, [words, sortBy]);

  // -- Render Components --

  const renderHeader = () => {
    const greetingText = userName 
      ? `Hello ${userName}! 👋` 
      : 'Hello! 👋';
    const avatarInitial = userName 
      ? userName.charAt(0).toUpperCase() 
      : 'A';

    return (
      <View style={styles.header}>
          <View style={styles.headerTop}>
              <View>
                  <Text style={styles.greeting}>{greetingText}</Text>
                  {wordsForReview > 0 ? (
                      <Text style={styles.subGreeting}>{wordsForReview} words to review.💡</Text>
                  ) : leastViewedCount > 0 ? (
                      <Text style={styles.subGreeting}>
                          💡 {leastViewedCount} least viewed word needs practice.💡
                      </Text>
                  ) : (
                      <Text style={styles.subGreeting}>All caught up! 🎉</Text>
                  )}
              </View>
              <TouchableOpacity 
                  style={styles.avatar}
                  onPress={() => navigation.navigate('Settings')}
              >
                  <Text style={styles.avatarText}>{avatarInitial}</Text>
              </TouchableOpacity>
          </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📦</Text>
        <Text style={styles.emptyText}>No words yet.</Text>
        <Text style={styles.emptySubText}>Tap the + button to add one!</Text>
    </View>
  );

  const renderTopicBlock = ({ item }: { item: { title: string, data: Word[] } }) => {
    const isExpanded = expandedTopics[item.title];
    const LIMIT = 6;
    const displayData = isExpanded ? item.data : item.data.slice(0, LIMIT);
    const hasMore = item.data.length > LIMIT;

    return (
      <View style={styles.topicSection}>
          <View style={styles.topicHeaderRow}>
              <Text style={styles.topicBlockTitle}>
                {item.title} <Text style={styles.topicCount}>({item.data.length})</Text>
              </Text>
              {hasMore && (
                  <TouchableOpacity onPress={() => toggleTopicExpand(item.title)}>
                      <Text style={styles.expandText}>{isExpanded ? 'Collapse' : 'Expand'}</Text>
                  </TouchableOpacity>
              )}
          </View>

          <View style={styles.topicGridContainer}>
              {displayData.map((word) => (
                  <WordCard 
                    key={word.id}
                    word={word}
                    variant="compact"
                    onPress={() => navigation.navigate('WordDetail', { wordId: word.id })}
                  />
              ))}
          </View>

          {!isExpanded && hasMore && (
              <TouchableOpacity style={styles.seeMoreBtn} onPress={() => toggleTopicExpand(item.title)}>
                  <Text style={styles.seeMoreText}>Show {item.data.length - LIMIT} more items...</Text>
              </TouchableOpacity>
          )}
      </View>
    );
  };

  const renderFilterToolbar = () => (
    <View style={styles.filterToolbar}>
        <Text style={styles.filterLabel}>Sort by:</Text>
        <View style={styles.filterOptions}>
            {(['newest', 'alphabet', 'views'] as const).map(option => (
                <TouchableOpacity 
                  key={option} 
                  style={[styles.filterChip, sortBy === option && styles.filterChipActive]}
                  onPress={() => setSortBy(option)}
                >
                    <Text style={[styles.filterChipText, sortBy === option && styles.filterChipTextActive]}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
  );

  // -- Tab Content --
  const renderContent = () => {
       if (activeTab === 'practice') return <PracticeScreen />;

       if (activeTab === 'home') {
           return (
               <FlatList 
                   key="home-grid"
                   data={words}
                   renderItem={({ item }) => (
                     <WordCard 
                        word={item} variant="compact" 
                        onPress={() => navigation.navigate('WordDetail', { wordId: item.id })} 
                     />
                   )}
                   keyExtractor={(item) => item.id}
                   numColumns={3}
                   columnWrapperStyle={styles.columnWrapper}
                   ListHeaderComponent={renderHeader}
                   ListEmptyComponent={renderEmpty}
                   contentContainerStyle={styles.listContent}
                   showsVerticalScrollIndicator={false}
                   refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
                   }
               />
           );
       }

       // Topics / Inventory Tab
       return (
            <FlatList
                key="topics-list"
                data={inventoryData}
                renderItem={renderTopicBlock}
                keyExtractor={(item) => item.title}
                ListHeaderComponent={() => (
                    <>
                        {renderHeader()}
                        {renderFilterToolbar()}
                    </>
                )}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
                }
            />
       );
  };


  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Notification Popup - Inside SafeAreaView */}
        {showNotification && leastViewedCount > 0 && notificationData && (
          <Animated.View 
            style={[
              styles.notificationContainer,
              {
                transform: [{ translateY: notificationAnim }]
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.notificationContent}
              onPress={handleNotificationPress}
              activeOpacity={0.8}
            >
              <View style={styles.notificationLeft}>
                <Text style={styles.notificationEmoji}>{notificationData.emoji}</Text>
                <View style={styles.notificationTextContainer}>
                  <Text style={styles.notificationTitle}>{notificationData.title}</Text>
                  <Text style={styles.notificationMessage}>
                    {notificationData.message}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={handleNotificationDismiss}
                style={styles.notificationClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.notificationCloseText}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ flex: 1 }}>
            {renderContent()}
        </View>

        <BottomTabBar 
          activeTab={activeTab}
          wordCount={words.length}
          reviewCount={wordsForReview}
          onTabChange={setActiveTab}
          onAddPress={() => setQuickAddVisible(true)}
          onSearchPress={() => setSearchVisible(true)}
        />
        
        <QuickAddModal 
          visible={quickAddVisible}
          onClose={() => setQuickAddVisible(false)}
          onSuccess={handleAddWordSuccess}
        />

        <SearchModal 
            visible={isSearchVisible}
            words={words}
            onClose={() => setSearchVisible(false)}
            onSelectWord={(word) => navigation.navigate('WordDetail', { wordId: word.id })}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.textSecondary, fontSize: typography.sizes.base },
  
  header: { paddingHorizontal: spacing.screenPadding, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  greeting: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.extraBold, color: colors.textPrimary },
  subGreeting: { fontSize: typography.sizes.base, color: colors.textSecondary, marginTop: 4 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.backgroundSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primary, fontWeight: typography.weights.bold, fontSize: typography.sizes.lg },
  
  listContent: { paddingBottom: 120 },
  columnWrapper: { paddingHorizontal: spacing.screenPadding, gap: spacing.itemGap, marginBottom: spacing.md },
  
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: typography.sizes.hero, marginBottom: spacing.lg },
  emptyText: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textSecondary },
  emptySubText: { marginTop: spacing.sm, color: colors.textLight, fontSize: typography.sizes.base },

  topicSection: { marginBottom: spacing.xxxl },
  topicHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg, paddingHorizontal: spacing.screenPadding },
  topicBlockTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary },
  topicCount: { color: colors.textLight, fontWeight: typography.weights.regular, fontSize: typography.sizes.base },
  expandText: { color: colors.primary, fontWeight: typography.weights.semibold, fontSize: typography.sizes.sm },
  
  topicGridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.itemGap, paddingHorizontal: spacing.screenPadding }, 
  
  seeMoreBtn: { marginTop: spacing.lg, marginHorizontal: spacing.screenPadding, paddingVertical: spacing.md, alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderLight, ...shadows.subtle },
  seeMoreText: { color: colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },

  filterToolbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.screenPadding, marginBottom: spacing.xxl, marginTop: spacing.sm },
  filterLabel: { color: colors.textSecondary, marginRight: spacing.md, fontSize: typography.sizes.sm },
  filterOptions: { flexDirection: 'row', gap: spacing.sm },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.round, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderLight },
  filterChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  filterChipText: { fontSize: typography.sizes.sm, color: colors.textSecondary, fontWeight: typography.weights.medium },
  filterChipTextActive: { color: colors.primary, fontWeight: typography.weights.bold },

  // Notification Styles
  notificationContainer: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    zIndex: 1000,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.strong,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.white,
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: typography.sizes.sm,
    color: colors.white,
    opacity: 0.9,
  },
  notificationClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  notificationCloseText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
});
