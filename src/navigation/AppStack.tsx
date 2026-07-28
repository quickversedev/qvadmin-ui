import React, {useEffect} from 'react';
import {
  registerNotificationListeners,
  requestNotificationPermission,
} from '../hooks/notification/useNotification';
import {useDeviceInfo} from '../services/useDeviceInfo';
import {Platform, Text, TouchableOpacity} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SettingsNavigation from './SettingsNavigation';
import OrdersNavigation from './OrdersNavigation';
import {FONT_FAMILY} from '../assets/constants/fonts';
import TransportersNavigation from './TransportersNavigation';

const Tab = createBottomTabNavigator();

const AppStack = () => {
  const insets = useSafeAreaInsets();
  const bottomInset =
    Platform.OS === 'android' ? Math.max(insets.bottom, 16) : insets.bottom;
  const {updateDeviceInfo} = useDeviceInfo();

  useEffect(() => {
    let unsubscribeNotifications = () => {};

    async function initNotifications() {
      await requestNotificationPermission();

      unsubscribeNotifications = registerNotificationListeners();
    }

    initNotifications();
    updateDeviceInfo();

    return () => {
      unsubscribeNotifications();
    };
  }, []);

  return (
    <Tab.Navigator
      initialRouteName="Orders"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#0F766E',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          height: 66 + bottomInset,
          paddingTop: 2,
          paddingBottom: 8 + bottomInset,
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
        tabBarButton: (props: any) => {
          const {delayLongPress, ...rest} = props;
          return (
            <TouchableOpacity
              {...rest}
              activeOpacity={1}
              delayLongPress={delayLongPress ?? undefined}
            />
          );
        },
      }}>
      <Tab.Screen
        name="Orders"
        component={OrdersNavigation}
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
              Orders
            </Text>
          ),
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="cube" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Transporters"
        component={TransportersNavigation}
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
              Transporters
            </Text>
          ),
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="truck" color={color} size={size} />
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

export default AppStack;
