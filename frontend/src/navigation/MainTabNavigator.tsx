import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import HomeScreen from '../screens/HomeScreen';
import MealScreen from '../screens/meal/MealScreen';
import ExerciseScreen from '../screens/exercise/ExerciseScreen';
import SugarScreen from '../screens/sugar/SugarScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';

import { MainTabParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator: React.FC = () => {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Tab.Navigator
              screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Meals') {
            iconName = focused ? 'food-variant' : 'food-variant';
          } else if (route.name === 'Exercise') {
            iconName = focused ? 'run' : 'run';
          } else if (route.name === 'Sugar') {
            iconName = focused ? 'test-tube' : 'test-tube';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'chart-line' : 'chart-line';
          } else {
            iconName = 'circle';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          paddingBottom: 12,
          paddingTop: 8,
          height: 65,
          marginBottom: 16,
          marginHorizontal: 16,
          borderRadius: 20,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },

        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Meals" 
        component={MealScreen}
        options={{
          tabBarLabel: 'Meals',
        }}
      />
      <Tab.Screen 
        name="Exercise" 
        component={ExerciseScreen}
        options={{
          tabBarLabel: 'Exercise',
        }}
      />
      <Tab.Screen 
        name="Sugar" 
        component={SugarScreen}
        options={{
          tabBarLabel: 'Sugar',
        }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Analytics',
        }}
      />
    </Tab.Navigator>
    </View>
  );
};

export default MainTabNavigator;
