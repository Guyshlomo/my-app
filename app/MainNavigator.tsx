import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import AdminUsersScreen from './screens/AdminUsersScreen';
import CalendarScreen from './screens/CalendarScreen';
import EditEventScreen from './screens/EditEventScreen';
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
  AdminUsers: undefined;
  EditEvent: { eventId: string; eventData: any };
};

function MainNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FEF6DA' },
        cardStyleInterpolator: ({ current }) => ({
          cardStyle: {
            opacity: current.progress,
          },
        }),
        transitionSpec: {
          open: { animation: 'timing', config: { duration: 80 } },
          close: { animation: 'timing', config: { duration: 80 } },
        },
        gestureEnabled: true,
        gestureResponseDistance: 100,
        gestureVelocityImpact: 0.8,
        detachPreviousScreen: true,
        presentation: 'card',
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
      <Stack.Screen 
        name="AdminUsers" 
        component={AdminUsersScreen}
        options={{
          title: 'ניהול משתמשים',
          headerTitleAlign: 'center',
        }}
      />
      <Stack.Screen 
        name="EditEvent" 
        component={EditEventScreen}
        options={{
          title: 'עריכת אירוע',
          headerTitleAlign: 'center',
        }}
      />
    </Stack.Navigator>
  );
}
export default MainNavigator;

