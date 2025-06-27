// Test script to check database field names
import { supabase } from './app/config/supabase.js';

async function testDatabaseFields() {
  try {
    console.log('🔍 Testing database field names...');
    
    // Get a sample user to see the actual field names
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    if (users && users.length > 0) {
      console.log('✅ Sample user data:');
      console.log(JSON.stringify(users[0], null, 2));
      
      console.log('\n📋 Available fields:');
      Object.keys(users[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof users[0][key]} = ${users[0][key]}`);
      });
    } else {
      console.log('❌ No users found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testDatabaseFields(); 