// Script to check volunteer events and their details
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabaseUrl = 'https://oomibleqeelsswfbkjou.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWlibGVxZWVsc3N3ZmJram91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg5NDAsImV4cCI6MjA2NTgzNDk0MH0.HhwiuWGc22ZfWkmpOlN-QlGLtbktSxyxwEkO83abjHA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEvents() {
  console.log('🔍 Checking Volunteer Events...\n');
  
  try {
    // Get all volunteer events with creator info
    const { data: events, error: eventError } = await supabase
      .from('volunteer_events')
      .select(`
        id,
        title,
        location,
        date,
        time,
        coins_reward,
        created_by,
        users!inner(firstname, lastname, isadmin)
      `)
      .limit(10);
    
    if (eventError) {
      console.error('❌ Error getting events:', eventError);
      return;
    }
    
    if (!events || events.length === 0) {
      console.log('⚠️  No volunteer events found');
      return;
    }
    
    console.log(`✅ Found ${events.length} volunteer events:\n`);
    
    events.forEach((event, index) => {
      const creator = event.users;
      const creatorType = creator.isadmin ? '👑 Admin' : '👤 User';
      console.log(`${index + 1}. ${event.title}`);
      console.log(`   📍 Location: ${event.location}`);
      console.log(`   📅 Date: ${event.date}`);
      console.log(`   ⏰ Time: ${event.time || 'Not specified'}`);
      console.log(`   🪙 Coins: ${event.coins_reward}`);
      console.log(`   👤 Creator: ${creator.firstname} ${creator.lastname} (${creatorType})`);
      console.log(`   🆔 Event ID: ${event.id}`);
      console.log(`   🆔 Creator ID: ${event.created_by}`);
      console.log('');
    });
    
    // Get push tokens for event creators
    console.log('📱 Push Tokens for Event Creators:\n');
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      
      // Get push token for creator
      const { data: tokens, error: tokenError } = await supabase
        .from('notification_tokens')
        .select('expo_push_token')
        .eq('user_id', event.created_by)
        .limit(1);
      
      if (!tokenError && tokens && tokens.length > 0) {
        console.log(`${i + 1}. ${event.title} (${event.users.firstname} ${event.users.lastname}):`);
        console.log(`   Token: ${tokens[0].expo_push_token}`);
        console.log('');
      }
    }
    
    console.log('📋 Sample Notification Data:');
    console.log('\nFor Admin Registration Notification:');
    console.log('Recipient: [Use token from above]');
    console.log('Title: הרשמה חדשה להתנדבות! 🎉');
    console.log('Body: [שם משתמש] נרשם להתנדבות "[שם אירוע]"');
    console.log('Data: { "type": "admin_registration", "eventId": "[Event ID]", "eventTitle": "[Event Title]" }');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
checkEvents(); 