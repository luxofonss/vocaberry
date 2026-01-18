// HomeScreen - Optimized Core View with Claymorphism Design (Fixed Styles)
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  FlatList,
  Animated,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { gradients } from '../theme/styles';
import { Word, RootStackParamList, TabType, Sentence, Conversation } from '../types';
import { StorageService } from '../services/StorageService';
import { DictionaryService } from '../services/DictionaryService';
import {
  WordCard,
  QuickAddModal,
  SearchModal,
  FilterChip,
} from '../components';
import { EventBus } from '../services/EventBus';
import { PracticeScreen } from './PracticeScreen';
import { DiscoverScreen } from './DiscoverScreen';
import { BottomTabBar } from '../components/BottomTabBar';
import { UI_LIMITS, ANIMATION } from '../constants';
import { getNotificationByTime, getUserInitial } from '../utils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  // -- State --
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [wordsForReview, setWordsForReview] = useState(0);
  const [leastViewedCount, setLeastViewedCount] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [homeSubTab, setHomeSubTab] = useState<string>('words');
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [practicingConversations, setPracticingConversations] = useState<Conversation[]>([]);
  const [newSentence, setNewSentence] = useState('');
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [isSearchVisible, setSearchVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'alphabet' | 'newest' | 'views'>('newest');
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [userName, setUserName] = useState<string | null>(null);
  const [leastViewedWords, setLeastViewedWords] = useState<Word[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState<{ emoji: string; title: string; message: string } | null>(null);
  const [showAddSentence, setShowAddSentence] = useState(false);
  const [isPracticeQuizActive, setIsPracticeQuizActive] = useState(false);
  const notificationAnim = useRef(new Animated.Value(-150)).current;
  const autoDismissTimer = useRef<NodeJS.Timeout | null>(null);

  // -- Effects --
  useEffect(() => {
    const initData = async () => {
      const allWords = await StorageService.getWords();
      if (allWords.length === 0) {
        await StorageService.forceSeedMockData();
        loadData();
      }
    };
    initData();
  }, []);

  useEffect(() => {
    const cb = ({ wordId, word: updated }: { wordId: string; word: Word }) => {
      setWords((prev) => prev.map(w => w.id === wordId ? updated : w));
    };
    EventBus.on('wordImageUpdated', cb);
    return () => EventBus.off('wordImageUpdated', cb);
  }, []);

  useEffect(() => {
    const handleSwitchToHome = () => {
      setActiveTab('home');
    };
    EventBus.on('switchToHomeTab', handleSwitchToHome);
    return () => EventBus.off('switchToHomeTab', handleSwitchToHome);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = useCallback(async () => {
    try {
      const allWords = await StorageService.getWords();
      setWords(allWords);

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

        // Auto-dismiss after 15s
        if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);
        autoDismissTimer.current = setTimeout(() => {
          handleNotificationDismiss();
        }, 15000);
      } else {
        setShowNotification(false);
        notificationAnim.setValue(-150);
      }

      const name = await StorageService.getUserName();
      setUserName(name);

      const allSentences = await StorageService.getSentences();
      setSentences(allSentences);

      const practicing = await StorageService.getPracticingConversations();
      setPracticingConversations(practicing);
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

  const handleSaveSentence = useCallback(async () => {
    if (!newSentence.trim()) return;
    try {
      const updatedSentences = await StorageService.addSentence(newSentence.trim());
      setSentences(updatedSentences);
      setNewSentence('');
    } catch (e) {
      console.error('Failed to save sentence', e);
    }
  }, [newSentence]);

  const handleDeleteSentence = useCallback(async (id: string) => {
    Alert.alert(
      'Delete Sentence',
      'Are you sure you want to delete this sentence?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = await StorageService.deleteSentence(id);
            setSentences(updated);
          }
        },
      ]
    );
  }, []);

  const toggleTopicExpand = useCallback((topic: string) => {
    setExpandedTopics(prev => ({ ...prev, [topic]: !prev[topic] }));
  }, []);

  const handleNotificationPress = useCallback(() => {
    if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);
    Animated.timing(notificationAnim, {
      toValue: -150,
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
    if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);
    Animated.timing(notificationAnim, {
      toValue: -150,
      duration: ANIMATION.slow,
      useNativeDriver: true,
    }).start(() => {
      setShowNotification(false);
    });
  }, [notificationAnim]);

  // -- Computed Data --
  const availableCategories = useMemo(() => {
    const categorySet = new Set<string>();
    words.forEach(w => {
      const wordTopics = w.topics || [];
      wordTopics.forEach(t => {
        if (t) {
          categorySet.add(t);
        }
      });
    });
    return ['All', ...Array.from(categorySet).sort()];
  }, [words]);

  const filteredWords = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'All Words' || selectedCategory === 'All') {
      return words;
    }
    return words.filter(w => {
      const wordTopics = w.topics || [];
      return wordTopics.includes(selectedCategory);
    });
  }, [words, selectedCategory]);

  const inventoryData = useMemo(() => {
    const groups: Record<string, Word[]> = {};
    words.forEach(w => {
      const wordTopics = w.topics || [];
      wordTopics.forEach(t => {
        if (t && t !== 'Uncategorized') {
          if (!groups[t]) groups[t] = [];
          groups[t].push(w);
        }
      });
    });

    const topicList = Object.keys(groups).sort().map(topic => {
      let sortedItems = [...groups[topic]];
      if (sortBy === 'alphabet') {
        sortedItems.sort((a, b) => a.word.localeCompare(b.word));
      } else if (sortBy === 'newest') {
        sortedItems.sort((a, b) => {
          const dateA = a.localCreatedAt || a.createdAt || '';
          const dateB = b.localCreatedAt || b.createdAt || '';
          return dateB.localeCompare(dateA);
        });
      }
      return { title: topic, data: sortedItems };
    });

    return topicList;
  }, [words, sortBy]);

  // -- Render Components --
  const renderHeader = useCallback(() => {
    const greetingName = userName || 'there';
    const avatarInitial = getUserInitial(userName);

    return (
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>
              Hi, {greetingName}! <Text style={styles.wavingEmoji}>👋</Text>
            </Text>
            <Text style={styles.subGreeting}>Ready for some fresh words?</Text>
          </View>
          <View style={styles.avatarContainer}>
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
      </View>
    );
  }, [userName, navigation]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📦</Text>
      <Text style={styles.emptyText}>No words yet.</Text>
      <Text style={styles.emptySubText}>Tap the + button to add one!</Text>
    </View>
  ), []);

  const renderTopicBlock = useCallback(({ item }: { item: { title: string, data: Word[] } }) => {
    const isExpanded = expandedTopics[item.title];
    const displayData = isExpanded ? (item.data || []) : (item.data || []).slice(0, UI_LIMITS.topicExpandLimit);
    const hasMore = (item.data || []).length > UI_LIMITS.topicExpandLimit;

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
          <FilterChip
            key={option}
            label={option.charAt(0).toUpperCase() + option.slice(1)}
            active={sortBy === option}
            onPress={() => setSortBy(option)}
          />
        ))}
      </View>
    </View>
  ), [sortBy]);

  // -- Tab Content --
  const renderContent = useCallback(() => {
    if (activeTab === 'practice') return <PracticeScreen onQuizStateChange={setIsPracticeQuizActive} />;

    if (activeTab === 'discover') return <DiscoverScreen />;

    if (activeTab === 'home') {
      return (
        <View style={styles.contentContainer}>
          {renderHeader()}

          {/* Sub Tab Selector */}
          <View style={styles.subTabRow}>
            {[
              { id: 'words', label: 'Words' },
              { id: 'sentences', label: 'Pron.' },
              { id: 'conversations', label: 'Convo' }
            ].map(tab => (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.7}
                style={[styles.subTabButton, homeSubTab === tab.id && styles.subTabButtonActive]}
                onPress={() => setHomeSubTab(tab.id)}
              >
                <Text style={[styles.subTabText, homeSubTab === tab.id && styles.subTabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {homeSubTab === 'words' && (
            <View style={styles.contentContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryChipsContainer}
                contentContainerStyle={styles.categoryChipsScroll}
              >
                {availableCategories.map(cat => {
                  const isActive = selectedCategory === cat || (!selectedCategory && cat === 'All');
                  const emoji = cat === 'All' ? '🌟' :
                    cat === 'Uncategorized' ? '📦' :
                      cat === 'Food' ? '🍔' :
                        cat === 'Nature' ? '🌿' :
                          cat === 'Work' ? '💼' : '🏷️';

                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        isActive ? styles.categoryChipActive : styles.categoryChipInactive
                      ]}
                      onPress={() => setSelectedCategory(cat === 'All' ? '' : cat)}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        isActive ? styles.categoryChipTextActive : styles.categoryChipTextInactive
                      ]}>
                        {emoji} {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <FlatList
                key="home-grid"
                style={styles.wordsFlatList}
                data={filteredWords}
                renderItem={({ item }) => (
                  <WordCard
                    word={item} variant="compact"
                    onPress={() => navigation.navigate('WordDetail', { wordId: item.id })}
                  />
                )}
                keyExtractor={(item) => item.id}
                numColumns={3}
                columnWrapperStyle={styles.columnWrapper}
                ListHeaderComponent={<View style={styles.listHeaderSpacer} />}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
                }
              />
            </View>
          )}

          {homeSubTab === 'sentences' && (
            <ScrollView
              style={styles.sentencesScrollView}
              contentContainerStyle={styles.sentencesContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
              }
            >
              <View style={styles.sentenceInputRow}>
                <View style={[styles.sentenceInputCardFlexible, shadows.claySoft]}>
                  <TextInput
                    style={styles.sentenceInputFlexible}
                    placeholder="Add a sentence..."
                    placeholderTextColor={colors.textLight}
                    value={newSentence}
                    onChangeText={setNewSentence}
                    multiline
                  />
                </View>
                <TouchableOpacity
                  style={[styles.saveBtnCompact, shadows.clayStrong]}
                  onPress={handleSaveSentence}
                >
                  <LinearGradient
                    colors={[colors.primary, '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBtnCompact}
                  >
                    <Ionicons name="arrow-up" size={20} color={colors.white} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.recentListHeader}>
                <View style={styles.recentListTitleRow}>
                  <Text style={styles.recentListTitle}>RECENT LIST</Text>
                  <View style={styles.sentenceCountBadge}>
                    <Text style={styles.sentenceCountBadgeText}>{sentences.length}</Text>
                  </View>
                </View>
              </View>

              {sentences.length === 0 ? (
                <View style={styles.emptySentences}>
                  <Text style={styles.emptyEmoji}>✍️</Text>
                  <Text style={styles.emptyText}>No sentences yet.</Text>
                </View>
              ) : (
                sentences.map((sent) => (
                  <TouchableOpacity
                    key={sent.id}
                    style={[styles.sentenceCard, shadows.claySoft]}
                    onPress={() => navigation.navigate('SentencePractice', { sentenceId: sent.id })}
                  >
                    <View style={styles.sentenceCardHeader}>
                      <Text style={styles.sentenceText}>{sent.text}</Text>
                      <TouchableOpacity onPress={() => handleDeleteSentence(sent.id)} style={styles.actionBtn}>
                        <Ionicons name="trash-outline" size={18} color={colors.textLight} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.sentenceCardFooter}>
                      <View style={styles.practiceBadgesRow}>
                        <View style={styles.practiceBadge}>
                          <Text style={styles.practiceBadgeText}>{sent.practiceCount || 0} practices</Text>
                        </View>
                        {sent.totalScore !== undefined && sent.totalScore > 0 && (
                          <View style={[styles.practiceBadge, { backgroundColor: '#FFF7ED' }]}>
                            <Text style={[styles.practiceBadgeText, { color: '#EA580C' }]}>⭐️ {sent.totalScore}</Text>
                          </View>
                        )}
                      </View>
                      {sent.lastPracticedAt && (
                        <Text style={styles.lastPracticedText}>
                          {new Date(sent.lastPracticedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}

          {homeSubTab === 'conversations' && (
            <ScrollView
              style={styles.sentencesScrollView}
              contentContainerStyle={styles.sentencesContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
              }
            >
              <View style={styles.recentListHeader}>
                <View style={styles.recentListTitleRow}>
                  <Text style={styles.recentListTitle}>PRACTICING CONVERSATIONS</Text>
                  <View style={styles.sentenceCountBadge}>
                    <Text style={styles.sentenceCountBadgeText}>{practicingConversations.length}</Text>
                  </View>
                </View>
              </View>

              {practicingConversations.length === 0 ? (
                <View style={styles.emptySentences}>
                  <Text style={styles.emptyEmoji}>💬</Text>
                  <Text style={styles.emptyText}>No practicing conversations.</Text>
                  <TouchableOpacity
                    onPress={() => setActiveTab('discover')}
                    style={{ marginTop: 12 }}
                  >
                    <Text style={{ color: colors.primary, fontWeight: '700' }}>Discover more →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                practicingConversations.map((conv) => {
                  const avgScore = conv.practiceCount > 0
                    ? Math.round((conv.totalScore || 0) / conv.practiceCount)
                    : 0;

                  return (
                    <TouchableOpacity
                      key={conv.id}
                      style={[styles.sentenceCard, shadows.claySoft]}
                      onPress={() => navigation.navigate('ConversationDetail', { conversationId: conv.id })}
                    >
                      <View style={styles.sentenceCardHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.sentenceText} numberOfLines={1}>{conv.title}</Text>
                          <Text style={{ fontSize: 12, color: colors.textLight, marginTop: 2 }}>{conv.category} • {conv.difficulty}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={async () => {
                            const updated = await StorageService.removePracticingConversation(conv.id);
                            setPracticingConversations(updated);
                          }}
                          style={styles.actionBtn}
                        >
                          <Ionicons name="trash-outline" size={18} color={colors.textLight} />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.sentenceCardFooter}>
                        <View style={styles.practiceBadgesRow}>
                          <View style={styles.practiceBadge}>
                            <Text style={styles.practiceBadgeText}>{conv.practiceCount || 0} sessions</Text>
                          </View>
                          {avgScore > 0 && (
                            <View style={[styles.practiceBadge, { backgroundColor: '#F0FDF4' }]}>
                              <Text style={[styles.practiceBadgeText, { color: '#16A34A' }]}>Score: {avgScore}%</Text>
                            </View>
                          )}
                        </View>
                        {conv.lastPracticedAt && (
                          <Text style={styles.lastPracticedText}>
                            {new Date(conv.lastPracticedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      );
    }

    return null;
  }, [activeTab, filteredWords, navigation, renderHeader, renderEmpty, refreshing, handleRefresh, inventoryData, renderTopicBlock, renderFilterToolbar, homeSubTab, availableCategories, selectedCategory, sentences, newSentence, handleSaveSentence, handleDeleteSentence, showAddSentence, insets.top]);

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
                paddingTop: insets.top + spacing.xs,
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

        <View style={styles.mainContent}>
          {renderContent()}
        </View>

        {(activeTab !== 'practice' || !isPracticeQuizActive) && (
          <BottomTabBar
            activeTab={activeTab}
            wordCount={words.length}
            reviewCount={wordsForReview}
            onTabChange={setActiveTab}
            onAddPress={() => setQuickAddVisible(true)}
            onSearchPress={() => setSearchVisible(true)}
          />
        )}

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
  container: {
    flex: 1
  },
  safeArea: {
    flex: 1
  },
  mainContent: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.base
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
  greeting: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.extraBold,
    color: colors.textPrimary,
    letterSpacing: -0.5
  },
  wavingEmoji: {
    fontSize: typography.sizes.xxl
  },
  subGreeting: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    marginTop: 2
  },
  avatarContainer: {
    position: 'relative'
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    ...shadows.claySoft,
  },
  avatarPressed: {
    transform: [{ scale: 0.92 }],
    ...shadows.clayPressed,
  },
  avatarText: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.lg
  },

  listContent: {
    paddingBottom: 120
  },
  listHeaderSpacer: {
    height: 0,
  },
  columnWrapper: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.itemGap,
    marginBottom: spacing.md
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 60
  },
  emptyEmoji: {
    fontSize: typography.sizes.hero,
    marginBottom: spacing.lg
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary
  },
  emptySubText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: typography.sizes.base
  },

  topicSection: {
    marginBottom: spacing.xxxl
  },
  topicHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.screenPadding
  },
  topicBlockTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  topicCount: {
    color: colors.textSecondary,
    fontWeight: typography.weights.regular,
    fontSize: typography.sizes.base
  },
  expandText: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.sm
  },

  topicGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.itemGap,
    paddingHorizontal: spacing.screenPadding
  },

  seeMoreBtn: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderRadius: borderRadius.clayCard,
    ...shadows.claySoft
  },
  seeMoreBtnPressed: {
    transform: [{ scale: 0.92 }],
    ...shadows.clayPressed,
  },
  seeMoreText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold
  },

  filterToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.xxl,
    marginTop: spacing.sm
  },
  filterLabel: {
    color: colors.textSecondary,
    marginRight: spacing.md,
    fontSize: typography.sizes.sm
  },
  filterOptions: {
    flexDirection: 'row',
    gap: spacing.sm
  },

  // Notification Styles
  notificationContainer: {
    paddingHorizontal: spacing.screenPadding,
    zIndex: 1000,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.clayCard,
    padding: spacing.puffyMd,
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
    borderRadius: 20,
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

  subTabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.xl,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    marginBottom: spacing.md,
  },
  subTabButton: {
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  subTabButtonActive: {
    borderBottomColor: colors.primary,
  },
  subTabText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  subTabTextActive: {
    color: colors.primary,
  },

  // Sentences Styles
  sentencesScrollView: {
    flex: 1,
  },
  sentencesContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 120,
  },
  sentenceInputCardFlexible: {
    flex: 1,
    backgroundColor: '#F8FAFF',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    minHeight: 48,
    maxHeight: 120,
    justifyContent: 'center',
  },
  sentenceInputFlexible: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  saveBtnCompact: {
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientBtnCompact: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentListTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  plusBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBtnActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  recentListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  recentListTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 0.5,
  },
  sentenceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sentenceCountBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sentenceCountBadgeText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '700',
  },
  sentenceCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sentenceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sentenceText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
    fontWeight: '600',
  },
  sentenceCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  practiceBadgesRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  lastPracticedText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  practiceBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  practiceBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  emptySentences: {
    alignItems: 'center',
    marginTop: 40,
  },
  actionBtn: {
    padding: 4,
  },
  categoryChipsContainer: {
    flexGrow: 0,
    marginBottom: spacing.md,
  },
  categoryChipsScroll: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.sm,
    paddingTop: 0,
    paddingBottom: spacing.xxs,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.subtle,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryChipInactive: {
    backgroundColor: colors.white,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  categoryChipTextInactive: {
    color: '#4B5563',
  },
  wordsFlatList: {
    flex: 1,
  },
});