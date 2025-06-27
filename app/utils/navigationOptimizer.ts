// Navigation Optimizer - Optimizes navigation by preloading screens
import { screenPreloader } from './screenPreloader';
import { cacheManager } from './cacheManager';

interface NavigationIntent {
  screenName: string;
  timestamp: number;
  params?: any;
}

class NavigationOptimizer {
  private navigationHistory: NavigationIntent[] = [];
  private currentScreen = '';
  private userId = '';
  private isAdmin = false;

  // Set current user context
  setUserContext(userId: string, isAdmin: boolean): void {
    this.userId = userId;
    this.isAdmin = isAdmin;
    console.log(`🧭 Navigation context set: userId=${userId}, isAdmin=${isAdmin}`);
  }

  // Track navigation to a screen
  trackNavigation(screenName: string, params?: any): void {
    const intent: NavigationIntent = {
      screenName,
      timestamp: Date.now(),
      params
    };

    this.navigationHistory.push(intent);
    
    // Keep only last 10 navigations
    if (this.navigationHistory.length > 10) {
      this.navigationHistory = this.navigationHistory.slice(-10);
    }

    const previousScreen = this.currentScreen;
    this.currentScreen = screenName;

    console.log(`🧭 Navigation tracked: ${previousScreen} → ${screenName}`);

    // Mark screen as visited
    screenPreloader.markScreenVisited(screenName);

    // Trigger preloading for likely next screens
    this.triggerPreloading(screenName);
  }

  // Predict and preload likely next screens
  private triggerPreloading(currentScreen: string): void {
    if (!this.userId) {
      console.log('🧭 No user context, skipping preloading');
      return;
    }

    // Immediate preloading based on current screen
    screenPreloader.preloadForUser(currentScreen, this.userId, this.isAdmin);

    // Predictive preloading based on navigation patterns
    this.predictivePreload(currentScreen);
  }

  // Predictive preloading based on user behavior
  private predictivePreload(currentScreen: string): void {
    const recentNavigations = this.navigationHistory.slice(-5);
    
    // Analyze patterns
    const screenCounts = recentNavigations.reduce((acc, nav) => {
      acc[nav.screenName] = (acc[nav.screenName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Find most visited screens
    const popularScreens = Object.entries(screenCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([screen]) => screen);

    console.log(`🧭 Popular screens for preloading: ${popularScreens.join(', ')}`);

    // Preload popular screens with lower priority
    popularScreens.forEach((screen, index) => {
      if (screen !== currentScreen) {
        const priority = 5 - index; // Decreasing priority
        screenPreloader.queuePreload(screen, priority, async () => {
          await this.preloadScreenData(screen);
        });
      }
    });
  }

  // Preload data for a specific screen
  private async preloadScreenData(screenName: string): Promise<void> {
    switch (screenName) {
      case 'Home':
        await screenPreloader.preloadForUser('Home', this.userId, this.isAdmin);
        break;
      case 'Volunteer':
        await screenPreloader.preloadForUser('Volunteer', this.userId, this.isAdmin);
        break;
      case 'Trophy':
        // Trophy screen data should already be in user cache
        break;
      case 'Gift':
        // Gift screen data should already be in user cache
        break;
      case 'AdminUsers':
        if (this.isAdmin) {
          await screenPreloader.preloadForUser('AdminUsers', this.userId, this.isAdmin);
        }
        break;
    }
  }

  // Optimize navigation by ensuring data is ready
  async optimizeNavigation(targetScreen: string, params?: any): Promise<boolean> {
    console.log(`🧭 Optimizing navigation to ${targetScreen}`);

    // Check if screen data is already cached/preloaded
    const isDataReady = this.checkScreenDataReadiness(targetScreen);
    
    if (isDataReady) {
      console.log(`✅ ${targetScreen} data is ready, navigation will be instant`);
      return true;
    }

    console.log(`⏳ ${targetScreen} data not ready, triggering urgent preload`);
    
    // Urgent preload with high priority
    return new Promise((resolve) => {
      screenPreloader.queuePreload(targetScreen, 15, async () => {
        await this.preloadScreenData(targetScreen);
        resolve(true);
      });
    });
  }

  // Check if screen data is ready for instant navigation
  private checkScreenDataReadiness(screenName: string): boolean {
    switch (screenName) {
      case 'Home':
        const userData = cacheManager.getUserData();
        if (!userData) return false;
        
        if (this.isAdmin) {
          return !!(cacheManager.getAdminEvents(this.userId) && cacheManager.getAdminRegistrations(this.userId));
        }
        return true;

      case 'Volunteer':
        const volunteerEvents = cacheManager.getVolunteerEvents();
        const userRegistrations = cacheManager.getUserRegistrations(this.userId);
        return !!(volunteerEvents && userRegistrations);

      case 'AdminUsers':
        return !!(cacheManager.getAdminEvents(this.userId) && cacheManager.getAdminRegistrations(this.userId));

      case 'Trophy':
      case 'Gift':
      case 'Calendar':
        return !!cacheManager.getUserData();

      default:
        return false;
    }
  }

  // Get navigation analytics
  getNavigationAnalytics(): {
    totalNavigations: number;
    uniqueScreens: number;
    mostVisitedScreen: string;
    averageSessionLength: number;
  } {
    const totalNavigations = this.navigationHistory.length;
    const uniqueScreens = new Set(this.navigationHistory.map(nav => nav.screenName)).size;
    
    const screenCounts = this.navigationHistory.reduce((acc, nav) => {
      acc[nav.screenName] = (acc[nav.screenName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostVisitedScreen = Object.entries(screenCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';

    const sessionStart = this.navigationHistory[0]?.timestamp || Date.now();
    const sessionEnd = this.navigationHistory[this.navigationHistory.length - 1]?.timestamp || Date.now();
    const averageSessionLength = sessionEnd - sessionStart;

    return {
      totalNavigations,
      uniqueScreens,
      mostVisitedScreen,
      averageSessionLength
    };
  }

  // Reset navigation state
  reset(): void {
    this.navigationHistory = [];
    this.currentScreen = '';
    this.userId = '';
    this.isAdmin = false;
    screenPreloader.clearPreloadState();
    console.log('🧭 Navigation optimizer reset');
  }
}

// Export singleton instance
export const navigationOptimizer = new NavigationOptimizer(); 