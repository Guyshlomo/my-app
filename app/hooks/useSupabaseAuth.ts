import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { supabase } from '../config/supabase';
import { handleOAuthCallback } from '../db/supabaseApi';
import { clearCredentials } from '../utils/secureStorage';

export function useSupabaseAuth() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // Handle OAuth deep links
    const handleDeepLink = async (url: string) => {
      if (url.includes('voluntree://auth/callback')) {
        try {
          console.log('🔗 [useSupabaseAuth] Handling OAuth callback from deep link');
          await handleOAuthCallback();
        } catch (error) {
          console.error('❌ [useSupabaseAuth] OAuth callback error:', error);
        }
      }
    };

    // Listen for deep links
    const subscription2 = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription.unsubscribe();
      subscription2?.remove();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      await clearCredentials(); // Clear stored credentials when signing out
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    session,
    loading,
    signOut,
  };
} 