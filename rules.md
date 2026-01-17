Vocaberry Design System Rules
1. Color Palette
Primary Colors

Main Purple: #7C3AED (buttons, highlights, active states)
Light Purple: #A78BFA (secondary elements)
Background Purple: #E9E3F5 (main screens)
Background Beige: #C4B5A6 (modals, overlays)

Accent Colors

Orange: #FF6B35 (streak, fire icon)
Blue: #3B82F6 (sessions icon)
Green: #10B981 (words icon)
Red: #EF4444 (notifications)

Neutral Colors

White: #FFFFFF (cards, inputs)
Light Gray: #F3F4F6 (disabled states)
Medium Gray: #9CA3AF (labels, secondary text)
Dark Gray: #1F2937 (primary text)


2. Typography
Font Family

Primary: System font (San Francisco, Roboto, Segoe UI)
Weight Hierarchy:

Headings: 700-800 (Bold/Extra Bold)
Subheadings: 600 (Semi Bold)
Body: 400-500 (Regular/Medium)
Labels: 500-600 (Medium/Semi Bold)



Font Sizes

H1 (Screen Titles): 36-42px
H2 (Section Headers): 20-24px
Body: 16-18px
Labels: 12-14px (uppercase)
Buttons: 18-20px

Text Styling

Labels: ALL CAPS with letter-spacing: 0.5-1px
Headings: Sentence case
Body: Sentence case
Color contrast ratio: minimum 4.5:1


3. Spacing System
Base Unit: 8px
Scale:

4px (0.5x) - Micro spacing
8px (1x) - Small spacing
16px (2x) - Medium spacing
24px (3x) - Large spacing
32px (4x) - XL spacing
48px (6x) - XXL spacing
64px (8x) - Section spacing

Application:

Component padding: 16-24px
Card padding: 24-32px
Modal padding: 24-32px
Screen margins: 20-24px
Element gaps: 12-16px


4. Border Radius
Rounded Corners Hierarchy

Pills/Tags: 100px (fully rounded)
Buttons: 24-32px (very rounded)
Cards: 20-24px (rounded)
Modals: 24-32px (top corners)
Inputs: 16-20px
Icons: 12-16px
Images: 50% (circular)


5. Shadows & Elevation
Shadow Levels
css/* Level 1 - Cards */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

/* Level 2 - Buttons */
box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);

/* Level 3 - Modals */
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

/* Level 4 - Floating Elements */
box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
Glow Effects

Active buttons: purple glow with 20% opacity
Focus states: 2-3px outline with primary color


6. Buttons
Primary Button

Background: #7C3AED
Text: White
Padding: 16px 32px
Border-radius: 28-32px
Font-size: 18-20px
Font-weight: 600
Shadow: Level 2
Hover: Darken 10%, scale 1.02
Active: Scale 0.98

Secondary Button

Background: White
Border: 2px solid #E5E7EB
Text: #1F2937
Padding: 12px 24px
Border-radius: 20-24px
Hover: Border color to primary

Icon Buttons

Size: 48x48px (minimum)
Border-radius: 50%
Background: White or transparent
Icon size: 24x24px
Hover: Background #F3F4F6


7. Input Fields
Text Inputs

Height: 56-60px
Padding: 16px 20px
Border-radius: 16-20px
Border: 2px solid #E5E7EB
Background: White
Font-size: 16px
Placeholder: #9CA3AF

Focus State

Border: 2px solid #7C3AED
Outline: none
Shadow: 0 0 0 4px rgba(124, 58, 237, 0.1)


8. Cards & Containers
Main Card

Background: White
Border-radius: 24px
Padding: 24-32px
Shadow: Level 1
Margin: 20-24px (screen edges)

Stat Cards (Circular)

Size: 140-160px diameter
Background: White
Border-radius: 50%
Padding: 24px
Shadow: Level 1
Icon on top, number, then label

Modal/Popup

Background: White
Border-radius: 32px (top) or 24px (all)
Padding: 24-32px
Shadow: Level 3
Max-width: 90% screen
Backdrop: rgba(0, 0, 0, 0.4)


9. Icons
Sizes

Small: 16x16px
Medium: 24x24px
Large: 32-40px
Hero: 48-64px

Styling

Stroke width: 2px
Style: Rounded corners
Colors: Match section theme
Spacing: 8-12px from text

Icon Library Style

Outlined/Line icons preferred
Consistent stroke weight
Emoji icons for personality (🍔, ✈️, 💼, ⚽, ❤️)


10. Tags/Pills
Default Tag

Padding: 10px 20px
Border-radius: 100px
Font-size: 14-16px
Font-weight: 600
Icon + text layout
Spacing: 8px between icon and text

Active Tag

Background: #7C3AED
Text: White
Shadow: 0 2px 8px rgba(124, 58, 237, 0.3)

Inactive Tag

Background: White
Text: #1F2937
Border: 2px solid #E5E7EB


11. Navigation
Bottom Navigation

Height: 72-80px
Background: White
Shadow: 0 -2px 12px rgba(0, 0, 0, 0.06)
Items: 3-5 max
Icon size: 28-32px
Label size: 12px
Active color: #7C3AED
Inactive color: #9CA3AF

Floating Action Button (FAB)

Size: 64x64px
Position: Center of nav bar
Background: #7C3AED
Icon: White, 32px
Shadow: Level 4
Border: 4px solid white
z-index: 10


12. Illustrations & Images
Mascot Character

Circular container (white background)
Size: 160-200px diameter
Style: Cute, friendly, cartoon
Shadow: Level 1
Colors: Match brand palette

Preview Image Area

Shape: Circular (dashed border)
Size: 100-120px diameter
Border: 2px dashed #D1D5DB
Icon: #9CA3AF placeholder
Label: "Preview" below


13. Animation & Transitions
Duration

Fast: 150ms (hover states)
Normal: 250ms (buttons, cards)
Slow: 350ms (modals, page transitions)

Easing

Standard: cubic-bezier(0.4, 0.0, 0.2, 1)
Deceleration: cubic-bezier(0.0, 0.0, 0.2, 1)
Acceleration: cubic-bezier(0.4, 0.0, 1, 1)

Common Animations

Buttons: scale transform + shadow
Cards: translateY + shadow
Modals: slide up + fade in
Loading: gentle bounce or pulse