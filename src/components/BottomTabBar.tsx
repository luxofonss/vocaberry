// BottomTabBar - Claymorphism Navigation Pill
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Keyboard, Platform, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, innerShadows, borderRadius } from '../theme';
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
 * Floating Navigation Component - Claymorphism Design
 * Features a pill-shaped main menu with soft clay shadows and gradient backgrounds.
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
      <View style={styles.floatRow}>
        {/* MAIN PILL - Claymorphism white background per rules.md */}
        <View style={styles.mainPillContainer}>
          <BlurView intensity={60} tint="light" style={styles.mainPillBlur}>
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
                    size={28}
                    color={activeTab === 'home' ? colors.primary : colors.textSecondary}
                  />
                </View>
                <Text style={[
                  styles.tabLabel, 
                  activeTab === 'home' && [
                    styles.tabLabelActive, 
                    { color: colors.primary }
                  ]
                ]}>
                  Home
                </Text>
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
                    size={28}
                    color={activeTab === 'topics' ? colors.primary : colors.textSecondary}
                  />
                </View>
                <Text style={[
                  styles.tabLabel, 
                  activeTab === 'topics' && [
                    styles.tabLabelActive,
                    { color: colors.primary }
                  ]
                ]}>
                  Topics
                </Text>
              </TouchableOpacity>

              {/* ADD BUTTON - FAB per rules.md: 64x64px, #7C3AED, Level 4 shadow, 4px white border */}
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
                    size={28}
                    color={activeTab === 'practice' ? colors.textSecondary : colors.textSecondary}
                  />
                </View>
                <Text style={[
                  styles.tabLabel, 
                  activeTab === 'practice' && styles.tabLabelActive
                ]}>
                  Practice
                </Text>
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
                    size={28}
                    color={colors.textSecondary}
                  />
                </View>
                <Text style={styles.tabLabel}>
                  Search
                </Text>
              </TouchableOpacity>
            </BlurView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 32 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  floatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Main pill container - Bottom nav shadow per rules.md: 0 -2px 12px rgba(0, 0, 0, 0.06)
  mainPillContainer: {
    borderRadius: 36,
    backgroundColor: colors.white, // White background per rules.md
    // Custom bottom shadow for navigation bar
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -2 }, // Negative height for bottom shadow
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  // Main pill content - white background with claymorphism
  mainPillBlur: {
    flexDirection: 'row',
    height: 80, // 72-80px per rules.md
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    borderRadius: 36,
    // Inner highlight for claymorphism
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
  },
  tabItem: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    minWidth: 60,
  },
  // Icon container - claymorphism with embossed/debossed effect
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  // Embossed effect for active tab icons (raised clay appearance)
  iconEmbossed: {
    backgroundColor: colors.cardSurface,
    borderTopWidth: 1,
    borderTopColor: colors.shadowInnerLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.shadowInnerDark,
    ...shadows.claySoft,
  },
  // Debossed effect for inactive tab icons (pressed-in clay appearance)
  iconDebossed: {
    backgroundColor: 'rgba(139, 124, 246, 0.08)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(124, 58, 237, 0.15)',
  },
  // Tab label text
  tabLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  tabLabelActive: {
    fontWeight: '600',
  },
  // Add button outer container - FAB per rules.md: 64x64px, Level 4 shadow, 4px white border
  addBtnOuter: {
    marginHorizontal: 8,
    width: 64, // FAB size per rules.md
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white, // White border background
    padding: 4, // 4px border per rules.md
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.level4, // Level 4 shadow per rules.md
    zIndex: 10, // z-index: 10 per rules.md
  },
  // Add button pressed state - squish animation
  addBtnPressed: {
    transform: [{ scale: 0.92 }],
    ...shadows.clayPressed,
  },
  // Add button - gradient fill with claymorphism inner highlight
  addBtn: {
    width: 56, // 64 - 4px border * 2
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary, // #7C3AED per rules.md
    // Inner highlight for 3D clay effect
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  // Add button pressed inner state
  addBtnPressedInner: {
    borderTopWidth: 0,
  },
});
