import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import AddVendor from '../screens/AddVendor';
import AddLaundry from '../screens/AddLaundry';
import AddFeaturedItem from '../screens/AddFeaturedItem';
import CampusBuzz from '../screens/CampusBuzz';
import AddPromotion from '../screens/AddPromotion';
import Vendors from '../screens/Vendors';

export type RootStackParamList = {
  Home: undefined;
  AddVendor: undefined;
  AddLaundry: undefined;
  AddFeaturedItem: undefined;
  CampusBuzz: undefined;
  AddPromotion: undefined;
  Vendors: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="AddVendor" component={AddVendor} />
      <Stack.Screen name="AddLaundry" component={AddLaundry} />
      <Stack.Screen name="AddFeaturedItem" component={AddFeaturedItem} />
      <Stack.Screen name="CampusBuzz" component={CampusBuzz} />
      <Stack.Screen name="AddPromotion" component={AddPromotion} />
      <Stack.Screen name="Vendors" component={Vendors}/>
    </Stack.Navigator>
  );
};
