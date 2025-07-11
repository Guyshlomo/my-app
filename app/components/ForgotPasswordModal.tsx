import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { resetPasswordWithSupabase } from '../db/supabaseApi';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ visible, onClose }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Simple iPad detection for responsive text (iPhone UI stays exactly the same)
  const { width: screenWidth } = Dimensions.get('window');
  const isIPad = Platform.OS === 'ios' && screenWidth >= 768;
  const responsiveFontSize = (baseSize: number) => isIPad ? baseSize * 1.2 : baseSize;
  const responsivePadding = (basePadding: number) => isIPad ? basePadding * 1.5 : basePadding;

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('שגיאה', 'נא להזין כתובת אימייל');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('שגיאה', 'נא להזין כתובת אימייל תקינה');
      return;
    }

    setIsLoading(true);
    try {
      await resetPasswordWithSupabase(email.trim());
      
      Alert.alert(
        'אימייל נשלח!',
        'נשלח לך קישור לאיפוס סיסמה לכתובת האימייל שלך. אנא בדוק את תיבת הדואר שלך (כולל תיקיית הספאם).',
        [
          {
            text: 'הבנתי',
            onPress: () => {
              setEmail('');
              onClose();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'אירעה שגיאה בשליחת אימייל איפוס הסיסמה';
      
      if (error.message?.includes('Invalid email')) {
        errorMessage = 'כתובת האימייל לא תקינה';
      } else if (error.message?.includes('User not found')) {
        errorMessage = 'לא נמצא משתמש עם כתובת אימייל זו';
      } else if (error.message?.includes('Email rate limit exceeded')) {
        errorMessage = 'נשלחו יותר מדי אימיילים. אנא נסה שוב מאוחר יותר';
      }
      
      Alert.alert('שגיאה', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmail('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { maxWidth: isIPad ? 500 : '90%' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { fontSize: responsiveFontSize(24) }]}>
              איפוס סיסמה
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={isLoading}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.modalContent, { padding: responsivePadding(20) }]}>
            <Text style={[styles.description, { fontSize: responsiveFontSize(16) }]}>
              הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה
            </Text>

            <TextInput
              style={[
                styles.emailInput,
                {
                  fontSize: responsiveFontSize(16),
                  paddingVertical: responsivePadding(16),
                  paddingHorizontal: responsivePadding(20),
                },
              ]}
              placeholder="כתובת אימייל"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
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
                  שלח קישור לאיפוס
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, { paddingVertical: responsivePadding(12) }]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={[styles.cancelButtonText, { fontSize: responsiveFontSize(14) }]}>
                ביטול
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  emailInput: {
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
});

export default ForgotPasswordModal; 