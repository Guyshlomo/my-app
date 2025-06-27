import React, { useState } from 'react';
import { Alert, Animated, Easing, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { loginWithSupabase, signupWithSupabase } from '../db/supabaseApi';
import { cacheWarmer } from '../utils/cacheWarmer';


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
        console.log('✅ [Supabase] התחברות הצליחה, מחמם cache ועובר למסך הבית');
        
        // Warm cache in background for faster navigation
        cacheWarmer.warmCache().catch(error => {
          console.error('Cache warming failed:', error);
        });
        
        navigation.navigate('Home');
      } else {
        console.log('❌ [Supabase] התחברות נכשלה');
        Alert.alert('שגיאה', 'התחברות נכשלה');
      }
    } catch (error: any) {
      console.log('💥 [Supabase] שגיאה בתהליך התחברות:', error);
      Alert.alert('שגיאה', error.message || 'אימייל או סיסמה שגויים');
    }
  };

  const handleFacebookSignup = async () => {
    try {
      Alert.alert('מתחבר...', 'מתחבר באמצעות פייסבוק...');

      const response = await loginWithSupabase({email: 'guy1254@gmail.com', password: '123123'})

      const result = await response;

  
    } catch (error: any) {
      console.error('Facebook signup error:', error);
      Alert.alert('שגיאה', error.message || 'שגיאה בהרשמה באמצעות פייסבוק');
    }
  };

  const handleGoogleSignup = async () => {
    try {
      // Hardcoded user data for Google signup
      const hardcodedUser = {
        email: 'google.user@example.com',
        password: 'google123456',
        firstName: 'גוגל',
        lastName: 'משתמש',
        profileImage: 'https://via.placeholder.com/150',
        settlement: 'כפר עזה',
        birthDate: new Date('1985-06-15')
      };

      Alert.alert('מתחבר...', 'מתחבר באמצעות גוגל...');

      // Call the signup function with hardcoded data
      await signupWithSupabase(hardcodedUser);
      
      Alert.alert('הצלחה', 'נרשמת בהצלחה באמצעות גוגל!', [
        { text: 'אישור', onPress: () => navigation.navigate('Home') }
      ]);
    } catch (error: any) {
      console.error('Google signup error:', error);
      Alert.alert('שגיאה', error.message || 'שגיאה בהרשמה באמצעות גוגל');
    }
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
        <Text style={styles.orText}>או התחבר באמצעות רשת חברתית</Text>
        <View style={[styles.socialRow, { justifyContent: 'center', width: '100%' }]}> 
          <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignup}>
            <Image source={require('../../assets/images/google.png')} style={styles.socialIcon} />
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} onPress={handleFacebookSignup}>
            <Image source={require('../../assets/images/facebook.png')} style={styles.socialIcon} />
            <Text style={styles.socialText}>Facebook</Text>
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
});
