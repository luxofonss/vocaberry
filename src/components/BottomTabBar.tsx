import React, { useEffect, useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Keyboard, Platform, Pressable, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadows } from '../theme';
import { TabType } from '../types';
import { RocketIcon } from './icons/RocketIcon';

// Icon assets
const ICONS = {
  home: require('../../assets/house.png'),
  search: require('../../assets/magnifier.png'),
  practice: require('../../assets/Scholarcap scroll.png'),
  discover: require('../../assets/survey.png'),
};

interface BottomTabBarProps {
  activeTab: TabType;
  wordCount: number;
  reviewCount: number;
  onTabChange: (tab: TabType) => void;
  onAddPress: () => void;
  onSearchPress: () => void;
}

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
              <Image
                source={ICONS.home}
                style={styles.tabIcon}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>

          {/* Practice Tab */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => onTabChange('practice')}
          >
            <View style={[
              styles.iconContainer,
              activeTab === 'practice' ? styles.iconEmbossed : styles.iconDebossed
            ]}>
              <Image
                source={ICONS.practice}
                style={styles.tabIcon}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>

          {/* SPACER for Floating Button */}
          <View style={{ width: 70 }} />

          {/* Discover Tab */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => onTabChange('discover')}
          >
            <View style={[
              styles.iconContainer,
              activeTab === 'discover' ? styles.iconEmbossed : styles.iconDebossed
            ]}>
              <RocketIcon size={34} />
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
              <Image
                source={ICONS.search}
                style={styles.tabIcon}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* FLOATING ADD BUTTON - Absolute Positioned */}
      <View
        style={[
          styles.floatBtnContainer,
          { bottom: insets.bottom + 15 }
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
            {/* 3D Plus Icon - Vertical Bar */}
            <View style={styles.plusVertical}>
              <View style={styles.plusVerticalHighlight} />
            </View>
            {/* 3D Plus Icon - Horizontal Bar */}
            <View style={styles.plusHorizontal}>
              <View style={styles.plusHorizontalHighlight} />
            </View>
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
  tabRow: {
    flexDirection: 'row',
    height: 60, // Reduced height (was 80)
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopColor: colors.backgroundBeige,
    borderTopWidth: 1,
    borderLeftColor: colors.backgroundBeige,
    borderLeftWidth: 1,
    borderRightColor: colors.backgroundBeige,
    borderRightWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Icon container - claymorphism
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tabIcon: {
    width: 34,
    height: 34,
  },
  iconEmbossed: {
    borderRadius: 100,
    backgroundColor: colors.primaryLighter,
  },
  iconDebossed: {
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  floatBtnContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 110,
  },
  addBtnOuter: {
    width: 62,
    height: 62,
    borderRadius: 600,
    backgroundColor: colors.background,
    padding: 6, // Border thickness imitation
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.level2,
  },
  addBtnPressed: {
    transform: [{ scale: 0.95 }],
  },
  addBtn: {
    width: 62,
    height: 62,
    borderRadius: 64,
    backgroundColor: colors.accent3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnPressedInner: {
    backgroundColor: colors.primaryDark,
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  plusVertical: {
    position: 'absolute',
    width: 6,
    height: 28,
    borderRadius: 3,
    backgroundColor: colors.white,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  plusVerticalHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 3,
    height: '100%',
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  plusHorizontal: {
    position: 'absolute',
    width: 28,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  plusHorizontalHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});
