
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AuthService, { User } from '../services/AuthService';
import { StorageService } from '../services/StorageService';

interface AuthContextType {
     user: User | null;
     isLoading: boolean;
     signInGuest: (name: string) => Promise<void>;
     signInEmail: (email: string, pass: string) => Promise<void>;
     signUpEmail: (email: string, pass: string) => Promise<void>;
     signInGoogle: () => Promise<void>;
     signInApple: () => Promise<void>;
     signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
     const [user, setUser] = useState<User | null>(null);
     const [isLoading, setIsLoading] = useState(true);

     useEffect(() => {
          // Check for existing session
          const loadSession = async () => {
               try {
                    // We can't easily get the full user object from just the token without an API call
                    // For now, if we have a guestId or token, we assume logged in.
                    // In a real app, we'd call /api/auth/me using the token.
                    // Here we'll rely on local storage for basic state or just verify token existence.

                    const token = await AuthService.getAccessToken();
                    if (token) {
                         // Ideally fetch user profile here.
                         // For now, mocking "User is logged in" state if token exists
                         // We might know if it's guest based on stored flag?
                         // Actually AuthService.initGuestSession handles the check too.
                         const guestMock = await AuthService.initGuestSession();
                         setUser(guestMock);
                    } else {
                         // If no session, initialize as guest immediately
                         const newGuest = await AuthService.initGuestSession();
                         setUser(newGuest);
                    }
               } catch (e) {
                    console.error('Failed to load auth session', e);
               } finally {
                    setIsLoading(false);
               }
          };
          loadSession();
     }, []);

     const signInGuest = async (name: string) => {
          setIsLoading(true);
          try {
               const user = await AuthService.initGuestSession(name);
               await StorageService.saveUserName(name); // Keep local preference synced
               setUser(user);
          } catch (error) {
               console.error(error);
               throw error;
          } finally {
               setIsLoading(false);
          }
     };

     const signInEmail = async (email: string, pass: string) => {
          setIsLoading(true);
          try {
               const user = await AuthService.loginWithEmail(email, pass);
               setUser(user);
          } catch (error) {
               console.error(error);
               throw error;
          } finally {
               setIsLoading(false);
          }
     };

     const signUpEmail = async (email: string, pass: string) => {
          setIsLoading(true);
          try {
               const user = await AuthService.signupWithEmail(email, pass);
               setUser(user);
          } catch (error) {
               console.error(error);
               throw error;
          } finally {
               setIsLoading(false);
          }
     };

     const signInGoogle = async () => {
          setIsLoading(true);
          try {
               const user = await AuthService.loginWithGoogle();
               setUser(user);
          } catch (error) {
               console.error(error);
               throw error;
          } finally {
               setIsLoading(false);
          }
     };

     const signInApple = async () => {
          setIsLoading(true);
          try {
               const user = await AuthService.loginWithApple();
               setUser(user);
          } catch (error) {
               console.error(error);
               throw error;
          } finally {
               setIsLoading(false);
          }
     };

     const signOut = async () => {
          setIsLoading(true);
          try {
               await AuthService.logout();
               // Immediately start a new guest session so the user is not left in limbo
               const guest = await AuthService.initGuestSession();
               setUser(guest);
          } catch (error) {
               console.error(error);
               // Even if init fails, ensure we clear the user from state
               setUser(null);
          } finally {
               setIsLoading(false);
          }
     };

     return (
          <AuthContext.Provider value={{ user, isLoading, signInGuest, signInEmail, signUpEmail, signInGoogle, signInApple, signOut }}>
               {children}
          </AuthContext.Provider>
     );
};

export const useAuth = () => {
     const context = useContext(AuthContext);
     if (!context) {
          throw new Error('useAuth must be used within an AuthProvider');
     }
     return context;
};
