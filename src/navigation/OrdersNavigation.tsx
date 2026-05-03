import {createStackNavigator} from '@react-navigation/stack';
import {
  AssignTransporterScreen,
  OrderStatsScreen,
  OrdersScreen,
  ViewOrderScreen,
} from '../screens/Orders';
import {FONT_FAMILY} from '../assets/constants/fonts';
import React from 'react';
import WebViewScreen from '../screens/webview/WebView';

export type OrdersNavigationStackParamList = {
  OrderStatsScreen: undefined;
  OrdersScreen: {
    orderStatus:
      | 'CANCELLED'
      | 'REJECTED'
      | 'PENDING'
      | 'ACCEPTED'
      | 'READY_TO_SHIP'
      | 'ON_THE_WAY'
      | 'COMPLETED';
  };
  ViewOrderScreen: {orderId: string};
  WebViewScreen: undefined;
  AssignTransporterScreen: {order: any};
};

const Stack = createStackNavigator<OrdersNavigationStackParamList>();
const initialRouteName: keyof OrdersNavigationStackParamList =
  'OrderStatsScreen';

const OrdersNavigation = () => {
  return (
    <Stack.Navigator
      {...({
        initialRouteName: initialRouteName,
        screenOptions: {headerShown: false},
      } as any)}>
      <Stack.Screen
        name="OrderStatsScreen"
        component={OrderStatsScreen}
        options={{title: 'Order Stats'}}
      />
      <Stack.Screen
        name="OrdersScreen"
        component={OrdersScreen}
        options={{title: 'Orders'}}
      />
      <Stack.Screen
        name="ViewOrderScreen"
        component={ViewOrderScreen}
        options={{
          title: 'Order Details',
          headerShown: true,
          headerTitleStyle: {
            fontSize: 22,
            color: '#0f172a',
            fontFamily: FONT_FAMILY.bricolageBold,
          },
          headerTintColor: '#0F172A',
        }}
      />
      <Stack.Screen
        name="AssignTransporterScreen"
        component={AssignTransporterScreen}
        options={{
          title: 'Assign Transporter',
          headerShown: true,
          headerTitleStyle: {
            fontSize: 22,
            color: '#0f172a',
            fontFamily: FONT_FAMILY.bricolageBold,
          },
          headerTintColor: '#0F172A',
        }}
      />
      <Stack.Screen
        name="WebViewScreen"
        component={WebViewScreen}
        options={{
          title: 'SmartBiz Order Details',
          headerShown: true,
          headerTitleStyle: {
            fontSize: 22,
            color: '#0f172a',
            fontFamily: FONT_FAMILY.bricolageBold,
          },
          headerTintColor: '#0F172A',
        }}
      />
    </Stack.Navigator>
  );
};

export default OrdersNavigation;
