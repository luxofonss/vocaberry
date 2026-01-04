// Global styles for the Vocabulary Learning App

import { StyleSheet } from 'react-native';
import { colors } from './colors';

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

     // Card styles
     card: {
          backgroundColor: colors.white,
          borderRadius: 16,
          padding: 16,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 12,
          elevation: 5,
     },

     // Text styles
     title: {
          fontSize: 28,
          fontWeight: '700',
          color: colors.textPrimary,
     },

     subtitle: {
          fontSize: 18,
          fontWeight: '600',
          color: colors.textPrimary,
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

     // Button styles
     buttonPrimary: {
          backgroundColor: colors.primary,
          paddingVertical: 16,
          paddingHorizontal: 32,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
     },

     buttonPrimaryText: {
          color: colors.white,
          fontSize: 16,
          fontWeight: '600',
     },

     buttonOutline: {
          backgroundColor: 'transparent',
          paddingVertical: 16,
          paddingHorizontal: 32,
          borderRadius: 14,
          borderWidth: 2,
          borderColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
     },

     buttonOutlineText: {
          color: colors.primary,
          fontSize: 16,
          fontWeight: '600',
     },

     // Input styles
     input: {
          backgroundColor: colors.white,
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 18,
          fontSize: 16,
          color: colors.textPrimary,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 8,
          elevation: 3,
     },
});

// Spacing constants
export const spacing = {
     xs: 4,
     sm: 8,
     md: 16,
     lg: 24,
     xl: 32,
     xxl: 48,
};

// Border radius constants
export const borderRadius = {
     sm: 8,
     md: 12,
     lg: 16,
     xl: 20,
     full: 9999,
};
