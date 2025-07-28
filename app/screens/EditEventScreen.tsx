import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { getCurrentUserFromSupabase, updateVolunteerEvent } from '../db/supabaseApi';
import type { User } from '../types/types';

export default function EditEventScreen({ navigation, route }: any) {
  const { eventId, eventData } = route.params;
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: eventData.title || '',
    description: eventData.description || '',
    location: eventData.location || '',
    date: eventData.date || '',
    time: eventData.time || '',
    max_participants: eventData.max_participants || 10,
    coins_reward: eventData.coins_reward || 5,
    image_url: eventData.image_url || ''
  });

  // Track changes
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    // Check if form has changes
    const hasFormChanges = 
      formData.title !== eventData.title ||
      formData.description !== eventData.description ||
      formData.location !== eventData.location ||
      formData.date !== eventData.date ||
      formData.time !== eventData.time ||
      formData.max_participants !== eventData.max_participants ||
      formData.coins_reward !== eventData.coins_reward ||
      formData.image_url !== (eventData.image_url || '');
    
    setHasChanges(hasFormChanges);
  }, [formData, eventData]);

  const loadUserData = async () => {
    try {
      const user = await getCurrentUserFromSupabase();
      if (user && user.isAdmin) {
        // בדיקה שרק יוצר ההתנדבות יכול לערוך אותה
        if (eventData.created_by === user.id) {
          setCurrentUser(user);
        } else {
          Alert.alert(
            'אין הרשאה', 
            'רק יוצר ההתנדבות יכול לערוך אותה. התנדבות זו נוצרה על ידי משתמש אחר.',
            [{ text: 'הבנתי', onPress: () => navigation.goBack() }]
          );
        }
      } else {
        Alert.alert('שגיאה', 'אין לך הרשאות לערוך אירועים');
        navigation.goBack();
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      Alert.alert('שגיאה', 'לא ניתן לטעון נתוני משתמש');
      navigation.goBack();
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateConfirm = (date: Date) => {
    const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
    handleInputChange('date', formattedDate);
    setDatePickerVisible(false);
  };

  const handleTimeConfirm = (time: Date) => {
    const formattedTime = time.toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    handleInputChange('time', formattedTime);
    setTimePickerVisible(false);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('שגיאה', 'נא להזין כותרת');
      return false;
    }
    if (!formData.location.trim()) {
      Alert.alert('שגיאה', 'נא להזין מיקום');
      return false;
    }
    if (!formData.date) {
      Alert.alert('שגיאה', 'נא לבחור תאריך');
      return false;
    }
    if (!formData.time) {
      Alert.alert('שגיאה', 'נא לבחור שעה');
      return false;
    }
    if (formData.max_participants < 1 || formData.max_participants > 100) {
      Alert.alert('שגיאה', 'מספר המשתתפים חייב להיות בין 1 ל-100');
      return false;
    }
    if (![5, 10, 15, 20].includes(formData.coins_reward)) {
      Alert.alert('שגיאה', 'כמות המטבעות חייבת להיות 5, 10, 15 או 20');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!hasChanges) {
      Alert.alert('מידע', 'לא בוצעו שינויים');
      return;
    }

    Alert.alert(
      'שמירת שינויים',
      'האם אתה בטוח שברצונך לשמור את השינויים?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'שמור',
          onPress: async () => {
            setSaving(true);
            try {
              console.log('💾 [EditEvent] Saving changes for event:', eventId);
              
              // Update event using API function
              await updateVolunteerEvent(eventId, {
                title: formData.title.trim(),
                description: formData.description.trim(),
                location: formData.location.trim(),
                date: formData.date,
                time: formData.time,
                max_participants: formData.max_participants,
                coins_reward: formData.coins_reward,
                image_url: formData.image_url.trim() || undefined,
              });

              console.log('✅ [EditEvent] Event updated successfully');
              
              // Show success message
              Alert.alert('הצלחה', 'האירוע עודכן בהצלחה', [
                {
                  text: 'אישור',
                  onPress: () => {
                    // Navigate back and refresh data
                    navigation.goBack();
                    // Emit event to refresh other screens
                    setTimeout(() => {
                      // You can add event emitter here if needed
                    }, 100);
                  }
                }
              ]);

            } catch (error: any) {
              console.error('❌ [EditEvent] Save failed:', error);
              Alert.alert('שגיאה', error.message || 'לא ניתן לשמור את השינויים');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'ביטול עריכה',
        'יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לצאת?',
        [
          { text: 'המשך עריכה', style: 'cancel' },
          {
            text: 'צא בלי לשמור',
            style: 'destructive',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const formatDateForDisplay = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('he-IL');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4BB543" />
        <Text style={styles.loadingText}>טוען...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardAvoidingView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <MaterialIcons name="close" size={24} color="#666" />
            <Text style={styles.cancelButtonText}>ביטול</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>עריכת אירוע</Text>
          
          <TouchableOpacity 
            style={[
              styles.saveButton,
              (!hasChanges || saving) && styles.saveButtonDisabled
            ]} 
            onPress={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="save" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>שמור</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>כותרת האירוע *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => handleInputChange('title', text)}
                placeholder="הזן כותרת לאירוע"
                maxLength={100}
                textAlign="right"
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>תיאור האירוע</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
                placeholder="הזן תיאור מפורט לאירוע"
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlign="right"
                textAlignVertical="top"
              />
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>מיקום *</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) => handleInputChange('location', text)}
                placeholder="הזן מיקום האירוע"
                maxLength={100}
                textAlign="right"
              />
            </View>

            {/* Date and Time */}
            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeGroup}>
                <Text style={styles.label}>תאריך *</Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setDatePickerVisible(true)}
                >
                  <MaterialIcons name="event" size={20} color="#666" />
                  <Text style={styles.dateTimeButtonText}>
                    {formData.date ? formatDateForDisplay(formData.date) : 'בחר תאריך'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dateTimeGroup}>
                <Text style={styles.label}>שעה *</Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setTimePickerVisible(true)}
                >
                  <MaterialIcons name="access-time" size={20} color="#666" />
                  <Text style={styles.dateTimeButtonText}>
                    {formData.time || 'בחר שעה'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Participants */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>מספר משתתפים מקסימלי *</Text>
              <View style={styles.numberInputContainer}>
                <TouchableOpacity
                  style={styles.numberButton}
                  onPress={() => handleInputChange('max_participants', Math.max(1, formData.max_participants - 1))}
                >
                  <MaterialIcons name="remove" size={20} color="#666" />
                </TouchableOpacity>
                
                <TextInput
                  style={styles.numberInput}
                  value={formData.max_participants.toString()}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 1;
                    handleInputChange('max_participants', Math.max(1, Math.min(100, num)));
                  }}
                  keyboardType="numeric"
                  textAlign="center"
                />
                
                <TouchableOpacity
                  style={styles.numberButton}
                  onPress={() => handleInputChange('max_participants', Math.min(100, formData.max_participants + 1))}
                >
                  <MaterialIcons name="add" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Coins Reward */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>תגמול מטבעות *</Text>
              <View style={styles.coinsContainer}>
                {[5, 10, 15, 20].map((coins) => (
                  <TouchableOpacity
                    key={coins}
                    style={[
                      styles.coinButton,
                      formData.coins_reward === coins && styles.coinButtonSelected
                    ]}
                    onPress={() => handleInputChange('coins_reward', coins)}
                  >
                    <Text style={[
                      styles.coinButtonText,
                      formData.coins_reward === coins && styles.coinButtonTextSelected
                    ]}>
                      {coins} 🪙
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Image URL */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>קישור לתמונה (אופציונלי)</Text>
              <TextInput
                style={styles.input}
                value={formData.image_url}
                onChangeText={(text) => handleInputChange('image_url', text)}
                placeholder="הזן קישור לתמונה"
                textAlign="right"
              />
            </View>

            {/* Changes indicator */}
            {hasChanges && (
              <View style={styles.changesIndicator}>
                <MaterialIcons name="edit" size={16} color="#ff9800" />
                <Text style={styles.changesText}>יש שינויים שלא נשמרו</Text>
              </View>
            )}

          </View>
        </ScrollView>

        {/* Date Picker */}
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleDateConfirm}
          onCancel={() => setDatePickerVisible(false)}
          minimumDate={new Date()}
          locale="he-IL"
        />

        {/* Time Picker */}
        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          onConfirm={handleTimeConfirm}
          onCancel={() => setTimePickerVisible(false)}
          is24Hour={true}
          locale="he-IL"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF6DA',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF6DA',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4BB543',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlign: 'right',
  },
  textArea: {
    minHeight: 100,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateTimeGroup: {
    flex: 0.48,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  numberButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    paddingVertical: 12,
  },
  coinsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coinButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  coinButtonSelected: {
    backgroundColor: '#4BB543',
    borderColor: '#4BB543',
  },
  coinButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  coinButtonTextSelected: {
    color: '#fff',
  },
  changesIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  changesText: {
    fontSize: 14,
    color: '#856404',
    marginLeft: 8,
  },
}); 