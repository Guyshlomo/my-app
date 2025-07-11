const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://oomibleqeelsswfbkjou.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWlibGVxZWVsc3N3ZmJram91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg5NDAsImV4cCI6MjA2NTgzNDk0MH0.HhwiuWGc22ZfWkmpOlN-QlGLtbktSxyxwEkO83abjHA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateEvent() {
  console.log('🧪 Testing event creation and notifications...\n');

  try {
    const adminId = 'e66f2fc9-4f1a-4541-9a72-a0f04ad4bc7d'; // גיא שלמה (admin)
    
    // Create test event
    const eventData = {
      title: 'בדיקת התראות',
      description: 'אירוע לבדיקת מערכת ההתראות',
      location: 'ניר-עם',
      date: new Date().toISOString().split('T')[0], // Today
      time: '19:00',
      max_participants: 10,
      coins_reward: 15,
      created_by: adminId,
      is_active: true,
    };

    console.log('➕ Creating test volunteer event...');
    console.log('Event data:', eventData);
    console.log('');

    const { data, error } = await supabase
      .from('volunteer_events')
      .insert([eventData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating event:', error);
      return;
    }

    console.log('✅ Event created successfully!');
    console.log('Event ID:', data.id);
    console.log('');

    // Now test the notification function manually
    console.log('📢 Testing notification sending...');
    
    // Simulate the notification call
    console.log('🔍 Finding users in settlement:', data.location);
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, firstname, lastname, settlement, isadmin, email')
      .eq('settlement', data.location)
      .eq('isadmin', false);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    console.log(`📊 Found ${users.length} users in settlement ${data.location}:`);
    users.forEach(user => {
      console.log(`   - ${user.firstname} ${user.lastname} (${user.email})`);
    });
    console.log('');

    if (users.length === 0) {
      console.log('⚠️ No regular users found in settlement - no notifications to send');
      return;
    }

    // Check push tokens
    const userIds = users.map(user => user.id);
    const { data: tokens, error: tokensError } = await supabase
      .from('notification_tokens')
      .select('*')
      .in('user_id', userIds);

    if (tokensError) {
      console.error('❌ Error fetching tokens:', tokensError);
      return;
    }

    console.log(`📱 Found ${tokens.length} push tokens for these users:`);
    tokens.forEach(token => {
      console.log(`   - ${token.expo_push_token} (User: ${token.user_id})`);
    });
    console.log('');

    if (tokens.length === 0) {
      console.log('⚠️ No push tokens found - users need to log in first');
      return;
    }

    // Test actual notification sending
    console.log('📤 Sending test notification...');
    
    const messages = tokens.map(token => ({
      to: token.expo_push_token,
      sound: 'default',
      title: '🌟 התנדבות חדשה!',
      body: `${data.title} - ${data.location}`,
      data: {
        eventId: data.id,
        eventTitle: data.title,
        eventLocation: data.location,
        eventDate: data.date,
        eventTime: data.time,
        type: 'new_volunteer_event',
      },
      channelId: 'volunteer-events',
    }));

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      console.error('❌ Expo Push API error:', response.status, response.statusText);
      return;
    }

    const result = await response.json();
    console.log('📨 Expo Push API response:', result);

    if (result.data) {
      const successful = result.data.filter(item => item.status === 'ok');
      const failed = result.data.filter(item => item.status === 'error');
      
      console.log(`✅ Successfully sent ${successful.length} notifications`);
      if (failed.length > 0) {
        console.log(`❌ Failed to send ${failed.length} notifications:`, failed);
      }
    }

    console.log('');
    console.log('🎯 Test completed!');
    console.log('If this worked, the issue is in the app code calling the notification function.');
    console.log('If this failed, the issue is with the notification system itself.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCreateEvent().catch(console.error); 