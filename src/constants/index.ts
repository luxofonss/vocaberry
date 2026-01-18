/**
 * Application Constants
 * Centralized configuration values to avoid hard-coding
 */



// ============================================
// LANGUAGES
// ============================================
export interface Language {
     code: string;
     name: string;
     flag: string;
}

export const LANGUAGES: Language[] = [
     { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
     { code: 'zh', name: '中文 (Chinese)', flag: '🇨🇳' },
     { code: 'es', name: 'Español (Spanish)', flag: '🇪🇸' },
     { code: 'fr', name: 'Français (French)', flag: '🇫🇷' },
     { code: 'de', name: 'Deutsch (German)', flag: '🇩🇪' },
     { code: 'ja', name: '日本語 (Japanese)', flag: '🇯🇵' },
     { code: 'ko', name: '한국어 (Korean)', flag: '🇰🇷' },
     { code: 'pt', name: 'Português (Portuguese)', flag: '🇵🇹' },
     { code: 'it', name: 'Italiano (Italian)', flag: '🇮🇹' },
     { code: 'ru', name: 'Русский (Russian)', flag: '🇷🇺' },
     { code: 'ar', name: 'العربية (Arabic)', flag: '🇸🇦' },
     { code: 'th', name: 'ไทย (Thai)', flag: '🇹🇭' },
     { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
     { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
];

// ============================================
// PARTS OF SPEECH
// ============================================
export const PARTS_OF_SPEECH = [
     'noun',
     'verb',
     'adjective',
     'adverb',
     'pronoun',
     'preposition',
     'conjunction',
     'interjection',
] as const;

export type PartOfSpeech = typeof PARTS_OF_SPEECH[number];

// ============================================
// PRACTICE SETTINGS
// ============================================
export const PRACTICE_CONFIG = {
     questionCountOptions: [5, 10, 20] as const,
     defaultQuestionCount: 5,
     maxExamples: 3,
     pollingIntervalMs: 2000,
     pollingTimeoutMs: 30000,
} as const;

// ============================================
// UI LIMITS
// ============================================
export const UI_LIMITS = {
     maxSearchResults: 50,
     maxMeaningsPreview: 3,
     maxExamples: 3,
     topicExpandLimit: 6,
     imageQuality: 0.7,
     imageAspectRatio: {
          square: [1, 1] as [number, number],
          wide: [16, 9] as [number, number],
          standard: [4, 3] as [number, number],
     },
} as const;

// ============================================
// ANIMATION DURATIONS
// ============================================
export const ANIMATION = {
     fast: 100,
     normal: 250,
     slow: 300,
     pulse: 600,
     spring: {
          tension: 60,
          friction: 12,
     },
} as const;

// ============================================
// SWIPE THRESHOLDS
// ============================================
export const SWIPE_THRESHOLD = 100;

// ============================================
// PRACTICE SCREEN TEXTS
// ============================================
export const PRACTICE_TEXTS = {
     title: 'Practice Time 🎯',
     subtitle: 'Review your vocabulary to keep it fresh.',
     howManyWords: 'How many words?',
     preparing: 'Preparing...',
     startNow: 'Start Now',
     lastPractice: 'Last practice:',
     bestStreak: '🏆 Best streak:',
     dayStreak: '🔥 Day Streak',
     sessions: '📊 Sessions',
     words: '📚 Words',
     reviewResults: 'Review Results',
     yourPerformance: 'Your Performance',
     correct: 'Correct',
     incorrect: 'Incorrect',
     skipped: 'Skipped',
     done: 'Done',
     practiceComplete: 'Practice Complete!',
     scoreText: 'You scored {score} out of {total}',
     reviewResultsBtn: 'Review Results',
     close: 'Close',
     step: 'Step {current} / {total}',
     showHint: 'Show Hint',
     definition: 'Definition',
     whatIsThisWord: 'What is this word?',
     type: '⌨️ Type',
     speak: '🎙️ Speak',
     listening: 'Listening...',
     thinking: 'Thinking...',
     tapToAnswer: 'Tap to Answer',
     showAnswer: 'I Forgot',
     submit: 'Submit',
     splendid: 'Splendid!',
     notQuite: 'Not quite',
     correctWordIs: 'The correct word is:',
     finishTest: 'Finish Test',
     continue: 'Continue →',
     noWordsYet: 'No words yet',
     addWordsFirst: 'Add some words to your inventory first!',
} as const;

// ============================================
// REVIEW SCREEN TEXTS
// ============================================
export const REVIEW_TEXTS = {
     loading: 'Loading...',
     practice: 'Practice',
     noWordsToReview: 'No words to review!',
     addWordsToStart: 'Add some words to start practicing',
     goBack: 'Go Back',
     amazing: 'Amazing!',
     reviewedAllWords: "You've reviewed all {count} words",
     continueBtn: 'Continue',
     whatIsThis: 'What is this?',
     tapToReveal: 'Tap to reveal',
     forgot: 'Forgot',
     gotIt: 'Got it!',
     noDefinition: 'No definition available',
} as const;

// ============================================
// TIME FORMAT
// ============================================
export const TIME_FORMAT = {
     justNow: 'Just now',
     minutesAgo: '{count}m ago',
     hoursAgo: '{count}h ago',
     daysAgo: '{count}d ago',
     never: 'Never',
} as const;

// ============================================
// NOTIFICATION MESSAGES
// ============================================
export interface NotificationMessage {
     emoji: string;
     title: string;
     messageTemplate: string;
}

export const NOTIFICATION_MESSAGES: Record<string, NotificationMessage> = {
     recent: {
          emoji: '⚡',
          title: 'Keep the momentum!',
          messageTemplate: '{count} word{plural} are waiting for you!',
     },
     halfHour: {
          emoji: '🎯',
          title: 'Time to level up!',
          messageTemplate: 'Your vocabulary needs attention - {count} word{plural} ready to practice!',
     },
     oneHour: {
          emoji: '🔥',
          title: "Don't lose your streak!",
          messageTemplate: "It's been a while! {count} word{plural} are calling your name!",
     },
     twoHours: {
          emoji: '💪',
          title: 'Come back, champion!',
          messageTemplate: 'Your words miss you! {count} word{plural} need your practice!',
     },
     sixHours: {
          emoji: '🌟',
          title: 'Ready for a comeback?',
          messageTemplate: "It's been hours! {count} word{plural} are ready to be mastered!",
     },
     dayPlus: {
          emoji: '🚀',
          title: "Let's get back on track!",
          messageTemplate: 'Time to refresh your memory! {count} word{plural} need your attention!',
     },
};

// ============================================
// ALERT MESSAGES (i18n ready)
// ============================================
export const MESSAGES = {
     errors: {
          permissionDenied: 'Permission Denied',
          cameraPermission: 'Sorry, we need camera permissions to make this work!',
          galleryPermission: 'We need access to your photos to add images.',
          couldNotOpenCamera: 'Could not open camera.',
          couldNotOpenGallery: 'Could not open gallery.',
          translationFailed: 'Translation failed. Please try again.',
          lookupFailed: 'Could not look up word. Please try again.',
          saveFailed: 'Could not save. Please try again.',
          networkError: 'Please check your network connection.',
          wordNotFound: 'Word not found or has no meaning. Please check spelling.',
     },
     success: {
          wordSaved: 'Word added to your library.',
          meaningAdded: 'Meaning added successfully.',
     },
     prompts: {
          addImage: 'Add Image',
          changeImage: 'Change Image',
          imageSourceTitle: 'How would you like to add an image?',
          searchUnsplash: '🔍 Search on Unsplash',
          takePhoto: '📸 Take Photo',
          chooseFromLibrary: '🖼️ Library',
          cancel: 'Cancel',
          delete: 'Delete',
          confirm: 'Confirm',
          deleteWordTitle: 'Delete Word',
          deleteWordMessage: 'Are you sure you want to delete "{word}"?',
          doneConfirmTitle: 'Confirm',
          doneConfirmMessage: 'Have you learned and remembered this word?',
          keepLearning: 'Keep Learning',
          remembered: 'Remembered',
     },
     placeholders: {
          typeWord: 'Type word...',
          searchVocabulary: 'Search vocabulary...',
          enterDefinition: 'Enter definition...',
          enterExample: 'Enter example sentence...',
          useInSentence: 'Use it in a sentence...',
          searchOrCreateTag: 'Search or Create Tag...',
          enterName: 'Enter your name',
     },
     labels: {
          newWord: 'New Word',
          addToVocabulary: 'Add to Vocabulary',
          topics: 'Topics',
          manageTags: '+ Manage Tags',
          myExamples: 'My Examples',
          addLine: '+ Add line',
          noTopicsSelected: 'No topics selected',
          uncategorized: 'Uncategorized',
     },
} as const;

// ============================================
// DEFAULT VALUES
// ============================================
export const DEFAULTS = {
     topic: 'Uncategorized',
     phonetic: '/.../',
     avatarInitial: 'A',
} as const;

// ============================================
// WORD PREVIEW MODAL TEXTS
// ============================================
export const WORD_PREVIEW_TEXTS = {
     thinking: 'Thinking...',
     cancel: 'Cancel',
     addToLibrary: 'Add to Library',
     viewFullDetails: 'View Full Details →',
     moreDefinitions: '+ {count} more meanings...',
} as const;

// ============================================
// IMAGE VIEWER TEXTS
// ============================================
export const IMAGE_VIEWER_TEXTS = {
     changeImage: 'Thay đổi ảnh',
     howToUpdate: 'Bạn muốn cập nhật ảnh bằng cách nào?',
     searchUnsplash: '🔍 Tìm trên Unsplash',
     takePhoto: '📸 Chụp ảnh',
     library: '🖼️ Thư viện',
     cancel: 'Hủy',
     cameraPermission: 'Cần quyền camera để chụp ảnh.',
     notification: 'Thông báo',
     error: 'Lỗi',
     cannotTakePhoto: 'Không thể chụp ảnh.',
     cannotOpenLibrary: 'Không thể mở thư viện ảnh.',
} as const;

// ============================================
// POLLING CONFIG
// ============================================
export const POLLING_CONFIG = {
     intervalMs: 2000,
     timeoutMs: 30000,
} as const;
