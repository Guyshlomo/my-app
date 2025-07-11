import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';

// Set notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Types
interface PushNotificationData {
  eventId: string;
  eventTitle: string;
  eventLocation: string;
  eventDate: string;
  eventTime: string;
}

interface NotificationToken {
  id: string;
  user_id: string;
  expo_push_token: string;
  device_id: string;
  platform: string;
  created_at: string;
  updated_at: string;
}

// ===== DEVICE TOKEN MANAGEMENT =====

/**
 * Register device for push notifications
 * @param userId - User ID from Supabase Auth
 * @returns Promise<string | null> - Push token or null if failed
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
  try {
    console.log('🔔 [PushNotifications] Starting registration for user:', userId);

    // Check if device supports push notifications
    if (!Device.isDevice) {
      console.warn('⚠️ [PushNotifications] Must use physical device for push notifications');
      return null;
    }

    // Get existing permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If not granted, request permission
    if (existingStatus !== 'granted') {
      console.log('🔔 [PushNotifications] Requesting permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ [PushNotifications] Permission not granted');
      return null;
    }

    // Get push token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'fec72c28-8706-4ed2-81ef-9d1a28a23345', // EAS Project ID
    });

    console.log('✅ [PushNotifications] Got push token:', token.data);

    // Save token to database
    const success = await savePushTokenToDatabase(userId, token.data);
    if (success) {
      console.log('✅ [PushNotifications] Token saved to database');
      return token.data;
    } else {
      console.error('❌ [PushNotifications] Failed to save token to database');
      return null;
    }
  } catch (error) {
    console.error('❌ [PushNotifications] Registration failed:', error);
    return null;
  }
}

/**
 * Save push token to Supabase database
 * @param userId - User ID
 * @param pushToken - Expo push token
 * @returns Promise<boolean> - Success status
 */
async function savePushTokenToDatabase(userId: string, pushToken: string): Promise<boolean> {
  try {
    const deviceId = Device.modelName || 'unknown';
    const platform = Platform.OS;

    console.log('💾 [PushNotifications] Saving token to database:', {
      userId,
      pushToken,
      deviceId,
      platform,
    });

    // Check if token already exists for this user and device
    const { data: existingToken, error: checkError } = await supabase
      .from('notification_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('device_id', deviceId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ [PushNotifications] Error checking existing token:', checkError);
      return false;
    }

    if (existingToken) {
      // Update existing token
      const { error: updateError } = await supabase
        .from('notification_tokens')
        .update({
          expo_push_token: pushToken,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingToken.id);

      if (updateError) {
        console.error('❌ [PushNotifications] Error updating token:', updateError);
        return false;
      }

      console.log('✅ [PushNotifications] Token updated successfully');
    } else {
      // Insert new token
      const { error: insertError } = await supabase
        .from('notification_tokens')
        .insert([
          {
            user_id: userId,
            expo_push_token: pushToken,
            device_id: deviceId,
            platform: platform,
          },
        ]);

      if (insertError) {
        console.error('❌ [PushNotifications] Error inserting token:', insertError);
        return false;
      }

      console.log('✅ [PushNotifications] Token inserted successfully');
    }

    return true;
  } catch (error) {
    console.error('❌ [PushNotifications] Database operation failed:', error);
    return false;
  }
}

// ===== NOTIFICATION SENDING =====

/**
 * Send push notification to users in specific settlement when new volunteer event is created
 * @param eventData - Volunteer event data
 * @param targetSettlement - Settlement to send notifications to
 * @returns Promise<boolean> - Success status
 */
export async function sendNewEventNotification(
  eventData: {
    id: string;
    title: string;
    location: string;
    date: string;
    time: string;
    description?: string;
  },
  targetSettlement: string
): Promise<boolean> {
  try {
    console.log('📢 [PushNotifications] Sending new event notification:', {
      eventTitle: eventData.title,
      targetSettlement,
    });

    // Get users from target settlement
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, firstname, lastname, settlement')
      .eq('settlement', targetSettlement)
      .eq('isadmin', false); // Don't send to admins

    if (usersError) {
      console.error('❌ [PushNotifications] Error fetching users:', usersError);
      return false;
    }

    if (!users || users.length === 0) {
      console.log('⚠️ [PushNotifications] No users found in settlement:', targetSettlement);
      return true; // Not an error, just no users
    }

    console.log(`📊 [PushNotifications] Found ${users.length} users in settlement ${targetSettlement}`);

    // Get push tokens for these users
    const userIds = users.map(user => user.id);
    const { data: tokens, error: tokensError } = await supabase
      .from('notification_tokens')
      .select('*')
      .in('user_id', userIds);

    if (tokensError) {
      console.error('❌ [PushNotifications] Error fetching tokens:', tokensError);
      return false;
    }

    if (!tokens || tokens.length === 0) {
      console.log('⚠️ [PushNotifications] No push tokens found for users in settlement:', targetSettlement);
      return true; // Not an error, just no tokens
    }

    console.log(`📱 [PushNotifications] Found ${tokens.length} push tokens`);

    // Prepare notification messages
    const messages = tokens.map(token => ({
      to: token.expo_push_token,
      sound: 'default',
      title: '🌟 התנדבות חדשה!',
      body: `${eventData.title} - ${eventData.location}`,
      data: {
        eventId: eventData.id,
        eventTitle: eventData.title,
        eventLocation: eventData.location,
        eventDate: eventData.date,
        eventTime: eventData.time,
        type: 'new_volunteer_event',
      } as PushNotificationData,
      channelId: 'volunteer-events',
    }));

    // Send notifications using Expo Push API
    const success = await sendPushNotifications(messages);
    
    if (success) {
      console.log('✅ [PushNotifications] Notifications sent successfully');
      return true;
    } else {
      console.error('❌ [PushNotifications] Failed to send notifications');
      return false;
    }
  } catch (error) {
    console.error('❌ [PushNotifications] Send notification failed:', error);
    return false;
  }
}

/**
 * Send push notifications using Expo Push API
 * @param messages - Array of notification messages
 * @returns Promise<boolean> - Success status
 */
async function sendPushNotifications(messages: any[]): Promise<boolean> {
  try {
    console.log(`📤 [PushNotifications] Sending ${messages.length} notifications...`);

    const chunks = chunkArray(messages, 100); // Expo recommends chunks of 100

    for (const chunk of chunks) {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        console.error('❌ [PushNotifications] Expo Push API error:', response.status, response.statusText);
        return false;
      }

      const result = await response.json();
      console.log('📨 [PushNotifications] Expo Push API response:', result);

      // Check for errors in the response
      if (result.data) {
        const errors = result.data.filter((item: any) => item.status === 'error');
        if (errors.length > 0) {
          console.error('❌ [PushNotifications] Some notifications failed:', errors);
          // Continue anyway - some might have succeeded
        }
      }
    }

    return true;
  } catch (error) {
    console.error('❌ [PushNotifications] Send failed:', error);
    return false;
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Chunk array into smaller arrays
 * @param array - Array to chunk
 * @param size - Chunk size
 * @returns Array of chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Setup notification listeners
 * @param onNotificationReceived - Callback when notification is received
 * @param onNotificationTapped - Callback when notification is tapped
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) {
  console.log('🔔 [PushNotifications] Setting up notification listeners');

  // Listen for notifications received while app is running
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('📨 [PushNotifications] Notification received:', notification);
    onNotificationReceived?.(notification);
  });

  // Listen for notification taps
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('👆 [PushNotifications] Notification tapped:', response);
    onNotificationTapped?.(response);
  });

  // Return cleanup function
  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}

/**
 * Remove user's push token from database (for logout)
 * @param userId - User ID
 * @returns Promise<boolean> - Success status
 */
export async function removePushToken(userId: string): Promise<boolean> {
  try {
    console.log('🗑️ [PushNotifications] Removing push token for user:', userId);

    const { error } = await supabase
      .from('notification_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('❌ [PushNotifications] Error removing token:', error);
      return false;
    }

    console.log('✅ [PushNotifications] Token removed successfully');
    return true;
  } catch (error) {
    console.error('❌ [PushNotifications] Remove token failed:', error);
    return false;
  }
} 