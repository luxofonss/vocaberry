import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
     Modal,
     View,
     Text,
     StyleSheet,
     TouchableOpacity,
     TextInput,
     ScrollView,
     Alert,
     Pressable,
     Animated,
     KeyboardAvoidingView,
     Platform,
     ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, borderRadius, spacing, typography } from '../theme';
import { Conversation, ConversationMessage } from '../types';
import { StorageService } from '../services/StorageService';
import { getScreenDimensions } from '../utils';
import { ANIMATION } from '../constants';

const { height: SCREEN_HEIGHT } = getScreenDimensions();

interface CreateConversationModalProps {
     visible: boolean;
     onClose: () => void;
     onSuccess: (conversation: Conversation) => void;
}

export const CreateConversationModal: React.FC<CreateConversationModalProps> = ({
     visible,
     onClose,
     onSuccess,
}) => {
     // Form State
     const [title, setTitle] = useState('');
     const [category, setCategory] = useState('Custom');
     const [messages, setMessages] = useState<ConversationMessage[]>([]);
     const [isSubmitting, setIsSubmitting] = useState(false);

     // Animation State
     const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
     const fadeAnim = useRef(new Animated.Value(0)).current;

     useEffect(() => {
          if (visible) {
               resetForm();
               // Entry Animation
               Animated.parallel([
                    Animated.timing(fadeAnim, {
                         toValue: 1,
                         duration: ANIMATION.slow,
                         useNativeDriver: true,
                    }),
                    Animated.spring(slideAnim, {
                         toValue: 0,
                         useNativeDriver: true,
                         tension: ANIMATION.spring.tension,
                         friction: ANIMATION.spring.friction,
                    })
               ]).start();
          }
     }, [visible, fadeAnim, slideAnim]);

     const handleClose = useCallback(() => {
          Animated.parallel([
               Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: ANIMATION.normal,
                    useNativeDriver: true,
               }),
               Animated.timing(slideAnim, {
                    toValue: SCREEN_HEIGHT,
                    duration: ANIMATION.normal,
                    useNativeDriver: true,
               })
          ]).start(() => {
               onClose();
          });
     }, [fadeAnim, slideAnim, onClose]);

     const resetForm = () => {
          setTitle('');
          setCategory('Custom');
          setMessages([
               { id: Date.now().toString(), role: 'assistant', text: '' }, // Start with one empty message
               { id: (Date.now() + 1).toString(), role: 'user', text: '' }
          ]);
          setIsSubmitting(false);
     };

     const handleAddMessage = () => {
          const lastMsg = messages[messages.length - 1];
          const newRole = lastMsg.role === 'user' ? 'assistant' : 'user';
          setMessages([...messages, { id: Date.now().toString(), role: newRole, text: '' }]);
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

     const handleSave = async () => {
          if (!title.trim()) {
               Alert.alert('Missing Info', 'Please enter a title for the conversation.');
               return;
          }

          const validMessages = messages.filter(m => m.text.trim().length > 0);
          if (validMessages.length < 1) {
               Alert.alert('Missing Messages', 'Please add at least one message.');
               return;
          }

          setIsSubmitting(true);

          try {
               const newConversation: Conversation = {
                    id: Date.now().toString(),
                    title: title.trim(),
                    category: category,
                    difficulty: 'beginner', // Default
                    messages: validMessages,
                    practiceCount: 0,
                    lastPracticedAt: new Date().toISOString(),
                    totalScore: 0
               };

               // Use StorageService to add logic
               // Note: StorageService.addPracticingConversation handles saving to the persistent DB
               await StorageService.addPracticingConversation(newConversation);

               onSuccess(newConversation);
               handleClose();
          } catch (error) {
               Alert.alert('Error', 'Failed to save conversation.');
               console.error(error);
          } finally {
               setIsSubmitting(false);
          }
     };

     return (
          <Modal visible={visible} animationType="fade" transparent>
               <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />
                    <Animated.View style={[styles.keyboardView, { transform: [{ translateY: slideAnim }] }]}>
                         <KeyboardAvoidingView
                              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                              style={{ flex: 1 }}
                         >
                              <TouchableOpacity
                                   activeOpacity={1}
                                   onPress={(e) => e.stopPropagation()}
                                   style={styles.containerContent}
                              >
                                   <View style={styles.card}>
                                        {/* Header */}
                                        <View style={styles.header}>
                                             <Text style={styles.title}>New Conversation</Text>
                                             <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                                                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                                             </TouchableOpacity>
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
                                                            <Ionicons name="trash-outline" size={18} color={colors.textLight} />
                                                       </TouchableOpacity>
                                                  </View>
                                             ))}

                                             <TouchableOpacity style={styles.addMessageBtn} onPress={handleAddMessage}>
                                                  <Text style={styles.addMessageText}>+ Add Line</Text>
                                             </TouchableOpacity>
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
                                   </View>
                              </TouchableOpacity>
                         </KeyboardAvoidingView>
                    </Animated.View>
               </Animated.View>
          </Modal>
     );
};

const styles = StyleSheet.create({
     overlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
     },
     keyboardView: {
          flex: 1,
          justifyContent: 'flex-end',
     },
     containerContent: {
          maxHeight: '90%',
          backgroundColor: colors.background,
          borderTopLeftRadius: borderRadius.xl,
          borderTopRightRadius: borderRadius.xl,
          ...shadows.clayStrong,
     },
     card: {
          height: '100%',
          paddingBottom: 40,
     },
     header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
     },
     title: {
          fontSize: typography.sizes.lg,
          fontWeight: typography.weights.bold,
          color: colors.textPrimary,
     },
     closeBtn: {
          padding: spacing.xs,
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
     addMessageBtn: {
          alignItems: 'center',
          padding: spacing.md,
          marginTop: spacing.sm,
          borderWidth: 1,
          borderColor: colors.primary,
          borderStyle: 'dashed',
          borderRadius: borderRadius.md,
     },
     addMessageText: {
          color: colors.primary,
          fontWeight: typography.weights.bold,
     },
     footer: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: spacing.md,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
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
});
