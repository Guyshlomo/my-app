// Test the exact Supabase configuration used in the app
const { createClient } = require('@supabase/supabase-js');

// Read the environment configuration from the app
const fs = require('fs');
const path = require('path');

try {
  // Try to read the environment file
  const envPath = path.join(__dirname, 'app', 'config', 'environment.ts');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  console.log('📁 Environment file found at:', envPath);
  console.log('📄 Environment file content:');
  console.log(envContent);
  
  // Extract Supabase URL and Key from the content
  const urlMatch = envContent.match(/SUPABASE_URL:\s*['"`]([^'"`]+)['"`]/);
  const keyMatch = envContent.match(/SUPABASE_ANON_KEY:\s*['"`]([^'"`]+)['"`]/);
  
  if (urlMatch && keyMatch) {
    const supabaseUrl = urlMatch[1];
    const supabaseKey = keyMatch[1];
    
    console.log('\n🔧 Extracted configuration:');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey.substring(0, 20) + '...');
    
    // Test the connection
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('\n🧪 Testing connection...');
    
    // Test a simple query
    const { data, error } = await supabase
      .from('settlements')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error);
    } else {
      console.log('✅ Connection successful!');
      
      // Now test the full settlements query
      const { data: settlements, error: settlementsError } = await supabase
        .from('settlements')
        .select('*')
        .order('name', { ascending: true });
      
      if (settlementsError) {
        console.error('❌ Settlements query failed:', settlementsError);
      } else {
        console.log('✅ Settlements query successful!');
        console.log('📊 Found', settlements.length, 'settlements:');
        settlements.forEach(settlement => {
          console.log(`  - ${settlement.name} (ID: ${settlement.id})`);
        });
        
        // Check for the new settlement
        const hasNewSettlement = settlements.some(s => s.name === 'מטה החטופים');
        console.log('🔍 "מטה החטופים" found:', hasNewSettlement);
      }
    }
    
  } else {
    console.error('❌ Could not extract Supabase configuration from environment file');
  }
  
} catch (error) {
  console.error('❌ Error reading environment file:', error.message);
  
  // Fallback to hardcoded values
  console.log('\n🔄 Using hardcoded configuration...');
  const supabaseUrl = 'https://oomibleqeelsswfbkjou.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWlibGVxZWVsc3N3ZmJram91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg5NDAsImV4cCI6MjA2NTgzNDk0MH0.HhwiuWGc22ZfWkmpOlN-QlGLtbktSxyxwEkO83abjHA';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🧪 Testing connection with hardcoded config...');
  
  const { data: settlements, error: settlementsError } = await supabase
    .from('settlements')
    .select('*')
    .order('name', { ascending: true });
  
  if (settlementsError) {
    console.error('❌ Connection failed:', settlementsError);
  } else {
    console.log('✅ Connection successful!');
    console.log('📊 Found', settlements.length, 'settlements:');
    settlements.forEach(settlement => {
      console.log(`  - ${settlement.name} (ID: ${settlement.id})`);
    });
  }
} 