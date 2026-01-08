// Claymorphism Multi-Layer Shadow System
import { Platform } from 'react-native';
import { colors } from './colors';

// Multi-layer shadow system for claymorphism
export const shadows = {
     // Soft clay effect - subtle floating
     claySoft: Platform.select({
          ios: {
               shadowColor: colors.shadowOuter,
               shadowOffset: { width: 0, height: 6 },
               shadowOpacity: 1,
               shadowRadius: 12,
          },
          android: {
               elevation: 4,
          },
     }),

     // Medium clay effect - standard components
     clayMedium: Platform.select({
          ios: {
               shadowColor: colors.shadowOuter,
               shadowOffset: { width: 0, height: 10 },
               shadowOpacity: 1,
               shadowRadius: 20,
          },
          android: {
               elevation: 8,
          },
     }),

     // Strong clay effect - prominent elements
     clayStrong: Platform.select({
          ios: {
               shadowColor: colors.shadowOuter,
               shadowOffset: { width: 0, height: 16 },
               shadowOpacity: 1,
               shadowRadius: 32,
          },
          android: {
               elevation: 12,
          },
     }),

     // Pressed state - compressed clay
     clayPressed: Platform.select({
          ios: {
               shadowColor: colors.shadowOuter,
               shadowOffset: { width: 0, height: 2 },
               shadowOpacity: 0.6,
               shadowRadius: 4,
          },
          android: {
               elevation: 2,
          },
     }),

     // Glow effect for focus/hover
     clayGlow: Platform.select({
          ios: {
               shadowColor: colors.shadowGlow,
               shadowOffset: { width: 0, height: 0 },
               shadowOpacity: 1,
               shadowRadius: 16,
          },
          android: {
               elevation: 6,
          },
     }),

     // Primary colored shadow
     clayPrimary: Platform.select({
          ios: {
               shadowColor: colors.primary,
               shadowOffset: { width: 0, height: 8 },
               shadowOpacity: 0.35,
               shadowRadius: 16,
          },
          android: {
               elevation: 8,
          },
     }),

     // Secondary colored shadow
     claySecondary: Platform.select({
          ios: {
               shadowColor: colors.secondary,
               shadowOffset: { width: 0, height: 8 },
               shadowOpacity: 0.35,
               shadowRadius: 16,
          },
          android: {
               elevation: 8,
          },
     }),

     // Accent colored shadow
     clayAccent: Platform.select({
          ios: {
               shadowColor: colors.accent1,
               shadowOffset: { width: 0, height: 8 },
               shadowOpacity: 0.35,
               shadowRadius: 16,
          },
          android: {
               elevation: 8,
          },
     }),

     // Subtle shadow for inputs and small elements
     subtle: Platform.select({
          ios: {
               shadowColor: colors.shadowOuterDark,
               shadowOffset: { width: 0, height: 2 },
               shadowOpacity: 1,
               shadowRadius: 4,
          },
          android: {
               elevation: 2,
          },
     }),

     // No shadow
     none: {
          shadowColor: 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
     },

     // Legacy aliases for backward compatibility
     soft: Platform.select({
          ios: {
               shadowColor: colors.shadowOuter,
               shadowOffset: { width: 0, height: 6 },
               shadowOpacity: 1,
               shadowRadius: 12,
          },
          android: {
               elevation: 4,
          },
     }),

     medium: Platform.select({
          ios: {
               shadowColor: colors.shadowOuter,
               shadowOffset: { width: 0, height: 10 },
               shadowOpacity: 1,
               shadowRadius: 20,
          },
          android: {
               elevation: 8,
          },
     }),

     strong: Platform.select({
          ios: {
               shadowColor: colors.shadowOuter,
               shadowOffset: { width: 0, height: 16 },
               shadowOpacity: 1,
               shadowRadius: 32,
          },
          android: {
               elevation: 12,
          },
     }),
};

// Inner shadow simulation styles (applied as border/overlay)
export const innerShadows = {
     // Embossed effect (raised) - highlight on top, shadow on bottom
     embossed: {
          borderTopWidth: 1,
          borderTopColor: colors.embossHighlight,
          borderBottomWidth: 1,
          borderBottomColor: colors.embossShadow,
          borderLeftWidth: 0.5,
          borderLeftColor: colors.embossHighlight,
          borderRightWidth: 0.5,
          borderRightColor: colors.embossShadow,
     },

     // Debossed effect (pressed in) - shadow on top, highlight on bottom
     debossed: {
          borderTopWidth: 1,
          borderTopColor: colors.debossShadow,
          borderBottomWidth: 1,
          borderBottomColor: colors.debossHighlight,
          borderLeftWidth: 0.5,
          borderLeftColor: colors.debossShadow,
          borderRightWidth: 0.5,
          borderRightColor: colors.debossHighlight,
     },

     // Subtle inner shadow for input fields
     inputInner: {
          borderWidth: 1,
          borderColor: colors.shadowInnerDark,
     },
};
