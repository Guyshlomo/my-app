// Global Cache Manager for optimizing data loading
import type { User, VolunteerEvent, VolunteerRegistration } from '../types/types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  
  // Cache durations in milliseconds
  private readonly CACHE_DURATIONS = {
    USER_DATA: 15000,      // 15 seconds
    ADMIN_DATA: 20000,     // 20 seconds  
    VOLUNTEER_DATA: 15000,  // 15 seconds
    EVENTS: 30000,         // 30 seconds
  };

  set<T>(key: string, data: T, customDuration?: number): void {
    const duration = customDuration || this.CACHE_DURATIONS.USER_DATA;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: duration
    });
    
    console.log(`📦 Cache SET: ${key} (expires in ${duration}ms)`);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      console.log(`📦 Cache MISS: ${key}`);
      return null;
    }

    const now = Date.now();
    const isExpired = (now - entry.timestamp) > entry.expiresIn;
    
    if (isExpired) {
      console.log(`📦 Cache EXPIRED: ${key}`);
      this.cache.delete(key);
      return null;
    }

    console.log(`📦 Cache HIT: ${key}`);
    return entry.data;
  }

  invalidate(key: string): void {
    console.log(`📦 Cache INVALIDATE: ${key}`);
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    console.log(`📦 Cache INVALIDATE PATTERN: ${pattern}`);
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    console.log('📦 Cache CLEAR ALL');
    this.cache.clear();
  }

  // Specific cache keys
  static readonly KEYS = {
    USER_DATA: 'user_data',
    ADMIN_EVENTS: (adminId: string) => `admin_events_${adminId}`,
    ADMIN_REGISTRATIONS: (adminId: string) => `admin_registrations_${adminId}`,
    VOLUNTEER_EVENTS: 'volunteer_events',
    USER_REGISTRATIONS: (userId: string) => `user_registrations_${userId}`,
    EVENT_REGISTRATIONS: (eventId: string) => `event_registrations_${eventId}`,
  };

  // Convenience methods for specific data types
  setUserData(user: User): void {
    this.set(CacheManager.KEYS.USER_DATA, user, this.CACHE_DURATIONS.USER_DATA);
  }

  getUserData(): User | null {
    return this.get<User>(CacheManager.KEYS.USER_DATA);
  }

  setAdminData(events: VolunteerEvent[], registrations: VolunteerRegistration[], adminId: string): void {
    this.set(CacheManager.KEYS.ADMIN_EVENTS(adminId), events, this.CACHE_DURATIONS.ADMIN_DATA);
    this.set(CacheManager.KEYS.ADMIN_REGISTRATIONS(adminId), registrations, this.CACHE_DURATIONS.ADMIN_DATA);
  }

  getAdminEvents(adminId: string): VolunteerEvent[] | null {
    return this.get<VolunteerEvent[]>(CacheManager.KEYS.ADMIN_EVENTS(adminId));
  }

  getAdminRegistrations(adminId: string): VolunteerRegistration[] | null {
    return this.get<VolunteerRegistration[]>(CacheManager.KEYS.ADMIN_REGISTRATIONS(adminId));
  }

  setVolunteerData(events: VolunteerEvent[], userRegistrations: VolunteerRegistration[], userId: string): void {
    this.set(CacheManager.KEYS.VOLUNTEER_EVENTS, events, this.CACHE_DURATIONS.VOLUNTEER_DATA);
    this.set(CacheManager.KEYS.USER_REGISTRATIONS(userId), userRegistrations, this.CACHE_DURATIONS.VOLUNTEER_DATA);
  }

  getVolunteerEvents(): VolunteerEvent[] | null {
    return this.get<VolunteerEvent[]>(CacheManager.KEYS.VOLUNTEER_EVENTS);
  }

  getUserRegistrations(userId: string): VolunteerRegistration[] | null {
    return this.get<VolunteerRegistration[]>(CacheManager.KEYS.USER_REGISTRATIONS(userId));
  }

  // Invalidate related data when something changes
  invalidateUserData(): void {
    this.invalidate(CacheManager.KEYS.USER_DATA);
  }

  invalidateVolunteerData(): void {
    this.invalidatePattern('volunteer');
    this.invalidatePattern('user_registrations');
    this.invalidatePattern('event_registrations');
  }

  invalidateAdminData(adminId?: string): void {
    if (adminId) {
      this.invalidate(CacheManager.KEYS.ADMIN_EVENTS(adminId));
      this.invalidate(CacheManager.KEYS.ADMIN_REGISTRATIONS(adminId));
    } else {
      // Invalidate all admin data
      this.invalidatePattern('admin_events_');
      this.invalidatePattern('admin_registrations_');
    }
  }
}

// Export singleton instance
export const cacheManager = new CacheManager(); 