// BottomTabBar - Claymorphism Navigation Pill
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Keyboard, Platform, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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
        {/* MAIN PILL - Claymorphism with gradient background */}
        <View style={styles.mainPillContainer}>
          <LinearGradient
            colors={[colors.gradientCardTop, colors.gradientCardBottom]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.mainPillGradient}
          >
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
                  <Text style={[styles.tabIcon, activeTab === 'home' && styles.activeIcon]}>🏠</Text>
                </View>
                {activeTab === 'home' && <View style={styles.dot} />}
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
                  <Text style={[styles.tabIcon, activeTab === 'topics' && styles.activeIcon]}>📚</Text>
                </View>
                {activeTab === 'topics' && <View style={styles.dot} />}
              </TouchableOpacity>

              {/* ADD BUTTON - Gradient fill with clay shadow */}
              <Pressable
                onPress={onAddPress}
                onPressIn={handleAddPressIn}
                onPressOut={handleAddPressOut}
                style={({ pressed }) => [
                  styles.addBtnOuter,
                  pressed && styles.addBtnPressed
                ]}
              >
                <LinearGradient
                  colors={[colors.gradientButtonTop, colors.gradientButtonBottom]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[
                    styles.addBtn,
                    isAddPressed && styles.addBtnPressedInner
                  ]}
                >
                  <View style={styles.plusContainer}>
                    <View style={styles.plusVertical} />
                    <View style={styles.plusHorizontal} />
                  </View>
                </LinearGradient>
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
                  <Text style={[styles.tabIcon, activeTab === 'practice' && styles.activeIcon]}>🎯</Text>
                </View>
                {activeTab === 'practice' && <View style={styles.dot} />}
              </TouchableOpacity>

              {/* Search Tab */}
              <TouchableOpacity
                style={styles.tabItem}
                onPress={onSearchPress}
              >
                <View style={styles.iconContainer}>
                  <Text style={styles.tabIcon}>🔍</Text>
                </View>
              </TouchableOpacity>
            </BlurView>
          </LinearGradient>
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
  // Main pill container with clayStrong shadow and inner highlight
  mainPillContainer: {
    borderRadius: 36,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
    ...shadows.clayStrong,
  },
  // Gradient background for main pill
  mainPillGradient: {
    borderRadius: 36,
    overflow: 'hidden',
  },
  // Blur overlay inside gradient - puffy appearance
  mainPillBlur: {
    flexDirection: 'row',
    height: 64,
    paddingHorizontal: 16,
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 251, 248, 0.9)',
  },
  tabItem: {
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  // Icon container - larger for better touch
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Embossed effect for active tab icons (raised appearance)
  iconEmbossed: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.8)',
    ...shadows.claySoft,
  },
  // Debossed effect for inactive tab icons (pressed-in appearance)
  iconDebossed: {
    backgroundColor: 'rgba(139, 124, 246, 0.08)',
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.4,
  },
  activeIcon: {
    opacity: 1,
  },
  // Dot indicator with glow
  dot: {
    position: 'absolute',
    bottom: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    ...shadows.clayGlow,
  },
  // Add button outer container - larger and more prominent
  addBtnOuter: {
    marginHorizontal: 10,
    borderRadius: 28,
    ...shadows.clayPrimary,
  },
  // Add button pressed state
  addBtnPressed: {
    transform: [{ scale: 0.92 }],
    ...shadows.clayPressed,
  },
  // Add button with gradient fill - larger
  addBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    // Inner highlight for 3D effect
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  // Add button pressed inner state
  addBtnPressedInner: {
    borderTopWidth: 0,
  },
  plusContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusVertical: {
    width: 3,
    height: 18,
    backgroundColor: 'white',
    borderRadius: 1.5,
    position: 'absolute',
  },
  plusHorizontal: {
    width: 18,
    height: 3,
    backgroundColor: 'white',
    borderRadius: 1.5,
    position: 'absolute',
  },
});
