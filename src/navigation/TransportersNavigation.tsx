import {TransportersScreen} from '../screens/Transporters';
import {createStackNavigator} from '@react-navigation/stack';
import {FONT_FAMILY} from '../assets/constants/fonts';
import React from 'react';

export type TransportersNavigationStackParamList = {
  TransportersScreen: undefined;
};

const Stack = createStackNavigator<TransportersNavigationStackParamList>();
const initialRouteName: keyof TransportersNavigationStackParamList =
  'TransportersScreen';

const TransportersNavigation = () => {
  return (
    <Stack.Navigator
      {...({
        initialRouteName: initialRouteName,
        screenOptions: {headerShown: false},
      } as any)}>
      <Stack.Screen
        name="TransportersScreen"
        component={TransportersScreen}
        options={{title: 'Transporters'}}
      />
    </Stack.Navigator>
  );
};

export default TransportersNavigation;
