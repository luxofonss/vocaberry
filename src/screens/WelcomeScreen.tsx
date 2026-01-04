// Welcome Screen - First Launch Experience

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { theme, colors, typography, spacing, borderRadius, shadows } from '../theme';
import { RootStackParamList } from '../types';
import { StorageService } from '../services/StorageService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!name.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await StorageService.saveUserName(name.trim());
      // Navigate to Home after saving name
      navigation.replace('Home');
    } catch (error) {
      console.error('[WelcomeScreen] Failed to save name:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <LinearGradient
          colors={[colors.primaryLighter, colors.primaryLight, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            {/* Welcome Icon/Emoji */}
            <View style={styles.iconContainer}>
              <Text style={styles.welcomeEmoji}>👋</Text>
            </View>

            {/* Welcome Text */}
            <Text style={styles.welcomeTitle}>Welcome!</Text>
            <Text style={styles.welcomeSubtitle}>
              Let's get started by telling us your name
            </Text>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={colors.textLight}
                value={name}
                onChangeText={setName}
                autoFocus
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
                editable={!isSubmitting}
              />
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                (!name.trim() || isSubmitting) && styles.continueButtonDisabled,
              ]}
              onPress={handleContinue}
              disabled={!name.trim() || isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>
                {isSubmitting ? 'Getting Started...' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    ...shadows.medium,
  },
  welcomeEmoji: {
    fontSize: 64,
  },
  welcomeTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: typography.sizes.md,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    ...shadows.medium,
  },
  continueButton: {
    width: '100%',
    height: 56,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.strong,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.primary,
  },
});

