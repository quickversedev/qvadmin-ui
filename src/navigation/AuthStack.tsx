import {createStackNavigator} from '@react-navigation/stack';
import LoginScreen from '../screens/Authentication/LoginScreen';
import OTPScreen from '../screens/Authentication/OTPScreen';
import React from 'react';

const Stack = createStackNavigator();

export type AuthNavigationStackParamList = {
  LoginScreen: undefined;
  OTPScreen: {phoneNumber: string; verificationId: string};
};

const AuthStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="LoginScreen"
      screenOptions={{headerShown: false}}>
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="OTPScreen" component={OTPScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;
