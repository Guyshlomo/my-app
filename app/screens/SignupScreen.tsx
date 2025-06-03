import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { userManager } from '../utils/userManager';

const SETTLEMENTS = [
  'ניר-עם',
  'כפר עזה',
  'ארז',
  'יכיני',
  'אור-הנר',
  'נחל עוז',
  'ברור-חיל'
];

export default function SignupScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [settlement, setSettlement] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isSettlementModalVisible, setSettlementModalVisible] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('הרשאה נדרשת', 'אנא אשר גישה לגלריה כדי לבחור תמונת פרופיל');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleConfirmDate = (date: Date) => {
    const formattedDate = date.toLocaleDateString('he-IL');
    setBirthDate(formattedDate);
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
    // בדיקות תקינות
    if (!fullName || !email || !password || !confirmPassword || !birthDate || !settlement) {
      Alert.alert('שגיאה', 'נא למלא את כל השדות');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('שגיאה', 'הסיסמאות אינן תואמות');
      return;
    }

    if (!profileImage) {
      Alert.alert('שגיאה', 'נא לבחור תמונת פרופיל');
      return;
    }

    // חילוץ שם פרטי ושם משפחה מהשם המלא
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    // יצירת משתמש חדש
    const result = await userManager.signup({
      firstName,
      lastName,
      email,
      password,
      profileImage,
    });

    if (result.success) {
      Alert.alert('הצלחה', result.message, [
        { text: 'אישור', onPress: () => navigation.navigate('Home') }
      ]);
    } else {
      Alert.alert('שגיאה', result.message);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backIcon} onPress={() => navigation.navigate('Login')}>
        <Text style={{ fontSize: 28, color: '#222' }}>{'←'}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>הרשמה</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <Image source={require('../../assets/images/upload.png')} style={styles.profileImage} />
        )}
        <Text style={styles.imagePickerText}>העלה תמונת פרופיל</Text>
      </TouchableOpacity>
      <TextInput
        style={[styles.input, fullName ? styles.inputFilled : null]}
        placeholder="שם מלא"
        value={fullName}
        onChangeText={setFullName}
        placeholderTextColor="#888"
      />
      <TouchableOpacity
        style={[styles.input, settlement ? styles.inputFilled : null]}
        onPress={() => setSettlementModalVisible(true)}
      >
        <View style={styles.settlementPickerContent}>
          <Text style={styles.settlementText}>
            {settlement || 'בחר ישוב'}
          </Text>
          <Text style={styles.dropdownIcon}>▼</Text>
        </View>
      </TouchableOpacity>
      <TextInput
        style={[styles.input, email ? styles.inputFilled : null]}
        placeholder="אימייל"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#888"
      />
      <TextInput
        style={[styles.input, password ? styles.inputFilled : null]}
        placeholder="סיסמה"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#888"
      />
      <TextInput
        style={[styles.input, confirmPassword ? styles.inputFilled : null]}
        placeholder="אימות סיסמה"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholderTextColor="#888"
      />
      <TouchableOpacity
        style={[styles.datePickerButton, birthDate ? styles.inputFilled : null]}
        onPress={() => setDatePickerVisible(true)}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.calendarIcon}>📅</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.datePickerText, !birthDate && styles.placeholderText]}>
            {birthDate || 'תאריך לידה'}
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
        <Text style={styles.signupText}>הרשמה</Text>
      </TouchableOpacity>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 32,
    marginTop: 40,
  },
  imagePicker: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  imagePickerText: {
    color: '#666',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
    fontSize: 16,
    textAlign: 'right',
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
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
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
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 16,
  },
  signupText: {
    color: '#222',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
