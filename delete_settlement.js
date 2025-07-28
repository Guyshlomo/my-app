const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://oomibleqeelsswfbkjou.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWlibGVxZWVsc3N3ZmJram91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg5NDAsImV4cCI6MjA2NTgzNDk0MH0.HhwiuWGc22ZfWkmpOlN-QlGLtbktSxyxwEkO83abjHA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Get settlement name from command line arguments
const settlementName = process.argv[2];

if (!settlementName) {
  console.log('❌ Please provide a settlement name');
  console.log('Usage: node delete_settlement.js "שם הישוב"');
  console.log('Example: node delete_settlement.js "תל אביב"');
  process.exit(1);
}

async function deleteSettlement() {
  try {
    console.log(`🗑️ Deleting settlement: ${settlementName}`);
    
    // Find the settlement by name
    const { data: settlements, error: findError } = await supabase
      .from('settlements')
      .select('*')
      .eq('name', settlementName);
    
    if (findError) {
      console.error('❌ Error finding settlement:', findError);
      return;
    }
    
    if (!settlements || settlements.length === 0) {
      console.log('❌ Settlement not found:', settlementName);
      return;
    }
    
    const settlement = settlements[0];
    console.log(`🔍 Found settlement: ${settlement.name} (ID: ${settlement.id})`);
    
    // Delete the settlement
    const { error: deleteError } = await supabase
      .from('settlements')
      .delete()
      .eq('id', settlement.id);
    
    if (deleteError) {
      console.error('❌ Error deleting settlement:', deleteError);
      return;
    }
    
    console.log('✅ Settlement deleted successfully!');
    
    // Show remaining settlements
    const { data: remainingSettlements, error: fetchError } = await supabase
      .from('settlements')
      .select('*')
      .order('name', { ascending: true });
    
    if (fetchError) {
      console.error('❌ Error fetching remaining settlements:', fetchError);
      return;
    }
    
    console.log('\n📊 Remaining settlements:');
    remainingSettlements.forEach(settlement => {
      console.log(`  - ${settlement.name} (ID: ${settlement.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

deleteSettlement(); 