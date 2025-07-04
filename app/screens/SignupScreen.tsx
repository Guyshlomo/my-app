import React, { useState } from 'react';
import { Alert, Dimensions, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { signupWithSupabase } from '../db/supabaseApi';

const SETTLEMENTS = [
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
];

export default function SignupScreen({ navigation }: any) {
  // Simple iPad detection for responsive text (iPhone UI stays exactly the same)
  const { width: screenWidth } = Dimensions.get('window');
  const isIPad = Platform.OS === 'ios' && screenWidth >= 768;
  const responsiveFontSize = (baseSize: number) => isIPad ? baseSize * 1.2 : baseSize;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [settlement, setSettlement] = useState('');
  const [avatarSeed, setAvatarSeed] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState(true); // אפשרות להסתיר/להציג מייל
  const avatarStyle = 'adventurer';
  const avatarSeeds = [
    null, // אופציית ברירת מחדל - עיגול ריק עם סימן שאלה
    // גברים
    'lion', 'cat', 'dog', 'panda', 'fox', 'koala', 'bear', 'tiger',
    // נשים
    'alice', 'lucy', 'emma', 'olivia', 'mia', 'zoe', 'sophia', 'ava',
    // דמויות חמודות/ניטרליות
    'bunny', 'monkey', 'robot', 'owl', 'penguin', 'unicorn', 'sloth', 'giraffe'
  ];
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isSettlementModalVisible, setSettlementModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  const handleConfirmDate = (date: Date) => {
    setBirthDate(date);
    setDatePickerVisible(false);
  };

  const handleCancelDate = () => {
    setDatePickerVisible(false);
  };

  const handleSettlementSelect = (selectedSettlement: string) => {
    setSettlement(selectedSettlement);
    setSettlementModalVisible(false);
  };

  const handleSignup = async () => {
    // בדיקות תקינות - רק שדות חובה
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('שגיאה', 'נא למלא את השדות החובה: שם פרטי, שם משפחה, אימייל וסיסמה');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('שגיאה', 'הסיסמאות אינן תואמות');
      return;
    }

    if (!avatarSeed) {
      Alert.alert('שגיאה', 'נא לבחור אווטר');
      return;
    }

    // בדיקת גיל מינימום 17 (רק אם תאריך לידה הוזן)
    if (birthDate) {
      const today = new Date();
      const birthYear = birthDate.getFullYear();
      const birthMonth = birthDate.getMonth();
      const birthDay = birthDate.getDate();
      
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      const currentDay = today.getDate();
      
      let age = currentYear - birthYear;
      
      // אם עוד לא הגיע יום הולדת השנה, מפחיתים שנה
      if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
        age--;
      }
      
      if (age < 17) {
        Alert.alert(
          'הגבלת גיל', 
          'האפליקציה מיועדת לגילאי 17 ומעלה בלבד.\nגילך הנוכחי: ' + age + ' שנים',
          [{ text: 'הבנתי', style: 'default' }]
        );
        return;
      }
      
      console.log('✅ Age validation passed. User age:', age);
    } else {
      console.log('ℹ️ No birth date provided - skipping age validation');
    }

    try {
      console.log('🚀 [Supabase] מתחיל תהליך הרשמה...');
      await signupWithSupabase({
        email,
        password,
        firstName,
        lastName,
        avatarSeed,
        avatarStyle,
        settlement,
        birthDate: birthDate || undefined,
        showEmail, // הוספת אפשרות הסתרת מייל
      });
      console.log('✅ [Supabase] הרשמה הושלמה בהצלחה');
      Alert.alert('הצלחה', 'נרשמת בהצלחה!', [
        { text: 'אישור', onPress: () => navigation.navigate('Home') }
      ]);
    } catch (error: any) {
      console.error('💥 [Supabase] שגיאה בהרשמה:', error);
      Alert.alert('שגיאה', error.message || 'שגיאה בהרשמה');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backIcon} onPress={() => navigation.navigate('Login')}>
        <Text style={{ fontSize: 28, color: '#222' }}>{'←'}</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { fontSize: responsiveFontSize(28) }]}>הרשמה</Text>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imagePicker}>
          <TouchableOpacity
            style={[styles.profileImage, { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#B7EFC5', backgroundColor: '#f5f5f5' }]}
            onPress={() => setAvatarModalVisible(true)}
          >
            {avatarSeed ? (
              <Image
                source={{ uri: `https://api.dicebear.com/7.x/${avatarStyle}/png?seed=${avatarSeed}` }}
                style={[styles.profileImage, { borderWidth: 0 }]}
              />
            ) : (
              <Text style={{ fontSize: 32, color: '#888' }}>?</Text>
            )}
          </TouchableOpacity>
          <Text style={[styles.avatarLabel, { fontSize: responsiveFontSize(16) }]}>בחר אווטר</Text>
          <Modal
            visible={avatarModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setAvatarModalVisible(false)}
          >
            <Pressable style={styles.avatarModalOverlay} onPress={() => setAvatarModalVisible(false)}>
              <View style={styles.avatarModalContent}>
                <Text style={[{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }, { fontSize: responsiveFontSize(18) }]}>בחר אווטר</Text>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingVertical: 8 }}>
                  {avatarSeeds.map((seed, idx) => (
                    <TouchableOpacity key={seed ?? 'empty'} onPress={() => { setAvatarSeed(seed); setAvatarModalVisible(false); }}>
                      {seed ? (
                        <Image
                          source={{ uri: `https://api.dicebear.com/7.x/${avatarStyle}/png?seed=${seed}` }}
                          style={[
                            styles.avatarScrollImage,
                            { margin: 8, width: 60, height: 60 },
                            avatarSeed === seed && { borderWidth: 3, borderColor: '#B7EFC5' }
                          ]}
                        />
                      ) : (
                        <View style={[styles.avatarScrollImage, { margin: 8, width: 60, height: 60, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', borderWidth: avatarSeed === null ? 3 : 0, borderColor: '#888' }] }>
                          <Text style={{ fontSize: 32, color: '#888' }}>?</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </Pressable>
          </Modal>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, firstName ? styles.inputFilled : null]}
            placeholder="שם פרטי"
            value={firstName}
            onChangeText={setFirstName}
            placeholderTextColor="#888"
          />
          <Text style={styles.requiredStar}>*</Text>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, lastName ? styles.inputFilled : null]}
            placeholder="שם משפחה"
            value={lastName}
            onChangeText={setLastName}
            placeholderTextColor="#888"
          />
          <Text style={styles.requiredStar}>*</Text>
        </View>
        <TouchableOpacity
          style={[styles.input, settlement ? styles.inputFilled : null]}
          onPress={() => setSettlementModalVisible(true)}
        >
          <View style={styles.settlementPickerContent}>
            <Text style={styles.settlementText}>
              {settlement || 'בחר ישוב (אופציונלי)'}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.sectionSpacer} />
        
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, email ? styles.inputFilled : null]}
            placeholder="אימייל"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#888"
          />
          <Text style={styles.requiredStar}>*</Text>
        </View>
        
        {/* אפשרות הסתרת מייל */}
        <View style={styles.emailVisibilityContainer}>
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setShowEmail(!showEmail)}
          >
            <View style={[styles.checkbox, showEmail && styles.checkboxChecked]}>
              {showEmail && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              הצג כתובת מייל למשתמשים אחרים
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, password ? styles.inputFilled : null]}
            placeholder="סיסמה"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#888"
          />
          <Text style={styles.requiredStar}>*</Text>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, confirmPassword ? styles.inputFilled : null]}
            placeholder="אימות סיסמה"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholderTextColor="#888"
          />
          <Text style={styles.requiredStar}>*</Text>
        </View>
        <TouchableOpacity
          style={[styles.datePickerButton, birthDate ? styles.inputFilled : null]}
          onPress={() => setDatePickerVisible(true)}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.calendarIcon}>📅</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.datePickerText, !birthDate && styles.placeholderText]}>
              {birthDate ? birthDate.toLocaleDateString('he-IL') : 'תאריך לידה (אופציונלי)'}
            </Text>
          </View>
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={handleCancelDate}
          maximumDate={new Date()}
          display="spinner"
        />

        <Modal
          animationType="slide"
          transparent={true}
          visible={isSettlementModalVisible}
          onRequestClose={() => setSettlementModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>בחר ישוב</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setSettlementModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.settlementList}>
                {SETTLEMENTS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.settlementItem,
                      settlement === item && styles.selectedSettlement
                    ]}
                    onPress={() => handleSettlementSelect(item)}
                  >
                    <Text style={[
                      styles.settlementItemText,
                      settlement === item && styles.selectedSettlementText
                    ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
          <Text style={[styles.signupText, { fontSize: responsiveFontSize(16) }]}>הרשמה</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  backIcon: {
    position: 'absolute',
    top: 60,
    left: 16,
    padding: 8,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 40,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imagePicker: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 6,
    backgroundColor: '#f5f5f5',
  },
  avatarLabel: {
    marginTop: 8,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    textAlign: 'right',
  },
  requiredStar: {
    position: 'absolute',
    right: 8,
    top: 12,
    color: 'red',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionSpacer: {
    height: 18,
  },
  inputFilled: {
    backgroundColor: '#e8e8e8',
  },
  settlementPickerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settlementText: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    textAlign: 'right',
    marginRight: 8,
  },
  dropdownIcon: {
    fontSize: 16,
    color: '#666',
    position: 'absolute',
    left: 0,
  },
  datePickerButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginLeft: 8,
  },
  calendarIcon: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
  },
  datePickerText: {
    fontSize: 16,
    color: '#222',
    textAlign: 'right',
  },
  placeholderText: {
    color: '#888',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  settlementList: {
    padding: 8,
  },
  settlementItem: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  selectedSettlement: {
    backgroundColor: '#B7EFC5',
  },
  settlementItemText: {
    fontSize: 16,
    color: '#222',
    textAlign: 'right',
  },
  selectedSettlementText: {
    color: '#222',
    fontWeight: 'bold',
  },
  signupButton: {
    backgroundColor: '#B7EFC5',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  signupText: {
    color: '#222',
    fontSize: 16,
    fontWeight: 'bold',
  },
  avatarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    height: '50%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'center',
  },
  avatarScrollImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginHorizontal: 5,
    backgroundColor: '#f5f5f5',
  },
  emailVisibilityContainer: {
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#B7EFC5',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#B7EFC5',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#222',
    textAlign: 'right',
  },
});
