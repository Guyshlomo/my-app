import { cancelVolunteerRegistration, getAllVolunteerEvents, getUserVolunteerRegistrations, getVolunteerEventsForUser, registerForVolunteerEvent } from '../db/supabaseApi';

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

export const volunteerEventsManager = {
  // קבלת כל אירועי ההתנדבות ללא cache
  async getAllEvents(): Promise<any[]> {
    try {
      // Fetch from database only
      console.log('🌐 טוען אירועי התנדבות מ-Supabase');
      const events = await getAllVolunteerEvents();
      return events;
    } catch (error) {
      console.error('Error getting volunteer events:', error);
      return [];
    }
  },

  // קבלת אירועי התנדבות מסוננים לפי ישוב המשתמש
  async getEventsForUser(userSettlement?: string): Promise<any[]> {
    try {
      console.log('🏘️ טוען אירועי התנדבות מסוננים לפי ישוב:', userSettlement);
      const events = await getVolunteerEventsForUser(userSettlement);
      return events;
    } catch (error) {
      console.error('Error getting filtered volunteer events:', error);
      return [];
    }
  },

  // קבלת רישומי המשתמש ללא cache
  async getUserRegistrations(userId?: string): Promise<any[]> {
    try {
      if (!userId) {
        console.warn('No userId provided for getUserRegistrations');
        return [];
      }
      // Fetch from database only
      console.log('🌐 טוען רישומי התנדבות מ-Supabase');
      const registrations = await getUserVolunteerRegistrations(userId);
      return registrations;
    } catch (error) {
      console.error('Error getting user registrations:', error);
      return [];
    }
  },

  async registerForEvent(eventId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await registerForVolunteerEvent(eventId, userId);
      return result ? { success: true } : { success: false, error: 'לא ניתן להירשם לאירוע' };
    } catch (error: any) {
      console.error('Error registering for event:', error);
      return { 
        success: false, 
        error: error.message || 'אירעה שגיאה בהרשמה לאירוע' 
      };
    }
  },

  async cancelRegistration(eventId: string, userId: string): Promise<boolean> {
    try {
      const result = await cancelVolunteerRegistration(eventId, userId);
      return result;
    } catch (error) {
      console.error('Error canceling registration:', error);
      return false;
    }
  },

  async clearCache(): Promise<void> {
    // No cache to clear
    return;
  }
}; 