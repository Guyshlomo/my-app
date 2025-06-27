import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { I18nManager, Image, ImageBackground, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { getCurrentUserFromSupabase, getUserVolunteerRegistrations } from '../db/supabaseApi';
import { volunteerEventsManager } from '../utils/volunteerEvents';
import { addTasksCompletedListener, removeTasksCompletedListener } from '../utils/eventEmitter';
import { navigationOptimizer } from '../utils/navigationOptimizer';

// פונקציה להמרת dd.mm.yyyy ל-yyyy-mm-dd
function convertToISO(dateStr: string) {
  const [day, month, year] = dateStr.split('.');
  return `${year}-${month}-${day}`;
}

// פונקציה להמרת yyyy-mm-dd ל-dd.mm.yyyy
function convertFromISO(dateStr: string) {
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
}

LocaleConfig.locales['he'] = {
  monthNames: ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'],
  monthNamesShort: ['ינו','פבר','מרץ','אפר','מאי','יונ','יול','אוג','ספט','אוק','נוב','דצ'],
  dayNames: ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'],
  dayNamesShort: ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'],
  today: 'היום'
};
LocaleConfig.defaultLocale = 'he';

function CalendarScreen() {
  const navigation = useNavigation<any>();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const [userRegistrations, setUserRegistrations] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const isFocused = useIsFocused();

  // Track navigation when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      navigationOptimizer.trackNavigation('Calendar');
    }, [])
  );

  useEffect(() => {
    if (isFocused) {
      loadUserRegistrations();
      
      // Add auto-refresh every 5 seconds
      const refreshInterval = setInterval(() => {
        console.log('🔄 [CalendarScreen] Auto-refreshing volunteer registrations...');
        loadUserRegistrations();
      }, 5000);
      
      // Add listener for tasks completed updates
      const listener = (userId: string, tasksCompleted: number) => {
        console.log('📊 [CalendarScreen] Tasks completed update received:', { userId, tasksCompleted });
        loadUserRegistrations();
      };
      
      addTasksCompletedListener(listener);
      
      return () => {
        clearInterval(refreshInterval);
        removeTasksCompletedListener(listener);
      };
    }
  }, [isFocused]);

  const loadUserRegistrations = async () => {
    try {
      console.log('📅 [CalendarScreen] Loading user registrations...');
      
      // Clear cache to ensure fresh data
      await volunteerEventsManager.clearCache();
      
      // Get current user first
      const currentUser = await getCurrentUserFromSupabase();
      if (!currentUser) {
        console.log('📅 [CalendarScreen] No current user found');
        setUserRegistrations([]);
        return;
      }
      
      const registrations = await getUserVolunteerRegistrations(currentUser.id);
      console.log('📅 [CalendarScreen] User registrations loaded:', registrations.length);
      
      setUserRegistrations(registrations);
    } catch (error) {
      console.error('❌ [CalendarScreen] Error loading user registrations:', error);
    }
  };

  // Mark events on calendar
  const markedDates: { [date: string]: any } = {};
  userRegistrations.forEach(registration => {
    if (registration.volunteer_events) {
      const eventDate = registration.volunteer_events.date;
      if (!markedDates[eventDate]) {
        markedDates[eventDate] = {
          marked: true,
          dotColor: registration.status === 'completed' ? '#4CAF50' : '#FF9800',
          customStyles: {
            container: { borderWidth: 0, position: 'relative' },
            text: { fontWeight: 'bold', color: '#222' },
          },
        };
      }
    }
  });

  // Mark today
  markedDates[todayStr] = {
    ...(markedDates[todayStr] || {}),
    selected: true,
    selectedColor: '#FFF9C4',
    selectedTextColor: '#388e3c',
    customStyles: {
      container: { borderWidth: 2, borderColor: '#388e3c', shadowColor: '#388e3c', shadowRadius: 8, shadowOpacity: 0.7 },
      text: { fontWeight: 'bold', color: '#388e3c' },
    },
  };

  // Separate events by date and status
  console.log('📅 [CalendarScreen] Today date string:', todayStr);
  console.log('📅 [CalendarScreen] User registrations:', userRegistrations.map(r => ({
    id: r.id,
    eventDate: r.volunteer_events?.date,
    status: r.status,
    title: r.volunteer_events?.title
  })));

  // התנדבויות של היום (רשומות או שהושלמו)
  const todayRegistrations = userRegistrations.filter(registration => {
    if (!registration.volunteer_events) return false;
    
    const eventDate = registration.volunteer_events.date;
    const isToday = eventDate === todayStr;
    
    if (isToday) {
      console.log('📅 [CalendarScreen] Found today event:', {
        title: registration.volunteer_events.title,
        date: eventDate,
        status: registration.status
      });
    }
    
    return isToday;
  }).sort((a, b) => {
    // Sort by time if available, otherwise by registration order
    const timeA = a.volunteer_events?.time || '00:00';
    const timeB = b.volunteer_events?.time || '00:00';
    return timeA.localeCompare(timeB);
  });

  // התנדבויות עתידיות (לא כולל היום)
  const upcomingRegistrations = userRegistrations.filter(registration => 
    registration.status === 'registered' && 
    registration.volunteer_events &&
    registration.volunteer_events.date > todayStr
  ).sort((a, b) => new Date(a.volunteer_events.date).getTime() - new Date(b.volunteer_events.date).getTime());

  // התנדבויות שבוצעו (לא כולל היום)
  const completedRegistrations = userRegistrations.filter(registration => 
    registration.status === 'completed' &&
    registration.volunteer_events &&
    registration.volunteer_events.date < todayStr
  ).sort((a, b) => new Date(b.volunteer_events.date).getTime() - new Date(a.volunteer_events.date).getTime());

  const nextEvent = upcomingRegistrations[0];
  const nextEvents = upcomingRegistrations.slice(1);

  const cardColors = ['#B3E5FC', '#FFE082', '#FFCCBC', '#C8E6C9', '#FFD6E0'];

  // Decorative background (balloons/confetti)
  return (
    <ImageBackground source={require('../../assets/images/confetti-bg.png')} style={{ flex: 1 }} resizeMode="cover">
      <SafeAreaView style={styles.container}>
                    <ScrollView 
              contentContainerStyle={styles.scrollContent}
              removeClippedSubviews={true}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
          <View style={styles.calendarWrap}>
            <Calendar
              current={todayStr}
              markedDates={markedDates}
              markingType="custom"
              theme={{
                calendarBackground: '#FFF9C4',
                textSectionTitleColor: '#388e3c',
                selectedDayBackgroundColor: '#388e3c',
                selectedDayTextColor: '#fff',
                todayTextColor: '#388e3c',
                dayTextColor: '#111',
                textDisabledColor: '#ccc',
                dotColor: '#388e3c',
                selectedDotColor: '#fff',
                arrowColor: '#388e3c',
                monthTextColor: '#388e3c',
                indicatorColor: '#388e3c',
                textDayFontWeight: 'bold',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: 'bold',
                textDayFontSize: 16,
                textMonthFontSize: 22,
                textDayHeaderFontSize: 15,
              }}
              enableSwipeMonths
              firstDay={0}
              hideExtraDays={false}
              renderArrow={direction => (
                <MaterialIcons name={direction === 'left' ? (I18nManager.isRTL ? 'arrow-forward-ios' : 'arrow-back-ios') : (I18nManager.isRTL ? 'arrow-back-ios' : 'arrow-forward-ios')} size={20} color="#388e3c" />
              )}
              style={{ borderRadius: 18, marginBottom: 18 }}
              onDayPress={day => {
                setSelectedDate(day.dateString);
                const event = userRegistrations.find(e => e.volunteer_events && e.volunteer_events.date === day.dateString);
                setSelectedEvent(event || null);
              }}
            />
          </View>
          {/* Modal for event info */}
          <Modal visible={!!selectedEvent} transparent animationType="fade">
            <Pressable style={styles.modalOverlay} onPress={() => setSelectedEvent(null)}>
              <View style={styles.eventModalCard}>
                <Text style={styles.eventModalTitle}>{selectedEvent?.volunteer_events?.title}</Text>
                <Text style={styles.eventModalMeta}>{selectedEvent?.volunteer_events?.date} | {selectedEvent?.volunteer_events?.time}</Text>
                <Text style={styles.eventModalDesc}>
                  {selectedEvent?.status === 'completed' ? 'התנדבות שבוצעה בהצלחה!' : 'התנדבות רשומה - ממתינה לביצוע'}
                </Text>
                <Pressable style={styles.closeModalBtn} onPress={() => setSelectedEvent(null)}>
                  <Text style={styles.closeModalBtnText}>סגור</Text>
                </Pressable>
              </View>
            </Pressable>
          </Modal>
          {/* Today's events */}
          {todayRegistrations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ההתנדבויות שלי היום</Text>
              {todayRegistrations.map((registration, index) => (
                <View key={registration.id} style={[styles.eventCard, styles.todayEventCard, { backgroundColor: '#FFE082' }]}>
                  <View style={styles.todayEventHeader}>
                    <Text style={styles.eventTitle}>{registration.volunteer_events.title}</Text>
                    <Text style={styles.todayBadge}>היום</Text>
                  </View>
                  <Text style={styles.eventMeta}>{registration.volunteer_events.date} | {registration.volunteer_events.time}</Text>
                  <Text style={styles.eventLocation}>📍 {registration.volunteer_events.location}</Text>
                  {registration.status === 'completed' && (
                    <Text style={styles.completedBadge}>✅ הושלמה בהצלחה</Text>
                  )}
                  {registration.status === 'registered' && (
                    <Text style={styles.pendingBadge}>⏰ ממתינה לביצוע</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Next event */}
          {nextEvent && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ההתנדבות הקרובה</Text>
              <View style={[styles.eventCard, { backgroundColor: cardColors[0] }]}>
                <Text style={styles.eventTitle}>{nextEvent.volunteer_events.title}</Text>
                <Text style={styles.eventMeta}>{nextEvent.volunteer_events.date} | {nextEvent.volunteer_events.time}</Text>
                <Text style={styles.eventLocation}>📍 {nextEvent.volunteer_events.location}</Text>
              </View>
            </View>
          )}
          {/* Upcoming events */}
          {nextEvents.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ההתנדבויות הבאות שלי</Text>
              {nextEvents.map((registration, index) => (
                <View key={registration.id} style={[styles.eventCard, { backgroundColor: cardColors[(index + 1) % cardColors.length] }]}>
                  <Text style={styles.eventTitle}>{registration.volunteer_events.title}</Text>
                  <Text style={styles.eventMeta}>{registration.volunteer_events.date} | {registration.volunteer_events.time}</Text>
                  <Text style={styles.eventLocation}>📍 {registration.volunteer_events.location}</Text>
                </View>
              ))}
            </View>
          )}
          {/* Completed events */}
          {completedRegistrations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>התנדבויות שבוצעו</Text>
              {completedRegistrations.map((registration, index) => (
                <View key={registration.id} style={[styles.eventCard, { backgroundColor: cardColors[index % cardColors.length] }, styles.pastEventCard]}>
                  <Text style={[styles.eventTitle, styles.pastEventText]}>{registration.volunteer_events.title}</Text>
                  <Text style={[styles.eventMeta, styles.pastEventText]}>{registration.volunteer_events.date} | {registration.volunteer_events.time}</Text>
                  <Text style={[styles.eventLocation, styles.pastEventText]}>📍 {registration.volunteer_events.location}</Text>
                  <Text style={styles.completedBadge}>✅ הושלמה בהצלחה</Text>
                </View>
              ))}
            </View>
          )}
          {/* Empty states */}
          {upcomingRegistrations.length === 0 && completedRegistrations.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>אין התנדבויות רשומות</Text>
              <Text style={styles.emptyStateText}>עבור למסך ההתנדבות כדי להירשם לאירועים</Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('Volunteer', { from: 'Calendar' })}
              >
                <Text style={styles.emptyStateButtonText}>עבור להתנדבות</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Bottom Banner */}
        <SafeAreaView style={styles.bottomBannerContainer}>
          <View style={styles.bottomBanner}>
            <TouchableOpacity style={styles.bannerIconWrap} onPress={() => navigation.navigate('Trophy')}>
              <Image source={require('../../assets/images/trophy.png')} style={styles.bannerIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.bannerIconWrap} onPress={() => navigation.navigate('Gift')}>
              <Image source={require('../../assets/images/gift.png')} style={styles.bannerIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.bannerIconWrap} onPress={() => navigation.navigate('Home')}>
              <Image source={require('../../assets/images/home.png')} style={styles.bannerIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.bannerIconWrap, styles.activeIconWrap]}>
              <View style={styles.activeIconBackground}>
                <Image source={require('../../assets/images/calander.png')} style={styles.bannerIcon} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bannerIconWrap} onPress={() => navigation.navigate('Volunteer', { from: 'Calendar' })}>
              <Image source={require('../../assets/images/volunteer.png')} style={styles.bannerIcon} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF6DA',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 120,
    flexGrow: 1,
    direction: 'rtl',
  },
  calendarWrap: {
    borderRadius: 18,
    backgroundColor: '#fff',
    padding: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'left',
  },
  eventCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    alignItems: 'flex-start',
  },
  eventContent: {
    flex: 1,
    alignItems: 'flex-start',
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'left',
  },
  eventMeta: {
    fontSize: 14,
    color: '#888',
    textAlign: 'left',
  },
  eventLocation: {
    fontSize: 14,
    color: '#888',
    textAlign: 'left',
  },
  pastEventCard: {
    backgroundColor: '#e0e0e0',
  },
  pastEventText: {
    color: '#aaa',
    textDecorationLine: 'line-through',
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: 'bold',
  },
  todayEventCard: {
    borderWidth: 2,
    borderColor: '#FFA726',
    shadowColor: '#FFA726',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  todayEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  todayBadge: {
    backgroundColor: '#FF9800',
    color: '#fff',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 12,
    fontWeight: 'bold',
  },
  pendingBadge: {
    backgroundColor: '#FF9800',
    color: '#fff',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomBannerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  bottomBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    height: 85,
    backgroundColor: '#D7D2B6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 12,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bannerIconWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingTop: 10,
  },
  activeIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconBackground: {
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  bannerIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventModalCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    minWidth: 260,
    maxWidth: 320,
  },
  eventModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#388e3c',
    marginBottom: 8,
    textAlign: 'center',
  },
  eventModalMeta: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  eventModalDesc: {
    fontSize: 15,
    color: '#333',
    marginBottom: 18,
    textAlign: 'center',
  },
  closeModalBtn: {
    backgroundColor: '#388e3c',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  closeModalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyStateButton: {
    backgroundColor: '#388e3c',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CalendarScreen; 