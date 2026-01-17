// FilterChip Component - Reusable Claymorphism Filter Chip
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

/**
 * Reusable filter chip component following design system principles:
 * - Minimum border radius of 20px
 * - Squish animation on press (scale 0.92)
 * - Clay shadow effects
 */
export const FilterChip: React.FC<FilterChipProps> = ({ label, active, onPress }) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.chipPressed,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.puffySm,
    paddingVertical: spacing.sm,
    borderRadius: 20, // Minimum 20px per rules.md
    backgroundColor: colors.cardSurface,
    borderWidth: 0,
    ...shadows.claySoft,
  },
  chipActive: {
    backgroundColor: colors.primary,
    ...shadows.clayPrimary,
  },
  chipPressed: {
    transform: [{ scale: 0.92 }], // Squish animation per rules.md
    ...shadows.clayPressed,
  },
  chipText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
});

