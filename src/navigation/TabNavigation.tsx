import React from 'react';
import {Text, TouchableOpacity, Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeScreenNavigation from './HomeScreenNavigation';
import SettingsNavigation from './SettingsNavigation';
import {FONT_FAMILY} from '../assets/constants/fonts';

const Tab = createBottomTabNavigator();

const TabNavigation: React.FC = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#0F766E',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          height: 66 + insets.bottom,
          paddingTop: 8,
          paddingBottom: 8 + insets.bottom,
          borderTopWidth: 0,
          backgroundColor: '#FFFFFF',
          shadowColor: '#0F172A',
          shadowOffset: {width: 0, height: -4},
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 14,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarButton: props => (
          <TouchableOpacity {...props} activeOpacity={1} />
        ),
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreenNavigation}
        options={{
          tabBarLabel: ({focused, color}) => (
            <Text
              style={{
                color,
                fontSize: 12,
                fontFamily: focused
                  ? FONT_FAMILY.outfitBold
                  : FONT_FAMILY.bricolageMedium,
              }}>
              Home
            </Text>
          ),
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsNavigation}
        options={{
          tabBarLabel: ({focused, color}) => (
            <Text
              style={{
                color,
                fontSize: 12,
                fontFamily: focused
                  ? FONT_FAMILY.outfitBold
                  : FONT_FAMILY.bricolageMedium,
              }}>
              Settings
            </Text>
          ),
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigation;
