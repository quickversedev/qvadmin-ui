import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import SettingsScreen from '../screens/Settings/SettingScreen';
import TransportersScreen from '../screens/Settings/TransportersScreen';
import AddTransporterScreen from '../screens/Settings/AddTransporterScreen';
import ConfigurationsScreen from '../screens/Settings/ConfigurationsScreen';

export type SettingsStackParamList = {
  SettingsHome: undefined;
  Transporters: undefined;
  AddTransporter: undefined;
  Configurations: undefined;
};

const Stack = createStackNavigator<SettingsStackParamList>();

const SettingsNavigation = () => {
  return (
    <Stack.Navigator
      initialRouteName="SettingsHome"
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} />
      <Stack.Screen name="Transporters" component={TransportersScreen} />
      <Stack.Screen name="AddTransporter" component={AddTransporterScreen} />
      <Stack.Screen name="Configurations" component={ConfigurationsScreen} />
    </Stack.Navigator>
  );
};

export default SettingsNavigation;
