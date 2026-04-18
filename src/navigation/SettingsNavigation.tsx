import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import SettingsScreen from '../screens/Settings/SettingScreen';
import TransportersScreen from '../screens/Settings/TransportersScreen';
import AddTransporterScreen from '../screens/Settings/AddTransporterScreen';
import ConfigurationsScreen from '../screens/Settings/ConfigurationsScreen';
import PagesPromotionalBannersScreen from '../screens/Settings/PagesPromotionalBannersScreen';
import AddPromotionBannerScreen from '../screens/Settings/AddPromotionBannerScreen';
import {PromotionBanner} from '../services/apis/pagesService';

export type SettingsStackParamList = {
  SettingsHome: undefined;
  Transporters: undefined;
  AddTransporter:
    | {
        transporterId?: string;
      }
    | undefined;
  Configurations: undefined;
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

const Stack = createStackNavigator<SettingsStackParamList>();
const initialRouteName: keyof SettingsStackParamList = 'SettingsHome';

const SettingsNavigation = () => {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} />
      <Stack.Screen name="Transporters" component={TransportersScreen} />
      <Stack.Screen name="AddTransporter" component={AddTransporterScreen} />
      <Stack.Screen name="Configurations" component={ConfigurationsScreen} />
      <Stack.Screen
        name="PagesPromotionalBanners"
        component={PagesPromotionalBannersScreen}
      />
      <Stack.Screen
        name="AddPromotionBanner"
        component={AddPromotionBannerScreen}
      />
    </Stack.Navigator>
  );
};

export default SettingsNavigation;
