import React, { useState } from 'react';
import { Alert, Animated, Easing, Image, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { loginWithSupabase } from '../db/supabaseApi';


const COLORS = {
  blue: '#E3F0FF', // כחול בהיר מאוד
  green: '#B7EFC5', // ירוק פסטל
  yellow: '#FFF9B0', // צהוב פסטל
  orange: '#FFD6A5', // כתום פסטל
  white: '#FFFFFF',
};

const images = [
  require('../../assets/images/erez.png'),
  require('../../assets/images/bror-hail.png'),
  require('../../assets/images/nahal-oz.png'),
  require('../../assets/images/nir-am.png'),
  require('../../assets/images/kar-aza.png'),
  require('../../assets/images/or-haner.png'),
  require('../../assets/images/ruhama.png'),
  require('../../assets/images/gevim.png'),
  require('../../assets/images/mefalsim.png'),
  require('../../assets/images/dorot.png'),
];

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const scrollX = React.useRef(new Animated.Value(0)).current;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('שגיאה', 'נא למלא את כל השדות');
      return;
    }
    
    try {
      console.log('🚀 [Supabase] מתחיל תהליך התחברות...');
      const user = await loginWithSupabase({ email, password });
      console.log('📝 [Supabase] תוצאת התחברות:', user);
      
      if (user) {
        console.log('✅ [Supabase] התחברות הצליחה, עובר למסך הבית');
        navigation.navigate('Home');
      } else {
        console.log('❌ [Supabase] התחברות נכשלה');
        Alert.alert('שגיאה', 'התחברות נכשלה');
      }
    } catch (error: any) {
      console.log('💥 [Supabase] שגיאה בתהליך התחברות:', error);
      
      // Provide more specific error messages
      let errorMessage = 'אימייל או סיסמה שגויים';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'אימייל או סיסמה שגויים. אנא בדוק את הפרטים ונסה שוב.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'נדרש לאמת את כתובת האימייל. אנא בדוק את תיבת הדואר שלך.';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'יותר מדי ניסיונות התחברות. אנא נסה שוב מאוחר יותר.';
      }
      
      Alert.alert('שגיאה בהתחברות', errorMessage);
    }
  };

  const openPrivacyPolicy = () => {
    const url = 'https://sng.smarticket.co.il/תקנון';
    Linking.openURL(url).catch(err => {
      console.error('Failed to open privacy policy URL:', err);
      Alert.alert('שגיאה', 'לא ניתן לפתוח את מדיניות הפרטיות');
    });
  };

  React.useEffect(() => {
    const totalWidth = images.length * 100; // 80px image + 20px margin
    Animated.loop(
      Animated.timing(scrollX, {
        toValue: -totalWidth,
        duration: 15000, // קצת יותר לאט כדי שיהיה קריא יותר
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.voluntreeHeader}>
        <Text style={styles.voluntreeTitle}>Voluntree</Text>
      </View>
      <View style={{ alignItems: 'center', marginBottom: 20, marginTop: 24 }}>
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
      </View>
      <View style={styles.logoContainer}>
        <Animated.View style={[styles.logoRow, { transform: [{ translateX: scrollX }] }]}>
          {images.concat(images).map((img, idx) => (
            <Image
              key={idx}
              source={img}
              style={styles.logo}
            />
          ))}
        </Animated.View>
      </View>

      {/* קישור למדיניות פרטיות בתחתית המסך */}
      <View style={styles.privacyContainer}>
        <TouchableOpacity onPress={openPrivacyPolicy}>
          <Text style={styles.privacyLink}>
            מדיניות פרטיות
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 80, // העליתי מ-60 ל-80
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

  voluntreeHeader: {
    width: '100%',
    alignItems: 'center',
    marginTop: 32, // העליתי מ-24 ל-32
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
  logoContainer: {
    height: 80,
    marginBottom: 24,
    overflow: 'hidden',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // רקע לבן שקוף קלות
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginHorizontal: 10,
    resizeMode: 'contain',
  },
  privacyContainer: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 24,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  privacyLink: {
    fontSize: 14,
    color: '#007bff',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
