// Environment Configuration
// Update this file to point to your backend server

export const ENV = {
  // Backend API Configuration (deprecated - using Supabase direct)
  API_BASE_URL: __DEV__ 
    ? 'http://localhost:3000/api'  // Development server (not used)
    : 'https://your-production-domain.com/api', // Production server (not used)
  
  // Supabase Configuration
  SUPABASE_URL: 'https://oomibleqeelsswfbkjou.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWlibGVxZWVsc3N3ZmJram91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg5NDAsImV4cCI6MjA2NTgzNDk0MH0.HhwiuWGc22ZfWkmpOlN-QlGLtbktSxyxwEkO83abjHA',
  
  // API Configuration
  API_TIMEOUT: 10000, // 10 seconds
  
  // Development flags
  ENABLE_LOGGING: __DEV__,
  ENABLE_DEBUG_MODE: __DEV__,
  
  // Use direct Supabase connection instead of API server
  USE_SUPABASE_DIRECT: true, // Set to true to use direct Supabase connection
};

// Helper function to get API URL with environment detection (deprecated)
export const getApiUrl = () => {
  console.log('🔧 Using API URL (deprecated):', ENV.API_BASE_URL);
  return ENV.API_BASE_URL;
};

// Helper function to get Supabase configuration
export const getSupabaseConfig = () => {
  return {
    url: ENV.SUPABASE_URL,
    anonKey: ENV.SUPABASE_ANON_KEY,
  };
};

// Validation for environment variables
export const validateEnvironment = () => {
  if (ENV.USE_SUPABASE_DIRECT && (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY)) {
    throw new Error('Supabase configuration is missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY in environment.ts');
  }
  
  if (ENV.ENABLE_LOGGING) {
    console.log('🌍 Environment loaded:', {
      USE_SUPABASE_DIRECT: ENV.USE_SUPABASE_DIRECT,
      SUPABASE_CONFIGURED: !!(ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY),
      DEVELOPMENT_MODE: __DEV__,
    });
  }
}; 