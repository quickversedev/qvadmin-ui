import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {
  SettingsScreen,
  TransportersScreen,
  AddTransporterScreen,
  AddPromotionBannerScreen,
  ConfigurationsScreen,
  BroadcastNotificationScreen,
  PagesPromotionalBannersScreen,
} from '../screens/Settings';
import {PromotionBanner} from '../services/apis/pagesService';
import {FONT_FAMILY} from '../assets/constants/fonts';

export type SettingsNavigationStackParamList = {
  SettingsHome: undefined;
  Transporters: undefined;
  AddTransporter:
    | {
        transporterId?: string;
      }
    | undefined;
  Configurations: undefined;
  BroadcastNotifications: undefined;
  PagesPromotionalBanners: undefined;
  AddPromotionBanner:
    | {
        mode?: 'create' | 'edit';
        pageName?: string;
        regionId?: string;
        promotionId?: string;
        promotionData?: PromotionBanner;
      }
    | undefined;
};

const Stack = createStackNavigator<SettingsNavigationStackParamList>();
const initialRouteName: keyof SettingsNavigationStackParamList = 'SettingsHome';

const SettingsNavigation = () => {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} />
      <Stack.Screen
        name="Transporters"
        component={TransportersScreen}
        options={{
          title: 'Transporters Management',
          headerShown: true,
          headerTitleStyle: {
            fontSize: 22,
            color: '#0f172a',
            fontFamily: FONT_FAMILY.bricolageBold,
          },
          headerTintColor: '#0F172A',
        }}
      />
      <Stack.Screen
        name="AddTransporter"
        component={AddTransporterScreen}
        options={{
          title: 'Add Transporter',
          headerShown: true,
          headerTitleStyle: {
            fontSize: 22,
            color: '#0f172a',
            fontFamily: FONT_FAMILY.bricolageBold,
          },
          headerTintColor: '#0F172A',
        }}
      />
      <Stack.Screen
        name="Configurations"
        options={{
          title: 'Pricing Configurations',
          headerShown: true,
          headerTitleStyle: {
            fontSize: 22,
            color: '#0f172a',
            fontFamily: FONT_FAMILY.bricolageBold,
          },
          headerTintColor: '#0F172A',
        }}
        component={ConfigurationsScreen}
      />
      <Stack.Screen
        name="BroadcastNotifications"
        options={{
          title: 'Broadcast Notifications',
          headerShown: true,
          headerTitleStyle: {
            fontSize: 22,
            color: '#0f172a',
            fontFamily: FONT_FAMILY.bricolageBold,
          },
          headerTintColor: '#0F172A',
        }}
        component={BroadcastNotificationScreen}
      />
      <Stack.Screen
        name="PagesPromotionalBanners"
        options={{
          title: 'Pages Promotional Banners',
          headerShown: true,
          headerTitleStyle: {
            fontSize: 22,
            color: '#0f172a',
            fontFamily: FONT_FAMILY.bricolageBold,
          },
          headerTintColor: '#0F172A',
        }}
        component={PagesPromotionalBannersScreen}
      />
      <Stack.Screen
        name="AddPromotionBanner"
        options={{
          title: 'Add Promotion Banner',
          headerShown: true,
          headerTitleStyle: {
            fontSize: 22,
            color: '#0f172a',
            fontFamily: FONT_FAMILY.bricolageBold,
          },
          headerTintColor: '#0F172A',
        }}
        component={AddPromotionBannerScreen}
      />
    </Stack.Navigator>
  );
};

export default SettingsNavigation;
