import { useFonts } from 'expo-font';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';

import MainNavigator from './MainNavigator';
import SplashScreen from './SplashScreen';

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => setShowSplash(false), 2200);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  if (showSplash) {
    return <SplashScreen />;
  }
  return <MainNavigator />;
}
