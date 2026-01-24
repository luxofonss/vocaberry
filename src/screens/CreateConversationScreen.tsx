import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
     View,
     Text,
     StyleSheet,
     TouchableOpacity,
     TextInput,
     ScrollView,
     Alert,
     Pressable,
     KeyboardAvoidingView,
     Platform,
     ActivityIndicator,
     Modal,
     Animated
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, shadows, borderRadius, spacing, typography } from '../theme';
import { gradients } from '../theme/styles';
import { Conversation, ConversationMessage, RootStackParamList } from '../types';
import { StorageService } from '../services/StorageService';
import { TrashIcon } from '../components';
import { EventBus } from '../services/EventBus';
import { getScreenDimensions } from '../utils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateConversation'>;

const { height: SCREEN_HEIGHT } = getScreenDimensions();

export const CreateConversationScreen: React.FC = () => {
     const navigation = useNavigation<NavigationProp>();

     // Form State
     const [title, setTitle] = useState('');
     const [description, setDescription] = useState('');
     const [category, setCategory] = useState<string>(''); // Renamed to "Topic" in UI
     const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
     const [messages, setMessages] = useState<ConversationMessage[]>([]);
     const [isSubmitting, setIsSubmitting] = useState(false);

     // Topic Selection State
     const [isTopicPopupVisible, setIsTopicPopupVisible] = useState(false);
     const [topicSearch, setTopicSearch] = useState('');
     const [availableTopics, setAvailableTopics] = useState<string[]>([]);
     const [isTopicSearchFocused, setIsTopicSearchFocused] = useState(false);

     // Initial load
     useEffect(() => {
          setMessages([
               { id: Date.now().toString(), role: 'assistant', text: '' },
               { id: (Date.now() + 1).toString(), role: 'user', text: '' }
          ]);
          loadTopics();
     }, []);

     const loadTopics = useCallback(async () => {
          const topics = await StorageService.getAllTopics();
          setAvailableTopics(topics);
     }, []);

     const handleBack = () => {
          if (title.trim() || messages.some(m => m.text.trim())) {
               Alert.alert(
                    'Discard Changes?',
                    'You have unsaved changes. Are you sure you want to go back?',
                    [
                         { text: 'Cancel', style: 'cancel' },
                         { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }
                    ]
               );
          } else {
               navigation.goBack();
          }
     };

     const handleAddMessage = (role: 'user' | 'assistant') => {
          // Validate: Don't allow adding if the last message is empty
          const lastMsg = messages[messages.length - 1];
          if (lastMsg && !lastMsg.text.trim()) {
               Alert.alert('Empty Message', 'Please fill in the current message before adding a new one.');
               return;
          }
          setMessages([...messages, { id: Date.now().toString(), role, text: '' }]);
     };

     const handleRemoveMessage = (index: number) => {
          if (messages.length <= 1) return;
          const newMessages = messages.filter((_, i) => i !== index);
          setMessages(newMessages);
     };

     const handleMessageChange = (text: string, index: number) => {
          const newMessages = [...messages];
          newMessages[index].text = text;
          setMessages(newMessages);
     };

     const toggleRole = (index: number) => {
          const newMessages = [...messages];
          newMessages[index].role = newMessages[index].role === 'user' ? 'assistant' : 'user';
          setMessages(newMessages);
     };

     // --- TOPIC LOGIC ---
     const createNewTopic = useCallback(() => {
          const trimmed = topicSearch.trim();
          if (trimmed) {
               if (!availableTopics.includes(trimmed)) {
                    setAvailableTopics([...availableTopics, trimmed].sort());
               }
               setCategory(trimmed);
               setTopicSearch('');
               setIsTopicPopupVisible(false);
          }
     }, [topicSearch, availableTopics]);

     const filteredTopics = availableTopics
          .filter(t => t.toLowerCase().includes(topicSearch.toLowerCase()));

     const renderTopicPopup = () => {
          if (!isTopicPopupVisible) return null;

          return (
               <Modal
                    visible={isTopicPopupVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setIsTopicPopupVisible(false)}
               >
                    <View style={styles.popupOverlay}>
                         <TouchableOpacity
                              style={StyleSheet.absoluteFill}
                              activeOpacity={1}
                              onPress={() => setIsTopicPopupVisible(false)}
                         />
                         <View style={styles.popupContainer}>
                              <View style={styles.popupHeader}>
                                   <Text style={styles.popupTitle}>Select Topic</Text>
                                   <TouchableOpacity onPress={() => setIsTopicPopupVisible(false)}>
                                        <Text style={styles.popupClose}>Done</Text>
                                   </TouchableOpacity>
                              </View>

                              <View style={styles.popupSearchRow}>
                                   <TextInput
                                        style={[
                                             styles.popupInput,
                                             isTopicSearchFocused && styles.popupInputFocused
                                        ]}
                                        placeholder="Search or Create Topic..."
                                        value={topicSearch}
                                        onChangeText={setTopicSearch}
                                        onFocus={() => setIsTopicSearchFocused(true)}
                                        onBlur={() => setIsTopicSearchFocused(false)}
                                   />
                                   {topicSearch.length > 0 && !availableTopics.includes(topicSearch) && (
                                        <TouchableOpacity style={styles.popupAddBtn} onPress={createNewTopic}>
                                             <Text style={styles.popupAddText}>+ Create</Text>
                                        </TouchableOpacity>
                                   )}
                              </View>

                              <ScrollView
                                   style={styles.popupScrollView}
                                   contentContainerStyle={styles.popupTagsContainer}
                                   keyboardShouldPersistTaps="handled"
                                   showsVerticalScrollIndicator={false}
                              >
                                   {filteredTopics.map(topic => {
                                        const isSelected = category === topic;
                                        return (
                                             <TouchableOpacity
                                                  key={topic}
                                                  style={[styles.tag, isSelected && styles.tagSelected]}
                                                  onPress={() => {
                                                       setCategory(topic);
                                                       setIsTopicPopupVisible(false);
                                                  }}
                                             >
                                                  <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                                                       {isSelected ? '# ' : ''}{topic}
                                                  </Text>
                                             </TouchableOpacity>
                                        );
                                   })}
                                   {filteredTopics.length === 0 && topicSearch.length === 0 && (
                                        <Text style={styles.emptyText}>No topics found.</Text>
                                   )}
                              </ScrollView>
                         </View>
                    </View>
               </Modal>
          );
     };

     const handleSave = async () => {
          // Validate form
          if (!title.trim()) {
               Alert.alert('Missing Info', 'Please enter a title for the conversation.');
               return;
          }

          // Validate messages
          // 1. Remove trailing empty messages
          let processedMessages = [...messages];
          while (processedMessages.length > 0 && !processedMessages[processedMessages.length - 1].text.trim()) {
               processedMessages.pop();
          }

          // 2. Check if we have any messages left
          if (processedMessages.length === 0) {
               Alert.alert('Missing Messages', 'Please add at least one message.');
               return;
          }

          // 3. Check for any internal empty messages (user requirement: "không để 2 input liên tiếp của 1 row bị empty")
          // Interpreted as: No empty messages allowed in the sequence
          const hasEmpty = processedMessages.some(m => !m.text.trim());
          if (hasEmpty) {
               Alert.alert('Incomplete Conversation', 'Please fill in all message fields or remove empty lines.');
               return;
          }

          setIsSubmitting(true);

          try {
               const newConversation: Conversation = {
                    id: Date.now().toString(),
                    title: title.trim(),
                    description: description.trim(),
                    category: category.trim() || 'Daily Life',
                    difficulty: difficulty,
                    messages: processedMessages,
                    practiceCount: 0,
                    lastPracticedAt: new Date().toISOString(),
                    totalScore: 0
               };

               await StorageService.addPracticingConversation(newConversation);
               EventBus.emit('conversationListUpdated');
               navigation.goBack();
          } catch (error) {
               Alert.alert('Error', 'Failed to save conversation.');
               console.error(error);
          } finally {
               setIsSubmitting(false);
          }
     };

     return (
          <LinearGradient
               colors={gradients.backgroundMain.colors as [string, string, ...string[]]}
               start={gradients.backgroundMain.start}
               end={gradients.backgroundMain.end}
               style={styles.container}
          >
               <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                    <KeyboardAvoidingView
                         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                         style={{ flex: 1 }}
                    >
                         <View style={styles.header}>
                              <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                                   <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                              </TouchableOpacity>
                              <Text style={styles.headerTitle}>New Conversation</Text>
                              <View style={{ width: 40 }} />
                         </View>

                         <ScrollView
                              contentContainerStyle={styles.scrollContent}
                              showsVerticalScrollIndicator={false}
                              keyboardShouldPersistTaps="handled"
                         >
                              {/* Title Input */}
                              <View style={styles.inputGroup}>
                                   <Text style={styles.label}>Title</Text>
                                   <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Chatting with Neighbor"
                                        placeholderTextColor={colors.textLight}
                                        value={title}
                                        onChangeText={setTitle}
                                   />
                              </View>

                              <View style={styles.inputGroup}>
                                   <Text style={styles.label}>Description (Optional)</Text>
                                   <TextInput
                                        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                        placeholder="What is this conversation about?"
                                        placeholderTextColor={colors.textLight}
                                        value={description}
                                        onChangeText={setDescription}
                                        multiline
                                   />
                              </View>

                              <View style={styles.row}>
                                   <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
                                        <Text style={styles.label}>Topic</Text>
                                        <TouchableOpacity
                                             style={styles.topicSelector}
                                             onPress={() => setIsTopicPopupVisible(true)}
                                        >
                                             <Text style={[
                                                  styles.topicSelectorText,
                                                  !category && styles.placeholderText
                                             ]}>
                                                  {category || 'Select Topic'}
                                             </Text>
                                             <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                   </View>
                                   <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                                        <Text style={styles.label}>Difficulty</Text>
                                        <View style={styles.difficultyContainer}>
                                             {(['beginner', 'intermediate', 'advanced'] as const).map((diff) => (
                                                  <TouchableOpacity
                                                       key={diff}
                                                       style={[
                                                            styles.difficultyOption,
                                                            difficulty === diff && styles.difficultyOptionSelected
                                                       ]}
                                                       onPress={() => setDifficulty(diff)}
                                                  >
                                                       <Text style={[
                                                            styles.difficultyText,
                                                            difficulty === diff && styles.difficultyTextSelected
                                                       ]}>
                                                            {diff.charAt(0).toUpperCase() + diff.slice(1, 3)}
                                                       </Text>
                                                  </TouchableOpacity>
                                             ))}
                                        </View>
                                   </View>
                              </View>

                              {/* Messages List */}
                              <Text style={styles.label}>Messages (No translation required)</Text>

                              {messages.map((msg, index) => (
                                   <View key={msg.id} style={styles.messageRow}>
                                        <TouchableOpacity
                                             style={[
                                                  styles.roleBadge,
                                                  msg.role === 'user' ? styles.roleUser : styles.roleAssistant
                                             ]}
                                             onPress={() => toggleRole(index)}
                                        >
                                             <Text style={[
                                                  styles.roleText,
                                                  msg.role === 'user' ? styles.roleTextUser : styles.roleTextAssistant
                                             ]}>
                                                  {msg.role === 'user' ? 'You' : 'Bot'}
                                             </Text>
                                        </TouchableOpacity>

                                        <TextInput
                                             style={styles.messageInput}
                                             placeholder={msg.role === 'user' ? 'Input your line...' : 'Input bot response...'}
                                             placeholderTextColor={colors.textLight}
                                             value={msg.text}
                                             onChangeText={(text) => handleMessageChange(text, index)}
                                             multiline
                                        />

                                        <TouchableOpacity
                                             onPress={() => handleRemoveMessage(index)}
                                             style={styles.removeBtn}
                                             hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                             <TrashIcon size={28} />
                                        </TouchableOpacity>
                                   </View>
                              ))}

                              <View style={styles.addButtonsRow}>
                                   <TouchableOpacity style={[styles.addMessageBtn, styles.addBtnUser]} onPress={() => handleAddMessage('user')}>
                                        <Text style={[styles.addMessageText, styles.addTextUser]}>+ You</Text>
                                   </TouchableOpacity>
                                   <TouchableOpacity style={[styles.addMessageBtn, styles.addBtnBot]} onPress={() => handleAddMessage('assistant')}>
                                        <Text style={[styles.addMessageText, styles.addTextBot]}>+ Bot</Text>
                                   </TouchableOpacity>
                              </View>
                         </ScrollView>

                         <View style={styles.footer}>
                              <Pressable
                                   style={({ pressed }) => [
                                        pressed ? styles.saveButtonPressed : styles.saveButton,
                                        isSubmitting && styles.saveButtonDisabled
                                   ]}
                                   onPress={handleSave}
                                   disabled={isSubmitting}
                              >
                                   {isSubmitting ? (
                                        <ActivityIndicator color="white" />
                                   ) : (
                                        <Text style={styles.saveButtonText}>Create Conversation</Text>
                                   )}
                              </Pressable>
                         </View>

                         {renderTopicPopup()}

                    </KeyboardAvoidingView>
               </SafeAreaView>
          </LinearGradient>
     );
};

const styles = StyleSheet.create({
     container: {
          flex: 1,
     },
     safeArea: {
          flex: 1,
     },
     header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.sm,
          paddingTop: spacing.xs,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
     },
     backBtn: {
          padding: spacing.xs,
          width: 40,
     },
     headerTitle: {
          fontSize: typography.sizes.lg,
          fontWeight: typography.weights.bold,
          color: colors.textPrimary,
     },
     scrollContent: {
          padding: spacing.md,
          paddingBottom: 100, // Space for footer
     },
     inputGroup: {
          marginBottom: spacing.md,
     },
     label: {
          fontSize: typography.sizes.sm,
          fontWeight: typography.weights.medium,
          color: colors.textSecondary,
          marginBottom: spacing.xs,
     },
     input: {
          backgroundColor: colors.backgroundSoft,
          padding: spacing.sm,
          borderRadius: borderRadius.md,
          fontSize: typography.sizes.base,
          color: colors.textPrimary,
          borderWidth: 1,
          borderColor: colors.borderLight,
     },
     messageRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: spacing.sm,
          gap: spacing.xs,
     },
     roleBadge: {
          paddingHorizontal: spacing.sm,
          paddingVertical: 6,
          borderRadius: borderRadius.md,
          minWidth: 50,
          alignItems: 'center',
          marginTop: 4,
     },
     roleUser: {
          backgroundColor: '#DBEAFE', // Light blue
     },
     roleAssistant: {
          backgroundColor: '#F3F4F6', // Gray
     },
     roleText: {
          fontSize: typography.sizes.xs,
          fontWeight: typography.weights.bold,
     },
     roleTextUser: {
          color: '#1E40AF',
     },
     roleTextAssistant: {
          color: '#374151',
     },
     messageInput: {
          flex: 1,
          backgroundColor: colors.cardSurface,
          padding: spacing.sm,
          borderRadius: borderRadius.md,
          fontSize: typography.sizes.base,
          color: colors.textPrimary,
          borderWidth: 1,
          borderColor: colors.borderLight,
          minHeight: 40,
     },
     removeBtn: {
          padding: spacing.xs,
          marginTop: 4,
     },
     addButtonsRow: {
          flexDirection: 'row',
          gap: spacing.md,
          marginTop: spacing.sm,
     },
     addMessageBtn: {
          flex: 1,
          alignItems: 'center',
          padding: spacing.md,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderRadius: borderRadius.md,
     },
     addBtnUser: {
          borderColor: '#3B82F6', // Blue
          backgroundColor: '#eff6ff',
     },
     addBtnBot: {
          borderColor: '#6B7280', // Gray
          backgroundColor: '#f9fafb',
     },
     addMessageText: {
          fontWeight: typography.weights.bold,
     },
     addTextUser: {
          color: '#3B82F6',
     },
     addTextBot: {
          color: '#374151',
     },
     footer: {
          padding: spacing.md,
          backgroundColor: 'transparent',
     },
     saveButton: {
          backgroundColor: colors.primary,
          paddingVertical: spacing.md,
          borderRadius: borderRadius.lg,
          alignItems: 'center',
          ...shadows.claySoft,
     },
     saveButtonPressed: {
          backgroundColor: colors.primaryDark,
          paddingVertical: spacing.md,
          borderRadius: borderRadius.lg,
          alignItems: 'center',
          ...shadows.clayPressed,
     },
     saveButtonDisabled: {
          opacity: 0.7,
     },
     saveButtonText: {
          color: colors.white,
          fontWeight: typography.weights.bold,
          fontSize: typography.sizes.md,
     },
     row: {
          flexDirection: 'row',
          justifyContent: 'space-between',
     },
     difficultyContainer: {
          flexDirection: 'row',
          backgroundColor: colors.backgroundSoft,
          borderRadius: borderRadius.md,
          padding: 2,
          borderWidth: 1,
          borderColor: colors.borderLight,
     },
     difficultyOption: {
          flex: 1,
          alignItems: 'center',
          paddingVertical: 8,
          borderRadius: borderRadius.sm,
     },
     difficultyOptionSelected: {
          backgroundColor: colors.white,
          ...shadows.claySoft,
     },
     difficultyText: {
          fontSize: 10,
          color: colors.textSecondary,
          fontWeight: '600',
     },
     difficultyTextSelected: {
          color: colors.primary,
     },
     topicSelector: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.backgroundSoft,
          padding: spacing.sm,
          borderRadius: borderRadius.md,
          borderWidth: 1,
          borderColor: colors.borderLight,
          height: 42,
     },
     topicSelectorText: {
          fontSize: typography.sizes.base,
          color: colors.textPrimary,
     },
     placeholderText: {
          color: colors.textLight,
     },
     // Popup Styles (Matched QuickAddModal)
     popupOverlay: {
          flex: 1,
          backgroundColor: 'rgba(31, 41, 55, 0.4)',
          justifyContent: 'flex-end',
     },
     popupContainer: {
          backgroundColor: colors.white,
          maxHeight: '80%',
          minHeight: '50%',
          padding: spacing.xxl,
          borderTopLeftRadius: borderRadius.xxl,
          borderTopRightRadius: borderRadius.xxl,
          ...shadows.clayStrong,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
     },
     popupScrollView: {
          flex: 1,
          maxHeight: 400,
     },
     popupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
     popupTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
     popupClose: { fontSize: 16, color: colors.primary, fontWeight: '600' },

     popupSearchRow: { flexDirection: 'row', marginBottom: 20, gap: 10 },
     popupInput: {
          flex: 1,
          backgroundColor: colors.backgroundSoft,
          borderRadius: borderRadius.sm,
          padding: spacing.md,
          fontSize: 16,
          borderWidth: 1,
          borderColor: 'transparent',
     },
     popupInputFocused: {
          borderColor: colors.primary,
          backgroundColor: colors.white,
          ...shadows.clayGlow,
     },
     popupAddBtn: { backgroundColor: colors.primary, justifyContent: 'center', paddingHorizontal: spacing.lg, borderRadius: borderRadius.sm, ...shadows.clayPrimary },
     popupAddText: { color: 'white', fontWeight: 'bold' },

     popupTagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 40 },
     tag: {
          paddingHorizontal: spacing.puffySm,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.lg,
          backgroundColor: colors.white,
          ...shadows.claySoft,
     },
     tagSelected: {
          backgroundColor: colors.secondary,
          ...shadows.clayPrimary,
     },
     tagText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
     tagTextSelected: { color: 'white', fontWeight: '600' },
     emptyText: { width: '100%', textAlign: 'center', color: colors.textLight, marginTop: 40, fontStyle: 'italic' },
});
