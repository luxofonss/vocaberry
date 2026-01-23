export const colors = {
    // Primary Colors per rules.md
    primary: '#7C3AED', // Main Purple - buttons, highlights, active states
    primaryDark: '#6D28D9', // Darker purple for pressed states
    primaryLight: '#A5A0F8',
    primaryLighter: '#D4D0FC',
    primarySoft: 'rgba(139, 124, 246, 0.12)',
    primaryBlack: 'rgba(255,255,255,0.2)',

    // Secondary - Soft Mint
    secondary: '#5DD4CB',
    secondaryDark: '#45BDB5',
    secondaryLight: '#8AE5DE',
    secondarySoft: 'rgba(93, 212, 203, 0.12)',

    // Accent Colors per rules.md
    accentOrange: '#FF6B35', // Orange - streak, fire icon
    accentBlue: '#3B82F6',   // Blue - sessions icon
    accentGreen: '#10B981',  // Green - words icon
    accentRed: '#EF4444',    // Red - notifications
    // Legacy accent colors (kept for compatibility)
    accent1: '#A78BFA',
    accent1Light: '#C4B5FD',
    accent1Soft: 'rgba(167, 139, 250, 0.12)',
    accent2: '#FBBF24',
    accent2Light: '#FCD34D',
    accent3: '#F472B6',
    accent3Light: '#F9A8D4',

    // Semantic
    success: '#34D399',
    successLight: '#6EE7B7',
    successSoft: 'rgba(52, 211, 153, 0.12)',
    error: '#F87171',
    errorLight: '#FCA5A5',
    errorSoft: 'rgba(248, 113, 113, 0.12)',
    warning: '#FBBF24',
    warningLight: '#FDE68A',

    // Backgrounds per rules.md
    background: '#FFFFFF', // White base
    backgroundPurple: '#E9E3F5', // Background Purple - main screens
    backgroundBeige: '#C4B5A6', // Background Beige - modals, overlays
    backgroundSoft: '#F3F4F6', // Light Gray for disabled states
    // Legacy backgrounds (kept for compatibility)
    backgroundViolet: '#F5F0FF',
    backgroundWarm: '#FFEDE3',
    cardWhite: '#FFFFFF',
    cardSurface: '#FEFCFA',
    white: '#FFFFFF',

    // Gradient colors for claymorphism
    gradientCreamStart: '#FFFFFF',
    gradientVioletEnd: '#FFFFFF',
    gradientCardTop: '#FFFFFF',
    gradientCardBottom: '#FAF8F5',
    gradientButtonTop: '#9B8DF8',
    gradientButtonBottom: '#7B6CE6',
    // Legacy gradient colors (kept for compatibility)
    gradientStart: '#FFFBF8',
    gradientEnd: '#FFF0E8',
    gradientPrimaryStart: '#8B7CF6',
    gradientPrimaryEnd: '#A5A0F8',
    gradientSecondaryStart: '#5DD4CB',
    gradientSecondaryEnd: '#8AE5DE',
    gradientAccentStart: '#A78BFA',
    gradientAccentEnd: '#C4B5FD',
    gradientWarmStart: '#FFF5EE',
    gradientWarmEnd: '#FFE8DC',

    // Text Colors per rules.md
    textPrimary: '#1F2937', // Dark Gray - primary text
    textSecondary: '#9CA3AF', // Medium Gray - labels, secondary text
    textLight: '#9CA3AF', // Medium Gray (same as secondary)
    textOnPrimary: '#FFFFFF', // White text on primary background
    // Legacy text colors (kept for compatibility)
    textSecondaryLegacy: '#6B7280',

    // Borders per rules.md
    borderLight: '#E5E7EB', // Light border for inputs, secondary buttons
    borderMedium: '#D1D5DB', // Medium border
    borderSoft: 'rgba(229, 231, 235, 0.5)', // Soft border
    // Legacy borders (kept for compatibility)
    borderLightLegacy: 'rgba(139, 124, 246, 0.08)',
    borderMediumLegacy: 'rgba(139, 124, 246, 0.12)',
    borderSoftLegacy: 'rgba(139, 124, 246, 0.05)',

    // Multi-layer shadow colors for claymorphism
    shadowOuter: 'rgba(124, 58, 237, 0.15)', // Updated to use #7C3AED
    shadowOuterDark: 'rgba(31, 41, 55, 0.08)',
    shadowInnerLight: 'rgba(255, 255, 255, 0.8)',
    shadowInnerDark: 'rgba(124, 58, 237, 0.1)', // Updated to use #7C3AED
    shadowGlow: 'rgba(124, 58, 237, 0.25)', // Updated to use #7C3AED
    // Legacy shadow colors (kept for compatibility)
    shadow: 'rgba(124, 58, 237, 0.15)', // Updated to use #7C3AED
    shadowLight: 'rgba(124, 58, 237, 0.08)', // Updated to use #7C3AED
    shadowDark: 'rgba(31, 41, 55, 0.06)',
    shadowNeutral: 'rgba(0, 0, 0, 0.04)',

    // Emboss/Deboss colors for 3D clay effects
    embossHighlight: 'rgba(255, 255, 255, 0.6)',
    embossShadow: 'rgba(124, 58, 237, 0.2)', // Updated to use #7C3AED
    debossHighlight: 'rgba(255, 255, 255, 0.3)',
    debossShadow: 'rgba(124, 58, 237, 0.15)', // Updated to use #7C3AED

    // Glass effect (kept for compatibility)
    glassWhite: 'rgba(255, 255, 255, 0.85)',
    glassTint: 'rgba(255, 245, 238, 0.9)',
    glassOverlay: 'rgba(255, 251, 248, 0.95)',

    // Welcome Screen Colors
    welcome: {
        // Button colors - Purple gradient
        buttonPurpleStart: '#A78BFA', // Light purple
        buttonPurpleEnd: '#7C3AED',   // Deeper purple
        // Text colors
        textDark: '#1F2937',          // Dark gray for titles
        textLabel: '#4B5563',         // Medium-dark gray for labels
        textPlaceholder: '#9CA3AF',   // Light gray for placeholder
        // Border colors
        borderInput: '#E5E7EB',       // Light gray border
    },

    // Pronunciation Feedback Colors
    pronunciation: {
        darkRed: '#991B1B',      // 0-25%
        lightRed: '#EF4444',     // 25-50%
        darkYellow: '#D97706',   // 50-70%
        yellowGreen: '#84CC16',  // 70-85%
        green: '#22C55E',        // >85%
    },
};