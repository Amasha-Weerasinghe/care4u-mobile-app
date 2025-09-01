import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import LoginScreen from '../screens/LoginScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import CompleteProfileScreen from '../screens/CompleteProfileScreen';
import MainTabNavigator from './MainTabNavigator';
import ProfileScreen from '../screens/ProfileScreen';
import AddMealScreen from '../screens/meal/AddMealScreen';

import AddMealItemScreen from '../screens/meal/AddMealItemScreen';
import MealTemplatesScreen from '../screens/meal/MealTemplatesScreen';
import MealHistoryScreen from '../screens/meal/MealHistoryScreen';
import MealRecommendationScreen from '../screens/MealRecommendationScreen';
import RecordBloodSugarScreen from '../screens/sugar/RecordBloodSugarScreen';
import SugarHistoryScreen from '../screens/sugar/SugarHistoryScreen';
import BloodSugarGuidelinesScreen from '../screens/sugar/BloodSugarGuidelinesScreen';
import RecordActivityScreen from '../screens/exercise/RecordActivityScreen';
import TrackActivityScreen from '../screens/exercise/TrackActivityScreen';
import ActivityHistoryScreen from '../screens/exercise/ActivityHistoryScreen';
import AppointmentScreen from '../screens/appointments/AppointmentScreen';
import AppointmentDetailsScreen from '../screens/appointments/AppointmentDetailsScreen';
import { AppointmentProvider } from '../contexts/AppointmentContext';

import { COLORS } from '../constants/theme';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <AppointmentProvider>
      <NavigationContainer>
        <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShown: false, 
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="OTPVerification" 
          component={OTPVerificationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CompleteProfile" 
          component={CompleteProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="AddMeal" 
          component={AddMealScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen 
          name="AddMealItem" 
          component={AddMealItemScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MealTemplates" 
          component={MealTemplatesScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MealHistory" 
          component={MealHistoryScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MealRecommendation" 
          component={MealRecommendationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="RecordBloodSugar" 
          component={RecordBloodSugarScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SugarHistory" 
          component={SugarHistoryScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="BloodSugarGuidelines" 
          component={BloodSugarGuidelinesScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="RecordActivity" 
          component={RecordActivityScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="TrackActivity" 
          component={TrackActivityScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ActivityHistory" 
          component={ActivityHistoryScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Appointment" 
          component={AppointmentScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="AppointmentDetails" 
          component={AppointmentDetailsScreen}
          options={{ headerShown: false }}
        />
        
      </Stack.Navigator>
    </NavigationContainer>
    </AppointmentProvider>
  );
};

export default AppNavigator;



