import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { userManager } from '../utils/userManager';

const COLORS = {
  blue: '#E3F0FF', // כחול בהיר מאוד
  green: '#B7EFC5', // ירוק פסטל
  yellow: '#FFF9B0', // צהוב פסטל
  orange: '#FFD6A5', // כתום פסטל
  white: '#FFFFFF',
};

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('שגיאה', 'נא למלא את כל השדות');
      return;
    }

    const result = await userManager.login(email, password);
    if (result.success) {
      navigation.navigate('Home');
    } else {
      Alert.alert('שגיאה', result.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.voluntreeHeader}>
        <Text style={styles.voluntreeTitle}>Voluntree</Text>
      </View>
      <View style={{ alignItems: 'center', marginBottom: 32, marginTop: 40 }}>
        <Image source={require('../../assets/images/shaarhanegev.png')} style={{ width: 80, height: 80, resizeMode: 'contain' }} />
      </View>
      <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center' }}>
        <View style={{ width: '100%', alignItems: 'center', marginTop: 0 }}>
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
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginText}>התחברות לחשבון</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signupButton} onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.signupText}>יצירת חשבון חדש</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.orText}>או התחבר באמצעות רשת חברתית</Text>
        <View style={[styles.socialRow, { justifyContent: 'center', width: '100%' }]}> 
          <TouchableOpacity style={styles.socialButton}>
            <Image source={require('../../assets/images/google.png')} style={styles.socialIcon} />
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Image source={require('../../assets/images/facebook.png')} style={styles.socialIcon} />
            <Text style={styles.socialText}>Facebook</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 120, // היה 72, עכשיו 5 לחיצות (72+48)
  },
  input: {
    backgroundColor: '#f5f5f5',
    width: '100%',
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
  loginButton: {
    backgroundColor: COLORS.blue,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginText: {
    color: '#222', // טקסט כהה
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupButton: {
    backgroundColor: COLORS.green,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  signupText: {
    color: '#222', // טקסט כהה
    fontSize: 16,
    fontWeight: 'bold',
  },
  orText: {
    color: '#222', // טקסט כהה
    fontSize: 14,
    marginVertical: 16,
  },
  socialRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  socialButton: {
    backgroundColor: COLORS.blue,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  socialText: {
    color: '#222', // טקסט כהה
    fontSize: 14,
  },
  voluntreeHeader: {
    width: '100%',
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 0,
  },
  voluntreeTitle: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#222', // טקסט כהה
    fontFamily: 'SpaceMono',
    letterSpacing: 2,
    textShadowColor: '#B7EFC5',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
