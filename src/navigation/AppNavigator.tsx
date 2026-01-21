// App Navigator - React Navigation Stack

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { RootStackParamList } from '../types';
import { WelcomeScreen, HomeScreen, WordDetailScreen, ReviewScreen, SettingsScreen, SentencePracticeScreen, DiscoverScreen, ConversationDetailScreen, CreateConversationScreen, ShadowingPracticeScreen, ShadowingListScreen, NewWordsListScreen, ConversationListScreen } from '../screens';
import { StorageService } from '../services/StorageService';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Welcome');

  useEffect(() => {
    const checkWelcomeStatus = async () => {
      try {
        const hasCompleted = await StorageService.hasCompletedWelcome();
        setInitialRoute(hasCompleted ? 'Home' : 'Welcome');
      } catch (error) {
        console.error('[AppNavigator] Failed to check welcome status:', error);
        setInitialRoute('Welcome');
      } finally {
        setIsLoading(false);
      }
    };

    checkWelcomeStatus();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="WordDetail"
          component={WordDetailScreen}
          options={{
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="Review"
          component={ReviewScreen}
          options={{
            animation: 'fade_from_bottom',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="SentencePractice"
          component={SentencePracticeScreen}
          options={{
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="Discover"
          component={DiscoverScreen}
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="ConversationDetail"
          component={ConversationDetailScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="CreateConversation"
          component={CreateConversationScreen}
          options={{
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ShadowingPractice"
          component={ShadowingPracticeScreen}
          options={{
            animation: 'slide_from_right',
            headerShown: false
          }}
        />
        <Stack.Screen
          name="ShadowingList"
          component={ShadowingListScreen}
          options={{
            animation: 'slide_from_right',
            headerShown: false
          }}
        />
        <Stack.Screen
          name="NewWordsList"
          component={NewWordsListScreen}
          options={{
            animation: 'slide_from_right',
            headerShown: false
          }}
        />
        <Stack.Screen
          name="ConversationList"
          component={ConversationListScreen}
          options={{
            animation: 'slide_from_right',
            headerShown: false
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
