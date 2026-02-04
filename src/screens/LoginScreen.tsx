// Login Screen - Modeled after WelcomeScreen

import React, { useState } from 'react';
import {
     View,
     Text,
     TextInput,
     StyleSheet,
     TouchableOpacity,
     Pressable,
     KeyboardAvoidingView,
     Platform,
     Dimensions,
     ScrollView,
     ImageBackground,
     ActivityIndicator,
     Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme, colors, spacing, borderRadius, welcomeStyles, gradients } from '../theme';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { SyncService } from '../services/SyncService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
     const navigation = useNavigation<NavigationProp>();
     const { signInEmail, signUpEmail } = useAuth();
     const [isLogin, setIsLogin] = useState(true);
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [confirmPassword, setConfirmPassword] = useState('');
     const [loading, setLoading] = useState(false);
     const [showPassword, setShowPassword] = useState(false);

     const handleSubmit = async () => {
          if (!email || !password) {
               Alert.alert('Error', 'Please fill in all fields');
               return;
          }

          // Email format validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email.trim())) {
               Alert.alert('Error', 'Please enter a valid email address');
               return;
          }

          if (!isLogin && password !== confirmPassword) {
               Alert.alert('Error', 'Passwords do not match');
               return;
          }

          setLoading(true);
          const trimmedEmail = email.trim();
          try {
               if (isLogin) {
                    await signInEmail(trimmedEmail, password);
               } else {
                    await signUpEmail(trimmedEmail, password);
               }

               // Sync local data to server to merge guest progress
               await SyncService.mergeLocalDataToServer();

               // Navigation to Home is handled by AppNavigator or replace here
               navigation.replace('Home');
          } catch (error: any) {
               Alert.alert('Error', error.message || 'Authentication failed');
          } finally {
               setLoading(false);
          }
     };

     return (
          <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
               <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
               >
                    <ImageBackground
                         source={require('../../assets/welcome.jpg')}
                         style={styles.backgroundImage}
                         resizeMode="cover"
                         imageStyle={{ opacity: 0.4 }} // Dim the background slightly for readability
                    >
                         {/* Header - Simple Back Button */}
                         <View style={styles.header}>
                              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                                   <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                              </TouchableOpacity>
                         </View>

                         <ScrollView
                              contentContainerStyle={styles.scrollContent}
                              showsVerticalScrollIndicator={false}
                              keyboardShouldPersistTaps="handled"
                         >
                              <View style={styles.content}>
                                   <View style={styles.titleContainer}>
                                        <Text style={styles.title}>
                                             {isLogin ? 'Welcome Back!' : 'Create Account'}
                                        </Text>
                                        <Text style={styles.subtitle}>
                                             {isLogin ? 'Sign in to continue' : 'Join us today'}
                                        </Text>
                                   </View>

                                   <View style={styles.inputContainer}>
                                        <View style={styles.inputWrapper}>
                                             <TextInput
                                                  style={[welcomeStyles.inputWelcome, styles.inputCompact]}
                                                  placeholder="Email Address"
                                                  placeholderTextColor={colors.welcome.textPlaceholder}
                                                  value={email}
                                                  onChangeText={setEmail}
                                                  autoCapitalize="none"
                                                  keyboardType="email-address"
                                             />
                                             <View style={styles.inputIcon}>
                                                  <Ionicons name="mail-outline" size={20} color={colors.welcome.buttonPurpleEnd} />
                                             </View>
                                        </View>
                                   </View>

                                   <View style={styles.inputContainer}>
                                        <View style={styles.inputWrapper}>
                                             <TextInput
                                                  style={[welcomeStyles.inputWelcome, styles.inputCompact]}
                                                  placeholder="Password"
                                                  placeholderTextColor={colors.welcome.textPlaceholder}
                                                  value={password}
                                                  onChangeText={setPassword}
                                                  secureTextEntry={!showPassword}
                                             />
                                             <TouchableOpacity
                                                  style={styles.inputIcon}
                                                  onPress={() => setShowPassword(!showPassword)}
                                             >
                                                  <Ionicons
                                                       name={showPassword ? "eye-outline" : "eye-off-outline"}
                                                       size={20}
                                                       color={colors.welcome.buttonPurpleEnd}
                                                  />
                                             </TouchableOpacity>
                                        </View>
                                   </View>

                                   {!isLogin && (
                                        <View style={styles.inputContainer}>
                                             <View style={styles.inputWrapper}>
                                                  <TextInput
                                                       style={[welcomeStyles.inputWelcome, styles.inputCompact]}
                                                       placeholder="Confirm Password"
                                                       placeholderTextColor={colors.welcome.textPlaceholder}
                                                       value={confirmPassword}
                                                       onChangeText={setConfirmPassword}
                                                       secureTextEntry={!showPassword}
                                                  />
                                                  <TouchableOpacity
                                                       style={styles.inputIcon}
                                                       onPress={() => setShowPassword(!showPassword)}
                                                  >
                                                       <Ionicons
                                                            name={showPassword ? "eye-outline" : "eye-off-outline"}
                                                            size={20}
                                                            color={colors.welcome.buttonPurpleEnd}
                                                       />
                                                  </TouchableOpacity>
                                             </View>
                                        </View>
                                   )}

                                   <Pressable
                                        style={({ pressed }) => [
                                             welcomeStyles.buttonWelcome,
                                             styles.submitButtonWidth,
                                             styles.buttonCompact,
                                             loading && styles.buttonDisabled,
                                             pressed && styles.buttonPressed,
                                        ]}
                                        onPress={handleSubmit}
                                        disabled={loading}
                                   >
                                        <LinearGradient
                                             colors={gradients.buttonWelcome.colors as [string, string, ...string[]]}
                                             start={gradients.buttonWelcome.start}
                                             end={gradients.buttonWelcome.end}
                                             style={[StyleSheet.absoluteFill, { borderRadius: borderRadius.clayButton }]}
                                        />
                                        {loading ? (
                                             <ActivityIndicator color="#fff" />
                                        ) : (
                                             <>
                                                  <Text style={welcomeStyles.buttonText}>
                                                       {isLogin ? 'Sign In' : 'Sign Up'}
                                                  </Text>
                                                  <Ionicons name="arrow-forward" size={20} color={colors.white} style={styles.arrowIcon} />
                                             </>
                                        )}
                                   </Pressable>

                                   <TouchableOpacity
                                        style={{ marginTop: spacing.xl, padding: spacing.sm }}
                                        onPress={() => setIsLogin(!isLogin)}
                                   >
                                        <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>
                                             {isLogin ? "No account? Sign Up" : "Have an account? Log In"}
                                        </Text>
                                   </TouchableOpacity>
                              </View>
                         </ScrollView>
                    </ImageBackground>
               </KeyboardAvoidingView>
          </SafeAreaView>
     );
};

const styles = StyleSheet.create({
     container: {
          flex: 1,
          backgroundColor: colors.background,
     },
     keyboardView: {
          flex: 1,
     },
     backgroundImage: {
          flex: 1,
          width: '100%',
          height: '100%',
     },
     header: {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
     },
     backButton: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.8)',
          alignItems: 'center',
          justifyContent: 'center',
     },
     scrollContent: {
          flexGrow: 1,
          justifyContent: 'center',
          paddingVertical: spacing.xxxl,
     },
     content: {
          width: SCREEN_WIDTH * 0.85,
          maxWidth: 400,
          alignItems: 'center',
          alignSelf: 'center',
          backgroundColor: colors.white, // Solid white background
          padding: spacing.xl,
          borderRadius: borderRadius.xl,
          ...theme.shadows.clayMedium, // Add shadow for better separation
     },
     titleContainer: {
          alignItems: 'center',
          marginBottom: spacing.xxl,
     },
     title: {
          fontSize: 28,
          fontWeight: '800',
          color: colors.textPrimary,
          marginBottom: spacing.xs,
          textAlign: 'center',
     },
     subtitle: {
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: 'center',
     },
     inputContainer: {
          width: '100%',
          marginBottom: spacing.lg,
     },
     inputWrapper: {
          position: 'relative',
          width: '100%',
     },
     inputIcon: {
          position: 'absolute',
          right: spacing.puffyMd,
          top: '50%',
          transform: [{ translateY: -10 }],
     },
     submitButtonWidth: {
          width: '100%',
          marginTop: spacing.md,
     },
     buttonDisabled: {
          opacity: 0.7,
     },
     buttonPressed: {
          transform: [{ scale: 0.98 }],
     },
     arrowIcon: {
          marginLeft: spacing.xs,
     },
     inputCompact: {
          height: 50,
          paddingVertical: 12, // slightly adjusted padding
     },
     buttonCompact: {
          height: 50,
          paddingVertical: 0,
     },
});
