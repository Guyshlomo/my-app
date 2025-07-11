import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { supabase } from '../config/supabase';
import { createVolunteerEvent, deleteVolunteerEvent, getCurrentUserFromSupabase, getEventRegistrations, getVolunteerEventsByAdmin } from '../db/supabaseApi';
import type { CreateVolunteerEventData, User, VolunteerEvent, VolunteerRegistration } from '../types/types';


export default function AdminUsersScreen({ navigation, route }: any) {
  const [events, setEvents] = useState<VolunteerEvent[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedEventParticipants, setSelectedEventParticipants] = useState<VolunteerRegistration[]>([]);
  const [selectedEventTitle, setSelectedEventTitle] = useState<string>('');
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  // Removed users state and activeTab - admin can only manage events
  
  // Form state for creating events
  const [newEvent, setNewEvent] = useState<CreateVolunteerEventData>({
    title: '',
    description: '',
    location: '',
    date: '',
    time: '',
    max_participants: 10,
    coins_reward: 5,
    image_url: ''
  });

  // Recurring event state
  const [recurringType, setRecurringType] = useState<'none' | 'weekly'>('none');
  const [recurringCount, setRecurringCount] = useState(1);

  // Recurring options
  const recurringOptions = [
    { value: 'none', label: 'חד פעמי', icon: '📅' },
    { value: 'weekly', label: 'שבועי', icon: '🔄' },
  ];

  // Predefined templates for quick event creation
  const eventTemplates = [
    {
      id: 'cleanup',
      title: 'ניקיון סביבתי',
      description: 'פעילות ניקיון ושיפור הסביבה',
      location: 'נקבע לפי הצורך',
      max_participants: 15,
      coins_reward: 20,
      icon: '🌱'
    },
    {
      id: 'elderly',
      title: 'סיוע לקשישים',
      description: 'עזרה וליווי לאוכלוסיית הקשישים',
      location: 'בית אבות מקומי',
      max_participants: 8,
      coins_reward: 15,
      icon: '👵'
    },
    {
      id: 'education',
      title: 'חונכות לילדים',
      description: 'סיוע לימודי וחינוכי לילדים',
      location: 'בית ספר יסודי',
      max_participants: 10,
      coins_reward: 20,
      icon: '📚'
    },
    {
      id: 'food',
      title: 'חלוקת מזון',
      description: 'חלוקת מזון לנזקקים',
      location: 'מרכז קהילתי',
      max_participants: 12,
      coins_reward: 10,
      icon: '🍞'
    },
    {
      id: 'event',
      title: 'ארגון אירוע קהילתי',
      description: 'עזרה בארגון וניהול אירועים קהילתיים',
      location: 'מתחם אירועים',
      max_participants: 20,
      coins_reward: 15,
      icon: '🎉'
    },
    {
      id: 'medical',
      title: 'תמיכה רפואית',
      description: 'ליווי וסיוע במוסדות רפואיים',
      location: 'בית חולים מקומי',
      max_participants: 6,
      coins_reward: 20,
      icon: '🏥'
    }
  ];

  useEffect(() => {
    loadUserData();
    
    // Check if we should open create form automatically
    if (route?.params?.openCreateForm) {
      setShowCreateModal(true);
    }
  }, [route?.params?.openCreateForm]);

  // Load data after user is loaded
  useEffect(() => {
    if (currentUser?.id) {
      loadData();
    }
  }, [currentUser?.id]);

  const loadUserData = async () => {
    try {
      console.log('👤 AdminUsersScreen: Loading current user...');
      const user = await getCurrentUserFromSupabase();
      if (user) {
        console.log('👤 AdminUsersScreen: User loaded:', user.firstName, 'isAdmin:', user.isAdmin);
        setCurrentUser(user);
        if (user.isAdmin) {
          console.log('👑 AdminUsersScreen: User is admin');
        } else {
          console.log('⚠️ AdminUsersScreen: User is NOT admin');
        }
      } else {
        console.log('❌ AdminUsersScreen: No user found');
      }
    } catch (error) {
      console.error('❌ AdminUsersScreen: Error loading user data:', error);
    }
  };

  const loadData = async () => {
    try {
      console.log('📊 AdminUsersScreen: Loading events data...');
      setLoading(true);
      
      if (!currentUser?.id) {
        console.log('❌ AdminUsersScreen: No current user ID available');
        setEvents([]);
        return;
      }
      
      const eventsData = await getVolunteerEventsByAdmin(currentUser.id);
      
      console.log('📊 AdminUsersScreen: Loaded events for admin:', eventsData.length);
      
      setEvents(eventsData);
    } catch (error) {
      console.error('❌ AdminUsersScreen: Error loading events data:', error);
      Alert.alert('שגיאה', 'לא ניתן לטעון נתונים');
    } finally {
      console.log('📊 AdminUsersScreen: Loading completed');
      setLoading(false);
    }
  };

  // Removed handleToggleAdmin - admin cannot manage other users

  // Create recurring events
  const createRecurringEvents = async (baseEventData: any, recurringType: string, count: number) => {
    const events = [];
    const baseDate = new Date(baseEventData.date);
    
    for (let i = 0; i < count; i++) {
      const eventDate = new Date(baseDate);
      
      // Calculate date based on recurring type
      switch (recurringType) {
        case 'weekly':
          eventDate.setDate(baseDate.getDate() + (i * 7));
          break;
        default:
          // 'none' - only create one event
          if (i > 0) continue;
      }
      
      const eventData = {
        ...baseEventData,
        date: eventDate.toISOString().split('T')[0],
        title: count > 1 ? `${baseEventData.title} (${i + 1}/${count})` : baseEventData.title,
      };
      
      events.push(eventData);
    }
    
    return events;
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.location || !newEvent.date || !newEvent.time || !newEvent.coins_reward) {
      Alert.alert('שגיאה', 'נא למלא את כל השדות הנדרשים');
      return;
    }
    if (![5,10,15,20].includes(newEvent.coins_reward)) {
      Alert.alert('שגיאה', 'כמות מטבעות לא תקינה');
      return;
    }

    try {
      // Format date properly for database
      let formattedDate = newEvent.date;
      
      // Check if date is in DD-MM-YYYY format and convert to YYYY-MM-DD
      if (newEvent.date.includes('-') && newEvent.date.length === 10) {
        const parts = newEvent.date.split('-');
        if (parts.length === 3 && parts[0].length === 2) {
          // Convert DD-MM-YYYY to YYYY-MM-DD
          formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formattedDate)) {
        Alert.alert('שגיאה', 'פורמט התאריך צריך להיות YYYY-MM-DD (לדוגמה: 2024-12-31)');
        return;
      }

      // Validate time format
      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(newEvent.time)) {
        Alert.alert('שגיאה', 'פורמט השעה צריך להיות HH:MM (לדוגמה: 14:30)');
        return;
      }

      const baseEventData = {
        ...newEvent,
        date: formattedDate,
        created_by: currentUser?.id || '',
        description: newEvent.description || '',
        max_participants: newEvent.max_participants || 10,
        coins_reward: newEvent.coins_reward || 50
      };

      // Create recurring events
      const eventsToCreate = await createRecurringEvents(baseEventData, recurringType, recurringCount);
      
      console.log(`🔄 Creating ${eventsToCreate.length} events (${recurringType})`);
      
      // Create all events
      for (const eventData of eventsToCreate) {
        await createVolunteerEvent(eventData);
      }

      setShowCreateModal(false);
      setNewEvent({
        title: '',
        description: '',
        location: '',
        date: '',
        time: '',
        max_participants: 10,
        coins_reward: 5,
        image_url: ''
      });
      setRecurringType('none');
      setRecurringCount(1);
      
      await loadData();
      
      const successMessage = eventsToCreate.length > 1 
        ? `${eventsToCreate.length} אירועים חוזרים נוצרו בהצלחה`
        : 'התנדבות נוצרה בהצלחה';
      
      Alert.alert('הצלחה', successMessage);
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('שגיאה', 'לא ניתן ליצור התנדבות');
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
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
              await loadData();
              Alert.alert('הצלחה', 'התנדבות נמחקה');
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('שגיאה', 'לא ניתן למחוק התנדבות');
            }
          }
        }
      ]
    );
  };

  const handleShowParticipants = async (eventId: string, eventTitle: string) => {
    try {
      console.log('📋 Loading participants for event:', eventId);
      const participants = await getEventRegistrations(eventId);
      setSelectedEventParticipants(participants);
      setSelectedEventTitle(eventTitle);
      setShowParticipantsModal(true);
    } catch (error) {
      console.error('Error loading participants:', error);
      Alert.alert('שגיאה', 'לא ניתן לטעון רשימת משתתפים');
    }
  };



  const handleUpdateParticipantCount = async (eventId: string, newCount: number) => {
    try {
      console.log('📋 Updating participant count for event:', eventId);
      const { error: updateError } = await supabase
        .from('volunteer_events')
        .update({ max_participants: newCount })
        .eq('id', eventId);

      if (updateError) {
        console.error('Error updating participant count:', updateError);
        Alert.alert('שגיאה', 'שגיאה בעדכון מספר המשתתפים');
      } else {
        console.log('✅ Participant count updated successfully');
        await loadData();
      }
    } catch (error) {
      console.error('Error updating participant count:', error);
      Alert.alert('שגיאה', 'שגיאה בעדכון מספר המשתתפים');
    }
  };

  // Apply template to new event form
  const applyTemplate = (template: any) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Use admin's settlement as location for better notification targeting
    const templateLocation = currentUser?.settlement || template.location;
    
    setNewEvent({
      title: template.title,
      description: template.description,
      location: templateLocation, // Use admin's settlement
      date: tomorrow.toISOString().split('T')[0],
      time: '09:00',
      max_participants: template.max_participants,
      coins_reward: template.coins_reward,
      image_url: ''
    });
    setShowTemplatesModal(false);
    setShowCreateModal(true);
  };

  // Duplicate existing event
  const duplicateEvent = (event: VolunteerEvent) => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    setNewEvent({
      title: event.title + ' (העתק)',
      description: event.description,
      location: event.location,
      date: nextWeek.toISOString().split('T')[0],
      time: event.time,
      max_participants: event.max_participants,
      coins_reward: event.coins_reward,
      image_url: event.image_url || ''
    });
    setShowCreateModal(true);
  };

  const handleConfirmDate = (date: Date) => {
    setNewEvent(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
    setDatePickerVisible(false);
  };

  const handleCancelDate = () => {
    setDatePickerVisible(false);
  };

  const handleConfirmTime = (date: Date) => {
    // Format as HH:MM
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    setNewEvent(prev => ({ ...prev, time: `${hours}:${minutes}` }));
    setTimePickerVisible(false);
  };

  const handleCancelTime = () => {
    setTimePickerVisible(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>טוען...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header with Quick Actions */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ניהול התנדבויות</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>חזור</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Action Bar */}
      <View style={styles.quickActionBar}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.quickActionIcon}>➕</Text>
          <Text style={styles.quickActionText}>יצירה חדשה</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setShowTemplatesModal(true)}
        >
          <Text style={styles.quickActionIcon}>📋</Text>
          <Text style={styles.quickActionText}>תבניות</Text>
        </TouchableOpacity>
      </View>

      {/* Removed user management tabs - Admin can only manage events */}

      <ScrollView style={styles.content}>
        {/* Only show events management - removed user management */}
        <View>
          <View style={styles.eventsHeader}>
            <Text style={styles.sectionTitle}>ההתנדבויות שיצרתי ({events.length})</Text>
          </View>
          
          {events.length === 0 ? (
            <View style={styles.emptyEventsContainer}>
              <Text style={styles.emptyEventsIcon}>📝</Text>
              <Text style={styles.emptyEventsTitle}>עדיין לא יצרת התנדבויות</Text>
              <Text style={styles.emptyEventsText}>השתמש בכפתורים למעלה כדי ליצור התנדבות חדשה או להשתמש בתבניות מוכנות</Text>
            </View>
          ) : (
            events.map(event => (
            <View key={event.id} style={styles.eventCard}>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDetails}>
                  📍 {event.location} | 📅 {new Date(event.date).toLocaleDateString('he-IL')}
                </Text>
                <Text style={styles.eventDetails}>
                  ⏰ {event.time} | 👥 {event.current_participants || 0}/{event.max_participants}
                </Text>
              </View>
                              <View style={styles.eventActions}>
                  <TouchableOpacity
                    style={styles.participantsButton}
                    onPress={() => handleShowParticipants(event.id, event.title)}
                  >
                    <Text style={styles.participantsButtonText}>רשימת משתתפים</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.duplicateButton}
                    onPress={() => duplicateEvent(event)}
                  >
                    <Text style={styles.duplicateButtonText}>שכפל</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteEvent(event.id, event.title)}
                  >
                    <Text style={styles.deleteButtonText}>מחק</Text>
                  </TouchableOpacity>
                </View>
            </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Create Event Modal */}
      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>יצירת התנדבות חדשה</Text>
          </View>
          
          <ScrollView 
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
            showsVerticalScrollIndicator={true}
            bounces={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>כותרת *</Text>
              <TextInput
                style={styles.input}
                value={newEvent.title}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, title: text }))}
                placeholder="שם ההתנדבות"
                returnKeyType="next"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>תיאור</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newEvent.description}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, description: text }))}
                placeholder="תיאור ההתנדבות"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                returnKeyType="next"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>מיקום *</Text>
              <View style={styles.quickLocationBar}>
                {[
                  'ניר-עם',
                  'כפר עזה',
                  'ארז',
                  'יכיני',
                  'אור-הנר',
                  'נחל עוז',
                  'ברור-חיל',
                  'גבים',
                  'דורות',
                  'מפלסים',
                  'רוחמה'
                ].map((location) => (
                  <TouchableOpacity
                    key={location}
                    style={[
                      styles.quickLocationButton,
                      newEvent.location === location && styles.quickLocationButtonActive
                    ]}
                    onPress={() => setNewEvent(prev => ({ ...prev, location }))}
                  >
                    <Text style={[
                      styles.quickLocationText,
                      newEvent.location === location && styles.quickLocationTextActive
                    ]}>
                      {location}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>תאריך *</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setDatePickerVisible(true)}
              >
                <Text style={{ color: newEvent.date ? '#222' : '#888', textAlign: 'right', width: '100%' }}>
                  {newEvent.date ? new Date(newEvent.date).toLocaleDateString('he-IL') : 'בחר תאריך'}
                </Text>
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirmDate}
                onCancel={handleCancelDate}
                minimumDate={new Date()}
                display="spinner"
                locale="he-IL"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>שעה * (HH:MM)</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setTimePickerVisible(true)}
              >
                <Text style={{ color: newEvent.time ? '#222' : '#888', textAlign: 'right', width: '100%' }}>
                  {newEvent.time ? newEvent.time : 'בחר שעה'}
                </Text>
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={isTimePickerVisible}
                mode="time"
                onConfirm={handleConfirmTime}
                onCancel={handleCancelTime}
                display="spinner"
                locale="he-IL"
                minuteInterval={5}
              />
              {/* Quick Time Suggestions */}
              <View style={styles.quickTimeBar}>
                {['09:00', '10:00', '14:00', '16:00', '18:00'].map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.quickTimeButton,
                      newEvent.time === time && styles.quickTimeButtonActive
                    ]}
                    onPress={() => setNewEvent(prev => ({ ...prev, time }))}
                  >
                    <Text style={[
                      styles.quickTimeText,
                      newEvent.time === time && styles.quickTimeTextActive
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>מספר משתתפים מקסימלי</Text>
              <TextInput
                style={styles.input}
                value={newEvent.max_participants?.toString()}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, max_participants: parseInt(text) || 10 }))}
                placeholder="10"
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>תגמול מטבעות</Text>
              <View style={styles.quickCoinsBar}>
                {[5, 10, 15, 20].map((reward) => (
                  <TouchableOpacity
                    key={reward}
                    style={[
                      styles.quickCoinsButton,
                      newEvent.coins_reward === reward && styles.quickCoinsButtonActive
                    ]}
                    onPress={() => setNewEvent(prev => ({ ...prev, coins_reward: reward }))}
                  >
                    <Text style={[
                      styles.quickCoinsText,
                      newEvent.coins_reward === reward && styles.quickCoinsTextActive
                    ]}>
                      {reward}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recurring Event Section */}
            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>התנדבות חוזרת</Text>
              <View style={styles.recurringOptionsBar}>
                {recurringOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.recurringOptionButton,
                      recurringType === option.value && styles.recurringOptionButtonActive
                    ]}
                    onPress={() => setRecurringType(option.value as 'none' | 'weekly')}
                  >
                    <Text style={styles.recurringOptionIcon}>{option.icon}</Text>
                    <Text style={styles.recurringOptionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {recurringType !== 'none' && (
                <View style={styles.recurringCountBar}>
                  <Text style={styles.recurringCountLabel}>כמות חוזרות: </Text>
                  <TextInput
                    style={styles.recurringCountInput}
                    value={recurringCount.toString()}
                    onChangeText={(text) => setRecurringCount(parseInt(text) || 1)}
                    keyboardType="numeric"
                    returnKeyType="done"
                  />
                </View>
              )}
            </View>


            {/* Preview Section - Bottom Summary */}
            {(newEvent.title || newEvent.location || newEvent.date || newEvent.time) && (
              <View style={styles.bottomPreviewContainer}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewTitle}>סיכום ההתנדבות ✨</Text>
                </View>
                
                <View style={styles.eventPreviewCard}>
                  <View style={styles.previewCardHeader}>
                    <Text style={styles.previewCardIcon}>🎯</Text>
                    <Text style={styles.previewCardTitle}>
                      {newEvent.title || 'שם ההתנדבות'}
                    </Text>
                  </View>
                  
                  <View style={styles.previewDetails}>
                    {newEvent.location && (
                      <View style={styles.previewDetailRow}>
                        <Text style={styles.previewDetailIcon}>📍</Text>
                        <Text style={styles.previewDetailText}>{newEvent.location}</Text>
                      </View>
                    )}
                    
                    {newEvent.date && (
                      <View style={styles.previewDetailRow}>
                        <Text style={styles.previewDetailIcon}>📅</Text>
                        <Text style={styles.previewDetailText}>{newEvent.date}</Text>
                      </View>
                    )}
                    
                    {newEvent.time && (
                      <View style={styles.previewDetailRow}>
                        <Text style={styles.previewDetailIcon}>🕐</Text>
                        <Text style={styles.previewDetailText}>{newEvent.time}</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.previewStats}>
                    <View style={styles.previewStatItem}>
                      <Text style={styles.previewStatIcon}>👥</Text>
                      <Text style={styles.previewStatNumber}>{newEvent.max_participants || 10}</Text>
                      <Text style={styles.previewStatLabel}>משתתפים</Text>
                    </View>
                    
                    <View style={styles.previewStatItem}>
                      <Text style={styles.previewStatIcon}>🪙</Text>
                      <Text style={styles.previewStatNumber}>{newEvent.coins_reward || 50}</Text>
                      <Text style={styles.previewStatLabel}>מטבעות</Text>
                    </View>
                  </View>
                  
                  {newEvent.description && (
                    <View style={styles.previewDescription}>
                      <Text style={styles.previewDescriptionText}>{newEvent.description}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            <View style={styles.buttonSection}>
              <TouchableOpacity style={styles.createEventButton} onPress={handleCreateEvent}>
                <Text style={styles.createEventButtonText}>צור התנדבות</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Participants Modal */}
      <Modal visible={showParticipantsModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowParticipantsModal(false)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>משתתפים - {selectedEventTitle}</Text>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedEventParticipants.length === 0 ? (
              <Text style={styles.noParticipantsText}>אין משתתפים רשומים להתנדבות זו</Text>
            ) : (
              <>
                <Text style={styles.participantsCount}>
                  סה"כ משתתפים: {selectedEventParticipants.length}
                </Text>
                
                                 {selectedEventParticipants.map((participant, index) => (
                   <View key={participant.id} style={styles.participantCard}>
                     <View style={styles.participantFullInfo}>
                       <Text style={styles.participantNumber}>
                         {index + 1}. {participant.users?.firstname} {participant.users?.lastname}
                       </Text>
                       <Text style={styles.participantStatus}>
                         סטטוס: {participant.status === 'registered' ? 'רשום' : 
                                 participant.status === 'completed' ? 'הושלם' : 'בוטל'}
                       </Text>
                       <Text style={styles.participantDate}>
                         נרשם: {new Date(participant.registered_at).toLocaleDateString('he-IL')}
                       </Text>
                     </View>
                   </View>
                 ))}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Templates Modal */}
      <Modal
        visible={showTemplatesModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>תבניות התנדבות</Text>
            <TouchableOpacity onPress={() => setShowTemplatesModal(false)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.templatesGrid}>
              {eventTemplates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={styles.templateCard}
                  onPress={() => applyTemplate(template)}
                >
                  <Text style={styles.templateIcon}>{template.icon}</Text>
                  <Text style={styles.templateTitle}>{template.title}</Text>
                  <Text style={styles.templateDescription}>{template.description}</Text>
                  <View style={styles.templateStats}>
                    <Text style={styles.templateStat}>👥 {template.max_participants} משתתפים</Text>
                    <Text style={styles.templateStat}>🪙 {template.coins_reward} מטבעות</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      
      {/* Bottom Navigation for Admin */}
      <View style={styles.adminBottomNav}>
        <View style={styles.adminBottomNavContent}>
          <TouchableOpacity style={[styles.adminNavButton, styles.adminNavButtonActive]}>
            <View style={styles.adminActiveIconBackground}>
              <Text style={styles.adminNavIconActive}>⚙️</Text>
            </View>
            <Text style={styles.adminNavTextActive}>ניהול</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.adminNavButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.adminNavIcon}>🏠</Text>
            <Text style={styles.adminNavText}>בית</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.adminNavButton} onPress={() => navigation.navigate('Volunteer', { from: 'AdminUsers' })}>
            <Text style={styles.adminNavIcon}>🤝</Text>
            <Text style={styles.adminNavText}>התנדבויות</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2D5DC6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2D5DC6',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#2D5DC6',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'right',
  },
  userCard: {
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
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userDetails: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  adminButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  adminButtonActive: {
    backgroundColor: '#4CAF50',
  },
  adminButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 12,
  },
  adminButtonTextActive: {
    color: 'white',
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  eventCard: {
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
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  eventDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  eventActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  participantsButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  duplicateButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  duplicateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 18,
    marginTop: 50,
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
  },
  modalCloseText: {
    fontSize: 24,
    color: 'white',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 4,
    color: '#333',
    textAlign: 'right',
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    textAlign: 'right',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    textAlign: 'right',
    paddingTop: 12,
  },
  modalContentContainer: {
    paddingBottom: 40,
  },
  formSection: {
    marginBottom: 12,
  },
  buttonSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  createEventButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  createEventButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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
  noParticipantsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 40,
    fontStyle: 'italic',
  },
  participantsCount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  participantCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  participantNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D5DC6',
    marginLeft: 24,
    flex: 1,
    textAlign: 'left',
    marginBottom: 4,
  },
  participantInfo: {
    flex: 1,
  },
  participantFullInfo: {
    alignItems: 'center',
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  participantEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  participantStatus: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
    textAlign: 'center',
  },
  participantDate: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  participantMainInfo: {
    flex: 1,
  },
  participantNameSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  // Quick Action Bar Styles
  quickActionBar: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  primaryAction: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  // Templates Modal Styles
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 8,
  },
  templateCard: {
    width: '47%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  templateIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  templateDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  templateStats: {
    alignItems: 'center',
    gap: 4,
  },
  templateStat: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
  },
  // Quick Time Selection Styles
  quickTimeBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  quickTimeButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickTimeButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  quickTimeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  quickTimeTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Quick Location Selection Styles
  quickLocationBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
    justifyContent: 'flex-end',
  },
  quickLocationButton: {
    minWidth: 72,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#ddd',
    marginBottom: 6,
  },
  quickLocationButtonActive: {
    backgroundColor: '#B7EFC5',
    borderColor: '#388e3c',
  },
  quickLocationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
  },
  quickLocationTextActive: {
    color: '#388e3c',
  },
  // Modal Layout Styles
  modalBodyContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  // Preview Container Styles
  previewContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderLeftWidth: 1,
    borderLeftColor: '#e9ecef',
    padding: 16,
  },
  bottomPreviewContainer: {
    backgroundColor: '#ffffff',
    marginTop: 16,
    marginBottom: 16,
  },
  previewHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
    textAlign: 'center',
  },
  // Event Preview Card Styles
  eventPreviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#e3f2fd',
  },
  previewCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewCardIcon: {
    fontSize: 24,
    marginLeft: 8,
  },
  previewCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    textAlign: 'right',
  },
  previewDetails: {
    marginBottom: 16,
  },
  previewDetailRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewDetailIcon: {
    fontSize: 16,
    marginLeft: 8,
    width: 20,
    textAlign: 'center',
  },
  previewDetailText: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
    textAlign: 'right',
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
  },
  previewStatItem: {
    alignItems: 'center',
  },
  previewStatIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  previewStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  previewStatLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  previewDescription: {
    backgroundColor: '#f1f3f4',
    borderRadius: 8,
    padding: 12,
  },
  previewDescriptionText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    textAlign: 'right',
  },
  // Empty Preview Styles
  emptyPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
  },
  emptyPreviewIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyPreviewText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6c757d',
    marginBottom: 4,
  },
  emptyPreviewSubtext: {
    fontSize: 14,
    color: '#adb5bd',
  },
  // Motivation Box Styles
  motivationBox: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  motivationIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  // Tips Section Styles
  tipsSection: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
    lineHeight: 20,
  },
  // Empty Events Styles
  emptyEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
  },
  emptyEventsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyEventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyEventsText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  quickCoinsBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    marginBottom: 8,
    gap: 12,
  },
  quickCoinsButton: {
    minWidth: 56,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  quickCoinsButtonActive: {
    backgroundColor: '#B7EFC5',
    borderColor: '#388e3c',
  },
  quickCoinsText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
  },
  quickCoinsTextActive: {
    color: '#388e3c',
  },
  // Recurring Event Styles
  recurringOptionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 8,
  },
  recurringOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  recurringOptionButtonActive: {
    backgroundColor: '#4CAF50',
  },
  recurringOptionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  recurringOptionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  recurringCountBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    marginBottom: 12,
  },
  recurringCountLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  recurringCountInput: {
    width: 60,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 10,
    textAlign: 'right',
    fontSize: 16,
    color: '#333',
  },
}); 