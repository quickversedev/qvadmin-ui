/**
 * @format
 */

import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';
import notifee, {AndroidImportance, EventType} from '@notifee/react-native';
import {
  extractOrderIdFromNotificationPayload,
  persistPendingOrderId,
} from './src/services/notification/notificationRedirect';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  try {
    const orderId = extractOrderIdFromNotificationPayload(remoteMessage);
    if (orderId) {
      persistPendingOrderId(orderId);
    }

    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
      sound: 'noti',
    });

    await notifee.displayNotification({
      title: remoteMessage?.notification?.title,
      body: remoteMessage?.notification?.body,
      data: remoteMessage?.data,
      android: {
        channelId,
        sound: 'noti',
        pressAction: {
          id: 'default',
        },
      },
    });
  } catch (error) {
    console.log('error', error);
  }
});

notifee.onBackgroundEvent(async ({type, detail}) => {
  if (type !== EventType.PRESS && type !== EventType.ACTION_PRESS) {
    return;
  }

  const orderId = extractOrderIdFromNotificationPayload({
    data: detail?.notification?.data,
    body: detail?.notification?.body,
  });

  if (orderId) {
    persistPendingOrderId(orderId);
  }
});

AppRegistry.registerComponent(appName, () => App);
