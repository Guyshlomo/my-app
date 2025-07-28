// Debug script to test Supabase connection exactly like the app
const { createClient } = require('@supabase/supabase-js');

// Use the exact same configuration as the app
const supabaseUrl = 'https://oomibleqeelsswfbkjou.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWlibGVxZWVsc3N3ZmJram91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg5NDAsImV4cCI6MjA2NTgzNDk0MH0.HhwiuWGc22ZfWkmpOlN-QlGLtbktSxyxwEkO83abjHA';

console.log('🔧 Testing with app configuration:');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

// Simulate the exact getAllSettlements function from the app
async function getAllSettlements() {
  try {
    console.log('🏘️ [Debug] Getting all settlements...');
    
    const { data, error } = await supabase
      .from('settlements')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ [Debug] Get settlements error:', error);
      throw error;
    }

    console.log('✅ [Debug] Settlements loaded:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ [Debug] Get settlements failed:', error);
    throw error;
  }
}

// Test the function
async function debugConnection() {
  try {
    console.log('🧪 Starting debug test...');
    
    const settlements = await getAllSettlements();
    
    console.log('📊 Settlements found:', settlements.length);
    settlements.forEach(settlement => {
      console.log(`  - ${settlement.name} (ID: ${settlement.id})`);
    });
    
    // Check for the new settlement
    const hasNewSettlement = settlements.some(s => s.name === 'מטה החטופים');
    console.log('🔍 "מטה החטופים" found:', hasNewSettlement);
    
    if (hasNewSettlement) {
      console.log('🎉 SUCCESS: The new settlement is available!');
      console.log('💡 If the app is not showing it, there might be a connection issue in the app.');
    } else {
      console.log('❌ FAILED: The new settlement is not found');
    }
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    console.error('❌ Error details:', error.message);
  }
}

debugConnection(); 