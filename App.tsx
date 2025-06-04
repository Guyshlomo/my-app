import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import BottomBanner from './app/components/BottomBanner';
import MainNavigator from './app/MainNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <MainNavigator />
        </View>
        <View style={styles.bannerContainer}>
          <BottomBanner />
        </View>
      </SafeAreaView>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  bannerContainer: {
    width: '100%',
  },
}); 