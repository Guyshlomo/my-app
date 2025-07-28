const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
const expo = new Expo();

// Test push token (you'll need to replace this with a real token)
const testToken = 'ExponentPushToken[YOUR_TOKEN_HERE]';

// Check that all your push tokens appear to be valid Expo push tokens
if (!Expo.isExpoPushToken(testToken)) {
  console.error(`Push token ${testToken} is not a valid Expo push token!`);
  process.exit(1);
}

// Create the messages that you want to send to clients
const messages = [
  {
    to: testToken,
    sound: 'default',
    title: 'בדיקת Push Notification! 🧪',
    body: 'אם אתה רואה את זה, Push Notifications עובדים!',
    data: { 
      type: 'test',
      message: 'This is a test notification'
    },
  },
];

// Send the messages
async function sendTestNotification() {
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (let chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  console.log('Tickets:', tickets);
  return tickets;
}

// Check the status of the notifications
async function checkNotificationStatus(tickets) {
  const receiptIds = [];
  for (let ticket of tickets) {
    if (ticket.id) {
      receiptIds.push(ticket.id);
    }
  }

  const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
  const receipts = [];

  for (let chunk of receiptIdChunks) {
    try {
      const receiptChunk = await expo.getPushNotificationReceiptsAsync(chunk);
      receipts.push(...receiptChunk);
    } catch (error) {
      console.error('Error getting receipts:', error);
    }
  }

  console.log('Receipts:', receipts);
  return receipts;
}

// Main test function
async function runTest() {
  console.log('🧪 Starting Push Notification Test...');
  
  try {
    const tickets = await sendTestNotification();
    console.log('✅ Notifications sent successfully');
    
    // Wait a bit for the notifications to be processed
    setTimeout(async () => {
      const receipts = await checkNotificationStatus(tickets);
      console.log('📊 Test completed');
    }, 2000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for use in other files
module.exports = { runTest, sendTestNotification };

// Run test if this file is executed directly
if (require.main === module) {
  runTest();
} 