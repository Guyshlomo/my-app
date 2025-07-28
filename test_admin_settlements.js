const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://oomibleqeelsswfbkjou.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWlibGVxZWVsc3N3ZmJram91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg5NDAsImV4cCI6MjA2NTgzNDk0MH0.HhwiuWGc22ZfWkmpOlN-QlGLtbktSxyxwEkO83abjHA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Simulate the getAllSettlements function from the app
async function getAllSettlements() {
  try {
    console.log('🏘️ [Test] Getting all settlements...');
    
    const { data, error } = await supabase
      .from('settlements')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ [Test] Get settlements error:', error);
      throw error;
    }

    console.log('✅ [Test] Settlements loaded:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ [Test] Get settlements failed:', error);
    throw error;
  }
}

// Test the function
async function testAdminSettlements() {
  try {
    console.log('🧪 Testing admin settlements loading...');
    
    const settlements = await getAllSettlements();
    
    console.log('📊 Settlements found:', settlements.length);
    settlements.forEach(settlement => {
      console.log(`  - ${settlement.name} (ID: ${settlement.id})`);
    });
    
    // Check if "מטה החטופים" is in the list
    const hasKidnappedSettlement = settlements.some(s => s.name === 'מטה החטופים');
    console.log('🔍 "מטה החטופים" found:', hasKidnappedSettlement);
    
    if (hasKidnappedSettlement) {
      console.log('✅ SUCCESS: The new settlement is available!');
    } else {
      console.log('❌ FAILED: The new settlement is not found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAdminSettlements(); 