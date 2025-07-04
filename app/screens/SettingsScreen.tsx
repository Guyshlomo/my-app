import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useRef } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Linking,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../config/supabase';
import { deleteUserAccount, getCurrentUserFromSupabase } from '../db/supabaseApi';

interface SettingsScreenProps {
  visible: boolean;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const DRAWER_WIDTH = screenWidth * 0.75;

const SettingsScreen: React.FC<SettingsScreenProps> = ({ visible, onClose }) => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleLogout = async () => {
    Alert.alert(
      'התנתקות',
      'האם אתה בטוח שברצונך להתנתק?',
      [
        {
          text: 'ביטול',
          style: 'cancel',
        },
        {
          text: 'התנתק',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              onClose();
              navigation.navigate('Login');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('שגיאה', 'אירעה שגיאה בהתנתקות');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'מחיקת חשבון',
      'האם אתה בטוח שברצונך למחוק את החשבון? פעולה זו בלתי הפיכה!',
      [
        {
          text: 'ביטול',
          style: 'cancel',
        },
        {
          text: 'מחק חשבון',
          style: 'destructive',
          onPress: async () => {
            try {
              const currentUser = await getCurrentUserFromSupabase();
              if (currentUser) {
                await deleteUserAccount(currentUser.id);
                await supabase.auth.signOut();
                onClose();
                navigation.navigate('Login');
                Alert.alert('החשבון נמחק', 'החשבון שלך נמחק בהצלחה');
              }
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('שגיאה', 'אירעה שגיאה במחיקת החשבון');
            }
          },
        },
      ]
    );
  };

  const handleContact = () => {
    Alert.alert(
      'צור קשר',
      'בחר דרך יצירת קשר:',
      [
        {
          text: 'ביטול',
          style: 'cancel',
        },
        {
          text: 'אימייל',
          onPress: () => {
            Linking.openURL('mailto:guy1254@gmail.com?subject=פנייה מאפליקציית Voluntree');
          },
        },
        {
          text: 'טלפון',
          onPress: () => {
            Linking.openURL('tel:+972-50-123-4567');
          },
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <SafeAreaView style={styles.drawerContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>הגדרות</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemIcon}>🚪</Text>
                <Text style={styles.menuItemText}>התנתק מהחשבון</Text>
              </View>
              <Text style={styles.menuItemArrow}>‹</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.dangerItem]} onPress={handleDeleteAccount}>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemIcon}>🗑️</Text>
                <Text style={[styles.menuItemText, styles.dangerText]}>מחיקת החשבון</Text>
              </View>
              <Text style={[styles.menuItemArrow, styles.dangerText]}>‹</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleContact}>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemIcon}>📞</Text>
                <Text style={styles.menuItemText}>צור קשר</Text>
              </View>
              <Text style={styles.menuItemArrow}>‹</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Voluntree v1.0</Text>
            <Text style={styles.footerSubtext}>© 2024 Guy Shlomo</Text>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  overlayTouchable: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  drawerContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#4CAF50',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  dangerItem: {
    backgroundColor: '#FFF5F5',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 18,
    color: '#333333',
    fontWeight: '600',
  },
  dangerText: {
    color: '#DC2626',
  },
  menuItemArrow: {
    fontSize: 20,
    color: '#999999',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  footerText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
  },
});

export default SettingsScreen; 