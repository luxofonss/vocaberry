// Typography system for the App
import { Platform } from 'react-native';

export const typography = {
     // Font Weights
     weights: {
          regular: '400' as const,
          medium: '500' as const,
          semibold: '600' as const,
          bold: '700' as const,
          extraBold: '800' as const,
          heavy: '900' as const,
     },

     // Font Sizes
     sizes: {
          xs: 10,
          sm: 12,
          base: 14,
          md: 16,
          lg: 18,
          xl: 20,
          xxl: 24,
          xxxl: 28,
          display: 32,
          hero: 40,
     },

     // Line Heights
     lineHeights: {
          tight: 1.2,
          normal: 1.5,
          relaxed: 1.7,
     },

     // Fonts
     fonts: {
          mono: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
          sans: Platform.OS === 'ios' ? 'System' : 'sans-serif',
     }
};
