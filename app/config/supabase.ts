import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { ENV, getSupabaseConfig } from './environment';

// Get Supabase configuration from environment
const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseConfig();

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration is missing! Please set SUPABASE_URL and SUPABASE_ANON_KEY in environment.ts');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper function to get current user
export const getCurrentSupabaseUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    return user;
  } catch (error) {
    console.error('Error in getCurrentSupabaseUser:', error);
    return null;
  }
};

// Helper function to check if user is admin
export const checkUserIsAdmin = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('isadmin')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return data?.isadmin || false;
  } catch (error) {
    console.error('Error in checkUserIsAdmin:', error);
    return false;
  }
};

// Helper function to get user profile
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

// Log configuration status
if (ENV.ENABLE_LOGGING) {
  console.log('🔐 Supabase client initialized:', {
    url: supabaseUrl ? '✅ Configured' : '❌ Missing',
    anonKey: supabaseAnonKey ? '✅ Configured' : '❌ Missing',
  });
}

export default supabase; 