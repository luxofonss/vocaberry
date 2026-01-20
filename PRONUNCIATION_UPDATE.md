# Big Update - Pronunciation API Response

## Tóm tắt thay đổi

Đã cập nhật toàn bộ hệ thống pronunciation feedback để sử dụng API response mới với thông tin chi tiết hơn.

## API Response Format Mới

```json
{
  "meta": {
    "code": 200000,
    "message": "OK",
    "requestId": "..."
  },
  "data": {
    "recognizedText": "Hello, What can I get for you today?",
    "accuracyScore": 87.0,
    "fluencyScore": 100.0,
    "completenessScore": 88.0,
    "pronScore": 89.8,
    "words": [
      {
        "word": "Hello",
        "accuracyScore": 11.0,
        "errorType": "Mispronunciation",
        "syllables": [
          {
            "syllable": "hə",
            "accuracyScore": 4.0,
            "phonemes": [
              {
                "phoneme": "h",
                "accuracyScore": 7.0
              }
            ]
          }
        ]
      }
    ]
  }
}
```

## Files đã cập nhật

### 1. **src/services/AiService.ts**
- ✅ Cập nhật type definition cho `checkPronunciationAccuracy`
- ✅ Hỗ trợ cả new format và legacy fields (backward compatible)
- ✅ Thêm các fields: `recognizedText`, `accuracyScore`, `fluencyScore`, `completenessScore`, `pronScore`, `words[]`

### 2. **src/components/PronunciationDetailView.tsx** (MỚI)
- ✅ Component mới để hiển thị chi tiết pronunciation analysis
- ✅ Hỗ trợ 2 modes: `compact` (inline) và `full` (modal)
- ✅ Hiển thị:
  - 4 scores: Accuracy, Fluency, Completeness, Overall
  - Word-level analysis với error types
  - Syllable breakdown với scores
  - Phoneme-level details với scores
- ✅ Color-coded feedback dựa trên accuracy scores

### 3. **src/components/PronunciationFeedbackText.tsx**
- ✅ Cập nhật để hỗ trợ cả 2 formats:
  - Legacy: string-based feedback ('1' và '0')
  - New: word-based API response
- ✅ Tự động convert new format sang legacy string để hiển thị màu
- ✅ Giữ nguyên logic hiển thị màu hiện tại (green/red text)

### 4. **src/screens/SentencePracticeScreen.tsx**
- ✅ Cập nhật state để lưu full pronunciation data
- ✅ Sử dụng `PronunciationDetailView` component (compact mode)
- ✅ Hiển thị chi tiết ngay trên màn hình:
  - 4 score cards
  - Word analysis với syllables và phonemes
  - Button "Listen to my recording"
- ✅ Cập nhật `analyzeSpeech` để xử lý new API format

### 5. **src/screens/ConversationDetailScreen.tsx**
- ✅ Cập nhật state để lưu full pronunciation data
- ✅ Giữ nguyên hiển thị màu trong message bubbles
- ✅ Thêm button "ℹ️" (info) bên cạnh mic button
- ✅ Khi click button info → mở modal với `PronunciationDetailView` (full mode)
- ✅ Modal hiển thị toàn bộ chi tiết pronunciation analysis

### 6. **src/screens/PracticeScreen.tsx**
- ✅ Cập nhật state để lưu full pronunciation data
- ✅ Cập nhật `checkAnswer` để xử lý new API format
- ✅ Lưu `pronunciationData` vào quiz results
- ✅ Trong review screen:
  - Hiển thị rounded accuracy score
  - Thêm button "ℹ️" khi có audio data
  - Click button → mở modal với chi tiết đầy đủ
- ✅ Thêm Modal với `PronunciationDetailView` component

## Cách hoạt động

### SentencePracticeScreen & PracticeScreen
- Hiển thị chi tiết **trực tiếp trên màn hình** (compact mode)
- Người dùng thấy ngay:
  - 4 scores
  - Word-level analysis
  - Syllable breakdown
  - Phoneme details

### ConversationDetailScreen
- Chỉ hiển thị **màu sắc** trong message bubble
- Có button **ℹ️** nhỏ để xem chi tiết
- Click button → mở **modal** với full analysis
- Giữ UI gọn gàng vì text nằm trong message

## Backward Compatibility

- ✅ API type definition có legacy fields (optional)
- ✅ `PronunciationFeedbackText` tự động convert format
- ✅ Nếu API trả về old format, vẫn hoạt động bình thường

## Testing Checklist

- [ ] Test SentencePracticeScreen với new API
- [ ] Test PracticeScreen với new API  
- [ ] Test ConversationDetailScreen với new API
- [ ] Test button "View Details" trong review screens
- [ ] Test modal pronunciation details
- [ ] Verify color feedback vẫn hoạt động đúng
- [ ] Test với cả correct và incorrect pronunciations
- [ ] Test với different error types (Mispronunciation, Omission, etc.)
