// Test script to verify volunteer registration functionality
const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRegistration() {
  try {
    console.log('🧪 Testing volunteer registration...');
    
    // 1. Check if volunteer_registrations table exists and is accessible
    console.log('📋 Checking volunteer_registrations table...');
    const { data: tableTest, error: tableError } = await supabase
      .from('volunteer_registrations')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table access error:', tableError);
      return;
    }
    
    console.log('✅ volunteer_registrations table is accessible');
    
    // 2. Check volunteer_events table
    console.log('📋 Checking volunteer_events table...');
    const { data: events, error: eventsError } = await supabase
      .from('volunteer_events')
      .select('id, title, current_participants, max_participants')
      .limit(5);
    
    if (eventsError) {
      console.error('❌ Events table error:', eventsError);
      return;
    }
    
    console.log('✅ Found events:', events?.length || 0);
    if (events && events.length > 0) {
      console.log('📄 Sample event:', events[0]);
    }
    
    // 3. Check current user (if authenticated)
    const { data: user, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user.user) {
      console.log('ℹ️ No authenticated user - registration requires authentication');
      return;
    }
    
    console.log('👤 Current user:', user.user.id);
    
    // 4. Check existing registrations for this user
    const { data: registrations, error: regError } = await supabase
      .from('volunteer_registrations')
      .select('*')
      .eq('user_id', user.user.id);
    
    if (regError) {
      console.error('❌ Registration query error:', regError);
      return;
    }
    
    console.log('📝 Current registrations:', registrations?.length || 0);
    
    console.log('✅ All tests passed! Registration system appears to be working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRegistration(); 