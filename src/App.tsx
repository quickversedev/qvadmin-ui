import React, { useState, useEffect } from 'react';
import 'react-native-gesture-handler';
// Navigation
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import HomeScreen from './components/screens/HomeScreen';
import AddVendor from './components/screens/AddVendor';
import AddLaundry from './components/screens/AddLaundry';
import AddFeaturedItem from './components/screens/AddFeaturedItem';
import CampusBuzz from './components/screens/CampusBuzz';
import AddPromotion from './components/screens/AddPromotion';
import Vendors from './components/screens/Vendors';
import LoginNavigator from './components/screens/Login/login_navigator';

export type RootStackParamList = {
  Home: undefined;
  AddVendor: undefined;
  AddCampus: undefined;
  AddLaundry : undefined;
  AddFeaturedItem: undefined;
  CampusBuzz: undefined;
  AddPromotion: undefined;
  Vendors: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuthStatus = () => {
      const userLoggedIn = false;
      setIsLoggedIn(userLoggedIn);
    };

    checkAuthStatus();
  }, []);

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddVendor"
            component={AddVendor}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddLaundry"
            component={AddLaundry}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddFeaturedItem"
            component={AddFeaturedItem}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CampusBuzz"
            component={CampusBuzz}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddPromotion"
            component={AddPromotion}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Vendors"
            component={Vendors}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      ) : (
        <LoginNavigator />
      )}
    </NavigationContainer>
  );
}
