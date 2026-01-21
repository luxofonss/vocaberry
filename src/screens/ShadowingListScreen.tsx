import React, { useState } from 'react';
import {
     View,
     Text,
     StyleSheet,
     TouchableOpacity,
     ScrollView,
     Animated,
     Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, shadows } from '../theme';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Mock Data
const LESSONS = [
     {
          id: 1,
          title: 'Daily Morning Routine',
          channel: 'English with Emma',
          duration: '3:45',
          level: 'Beginner',
          difficulty: 'Easy',
          completed: true,
          stars: 3,
          thumbnail: '🌅',
          accent: 'American',
          views: '1.2M',
     },
     {
          id: 2,
          title: 'Coffee Shop Conversation',
          channel: 'Real English',
          duration: '4:20',
          level: 'Beginner',
          difficulty: 'Easy',
          completed: true,
          stars: 2,
          thumbnail: '☕',
          accent: 'British',
          views: '850K',
     },
     {
          id: 3,
          title: 'Job Interview Tips',
          channel: 'Business English',
          duration: '5:30',
          level: 'Intermediate',
          difficulty: 'Medium',
          completed: false,
          stars: 0,
          thumbnail: '💼',
          accent: 'American',
          views: '2.1M',
     },
     {
          id: 4,
          title: 'Travel Vlog - New York',
          channel: 'Travel with Alex',
          duration: '6:15',
          level: 'Intermediate',
          difficulty: 'Medium',
          completed: false,
          stars: 0,
          thumbnail: '🗽',
          accent: 'American',
          views: '3.5M',
     },
     {
          id: 5,
          title: 'Cooking Recipe Tutorial',
          channel: 'Chef\'s English',
          duration: '4:50',
          level: 'Intermediate',
          difficulty: 'Medium',
          completed: false,
          stars: 0,
          thumbnail: '👨🍳',
          accent: 'British',
          views: '950K',
     },
     {
          id: 6,
          title: 'Technology News Report',
          channel: 'Tech Today',
          duration: '5:00',
          level: 'Advanced',
          difficulty: 'Hard',
          completed: false,
          stars: 0,
          thumbnail: '📱',
          accent: 'American',
          views: '1.8M',
     },
     {
          id: 7,
          title: 'TED Talk - Innovation',
          channel: 'TED Talks',
          duration: '8:30',
          level: 'Advanced',
          difficulty: 'Hard',
          completed: false,
          stars: 0,
          locked: true,
          thumbnail: '🎤',
          accent: 'American',
          views: '5.2M',
     },
];

export const ShadowingListScreen: React.FC = () => {
     const navigation = useNavigation<NavigationProp>();

     // Animation for list items
     const fadeAnims = React.useRef(LESSONS.map(() => new Animated.Value(0))).current;

     React.useEffect(() => {
          Animated.stagger(100, fadeAnims.map(anim => Animated.timing(anim, {
               toValue: 1,
               duration: 500,
               useNativeDriver: true,
          }))).start();
     }, []);

     const getDifficultyColorStyles = (difficulty: string) => {
          switch (difficulty) {
               case 'Easy':
                    return { bg: '#DCFCE7', text: '#15803D' }; // green-100, green-700
               case 'Medium':
                    return { bg: '#FEF9C3', text: '#A16207' }; // yellow-100, yellow-700
               case 'Hard':
                    return { bg: '#FEE2E2', text: '#B91C1C' }; // red-100, red-700
               default:
                    return { bg: '#F3F4F6', text: '#374151' };
          }
     };

     const handleLessonPress = (lesson: typeof LESSONS[0]) => {
          if (lesson.locked) return;
          navigation.navigate('ShadowingPractice', { ...lesson });
     };

     return (
          <View style={styles.container}>
               <LinearGradient
                    colors={['#ECFDF5', '#FFFFFF', '#ECFDF5']} // green-50 via white to emerald-50
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBg}
               >
                    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                         <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                              {/* Header Section */}
                              <LinearGradient
                                   colors={['#22C55E', '#10B981']} // green-500 to emerald-500
                                   start={{ x: 0, y: 0 }}
                                   end={{ x: 1, y: 0 }}
                                   style={styles.header}
                              >
                                   <View style={styles.headerRow}>
                                        <TouchableOpacity
                                             onPress={() => navigation.goBack()}
                                             style={styles.backButton}
                                        >
                                             <Ionicons name="arrow-back" size={24} color="white" />
                                        </TouchableOpacity>

                                        <View style={styles.headerIconContainer}>
                                             <Ionicons name="videocam" size={28} color="white" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                             <Text style={styles.headerTitle}>Luyện shadowing</Text>
                                             <Text style={styles.headerSubtitle}>Học theo video native</Text>
                                        </View>
                                   </View>

                                   <View style={styles.statsRow}>
                                        <View style={styles.statItem}>
                                             <Text style={styles.statValue}>150</Text>
                                             <Text style={styles.statLabel}>Video</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                             <Text style={styles.statValue}>38%</Text>
                                             <Text style={styles.statLabel}>Hoàn thành</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                             <Text style={styles.statValue}>5</Text>
                                             <Text style={styles.statLabel}>Sao vàng</Text>
                                        </View>
                                   </View>
                              </LinearGradient>

                              {/* Content Body */}
                              <View style={styles.bodyContainer}>
                                   {/* Progress Card */}
                                   <View style={[styles.progressCard, shadows.claySoft]}>
                                        <View style={styles.progressCardHeader}>
                                             <View>
                                                  <Text style={styles.progressLabel}>Tiến độ của bạn</Text>
                                                  <Text style={styles.progressValue}>57/150 video</Text>
                                             </View>
                                             <LinearGradient
                                                  colors={['#22C55E', '#10B981']}
                                                  style={styles.progressCircle}
                                             >
                                                  <Text style={styles.progressPercentage}>38%</Text>
                                             </LinearGradient>
                                        </View>
                                        <View style={styles.progressBarBg}>
                                             <LinearGradient
                                                  colors={['#22C55E', '#10B981']}
                                                  style={[styles.progressBarFill, { width: '38%' }]}
                                             />
                                        </View>
                                   </View>

                                   <Text style={styles.sectionTitle}>Danh sách video</Text>

                                   <View style={styles.listContainer}>
                                        {LESSONS.map((lesson, index) => {
                                             const diffStyles = getDifficultyColorStyles(lesson.difficulty);

                                             return (
                                                  <Animated.View
                                                       key={lesson.id}
                                                       style={{ opacity: fadeAnims[index], transform: [{ translateX: fadeAnims[index].interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}
                                                  >
                                                       <TouchableOpacity
                                                            activeOpacity={lesson.locked ? 1 : 0.7}
                                                            onPress={() => handleLessonPress(lesson)}
                                                            style={[
                                                                 styles.lessonCard,
                                                                 shadows.claySoft,
                                                                 lesson.locked && styles.cardLocked
                                                            ]}
                                                       >
                                                            <View style={styles.cardContent}>
                                                                 {/* Thumbnail */}
                                                                 <View style={styles.thumbnailContainer}>
                                                                      <LinearGradient
                                                                           colors={['#DCFCE7', '#D1FAE5']}
                                                                           style={styles.thumbnailGradient}
                                                                      >
                                                                           <Text style={{ fontSize: 32 }}>{lesson.thumbnail}</Text>
                                                                      </LinearGradient>

                                                                      {lesson.locked ? (
                                                                           <View style={styles.lockOverlay}>
                                                                                <Ionicons name="lock-closed" size={24} color="white" />
                                                                           </View>
                                                                      ) : (
                                                                           <View style={styles.playOverlay}>
                                                                                <View style={styles.playCircle}>
                                                                                     <Ionicons name="play" size={16} color="white" style={{ marginLeft: 2 }} />
                                                                                </View>
                                                                           </View>
                                                                      )}

                                                                      <View style={styles.durationBadge}>
                                                                           <Text style={styles.durationText}>{lesson.duration}</Text>
                                                                      </View>

                                                                      {lesson.completed && !lesson.locked && (
                                                                           <View style={styles.checkBadge}>
                                                                                <Ionicons name="checkmark" size={12} color="white" />
                                                                           </View>
                                                                      )}
                                                                 </View>

                                                                 {/* Details */}
                                                                 <View style={styles.lessonInfo}>
                                                                      <Text style={styles.lessonTitle} numberOfLines={2}>{lesson.title}</Text>
                                                                      <Text style={styles.channelName}>{lesson.channel}</Text>

                                                                      <View style={styles.tagsRow}>
                                                                           <View style={[styles.tag, { backgroundColor: diffStyles.bg }]}>
                                                                                <Text style={[styles.tagText, { color: diffStyles.text }]}>{lesson.difficulty}</Text>
                                                                           </View>
                                                                           <View style={[styles.tag, { backgroundColor: '#DBEAFE' }]}>
                                                                                <Text style={[styles.tagText, { color: '#1D4ED8' }]}>{lesson.accent}</Text>
                                                                           </View>

                                                                           {lesson.completed && (
                                                                                <View style={styles.starsRow}>
                                                                                     {[...Array(3)].map((_, i) => (
                                                                                          <Ionicons
                                                                                               key={i}
                                                                                               name="star"
                                                                                               size={12}
                                                                                               color={i < lesson.stars ? '#FACC15' : '#D1D5DB'}
                                                                                          />
                                                                                     ))}
                                                                                </View>
                                                                           )}
                                                                      </View>

                                                                      <View style={styles.viewsRow}>
                                                                           <Ionicons name="trending-up" size={12} color="#6B7280" />
                                                                           <Text style={styles.viewsText}>{lesson.views} lượt xem</Text>
                                                                      </View>
                                                                 </View>
                                                            </View>
                                                       </TouchableOpacity>
                                                  </Animated.View>
                                             );
                                        })}
                                   </View>
                              </View>
                         </ScrollView>
                    </SafeAreaView>
               </LinearGradient>
          </View>
     );
};

const styles = StyleSheet.create({
     container: {
          flex: 1,
     },
     gradientBg: {
          flex: 1,
     },
     scrollContent: {
          paddingBottom: 40,
     },
     header: {
          paddingTop: 20,
          paddingBottom: 80, // Extended background
          paddingHorizontal: 20,
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
     },
     backButton: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
     },
     headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginBottom: 24,
     },
     headerIconContainer: {
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: 'rgba(255,255,255,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
     },
     headerTitle: {
          fontSize: 22,
          fontWeight: 'bold',
          color: 'white',
          marginBottom: 2,
     },
     headerSubtitle: {
          color: '#DCFCE7',
          fontSize: 16,
     },
     statsRow: {
          flexDirection: 'row',
          gap: 12,
     },
     statItem: {
          flex: 1,
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderRadius: 16,
          padding: 12,
          alignItems: 'center',
     },
     statValue: {
          fontSize: 24,
          fontWeight: 'bold',
          color: 'white',
     },
     statLabel: {
          fontSize: 10,
          color: '#DCFCE7',
          marginTop: 2,
     },
     bodyContainer: {
          marginTop: -60,
          paddingHorizontal: 20,
     },
     progressCard: {
          backgroundColor: 'white',
          borderRadius: 24,
          padding: 20,
          marginBottom: 24,
     },
     progressCardHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
     },
     progressLabel: {
          fontSize: 14,
          color: '#6B7280',
          marginBottom: 4,
     },
     progressValue: {
          fontSize: 20,
          fontWeight: 'bold',
          color: '#1F2937',
     },
     progressCircle: {
          width: 60,
          height: 60,
          borderRadius: 30,
          alignItems: 'center',
          justifyContent: 'center',
     },
     progressPercentage: {
          color: 'white',
          fontWeight: 'bold',
          fontSize: 16,
     },
     progressBarBg: {
          height: 8,
          backgroundColor: '#F3F4F6',
          borderRadius: 4,
          overflow: 'hidden',
     },
     progressBarFill: {
          height: '100%',
          borderRadius: 4,
     },
     sectionTitle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: '#1F2937',
          marginBottom: 16,
     },
     listContainer: {
          gap: 16,
     },
     lessonCard: {
          backgroundColor: 'white',
          borderRadius: 24,
          padding: 16,
          marginBottom: 4, // Spacing for shadow
     },
     cardLocked: {
          opacity: 0.6,
     },
     cardContent: {
          flexDirection: 'row',
          gap: 16,
     },
     thumbnailContainer: {
          width: 100,
          height: 80,
          borderRadius: 12,
          overflow: 'hidden',
          position: 'relative',
     },
     thumbnailGradient: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
     },
     lockOverlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0,0,0,0.4)',
          alignItems: 'center',
          justifyContent: 'center',
     },
     playOverlay: {
          ...StyleSheet.absoluteFillObject,
          alignItems: 'center',
          justifyContent: 'center',
     },
     playCircle: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: 'rgba(0,0,0,0.6)',
          alignItems: 'center',
          justifyContent: 'center',
     },
     durationBadge: {
          position: 'absolute',
          bottom: 4,
          right: 4,
          backgroundColor: 'rgba(0,0,0,0.8)',
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
     },
     durationText: {
          color: 'white',
          fontSize: 10,
          fontWeight: 'bold',
     },
     checkBadge: {
          position: 'absolute',
          top: -4,
          right: -4,
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: '#22C55E',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: 'white',
          zIndex: 10,
     },
     lessonInfo: {
          flex: 1,
          justifyContent: 'flex-start',
     },
     lessonTitle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#1F2937',
          marginBottom: 4,
          lineHeight: 22,
     },
     channelName: {
          fontSize: 12,
          color: '#6B7280',
          marginBottom: 8,
     },
     tagsRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          marginBottom: 8,
     },
     tag: {
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 12,
     },
     tagText: {
          fontSize: 10,
          fontWeight: '600',
     },
     starsRow: {
          flexDirection: 'row',
          gap: 2,
     },
     viewsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
     },
     viewsText: {
          fontSize: 12,
          color: '#6B7280',
     },
});
