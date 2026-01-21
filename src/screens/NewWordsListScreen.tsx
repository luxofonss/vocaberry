import React, { useState, useEffect } from 'react';
import {
     View,
     Text,
     StyleSheet,
     TouchableOpacity,
     ScrollView,
     Animated,
     Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, shadows } from '../theme';
import { RootStackParamList } from '../types';
import { ConversationService } from '../services/ConversationService';
import { StorageService } from '../services/StorageService';
import { DictionaryService } from '../services/DictionaryService';
import { WordPreviewModal } from '../components';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const NewWordsListScreen: React.FC = () => {
     const navigation = useNavigation<NavigationProp>();
     const [words, setWords] = useState<{ id: string, word: string, definition: string }[]>([]);

     // Lookup state
     const [modalVisible, setModalVisible] = useState(false);
     const [selectedWordData, setSelectedWordData] = useState<any>(null);
     const [isSelectedWordNew, setIsSelectedWordNew] = useState(false);
     const [isLookupLoading, setIsLookupLoading] = useState(false);
     const [lookupStatus, setLookupStatus] = useState('');

     // Animation for list items
     const fadeAnims = React.useRef<Animated.Value[]>([]).current;
     const [ready, setReady] = useState(false);

     useEffect(() => {
          // Mock loading data
          ConversationService.getSuggestedWords().then(data => {
               // Duplicate data to make the list longer for demo
               const extendedData = [...data, ...data, ...data].map((item, index) => ({
                    ...item,
                    id: `${item.id}-${index}`
               }));
               setWords(extendedData);

               // Initialize animations
               extendedData.forEach(() => fadeAnims.push(new Animated.Value(0)));
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

     const handleWordPress = async (word: string) => {
          setIsLookupLoading(true);
          setLookupStatus('Checking library...');

          try {
               // 1. Check if word exists in library
               const existingWords = await StorageService.getWords();
               const existing = existingWords.find(w => w.word.toLowerCase() === word.toLowerCase());

               if (existing) {
                    setIsLookupLoading(false);
                    navigation.navigate('WordDetail', { wordId: existing.id });
                    return;
               }

               // 2. Word not in library, open lookup modal
               setModalVisible(true);
               setLookupStatus('Looking up...');

               // Lookup from dictionary service
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

     return (
          <View style={styles.container}>
               <LinearGradient
                    colors={['#EFF6FF', '#FFFFFF', '#EFF6FF']} // Blue-50 via white to blue-50
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBg}
               >
                    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                         <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                              {/* Header Section */}
                              <LinearGradient
                                   colors={['#3B82F6', '#2563EB']} // Blue-500 to Blue-600
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
                                             <Ionicons name="book" size={28} color="white" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                             <Text style={styles.headerTitle}>New Words For You</Text>
                                             <Text style={styles.headerSubtitle}>Expand your vocabulary</Text>
                                        </View>
                                   </View>

                                   <View style={styles.statsRow}>
                                        <View style={styles.statItem}>
                                             <Text style={styles.statValue}>{words.length}</Text>
                                             <Text style={styles.statLabel}>Available</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                             <Text style={styles.statValue}>12</Text>
                                             <Text style={styles.statLabel}>Mastered</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                             <Text style={styles.statValue}>5</Text>
                                             <Text style={styles.statLabel}>Daily Goal</Text>
                                        </View>
                                   </View>
                              </LinearGradient>

                              {/* Content Body */}
                              <View style={styles.bodyContainer}>
                                   {/* Progress Card */}
                                   <View style={[styles.progressCard, shadows.claySoft]}>
                                        <View style={styles.progressCardHeader}>
                                             <View>
                                                  <Text style={styles.progressLabel}>Daily Progress</Text>
                                                  <Text style={styles.progressValue}>5/10 words</Text>
                                             </View>
                                             <LinearGradient
                                                  colors={['#3B82F6', '#2563EB']}
                                                  style={styles.progressCircle}
                                             >
                                                  <Text style={styles.progressPercentage}>50%</Text>
                                             </LinearGradient>
                                        </View>
                                        <View style={styles.progressBarBg}>
                                             <LinearGradient
                                                  colors={['#3B82F6', '#2563EB']}
                                                  style={[styles.progressBarFill, { width: '50%' }]}
                                             />
                                        </View>
                                   </View>

                                   <Text style={styles.sectionTitle}>Word Bank</Text>

                                   <View style={styles.listContainer}>
                                        {words.map((item, index) => (
                                             <Animated.View
                                                  key={item.id}
                                                  style={{ opacity: fadeAnims[index], transform: [{ translateX: fadeAnims[index].interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}
                                             >
                                                  <TouchableOpacity
                                                       style={[styles.wordCard, shadows.claySoft]}
                                                       onPress={() => handleWordPress(item.word)}
                                                  >
                                                       <View style={styles.wordIcon}>
                                                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#3B82F6' }}>
                                                                 {item.word.charAt(0).toUpperCase()}
                                                            </Text>
                                                       </View>
                                                       <View style={{ flex: 1 }}>
                                                            <Text style={styles.wordTitle}>{item.word}</Text>
                                                            <Text style={styles.wordDefinition} numberOfLines={1}>{item.definition}</Text>
                                                       </View>
                                                  </TouchableOpacity>
                                             </Animated.View>
                                        ))}
                                   </View>
                              </View>
                         </ScrollView>
                    </SafeAreaView>

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
          color: '#BFDBFE', // Blue-200
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
          color: '#BFDBFE',
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
          gap: 12,
     },
     wordCard: {
          backgroundColor: 'white',
          borderRadius: 20,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
     },
     wordIcon: {
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: '#EFF6FF',
          alignItems: 'center',
          justifyContent: 'center',
     },
     wordTitle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#1F2937',
          marginBottom: 2,
     },
     wordDefinition: {
          fontSize: 13,
          color: '#6B7280',
     },
});
