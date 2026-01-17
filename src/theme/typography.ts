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

     // Font Sizes per rules.md
     sizes: {
          // Labels: 12-14px per rules.md
          xs: 10,
          sm: 12, // Label minimum
          base: 14, // Label maximum

          // Body: 16-18px per rules.md
          md: 16, // Body minimum
          lg: 18, // Body maximum

          // Buttons: 18-20px per rules.md
          button: 19, // Button size (18-20px range)

          // H2 (Section Headers): 20-24px per rules.md
          xl: 20, // H2 minimum
          xxl: 24, // H2 maximum

          // H1 (Screen Titles): 36-42px per rules.md
          xxxl: 36, // H1 minimum
          display: 40, // H1 mid
          hero: 42, // H1 maximum
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
