import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import WebViewScreen from '../screens/webview/WebView';
import HomeScreen from '../screens/Home/HomeScreen';

export type HomeScreenStackParamList = {
  HomeScreen: undefined;
  WebViewScreen: {
    url: string;
  };
};

const Stack = createStackNavigator();

const HomeScreenNavigation = () => {
  return (
    <Stack.Navigator
      {...({
        initialRouteName: 'HomeScreen',
        screenOptions: {headerShown: false},
      } as any)}>
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{title: 'Orders'}}
      />

      <Stack.Screen
        name="WebViewScreen"
        component={WebViewScreen}
        options={{title: 'Vendor Orders'}}
      />
    </Stack.Navigator>
  );
};

export default HomeScreenNavigation;
