// Script to check if a specific user has a push token
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabaseUrl = 'https://oomibleqeelsswfbkjou.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWlibGVxZWVsc3N3ZmJram91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg5NDAsImV4cCI6MjA2NTgzNDk0MH0.HhwiuWGc22ZfWkmpOlN-QlGLtbktSxyxwEkO83abjHA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecificUser() {
  console.log('🔍 Checking Specific Users...\n');
  
  try {
    // Check for שחר כרמי
    const userId = '983747ae-4103-4192-82da-c3b642c7f116';
    
    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('firstname, lastname, isadmin')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('❌ Error getting user:', userError);
      return;
    }
    
    console.log(`👤 User: ${user.firstname} ${user.lastname} (${user.isadmin ? 'Admin' : 'User'})`);
    console.log(`🆔 User ID: ${userId}`);
    
    // Check if user has push token
    const { data: tokens, error: tokenError } = await supabase
      .from('notification_tokens')
      .select('expo_push_token')
      .eq('user_id', userId);
    
    if (tokenError) {
      console.error('❌ Error getting tokens:', tokenError);
      return;
    }
    
    if (!tokens || tokens.length === 0) {
      console.log('⚠️  No push token found for this user');
      console.log('💡 The user needs to register for push notifications in the app');
    } else {
      console.log('✅ Push token found:');
      console.log(`   Token: ${tokens[0].expo_push_token}`);
    }
    
    console.log('\n📋 For testing, use one of these available tokens:');
    console.log('1. גבי בר-און (Admin): ExponentPushToken[mPJuGIGNDGTuEIDB6uW_nn]');
    console.log('2. חן פרחי כהן (Admin): ExponentPushToken[2n24ZDAzMidK4fbUIfzTcG]');
    console.log('3. גיא שלמה (Admin): ExponentPushToken[pUjrg4GXXwn9PAC1jN7D_F]');
    console.log('4. אמי שלמה (User): ExponentPushToken[Bv5POOIQ8kx2Uzjcow23bN]');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
checkSpecificUser(); 