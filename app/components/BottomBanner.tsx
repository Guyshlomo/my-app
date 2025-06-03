import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RootStackParamList = {
  Home: undefined;
  Trophy: undefined;
  Gift: undefined;
  Volunteer: { from: 'Home' | 'Trophy' };
  Calendar: undefined;
  Login: undefined;
  Signup: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function BottomBanner() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const currentScreen = route.name;
  const insets = useSafeAreaInsets();

  // Don't show the banner on Login or Signup screens
  if (currentScreen === 'Login' || currentScreen === 'Signup') {
    return null;
  }

  return (
    <View style={[
      styles.container,
      {
        paddingBottom: Math.max(insets.bottom, 20),
        height: 85 + Math.max(insets.bottom - 20, 0)
      }
    ]}>
      <TouchableOpacity 
        style={[styles.iconContainer, currentScreen === 'Trophy' && styles.activeIconContainer]}
        onPress={() => navigation.navigate('Trophy')}
      >
        <View style={[styles.iconWrapper, currentScreen === 'Trophy' && styles.activeIconWrapper]}>
          <Image 
            source={require('../../assets/images/trophy.png')}
            style={[styles.icon, currentScreen === 'Trophy' && styles.activeIcon]}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.iconContainer, currentScreen === 'Calendar' && styles.activeIconContainer]}
        onPress={() => navigation.navigate('Calendar')}
      >
        <View style={[styles.iconWrapper, currentScreen === 'Calendar' && styles.activeIconWrapper]}>
          <Image 
            source={require('../../assets/images/calander.png')}
            style={[styles.icon, currentScreen === 'Calendar' && styles.activeIcon]}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.homeContainer, currentScreen === 'Home' && styles.activeIconContainer]}
        onPress={() => navigation.navigate('Home')}
      >
        <View style={[styles.homeWrapper, currentScreen === 'Home' && styles.activeIconWrapper]}>
          <Image 
            source={require('../../assets/images/home.png')}
            style={[styles.icon, currentScreen === 'Home' && styles.activeIcon]}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.iconContainer, currentScreen === 'Gift' && styles.activeIconContainer]}
        onPress={() => navigation.navigate('Gift')}
      >
        <View style={[styles.iconWrapper, currentScreen === 'Gift' && styles.activeIconWrapper]}>
          <Image 
            source={require('../../assets/images/gift.png')}
            style={[styles.icon, currentScreen === 'Gift' && styles.activeIcon]}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.iconContainer, currentScreen === 'Volunteer' && styles.activeIconContainer]}
        onPress={() => navigation.navigate('Volunteer', { from: currentScreen === 'Trophy' ? 'Trophy' : 'Home' })}
      >
        <View style={[styles.iconWrapper, currentScreen === 'Volunteer' && styles.activeIconWrapper]}>
          <Image 
            source={require('../../assets/images/volunteer.png')}
            style={[styles.icon, currentScreen === 'Volunteer' && styles.activeIcon]}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#D7D2B6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingTop: 10,
  },
  homeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingTop: 6,
  },
  iconWrapper: {
    padding: 10,
    borderRadius: 50,
  },
  homeWrapper: {
    padding: 12,
    borderRadius: 50,
    backgroundColor: 'transparent',
  },
  activeIconWrapper: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  activeIconContainer: {
    transform: [{ scale: 1.1 }],
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: '#222',
    resizeMode: 'contain',
  },
  activeIcon: {
    tintColor: '#000',
  },
}); 