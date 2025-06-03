import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const COLORS = {
  blue: '#E3F0FF',
  green: '#B7EFC5',
  yellow: '#FFF9B0',
  orange: '#FFD6A5',
  white: '#FFFFFF',
};

export default function SignupScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [settlement, setSettlement] = useState('');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>הרשמה</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <Image source={require('../assets/images/icon.png')} style={styles.profileImage} />
        )}
        <Text style={styles.imagePickerText}>העלה תמונת פרופיל</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="שם פרטי"
        value={firstName}
        onChangeText={setFirstName}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="שם משפחה"
        value={lastName}
        onChangeText={setLastName}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="תאריך לידה (למשל 01/01/2000)"
        value={birthDate}
        onChangeText={setBirthDate}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="ישוב מגורים"
        value={settlement}
        onChangeText={setSettlement}
        placeholderTextColor="#888"
      />
      <TouchableOpacity style={styles.signupButton}>
        <Text style={styles.signupButtonText}>הרשמה</Text>
      </TouchableOpacity>
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
    color: '#222',
    fontWeight: 'bold',
    marginBottom: 24,
  },
  imagePicker: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePickerText: {
    color: '#444',
    fontSize: 14,
    marginTop: 4,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#222',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  signupButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 24,
    marginTop: 16,
  },
  signupButtonText: {
    color: '#222',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
