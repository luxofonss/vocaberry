# PronunciationFeedbackText Component

## Overview
A reusable React Native component for displaying text with pronunciation feedback highlighting. This component is used across multiple screens to show pronunciation accuracy results from the AI pronunciation API.

## Features
- ✅ Character-level pronunciation feedback (green = correct, red = incorrect)
- ✅ Optional clickable words for dictionary lookup
- ✅ Clean visual design (no background colors, only text colors)
- ✅ Supports custom styling
- ✅ Handles both feedback and non-feedback modes

## Usage

### Basic Usage (No Feedback)
```tsx
import { PronunciationFeedbackText } from '../components/PronunciationFeedbackText';

<PronunciationFeedbackText
  text="Hello, how are you?"
  style={{ fontSize: 16, color: '#000' }}
/>
```

### With Pronunciation Feedback
```tsx
<PronunciationFeedbackText
  text="Hello, how are you?"
  feedback="111111111111111111" // String of '1' (correct) and '0' (incorrect)
  style={{ fontSize: 16, color: '#000' }}
/>
```

### With Clickable Words (Dictionary Lookup)
```tsx
<PronunciationFeedbackText
  text="Hello, how are you?"
  onWordPress={(word) => {
    console.log('Word clicked:', word);
    // Navigate to dictionary or show definition
  }}
  style={{ fontSize: 16, color: '#000' }}
/>
```

### Full Example (Feedback + Clickable)
```tsx
<PronunciationFeedbackText
  text="Hello, how are you?"
  feedback="111111111111111111"
  onWordPress={handleWordPress}
  style={{ fontSize: 16, color: '#000' }}
  numberOfLines={2}
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `text` | `string` | ✅ Yes | The text to display |
| `feedback` | `string` | ❌ No | String of '1' (correct) and '0' (incorrect) for each character |
| `onWordPress` | `(word: string) => void` | ❌ No | Callback when a word is pressed. If provided, words become clickable |
| `style` | `any` | ❌ No | Custom style for the text container |
| `numberOfLines` | `number` | ❌ No | Maximum number of lines to display |

## Integration with API Response

The component works seamlessly with the `checkPronunciationAccuracy` API response:

```tsx
const response = await AiService.checkPronunciationAccuracy(
  text,
  audioBase64
);

const data = response.data;

<PronunciationFeedbackText
  text={text}
  feedback={data.is_letter_correct_all_words}
  onWordPress={handleWordLookup}
/>
```

## Migration Guide

### From ClickableText
If you're currently using `ClickableText` component, you can easily migrate:

**Before:**
```tsx
<ClickableText
  text={msg.text}
  onWordPress={handleWordPress}
  style={styles.messageText}
  feedback={pronunciations[msg.id]}
/>
```

**After:**
```tsx
<PronunciationFeedbackText
  text={msg.text}
  onWordPress={handleWordPress}
  style={styles.messageText}
  feedback={pronunciations[msg.id]}
/>
```

The API is identical! Just change the import and component name.

## Used In
- `ConversationDetailScreen.tsx` - For conversation practice feedback
- `SentencePracticeScreen.tsx` - For sentence pronunciation practice
- `PracticeScreen.tsx` - For word pronunciation practice

## Notes
- The component automatically normalizes text comparison (case-insensitive, ignores punctuation)
- Feedback string length should match the text length (including spaces and punctuation)
- If feedback is shorter than text, remaining characters will be rendered without highlighting
- Clickable words are extracted by removing punctuation and converting to lowercase
