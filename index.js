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

const resolveNotificationContent = remoteMessage => {
  const title =
    remoteMessage?.notification?.title ?? remoteMessage?.data?.title ?? '';
  const body =
    remoteMessage?.notification?.body ?? remoteMessage?.data?.body ?? '';

  return {
    title: String(title || '').trim(),
    body: String(body || '').trim(),
  };
};

const getStableNotificationId = remoteMessage => {
  const orderId = extractOrderIdFromNotificationPayload(remoteMessage);
  const messageId = String(remoteMessage?.messageId || '').trim();
  const collapseKey = String(remoteMessage?.collapseKey || '').trim();

  if (messageId) {
    return `msg-${messageId}`;
  }

  if (orderId) {
    return `order-${orderId}`;
  }

  if (collapseKey) {
    return `collapse-${collapseKey}`;
  }

  return `fallback-${Date.now()}`;
};

messaging().setBackgroundMessageHandler(async remoteMessage => {
  try {
    const orderId = extractOrderIdFromNotificationPayload(remoteMessage);
    if (orderId) {
      persistPendingOrderId(orderId);
    }

    // Avoid duplicate notifications: system handles notification payload messages in background.
    if (remoteMessage?.notification) {
      return;
    }

    const {title, body} = resolveNotificationContent(remoteMessage);
    if (!title && !body) {
      return;
    }

    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
      sound: 'noti',
    });

    await notifee.displayNotification({
      id: getStableNotificationId(remoteMessage),
      title,
      body,
      data: remoteMessage?.data,
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
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
