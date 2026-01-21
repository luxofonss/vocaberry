import React, { useState, useEffect } from 'react';
import {
     View,
     Text,
     StyleSheet,
     TouchableOpacity,
     ScrollView,
     Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, shadows } from '../theme';
import { RootStackParamList, Conversation } from '../types';
import { ConversationService } from '../services/ConversationService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ConversationListScreen: React.FC = () => {
     const navigation = useNavigation<NavigationProp>();
     const [conversations, setConversations] = useState<Conversation[]>([]);

     // Animation for list items
     const fadeAnims = React.useRef<Animated.Value[]>([]).current;
     const [ready, setReady] = useState(false);

     useEffect(() => {
          ConversationService.getConversations().then(data => {
               setConversations(data);
               // Initialize animations
               data.forEach(() => fadeAnims.push(new Animated.Value(0)));
               setReady(true);
          });
     }, []);

     useEffect(() => {
          if (ready) {
               Animated.stagger(50, fadeAnims.map(anim => Animated.timing(anim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
               }))).start();
          }
     }, [ready]);

     const getDifficultyColor = (diff: string) => {
          switch (diff) {
               case 'beginner': return { bg: '#ECFDF5', text: '#059669' };
               case 'intermediate': return { bg: '#FFFBEB', text: '#D97706' };
               case 'advanced': return { bg: '#FEF2F2', text: '#DC2626' };
               default: return { bg: '#F3F4F6', text: '#4B5563' };
          }
     };

     return (
          <View style={styles.container}>
               <LinearGradient
                    colors={['#FFF7ED', '#FFFFFF', '#FFF7ED']} // Orange-50 via white
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBg}
               >
                    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                         <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                              {/* Header Section */}
                              <LinearGradient
                                   colors={['#F97316', '#EA580C']} // Orange-500 to Orange-600
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
                                             <Ionicons name="chatbubbles" size={28} color="white" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                             <Text style={styles.headerTitle}>Conversations</Text>
                                             <Text style={styles.headerSubtitle}>Real-world scenarios</Text>
                                        </View>
                                   </View>

                                   <View style={styles.statsRow}>
                                        <View style={styles.statItem}>
                                             <Text style={styles.statValue}>{conversations.length}</Text>
                                             <Text style={styles.statLabel}>Scenarios</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                             <Text style={styles.statValue}>{conversations.filter(c => c.difficulty === 'beginner').length}</Text>
                                             <Text style={styles.statLabel}>Beginner</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                             <Text style={styles.statValue}>{conversations.filter(c => c.difficulty === 'advanced').length}</Text>
                                             <Text style={styles.statLabel}>Advanced</Text>
                                        </View>
                                   </View>
                              </LinearGradient>

                              {/* Content Body */}
                              <View style={styles.bodyContainer}>
                                   {/* Progress Card */}
                                   <View style={[styles.progressCard, shadows.claySoft]}>
                                        <View style={styles.progressCardHeader}>
                                             <View>
                                                  <Text style={styles.progressLabel}>Practice Score</Text>
                                                  <Text style={styles.progressValue}>850 pts</Text>
                                             </View>
                                             <LinearGradient
                                                  colors={['#F97316', '#EA580C']}
                                                  style={styles.progressCircle}
                                             >
                                                  <Ionicons name="trophy" size={24} color="white" />
                                             </LinearGradient>
                                        </View>
                                        <View style={styles.progressBarBg}>
                                             <LinearGradient
                                                  colors={['#F97316', '#EA580C']}
                                                  style={[styles.progressBarFill, { width: '70%' }]}
                                             />
                                        </View>
                                   </View>

                                   <Text style={styles.sectionTitle}>Topics</Text>

                                   <View style={styles.listContainer}>
                                        {conversations.map((item, index) => {
                                             const diffStyle = getDifficultyColor(item.difficulty);
                                             return (
                                                  <Animated.View
                                                       key={item.id}
                                                       style={{ opacity: fadeAnims[index], transform: [{ translateX: fadeAnims[index].interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}
                                                  >
                                                       <TouchableOpacity
                                                            style={[styles.convCard, shadows.claySoft]}
                                                            onPress={() => navigation.navigate('ConversationDetail', { conversationId: item.id })}
                                                       >
                                                            <View style={styles.cardHeader}>
                                                                 <View style={styles.categoryBadge}>
                                                                      <Text style={styles.categoryText}>{item.category}</Text>
                                                                 </View>
                                                                 <View style={[styles.diffBadge, { backgroundColor: diffStyle.bg }]}>
                                                                      <Text style={[styles.diffText, { color: diffStyle.text }]}>{item.difficulty}</Text>
                                                                 </View>
                                                            </View>

                                                            <Text style={styles.convTitle}>{item.title}</Text>
                                                            <Text style={styles.convDesc} numberOfLines={2}>{item.description}</Text>

                                                            <View style={styles.cardFooter}>
                                                                 <View style={styles.metaItem}>
                                                                      <Ionicons name="chatbubble-outline" size={14} color="#6B7280" />
                                                                      <Text style={styles.metaText}>{item.messages.length}</Text>
                                                                 </View>
                                                                 <View style={styles.metaItem}>
                                                                      <Ionicons name="people-outline" size={14} color="#6B7280" />
                                                                      <Text style={styles.metaText}>{item.practiceCount} practices</Text>
                                                                 </View>
                                                                 <Ionicons name="arrow-forward-circle" size={24} color="#F97316" style={{ marginLeft: 'auto' }} />
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
          paddingBottom: 80,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
     },
     headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginBottom: 24,
     },
     backButton: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
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
          color: '#FED7AA', // Orange-200
          fontSize: 14,
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
          color: '#FED7AA',
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
     convCard: {
          backgroundColor: 'white',
          borderRadius: 20,
          padding: 16,
     },
     cardHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 12,
     },
     categoryBadge: {
          backgroundColor: '#F3F4F6',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
     },
     categoryText: {
          fontSize: 11,
          fontWeight: 'bold',
          color: '#4B5563',
     },
     diffBadge: {
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
     },
     diffText: {
          fontSize: 10,
          fontWeight: 'bold',
          textTransform: 'uppercase',
     },
     convTitle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#1F2937',
          marginBottom: 6,
     },
     convDesc: {
          fontSize: 13,
          color: '#6B7280',
          lineHeight: 18,
          marginBottom: 12,
     },
     cardFooter: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          paddingTop: 12,
     },
     metaItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
     },
     metaText: {
          fontSize: 12,
          color: '#6B7280',
     },
});
