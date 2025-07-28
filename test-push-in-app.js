// Test script to check push notifications within the app
// This will help you verify that push notifications are working

const { createClient } = require('@supabase/supabase-js');

// Create Supabase client with correct credentials
const supabaseUrl = 'https://oomibleqeelsswfbkjou.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWlibGVxZWVsc3N3ZmJram91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg5NDAsImV4cCI6MjA2NTgzNDk0MH0.HhwiuWGc22ZfWkmpOlN-QlGLtbktSxyxwEkO83abjHA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testPushNotifications() {
  console.log('🧪 Testing Push Notifications...');
  
  try {
    // 1. Check if notification_tokens table exists and has data
    console.log('📋 Checking notification_tokens table...');
    const { data: tokens, error: tokenError } = await supabase
      .from('notification_tokens')
      .select('*')
      .limit(5);
    
    if (tokenError) {
      console.error('❌ Error accessing notification_tokens table:', tokenError);
      return;
    }
    
    console.log(`✅ Found ${tokens?.length || 0} registered push tokens`);
    
    if (tokens && tokens.length > 0) {
      console.log('📱 Sample tokens:');
      tokens.forEach((token, index) => {
        console.log(`  ${index + 1}. User: ${token.user_id}, Token: ${token.expo_push_token.substring(0, 20)}...`);
      });
    }
    
    // 2. Check if volunteer_events table has events
    console.log('\n📋 Checking volunteer_events table...');
    const { data: events, error: eventError } = await supabase
      .from('volunteer_events')
      .select('id, title, coins_reward')
      .limit(3);
    
    if (eventError) {
      console.error('❌ Error accessing volunteer_events table:', eventError);
      return;
    }
    
    console.log(`✅ Found ${events?.length || 0} volunteer events`);
    
    if (events && events.length > 0) {
      console.log('🎯 Sample events:');
      events.forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.title} (${event.coins_reward} coins)`);
      });
    }
    
    // 3. Check if users table has admin users
    console.log('\n📋 Checking users table for admins...');
    const { data: admins, error: adminError } = await supabase
      .from('users')
      .select('id, firstname, lastname, isadmin')
      .eq('isadmin', true)
      .limit(3);
    
    if (adminError) {
      console.error('❌ Error accessing users table:', adminError);
      return;
    }
    
    console.log(`✅ Found ${admins?.length || 0} admin users`);
    
    if (admins && admins.length > 0) {
      console.log('👑 Admin users:');
      admins.forEach((admin, index) => {
        console.log(`  ${index + 1}. ${admin.firstname} ${admin.lastname} (${admin.id})`);
      });
    }
    
    // 4. Test summary
    console.log('\n📊 Test Summary:');
    console.log(`  - Push tokens registered: ${tokens?.length || 0}`);
    console.log(`  - Volunteer events available: ${events?.length || 0}`);
    console.log(`  - Admin users: ${admins?.length || 0}`);
    
    if (tokens && tokens.length > 0 && events && events.length > 0) {
      console.log('\n✅ Push notifications should work!');
      console.log('💡 To test:');
      console.log('  1. Register for a volunteer event');
      console.log('  2. Have an admin approve the event');
      console.log('  3. You should receive a push notification');
    } else {
      console.log('\n⚠️  Some components missing:');
      if (!tokens || tokens.length === 0) {
        console.log('   - No push tokens registered');
      }
      if (!events || events.length === 0) {
        console.log('   - No volunteer events available');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPushNotifications(); 