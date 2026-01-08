// HomeScreen - Optimized Core View with Claymorphism Design
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Animated,
  Pressable,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { gradients } from '../theme/styles';
import { Word, RootStackParamList, TabType } from '../types';
import { StorageService } from '../services/StorageService';
import { DictionaryService } from '../services/DictionaryService';
import {
  WordCard,
  QuickAddModal,
  SearchModal
} from '../components';
import { EventBus } from '../services/EventBus';
import { PracticeScreen } from './PracticeScreen';
import { BottomTabBar } from '../components/BottomTabBar';
import { UI_LIMITS, ANIMATION } from '../constants';
import { getNotificationByTime, getGreetingText, getUserInitial } from '../utils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

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
  // Chạy 1 lần duy nhất khi khởi động App - Force seed mock data
  useEffect(() => {
    const initData = async () => {
      const allWords = await StorageService.getWords();
      if (allWords.length === 0) {
        // Nếu chưa có data, seed mock data
        await StorageService.forceSeedMockData();
        loadData();
      }
    };
    initData();
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

  const loadData = useCallback(async () => {
    try {
      const allWords = await StorageService.getWords();
      setWords(allWords);

      // Check and resume polling for any words still processing
      DictionaryService.checkAndResumePolling(allWords);

      const reviewList = await StorageService.getWordsForReview();
      setWordsForReview(reviewList.length);

      const leastViewed = await StorageService.getLeastViewedWords(5);
      setLeastViewedCount(leastViewed.length > 0 ? leastViewed.length : 5);
      setLeastViewedWords(leastViewed);

      const shouldShow = await StorageService.shouldShowPracticeNotification();

      if (shouldShow && leastViewed.length > 0) {
        const lastPractice = await StorageService.getLastPracticeTime();
        const minutesSince = lastPractice ? Math.floor((Date.now() - lastPractice) / (60 * 1000)) : 0;
        const notification = getNotificationByTime(minutesSince, leastViewed.length);

        setShowNotification(true);
        setNotificationData(notification);

        await StorageService.saveLastNotificationShown();

        Animated.spring(notificationAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: ANIMATION.spring.tension,
          friction: ANIMATION.spring.friction,
        }).start();
      } else {
        setShowNotification(false);
        notificationAnim.setValue(-100);
      }

      const name = await StorageService.getUserName();
      setUserName(name);
    } catch (error) {
      console.error('[HomeScreen] Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [notificationAnim]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleAddWordSuccess = useCallback(async (newWord: Word) => {
    setQuickAddVisible(false);
    const updatedWords = await StorageService.addWord(newWord);
    setWords(updatedWords);
  }, []);

  const toggleTopicExpand = useCallback((topic: string) => {
    setExpandedTopics(prev => ({ ...prev, [topic]: !prev[topic] }));
  }, []);

  const handleNotificationPress = useCallback(() => {
    Animated.timing(notificationAnim, {
      toValue: -100,
      duration: ANIMATION.slow,
      useNativeDriver: true,
    }).start(() => {
      setShowNotification(false);
    });

    setActiveTab('practice');

    setTimeout(() => {
      EventBus.emit('startPracticeWithWords', { words: leastViewedWords });
    }, 100);
  }, [notificationAnim, leastViewedWords]);

  const handleNotificationDismiss = useCallback(() => {
    Animated.timing(notificationAnim, {
      toValue: -100,
      duration: ANIMATION.slow,
      useNativeDriver: true,
    }).start(() => {
      setShowNotification(false);
    });
  }, [notificationAnim]);

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

  const renderHeader = useCallback(() => {
    const greeting = getGreetingText(userName);
    const avatarInitial = getUserInitial(userName);

    return (
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
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
          <Pressable
            style={({ pressed }) => [
              styles.avatar,
              pressed && styles.avatarPressed
            ]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.avatarText}>{avatarInitial}</Text>
          </Pressable>
        </View>
      </View>
    );
  }, [userName, wordsForReview, leastViewedCount, navigation]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📦</Text>
      <Text style={styles.emptyText}>No words yet.</Text>
      <Text style={styles.emptySubText}>Tap the + button to add one!</Text>
    </View>
  ), []);

  const renderTopicBlock = useCallback(({ item }: { item: { title: string, data: Word[] } }) => {
    const isExpanded = expandedTopics[item.title];
    const displayData = isExpanded ? item.data : item.data.slice(0, UI_LIMITS.topicExpandLimit);
    const hasMore = item.data.length > UI_LIMITS.topicExpandLimit;

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
          <Pressable
            style={({ pressed }) => [
              styles.seeMoreBtn,
              pressed && styles.seeMoreBtnPressed
            ]}
            onPress={() => toggleTopicExpand(item.title)}
          >
            <Text style={styles.seeMoreText}>Show {item.data.length - UI_LIMITS.topicExpandLimit} more items...</Text>
          </Pressable>
        )}
      </View>
    );
  }, [expandedTopics, navigation, toggleTopicExpand]);

  const renderFilterToolbar = useCallback(() => (
    <View style={styles.filterToolbar}>
      <Text style={styles.filterLabel}>Sort by:</Text>
      <View style={styles.filterOptions}>
        {(['newest', 'alphabet', 'views'] as const).map(option => (
          <Pressable
            key={option}
            style={({ pressed }) => [
              styles.filterChip,
              sortBy === option && styles.filterChipActive,
              pressed && styles.filterChipPressed
            ]}
            onPress={() => setSortBy(option)}
          >
            <Text style={[styles.filterChipText, sortBy === option && styles.filterChipTextActive]}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  ), [sortBy]);

  // -- Tab Content --
  const renderContent = useCallback(() => {
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
  }, [activeTab, words, navigation, renderHeader, renderEmpty, refreshing, handleRefresh, inventoryData, renderTopicBlock, renderFilterToolbar]);


  return (
    <LinearGradient
      colors={gradients.backgroundMain.colors as [string, string, ...string[]]}
      start={gradients.backgroundMain.start}
      end={gradients.backgroundMain.end}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.textSecondary, fontSize: typography.sizes.base },

  header: { paddingHorizontal: spacing.screenPadding, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  greeting: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.extraBold, color: colors.textPrimary, letterSpacing: -0.5 },
  subGreeting: { fontSize: typography.sizes.base, color: colors.textSecondary, marginTop: 4 },
  // Avatar with claySoft shadow and subtle gradient styling
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    ...shadows.claySoft,
  },
  // Avatar pressed state - compressed clay effect
  avatarPressed: {
    transform: [{ scale: 0.94 }],
    ...shadows.clayPressed,
  },
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

  seeMoreBtn: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderRadius: borderRadius.clayCard,
    borderWidth: 0,
    ...shadows.claySoft
  },
  // See more button pressed state - compressed clay effect
  seeMoreBtnPressed: {
    transform: [{ scale: 0.97 }],
    ...shadows.clayPressed,
  },
  seeMoreText: { color: colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },

  filterToolbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.screenPadding, marginBottom: spacing.xxl, marginTop: spacing.sm },
  filterLabel: { color: colors.textSecondary, marginRight: spacing.md, fontSize: typography.sizes.sm },
  filterOptions: { flexDirection: 'row', gap: spacing.sm },
  // Filter chip with claySoft shadow, no border
  filterChip: {
    paddingHorizontal: spacing.puffySm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.clayBadge,
    backgroundColor: colors.cardSurface,
    borderWidth: 0,
    ...shadows.claySoft,
  },
  // Active filter chip with clayPrimary shadow
  filterChipActive: {
    backgroundColor: colors.primary,
    ...shadows.clayPrimary,
  },
  // Filter chip pressed state - compressed clay effect
  filterChipPressed: {
    transform: [{ scale: 0.97 }],
    ...shadows.clayPressed,
  },
  filterChipText: { fontSize: typography.sizes.sm, color: colors.textSecondary, fontWeight: typography.weights.medium },
  filterChipTextActive: { color: colors.white, fontWeight: typography.weights.bold },

  // Notification Styles with claymorphism
  notificationContainer: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    zIndex: 1000,
  },
  // Notification content with clayStrong shadow and gradient
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.clayCard,
    padding: spacing.puffyMd,
    borderWidth: 0,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    ...shadows.clayStrong,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationEmoji: {
    fontSize: 22,
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
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  notificationCloseText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
});
