# API Specification - VocaBerry App

## Base URL
```
Production: https://api.vocaberry.com/v1
Development: http://localhost:3000/api/v1
```

## Authentication
All requests require Bearer token in header:
```
Authorization: Bearer {access_token}
```

---

## 1. Shadowing API

### 1.1 Get Shadowing Lessons (List)
**Endpoint:** `GET /shadowing/lessons`

**Query Parameters:**
- `page` (number, optional, default: 0) - Page number (0-indexed)
- `size` (number, optional, default: 10) - Items per page
- `level` (string, optional) - Filter by level: `beginner`, `intermediate`, `advanced`
- `accent` (string, optional) - Filter by accent: `american`, `british`
- `category` (string, optional) - Filter by category

**Response:**
```json
{
  "meta": {
    "code": 200,
    "message": "Success",
    "pageIndex": 0,
    "pageSize": 10,
    "totalItems": 50,
    "totalPages": 5
  },
  "data": [
    {
      "id": "shadow-1",
      "title": "Daily Morning Routine",
      "description": "Learn common phrases used in morning routines",
      "channel": "English with Emma",
      "duration": "3:45",
      "durationSeconds": 225,
      "level": "beginner",
      "difficulty": "easy",
      "thumbnail": "https://cdn.vocaberry.com/thumbnails/shadow-1.jpg",
      "thumbnailEmoji": "🌅",
      "accent": "american",
      "category": "daily-life",
      "views": 1200000,
      "viewsFormatted": "1.2M",
      "videoUrl": "https://cdn.vocaberry.com/videos/shadow-1.mp4",
      "subtitles": [
        {
          "id": "sub-1",
          "startTime": 0.0,
          "endTime": 3.5,
          "text": "Good morning! It's time to wake up.",
          "translation": "Chào buổi sáng! Đã đến giờ thức dậy rồi."
        }
      ],
      "completed": false,
      "stars": 0,
      "userProgress": {
        "lastPracticedAt": null,
        "completionRate": 0,
        "bestScore": 0
      },
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### 1.2 Get Shadowing Lesson Detail
**Endpoint:** `GET /shadowing/lessons/{lessonId}`

**Path Parameters:**
- `lessonId` (string, required) - Lesson ID

**Response:** Same structure as single item in list above, with full subtitles array


## 2. Conversations API

### 2.1 Get Conversations (List)
**Endpoint:** `GET /conversations`

**Query Parameters:**
- `page` (number, optional, default: 0)
- `size` (number, optional, default: 10)
- `category` (string, optional) - Filter by category: `daily-life`, `travel`, `business`, `health`, `social`
- `difficulty` (string, optional) - Filter by difficulty: `beginner`, `intermediate`, `advanced`

**Response:**
```json
{
  "meta": {
    "code": 200,
    "message": "Success",
    "pageIndex": 0,
    "pageSize": 10,
    "totalItems": 30,
    "totalPages": 3
  },
  "data": [
    {
      "id": "conv-1",
      "title": "Ordering Food at a Restaurant",
      "description": "Practice ordering food and drinks at a restaurant",
      "category": "daily-life",
      "difficulty": "beginner",
      "thumbnail": "https://cdn.vocaberry.com/thumbnails/conv-1.jpg",
      "thumbnailEmoji": "🍽️",
      "messageCount": 8,
      "estimatedDuration": "5:00",
      "messages": [
        {
          "id": "msg-1",
          "speaker": "Waiter",
          "text": "Good evening! Are you ready to order?",
          "audioUrl": "https://cdn.vocaberry.com/audio/conv-1-msg-1.mp3",
          "phonetic": "/ɡʊd ˈiːvnɪŋ ɑːr juː ˈredi tuː ˈɔːrdər/",
          "order": 1
        },
        {
          "id": "msg-2",
          "speaker": "Customer",
          "text": "Yes, I'd like the grilled salmon, please.",
          "audioUrl": "https://cdn.vocaberry.com/audio/conv-1-msg-2.mp3",
          "phonetic": "/jes aɪd laɪk ðə ɡrɪld ˈsæmən pliːz/",
          "order": 2
        }
      ],
      "practiceCount": 0,
      "totalScore": 0,
      "lastPracticedAt": null,
      "createdAt": "2024-01-10T08:00:00Z",
      "updatedAt": "2024-01-10T08:00:00Z"
    }
  ]
}
```

### 2.2 Get Conversation Detail
**Endpoint:** `GET /conversations/{conversationId}`

**Path Parameters:**
- `conversationId` (string, required)

**Response:** Same structure as single item in list above

---

## 3. Sentences API

### 3.1 Get Suggested Sentences
**Endpoint:** `GET /sentences/suggested`

**Query Parameters:**
- `page` (number, optional, default: 0)
- `size` (number, optional, default: 10)
- `level` (string, optional) - Filter by difficulty level
- `excludeUserSentences` (boolean, optional, default: true) - Exclude sentences user already saved

**Response:**
```json
{
  "meta": {
    "code": 200,
    "message": "Success",
    "pageIndex": 0,
    "pageSize": 10,
    "totalItems": 100
  },
  "data": [
    {
      "id": "sent-suggest-1",
      "text": "The quick brown fox jumps over the lazy dog",
      "level": "beginner",
      "category": "practice",
      "phonetic": "/ðə kwɪk braʊn fɒks dʒʌmps ˈəʊvə ðə ˈleɪzi dɒɡ/",
      "audioUrl": "https://cdn.vocaberry.com/audio/sent-suggest-1.mp3",
      "difficulty": "easy",
      "wordCount": 9,
      "isSaved": false
    }
  ]
}
```
