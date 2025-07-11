import React, { useEffect, useState } from 'react';
import { Alert, Animated, Dimensions, Easing, Image, Linking, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { loginWithSupabase } from '../db/supabaseApi';
import {
  clearCredentials,
  getStoredCredentials,
  isRememberMeEnabled,
  saveCredentials,
  type StoredCredentials
} from '../utils/secureStorage';


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
  const [rememberMe, setRememberMe] = useState(false);
  const [isAutoLogging, setIsAutoLogging] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const scrollX = React.useRef(new Animated.Value(0)).current;

  // Simple iPad detection for responsive text (iPhone UI stays exactly the same)
  const { width: screenWidth } = Dimensions.get('window');
  const isIPad = Platform.OS === 'ios' && screenWidth >= 768;
  const responsiveFontSize = (baseSize: number) => isIPad ? baseSize * 1.2 : baseSize;
  const responsivePadding = (basePadding: number) => isIPad ? basePadding * 1.5 : basePadding;
  const responsiveMaxWidth = () => isIPad ? Math.min(screenWidth * 0.7, 600) : screenWidth;

  const loadStoredCredentials = async () => {
    try {
      const storedCredentials = await getStoredCredentials();
      const rememberMeEnabled = await isRememberMeEnabled();
      
      if (storedCredentials && rememberMeEnabled) {
        console.log('📱 [LoginScreen] Loading stored credentials...');
        setEmail(storedCredentials.email);
        setPassword(storedCredentials.password);
        setRememberMe(true);
        
        // Auto-login if credentials are available
        if (storedCredentials.email && storedCredentials.password) {
          console.log('🔄 [LoginScreen] Auto-logging in...');
          setIsAutoLogging(true);
          await performLogin(storedCredentials.email, storedCredentials.password, false);
        }
      }
    } catch (error) {
      console.error('❌ [LoginScreen] Failed to load stored credentials:', error);
    }
  };

  // Load stored credentials on component mount
  useEffect(() => {
    loadStoredCredentials();
  }, []);

  const performLogin = async (loginEmail: string, loginPassword: string, shouldSaveCredentials: boolean = true) => {
    try {
      console.log('🚀 [Supabase] מתחיל תהליך התחברות...');
      const user = await loginWithSupabase({ email: loginEmail, password: loginPassword });
      console.log('📝 [Supabase] תוצאת התחברות:', user);
      
      if (user) {
        console.log('✅ [Supabase] התחברות הצליחה, עובר למסך הבית');
        
        // Save credentials if remember me is checked and this is a manual login
        if (shouldSaveCredentials && rememberMe) {
          const credentials: StoredCredentials = {
            email: loginEmail,
            password: loginPassword,
            userType: user.isAdmin ? 'admin' : 'user',
          };
          await saveCredentials(credentials);
        }
        
        // Clear credentials if remember me is unchecked
        if (shouldSaveCredentials && !rememberMe) {
          await clearCredentials();
        }
        
        // Register for push notifications
        try {
          const { registerForPushNotifications } = await import('../utils/pushNotifications');
          console.log('🔔 [LoginScreen] Registering for push notifications...');
          
          const pushToken = await registerForPushNotifications(user.id);
          if (pushToken) {
            console.log('✅ [LoginScreen] Push notification registration successful');
          } else {
            console.log('⚠️ [LoginScreen] Push notification registration failed');
          }
        } catch (pushError) {
          console.error('❌ [LoginScreen] Push notification registration error:', pushError);
          // Don't prevent login if push registration fails
        }
        
        navigation.navigate('Home');
      } else {
        console.log('❌ [Supabase] התחברות נכשלה');
        Alert.alert('שגיאה', 'התחברות נכשלה');
      }
    } catch (error: any) {
      console.log('💥 [Supabase] שגיאה בתהליך התחברות:', error);
      
      // Clear stored credentials if auto-login fails
      if (isAutoLogging) {
        await clearCredentials();
        setEmail('');
        setPassword('');
        setRememberMe(false);
      }
      
      // Provide more specific error messages
      let errorMessage = 'אימייל או סיסמה שגויים';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'אימייל או סיסמה שגויים. אנא בדוק את הפרטים ונסה שוב.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'נדרש לאמת את כתובת האימייל. אנא בדוק את תיבת הדואר שלך.';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'יותר מדי ניסיונות התחברות. אנא נסה שוב מאוחר יותר.';
      }
      
      // Only show alert for manual login attempts
      if (!isAutoLogging) {
        Alert.alert('שגיאה בהתחברות', errorMessage);
      }
    } finally {
      setIsAutoLogging(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('שגיאה', 'נא למלא את כל השדות');
      return;
    }
    
    await performLogin(email, password, true);
  };

  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  const handleForgotPassword = () => {
    setShowForgotPasswordModal(true);
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
  };

  const openPrivacyPolicy = () => {
    const url = 'https://sng.smarticket.co.il/תקנון';
    Linking.openURL(url).catch(err => {
      console.error('Failed to open privacy policy URL:', err);
      Alert.alert('שגיאה', 'לא ניתן לפתוח את מדיניות הפרטיות');
    });
  };

  const openContactLink = () => {
    const url = 'https://www.instagram.com/voluntree_app/';
    Linking.openURL(url).catch((err) => {
      console.error('An error occurred', err);
      Alert.alert('שגיאה', 'לא ניתן לפתוח את הקישור');
    });
  };

  const handleInfoPress = () => {
    Alert.alert(
      'מידע נוסף',
      'בחר את הפעולה הרצויה:',
      [
        {
          text: 'מדיניות פרטיות',
          onPress: openPrivacyPolicy,
          style: 'default'
        },
        {
          text: 'יצירת קשר',
          onPress: openContactLink,
          style: 'default'
        },
        {
          text: 'ביטול',
          style: 'cancel'
        }
      ]
    );
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
    <View style={[styles.container, isIPad && { paddingHorizontal: responsivePadding(16), alignItems: 'center' }]}>
      {/* Information Icon - Upper Left */}
      <TouchableOpacity 
        style={styles.infoButton}
        onPress={handleInfoPress}
        disabled={isAutoLogging}
      >
        <Image 
          source={require('../../assets/images/info.png')} 
          style={styles.infoIcon}
        />
      </TouchableOpacity>

      <View style={styles.voluntreeHeader}>
        <Text style={[styles.voluntreeTitle, { fontSize: responsiveFontSize(38) }]}>Voluntree</Text>
      </View>
      <View style={{ alignItems: 'center', marginBottom: 20, marginTop: 24 }}>
        <Image source={require('../../assets/images/shaarhanegev.png')} style={{ width: 80, height: 80, resizeMode: 'contain' }} />
      </View>
      <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center' }}>
        <View style={{ width: '100%', alignItems: 'center', marginTop: 0 }}>
          <TextInput
            style={[
              styles.input, 
              email ? styles.inputFilled : null,
              { 
                fontSize: responsiveFontSize(16),
                paddingVertical: responsivePadding(16),
                maxWidth: responsiveMaxWidth(),
              }
            ]}
            placeholder="אימייל"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#888"
            editable={!isAutoLogging}
          />
          <TextInput
            style={[
              styles.input, 
              password ? styles.inputFilled : null,
              { 
                fontSize: responsiveFontSize(16),
                paddingVertical: responsivePadding(16),
                maxWidth: responsiveMaxWidth(),
              }
            ]}
            placeholder="סיסמה"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#888"
            editable={!isAutoLogging}
          />
          
          <TouchableOpacity 
            style={[
              styles.loginButton, 
              { 
                paddingVertical: responsivePadding(16),
                maxWidth: responsiveMaxWidth(),
                opacity: isAutoLogging ? 0.7 : 1,
              }
            ]} 
            onPress={handleLogin}
            disabled={isAutoLogging}
          >
            <Text style={[styles.loginText, { fontSize: responsiveFontSize(16) }]}>
              {isAutoLogging ? 'מתחבר...' : 'התחברות לחשבון'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.signupButton, 
              { 
                paddingVertical: responsivePadding(16),
                maxWidth: responsiveMaxWidth(),
                opacity: isAutoLogging ? 0.7 : 1,
              }
            ]} 
            onPress={() => navigation.navigate('Signup')}
            disabled={isAutoLogging}
          >
            <Text style={[styles.signupText, { fontSize: responsiveFontSize(16) }]}>יצירת חשבון חדש</Text>
          </TouchableOpacity>

          {/* Remember Me and Forgot Password Row */}
          <View style={[styles.loginOptionsRow, { maxWidth: responsiveMaxWidth() }]}>
            <TouchableOpacity 
              style={styles.rememberMeContainer} 
              onPress={toggleRememberMe}
              disabled={isAutoLogging}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.rememberMeText, { fontSize: responsiveFontSize(14) }]}>
                זכור אותי
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
              disabled={isAutoLogging}
            >
              <Text style={[styles.forgotPasswordText, { fontSize: responsiveFontSize(14) }]}>
                שכחת סיסמה?
              </Text>
            </TouchableOpacity>
          </View>
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

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        visible={showForgotPasswordModal}
        onClose={closeForgotPasswordModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 80,
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
    alignSelf: 'center',
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
    alignSelf: 'center',
    marginBottom: 16,
  },
  loginText: {
    color: '#222',
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
    alignSelf: 'center',
    marginBottom: 16,
  },
  signupText: {
    color: '#222',
    fontSize: 16,
    fontWeight: 'bold',
  },
  voluntreeHeader: {
    width: '100%',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 0,
  },
  voluntreeTitle: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#222',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginLeft: 0,
    marginRight: 0,
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
  loginOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    marginTop: 10,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  checkboxChecked: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rememberMeText: {
    color: '#222',
    fontSize: 14,
  },
  forgotPasswordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    paddingLeft: 20,
  },
  forgotPasswordText: {
    color: '#007bff',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  infoButton: {
    position: 'absolute',
    top: 80,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  infoIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
});
