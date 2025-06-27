import AsyncStorage from '@react-native-async-storage/async-storage';
import { cancelVolunteerRegistration, getAllVolunteerEvents, getUserVolunteerRegistrations, registerForVolunteerEvent } from '../db/supabaseApi';

export interface VolunteerEvent {
  id: number;
  title: string;
  desc: string;
  fullDesc: string;
  date: string;
  time: string;
  image: string;
  organizer: string;
  volunteers: string[];
  settlement: string;
  isCouncil?: boolean;
}

function getRandomFutureDate() {
  const start = new Date('2025-07-01').getTime();
  const end = new Date('2025-08-31').getTime();
  const random = new Date(start + Math.random() * (end - start));
  const day = String(random.getDate()).padStart(2, '0');
  const month = String(random.getMonth() + 1).padStart(2, '0');
  const year = random.getFullYear();
  return `${day}.${month}.${year}`;
}

export const VOLUNTEER_EVENTS: VolunteerEvent[] = [
  {
    id: 101,
    title: 'עזרה בהקמה של אירועי תרבות ורווחה',
    desc: 'סיוע בהקמת אירועים קהילתיים, סידור ציוד והכנת המקום.',
    fullDesc: 'סיוע בהקמה של אירועי תרבות ורווחה בקיבוץ. כולל סידור כיסאות, שולחנות, ציוד טכני והכנת המקום לאירוע.',
    date: getRandomFutureDate(),
    time: '09:00',
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
    organizer: 'צוות תרבות',
    volunteers: [],
    settlement: 'ניר עם',
  },
  {
    id: 102,
    title: 'תפעול האירועים',
    desc: 'עזרה בתפעול שוטף של אירועי תרבות ורווחה.',
    fullDesc: 'עזרה בתפעול האירועים עצמם: קבלת קהל, חלוקת שתייה, עזרה למשתתפים, הפעלת עמדות.',
    date: getRandomFutureDate(),
    time: '17:00',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    organizer: 'צוות תרבות',
    volunteers: [],
    settlement: 'ניר עם',
  },
  {
    id: 103,
    title: 'פירוק האירועים',
    desc: 'עזרה בפירוק וסידור לאחר סיום האירועים.',
    fullDesc: 'סיוע בפירוק הציוד, ניקיון וסידור המקום לאחר סיום אירועי תרבות ורווחה.',
    date: getRandomFutureDate(),
    time: '21:00',
    image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
    organizer: 'צוות תרבות',
    volunteers: [],
    settlement: 'ניר עם',
  },
  {
    id: 104,
    title: 'מפעיל מפגשי וותיקים של הרווחה',
    desc: 'הפעלה וסיוע במפגשי וותיקים.',
    fullDesc: 'הפעלה, עזרה וסיוע במפגשי וותיקים של הרווחה. כולל עזרה בהגשה, הפעלת תחנות, שיחה עם המשתתפים.',
    date: getRandomFutureDate(),
    time: '10:00',
    image: 'https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=400&q=80',
    organizer: 'צוות רווחה',
    volunteers: [],
    settlement: 'ניר עם',
  },
  {
    id: 105,
    title: 'ניקיון של הבריכה ושטחים ציבוריים',
    desc: 'עזרה בניקיון הבריכה והשטחים הציבוריים בקיבוץ.',
    fullDesc: 'עזרה בניקיון הבריכה, סידור כסאות, פינוי אשפה וניקיון כללי של שטחים ציבוריים.',
    date: getRandomFutureDate(),
    time: '08:00',
    image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80',
    organizer: 'צוות אחזקה',
    volunteers: [],
    settlement: 'ניר עם',
  },
  {
    id: 106,
    title: 'בייביסיטר',
    desc: 'עזרה בשמירה על ילדים בזמן אירועים קהילתיים.',
    fullDesc: 'עזרה בשמירה, משחק והפעלה של ילדים בזמן אירועים קהילתיים או מפגשי וותיקים.',
    date: getRandomFutureDate(),
    time: '18:00',
    image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
    organizer: 'צוות רווחה',
    volunteers: [],
    settlement: 'ניר עם',
  },
  {
    id: 200,
    title: 'בייביסיטר',
    desc: 'עזרה בשמירה על ילדים בזמן אירועים קהילתיים.',
    fullDesc: 'עזרה בשמירה, משחק והפעלה של ילדים בזמן אירועים קהילתיים או מפגשי וותיקים.',
    date: '10.06.2025',
    time: '18:00',
    image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
    organizer: 'צוות רווחה',
    volunteers: [],
    settlement: 'ניר עם',
  },
];

// Cache configuration
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes for volunteer events
const CACHE_KEYS = {
  ALL_EVENTS: 'cache_volunteer_events',
  USER_REGISTRATIONS: 'cache_user_registrations',
};

// In-memory cache
let volunteerCache: {
  allEvents?: { data: any[]; timestamp: number };
  userRegistrations?: { data: any[]; timestamp: number };
} = {};

// Cache utilities
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION;
};

const setMemoryCache = (key: string, data: any): void => {
  volunteerCache[key as keyof typeof volunteerCache] = {
    data,
    timestamp: Date.now(),
  };
};

const getMemoryCache = (key: string): any => {
  const cached = volunteerCache[key as keyof typeof volunteerCache];
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }
  return null;
};

const setAsyncCache = async (key: string, data: any): Promise<void> => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to set volunteer cache:', error);
  }
};

const getAsyncCache = async (key: string): Promise<any> => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      const parsedCache = JSON.parse(cached);
      if (isCacheValid(parsedCache.timestamp)) {
        return parsedCache.data;
      }
    }
  } catch (error) {
    console.warn('Failed to get volunteer cache:', error);
  }
  return null;
};

const clearVolunteerCache = async (): Promise<void> => {
  try {
    volunteerCache = {};
    await AsyncStorage.multiRemove([
      CACHE_KEYS.ALL_EVENTS,
      CACHE_KEYS.USER_REGISTRATIONS,
    ]);
  } catch (error) {
    console.warn('Failed to clear volunteer cache:', error);
  }
};

export const volunteerEventsManager = {
  // קבלת כל אירועי ההתנדבות עם cache
  async getAllEvents(): Promise<any[]> {
    try {
      // Check memory cache first
      const cachedEvents = getMemoryCache('allEvents');
      if (cachedEvents) {
        console.log('📱 החזרת אירועי התנדבות מ-memory cache');
        return cachedEvents;
      }

      // Check AsyncStorage cache
      const asyncCachedEvents = await getAsyncCache(CACHE_KEYS.ALL_EVENTS);
      if (asyncCachedEvents) {
        console.log('💾 החזרת אירועי התנדבות מ-AsyncStorage cache');
        setMemoryCache('allEvents', asyncCachedEvents);
        return asyncCachedEvents;
      }

      // Fetch from database
      console.log('🌐 טוען אירועי התנדבות מ-Supabase');
      const events = await getAllVolunteerEvents();
      
      // Cache the result
      setMemoryCache('allEvents', events);
      await setAsyncCache(CACHE_KEYS.ALL_EVENTS, events);
      
      return events;
    } catch (error) {
      console.error('Error getting volunteer events:', error);
      return [];
    }
  },

  // קבלת רישומי המשתמש עם cache
  async getUserRegistrations(userId?: string): Promise<any[]> {
    try {
      // Check memory cache first
      const cachedRegistrations = getMemoryCache('userRegistrations');
      if (cachedRegistrations) {
        console.log('📱 החזרת רישומי התנדבות מ-memory cache');
        return cachedRegistrations;
      }

      // Check AsyncStorage cache
      const asyncCachedRegistrations = await getAsyncCache(CACHE_KEYS.USER_REGISTRATIONS);
      if (asyncCachedRegistrations) {
        console.log('💾 החזרת רישומי התנדבות מ-AsyncStorage cache');
        setMemoryCache('userRegistrations', asyncCachedRegistrations);
        return asyncCachedRegistrations;
      }

      // Fetch from database
      console.log('🌐 טוען רישומי התנדבות מ-Supabase');
      if (!userId) {
        console.warn('No userId provided for getUserRegistrations');
        return [];
      }
      const registrations = await getUserVolunteerRegistrations(userId);
      
      // Cache the result
      setMemoryCache('userRegistrations', registrations);
      await setAsyncCache(CACHE_KEYS.USER_REGISTRATIONS, registrations);
      
      return registrations;
    } catch (error) {
      console.error('Error getting user registrations:', error);
      return [];
    }
  },

  // רישום לאירוע התנדבות
  async registerForEvent(eventId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await registerForVolunteerEvent(eventId, userId);
      if (result) {
        // Invalidate caches since registration changed
        await this.clearCache();
        return { success: true };
      }
      return { success: false, error: 'לא ניתן להירשם לאירוע' };
    } catch (error: any) {
      console.error('Error registering for event:', error);
      return { 
        success: false, 
        error: error.message || 'אירעה שגיאה בהרשמה לאירוע' 
      };
    }
  },

  // ביטול רישום לאירוע
  async cancelRegistration(eventId: string, userId: string): Promise<boolean> {
    try {
      const result = await cancelVolunteerRegistration(eventId, userId);
      if (result) {
        // Invalidate caches since registration changed
        await this.clearCache();
      }
      return result;
    } catch (error) {
      console.error('Error canceling registration:', error);
      return false;
    }
  },

  // ניקוי cache
  async clearCache(): Promise<void> {
    await clearVolunteerCache();
  },

  // preload נתונים
  async preloadData(userId?: string): Promise<void> {
    try {
      console.log('🚀 Preloading volunteer data...');
      await Promise.all([
        this.getAllEvents(),
        this.getUserRegistrations(userId),
      ]);
      console.log('✅ Volunteer data preloaded successfully');
    } catch (error) {
      console.error('❌ Error preloading volunteer data:', error);
    }
  }
}; 