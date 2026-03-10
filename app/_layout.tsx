import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import useAuth from '@/hooks/useAuth';
import { ActivityIndicator, View } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { user, loading } = useAuth();
  const [fontsLoaded] = useFonts({
    // SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        {!user ? (
          <Stack.Screen
            name="(auth)"
            options={{
              headerShown: false,
            }}
          />
        ) : (
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
        )}
      </Stack>
    </GestureHandlerRootView>
  );
}
