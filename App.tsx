import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MainNavigator from './app/MainNavigator';
import { volunteerEventsManager } from './app/utils/volunteerEvents';

export default function App() {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [loadingText, setLoadingText] = useState('טוען נתונים...');

  useEffect(() => {
    preloadAppData();
  }, []);

  const preloadAppData = async () => {
    try {
      setLoadingText('טוען נתונים...');
      
      // Start preloading volunteer events data
      const preloadPromises = [
        volunteerEventsManager.getAllEvents(),
      ];

      // Wait for all data to be preloaded
      await Promise.all(preloadPromises);
      
      setLoadingText('מכין את האפליקציה...');
      
      // Small delay to ensure smooth transition
      setTimeout(() => {
        setIsDataLoaded(true);
      }, 500);
      
    } catch (error) {
      console.error('❌ Error preloading app data:', error);
      // Even if preloading fails, show the app
      setIsDataLoaded(true);
    }
  };

  if (!isDataLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>{loadingText}</Text>
        <Text style={styles.loadingSubtext}>רק עוד רגע...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: '#D7D2B6',
          background: '#FEF6DA',
          card: '#FEF6DA',
          text: '#000',
          border: '#D7D2B6',
          notification: '#FF3B30',
        },
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: 'normal',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: 'bold',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '900',
          },
        },
      }}
      linking={{
        prefixes: [],
        config: {
          screens: {},
        },
      }}
      fallback={null}
      documentTitle={{
        enabled: false,
      }}
    >
      <MainNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF6DA',
  },
  loadingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#4A5568',
    marginTop: 8,
    textAlign: 'center',
  },
}); 