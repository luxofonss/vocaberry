// BottomTabBar - Claymorphism Navigation Bar
import React, { useEffect, useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Keyboard, Platform, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadows } from '../theme';
import { TabType } from '../types';

interface BottomTabBarProps {
  activeTab: TabType;
  wordCount: number;
  reviewCount: number;
  onTabChange: (tab: TabType) => void;
  onAddPress: () => void;
  onSearchPress: () => void;
}

/**
 * Bottom Navigation Component - Claymorphism Design
 * Features a full-width bar with soft clay shadows.
 * Tab icons have embossed/debossed effects based on active state.
 * Automatically hides when keyboard is visible to prevent visual clutter.
 */
export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
  onAddPress,
  onSearchPress,
}) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isAddPressed, setIsAddPressed] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardDidShowListener = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleAddPressIn = useCallback(() => {
    setIsAddPressed(true);
  }, []);

  const handleAddPressOut = useCallback(() => {
    setIsAddPressed(false);
  }, []);

  if (isKeyboardVisible) return null;

  return (
    <View style={styles.containerWrapper}>
      {/* Background Tab Bar */}
      <View style={[styles.mainBarShadow, { paddingBottom: insets.bottom }]}>
        <BlurView intensity={80} tint="light" style={styles.mainBarContent}>
          <View style={styles.tabRow}>
            {/* Home Tab */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => onTabChange('home')}
            >
              <View style={[
                styles.iconContainer,
                activeTab === 'home' ? styles.iconEmbossed : styles.iconDebossed
              ]}>
                <Ionicons
                  name={activeTab === 'home' ? 'home' : 'home-outline'}
                  size={24}
                  color={activeTab === 'home' ? colors.primary : colors.textSecondary}
                />
              </View>
            </TouchableOpacity>

            {/* Topics Tab */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => onTabChange('topics')}
            >
              <View style={[
                styles.iconContainer,
                activeTab === 'topics' ? styles.iconEmbossed : styles.iconDebossed
              ]}>
                <Ionicons
                  name={activeTab === 'topics' ? 'folder' : 'folder-outline'}
                  size={24}
                  color={activeTab === 'topics' ? colors.primary : colors.textSecondary}
                />
              </View>
            </TouchableOpacity>

            {/* SPACER for Floating Button */}
            <View style={{ width: 60 }} />

            {/* Practice Tab */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => onTabChange('practice')}
            >
              <View style={[
                styles.iconContainer,
                activeTab === 'practice' ? styles.iconEmbossed : styles.iconDebossed
              ]}>
                <Ionicons
                  name={activeTab === 'practice' ? 'school' : 'school-outline'}
                  size={24}
                  color={activeTab === 'practice' ? colors.primary : colors.textSecondary}
                />
              </View>
            </TouchableOpacity>

            {/* Search Tab */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={onSearchPress}
            >
              <View style={[
                styles.iconContainer,
                styles.iconDebossed
              ]}>
                <Ionicons
                  name="search-outline"
                  size={24}
                  color={colors.textSecondary}
                />
              </View>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>

      {/* FLOATING ADD BUTTON - Absolute Positioned */}
      <View
        style={[
          styles.floatBtnContainer,
          { bottom: insets.bottom + 20 }
        ]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={onAddPress}
          onPressIn={handleAddPressIn}
          onPressOut={handleAddPressOut}
          style={({ pressed }) => [
            styles.addBtnOuter,
            pressed && styles.addBtnPressed
          ]}
        >
          <View style={[
            styles.addBtn,
            isAddPressed && styles.addBtnPressedInner
          ]}>
            <Ionicons name="add" size={32} color={colors.white} />
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  // Main bar container with top shadow
  mainBarShadow: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    // Custom top shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  // Main bar content
  mainBarContent: {
    overflow: 'hidden',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
  },
  tabRow: {
    flexDirection: 'row',
    height: 60, // Reduced height (was 80)
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Icon container - claymorphism
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Embossed active state (Raised Clay)
  iconEmbossed: {
    backgroundColor: '#F0F5FF', // Very light blue/white mix
    ...Platform.select({
      ios: {
        shadowColor: '#A3B1C6',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  // Debossed inactive state (Pressed/Flat Clay) - Subtler
  iconDebossed: {
    backgroundColor: 'transparent',
    // No bold borders for inactive, just clean
  },
  // Floating Button Container
  floatBtnContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 110,
  },
  // Add button outer - Floating Clay
  addBtnOuter: {
    width: 64,
    height: 64,
    borderRadius: 64,
    backgroundColor: colors.background, // Match bar bg parent for cutout effect illusion
    padding: 6, // Border thickness imitation
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.level2,
  },
  addBtnPressed: {
    transform: [{ scale: 0.95 }],
  },
  // Add button inner - Gradient-like fill
  addBtn: {
    width: 64,
    height: 64,
    borderRadius: 64,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnPressedInner: {
    backgroundColor: colors.primaryDark,
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
});
