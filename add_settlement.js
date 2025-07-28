const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://oomibleqeelsswfbkjou.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWlibGVxZWVsc3N3ZmJram91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg5NDAsImV4cCI6MjA2NTgzNDk0MH0.HhwiuWGc22ZfWkmpOlN-QlGLtbktSxyxwEkO83abjHA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Get settlement name from command line arguments
const settlementName = process.argv[2];

if (!settlementName) {
  console.log('❌ Please provide a settlement name');
  console.log('Usage: node add_settlement.js "שם הישוב"');
  console.log('Example: node add_settlement.js "תל אביב"');
  process.exit(1);
}

async function addSettlement() {
  try {
    console.log(`🏘️ Adding settlement: ${settlementName}`);
    
    // Check if settlement already exists
    const { data: existingSettlements, error: checkError } = await supabase
      .from('settlements')
      .select('*')
      .eq('name', settlementName);
    
    if (checkError) {
      console.error('❌ Error checking existing settlements:', checkError);
      return;
    }
    
    if (existingSettlements && existingSettlements.length > 0) {
      console.log('⚠️ Settlement already exists:', existingSettlements[0]);
      return;
    }
    
    // Add new settlement
    const { data: newSettlement, error: addError } = await supabase
      .from('settlements')
      .insert([{ name: settlementName }])
      .select()
      .single();
    
    if (addError) {
      console.error('❌ Error adding settlement:', addError);
      return;
    }
    
    console.log('✅ Settlement added successfully!');
    console.log('📝 New settlement:', newSettlement);
    
    // Show all settlements
    const { data: allSettlements, error: fetchError } = await supabase
      .from('settlements')
      .select('*')
      .order('name', { ascending: true });
    
    if (fetchError) {
      console.error('❌ Error fetching all settlements:', fetchError);
      return;
    }
    
    console.log('\n📊 All settlements:');
    allSettlements.forEach(settlement => {
      console.log(`  - ${settlement.name} (ID: ${settlement.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addSettlement(); 