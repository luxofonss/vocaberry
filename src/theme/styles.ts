// Global styles for the Vocabulary Learning App - Claymorphism Design

import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { shadows } from './shadows';
import { borderRadius, spacing } from './spacing';

export const globalStyles = StyleSheet.create({
     // Container styles
     container: {
          flex: 1,
          backgroundColor: colors.background,
     },

     safeArea: {
          flex: 1,
          backgroundColor: colors.background,
     },

     // Claymorphism card - puffy, floating with no hard borders
     card: {
          backgroundColor: colors.cardSurface,
          borderRadius: borderRadius.clayCard,
          padding: spacing.cardPadding,
          borderWidth: 0,  // No hard borders
          ...shadows.clayMedium,
     },

     // Card with inner highlight effect for 3D depth
     cardClay: {
          backgroundColor: colors.cardSurface,
          borderRadius: borderRadius.clayCard,
          padding: spacing.cardPadding,
          borderTopWidth: 1,
          borderTopColor: colors.shadowInnerLight,
          borderBottomWidth: 0,
          borderLeftWidth: 0,
          borderRightWidth: 0,
          ...shadows.clayMedium,
     },

     // Glass card style (kept for compatibility)
     cardGlass: {
          backgroundColor: colors.glassWhite,
          borderRadius: borderRadius.clayCard,
          padding: spacing.cardPadding,
          borderWidth: 0,
          ...shadows.claySoft,
     },

     // Text styles
     title: {
          fontSize: 28,
          fontWeight: '700',
          color: colors.textPrimary,
          letterSpacing: -0.5,
     },

     subtitle: {
          fontSize: 18,
          fontWeight: '600',
          color: colors.textPrimary,
          letterSpacing: -0.3,
     },

     body: {
          fontSize: 16,
          color: colors.textSecondary,
          lineHeight: 24,
     },

     caption: {
          fontSize: 14,
          color: colors.textLight,
     },

     // Claymorphism button - gradient + shadow with puffy padding
     buttonPrimary: {
          backgroundColor: colors.primary,
          paddingVertical: spacing.puffyMd,
          paddingHorizontal: spacing.puffyXl,
          borderRadius: borderRadius.clayButton,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 0,
          ...shadows.clayPrimary,
     },

     // Pressed button state - compressed clay effect
     buttonPrimaryPressed: {
          backgroundColor: colors.primaryDark,
          paddingVertical: spacing.puffyMd,
          paddingHorizontal: spacing.puffyXl,
          borderRadius: borderRadius.clayButton,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 0,
          transform: [{ scale: 0.97 }],
          ...shadows.clayPressed,
     },

     buttonPrimaryText: {
          color: colors.white,
          fontSize: 16,
          fontWeight: '700',
          letterSpacing: 0.3,
     },

     // Secondary button with clay shadow
     buttonSecondary: {
          backgroundColor: colors.secondary,
          paddingVertical: spacing.puffyMd,
          paddingHorizontal: spacing.puffyXl,
          borderRadius: borderRadius.clayButton,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 0,
          ...shadows.claySecondary,
     },

     // Claymorphism outline button - no border, soft shadow
     buttonOutline: {
          backgroundColor: colors.white,
          paddingVertical: spacing.puffyMd,
          paddingHorizontal: spacing.puffyXl,
          borderRadius: borderRadius.clayButton,
          borderWidth: 0,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.claySoft,
     },

     buttonOutlineText: {
          color: colors.primary,
          fontSize: 16,
          fontWeight: '600',
     },

     // Soft button (ghost style)
     buttonSoft: {
          backgroundColor: colors.primarySoft,
          paddingVertical: 14,
          paddingHorizontal: 24,
          borderRadius: borderRadius.lg,
          alignItems: 'center',
          justifyContent: 'center',
     },

     buttonSoftText: {
          color: colors.primary,
          fontSize: 15,
          fontWeight: '600',
     },

     // Claymorphism input - soft inner shadow
     input: {
          backgroundColor: colors.white,
          borderRadius: borderRadius.clayInput,
          paddingVertical: spacing.puffySm,
          paddingHorizontal: spacing.puffyMd,
          fontSize: 16,
          color: colors.textPrimary,
          borderWidth: 1,
          borderColor: colors.shadowInnerDark,
          ...shadows.claySoft,
     },

     // Input focused state with glow
     inputFocused: {
          borderColor: colors.primary,
          ...shadows.clayGlow,
     },

     // Floating 3D badge/pill
     badge: {
          backgroundColor: colors.accent1,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: borderRadius.clayBadge,
          borderTopWidth: 1,
          borderTopColor: colors.shadowInnerLight,
          borderBottomWidth: 0,
          borderLeftWidth: 0,
          borderRightWidth: 0,
          ...shadows.claySoft,
     },

     badgeText: {
          color: colors.white,
          fontSize: 12,
          fontWeight: '700',
     },

     // Tag styles with clay shadows
     tag: {
          backgroundColor: colors.primarySoft,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.lg,
          ...shadows.claySoft,
     },

     tagText: {
          color: colors.primary,
          fontSize: 13,
          fontWeight: '600',
     },

     tagSelected: {
          backgroundColor: colors.primary,
          ...shadows.clayPrimary,
     },

     tagTextSelected: {
          color: colors.white,
     },

     // Divider
     divider: {
          height: 1,
          backgroundColor: colors.borderLight,
          marginVertical: spacing.md,
     },

     // Section header
     sectionHeader: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.textLight,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: spacing.sm,
     },
});

// Gradient configurations for LinearGradient component - Claymorphism style
export const gradients = {
     // Main background - cream to violet
     backgroundMain: {
          colors: [colors.gradientCreamStart, colors.gradientVioletEnd],
          start: { x: 0, y: 0 },
          end: { x: 0, y: 1 },
     },

     // Warm background
     backgroundWarm: {
          colors: [colors.background, colors.backgroundWarm],
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
     },

     // Cool background
     backgroundCool: {
          colors: [colors.backgroundViolet, '#EDE9FE'],
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
     },

     // Card surface gradient (subtle 3D effect)
     cardSurface: {
          colors: [colors.gradientCardTop, colors.gradientCardBottom],
          start: { x: 0, y: 0 },
          end: { x: 0, y: 1 },
     },

     // Primary button gradient
     buttonPrimary: {
          colors: [colors.gradientButtonTop, colors.gradientButtonBottom],
          start: { x: 0, y: 0 },
          end: { x: 0, y: 1 },
     },

     // Secondary button gradient
     buttonSecondary: {
          colors: [colors.secondaryLight, colors.secondary],
          start: { x: 0, y: 0 },
          end: { x: 0, y: 1 },
     },

     // Inner highlight (for 3D depth)
     innerHighlight: {
          colors: ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0)'],
          start: { x: 0, y: 0 },
          end: { x: 0, y: 0.5 },
     },

     // Legacy gradients (kept for compatibility)
     background: {
          colors: [colors.gradientStart, colors.gradientEnd],
          start: { x: 0, y: 0 },
          end: { x: 0, y: 1 },
     },

     // Primary gradient (legacy)
     primary: {
          colors: [colors.gradientPrimaryStart, colors.gradientPrimaryEnd],
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
     },

     // Secondary gradient (legacy)
     secondary: {
          colors: [colors.gradientSecondaryStart, colors.gradientSecondaryEnd],
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
     },

     // Accent gradient
     accent: {
          colors: [colors.gradientAccentStart, colors.gradientAccentEnd],
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
     },

     // Card highlight gradient (very subtle)
     cardHighlight: {
          colors: ['rgba(255, 255, 255, 0.9)', 'rgba(255, 245, 238, 0.5)'],
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
     },

     // Warm sunset gradient
     sunset: {
          colors: ['#8B7CF6', '#F472B6'],
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
     },

     // Cool mint gradient
     mint: {
          colors: ['#5DD4CB', '#34D399'],
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
     },

     // Purple dream gradient
     dream: {
          colors: ['#A78BFA', '#F472B6'],
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
     },

     // Glass overlay
     glassOverlay: {
          colors: ['rgba(255, 251, 248, 0.95)', 'rgba(255, 245, 238, 0.85)'],
          start: { x: 0, y: 0 },
          end: { x: 0, y: 1 },
     },
};

// Re-export spacing and borderRadius for convenience
export { spacing, borderRadius };
