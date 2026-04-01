import React, { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import useAuth, { AuthProvider } from '@/hooks/useAuth';
import { ActivityIndicator, View, StatusBar, Platform } from 'react-native';
import dummyDataService from '@/services/dummyData';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.warn('Font load timeout; continuing anyway.');
        setFontsLoaded(true);
        SplashScreen.hideAsync();
      }
    }, 6500);

    const initializeApp = async () => {
      try {
        // Load fonts
        await Font.loadAsync({});
        
        // Initialize dummy data
        await dummyDataService.initializeDummyData();
        
        if (!cancelled) {
          clearTimeout(timeout);
          setFontsLoaded(true);
          SplashScreen.hideAsync();
        }
      } catch (err) {
        console.warn('Initialization error; continuing anyway.', err);
        if (!cancelled) {
          clearTimeout(timeout);
          setFontsLoaded(true);
          SplashScreen.hideAsync();
        }
      }
    };

    initializeApp();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0066cc' }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0066cc' }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
