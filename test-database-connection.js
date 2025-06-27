// Test Database Connection and Column Structure
// Run this with: node test-database-connection.js

const { createClient } = require('@supabase/supabase-js');

// Your Supabase configuration (replace with your actual values)
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test 1: Check if we can connect to users table
    console.log('\n📋 Test 1: Checking users table access...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Users table error:', usersError);
      return;
    }
    
    console.log('✅ Users table accessible');
    
    // Test 2: Check table structure
    console.log('\n📋 Test 2: Checking table structure...');
    if (users && users.length > 0) {
      console.log('✅ Available columns:', Object.keys(users[0]));
      
      if ('taskcompleted' in users[0]) {
        console.log('✅ taskcompleted column EXISTS');
      } else {
        console.log('❌ taskcompleted column MISSING');
      }
    } else {
      console.log('⚠️ No users found in table');
    }
    
    // Test 3: Try to create a test user record (without auth)
    console.log('\n📋 Test 3: Testing insert with taskcompleted...');
    const testUserId = 'test-' + Date.now();
    
    const { error: insertError } = await supabase
      .from('users')
      .insert([{
        id: testUserId,
        email: 'test@example.com',
        firstname: 'Test',
        lastname: 'User',
        coins: 0,
        taskcompleted: 0,
        isadmin: false
      }]);
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
      if (insertError.message.includes('taskcompleted')) {
        console.log('🔧 SOLUTION: Run the fix-taskcompleted-column.sql script in Supabase');
      }
    } else {
      console.log('✅ Insert test successful');
      
      // Clean up test record
      await supabase.from('users').delete().eq('id', testUserId);
      console.log('🧹 Test record cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

// Run the test
testDatabaseConnection(); 