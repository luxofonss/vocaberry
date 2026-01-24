// Settings Screen - User Settings

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { gradients } from '../theme/styles';
import { RootStackParamList } from '../types';
import { StorageService } from '../services/StorageService';
import { LANGUAGES, AVATARS } from '../constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMotherLanguage();
    loadUserAvatar();
  }, []);

  const loadUserAvatar = useCallback(async () => {
    try {
      const avatarId = await StorageService.getUserAvatar();
      setSelectedAvatarId(avatarId || '1');
    } catch (error) {
      console.error('[SettingsScreen] Failed to load user avatar:', error);
    }
  }, []);

  const loadMotherLanguage = useCallback(async () => {
    try {
      const lang = await StorageService.getMotherLanguage();
      setSelectedLanguage(lang);
    } catch (error) {
      console.error('[SettingsScreen] Failed to load mother language:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLanguageSelect = useCallback(async (languageCode: string) => {
    try {
      await StorageService.saveMotherLanguage(languageCode);
      setSelectedLanguage(languageCode);
    } catch (error) {
      console.error('[SettingsScreen] Failed to save mother language:', error);
    }
  }, []);

  const handleAvatarSelect = useCallback(async (avatarId: string) => {
    try {
      await StorageService.saveUserAvatar(avatarId);
      setSelectedAvatarId(avatarId);
    } catch (error) {
      console.error('[SettingsScreen] Failed to save user avatar:', error);
    }
  }, []);

  const handleClearLanguage = useCallback(async () => {
    try {
      await StorageService.saveMotherLanguage('');
      setSelectedLanguage(null);
    } catch (error) {
      console.error('[SettingsScreen] Failed to clear mother language:', error);
    }
  }, []);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <LinearGradient
      colors={gradients.backgroundMain.colors as [string, string, ...string[]]}
      start={gradients.backgroundMain.start}
      end={gradients.backgroundMain.end}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed
            ]}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Section: Profile Avatar */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>👤</Text>
              <Text style={styles.sectionTitle}>Profile Avatar</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Choose an avatar that represents you.
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.avatarList}
            >
              {AVATARS.map((avatar) => {
                const isSelected = selectedAvatarId === avatar.id;
                return (
                  <Pressable
                    key={avatar.id}
                    style={({ pressed }) => [
                      styles.avatarPickerItem,
                      isSelected && styles.avatarPickerItemSelected,
                      pressed && styles.avatarPickerItemPressed,
                    ]}
                    onPress={() => handleAvatarSelect(avatar.id)}
                  >
                    <Image source={avatar.source} style={styles.avatarPickerImage} />
                    {isSelected && (
                      <View style={styles.avatarCheckBadge}>
                        <Ionicons name="checkmark" size={10} color={colors.white} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Section: Mother Language */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🌍</Text>
              <Text style={styles.sectionTitle}>Mother Language</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Choose your native language for automatic translation to English.
            </Text>

            {selectedLanguage && (
              <Pressable
                style={({ pressed }) => [
                  styles.clearButton,
                  pressed && styles.clearButtonPressed
                ]}
                onPress={handleClearLanguage}
              >
                <Ionicons name="close-circle-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.clearButtonText}>Clear Selection</Text>
              </Pressable>
            )}

            <View style={styles.languageList}>
              {LANGUAGES.map((lang) => {
                const isSelected = selectedLanguage === lang.code;
                return (
                  <Pressable
                    key={lang.code}
                    style={({ pressed }) => [
                      styles.languageItem,
                      isSelected && styles.languageItemSelected,
                      pressed && styles.languageItemPressed,
                    ]}
                    onPress={() => handleLanguageSelect(lang.code)}
                  >
                    <View style={styles.flagContainer}>
                      <Text style={styles.languageFlag}>{lang.flag}</Text>
                    </View>
                    <Text
                      style={[
                        styles.languageName,
                        isSelected && styles.languageNameSelected,
                      ]}
                    >
                      {lang.name}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkContainer}>
                        <Ionicons name="checkmark" size={18} color={colors.white} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Safe area for content
  safeArea: {
    flex: 1,
  },
  // Claymorphism header - soft clay with subtle shadow
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    backgroundColor: colors.cardSurface,
    borderBottomWidth: 0,
    ...shadows.claySoft,
  },
  // Claymorphism back button - floating 3D clay circle
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.cardSurface,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.claySoft,
  },
  // Back button pressed state - compressed clay effect
  backButtonPressed: {
    transform: [{ scale: 0.94 }],
    ...shadows.clayPressed,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  // Spacer to balance header layout
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.screenPadding,
    paddingBottom: 120,
  },
  section: {
    marginBottom: spacing.xxxl,
  },
  // Section header row with icon
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  // Section icon emoji
  sectionIcon: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  sectionDescription: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  // Claymorphism clear button - soft clay pill with row layout
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.puffySm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cardSurface,
    borderRadius: borderRadius.clayBadge,
    marginBottom: spacing.md,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.claySoft,
  },
  // Clear button pressed state - compressed clay effect
  clearButtonPressed: {
    transform: [{ scale: 0.97 }],
    ...shadows.clayPressed,
  },
  clearButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
  },
  languageList: {
    gap: spacing.sm,
  },
  // Claymorphism language item - compact floating 3D clay tile
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.cardSurface,
    borderRadius: borderRadius.lg,
    borderWidth: 0,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    ...shadows.claySoft,
  },
  // Selected language item - primary colored shadow
  languageItemSelected: {
    backgroundColor: colors.primarySoft,
    borderTopColor: colors.primaryLighter,
    ...shadows.clayPrimary,
  },
  // Language item pressed state - compressed clay effect
  languageItemPressed: {
    transform: [{ scale: 0.98 }],
    ...shadows.clayPressed,
  },
  // Flag container - compact clay circle
  flagContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.subtle,
  },
  languageFlag: {
    fontSize: 20,
  },
  languageName: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  languageNameSelected: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  // Check container - compact success circle
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    ...shadows.subtle,
  },
  // Avatar Picker Styles
  avatarList: {
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  avatarPickerItem: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.cardSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.claySoft,
  },
  avatarPickerItemSelected: {
    borderColor: colors.primary,
    ...shadows.clayPrimary,
  },
  avatarPickerItemPressed: {
    transform: [{ scale: 0.95 }],
  },
  avatarPickerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarCheckBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
});