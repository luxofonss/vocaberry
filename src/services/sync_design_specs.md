# Data Synchronization Design for Verberry

## 1. Overview
This document outlines the strategy for synchronizing data between the local device (offline-first) and the cloud server. This is critical for:
1.  **Guest-to-User Migration**: Merging data accumulated while using the app as a Guest into a newly logged-in account.
2.  **Multi-device Sync**: Ensuring progress is consistent across devices.
3.  **Backup**: Persisting user data safely in the cloud.

## 2. Synchronization Strategy
We will adopt a **Hybrid Strategy**:
1.  **Initial Merge (On Login)**: Push all local data to the server to merge with existing account data.
2.  **Real-time sync (Write-through)**: Critical actions (adding words, completing practice) trigger an immediate background API call.
3.  **Periodic/Launch Sync**: Fetch the latest state from the server on app launch to ensure the device is up-to-date.

---

## 3. Data Models for Synchronization

### 3.1. User Profile & Settings
This data is singleton per user.
```json
{
  "profile": {
    "displayName": "string",
    "motherLanguage": "string (code)", // e.g., 'vi', 'es'
    "avatarId": "string"
  }
}
```

### 3.2. Learning Progress (Stats)
Global statistics for the user.
```json
{
  "stats": {
    "totalSessions": "number",
    "currentStreak": "number",
    "longestStreak": "number",
    "totalWordsPracticed": "number",
    "totalSentencesPracticed": "number",
    "lastPracticeTime": "number (timestamp)",
    "lastSentencePracticeTime": "number (timestamp)"
  }
}
```

### 3.3. Words (Vocabulary)
Words are the core entity. We sync both the identity of the word and the user's progress/customization.
```json
{
  "words": [
    {
      "id": "string (uuid)",
      "word": "string",
      // Progress Fields
      "viewCount": "number",
      "reviewCount": "number",
      "nextReviewDate": "string (ISO Date)",
      // Customization
      "customImageUrl": "string (url)",
      "isUsingCustomImage": "boolean",
      "userNotes": "string",
      // Timestamps for conflict resolution
      "updatedAt": "string (ISO Date)" 
    }
  ]
}
```
*Note: We sync `id` to map to valid dictionary entries. If it's a custom word not in the global dictionary, the server handles it.*

### 3.4. Sentences
```json
{
  "sentences": [
    {
      "id": "string (uuid)",
      "text": "string",
      "practiceCount": "number",
      "totalScore": "number",
      "lastPracticedAt": "string (ISO Date)"
    }
  ]
}
```

---

## 4. API Specifications

### 4.1. Merge/Push Data (POST `/api/sync/push`)
Called immediately after login (to merge guest data) or periodically.

**Request Body:**
```json
{
  "strategy": "MERGE", // or "OVERWRITE" (rarely used)
  "data": {
    "profile": { ... },
    "stats": { ... },
    "words": [ ... ],
    "sentences": [ ... ],
    "conversations": [ ... ]
  }
}
```

**Server Logic (MERGE strategy):**
*   **Profile**: Update if local fields are non-empty.
*   **Stats**: `max(local.value, server.value)` for streaks/counts.
*   **Words**:
    *   Iterate through input words.
    *   If word exists (by ID or text): Merge stats (e.g., take the latest `nextReviewDate`, add `viewCount`).
    *   If word is new: Insert.
*   **Return**: The fully updated state structure.

**Response:**
```json
{
  "success": true,
  "syncedAt": "timestamp",
  "data": { 
     // Complete unified data to replace local DB
     "words": [...],
     "stats": {...}
  }
}
```

### 4.2. Pull Data (GET `/api/sync/pull`)
Called on App Launch (Splash Screen).

**Response:**
```json
{
  "data": {
    "profile": { ... },
    "words": [ ... ],
    "stats": { ... },
    ...
  }
}
```

---

## 5. Implementation Plan

### 5.1. Update Local Services (`src/services/`)
We need to modify `StorageService` to inject `SyncService` hooks.

**Phase 1: SyncService**
Create `src/services/SyncService.ts`:
*   `mergeLocalDataToServer()`: Reads all data from `DatabaseService`, POSTs to `/api/sync/push`, then overwrites local DB with payload.
*   `pullServerData()`: GETs form `/api/sync/pull`, overwrites local DB.

**Phase 2: Real-time Hooks**
Modify `StorageService.ts` to call API on critical updates:
*   `addWord(word)` -> `DatabaseService.saveWord(word)` -> **`ApiClient.syncWord(word)`** (Fire & Forget)
*   `markAsReviewed(...)` -> Update DB -> **`ApiClient.syncWordProgress(...)`**

### 5.2. Login Flow Update (`LoginScreen.tsx`)
Currently:
```typescript
await signInEmail(email, password);
navigation.replace('Home');
```
Updated:
```typescript
await signInEmail(email, password);
// Show "Syncing..." loading state
await SyncService.mergeLocalDataToServer(); 
navigation.replace('Home');
```

---

## 6. Recommended Immediate Action (Rules for AI)
1.  **Generate `SyncService.ts`** to handle the heavy lifting of gathering local data.
2.  **Generate `ApiClient` methods** for the sync endpoints.
3.  **Update `LoginScreen`** to trigger the merge.
4.  **Update `App.tsx` / `AuthContext`** to trigger Pull on launch if logged in.
