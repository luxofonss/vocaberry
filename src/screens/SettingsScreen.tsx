// Settings Screen - User Settings

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { theme, colors, typography, spacing, borderRadius, shadows } from '../theme';
import { RootStackParamList } from '../types';
import { StorageService } from '../services/StorageService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

// Common languages with their codes and display names
const LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'zh', name: '中文 (Chinese)', flag: '🇨🇳' },
  { code: 'es', name: 'Español (Spanish)', flag: '🇪🇸' },
  { code: 'fr', name: 'Français (French)', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch (German)', flag: '🇩🇪' },
  { code: 'ja', name: '日本語 (Japanese)', flag: '🇯🇵' },
  { code: 'ko', name: '한국어 (Korean)', flag: '🇰🇷' },
  { code: 'pt', name: 'Português (Portuguese)', flag: '🇵🇹' },
  { code: 'it', name: 'Italiano (Italian)', flag: '🇮🇹' },
  { code: 'ru', name: 'Русский (Russian)', flag: '🇷🇺' },
  { code: 'ar', name: 'العربية (Arabic)', flag: '🇸🇦' },
  { code: 'th', name: 'ไทย (Thai)', flag: '🇹🇭' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
];

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMotherLanguage();
  }, []);

  const loadMotherLanguage = async () => {
    try {
      const lang = await StorageService.getMotherLanguage();
      setSelectedLanguage(lang);
    } catch (error) {
      console.error('[SettingsScreen] Failed to load mother language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageSelect = async (languageCode: string) => {
    try {
      await StorageService.saveMotherLanguage(languageCode);
      setSelectedLanguage(languageCode);
    } catch (error) {
      console.error('[SettingsScreen] Failed to save mother language:', error);
    }
  };

  const handleClearLanguage = async () => {
    try {
      await StorageService.saveMotherLanguage('');
      setSelectedLanguage(null);
    } catch (error) {
      console.error('[SettingsScreen] Failed to clear mother language:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Section: Mother Language */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mother Language</Text>
          <Text style={styles.sectionDescription}>
            Choose your native language. You can input words in this language and they will be automatically translated to English.
          </Text>

          {selectedLanguage && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearLanguage}
            >
              <Text style={styles.clearButtonText}>Clear Selection</Text>
            </TouchableOpacity>
          )}

          <View style={styles.languageList}>
            {LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    isSelected && styles.languageItemSelected,
                  ]}
                  onPress={() => handleLanguageSelect(lang.code)}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text
                    style={[
                      styles.languageName,
                      isSelected && styles.languageNameSelected,
                    ]}
                  >
                    {lang.name}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.screenPadding,
  },
  section: {
    marginBottom: spacing.xxxl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  clearButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundSoft,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  clearButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
  },
  languageList: {
    gap: spacing.sm,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.small,
  },
  languageItemSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primaryLight + '20',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: spacing.md,
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
});

