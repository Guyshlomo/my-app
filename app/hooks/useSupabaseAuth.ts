import { useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { supabase } from '../config/supabase';
import { handleOAuthCallback } from '../db/supabaseApi';
import { clearCredentials } from '../utils/secureStorage';

export function useSupabaseAuth() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [navigation, setNavigation] = useState<any>(null);

  // Function to set navigation reference
  const setNavigationRef = (nav: any) => {
    console.log('🧭 [useSupabaseAuth] Setting navigation reference:', nav ? 'Available' : 'Not available');
    setNavigation(nav);
  };

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

    // Handle deep links
    const handleDeepLink = async (url: string) => {
      console.log('🔗 [useSupabaseAuth] Handling deep link:', url);
      
      if (url.includes('voluntree://auth/callback')) {
        try {
          console.log('🔗 [useSupabaseAuth] Handling OAuth callback from deep link');
          await handleOAuthCallback();
        } catch (error) {
          console.error('❌ [useSupabaseAuth] OAuth callback error:', error);
        }
      } else if (url.includes('voluntree://reset-password') || url.includes('reset-password') || url.includes('type=recovery')) {
        try {
          console.log('🔗 [useSupabaseAuth] Handling password reset deep link');
          
          // Extract tokens from URL - handle both query params and hash fragments
          let accessToken, refreshToken, type;
          
          if (url.includes('#')) {
            // Handle hash fragment format (new Supabase format)
            const hashParams = new URLSearchParams(url.split('#')[1]);
            accessToken = hashParams.get('access_token');
            refreshToken = hashParams.get('refresh_token');
            type = hashParams.get('type');
            console.log('🔍 [useSupabaseAuth] Using hash fragment format');
          } else {
            // Handle query params format (old format)
            const urlParams = new URL(url);
            accessToken = urlParams.searchParams.get('access_token');
            refreshToken = urlParams.searchParams.get('refresh_token');
            type = urlParams.searchParams.get('type');
            console.log('🔍 [useSupabaseAuth] Using query params format');
          }
          
          console.log('🔍 [useSupabaseAuth] URL params found:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            type: type,
            urlFormat: url.includes('#') ? 'hash' : 'query'
          });
          
          // Check if this is a password reset link
          if (type === 'recovery' && accessToken && refreshToken) {
            console.log('✅ [useSupabaseAuth] Tokens found in reset password link');
            
            // Set the session with the tokens from the reset password link
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) {
              console.error('❌ [useSupabaseAuth] Error setting session from reset link:', error);
              Alert.alert(
                'שגיאה',
                'אירעה שגיאה בעיבוד קישור איפוס הסיסמה. אנא נסה שוב.',
                [{ text: 'הבנתי', style: 'default' }]
              );
            } else {
              console.log('✅ [useSupabaseAuth] Session set successfully from reset link');
              console.log('👤 [useSupabaseAuth] User ID:', data.user?.id);
              
              // Navigate to reset password screen if navigation is available
              if (navigation) {
                console.log('🧭 [useSupabaseAuth] Navigating to ResetPassword screen');
                navigation.navigate('ResetPassword');
              } else {
                console.log('⚠️ [useSupabaseAuth] Navigation not available yet, will retry...');
                // Retry navigation after a short delay
                setTimeout(() => {
                  if (navigation) {
                    console.log('🧭 [useSupabaseAuth] Retrying navigation to ResetPassword screen');
                    navigation.navigate('ResetPassword');
                  } else {
                    console.log('❌ [useSupabaseAuth] Navigation still not available after retry');
                  }
                }, 2000);
              }
            }
          } else {
            console.error('❌ [useSupabaseAuth] No tokens found in reset password link');
            console.log('🔍 [useSupabaseAuth] URL:', url);
            Alert.alert(
              'שגיאה',
              'קישור איפוס הסיסמה לא תקין. אנא נסה שוב.',
              [{ text: 'הבנתי', style: 'default' }]
            );
          }
        } catch (error) {
          console.error('❌ [useSupabaseAuth] Password reset deep link error:', error);
          Alert.alert(
            'שגיאה',
            'אירעה שגיאה בעיבוד קישור איפוס הסיסמה.',
            [{ text: 'הבנתי', style: 'default' }]
          );
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
        console.log('🔗 [useSupabaseAuth] App opened with deep link:', url);
        handleDeepLink(url);
      }
    });

    return () => {
      subscription.unsubscribe();
      subscription2?.remove();
    };
  }, [navigation]);

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
    setNavigationRef,
  };
} 