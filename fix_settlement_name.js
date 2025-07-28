const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://oomibleqeelsswfbkjou.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWlibGVxZWVsc3N3ZmJram91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg5NDAsImV4cCI6MjA2NTgzNDk0MH0.HhwiuWGc22ZfWkmpOlN-QlGLtbktSxyxwEkO83abjHA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSettlementName() {
  try {
    console.log('🔧 Fixing settlement name...');
    
    // First, let's see what we have
    const { data: currentSettlements, error: fetchError } = await supabase
      .from('settlements')
      .select('*')
      .order('name', { ascending: true });
    
    if (fetchError) {
      console.error('❌ Error fetching settlements:', fetchError);
      return;
    }
    
    console.log('📊 Current settlements:');
    currentSettlements.forEach(settlement => {
      console.log(`  - ${settlement.name} (ID: ${settlement.id})`);
    });
    
    // Find the settlement with name "מטה"
    const targetSettlement = currentSettlements.find(s => s.name === 'מטה');
    
    if (!targetSettlement) {
      console.log('❌ Settlement "מטה" not found');
      return;
    }
    
    console.log(`🔍 Found settlement "מטה" with ID: ${targetSettlement.id}`);
    
    // Update the name to "מטה החטופים"
    const { data: updatedSettlement, error: updateError } = await supabase
      .from('settlements')
      .update({ name: 'מטה החטופים' })
      .eq('id', targetSettlement.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating settlement:', updateError);
      return;
    }
    
    console.log('✅ Settlement name updated successfully!');
    console.log(`📝 New name: ${updatedSettlement.name}`);
    
    // Verify the change
    const { data: verifySettlements, error: verifyError } = await supabase
      .from('settlements')
      .select('*')
      .order('name', { ascending: true });
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
      return;
    }
    
    console.log('\n📊 Updated settlements:');
    verifySettlements.forEach(settlement => {
      console.log(`  - ${settlement.name} (ID: ${settlement.id})`);
    });
    
    // Check if the new settlement is found
    const hasNewSettlement = verifySettlements.some(s => s.name === 'מטה החטופים');
    console.log('🔍 "מטה החטופים" found:', hasNewSettlement);
    
    if (hasNewSettlement) {
      console.log('🎉 SUCCESS: Settlement name fixed!');
    } else {
      console.log('❌ FAILED: Settlement name not updated correctly');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixSettlementName(); 