import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSupabaseAuth } from './app/hooks/useSupabaseAuth';
import MainNavigator from './app/MainNavigator';
import { volunteerEventsManager } from './app/utils/volunteerEvents';

export default function App() {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [loadingText, setLoadingText] = useState('טוען נתונים...');
  const navigationRef = useRef<any>(null);
  
  // Initialize Supabase auth for deep link handling
  const { setNavigationRef } = useSupabaseAuth();

  useEffect(() => {
    preloadAppData();
  }, []);

  useEffect(() => {
    // Set navigation reference for deep link handling
    if (navigationRef.current) {
      console.log('🧭 [App] Setting navigation reference for deep links');
      setNavigationRef(navigationRef.current);
    } else {
      console.log('⚠️ [App] Navigation reference not available yet');
    }
  }, [setNavigationRef]);

  // Add a second effect to handle navigation reference after it's set
  useEffect(() => {
    const timer = setTimeout(() => {
      if (navigationRef.current) {
        console.log('🧭 [App] Re-setting navigation reference after delay');
        setNavigationRef(navigationRef.current);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [setNavigationRef]);

  // Add a third effect to handle navigation reference after data is loaded
  useEffect(() => {
    if (isDataLoaded && navigationRef.current) {
      console.log('🧭 [App] Setting navigation reference after data loaded');
      setNavigationRef(navigationRef.current);
    }
  }, [isDataLoaded, setNavigationRef]);

  // 🧪 TESTING: Get push token for manual testing - IMMEDIATE
  useEffect(() => {
    const getTokenForTesting = async () => {
      try {
        console.log('🔔 [Testing] Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('❌ No permission for notifications');
          console.log('💡 Please allow notifications in device settings');
          return;
        }
        
        console.log('✅ [Testing] Permission granted, getting token...');
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: 'fec72c28-8706-4ed2-81ef-9d1a28a23345'
        });
        
        console.log('');
        console.log('🎯 ===== COPY THIS TOKEN FOR TESTING =====');
        console.log('📱 Token:', tokenData.data);
        console.log('');
        console.log('📋 Testing Instructions:');
        console.log('1. Copy the token above');
        console.log('2. Go to: https://expo.dev/notifications');
        console.log('3. Paste token in "Recipient"');
        console.log('4. Add title: "🌟 התנדבות חדשה!"');
        console.log('5. Add message: "בדיקת מערכת התראות - Voluntree"');
        console.log('6. Click "Send Notification"');
        console.log('7. Check your device for the notification!');
        console.log('==========================================');
        console.log('');
        
        return tokenData.data;
      } catch (error) {
        console.error('❌ Error getting token:', error);
      }
    };
    
    // Call immediately when app starts
    getTokenForTesting();
  }, []);

  // Setup push notification listeners
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const { setupNotificationListeners } = await import('./app/utils/pushNotifications');
        
        console.log('🔔 [App] Setting up push notification listeners...');
        
        const cleanup = setupNotificationListeners(
          (notification) => {
            console.log('📨 [App] Notification received:', notification.request.content.title);
            // Handle notification received while app is running
          },
          (response) => {
            console.log('👆 [App] Notification tapped:', response.notification.request.content.title);
            // Handle notification tap - could navigate to specific screen
            const data = response.notification.request.content.data;
            if (data?.type === 'new_volunteer_event') {
              console.log('🎯 [App] Navigating to volunteer event:', data.eventId);
              // Could implement navigation to specific event here
            }
          }
        );
        
        console.log('✅ [App] Push notification listeners set up');
        
        return cleanup;
      } catch (error) {
        console.error('❌ [App] Failed to setup notification listeners:', error);
        return () => {}; // Return empty cleanup function
      }
    };
    
    let cleanup: (() => void) | undefined;
    
    if (isDataLoaded) {
      setupNotifications().then((cleanupFn) => {
        cleanup = cleanupFn;
      });
    }
    
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [isDataLoaded]);

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
      ref={navigationRef}
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
        prefixes: ['voluntree://'],
        config: {
          screens: {
            Login: 'login',
            Signup: 'signup',
            Home: 'home',
            Trophy: 'trophy',
            Calendar: 'calendar',
            Gift: 'gift',
            Volunteer: 'volunteer',
            PurchaseHistory: 'purchase-history',
            LuckyWheel: 'lucky-wheel',
            AdminUsers: 'admin-users',
            EditEvent: 'edit-event',
            ResetPassword: 'reset-password',
          },
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