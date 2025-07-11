import { supabase } from '../config/supabase';
import type { User, VolunteerEvent, VolunteerRegistration } from '../types/types';

// ===== AUTHENTICATION FUNCTIONS =====

// Sign up with Supabase Auth
export async function signupWithSupabase({
  email,
  password,
  firstName,
  lastName,
  profileImage,
  avatarSeed,
  avatarStyle,
  settlement,
  birthDate,
  showEmail = true
}: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  avatarSeed?: string;
  avatarStyle?: string;
  settlement?: string;
  birthDate?: Date;
  showEmail?: boolean;
}) {
  try {
    console.log('🔐 [Supabase] Starting signup process...');
    
    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('❌ [Supabase] Auth signup error:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('No user returned from signup');
    }

    console.log('✅ [Supabase] Auth user created:', authData.user.id);

    // Step 2: Create profile in users table
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: email,
          firstname: firstName,
          lastname: lastName,
          coins: 0,
          taskcompleted: 0,
          isadmin: false,
          profileimage: profileImage,
          avatar_seed: avatarSeed,
          avatar_style: avatarStyle,
          settlement: settlement || null,
          birthdate: birthDate?.toISOString() || null,
          show_email: showEmail,
        }
      ]);

    if (profileError) {
      console.error('❌ [Supabase] Profile creation error:', profileError);
      throw profileError;
    }

    console.log('✅ [Supabase] User profile created successfully');
    return authData.user;
  } catch (error) {
    console.error('❌ [Supabase] Signup failed:', error);
    throw error;
  }
}

// Login with Supabase Auth
export async function loginWithSupabase({ email, password }: { email: string; password: string }) {
  try {
    console.log('🔐 [Supabase] Starting login process...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ [Supabase] Login error:', error);
      throw error;
    }

    if (!data.user) {
      throw new Error('No user returned from login');
    }

    console.log('✅ [Supabase] Login successful:', data.user.id);
    
    // Get user profile with admin status
    const userProfile = await getCurrentUserFromSupabase();
    return userProfile;
  } catch (error) {
    console.error('❌ [Supabase] Login failed:', error);
    throw error;
  }
}

// Get current user from Supabase
export async function getCurrentUserFromSupabase(): Promise<User | null> {
  try {
    console.log('🔍 [Supabase] Getting current user...');
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ [Supabase] No authenticated user:', authError);
      return null;
    }

    console.log('✅ [Supabase] Authenticated user found:', user.id);

    // Get user profile from users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ [Supabase] Profile error:', profileError);
      throw profileError;
    }

    if (!profile) {
      console.error('❌ [Supabase] No profile found for user:', user.id);
      return null;
    }

    console.log('✅ [Supabase] User profile loaded:', {
      id: profile.id,
      email: profile.email,
      isadmin: profile.isadmin
    });

    // Convert to frontend User format
    const userObj: User = {
      id: profile.id,
      email: profile.email,
      firstName: profile.firstname || '',
      lastName: profile.lastname || '',
      coins: profile.coins || 0,
      tasksCompleted: profile.taskcompleted || 0,
      isAdmin: profile.isadmin || false,
      profileImage: profile.profileimage,
      settlement: profile.settlement,
      birthDate: profile.birthdate,
      avatar_seed: profile.avatar_seed,
      avatar_style: profile.avatar_style,
      showEmail: profile.show_email ?? true,
    };

    console.log('🔄 [Supabase] Converted user:', {
      isAdmin: userObj.isAdmin,
      name: userObj.firstName
    });

    return userObj;
  } catch (error) {
    console.error('❌ [Supabase] Get current user failed:', error);
    return null;
  }
}

// Logout
export async function logoutFromSupabase() {
  try {
    console.log('🚪 [Supabase] Logging out...');
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ [Supabase] Logout error:', error);
      throw error;
    }
    
    console.log('✅ [Supabase] Logout successful');
    return true;
  } catch (error) {
    console.error('❌ [Supabase] Logout failed:', error);
    throw error;
  }
}

// Reset password
export async function resetPasswordWithSupabase(email: string) {
  try {
    console.log('🔐 [Supabase] Sending password reset email...');
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'voluntree://reset-password', // Deep link for mobile app
    });
    
    if (error) {
      console.error('❌ [Supabase] Password reset error:', error);
      throw error;
    }
    
    console.log('✅ [Supabase] Password reset email sent successfully');
    return true;
  } catch (error) {
    console.error('❌ [Supabase] Password reset failed:', error);
    throw error;
  }
}

// Social Authentication Functions

// Sign in with Google
export async function signInWithGoogle() {
  try {
    console.log('🔐 [Supabase] Starting Google sign-in...');
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'voluntree://auth/callback',
      },
    });
    
    if (error) {
      console.error('❌ [Supabase] Google sign-in error:', error);
      throw error;
    }
    
    console.log('✅ [Supabase] Google sign-in initiated');
    return data;
  } catch (error) {
    console.error('❌ [Supabase] Google sign-in failed:', error);
    throw error;
  }
}

// Sign in with Facebook
export async function signInWithFacebook() {
  try {
    console.log('🔐 [Supabase] Starting Facebook sign-in...');
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: 'voluntree://auth/callback',
      },
    });
    
    if (error) {
      console.error('❌ [Supabase] Facebook sign-in error:', error);
      throw error;
    }
    
    console.log('✅ [Supabase] Facebook sign-in initiated');
    return data;
  } catch (error) {
    console.error('❌ [Supabase] Facebook sign-in failed:', error);
    throw error;
  }
}

// Sign in with Apple
export async function signInWithApple() {
  try {
    console.log('🔐 [Supabase] Starting Apple sign-in...');
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: 'voluntree://auth/callback',
      },
    });
    
    if (error) {
      console.error('❌ [Supabase] Apple sign-in error:', error);
      throw error;
    }
    
    console.log('✅ [Supabase] Apple sign-in initiated');
    return data;
  } catch (error) {
    console.error('❌ [Supabase] Apple sign-in failed:', error);
    throw error;
  }
}

// Handle OAuth callback and create user profile if needed
export async function handleOAuthCallback() {
  try {
    console.log('🔄 [Supabase] Handling OAuth callback...');
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error('❌ [Supabase] OAuth callback error:', error);
      throw error || new Error('No user found after OAuth');
    }
    
    console.log('✅ [Supabase] OAuth user found:', user.id);
    
    // Check if user profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ [Supabase] Profile check error:', profileError);
      throw profileError;
    }
    
    // Create profile if it doesn't exist
    if (!existingProfile) {
      console.log('📝 [Supabase] Creating new user profile...');
      
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: user.id,
            email: user.email || '',
            firstname: user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.name || '',
            lastname: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            coins: 0,
            taskcompleted: 0,
            isadmin: false,
            profileimage: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            show_email: true,
          }
        ]);
      
      if (insertError) {
        console.error('❌ [Supabase] Profile creation error:', insertError);
        throw insertError;
      }
      
      console.log('✅ [Supabase] New user profile created');
    }
    
    // Get the complete user profile
    const userProfile = await getCurrentUserFromSupabase();
    console.log('✅ [Supabase] OAuth authentication completed');
    
    return userProfile;
  } catch (error) {
    console.error('❌ [Supabase] OAuth callback failed:', error);
    throw error;
  }
}

// Delete user account
export async function deleteUserAccount(userId: string) {
  try {
    console.log('🗑️ [Supabase] Deleting user account:', userId);
    
    // Delete user profile from users table
    const { error: profileError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('❌ [Supabase] Profile deletion error:', profileError);
      throw profileError;
    }

    console.log('✅ [Supabase] User account deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ [Supabase] Delete user account failed:', error);
    throw error;
  }
}

// ===== USER MANAGEMENT FUNCTIONS =====

// Update user data
export async function updateUserInSupabase(userId: string, userData: Partial<{
  coins: number;
  taskcompleted: number;
  firstname: string;
  lastname: string;
  profileimage: string;
  settlement: string;
  birthdate: string;
}>) {
  try {
    console.log('📝 [Supabase] Updating user:', userId, userData);
    
    const { error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', userId);

    if (error) {
      console.error('❌ [Supabase] Update error:', error);
      throw error;
    }

    console.log('✅ [Supabase] User updated successfully');
    return true;
  } catch (error) {
    console.error('❌ [Supabase] Update failed:', error);
    throw error;
  }
}

// Set user as admin
export async function setUserAsAdminInSupabase(userId: string, isAdmin: boolean) {
  try {
    console.log('👑 [Supabase] Setting admin status:', userId, isAdmin);
    
    const { error } = await supabase
      .from('users')
      .update({ isadmin: isAdmin })
      .eq('id', userId);

    if (error) {
      console.error('❌ [Supabase] Admin update error:', error);
      throw error;
    }

    console.log('✅ [Supabase] Admin status updated successfully');
    return true;
  } catch (error) {
    console.error('❌ [Supabase] Admin update failed:', error);
    throw error;
  }
}

// Get all users (admin only)
export async function getAllUsersFromSupabase(): Promise<User[]> {
  try {
    console.log('👥 [Supabase] Getting all users...');
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('email', { ascending: true });

    if (error) {
      console.error('❌ [Supabase] Get users error:', error);
      throw error;
    }

    console.log('✅ [Supabase] Users loaded:', data?.length || 0);

    // Convert to frontend User format
    const users: User[] = (data || []).map(profile => ({
      id: profile.id,
      email: profile.email,
      firstName: profile.firstname || '',
      lastName: profile.lastname || '',
      coins: profile.coins || 0,
      tasksCompleted: profile.taskcompleted || 0,
      isAdmin: profile.isadmin || false,
      profileImage: profile.profileimage,
      settlement: profile.settlement,
      birthDate: profile.birthdate,
      avatar_seed: profile.avatar_seed,
      avatar_style: profile.avatar_style,
    }));

    return users;
  } catch (error) {
    console.error('❌ [Supabase] Get all users failed:', error);
    throw error;
  }
}

// ===== VOLUNTEER EVENT FUNCTIONS =====

// Get all volunteer events (optionally filtered by user settlement)
export async function getAllVolunteerEvents(userSettlement?: string): Promise<VolunteerEvent[]> {
  try {
    console.log('📅 [Supabase] Getting volunteer events...', userSettlement ? `for settlement: ${userSettlement}` : 'all events');
    
    let query = supabase
      .from('volunteer_events')
      .select('*');
    
    // Filter by location matching user's settlement
    if (userSettlement) {
      query = query.eq('location', userSettlement);
    }
    
    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      console.error('❌ [Supabase] Get events error:', error);
      throw error;
    }

    console.log('✅ [Supabase] Events loaded:', data?.length || 0);

    // Convert to frontend VolunteerEvent format with admin names
    const events: VolunteerEvent[] = [];
    
    for (const event of data || []) {
      let adminName = 'לא ידוע';
      
      // Try to get admin user info
      if (event.created_by) {
        try {
          const { data: adminUser } = await supabase
            .from('users')
            .select('firstname, lastname')
            .eq('id', event.created_by)
            .single();
          
          if (adminUser) {
            adminName = `${adminUser.firstname} ${adminUser.lastname}`;
          }
        } catch (error) {
          console.warn('Could not fetch admin name for event:', event.id);
        }
      }
      
      events.push({
        id: event.id,
        title: event.title,
        description: event.description || '',
        date: event.date,
        time: event.time || '00:00',
        location: event.location,
        max_participants: event.max_participants,
        current_participants: event.current_participants || 0,
        coins_reward: event.coins_reward,
        created_by: event.created_by,
        created_at: new Date().toISOString(), // Default value since DB doesn't have this column
        updated_at: new Date().toISOString(), // Default value since DB doesn't have this column
        is_active: event.is_active,
        image_url: event.image_url,
        admin_name: adminName,
      });
    }

    return events;
  } catch (error) {
    console.error('❌ [Supabase] Get all events failed:', error);
    throw error;
  }
}

// Get volunteer events for specific user (filtered by location matching user's settlement)
export async function getVolunteerEventsForUser(userSettlement?: string): Promise<VolunteerEvent[]> {
  try {
    console.log('🏘️ [Supabase] Getting volunteer events for user settlement:', userSettlement);
    console.log('📍 [Supabase] Filtering by location field in volunteer_events table');
    
    if (!userSettlement) {
      console.log('⚠️ [Supabase] No settlement provided, returning all events');
      return getAllVolunteerEvents();
    }
    
    return getAllVolunteerEvents(userSettlement);
  } catch (error) {
    console.error('❌ [Supabase] Get events for user failed:', error);
    throw error;
  }
}

// Get volunteer events created by specific admin
export async function getVolunteerEventsByAdmin(adminId: string): Promise<VolunteerEvent[]> {
  try {
    console.log('👑 [Supabase] Getting volunteer events for admin:', adminId);
    
    const { data, error } = await supabase
      .from('volunteer_events')
      .select('*')
      .eq('created_by', adminId)
      .order('date', { ascending: false });

    if (error) {
      console.error('❌ [Supabase] Get admin events error:', error);
      throw error;
    }

    console.log('✅ [Supabase] Admin events loaded:', data?.length || 0);

    // Convert to frontend VolunteerEvent format with admin names
    const events: VolunteerEvent[] = [];
    
    for (const event of data || []) {
      let adminName = 'לא ידוע';
      
      // Try to get admin user info
      if (event.created_by) {
        try {
          const { data: adminUser } = await supabase
            .from('users')
            .select('firstname, lastname')
            .eq('id', event.created_by)
            .single();
          
          if (adminUser) {
            adminName = `${adminUser.firstname} ${adminUser.lastname}`;
          }
        } catch (error) {
          console.warn('Could not fetch admin name for event:', event.id);
        }
      }
      
      events.push({
        id: event.id,
        title: event.title,
        description: event.description || '',
        date: event.date,
        time: event.time || '00:00',
        location: event.location,
        max_participants: event.max_participants,
        current_participants: event.current_participants || 0,
        coins_reward: event.coins_reward,
        created_by: event.created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: event.is_active,
        image_url: event.image_url,
        admin_name: adminName,
      });
    }

    return events;
  } catch (error) {
    console.error('❌ [Supabase] Get admin events failed:', error);
    throw error;
  }
}

// Get all volunteer registrations
export async function getAllVolunteerRegistrations(): Promise<VolunteerRegistration[]> {
  try {
    console.log('📋 [Supabase] Getting all volunteer registrations...');
    
    const { data, error } = await supabase
      .from('volunteer_registrations')
      .select(`
        *,
        users!inner(firstname, lastname, email)
      `)
      .order('registered_at', { ascending: false });

    if (error) {
      console.error('❌ [Supabase] Get registrations error:', error);
      throw error;
    }

    console.log('✅ [Supabase] Registrations loaded:', data?.length || 0);

    // Convert to frontend VolunteerRegistration format
    const registrations: VolunteerRegistration[] = (data || []).map(reg => ({
      id: reg.id,
      user_id: reg.user_id,
      event_id: reg.event_id,
      registered_at: reg.registered_at,
      status: reg.status,
      user_name: `${reg.users.firstname} ${reg.users.lastname}`,
      user_email: reg.users.email,
    }));

    return registrations;
  } catch (error) {
    console.error('❌ [Supabase] Get all registrations failed:', error);
    throw error;
  }
}

// Get registrations for a specific event
export async function getEventRegistrations(eventId: string): Promise<VolunteerRegistration[]> {
  try {
    console.log('📋 [Supabase] Getting registrations for event:', eventId);
    
    const { data, error } = await supabase
      .from('volunteer_registrations')
      .select(`
        *,
        users!inner(firstname, lastname, email)
      `)
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false });

    if (error) {
      console.error('❌ [Supabase] Get event registrations error:', error);
      throw error;
    }

    console.log('✅ [Supabase] Event registrations loaded:', data?.length || 0);

    // Convert to frontend VolunteerRegistration format
    const registrations: VolunteerRegistration[] = (data || []).map(reg => ({
      id: reg.id,
      user_id: reg.user_id,
      event_id: reg.event_id,
      registered_at: reg.registered_at,
      status: reg.status,
      user_name: `${reg.users.firstname} ${reg.users.lastname}`,
      user_email: reg.users.email,
      users: {
        firstname: reg.users.firstname,
        lastname: reg.users.lastname,
        email: reg.users.email
      }
    }));

    return registrations;
  } catch (error) {
    console.error('❌ [Supabase] Get event registrations failed:', error);
    throw error;
  }
}

// Complete volunteer event (mark as completed)
export async function completeVolunteerEvent(eventId: string, userIds: string[]) {
  try {
    console.log('✅ [Supabase] Completing volunteer event:', eventId, 'for users:', userIds);
    
    // Update volunteer registrations to completed status
    const { error } = await supabase
      .from('volunteer_registrations')
      .update({ status: 'completed' })
      .eq('event_id', eventId)
      .in('user_id', userIds);

    if (error) {
      console.error('❌ [Supabase] Complete event error:', error);
      throw error;
    }

    console.log('✅ [Supabase] Event completed successfully');
    return true;
  } catch (error) {
    console.error('❌ [Supabase] Complete event failed:', error);
    throw error;
  }
}

// Delete volunteer event
export async function deleteVolunteerEvent(eventId: string) {
  try {
    console.log('🗑️ [Supabase] Deleting volunteer event:', eventId);
    
    // First delete all registrations for this event
    await supabase
      .from('volunteer_registrations')
      .delete()
      .eq('event_id', eventId);

    // Then delete the event itself
    const { error } = await supabase
      .from('volunteer_events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('❌ [Supabase] Delete event error:', error);
      throw error;
    }

    console.log('✅ [Supabase] Event deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ [Supabase] Delete event failed:', error);
    throw error;
  }
}

// Deactivate volunteer event
export async function deactivateVolunteerEvent(eventId: string) {
  try {
    console.log('⏸️ [Supabase] Deactivating volunteer event:', eventId);
    
    const { error } = await supabase
      .from('volunteer_events')
      .update({ is_active: false })
      .eq('id', eventId);

    if (error) {
      console.error('❌ [Supabase] Deactivate event error:', error);
      throw error;
    }

    console.log('✅ [Supabase] Event deactivated successfully');
    return true;
  } catch (error) {
    console.error('❌ [Supabase] Deactivate event failed:', error);
    throw error;
  }
}

// Create volunteer event
export async function createVolunteerEvent(eventData: {
  title: string;
  description: string;
  date: string;
  location: string;
  max_participants: number;
  coins_reward: number;
  settlement?: string;
  created_by: string;
}) {
  try {
    console.log('➕ [Supabase] Creating volunteer event:', eventData.title);
    
    const { data, error } = await supabase
      .from('volunteer_events')
      .insert([{
        ...eventData,
        is_active: true,
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ [Supabase] Create event error:', error);
      throw error;
    }

    console.log('✅ [Supabase] Event created successfully:', data.id);
    
    // Send push notifications to users in the target settlement
    try {
      const { sendNewEventNotification } = await import('../utils/pushNotifications');
      
      console.log('📢 [Supabase] Sending push notifications for new event...');
      const notificationSuccess = await sendNewEventNotification(
        {
          id: data.id,
          title: data.title,
          location: data.location,
          date: data.date,
          time: data.time || '00:00',
          description: data.description,
        },
        data.location // Use location as the target settlement
      );
      
      if (notificationSuccess) {
        console.log('✅ [Supabase] Push notifications sent successfully');
      } else {
        console.warn('⚠️ [Supabase] Push notifications failed, but event was created');
      }
    } catch (pushError) {
      console.error('❌ [Supabase] Push notification error:', pushError);
      // Don't throw - event creation succeeded, notification failure is not critical
    }
    
    return data;
  } catch (error) {
    console.error('❌ [Supabase] Create event failed:', error);
    throw error;
  }
}

// Update volunteer event
export async function updateVolunteerEvent(eventId: string, eventData: {
  title: string;
  description: string;
  date: string;
  location: string;
  time: string;
  max_participants: number;
  coins_reward: number;
  image_url?: string;
}) {
  try {
    console.log('✏️ [Supabase] Updating volunteer event:', eventId);
    
    const { data, error } = await supabase
      .from('volunteer_events')
      .update({
        title: eventData.title,
        description: eventData.description,
        date: eventData.date,
        location: eventData.location,
        time: eventData.time,
        max_participants: eventData.max_participants,
        coins_reward: eventData.coins_reward,
        image_url: eventData.image_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('❌ [Supabase] Update event error:', error);
      throw error;
    }

    console.log('✅ [Supabase] Event updated successfully:', data.id);
    return data;
  } catch (error) {
    console.error('❌ [Supabase] Update event failed:', error);
    throw error;
  }
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  try {
    console.log('👤 [Supabase] Getting user by ID:', userId);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ [Supabase] Get user by ID error:', error);
      throw error;
    }

    if (!data) {
      console.log('ℹ️ [Supabase] User not found:', userId);
      return null;
    }

    // Convert to frontend User format
    const user: User = {
      id: data.id,
      email: data.email,
      firstName: data.firstname || '',
      lastName: data.lastname || '',
      coins: data.coins || 0,
      tasksCompleted: data.taskcompleted || 0,
      isAdmin: data.isadmin || false,
      profileImage: data.profileimage,
      settlement: data.settlement,
      birthDate: data.birthdate,
    };

    console.log('✅ [Supabase] User found:', user.firstName);
    return user;
  } catch (error) {
    console.error('❌ [Supabase] Get user by ID failed:', error);
    return null;
  }
}

// Update event participant count
async function updateEventParticipantCount(eventId: string) {
  try {
    console.log('🔢 [Supabase] Updating participant count for event:', eventId);
    
    // Count current registrations for this event
    const { count, error: countError } = await supabase
      .from('volunteer_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'registered');

    if (countError) {
      console.error('❌ [Supabase] Error counting registrations:', countError);
      throw countError;
    }

    // Update the event's current_participants field
    const { error: updateError } = await supabase
      .from('volunteer_events')
      .update({ current_participants: count || 0 })
      .eq('id', eventId);

    if (updateError) {
      console.error('❌ [Supabase] Error updating participant count:', updateError);
      throw updateError;
    }

    console.log('✅ [Supabase] Updated participant count to:', count || 0);
  } catch (error) {
    console.error('❌ [Supabase] Update participant count failed:', error);
    // Don't throw here - this is not critical for registration
  }
}

// Register for volunteer event
export async function registerForVolunteerEvent(eventId: string, userId: string) {
  try {
    console.log('📝 [Supabase] Registering for volunteer event:', eventId, userId);
    
    // Test table access first
    console.log('🔍 [Supabase] Testing volunteer_registrations table access...');
    const { data: testData, error: testError } = await supabase
      .from('volunteer_registrations')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ [Supabase] Table access test failed:', testError);
      throw new Error(`Table 'volunteer_registrations' access failed: ${testError.message}`);
    }
    
    console.log('✅ [Supabase] Table access test passed');
    
    // First check if already registered
    const { data: existingRegistration, error: checkError } = await supabase
      .from('volunteer_registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ [Supabase] Error checking existing registration:', checkError);
      throw checkError;
    }

    if (existingRegistration) {
      console.log('⚠️ [Supabase] User already registered for this event');
      throw new Error('כבר נרשמת להתנדבות זו');
    }

    const insertData = {
      event_id: eventId,
      user_id: userId,
      status: 'registered',
      registered_at: new Date().toISOString(),
    };

    console.log('📝 [Supabase] Inserting registration data:', insertData);

    const { data, error } = await supabase
      .from('volunteer_registrations')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('❌ [Supabase] Register for event error:', error);
      console.error('❌ [Supabase] Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('✅ [Supabase] Registered for event successfully:', data);
    
    // Update event current_participants count
    await updateEventParticipantCount(eventId);
    
    return data;
  } catch (error) {
    console.error('❌ [Supabase] Register for event failed:', error);
    throw error;
  }
}

// Cancel volunteer registration
export async function cancelVolunteerRegistration(eventId: string, userId: string) {
  try {
    console.log('❌ [Supabase] Cancelling volunteer registration:', eventId, userId);
    
    const { error } = await supabase
      .from('volunteer_registrations')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ [Supabase] Cancel registration error:', error);
      throw error;
    }

    console.log('✅ [Supabase] Registration cancelled successfully');
    
    // Update event current_participants count
    await updateEventParticipantCount(eventId);
    
    return true;
  } catch (error) {
    console.error('❌ [Supabase] Cancel registration failed:', error);
    throw error;
  }
}

// Get user volunteer registrations
export async function getUserVolunteerRegistrations(userId: string): Promise<VolunteerRegistration[]> {
  try {
    console.log('📋 [Supabase] Getting user volunteer registrations:', userId);
    
    const { data, error } = await supabase
      .from('volunteer_registrations')
      .select(`
        *,
        volunteer_events!inner(title, description, date, time, location, max_participants, current_participants, coins_reward, created_by, created_at, updated_at, is_active)
      `)
      .eq('user_id', userId)
      .order('registered_at', { ascending: false });

    if (error) {
      console.error('❌ [Supabase] Get user registrations error:', error);
      throw error;
    }

    console.log('✅ [Supabase] User registrations loaded:', data?.length || 0);

    // Convert to frontend VolunteerRegistration format with admin names
    const registrations: VolunteerRegistration[] = [];
    
    for (const reg of data || []) {
      let adminName = 'לא ידוע';
      
      // Try to get admin user info
      if (reg.volunteer_events.created_by) {
        try {
          const { data: adminUser } = await supabase
            .from('users')
            .select('firstname, lastname')
            .eq('id', reg.volunteer_events.created_by)
            .single();
          
          if (adminUser) {
            adminName = `${adminUser.firstname} ${adminUser.lastname}`;
          }
        } catch (error) {
          console.warn('Could not fetch admin name for registration:', reg.id);
        }
      }
      
      registrations.push({
        id: reg.id,
        user_id: reg.user_id,
        event_id: reg.event_id,
        registered_at: reg.registered_at,
        status: reg.status,
        volunteer_events: {
          id: reg.event_id,
          title: reg.volunteer_events.title,
          description: reg.volunteer_events.description || '',
          location: reg.volunteer_events.location,
          date: reg.volunteer_events.date,
          time: reg.volunteer_events.time || '00:00',
          max_participants: reg.volunteer_events.max_participants || 0,
          current_participants: reg.volunteer_events.current_participants || 0,
          coins_reward: reg.volunteer_events.coins_reward || 0,
          created_by: reg.volunteer_events.created_by || '',
          created_at: reg.volunteer_events.created_at || '',
          updated_at: reg.volunteer_events.updated_at || '',
          is_active: reg.volunteer_events.is_active ?? true,
          admin_name: adminName
        }
      });
    }

    return registrations;
  } catch (error) {
    console.error('❌ [Supabase] Get user registrations failed:', error);
    throw error;
  }
}

// Get all user volunteer registrations (for admin)
export async function getAllUserVolunteerRegistrations(): Promise<VolunteerRegistration[]> {
  try {
    console.log('📋 [Supabase] Getting all user volunteer registrations...');
    
    const { data, error } = await supabase
      .from('volunteer_registrations')
      .select(`
        *,
        users!inner(firstname, lastname, email),
        volunteer_events!inner(title, description, date, location)
      `)
      .order('registered_at', { ascending: false });

    if (error) {
      console.error('❌ [Supabase] Get all user registrations error:', error);
      throw error;
    }

    console.log('✅ [Supabase] All user registrations loaded:', data?.length || 0);

    // Convert to frontend VolunteerRegistration format
    const registrations: VolunteerRegistration[] = (data || []).map(reg => ({
      id: reg.id,
      user_id: reg.user_id,
      event_id: reg.event_id,
      registered_at: reg.registered_at,
      status: reg.status,
      user_name: `${reg.users.firstname} ${reg.users.lastname}`,
      user_email: reg.users.email,
      event_title: reg.volunteer_events.title,
      event_description: reg.volunteer_events.description,
      event_date: reg.volunteer_events.date,
      event_location: reg.volunteer_events.location,
    }));

    return registrations;
  } catch (error) {
    console.error('❌ [Supabase] Get all user registrations failed:', error);
    throw error;
  }
}

// ===== COUPON FUNCTIONS =====

export async function getAllCoupons() {
  try {
    console.log('🎟️ [Supabase] Getting all coupons from coupons table');
    
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('❌ [Supabase] Get coupons error:', error);
      return [];
    }

    console.log('✅ [Supabase] Coupons loaded:', data?.length || 0);
    console.log('✅ [Supabase] Coupons data:', data);

    // המרה לפורמט הנדרש עבור GiftScreen
    const formattedCoupons = (data || []).map(coupon => ({
      id: coupon.id,
      title: coupon.title,
      desc: coupon.description,
      coins: coupon.coins,
      color: coupon.color
    }));

    return formattedCoupons;
  } catch (error) {
    console.error('❌ [Supabase] Get coupons failed:', error);
    return [];
  }
}

export async function getLuckyWheelCoupons() {
  const { data, error } = await supabase
    .from('luckywheel_coupons')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    console.error('❌ [Supabase] Get lucky wheel coupons error:', error);
    return [];
  }
  return data;
}

// ===== COUPON/PURCHASE FUNCTIONS =====

// Save purchased coupon
export async function savePurchasedCoupon(userId: string, couponData: {
  coupon_title: string;
  coupon_description: string;
  coins_spent: number;
  barcode?: string;
}) {
  try {
    console.log('🎟️ [Supabase] Saving purchased coupon:', couponData);
    console.log('🎟️ [Supabase] User ID:', userId);
    
    // Generate barcode if not provided
    const barcode = couponData.barcode || `LW${Date.now()}${Math.floor(Math.random() * 10000)}`;
    
    // Generate a unique coupon_id starting from 101
    const coupon_id = `${101 + Math.floor(Math.random() * 900)}`; // 101-1000
    
    const insertData = {
      coupon_id: coupon_id,
      user_id: userId,
      coupon_title: couponData.coupon_title,
      coupon_description: couponData.coupon_description,
      coins_spent: couponData.coins_spent,
      barcode: barcode,
      is_used: false,
    };
    
    console.log('🎟️ [Supabase] Insert data:', JSON.stringify(insertData, null, 2));
    
    // Test if table exists by trying to read from it first
    console.log('🎟️ [Supabase] Testing table access...');
    const { data: testData, error: testError } = await supabase
      .from('purchased_coupons')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ [Supabase] Table access test failed:', testError);
      console.error('❌ [Supabase] This might mean the table does not exist or has different columns');
      // Don't throw error, continue with insert attempt
    } else {
      console.log('✅ [Supabase] Table exists and accessible');
    }
    
    // Try different possible table names
    const possibleTableNames = ['purchased_coupons', 'coupons', 'user_coupons', 'coupon_purchases'];
    let data = null;
    let error = null;
    let successfulTable = null;
    
    for (const tableName of possibleTableNames) {
      console.log(`🎟️ [Supabase] Trying table: ${tableName}`);
      const result = await supabase
        .from(tableName)
        .upsert([insertData])
        .select()
        .single();
      
      if (!result.error) {
        data = result.data;
        error = null;
        successfulTable = tableName;
        console.log(`✅ [Supabase] Successfully used table: ${tableName}`);
        break;
      } else {
        console.log(`❌ [Supabase] Failed with table ${tableName}:`, result.error.message);
        error = result.error;
      }
    }

    if (error) {
      console.error('❌ [Supabase] Save coupon error:', error);
      throw error;
    }

    console.log('✅ [Supabase] Coupon saved successfully with barcode:', barcode);
    console.log('✅ [Supabase] Used table:', successfulTable);
    return data;
  } catch (error) {
    console.error('❌ [Supabase] Save coupon failed:', error);
    throw error;
  }
}

// Get user purchased coupons
export async function getUserPurchasedCoupons(userId: string) {
  try {
    console.log('🎟️ [Supabase] Getting user purchased coupons for userId:', userId);
    
    // Try different possible table names
    const possibleTableNames = ['purchased_coupons', 'coupons', 'user_coupons', 'coupon_purchases'];
    
    for (const tableName of possibleTableNames) {
      console.log(`🎟️ [Supabase] Trying to read from table: ${tableName}`);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: false });

      if (!error) {
        console.log('✅ [Supabase] User coupons loaded from table:', tableName);
        console.log('✅ [Supabase] Coupons count:', data?.length || 0);
        console.log('✅ [Supabase] Coupons data:', data);
        return data || [];
      } else {
        console.log(`❌ [Supabase] Failed to read from table ${tableName}:`, error.message);
      }
    }
    
    // If all tables failed
    console.error('❌ [Supabase] All table attempts failed');
    return [];
  } catch (error) {
    console.error('❌ [Supabase] Get user coupons failed:', error);
    return [];
  }
}

// Get current user's purchased coupons
export async function getCurrentUserPurchasedCoupons() {
  try {
    console.log('🎟️ [Supabase] Getting current user purchased coupons');
    
    const user = await getCurrentUserFromSupabase();
    if (!user) {
      console.error('❌ [Supabase] No current user found');
      return [];
    }
    
    const coupons = await getUserPurchasedCoupons(user.id);
    console.log('✅ [Supabase] Current user coupons loaded:', coupons.length);
    return coupons;
  } catch (error) {
    console.error('❌ [Supabase] Get current user coupons failed:', error);
    return [];
  }
}

// Mark coupon as used
export async function markCouponAsUsed(couponId: string) {
  try {
    console.log('✅ [Supabase] Marking coupon as used:', couponId);
    
    const { error } = await supabase
      .from('purchased_coupons')
      .update({ is_used: true })
      .eq('id', couponId);

    if (error) {
      console.error('❌ [Supabase] Mark coupon used error:', error);
      throw error;
    }

    console.log('✅ [Supabase] Coupon marked as used successfully');
    return true;
  } catch (error) {
    console.error('❌ [Supabase] Mark coupon used failed:', error);
    throw error;
  }
} 