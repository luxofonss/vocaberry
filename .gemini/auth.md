# 🔐 THIẾT KẾ AUTHENTICATION FLOW - PRODUCTION READY
**Java Backend + React Native App**

---

## 📊 KIẾN TRÚC TỔNG QUAN

```
┌─────────────────┐
│  React Native   │
│   (Frontend)    │
└────────┬────────┘
         │
         │ HTTPS/REST API
         │
┌────────▼────────┐      ┌──────────────┐
│  Java Backend   │◄─────┤   Firebase   │
│  (Spring Boot)  │      │   (Optional) │
└────────┬────────┘      └──────────────┘
         │
         │
┌────────▼────────┐
│   PostgreSQL    │
│   (Database)    │
└─────────────────┘
```

---

## 🗂️ DATABASE SCHEMA

### 1. Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    email_verified BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255),
    
    -- OAuth IDs
    google_id VARCHAR(255) UNIQUE,
    apple_id VARCHAR(255) UNIQUE,
    
    -- User info
    full_name VARCHAR(255),
    avatar_url TEXT,
    
    -- Account status
    is_guest BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT email_or_oauth CHECK (
        email IS NOT NULL OR 
        google_id IS NOT NULL OR 
        apple_id IS NOT NULL
    )
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_apple_id ON users(apple_id);
```

### 2. Refresh Tokens Table
```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    device_info JSONB,
    ip_address VARCHAR(45),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    revoked_at TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
```

### 3. User Progress Table (Guest Data)
```sql
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_data JSONB,
    score INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
```

### 4. Email Verification Tokens
```sql
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_verification_user_id ON email_verification_tokens(user_id);
```

---

## 🔄 FLOW DIAGRAMS

### Flow 1: First Time User (Guest)
```
User opens app
     │
     ├─► Check AsyncStorage for guestId
     │   
     ├─► NOT FOUND
     │   └─► Generate UUID
     │       └─► POST /api/auth/guest
     │           └─► Backend creates guest user
     │               └─► Return { userId, accessToken }
     │                   └─► Save to AsyncStorage
     │
     └─► FOUND
         └─► Use existing guestId
         
User can now:
 - Do lessons
 - Earn points
 - See progress
 
(All stored locally + synced to guest account)
```

### Flow 2: Google Login
```
User taps "Continue with Google"
     │
     ├─► @react-native-google-signin
     │   └─► Google OAuth popup
     │       └─► User authorizes
     │           └─► Get idToken
     │
     ├─► POST /api/auth/google
     │   {
     │     idToken: "...",
     │     guestId: "..." (if exists)
     │   }
     │
     ├─► BACKEND FLOW
     │   ├─► Verify idToken with Google
     │   ├─► Extract: googleId, email, name
     │   │
     │   ├─► Check if google_id exists
     │   │   ├─► YES → Login existing user
     │   │   └─► NO → Check if email exists
     │   │       ├─► YES → Link Google to existing account
     │   │       └─► NO → Create new user
     │   │
     │   ├─► If guestId provided:
     │   │   └─► Merge guest progress to user
     │   │       └─► Delete guest account
     │   │
     │   └─► Return:
     │       {
     │         accessToken,
     │         refreshToken,
     │         user: { id, email, name, ... }
     │       }
     │
     └─► FE: Save tokens to SecureStore
         └─► Navigate to main app
```

### Flow 3: Apple Login
```
User taps "Continue with Apple"
     │
     ├─► @invertase/react-native-apple-authentication
     │   └─► Apple Sign In popup
     │       └─► User authorizes
     │           └─► Get identityToken + user (sub)
     │
     ├─► POST /api/auth/apple
     │   {
     │     identityToken: "...",
     │     appleUserId: "...",
     │     guestId: "..." (if exists)
     │   }
     │
     ├─► BACKEND FLOW
     │   ├─► Verify identityToken (JWT)
     │   ├─► Decode: sub (Apple ID), email (first time only!)
     │   │
     │   ├─► Check if apple_id exists
     │   │   ├─► YES → Login
     │   │   └─► NO → Create new user
     │   │       └─► SAVE EMAIL NOW (won't get it again!)
     │   │
     │   ├─► If guestId provided:
     │   │   └─► Merge progress
     │   │
     │   └─► Return tokens + user
     │
     └─► FE: Save & navigate
```

### Flow 4: Email/Password Signup
```
User taps "Continue with Email"
     │
     ├─► Show form:
     │   - Email
     │   - Password (min 8 chars)
     │   - Confirm Password
     │
     ├─► FE Validation
     │   ├─► Email format
     │   ├─► Password strength
     │   └─► Passwords match
     │
     ├─► POST /api/auth/email/signup
     │   {
     │     email,
     │     password,
     │     guestId (if exists)
     │   }
     │
     ├─► BACKEND FLOW
     │   ├─► Validate email format
     │   ├─► Check if email exists
     │   │   └─► YES → Return error
     │   │
     │   ├─► Hash password (BCrypt, rounds=12)
     │   ├─► Create user
     │   ├─► Generate verification token
     │   ├─► Send verification email (async)
     │   │
     │   ├─► If guestId:
     │   │   └─► Merge progress
     │   │
     │   └─► Return tokens (allow login before verify)
     │
     └─► FE: 
         ├─► Save tokens
         ├─► Show: "Check email to verify"
         └─► Navigate to app
```

### Flow 5: Email/Password Login
```
User taps "Log in"
     │
     ├─► Show form:
     │   - Email
     │   - Password
     │
     ├─► POST /api/auth/email/login
     │   { email, password }
     │
     ├─► BACKEND FLOW
     │   ├─► Find user by email
     │   │   └─► NOT FOUND → Error
     │   │
     │   ├─► Verify password
     │   │   └─► INVALID → Error (track attempts)
     │   │
     │   ├─► Check if account active
     │   │   └─► BANNED → Error
     │   │
     │   ├─► Generate tokens
     │   └─► Update last_login_at
     │
     └─► FE: Save & navigate
```

---

## 🔧 BACKEND IMPLEMENTATION (JAVA)

### 1. AuthController.java
```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/guest")
    public ResponseEntity<AuthResponse> createGuest() {
        AuthResponse response = authService.createGuestUser();
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(
        @Valid @RequestBody GoogleLoginRequest request
    ) {
        AuthResponse response = authService.authenticateWithGoogle(
            request.getIdToken(), 
            request.getGuestId()
        );
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/apple")
    public ResponseEntity<AuthResponse> appleLogin(
        @Valid @RequestBody AppleLoginRequest request
    ) {
        AuthResponse response = authService.authenticateWithApple(
            request.getIdentityToken(),
            request.getAppleUserId(),
            request.getGuestId()
        );
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/email/signup")
    public ResponseEntity<AuthResponse> emailSignup(
        @Valid @RequestBody EmailSignupRequest request
    ) {
        AuthResponse response = authService.signupWithEmail(
            request.getEmail(),
            request.getPassword(),
            request.getGuestId()
        );
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/email/login")
    public ResponseEntity<AuthResponse> emailLogin(
        @Valid @RequestBody EmailLoginRequest request
    ) {
        AuthResponse response = authService.loginWithEmail(
            request.getEmail(),
            request.getPassword()
        );
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refreshToken(
        @Valid @RequestBody RefreshTokenRequest request
    ) {
        TokenResponse response = authService.refreshAccessToken(
            request.getRefreshToken()
        );
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> logout(
        @RequestHeader("Authorization") String token
    ) {
        authService.logout(token);
        return ResponseEntity.noContent().build();
    }
}
```



---

## 📱 REACT NATIVE IMPLEMENTATION

### 1. auth.service.ts
```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import appleAuth from '@invertase/react-native-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const API_BASE = 'https://api.yourapp.com';

class AuthService {
  
  async initGuestSession(): Promise<void> {
    const guestId = await AsyncStorage.getItem('guestId');
    
    if (!guestId) {
      const response = await fetch(`${API_BASE}/api/auth/guest`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      await AsyncStorage.setItem('guestId', data.user.id);
      await SecureStore.setItemAsync('accessToken', data.accessToken);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    }
  }
  
  async loginWithGoogle(): Promise<void> {
    try {
      // 1. Configure Google Sign In
      await GoogleSignin.hasPlayServices();
      
      // 2. Sign in
      const { idToken } = await GoogleSignin.signIn();
      
      // 3. Get guest ID if exists
      const guestId = await AsyncStorage.getItem('guestId');
      
      // 4. Send to backend
      const response = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, guestId })
      });
      
      if (!response.ok) {
        throw new Error('Google login failed');
      }
      
      const data = await response.json();
      
      // 5. Save tokens
      await this.saveTokens(data);
      
      // 6. Clean up guest data
      await AsyncStorage.removeItem('guestId');
      
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }
  
  async loginWithApple(): Promise<void> {
    try {
      // 1. Perform Apple Sign In
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });
      
      const { identityToken, user } = appleAuthRequestResponse;
      
      if (!identityToken) {
        throw new Error('No identity token received');
      }
      
      // 2. Get guest ID
      const guestId = await AsyncStorage.getItem('guestId');
      
      // 3. Send to backend
      const response = await fetch(`${API_BASE}/api/auth/apple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identityToken, 
          appleUserId: user,
          guestId 
        })
      });
      
      if (!response.ok) {
        throw new Error('Apple login failed');
      }
      
      const data = await response.json();
      
      // 4. Save tokens
      await this.saveTokens(data);
      
      // 5. Clean up
      await AsyncStorage.removeItem('guestId');
      
    } catch (error) {
      console.error('Apple login error:', error);
      throw error;
    }
  }
  
  async signupWithEmail(email: string, password: string): Promise<void> {
    const guestId = await AsyncStorage.getItem('guestId');
    
    const response = await fetch(`${API_BASE}/api/auth/email/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, guestId })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Signup failed');
    }
    
    const data = await response.json();
    await this.saveTokens(data);
    await AsyncStorage.removeItem('guestId');
  }
  
  async loginWithEmail(email: string, password: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/auth/email/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      throw new Error('Invalid credentials');
    }
    
    const data = await response.json();
    await this.saveTokens(data);
  }
  
  async refreshAccessToken(): Promise<string> {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token');
    }
    
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    const data = await response.json();
    
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    
    return data.accessToken;
  }
  
  async logout(): Promise<void> {
    const accessToken = await SecureStore.getItemAsync('accessToken');
    
    if (accessToken) {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
    }
    
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await AsyncStorage.removeItem('guestId');
  }
  
  private async saveTokens(data: any): Promise<void> {
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
  }
}

export default new AuthService();
```

### 2. LoginScreen.tsx
```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import authService from './auth.service';

export const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await authService.loginWithGoogle();
      // Navigate to main app
    } catch (error) {
      console.error(error);
      // Show error
    } finally {
      setLoading(false);
    }
  };
  
  const handleAppleLogin = async () => {
    setLoading(true);
    try {
      await authService.loginWithApple();
      // Navigate
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
```

---

## 🔒 SECURITY CHECKLIST

### ✅ Backend Security
- [ ] Rate limiting on all auth endpoints (max 5 attempts/minute)
- [ ] HTTPS only
- [ ] CORS properly configured
- [ ] JWT secret stored in environment variables
- [ ] Password hashing with BCrypt (min rounds: 12)
- [ ] SQL injection prevention (use JPA/Hibernate)
- [ ] XSS protection headers
- [ ] CSRF tokens for web interface
- [ ] Refresh token rotation
- [ ] Device fingerprinting for suspicious login detection

### ✅ Frontend Security
- [ ] Tokens stored in SecureStore/Keychain (NOT AsyncStorage)
- [ ] No sensitive data in logs
- [ ] Certificate pinning for API calls
- [ ] Jailbreak/Root detection
- [ ] Biometric authentication option
- [ ] Auto-logout after inactivity

### ✅ Data Privacy
- [ ] GDPR compliance (right to delete)
- [ ] Privacy policy displayed during signup
- [ ] Email opt-in for marketing
- [ ] Data encryption at rest
- [ ] Audit logging for sensitive operations

---

## 🧪 TESTING SCENARIOS

### Test Case 1: Guest to Authenticated User
1. User opens app → guest session created
2. User completes 5 lessons
3. User taps "Save progress"
4. User logs in with Google
5. ✅ All 5 lessons should be preserved

### Test Case 2: Account Linking
1. User signs up with email
2. Later tries to login with Google (same email)
3. ✅ Should link Google to existing account

### Test Case 3: Token Refresh
1. Access token expires
2. App makes API call
3. Gets 401 Unauthorized
4. ✅ Should auto-refresh using refresh token
5. ✅ Retry original request

### Test Case 4: Apple Email Privacy
1. User hides email with Apple
2. Logs in first time
3. ✅ Backend saves Apple-provided email
4. User logs in again
5. ✅ Email is null in response
6. ✅ But user record still has original email

---

## 📊 MONITORING & ANALYTICS

### Key Metrics to Track
- Guest → Authenticated conversion rate
- Login method distribution (Google/Apple/Email)
- Failed login attempts
- Token refresh failures
- Average time to first login

### Error Tracking
```java
@Slf4j
public class AuthService {
    
    public AuthResponse loginWithEmail(String email, String password) {
        try {
            // ... login logic ...
        } catch (InvalidCredentialsException e) {
            log.warn("Failed login attempt for email: {}", email);
            // Send to Sentry/DataDog
            throw e;
        }
    }
}
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Before Production
- [ ] Update JWT secret to strong random value
- [ ] Configure Google OAuth client ID (iOS + Android)
- [ ] Set up Apple Developer account + Sign In capability
- [ ] Test on real devices (iOS + Android)
- [ ] Set up monitoring (Sentry, DataDog)
- [ ] Configure email service (SendGrid, AWS SES)
- [ ] Set up database backups
- [ ] Load testing for auth endpoints
- [ ] Security audit

### iOS Specific
- [ ] Add Sign In with Apple capability in Xcode
- [ ] Configure associated domains
- [ ] Test on physical device (not simulator)

### Android Specific
- [ ] Configure Google Sign In SHA-1 fingerprint
- [ ] Test Google Play Services availability
- [ ] Handle devices without Play Services

---

## 📚 RESOURCES

### Dependencies (React Native)
```json
{
  "@react-native-google-signin/google-signin": "^10.0.0",
  "@invertase/react-native-apple-authentication": "^2.2.0",
  "@react-native-async-storage/async-storage": "^1.19.0",
  "expo-secure-store": "^12.3.0"
}
```

### Dependencies (Java Backend)
```xml
<dependencies>
    <!-- Spring Boot Starter -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <!-- Spring Security -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    
    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt</artifactId>
        <version>0.9.1</version>
    </dependency>
    
    <!-- Google API Client -->
    <dependency>
        <groupId>com.google.api-client</groupId>
        <artifactId>google-api-client</artifactId>
        <version>2.0.0</version>
    </dependency>
    
    <!-- PostgreSQL -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
    </dependency>
    
    <!-- JPA -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
</dependencies>
```

---

## 🎯 BEST PRACTICES SUMMARY

1. **Always merge guest data** - Never lose user progress
2. **Token security** - Use SecureStore, not AsyncStorage
3. **Graceful degradation** - App works offline with cached data
4. **Clear error messages** - Help users understand what went wrong
5. **Rate limiting** - Prevent brute force attacks
6. **Audit logging** - Track all auth events
7. **Email verification** - Send async, don't block login
8. **Device management** - Let users see/revoke active sessions
9. **Biometrics** - Offer Face ID/Touch ID after first login
10. **Testing** - Test all flows on real devices before launch

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-31  
**Author:** Claude (Anthropic)

DTO:
@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private UserDto user;
}


package com.me.vocaberry.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.UUID;

@Data
public class AppleLoginRequest {
    @NotEmpty
    private String identityToken;
    @NotEmpty
    private String appleUserId;
    private UUID guestId;
}


package com.me.vocaberry.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class EmailLoginRequest {
    @NotEmpty
    @Email
    private String email;
    @NotEmpty
    private String password;
}

package com.me.vocaberry.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.UUID;

@Data
public class EmailSignupRequest {
    @NotEmpty
    @Email
    private String email;
    @NotEmpty
    private String password;
    private UUID guestId;
}


package com.me.vocaberry.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.UUID;

@Data
public class GoogleLoginRequest {
    @NotEmpty
    private String idToken;
    private UUID guestId;
}


package com.me.vocaberry.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class RefreshTokenRequest {
    @NotEmpty
    private String refreshToken;
}

package com.me.vocaberry.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TokenResponse {
    private String accessToken;
    private String refreshToken;
}



package com.me.vocaberry.dto;

import com.me.vocaberry.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private UUID id;
    private String email;
    private String fullName;
    private String avatarUrl;
    private Boolean isGuest;

    public static UserDto from(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .isGuest(user.getIsGuest())
                .build();
    }
}
