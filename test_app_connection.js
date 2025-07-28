const { createClient } = require('@supabase/supabase-js');

// Use the same configuration as the app
const supabaseUrl = 'https://oomibleqeelsswfbkjou.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWlibGVxZWVsc3N3ZmJram91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg5NDAsImV4cCI6MjA2NTgzNDk0MH0.HhwiuWGc22ZfWkmpOlN-QlGLtbktSxyxwEkO83abjHA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAppConnection() {
  console.log('🧪 Testing app connection to Supabase...');
  
  try {
    // Test basic connection
    console.log('📡 Testing basic connection...');
    const { data, error } = await supabase
      .from('settlements')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Basic connection failed:', error);
      return;
    }
    
    console.log('✅ Basic connection successful!');
    
    // Test settlements query
    console.log('🏘️ Testing settlements query...');
    const { data: settlements, error: settlementsError } = await supabase
      .from('settlements')
      .select('*')
      .order('name', { ascending: true });
    
    if (settlementsError) {
      console.error('❌ Settlements query failed:', settlementsError);
      return;
    }
    
    console.log('✅ Settlements query successful!');
    console.log('📊 Found', settlements.length, 'settlements:');
    
    settlements.forEach(settlement => {
      console.log(`  - ${settlement.name} (ID: ${settlement.id})`);
    });
    
    // Check for the new settlement
    const hasNewSettlement = settlements.some(s => s.name === 'מטה החטופים');
    console.log('🔍 "מטה החטופים" found:', hasNewSettlement);
    
    if (hasNewSettlement) {
      console.log('🎉 SUCCESS: The new settlement is available in Supabase!');
      console.log('💡 The app should now show this settlement in both registration and admin screens.');
    } else {
      console.log('❌ FAILED: The new settlement is not found in Supabase');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAppConnection(); 