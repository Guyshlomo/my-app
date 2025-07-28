// Script to get full push tokens for testing on Expo website
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabaseUrl = 'https://oomibleqeelsswfbkjou.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWlibGVxZWVsc3N3ZmJram91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg5NDAsImV4cCI6MjA2NTgzNDk0MH0.HhwiuWGc22ZfWkmpOlN-QlGLtbktSxyxwEkO83abjHA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getPushTokens() {
  console.log('🔍 Getting Push Tokens for Testing...\n');
  
  try {
    // Get all push tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('notification_tokens')
      .select('expo_push_token, user_id')
      .limit(10);
    
    if (tokenError) {
      console.error('❌ Error getting push tokens:', tokenError);
      return;
    }
    
    if (!tokens || tokens.length === 0) {
      console.log('⚠️  No push tokens found');
      return;
    }
    
    console.log(`✅ Found ${tokens.length} push tokens:\n`);
    
    // Get user info for each token
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      // Get user info
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('firstname, lastname, isadmin')
        .eq('id', token.user_id)
        .single();
      
      const userType = user && user.isadmin ? '👑 Admin' : '👤 User';
      const userName = user ? `${user.firstname} ${user.lastname}` : 'Unknown User';
      
      console.log(`${i + 1}. ${userType}: ${userName}`);
      console.log(`   User ID: ${token.user_id}`);
      console.log(`   Push Token: ${token.expo_push_token}`);
      console.log('');
    }
    
    console.log('📋 Copy any of these tokens to test on Expo website:');
    console.log('🌐 Go to: https://expo.dev/notifications');
    console.log('📝 Paste the token in the "Recipient" field');
    console.log('📤 Send a test notification!');
    
    // Also show sample notification formats
    console.log('\n📨 Sample Notification Formats:');
    console.log('\n1. Admin Registration Notification:');
    console.log('   Title: הרשמה חדשה להתנדבות! 🎉');
    console.log('   Body: [שם משתמש] נרשם להתנדבות "[שם התנדבות]"');
    console.log('   Data: { "type": "admin_registration", "eventId": "...", "eventTitle": "..." }');
    
    console.log('\n2. User Approval Notification:');
    console.log('   Title: התנדבות אושרה! 🎉');
    console.log('   Body: התנדבות "[שם התנדבות]" אושרה! קיבלת [מספר] מטבעות');
    console.log('   Data: { "type": "volunteer_approved", "eventId": "...", "eventTitle": "...", "coinsReward": 5 }');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
getPushTokens(); 