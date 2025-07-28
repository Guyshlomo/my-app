const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase configuration
const supabaseUrl = 'https://oomibleqeelsswfbkjou.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWlibGVxZWVsc3N3ZmJram91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg5NDAsImV4cCI6MjA2NTgzNDk0MH0.HhwiuWGc22ZfWkmpOlN-QlGLtbktSxyxwEkO83abjHA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSettlementsSQL() {
  try {
    console.log('🏗️ Creating settlements table...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('create_settlements_tables.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('📝 Executing:', statement.substring(0, 50) + '...');
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error('❌ Error executing SQL:', error);
        } else {
          console.log('✅ Statement executed successfully');
        }
      }
    }
    
    console.log('🎉 Settlements table creation completed!');
    
    // Verify the table was created
    const { data: settlements, error } = await supabase
      .from('settlements')
      .select('*');
    
    if (error) {
      console.error('❌ Error verifying table:', error);
    } else {
      console.log('✅ Settlements table verified. Found', settlements.length, 'settlements:');
      settlements.forEach(settlement => {
        console.log(`  - ${settlement.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Failed to run settlements SQL:', error);
  }
}

// Alternative method using direct SQL execution
async function createSettlementsTableDirect() {
  try {
    console.log('🏗️ Creating settlements table directly...');
    
    // Create table
    const { error: createError } = await supabase
      .from('settlements')
      .select('*')
      .limit(1);
    
    if (createError && createError.message.includes('does not exist')) {
      console.log('📝 Table does not exist, creating it...');
      // Note: In a real scenario, you would need to use migrations or the Supabase dashboard
      // to create tables, as the client doesn't support DDL operations
    }
    
    // Insert settlements
    const settlements = [
      'ניר-עם',
      'כפר עזה',
      'ארז',
      'יכיני',
      'אור-הנר',
      'נחל עוז',
      'ברור-חיל',
      'גבים',
      'דורות',
      'מפלסים',
      'רוחמה'
    ];
    
    const settlementsData = settlements.map((name, index) => ({
      id: index + 1,
      name: name
    }));
    
    const { data, error } = await supabase
      .from('settlements')
      .upsert(settlementsData, { onConflict: 'name' });
    
    if (error) {
      console.error('❌ Error inserting settlements:', error);
    } else {
      console.log('✅ Settlements inserted successfully:', data?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Failed to create settlements table:', error);
  }
}

// Run the script
console.log('🚀 Starting settlements table setup...');
createSettlementsTableDirect(); 