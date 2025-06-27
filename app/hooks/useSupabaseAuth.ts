import { useState, useEffect } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { User } from '../types/types';
import { 
  loginWithSupabase, 
  signupWithSupabase, 
  getCurrentUserFromSupabase, 
  logoutFromSupabase 
} from '../db/supabaseApi';

interface UseSupabaseAuthReturn {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    settlement?: string;
    birthDate?: Date;
  }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useSupabaseAuth = (): UseSupabaseAuthReturn => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        console.log('🔐 [Auth Hook] Getting initial session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [Auth Hook] Session error:', error);
          if (mounted) {
            setSession(null);
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setSession(session);
          
          if (session?.user) {
            console.log('✅ [Auth Hook] Session found, loading user profile...');
            const currentUser = await getCurrentUserFromSupabase();
            setUser(currentUser);
          } else {
            console.log('ℹ️ [Auth Hook] No session found');
            setUser(null);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ [Auth Hook] Failed to get initial session:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    }

    getInitialSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [Auth Hook] Auth state changed:', event, session?.user?.id);
      
      if (mounted) {
        setSession(session);
        
        if (session?.user && event !== 'SIGNED_OUT') {
          console.log('👤 [Auth Hook] Loading user profile after auth change...');
          const currentUser = await getCurrentUserFromSupabase();
          setUser(currentUser);
        } else {
          console.log('🚪 [Auth Hook] User signed out or no session');
          setUser(null);
        }
        
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign up function
  const signUp = async (params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    settlement?: string;
    birthDate?: Date;
  }) => {
    try {
      setLoading(true);
      console.log('📝 [Auth Hook] Starting signup...');
      
      await signupWithSupabase(params);
      
      console.log('✅ [Auth Hook] Signup completed');
      // The auth state change listener will handle updating the user state
    } catch (error) {
      console.error('❌ [Auth Hook] Signup failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔐 [Auth Hook] Starting signin...');
      
      const user = await loginWithSupabase({ email, password });
      
      console.log('✅ [Auth Hook] Signin completed:', user?.isAdmin);
      // The auth state change listener will handle updating the user state
    } catch (error) {
      console.error('❌ [Auth Hook] Signin failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      console.log('🚪 [Auth Hook] Starting signout...');
      
      await logoutFromSupabase();
      
      console.log('✅ [Auth Hook] Signout completed');
      // The auth state change listener will handle clearing the user state
    } catch (error) {
      console.error('❌ [Auth Hook] Signout failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Refresh user function
  const refreshUser = async () => {
    try {
      console.log('🔄 [Auth Hook] Refreshing user...');
      
      if (session?.user) {
        const currentUser = await getCurrentUserFromSupabase();
        setUser(currentUser);
        console.log('✅ [Auth Hook] User refreshed:', currentUser?.isAdmin);
      } else {
        console.log('ℹ️ [Auth Hook] No session to refresh');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ [Auth Hook] Failed to refresh user:', error);
    }
  };

  return {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
    refreshUser,
  };
}; 