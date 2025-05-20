import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import VendorWiseOrders from '../screens/Dashboard/screens/VendorWiseOrders';
import OrderListScreen from '../components/Dashboard/OrderDashboard';

export type OrderStackParamList = {
  OrderList: undefined;
  VendorOrders: {
    tab:
      | 'PENDING'
      | 'ACCEPTED'
      | 'PACKED'
      | 'CANCELLED'
      | 'COMPLETED'
      | 'SHIPPED';
  };
  WebViewScreen: {
    url: string;
  };
};

const Stack = createStackNavigator();

const OrderStackNavigator = () => {
  return (
    <Stack.Navigator
      {...({
        initialRouteName: 'OrderList',
        screenOptions: {headerShown: false},
      } as any)}>
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
    </Stack.Navigator>
  );
};

export default OrderStackNavigator;
