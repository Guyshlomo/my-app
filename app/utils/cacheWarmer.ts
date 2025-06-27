// Cache Warmer - Preloads data for faster navigation
import { cacheManager } from './cacheManager';
import { getCurrentUserFromSupabase, getAllVolunteerEvents, getVolunteerEventsByAdmin, getAllVolunteerRegistrations } from '../db/supabaseApi';
import { volunteerEventsManager } from './volunteerEvents';

class CacheWarmer {
  private isWarming = false;

  // Warm up all essential data after login
  async warmCache(): Promise<void> {
    if (this.isWarming) {
      console.log('🔥 Cache warming already in progress');
      return;
    }

    this.isWarming = true;
    console.log('🔥 Starting cache warming...');

    try {
      // 1. Load user data first (highest priority)
      const user = await getCurrentUserFromSupabase();
      if (!user) {
        console.log('❌ No user found, skipping cache warming');
        return;
      }

      cacheManager.setUserData(user);
      console.log('✅ User data cached');

      // 2. Load data based on user type
      if (user.isAdmin) {
        await this.warmAdminCache(user.id);
      } else {
        await this.warmUserCache(user.id);
      }

      console.log('🔥 Cache warming completed successfully');
    } catch (error) {
      console.error('❌ Cache warming failed:', error);
    } finally {
      this.isWarming = false;
    }
  }

  // Warm admin-specific data
  private async warmAdminCache(adminId: string): Promise<void> {
    try {
      console.log('👑 Warming admin cache...');
      
      const [events, allRegistrations] = await Promise.all([
        getVolunteerEventsByAdmin(adminId),
        getAllVolunteerRegistrations()
      ]);

      // Filter registrations to only include those for events created by this admin
      const adminEventIds = events.map(event => event.id);
      const filteredRegistrations = allRegistrations.filter(registration => 
        adminEventIds.includes(registration.event_id)
      );

      cacheManager.setAdminData(events, filteredRegistrations, adminId);
      console.log('✅ Admin data cached');
    } catch (error) {
      console.error('❌ Failed to warm admin cache:', error);
    }
  }

  // Warm user-specific data
  private async warmUserCache(userId: string): Promise<void> {
    try {
      console.log('👤 Warming user cache...');
      
      const [events, registrations] = await Promise.all([
        volunteerEventsManager.getAllEvents(),
        volunteerEventsManager.getUserRegistrations(userId)
      ]);

      cacheManager.setVolunteerData(events, registrations, userId);
      console.log('✅ User volunteer data cached');
    } catch (error) {
      console.error('❌ Failed to warm user cache:', error);
    }
  }

  // Refresh specific data type
  async refreshCache(dataType: 'user' | 'admin' | 'volunteer', userId?: string): Promise<void> {
    console.log(`🔄 Refreshing ${dataType} cache...`);
    
    try {
      switch (dataType) {
        case 'user':
          const user = await getCurrentUserFromSupabase();
          if (user) {
            cacheManager.setUserData(user);
            console.log('✅ User cache refreshed');
          }
          break;
          
        case 'admin':
          if (userId) {
            await this.warmAdminCache(userId);
          }
          break;
          
        case 'volunteer':
          if (userId) {
            await this.warmUserCache(userId);
          }
          break;
      }
    } catch (error) {
      console.error(`❌ Failed to refresh ${dataType} cache:`, error);
    }
  }

  // Clear and rewarm cache
  async rewarmCache(): Promise<void> {
    console.log('🔥 Rewarming cache...');
    cacheManager.clear();
    await this.warmCache();
  }
}

// Export singleton instance
export const cacheWarmer = new CacheWarmer(); 