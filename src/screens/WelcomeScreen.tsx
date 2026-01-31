// Welcome Screen - First Launch Experience

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme, colors, typography, spacing, borderRadius, shadows, welcomeStyles, gradients } from '../theme';
import { RootStackParamList } from '../types';
import { StorageService } from '../services/StorageService';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { signInGuest } = useAuth();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!name.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await signInGuest(name.trim());
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
        <ImageBackground
          source={require('../../assets/welcome.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              {/* Name Input with Label */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={welcomeStyles.inputWelcome}
                    placeholder="Enter your name..."
                    placeholderTextColor={colors.welcome.textPlaceholder}
                    value={name}
                    onChangeText={setName}
                    autoFocus
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleContinue}
                    editable={!isSubmitting}
                  />
                  <View style={styles.inputIcon}>
                    <Ionicons name="person-outline" size={20} color={colors.welcome.buttonPurpleEnd} />
                  </View>
                </View>
              </View>

              {/* Get Started Button */}
              <Pressable
                style={({ pressed }) => [
                  welcomeStyles.buttonWelcome,
                  styles.getStartedButtonWidth,
                  (!name.trim() || isSubmitting) && styles.getStartedButtonDisabled,
                  pressed && styles.getStartedButtonPressed,
                ]}
                onPress={handleContinue}
                disabled={!name.trim() || isSubmitting}
              >
                <LinearGradient
                  colors={gradients.buttonWelcome.colors as [string, string, ...string[]]}
                  start={gradients.buttonWelcome.start}
                  end={gradients.buttonWelcome.end}
                  style={[StyleSheet.absoluteFill, { borderRadius: borderRadius.clayButton }]}
                />
                <Text style={welcomeStyles.buttonText}>
                  {isSubmitting ? 'Getting Started...' : 'Get Started'}
                </Text>
                {!isSubmitting && (
                  <Ionicons name="arrow-forward" size={20} color={colors.white} style={styles.arrowIcon} />
                )}
              </Pressable>

              <TouchableOpacity
                style={{ marginTop: spacing.xl }}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={{ color: colors.welcome.textLabel, fontWeight: '600' }}>
                  Already have an account? Log In
                </Text>
              </TouchableOpacity>

            </View>
          </ScrollView>
        </ImageBackground>
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
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  content: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
    alignItems: 'center',
    alignSelf: 'center',
  },
  // Title container with two-line structure
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  inputContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  inputIcon: {
    position: 'absolute',
    right: spacing.puffyMd,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  getStartedButtonWidth: {
    width: '100%',
  },
  getStartedButtonDisabled: {
    opacity: 0.5,
  },
  // Active: Scale 0.98 per rules.md
  getStartedButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  arrowIcon: {
    marginLeft: spacing.xs,
  },
  legalText: {
    fontSize: 12, // Labels: 12-14px per rules.md
    color: '#9CA3AF', // Medium Gray per rules.md
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
});
