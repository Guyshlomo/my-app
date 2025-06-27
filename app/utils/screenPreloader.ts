// Screen Preloader - Prepares data for screens before navigation
import { cacheManager } from './cacheManager';
import { cacheWarmer } from './cacheWarmer';
import { volunteerEventsManager } from './volunteerEvents';
import { getCurrentUserFromSupabase, getAllVolunteerEvents, getEventRegistrations } from '../db/supabaseApi';

interface PreloadJob {
  screenName: string;
  priority: number;
  loader: () => Promise<void>;
}

class ScreenPreloader {
  private preloadQueue: PreloadJob[] = [];
  private isPreloading = false;
  private preloadedScreens = new Set<string>();

  // Add screen to preload queue
  queuePreload(screenName: string, priority: number, loader: () => Promise<void>): void {
    // Don't queue if already preloaded
    if (this.preloadedScreens.has(screenName)) {
      console.log(`📱 Screen ${screenName} already preloaded`);
      return;
    }

    // Remove existing job for same screen
    this.preloadQueue = this.preloadQueue.filter(job => job.screenName !== screenName);
    
    // Add new job
    this.preloadQueue.push({ screenName, priority, loader });
    
    // Sort by priority (higher number = higher priority)
    this.preloadQueue.sort((a, b) => b.priority - a.priority);
    
    console.log(`📱 Queued preload for ${screenName} (priority: ${priority})`);
    
    // Start processing if not already running
    if (!this.isPreloading) {
      this.processQueue();
    }
  }

  // Process preload queue
  private async processQueue(): Promise<void> {
    if (this.isPreloading || this.preloadQueue.length === 0) {
      return;
    }

    this.isPreloading = true;
    console.log('📱 Starting screen preload processing...');

    while (this.preloadQueue.length > 0) {
      const job = this.preloadQueue.shift()!;
      
      try {
        console.log(`📱 Preloading ${job.screenName}...`);
        await job.loader();
        this.preloadedScreens.add(job.screenName);
        console.log(`✅ ${job.screenName} preloaded successfully`);
      } catch (error) {
        console.error(`❌ Failed to preload ${job.screenName}:`, error);
      }

      // Small delay between jobs to avoid blocking UI
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    this.isPreloading = false;
    console.log('📱 Screen preload processing completed');
  }

  // Preload specific screens based on user type and current screen
  async preloadForUser(currentScreen: string, userId: string, isAdmin: boolean): Promise<void> {
    console.log(`📱 Preloading screens for ${currentScreen} (admin: ${isAdmin})`);

    switch (currentScreen) {
      case 'Home':
        if (isAdmin) {
          this.queuePreload('AdminUsers', 8, () => this.preloadAdminUsersScreen(userId));
        } else {
          this.queuePreload('Volunteer', 9, () => this.preloadVolunteerScreen(userId));
          this.queuePreload('Trophy', 7, () => this.preloadTrophyScreen(userId));
          this.queuePreload('Gift', 6, () => this.preloadGiftScreen(userId));
        }
        break;

      case 'Volunteer':
        this.queuePreload('Home', 8, () => this.preloadHomeScreen(userId, isAdmin));
        this.queuePreload('Calendar', 7, () => this.preloadCalendarScreen(userId));
        break;

      case 'Login':
        // After login, preload main screens
        this.queuePreload('Home', 10, () => this.preloadHomeScreen(userId, isAdmin));
        if (!isAdmin) {
          this.queuePreload('Volunteer', 9, () => this.preloadVolunteerScreen(userId));
        }
        break;
    }
  }

  // Preload Home screen data
  private async preloadHomeScreen(userId: string, isAdmin: boolean): Promise<void> {
    const cachedUser = cacheManager.getUserData();
    if (!cachedUser) {
      await cacheWarmer.refreshCache('user');
    }

    if (isAdmin) {
      const cachedEvents = cacheManager.getAdminEvents(userId);
      if (!cachedEvents) {
        await cacheWarmer.refreshCache('admin', userId);
      }
    }
  }

  // Preload Volunteer screen data
  private async preloadVolunteerScreen(userId: string): Promise<void> {
    const cachedEvents = cacheManager.getVolunteerEvents();
    const cachedRegistrations = cacheManager.getUserRegistrations(userId);

    if (!cachedEvents || !cachedRegistrations) {
      await cacheWarmer.refreshCache('volunteer', userId);
    }

    // Preload event registrations for expanded events
    try {
      const events = cachedEvents || await volunteerEventsManager.getAllEvents();
      const topEvents = events.slice(0, 3); // Preload top 3 events
      
      for (const event of topEvents) {
        const registrations = await getEventRegistrations(event.id);
        cacheManager.set(`event_registrations_${event.id}`, registrations, 20000);
      }
    } catch (error) {
      console.error('Failed to preload event registrations:', error);
    }
  }

  // Preload AdminUsers screen data
  private async preloadAdminUsersScreen(userId: string): Promise<void> {
    const cachedEvents = cacheManager.getAdminEvents(userId);
    const cachedRegistrations = cacheManager.getAdminRegistrations(userId);

    if (!cachedEvents || !cachedRegistrations) {
      await cacheWarmer.refreshCache('admin', userId);
    }
  }

  // Preload Trophy screen data
  private async preloadTrophyScreen(userId: string): Promise<void> {
    // Trophy screen uses user data which should already be cached
    const cachedUser = cacheManager.getUserData();
    if (!cachedUser) {
      await cacheWarmer.refreshCache('user');
    }
  }

  // Preload Gift screen data
  private async preloadGiftScreen(userId: string): Promise<void> {
    // Gift screen uses user data which should already be cached
    const cachedUser = cacheManager.getUserData();
    if (!cachedUser) {
      await cacheWarmer.refreshCache('user');
    }
  }

  // Preload Calendar screen data
  private async preloadCalendarScreen(userId: string): Promise<void> {
    // Calendar uses volunteer events data
    const cachedEvents = cacheManager.getVolunteerEvents();
    if (!cachedEvents) {
      await cacheWarmer.refreshCache('volunteer', userId);
    }
  }

  // Clear preload state for a screen (when screen is actually visited)
  markScreenVisited(screenName: string): void {
    this.preloadedScreens.add(screenName);
    console.log(`📱 Marked ${screenName} as visited`);
  }

  // Clear all preload state
  clearPreloadState(): void {
    this.preloadQueue = [];
    this.preloadedScreens.clear();
    this.isPreloading = false;
    console.log('📱 Cleared all preload state');
  }
}

// Export singleton instance
export const screenPreloader = new ScreenPreloader(); 