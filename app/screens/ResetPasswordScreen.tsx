import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../config/supabase';

interface ResetPasswordScreenProps {
  navigation: any;
  route: any;
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation, route }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Simple iPad detection for responsive text
  const { width: screenWidth } = Dimensions.get('window');
  const isIPad = Platform.OS === 'ios' && screenWidth >= 768;
  const responsiveFontSize = (baseSize: number) => isIPad ? baseSize * 1.2 : baseSize;
  const responsivePadding = (basePadding: number) => isIPad ? basePadding * 1.5 : basePadding;

  useEffect(() => {
    console.log('🔄 [ResetPasswordScreen] Component mounted');
    
    // Check if we have a valid session for password reset
    const checkSession = async () => {
      try {
        setIsCheckingSession(true);
        console.log('🔍 [ResetPasswordScreen] Checking session...');
        
        const { data: { session } } = await supabase.auth.getSession();
        console.log('📋 [ResetPasswordScreen] Session data:', session ? 'Found' : 'Not found');
        
        if (session) {
          console.log('✅ [ResetPasswordScreen] Valid session found for password reset');
          console.log('👤 [ResetPasswordScreen] User ID:', session.user.id);
          setIsValidSession(true);
        } else {
          console.log('❌ [ResetPasswordScreen] No valid session found');
          Alert.alert(
            'קישור לא תקין',
            'קישור איפוס הסיסמה לא תקין או פג תוקף. אנא בקש קישור חדש.',
            [
              {
                text: 'הבנתי',
                onPress: () => {
                  console.log('🚪 [ResetPasswordScreen] Signing out and navigating to Login');
                  supabase.auth.signOut();
                  navigation.navigate('Login');
                },
              },
            ]
          );
        }
      } catch (error) {
        console.error('❌ [ResetPasswordScreen] Error checking session:', error);
        Alert.alert(
          'שגיאה',
          'אירעה שגיאה בבדיקת הקישור.',
          [
            {
              text: 'הבנתי',
              onPress: () => {
                console.log('🚪 [ResetPasswordScreen] Signing out and navigating to Login due to error');
                supabase.auth.signOut();
                navigation.navigate('Login');
              },
            },
          ]
        );
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [navigation]);

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('שגיאה', 'נא להזין סיסמה חדשה');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('שגיאה', 'הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('שגיאה', 'הסיסמאות אינן תואמות');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 [ResetPasswordScreen] Updating password...');
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('❌ [ResetPasswordScreen] Password update error:', error);
        throw error;
      }

      console.log('✅ [ResetPasswordScreen] Password updated successfully');

      Alert.alert(
        'הצלחה!',
        'הסיסמה שלך שונתה בהצלחה. כעת תוכל להתחבר עם הסיסמה החדשה שלך.',
        [
          {
            text: 'הבנתי',
            onPress: () => {
              console.log('🚪 [ResetPasswordScreen] Signing out and navigating to Login after success');
              // Sign out and navigate to login
              supabase.auth.signOut();
              navigation.navigate('Login');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ [ResetPasswordScreen] Password reset error:', error);
      
      let errorMessage = 'אירעה שגיאה בשינוי הסיסמה';
      
      if (error.message?.includes('Password should be at least')) {
        errorMessage = 'הסיסמה חייבת להכיל לפחות 6 תווים';
      } else if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'פרטי ההתחברות לא תקינים';
      } else if (error.message?.includes('JWT expired')) {
        errorMessage = 'קישור איפוס הסיסמה פג תוקף. אנא בקש קישור חדש.';
      }
      
      Alert.alert('שגיאה', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'ביטול איפוס סיסמה',
      'האם אתה בטוח שברצונך לבטל את איפוס הסיסמה?',
      [
        {
          text: 'המשך איפוס',
          style: 'cancel',
        },
        {
          text: 'בטל',
          style: 'destructive',
          onPress: () => {
            console.log('🚪 [ResetPasswordScreen] Cancelling password reset and navigating to Login');
            supabase.auth.signOut();
            navigation.navigate('Login');
          },
        },
      ]
    );
  };

  if (isCheckingSession) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>בודק קישור...</Text>
      </View>
    );
  }

  if (!isValidSession) {
    return (
      <View style={styles.container}>
        <View style={[styles.content, { maxWidth: isIPad ? 500 : '90%' }]}>
          <Text style={[styles.title, { fontSize: responsiveFontSize(28) }]}>
            קישור לא תקין
          </Text>
          <Text style={[styles.description, { fontSize: responsiveFontSize(16) }]}>
            קישור איפוס הסיסמה לא תקין או פג תוקף. אנא בקש קישור חדש.
          </Text>
          <TouchableOpacity
            style={[styles.resetButton, { paddingVertical: responsivePadding(16) }]}
            onPress={() => {
              console.log('🚪 [ResetPasswordScreen] Navigating to Login from invalid session');
              navigation.navigate('Login');
            }}
          >
            <Text style={[styles.resetButtonText, { fontSize: responsiveFontSize(16) }]}>
              חזור להתחברות
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.content, { maxWidth: isIPad ? 500 : '90%' }]}>
        <Text style={[styles.title, { fontSize: responsiveFontSize(28) }]}>
          איפוס סיסמה
        </Text>
        
        <Text style={[styles.description, { fontSize: responsiveFontSize(16) }]}>
          הזן סיסמה חדשה לחשבון שלך
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              fontSize: responsiveFontSize(16),
              paddingVertical: responsivePadding(16),
              paddingHorizontal: responsivePadding(20),
            },
          ]}
          placeholder="סיסמה חדשה"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#888"
          editable={!isLoading}
        />

        <TextInput
          style={[
            styles.input,
            {
              fontSize: responsiveFontSize(16),
              paddingVertical: responsivePadding(16),
              paddingHorizontal: responsivePadding(20),
            },
          ]}
          placeholder="אימות סיסמה חדשה"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#888"
          editable={!isLoading}
        />

        <TouchableOpacity
          style={[
            styles.resetButton,
            {
              paddingVertical: responsivePadding(16),
              opacity: isLoading ? 0.7 : 1,
            },
          ]}
          onPress={handleResetPassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[styles.resetButtonText, { fontSize: responsiveFontSize(16) }]}>
              שנה סיסמה
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cancelButton, { paddingVertical: responsivePadding(12) }]}
          onPress={handleCancel}
          disabled={isLoading}
        >
          <Text style={[styles.cancelButtonText, { fontSize: responsiveFontSize(14) }]}>
            ביטול
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF6DA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    textAlign: 'right',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resetButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default ResetPasswordScreen; 