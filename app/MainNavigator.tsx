import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import CalendarScreen from './screens/CalendarScreen';
import GiftScreen from './screens/GiftScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import LuckyWheelScreen from './screens/LuckyWheelScreen';
import PurchaseHistoryScreen from './screens/PurchaseHistoryScreen';
import SignupScreen from './screens/SignupScreen';
import TrophyScreen from './screens/TrophyScreen';
import VolunteerScreen from './screens/VolunteerScreen';

const Stack = createStackNavigator();

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  Trophy: undefined;
  Calendar: undefined;
  Gift: undefined;
  Volunteer: { from: 'Home' | 'Trophy' | 'Gift' };
  PurchaseHistory: undefined;
  LuckyWheel: undefined;
};

function MainNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FEF6DA' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Trophy" component={TrophyScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Gift" component={GiftScreen} />
      <Stack.Screen name="Volunteer" component={VolunteerScreen} />
      <Stack.Screen name="PurchaseHistory" component={PurchaseHistoryScreen} />
      <Stack.Screen name="LuckyWheel" component={LuckyWheelScreen} />
    </Stack.Navigator>
  );
}
export default MainNavigator;

