// Test script to send a real push notification
// This will help you verify that push notifications are actually working

const { createClient } = require('@supabase/supabase-js');
const { Expo } = require('expo-server-sdk');

// Create Supabase client
const supabaseUrl = 'https://oomibleqeelsswfbkjou.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWlibGVxZWVsc3N3ZmJram91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg5NDAsImV4cCI6MjA2NTgzNDk0MH0.HhwiuWGc22ZfWkmpOlN-QlGLtbktSxyxwEkO83abjHA';
const supabase = createClient(supabaseUrl, supabaseKey);

// Create Expo SDK client
const expo = new Expo();

async function sendTestNotification() {
  console.log('🧪 Sending Test Push Notification...');
  
  try {
    // 1. Get a push token from the database
    console.log('📋 Getting push tokens from database...');
    const { data: tokens, error: tokenError } = await supabase
      .from('notification_tokens')
      .select('expo_push_token, user_id')
      .limit(1);
    
    if (tokenError) {
      console.error('❌ Error getting push tokens:', tokenError);
      return;
    }
    
    if (!tokens || tokens.length === 0) {
      console.log('⚠️  No push tokens found in database');
      console.log('💡 Make sure to register for push notifications in the app first');
      return;
    }
    
    const testToken = tokens[0].expo_push_token;
    console.log(`✅ Using token: ${testToken.substring(0, 20)}...`);
    
    // 2. Validate the token
    if (!Expo.isExpoPushToken(testToken)) {
      console.error(`❌ Invalid push token: ${testToken}`);
      return;
    }
    
    // 3. Create test message
    const message = {
      to: testToken,
      sound: 'default',
      title: 'בדיקת Push Notification! 🧪',
      body: 'אם אתה רואה את זה, Push Notifications עובדים!',
      data: { 
        type: 'test',
        message: 'This is a test notification from the server',
        timestamp: new Date().toISOString()
      },
    };
    
    console.log('📨 Sending notification...');
    console.log('   Title:', message.title);
    console.log('   Body:', message.body);
    
    // 4. Send the notification
    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];
    
    for (let chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('❌ Error sending notification:', error);
        return;
      }
    }
    
    console.log('✅ Notification sent successfully!');
    console.log('📋 Tickets:', tickets);
    
    // 5. Check delivery status after a delay
    console.log('⏳ Waiting 5 seconds to check delivery status...');
    setTimeout(async () => {
      const receiptIds = [];
      for (let ticket of tickets) {
        if (ticket.id) {
          receiptIds.push(ticket.id);
        }
      }
      
      if (receiptIds.length === 0) {
        console.log('⚠️  No receipt IDs to check');
        return;
      }
      
      const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
      const receipts = [];
      
      for (let chunk of receiptIdChunks) {
        try {
          const receiptChunk = await expo.getPushNotificationReceiptsAsync(chunk);
          receipts.push(...receiptChunk);
        } catch (error) {
          console.error('❌ Error getting receipts:', error);
        }
      }
      
      console.log('📊 Delivery status:');
      receipts.forEach((receipt, index) => {
        if (receipt.status === 'ok') {
          console.log(`  ✅ Notification ${index + 1}: Delivered successfully`);
        } else if (receipt.status === 'error') {
          console.log(`  ❌ Notification ${index + 1}: Failed - ${receipt.message}`);
        } else {
          console.log(`  ⏳ Notification ${index + 1}: Still processing`);
        }
      });
      
    }, 5000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
sendTestNotification(); 