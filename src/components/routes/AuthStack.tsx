import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginNavigator from '../screens/Login/login_navigator';

const Stack = createStackNavigator();

export const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginNavigator} />
    </Stack.Navigator>
  );
};
