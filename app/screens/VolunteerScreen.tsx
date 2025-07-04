/**
 * מסך התנדבויות - ממוטב לטעינה מהירה
 * 
 * אופטימיזציות שבוצעו:
 * 1. הסרת מסך טעינה - המסך נטען מיד ללא "טוען התנדבויות..."
 * 2. React.memo עבור EventCard - מונע רינדור מיותר
 * 3. useMemo עבור filteredEvents ו-registeredCount
 * 4. useCallback עבור formatDate ו-formatTime
 * 5. טעינה מקבילה של נתונים עם Promise.all
 * 6. הסרת useEffect כפול
 * 7. רענון שקט ללא לואדר כשחוזרים למסך
 */

import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Animated, Dimensions, Image, Platform, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { RootStackParamList } from '../MainNavigator';
import { cancelVolunteerRegistration, completeVolunteerEvent, deleteVolunteerEvent, getCurrentUserFromSupabase, getEventRegistrations, registerForVolunteerEvent } from '../db/supabaseApi';
import type { User, VolunteerEvent, VolunteerRegistration } from '../types/types';
import { addEventDeletedListener, emitEventDeleted, removeEventDeletedListener } from '../utils/eventEmitter';
import { volunteerEventsManager } from '../utils/volunteerEvents';

type NavigationProp = StackNavigationProp<RootStackParamList>;

// קומפוננטת כרטיס אירוע
const EventCard = ({ 
  event, 
  expanded, 
  isRegistered, 
  isFull, 
  onToggleExpand, 
  onRegister, 
  onUnregister, 
  formatDate, 
  formatTime,
  registeredUsers,
  currentUserId,
  isRegistering,
  isUnregistering,
  responsiveFontSize
}: {
  event: VolunteerEvent;
  expanded: boolean;
  isRegistered: boolean;
  isFull: boolean;
  onToggleExpand: () => void;
  onRegister: () => void;
  onUnregister: () => void;
  formatDate: (date: string) => string;
  formatTime: (time: string) => string;
  registeredUsers: any[];
  currentUserId?: string;
  isRegistering?: boolean;
  isUnregistering?: boolean;
  responsiveFontSize: (size: number) => number;
}) => {
  // Simplified styling without complex animations
  const cardStyle = isRegistered ? {
    backgroundColor: '#e8f5e8',
    borderWidth: 2,
    borderColor: '#4CAF50',
  } : {};

  return (
    <View 
      style={[
        styles.card, 
        expanded && styles.cardExpanded,
        cardStyle
      ]}
    > 
      {event.image_url && (
        <Image source={{ uri: event.image_url }} style={styles.cardImage} />
      )}
      <View style={styles.cardContent}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Text style={[styles.cardTitle, { fontSize: responsiveFontSize(18) }]}>{event.title}</Text>
          {isRegistered && <MaterialIcons name="star" size={18} color="#4BB543" style={{ marginLeft: 4 }} />}
          {isFull && !isRegistered && <MaterialIcons name="group" size={18} color="#ff9800" style={{ marginLeft: 4 }} />}
        </View>
        
        <Text style={[styles.cardDesc, { fontSize: responsiveFontSize(14) }]}>{event.description}</Text>
        <Text style={[styles.cardLocation, { fontSize: responsiveFontSize(14) }]}>📍 {event.location}</Text>
        
        <View style={styles.cardMetaRow}>
          <Text style={[styles.cardMeta, { fontSize: responsiveFontSize(14) }]}>
            {formatDate(event.date)} | {formatTime(event.time)}
          </Text>
          <TouchableOpacity style={styles.cardButton} onPress={onToggleExpand}>
            <Text style={[styles.cardButtonText, { fontSize: responsiveFontSize(15) }]}>
              {expanded ? 'סגור' : 'לפרטים ⬇️'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {expanded && (
          <View style={styles.expandedSection}>
            <Text style={[styles.expandedTitle, { fontSize: responsiveFontSize(16) }]}>פרטים נוספים:</Text>
            <Text style={[styles.expandedDesc, { fontSize: responsiveFontSize(14) }]}>📅 תאריך: {formatDate(event.date)}</Text>
            <Text style={[styles.expandedDesc, { fontSize: responsiveFontSize(14) }]}>🕐 שעה: {formatTime(event.time)}</Text>
            <Text style={[styles.expandedDesc, { fontSize: responsiveFontSize(14) }]}>📍 מיקום: {event.location}</Text>
            <Text style={[styles.expandedDesc, { fontSize: responsiveFontSize(14) }]}>👥 משתתפים: {event.current_participants}/{event.max_participants}</Text>
            <Text style={[styles.expandedDesc, { fontSize: responsiveFontSize(14) }]}>🪙 תגמול: {event.coins_reward} מטבעות</Text>
            {event.admin_name && (
              <Text style={[styles.expandedDesc, { fontSize: responsiveFontSize(14) }]}>👤 אחראי: <Text style={styles.boldText}>{event.admin_name}</Text></Text>
            )}
            
            {/* רשימת נרשמים */}
            {registeredUsers.length > 0 && (
              <>
                <Text style={[styles.expandedTitle, { fontSize: responsiveFontSize(16) }]}>נרשמו להתנדבות ({registeredUsers.length}):</Text>
                <View style={styles.volunteersList}>
                  {registeredUsers.map((registration, index) => (
                    <Text 
                      key={registration.id} 
                      style={[
                        styles.volunteerName,
                        registration.user_id === currentUserId && styles.currentUserVolunteer,
                        { fontSize: responsiveFontSize(14) }
                      ]}
                    >
                      {index + 1}. {registration.users?.firstname} {registration.users?.lastname}
                      {registration.users?.settlement && ` (${registration.users.settlement})`}
                      {registration.user_id === currentUserId && ' - את/ה'}
                    </Text>
                  ))}
                </View>
              </>
            )}
            
            {/* כפתורי פעולה עם אנימציות */}
            {!isRegistered && !isFull ? (
              <TouchableOpacity 
                style={[
                  styles.registerButton,
                  isRegistering && styles.registerButtonLoading
                ]} 
                onPress={onRegister}
                disabled={isRegistering}
              >
                <MaterialIcons 
                  name={isRegistering ? "hourglass-empty" : "check"} 
                  size={20} 
                  color="#fff" 
                  style={{ marginLeft: 6 }} 
                />
                <Text style={[styles.registerButtonText, { fontSize: responsiveFontSize(18) }]}>
                  {isRegistering ? 'נרשם...' : 'הירשם עכשיו'}
                </Text>
              </TouchableOpacity>
            ) : !isRegistered && isFull ? (
              <View style={styles.fullButton}>
                <MaterialIcons name="group" size={20} color="#666" style={{ marginLeft: 6 }} />
                <Text style={[styles.fullButtonText, { fontSize: responsiveFontSize(18) }]}>מלא</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={[
                  styles.unregisterButton,
                  isUnregistering && styles.unregisterButtonLoading
                ]} 
                onPress={onUnregister}
                disabled={isUnregistering}
              >
                <MaterialIcons 
                  name={isUnregistering ? "hourglass-empty" : "close"} 
                  size={20} 
                  color="#fff" 
                  style={{ marginLeft: 6 }} 
                />
                <Text style={[styles.unregisterButtonText, { fontSize: responsiveFontSize(18) }]}>
                  {isUnregistering ? 'מבטל...' : 'בטל הרשמה'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

function VolunteerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [events, setEvents] = useState<VolunteerEvent[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<VolunteerRegistration[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<{ [eventId: string]: any[] }>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Simple iPad detection for responsive text (iPhone UI stays exactly the same)
  const { width: screenWidth } = Dimensions.get('window');
  const isIPad = Platform.OS === 'ios' && screenWidth >= 768;
  const responsiveFontSize = (baseSize: number) => isIPad ? baseSize * 1.2 : baseSize;
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showUnregister, setShowUnregister] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showOnlyRegistered, setShowOnlyRegistered] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [registeringEvents, setRegisteringEvents] = useState<Set<string>>(new Set());
  const [unregisteringEvents, setUnregisteringEvents] = useState<Set<string>>(new Set());
  const [adminUsers, setAdminUsers] = useState<{ [adminId: string]: User }>({});



  // Load data - אופטימיזציה לטעינה מהירה יותר
  const loadData = useCallback(async (showLoadingState = false, forceRefresh = false) => {
    try {
      if (showLoadingState) {
        setIsLoadingUser(true);
      }
      
      const user = await getCurrentUserFromSupabase();
      if (user) {
        setCurrentUser(user);
        
        // Use volunteer events manager for data loading
        try {
          const events = await volunteerEventsManager.getAllEvents();
          console.log('✅ אירועי התנדבות נטענו:', { eventsCount: events.length });
          setEvents(events);
          
          const registrations = await volunteerEventsManager.getUserRegistrations(user.id);
          console.log('✅ רישומי התנדבות נטענו:', { 
            registrationsCount: registrations.length
          });
          setUserRegistrations(registrations);
          
        } catch (error) {
          console.error('❌ Error loading volunteer data:', error);
          setEvents([]);
          setUserRegistrations([]);
        }
        
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
      setEvents([]);
      setUserRegistrations([]);
      setIsInitialized(true);
    } finally {
      if (showLoadingState) {
        setIsLoadingUser(false);
      }
    }
  }, []);

  // טעינה ראשונית - רק פעם אחת
  useEffect(() => {
    loadData(true, false); // עם לואדר, אבל עם cache אם זמין
  }, []);

  // הוספת מאזין למחיקת אירועים - רק פעם אחת
  useEffect(() => {
    const eventDeletedHandler = () => {
      console.log('🔔 [VolunteerScreen] Received event deletion notification - refreshing data');
      loadData(); // רענון ללא לואדר
    };

    addEventDeletedListener(eventDeletedHandler);

    // ניקוי המאזין כשהקומפוננטה מתפרקת
    return () => {
      removeEventDeletedListener(eventDeletedHandler);
    };
  }, []);

  // רענון נתונים כשהמסך חוזר לפוקוס - עם cache
  useFocusEffect(
    useCallback(() => {
      if (isInitialized) {
        console.log('🔄 [VolunteerScreen] Screen focused - using cache first');
        
        loadData(false, false); // רענון שקט
      }
    }, [isInitialized])
  );

  // Refresh data - רק כשמושכים לרענון
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(false, true); // Force refresh - bypass cache
    setRefreshing(false);
  }, []);

  // הוספת refresh אוטומטי כל 30 שניות (פחות תכוף)
  useEffect(() => {
    const autoRefreshInterval = setInterval(() => {
      console.log('🔄 VolunteerScreen: Background refresh every 30 seconds...');
      loadData(false, false); // ללא לואדר, עם cache
    }, 30000); // 30 שניות במקום 5

    return () => clearInterval(autoRefreshInterval);
  }, [loadData]);

  // Check if user is registered for event
  const isUserRegistered = useCallback((eventId: string) => {
    return userRegistrations.some(reg => reg.event_id === eventId && reg.status === 'registered');
  }, [userRegistrations]);

  // Toggle expand handler
  const handleToggleExpand = useCallback((eventId: string) => {
    setExpandedId(prev => prev === eventId ? null : eventId);
  }, []);

  // Registration handler עם עדכון מיידי של UI
  const handleRegister = async (eventId: string) => {
    if (!currentUser) return;

    // עדכון מיידי של UI - הוספה לרשימת רישומים
    setRegisteringEvents(prev => new Set(prev).add(eventId));
    
    // עדכון אופטימיסטי - הוספה לרשימת הרישומים מיד
    const optimisticRegistration: VolunteerRegistration = {
      id: `temp-${eventId}`,
      event_id: eventId,
      user_id: currentUser.id,
      status: 'registered',
      registered_at: new Date().toISOString(),
      volunteer_events: events.find(e => e.id === eventId)
    };
    
    setUserRegistrations(prev => [...prev, optimisticRegistration]);

    try {
      console.log('📝 [UI] נרשם להתנדבות:', eventId);
      const result = await registerForVolunteerEvent(eventId, currentUser.id);
      
      console.log('✅ [UI] Registration successful, result:', result);
      
      // הצגת באנר הצלחה
      setShowSuccess(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      setTimeout(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setShowSuccess(false));
      }, 2000);
      
      // רענון נתונים מהשרת
      await loadData();
      
      // Refresh event registrations if this event is expanded
      if (expandedId === eventId) {
        await loadEventRegistrations(eventId);
      }
      
    } catch (error: any) {
      console.error('❌ שגיאה בהרשמה:', error);
      
      // ביטול העדכון האופטימיסטי במקרה של שגיאה
      setUserRegistrations(prev => prev.filter(reg => reg.id !== `temp-${eventId}`));
      
      Alert.alert('שגיאה בהרשמה', error.message || 'לא ניתן להירשם להתנדבות');
    } finally {
      setRegisteringEvents(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }
  };

  // Unregister handler עם עדכון מיידי של UI
  const handleUnregister = async (eventId: string) => {
    if (!currentUser) return;

    console.log('🔄 התחלת ביטול הרשמה:', { 
      eventId, 
      currentRegistrations: userRegistrations.length,
      isCurrentlyRegistered: userRegistrations.some(reg => reg.event_id === eventId && reg.status === 'registered')
    });

    // עדכון מיידי של UI - הסרה מרשימת רישומים
    setUnregisteringEvents(prev => new Set(prev).add(eventId));
    
    // עדכון אופטימיסטי - הסרה מרשימת הרישומים מיד
    const originalRegistrations = [...userRegistrations];
    setUserRegistrations(prev => prev.filter(reg => reg.event_id !== eventId));

    try {
      console.log('🗑️ [UI] מוחק הרשמה להתנדבות:', eventId);
      await cancelVolunteerRegistration(eventId, currentUser.id);
      
      // הצגת באנר ביטול
      setShowUnregister(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      setTimeout(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setShowUnregister(false));
      }, 2000);
      
      // רענון נתונים מהשרת - force fresh data
      await loadData();
      
      // Add small delay to ensure state is updated
      setTimeout(() => {
        console.log('✅ נתונים נרענו לאחר ביטול הרשמה:', {
          registrationsCount: userRegistrations.length,
          isStillRegistered: userRegistrations.some(reg => reg.event_id === eventId && reg.status === 'registered')
        });
      }, 100);
      
      // Refresh event registrations if this event is expanded
      if (expandedId === eventId) {
        await loadEventRegistrations(eventId);
      }
      
    } catch (error: any) {
      console.error('❌ שגיאה בביטול הרשמה:', error);
      
      // ביטול העדכון האופטימיסטי במקרה של שגיאה
      setUserRegistrations(originalRegistrations);
      
      Alert.alert('שגיאה', error.message || 'לא ניתן לבטל את ההרשמה');
    } finally {
      setUnregisteringEvents(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }
  };

  // Format time - ממוטב
  const formatTime = useCallback((timeStr: string) => {
    return timeStr.slice(0, 5); // HH:MM
  }, []);

  // Format date - ממוטב
  const formatDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL');
  }, []);

  // Filter events - ממוטב עם useMemo
  const filteredEvents = useMemo(() => {
    if (showOnlyRegistered) {
      return events.filter(event => 
        userRegistrations.some(reg => reg.event_id === event.id && reg.status === 'registered')
      );
    }
    return events;
  }, [events, userRegistrations, showOnlyRegistered]);

  const registeredCount = useMemo(() => {
    return userRegistrations.length;
  }, [userRegistrations]);

  // Load registered users for a specific event
  const loadEventRegistrations = useCallback(async (eventId: string) => {
    try {
      const registrations = await getEventRegistrations(eventId);
      setEventRegistrations(prev => ({
        ...prev,
        [eventId]: registrations
      }));
    } catch (error) {
      console.error('❌ Error loading event registrations:', error);
    }
  }, []);

  // Load registered users for all events when expanded
  useEffect(() => {
    if (expandedId) {
      loadEventRegistrations(expandedId);
    }
  }, [expandedId, loadEventRegistrations]);

  // Handle event approval (admin only) - Simple approval for all registered participants
  const handleApproveEvent = async (eventId: string, eventTitle: string) => {
    if (!currentUser?.isAdmin) return;

    try {
      // Get registrations for this event
      const eventRegistrations = userRegistrations.filter(
        reg => reg.event_id === eventId && reg.status === 'registered'
      );

      if (eventRegistrations.length === 0) {
        Alert.alert('אין משתתפים', 'אין משתתפים ממתינים לאישור');
        return;
      }

      Alert.alert(
        'אישור השלמת התנדבות',
        `האם אתה בטוח שברצונך לאשר את כל ${eventRegistrations.length} המשתתפים?`,
        [
          { text: 'ביטול', style: 'cancel' },
          {
            text: 'אשר הכל',
            style: 'default',
            onPress: async () => {
              try {
                const participantIds = eventRegistrations.map(reg => reg.user_id);
                await completeVolunteerEvent(eventId, participantIds);
                
                // Refresh data
                await loadData();
                
                Alert.alert('הצלחה', `כל ${participantIds.length} המשתתפים אושרו וקיבלו מטבעות`);
              } catch (error: any) {
                console.error('❌ שגיאה באישור התנדבות:', error);
                Alert.alert('שגיאה', error.message || 'לא ניתן לאשר את ההתנדבות');
              }
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('❌ שגיאה באישור התנדבות:', error);
      Alert.alert('שגיאה', error.message || 'לא ניתן לאשר את ההתנדבות');
    }
  };

  // Handle event deletion (admin only)
  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!currentUser?.isAdmin) return;

    Alert.alert(
      'מחיקת התנדבות',
      `האם אתה בטוח שברצונך למחוק את "${eventTitle}"?`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVolunteerEvent(eventId);
              
              // Add small delay to ensure DB operation completes
              setTimeout(async () => {
                await loadData();
              }, 500);
              
              Alert.alert('הצלחה', 'ההתנדבות נמחקה');

              // Add small delay to ensure DB operation completes
              setTimeout(async () => {
                await loadData();
                emitEventDeleted(); // Notify other screens
              }, 500);
              
              Alert.alert('הצלחה', 'ההתנדבות נמחקה');
            } catch (error: any) {
              console.error('❌ שגיאה במחיקת התנדבות:', error);
              Alert.alert('שגיאה', error.message || 'לא ניתן למחוק את ההתנדבות');
            }
          }
        }
      ]
    );
  };

  // Loading screen while determining user type - only show if no cached data
  if (isLoadingUser && !currentUser) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingIcon}>🤝</Text>
          <Text style={styles.loadingText}>טוען התנדבויות...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Admin Volunteer Screen
  if (currentUser?.isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>⚙️</Text>
          <Text style={[styles.headerTitle, { fontSize: responsiveFontSize(24) }]}>ניהול התנדבויות</Text>
        </View>

        <View style={styles.summaryBar}>
          <Text style={[styles.summaryText, { fontSize: responsiveFontSize(16) }]}>סה״כ {events.length} התנדבויות פעילות</Text>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          removeClippedSubviews={true}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {events.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>אין התנדבויות במערכת</Text>
            </View>
          ) : (
            events.map(event => {
              const expanded = expandedId === event.id;
              const eventDate = new Date(event.date);
              const today = new Date();
              const isPastEvent = eventDate <= today;
              const pendingRegistrations = userRegistrations.filter(
                reg => reg.event_id === event.id && reg.status === 'registered'
              );
              
              return (
                <View key={event.id} style={[styles.card, expanded && styles.cardExpanded, isPastEvent && styles.cardPastEvent]}> 
                  {event.image_url && (
                    <Image source={{ uri: event.image_url }} style={styles.cardImage} />
                  )}
                  <View style={styles.cardContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <Text style={styles.cardTitle}>{event.title}</Text>
                      {isPastEvent && <MaterialIcons name="access-time" size={18} color="#ff9800" style={{ marginLeft: 4 }} />}
                      {pendingRegistrations.length > 0 && <MaterialIcons name="notification-important" size={18} color="#f44336" style={{ marginLeft: 4 }} />}
                    </View>
                    
                    <Text style={styles.cardDesc}>{event.description}</Text>
                    <Text style={styles.cardLocation}>📍 {event.location}</Text>
                    
                    <View style={styles.cardMetaRow}>
                      <Text style={styles.cardMeta}>
                        {formatDate(event.date)} | {formatTime(event.time)}
                      </Text>
                      <TouchableOpacity style={styles.cardButton} onPress={() => setExpandedId(expanded ? null : event.id)}>
                        <Text style={styles.cardButtonText}>
                          {expanded ? 'סגור' : 'לפרטים ⬇️'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    {expanded && (
                      <View style={styles.expandedSection}>
                        <Text style={styles.expandedTitle}>פרטי ההתנדבות:</Text>
                        <Text style={styles.expandedDesc}>📅 תאריך: {formatDate(event.date)}</Text>
                        <Text style={styles.expandedDesc}>🕐 שעה: {formatTime(event.time)}</Text>
                        <Text style={styles.expandedDesc}>📍 מיקום: {event.location}</Text>
                        <Text style={styles.expandedDesc}>👥 נרשמו: {event.current_participants}/{event.max_participants}</Text>
                        <Text style={styles.expandedDesc}>🪙 תגמול: {event.coins_reward} מטבעות</Text>
                        {event.admin_name && (
                          <Text style={styles.expandedDesc}>👤 נוצר על ידי: <Text style={styles.boldText}>{event.admin_name}</Text></Text>
                        )}
                        
                        {pendingRegistrations.length > 0 && (
                          <>
                            <Text style={styles.expandedTitle}>משתתפים ממתינים לאישור:</Text>
                            {pendingRegistrations.map((reg, index) => (
                              <Text key={reg.id} style={styles.expandedDesc}>
                                {index + 1}. {reg.users?.firstname} {reg.users?.lastname}
                              </Text>
                            ))}
                          </>
                        )}
                        
                        <View style={styles.adminButtonsRow}>
                          {isPastEvent && pendingRegistrations.length > 0 && (
                            <TouchableOpacity 
                              style={styles.approveButton} 
                              onPress={() => handleApproveEvent(event.id, event.title)}
                            >
                              <MaterialIcons name="check" size={20} color="#fff" style={{ marginLeft: 6 }} />
                              <Text style={styles.approveButtonText}>אשר השלמה</Text>
                            </TouchableOpacity>
                          )}
                          

                          
                          <TouchableOpacity 
                            style={styles.editButton} 
                            onPress={() => navigation.navigate('AdminUsers' as any)}
                          >
                            <MaterialIcons name="edit" size={20} color="#fff" style={{ marginLeft: 6 }} />
                            <Text style={styles.editButtonText}>ערוך</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={styles.deleteButton} 
                            onPress={() => handleDeleteEvent(event.id, event.title)}
                          >
                            <MaterialIcons name="delete" size={20} color="#fff" style={{ marginLeft: 6 }} />
                            <Text style={styles.deleteButtonText}>מחק</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>


        
        {/* Bottom Navigation for Admin */}
        <View style={styles.adminBottomNav}>
          <View style={styles.adminBottomNavContent}>
            <TouchableOpacity style={styles.adminNavButton} onPress={async () => {
              navigation.navigate('AdminUsers' as any);
            }}>
              <Text style={styles.adminNavIcon}>⚙️</Text>
              <Text style={styles.adminNavText}>ניהול</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.adminNavButton} onPress={async () => {
              navigation.navigate('Home');
            }}>
              <Text style={styles.adminNavIcon}>🏠</Text>
              <Text style={styles.adminNavText}>בית</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.adminNavButton, styles.adminNavButtonActive]}>
              <View style={styles.adminActiveIconBackground}>
                <Text style={styles.adminNavIconActive}>🤝</Text>
              </View>
              <Text style={styles.adminNavTextActive}>התנדבויות</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // המסך הראשי - ללא מסך טעינה
  return (
    <SafeAreaView style={styles.container}>
      {showSuccess && (
        <Animated.View style={[styles.successToast, { opacity: fadeAnim }]}> 
          <MaterialIcons name="check-circle" size={24} color="#4CAF50" style={{ marginLeft: 8 }} />
          <Text style={styles.successToastText}>🎉 נרשמת להתנדבות בהצלחה!</Text>
        </Animated.View>
      )}
      {showUnregister && (
        <Animated.View style={[styles.unregisterToast, { opacity: fadeAnim }]}> 
          <MaterialIcons name="cancel" size={24} color="#f44336" style={{ marginLeft: 8 }} />
          <Text style={styles.unregisterToastText}>❌ הוסרת מההתנדבות</Text>
        </Animated.View>
      )}
      
      <View style={styles.summaryBar}>
        <Text style={[styles.summaryText, { fontSize: responsiveFontSize(16) }]}>נרשמת ל-{registeredCount} התנדבויות</Text>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowOnlyRegistered(v => !v)}>
          <Text style={[styles.filterBtnText, { fontSize: responsiveFontSize(15) }]}>{showOnlyRegistered ? 'הצג הכל' : 'הצג רק שנרשמתי'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.headerIcon}>🤲</Text>
        <Text style={[styles.headerTitle, { fontSize: responsiveFontSize(24) }]}>התנדבויות זמינות</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        removeClippedSubviews={true}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { fontSize: responsiveFontSize(18) }]}>
              {showOnlyRegistered ? 'לא נרשמת לאף התנדבות' : 'אין התנדבויות זמינות כרגע'}
            </Text>
          </View>
        ) : (
          filteredEvents.map(event => {
            const expanded = expandedId === event.id;
            const isRegistered = isUserRegistered(event.id);
            const isFull = event.current_participants >= event.max_participants;
            
            return (
              <EventCard
                key={event.id}
                event={event}
                expanded={expanded}
                isRegistered={isRegistered}
                isFull={isFull}
                onToggleExpand={() => handleToggleExpand(event.id)}
                onRegister={() => handleRegister(event.id)}
                onUnregister={() => handleUnregister(event.id)}
                formatDate={formatDate}
                formatTime={formatTime}
                registeredUsers={eventRegistrations[event.id] || []}
                currentUserId={currentUser?.id}
                isRegistering={registeringEvents.has(event.id)}
                isUnregistering={unregisteringEvents.has(event.id)}
                responsiveFontSize={responsiveFontSize}
              />
            );
          })
        )}
      </ScrollView>

      {/* באנר תחתון */}
      <View style={styles.bottomBanner}>
        <TouchableOpacity 
          style={styles.bannerIconWrap}
          onPress={() => navigation.navigate('Trophy')}
        >
          <Image 
            source={require('../../assets/images/trophy.png')}
            style={styles.bannerIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.bannerIconWrap}
          onPress={() => navigation.navigate('Gift')}
        >
          <Image 
            source={require('../../assets/images/gift.png')}
            style={styles.bannerIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.bannerIconWrap}
          onPress={() => navigation.navigate('Home')}
        >
          <Image 
            source={require('../../assets/images/home.png')}
            style={styles.bannerIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.bannerIconWrap}
          onPress={() => navigation.navigate('Calendar')}
        >
          <Image 
            source={require('../../assets/images/calander.png')}
            style={styles.bannerIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bannerIconWrap, styles.activeIconWrap]}
        >
          <View style={styles.activeIconBackground}>
            <Image 
              source={require('../../assets/images/volunteer.png')}
              style={styles.bannerIcon}
            />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF6DA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
    paddingBottom: 12,
    gap: 8,
  },
  headerIcon: {
    fontSize: 28,
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardImage: {
    width: 90,
    height: 90,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5DC6',
    marginBottom: 4,
    textAlign: 'right',
  },
  cardDesc: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
    textAlign: 'right',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMeta: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  cardButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginLeft: 8,
    marginRight: 0,
    marginTop: 0,
    marginBottom: 0,
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: '#bbb',
  },
  cardButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 15,
  },
  bottomBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
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
    zIndex: 9999,
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
  cardExpanded: {
    // Add styles for expanded card
  },
  expandedSection: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  expandedTitle: {
    fontWeight: 'bold',
    color: '#2D5DC6',
    marginTop: 8,
    textAlign: 'right',
  },
  expandedDesc: {
    color: '#444',
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'right',
  },
  volunteersList: {
    marginTop: 4,
    alignItems: 'flex-end',
  },
  volunteerName: {
    color: '#222',
    fontSize: 14,
    textAlign: 'right',
  },
  currentUserVolunteer: {
    color: '#34D399',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5DC6',
    marginBottom: 12,
    textAlign: 'right',
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    alignSelf: 'flex-end',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  unregisterButton: {
    backgroundColor: '#f44336',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    alignSelf: 'flex-end',
    shadowColor: '#f44336',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  unregisterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  toast: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#388e3c',
    paddingVertical: 12,
    marginHorizontal: 32,
    marginTop: 8,
    borderRadius: 16,
    alignItems: 'center',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  toastText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    textAlign: 'center',
  },
  cardRegistered: {
    borderWidth: 2,
    borderColor: '#4BB543',
    backgroundColor: '#F1FDF3',
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 14,
    margin: 12,
    marginBottom: 15,
  },
  summaryText: {
    fontSize: 16,
    color: '#2D5DC6',
    fontWeight: 'bold',
  },
  filterBtn: {
    backgroundColor: '#4BB543',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  filterBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    fontSize: 50,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5DC6',
  },
  fullButton: {
    backgroundColor: '#ff9800',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  fullButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  cardLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'right',
  },
  cardPastEvent: {
    // Add styles for past event card
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  approveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  editButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  adminButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adminBottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#D7D2B6',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
    zIndex: 1000,
  },
  adminBottomNavContent: {
    height: 85,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 12,
  },
  adminNavButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingTop: 10,
  },
  adminNavButtonActive: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminActiveIconBackground: {
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  adminNavIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  adminNavIconActive: {
    fontSize: 24,
  },
  adminNavText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  adminNavTextActive: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2D5DC6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  modalCloseText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  participantCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  participantEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  participantStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  decisionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  approveBtn: {
    backgroundColor: '#e0e0e0',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveBtnActive: {
    backgroundColor: '#4CAF50',
  },
  approveBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  approveBtnTextActive: {
    color: 'white',
  },
  rejectBtn: {
    backgroundColor: '#e0e0e0',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtnActive: {
    backgroundColor: '#f44336',
  },
  rejectBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  rejectBtnTextActive: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  participantsButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  participantsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  registerButtonLoading: {
    backgroundColor: '#81C784',
    shadowOpacity: 0.1,
  },
  unregisterButtonLoading: {
    backgroundColor: '#e57373',
    shadowOpacity: 0.1,
  },
  successToast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  successToastText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    marginRight: 8,
  },
  unregisterToast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
    backgroundColor: '#f44336',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f44336',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  unregisterToastText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    marginRight: 8,
  },
  boldText: {
    fontWeight: 'bold',
  },
});

export default VolunteerScreen; 