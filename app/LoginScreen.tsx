import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORS = {
  blue: '#E3F0FF', // כחול בהיר מאוד
  green: '#B7EFC5', // ירוק פסטל
  yellow: '#FFF9B0', // צהוב פסטל
  orange: '#FFD6A5', // כתום פסטל
  white: '#FFFFFF',
};

export default function LoginScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={{ alignItems: 'center', marginBottom: 32, marginTop: 240 }}>
        <Image source={require('../assets/images/shaarhanegev.png')} style={{ width: 80, height: 80, resizeMode: 'contain' }} />
      </View>
      <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center' }}>
        <View style={{ width: '100%', alignItems: 'center', marginTop: 0 }}>
          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.loginText}>התחברות לחשבון</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signupButton} onPress={() => router.push('/SignupScreen')}>
            <Text style={styles.signupText}>יצירת חשבון חדש</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.orText}>או התחבר באמצעות רשת חברתית</Text>
        <View style={[styles.socialRow, { justifyContent: 'center', width: '100%' }]}> 
          <TouchableOpacity style={styles.socialButton}>
            <Image source={require('../assets/images/google.png')} style={styles.socialIcon} />
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Image source={require('../assets/images/facebook.png')} style={styles.socialIcon} />
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
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    color: '#222', // טקסט כהה
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#444', // טקסט כהה
    marginBottom: 32,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 12,
    paddingHorizontal: 48,
    borderRadius: 24,
    marginBottom: 16,
  },
  loginText: {
    color: '#222', // טקסט כהה
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupButton: {
    backgroundColor: COLORS.orange,
    paddingVertical: 12,
    paddingHorizontal: 48,
    borderRadius: 24,
    marginBottom: 24,
  },
  signupText: {
    color: '#222', // טקסט כהה
    fontSize: 18,
    fontWeight: 'bold',
  },
  orText: {
    color: '#444', // טקסט כהה
    fontSize: 16,
    marginBottom: 12,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  socialText: {
    color: '#222', // טקסט כהה
    fontWeight: 'bold',
    fontSize: 16,
  },
});
