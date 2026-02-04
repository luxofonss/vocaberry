
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { ApiClient } from './ApiClient';
import { Platform } from 'react-native';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
// import appleAuth from '@invertase/react-native-apple-authentication';

const API_BASE = ApiClient.getConfig().baseUrl; // e.g., https://onestudy.id.vn/v1/api

// Interfaces
export interface User {
     id: string;
     email?: string;
     fullName?: string;
     avatarUrl?: string;
     isGuest: boolean;
     googleId?: string;
     appleId?: string;
}

export interface AuthResponse {
     accessToken: string;
     refreshToken: string;
     user: User;
}

class AuthService {
     constructor() {
          try {
               /*
                 GoogleSignin.configure({
                      webClientId: '308177684376-lj9s8bal4rj587lp2a20sgogcjj42q1s.apps.googleusercontent.com', // REQUIRED for backend validation
                      offlineAccess: true,
                 });
               */
          } catch (e) {
               console.warn('GoogleSignin configure failed', e);
          }
     }

     private async getBaseUrl() {
          return API_BASE;
     }

     async initGuestSession(name?: string): Promise<User> {
          const guestId = await AsyncStorage.getItem('guestId');
          const existingToken = await SecureStore.getItemAsync('accessToken');

          if (guestId && existingToken) {
               // We have a session, maybe verify it? For now assume valid or let interceptor handle 401
               // We need to return the user object. Since we don't store the full user object, 
               // we might mock it or fetch it.
               return {
                    id: guestId || '',
                    fullName: name || 'Guest',
                    isGuest: true
               };
          }

          const guestIdSecure = await SecureStore.getItemAsync('userId');
          if (guestIdSecure && existingToken) {
               return {
                    id: guestIdSecure,
                    fullName: name || 'Guest',
                    isGuest: true
               };
          }

          // Call backend to create guest
          try {
               const response = await fetch(`${API_BASE}/auth/guest`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
               });

               if (response.ok) {
                    const data = await response.json();
                    await this.saveTokens(data);
                    if (data.user && data.user.id) {
                         await SecureStore.setItemAsync('userId', data.user.id);
                         await AsyncStorage.setItem('guestId', data.user.id); // For backward compatibility if needed
                    }
                    return data.user;
               } else {
                    // Fallback for offline/dev if backend not ready
                    console.warn('Backend guest auth failed, falling back to local guest');
               }
          } catch (e) {
               console.warn('Network error initializing guest, using local fallback', e);
          }

          // Fallback: Generate local ID
          const newGuestId = guestId || Math.random().toString(36).substring(7);
          await AsyncStorage.setItem('guestId', newGuestId);
          // Fake token for local dev
          await SecureStore.setItemAsync('accessToken', 'local-guest-token');

          return {
               id: newGuestId,
               fullName: name || 'Guest',
               isGuest: true
          };
     }

     async loginWithGoogle(): Promise<User> {
          throw new Error('Google Sign-In is temporarily disabled.');
          /*
            try {
                 try {
                      await GoogleSignin.hasPlayServices();
                 } catch (e: any) {
                      if (e.toString().includes('RNGoogleSignin could not be found') || e.code === 'RNGoogleSignin_NOT_AVAILABLE') {
                           throw new Error('Google Sign-In requires a custom dev client. Please run "npx expo run:android" to build one, as Expo Go does not support native Google Sign-In.');
                      }
                      throw e;
                 }
  
                 const userInfo = await GoogleSignin.signIn();
                 const idToken = userInfo.data?.idToken;
  
                 if (!idToken) throw new Error('No ID token obtained from Google');
  
                 const guestId = await AsyncStorage.getItem('guestId');
                  const baseUrl = await this.getBaseUrl();
   
                  const response = await fetch(`${baseUrl}/auth/google`, {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ idToken, guestId })
                  });
  
                 if (!response.ok) {
                      const error = await response.json();
                      throw new Error(error.message || 'Google login failed');
                 }
  
                 const data = await response.json();
                 await this.saveTokens(data);
                 await AsyncStorage.removeItem('guestId');
  
                 return data.user;
            } catch (error: any) {
                 console.error('Google login error', error);
                 if (error.message && error.message.includes('run:android')) {
                      // Pass through our helpful error
                      throw error;
                 }
                 // Handle standard linking error text if caught at top level
                 if (error.toString().includes('could not be found')) {
                      throw new Error('Google Sign-In native module not found. Use a Dev Build, not Expo Go.');
                 }
                 throw error;
            }
            */
     }

     async loginWithApple(): Promise<User> {
          throw new Error('Apple Sign-In is temporarily disabled.');
          /*
           try {
                const appleAuthRequestResponse = await appleAuth.performRequest({
                     requestedOperation: appleAuth.Operation.LOGIN,
                     requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
                });
 
                const { identityToken, user } = appleAuthRequestResponse;
 
                if (!identityToken) {
                     throw new Error('No identity token received');
                }
 
                const guestId = await AsyncStorage.getItem('guestId');
                 const baseUrl = await this.getBaseUrl();
  
                 const response = await fetch(`${baseUrl}/auth/apple`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                           identityToken,
                           appleUserId: user,
                           guestId
                      })
                 });
 
                if (!response.ok) {
                     const error = await response.json();
                     throw new Error(error.message || 'Apple login failed');
                }
 
                const data = await response.json();
                await this.saveTokens(data);
                await AsyncStorage.removeItem('guestId');
 
                return data.user;
           } catch (error) {
                console.error('Apple login error', error);
                throw error;
           }
           */
     }

     async signupWithEmail(email: string, password: string): Promise<User> {
          const guestId = await AsyncStorage.getItem('guestId');
          const baseUrl = await this.getBaseUrl();

          const response = await fetch(`${baseUrl}/auth/email/signup`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ email, password, guestId })
          });

          if (!response.ok) {
               try {
                    const errorData = await response.json();
                    const message = errorData.meta?.message || errorData.message || 'Signup failed';
                    throw new Error(message);
               } catch (e: any) {
                    if (e.message && !e.message.includes('JSON')) throw e;
                    throw new Error('Signup failed');
               }
          }

          const data = await response.json();
          await this.saveTokens(data);
          await AsyncStorage.removeItem('guestId');
          return data.user;
     }

     async loginWithEmail(email: string, password: string): Promise<User> {
          const baseUrl = await this.getBaseUrl();
          const response = await fetch(`${baseUrl}/auth/email/login`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ email, password })
          });

          if (!response.ok) {
               try {
                    const errorData = await response.json();
                    const message = errorData.meta?.message || errorData.message || 'Login failed';
                    throw new Error(message);
               } catch (e: any) {
                    if (e.message && !e.message.includes('JSON')) throw e;
                    throw new Error('Login failed');
               }
          }

          const data = await response.json();
          await this.saveTokens(data);
          return data.user;
     }

     async logout(): Promise<void> {
          const accessToken = await SecureStore.getItemAsync('accessToken');
          const baseUrl = await this.getBaseUrl();

          if (accessToken) {
               try {
                    await fetch(`${baseUrl}/auth/logout`, {
                         method: 'POST',
                         headers: { 'Authorization': `Bearer ${accessToken}` }
                    });
               } catch (e) {
                    console.warn('Logout API call failed', e);
               }
          }

          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
          await AsyncStorage.removeItem('guestId');
     }

     private async saveTokens(data: any): Promise<void> {
          if (data.accessToken) {
               await SecureStore.setItemAsync('accessToken', data.accessToken);
          }
          if (data.refreshToken) {
               await SecureStore.setItemAsync('refreshToken', data.refreshToken);
          }
          if (data.user && data.user.id) {
               await SecureStore.setItemAsync('userId', data.user.id);
          }
     }

     async getAccessToken(): Promise<string | null> {
          return await SecureStore.getItemAsync('accessToken');
     }
}

export default new AuthService();
