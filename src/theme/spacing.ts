// Spacing system
export const spacing = {
     none: 0,
     xxs: 2,
     xs: 4,
     sm: 8,
     md: 12,
     lg: 16,
     xl: 20,
     xxl: 24,
     xxxl: 32,
     huge: 40,
     massive: 60,

     // Puffy padding for clay effect
     puffySm: 14,
     puffyMd: 18,
     puffyLg: 22,
     puffyXl: 28,

     // Layout specific
     screenPadding: 20,
     cardPadding: 20,  // Increased for puffy effect
     itemGap: 12,
     rowGap: 14,
};

// Border radius per rules.md
export const borderRadius = {
     none: 0,
     // Standard scale
     xs: 10,
     sm: 14,
     md: 18,
     lg: 22,
     xl: 26,
     xxl: 30,
     xxxl: 34,
     
     // Component-specific radii per rules.md
     pill: 100, // Pills/Tags: 100px (fully rounded) per rules.md
     round: 9999, // Circular
     
     // Buttons per rules.md: 24-32px (very rounded)
     button: 28, // Default button radius
     buttonMin: 24,
     buttonMax: 32,
     
     // Cards per rules.md: 20-24px (rounded)
     card: 24, // Default card radius
     cardMin: 20,
     cardMax: 24,
     
     // Modals per rules.md: 24-32px (top corners) or 24px (all)
     modal: 24, // Default modal radius
     modalTop: 32, // Top corners only
     
     // Inputs per rules.md: 16-20px
     input: 18, // Default input radius
     inputMin: 16,
     inputMax: 20,
     
     // Icons per rules.md: 12-16px
     icon: 14, // Default icon radius
     iconMin: 12,
     iconMax: 16,
     
     // Images per rules.md: 50% (circular)
     image: 9999, // Circular
     
     // Legacy/clay-specific radii (kept for compatibility)
     clayCard: 24,
     clayButton: 28, // Updated from 50 to 28-32px range
     clayInput: 18, // Updated from 20 to 16-20px range
     clayBadge: 100, // Updated to match pill
     clayIcon: 14, // Updated from 16 to 12-16px range
};
