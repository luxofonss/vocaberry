// CategoryFilter Component - Reusable Category Filter with Emoji
import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

interface CategoryFilterProps {
  label: string;
  emoji?: string;
  active: boolean;
  onPress: () => void;
}

/**
 * Reusable category filter component following design system:
 * - Active: Purple background (#7C3AED) with white text
 * - Inactive: White background with border (#E5E7EB)
 * - Border radius: 100px (pill) per rules.md
 * - Includes emoji icon support
 */
export const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  label, 
  emoji, 
  active, 
  onPress 
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.filter,
        active && styles.filterActive,
        pressed && styles.filterPressed,
      ]}
      onPress={onPress}
    >
      {emoji && <Text style={styles.emoji}>{emoji}</Text>}
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill, // 100px per rules.md
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.borderLight, // #E5E7EB per rules.md
    gap: spacing.xs,
    // Shadow Level 1 per rules.md
    ...shadows.level1,
  },
  filterActive: {
    backgroundColor: colors.primary, // #7C3AED per rules.md
    borderColor: colors.primary,
    // Shadow Level 2 per rules.md
    ...shadows.level2,
  },
  filterPressed: {
    transform: [{ scale: 0.98 }], // Scale 0.98 per rules.md
  },
  emoji: {
    fontSize: typography.sizes.md,
  },
  filterText: {
    fontSize: typography.sizes.base, // 14px per rules.md
    fontWeight: typography.weights.semibold, // 600 per rules.md
    color: colors.textPrimary, // #1F2937 per rules.md
  },
  filterTextActive: {
    color: colors.white,
    fontWeight: typography.weights.bold, // 700 for active state
  },
});

