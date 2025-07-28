const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://oomibleqeelsswfbkjou.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWlibGVxZWVsc3N3ZmJram91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg5NDAsImV4cCI6MjA2NTgzNDk0MH0.HhwiuWGc22ZfWkmpOlN-QlGLtbktSxyxwEkO83abjHA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSettlementsTable() {
  try {
    console.log('🔍 Testing settlements table access...');
    
    // Try to select from settlements table
    const { data, error } = await supabase
      .from('settlements')
      .select('*');
    
    if (error) {
      console.log('❌ Error accessing settlements table:', error.message);
      
      // Check if it's a "does not exist" error
      if (error.message.includes('does not exist')) {
        console.log('📝 Table does not exist. You need to create it manually in Supabase dashboard.');
        console.log('📋 SQL to run in Supabase SQL Editor:');
        console.log(`
CREATE TABLE IF NOT EXISTS settlements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO settlements (name) VALUES 
('ניר-עם'),
('כפר עזה'),
('ארז'),
('יכיני'),
('אור-הנר'),
('נחל עוז'),
('ברור-חיל'),
('גבים'),
('דורות'),
('מפלסים'),
('רוחמה')
ON CONFLICT (name) DO NOTHING;
        `);
      }
    } else {
      console.log('✅ Settlements table exists and accessible!');
      console.log('📊 Found', data.length, 'settlements:');
      data.forEach(settlement => {
        console.log(`  - ${settlement.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSettlementsTable(); 