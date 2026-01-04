// BottomTabBar - Optimized Navigation Pill
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Keyboard, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme, colors, shadows, spacing, borderRadius } from '../theme';
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
 * Floating Navigation Component
 * Features a pill-shaped main menu and a separate search trigger.
 * Automatically hides when keyboard is visible to prevent visual clutter.
 */
export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
  onAddPress,
  onSearchPress,
}) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

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

  if (isKeyboardVisible) return null;

  return (
    <View style={styles.containerWrapper}>
      <View style={styles.floatRow}>
        {/* MAIN PILL */}
        <BlurView intensity={80} tint="light" style={[styles.mainPill, shadows.medium]}>
          <TouchableOpacity 
            style={styles.tabItem} 
            onPress={() => onTabChange('home')}
          >
            <Text style={[styles.tabIcon, activeTab === 'home' && styles.activeIcon]}>🏠</Text>
            {activeTab === 'home' && <View style={styles.dot} />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.tabItem} 
            onPress={() => onTabChange('topics')}
          >
            <Text style={[styles.tabIcon, activeTab === 'topics' && styles.activeIcon]}>📚</Text>
            {activeTab === 'topics' && <View style={styles.dot} />}
          </TouchableOpacity>

          {/* ADD BUTTON */}
          <TouchableOpacity 
            style={[styles.addBtn, shadows.strong]} 
            onPress={onAddPress}
            activeOpacity={0.8}
          >
            <View style={styles.plusContainer}>
                <View style={styles.plusVertical} />
                <View style={styles.plusHorizontal} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.tabItem} 
            onPress={() => onTabChange('practice')}
          >
            <Text style={[styles.tabIcon, activeTab === 'practice' && styles.activeIcon]}>🎯</Text>
            {activeTab === 'practice' && <View style={styles.dot} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.tabItem} 
          onPress={onSearchPress}
          >
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerWrapper: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100, // Ensure it stays on top content
  },
  floatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mainPill: {
    flexDirection: 'row',
    borderRadius: 35,
    height: 60,
    paddingHorizontal: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.85)', // Fallback / Base color
  },
  tabItem: {
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.5,
  },
  activeIcon: {
    opacity: 1,
  },
  dot: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  plusContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusVertical: {
    width: 3.5,
    height: 18,
    backgroundColor: 'white',
    borderRadius: 2,
    position: 'absolute',
  },
  plusHorizontal: {
    width: 18,
    height: 3.5,
    backgroundColor: 'white',
    borderRadius: 2,
    position: 'absolute',
  },
  searchBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  searchIcon: {
    fontSize: 24,
  },
});
