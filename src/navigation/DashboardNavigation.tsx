import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import VendorWiseOrders from '../screens/Dashboard/screens/VendorWiseOrders';
import OrderListScreen from '../components/Dashboard/OrderDashboard';
import WebViewScreen from '../screens/webview/WebView';

export type OrderStackParamList = {
  OrderList: undefined;
  VendorOrders: {
    tab: 'Pending' | 'Accepted' | 'ReadyToShip' | 'Cancelled' | 'Completed';
  };
  WebViewScreen: {
    url: string;
  };
};

const Stack = createStackNavigator();

const OrderStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="OrderList"
      screenOptions={{headerShown: false}}>
      <Stack.Screen
        name="OrderList"
        component={OrderListScreen}
        options={{title: 'Orders'}}
      />
      <Stack.Screen
        name="VendorOrders"
        component={VendorWiseOrders}
        options={{title: 'Vendor Orders'}}
      />
      <Stack.Screen
        name="WebViewScreen"
        component={WebViewScreen}
        options={{title: 'Vendor Orders'}}
      />
    </Stack.Navigator>
  );
};

export default OrderStackNavigator;
