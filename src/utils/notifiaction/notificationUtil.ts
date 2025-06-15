// src/utils/notificationUtils.ts

import {PermissionsAndroid, Platform, Alert} from 'react-native';
import notifee, {
  AndroidBadgeIconType,
  AndroidImportance,
} from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

export const requestNotificationPermission = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Notification permission granted');
      return true;
    } else {
      Alert.alert('Notification permission denied');
      return false;
    }
  }
  return true;
};

export const setupNotificationChannel = async () => {
  await notifee.createChannel({
    id: 'sound_channel',
    name: 'Engine',
    importance: AndroidImportance.HIGH,
    sound: 'noti',
  });
};

export const showForegroundNotification = async (title: string, body: any) => {
  const parsedPayload = JSON.parse(body);
  console.log(
    '[notificationnn]Foreground notification payload:',
    parsedPayload,
  );
  const msg = `New order received from:${parsedPayload?.customerName} Amount: ${parsedPayload?.amount}`;

  await notifee.displayNotification({
    title: title || 'Notification',
    body: msg || '',
    android: {
      channelId: 'sound_channel',
      sound: 'noti',
      smallIcon: 'qv_blue',
      badgeIconType: AndroidBadgeIconType.SMALL,
      color: '#8B8000',
      vibrationPattern: [300, 500],
      showTimestamp: true,
      pressAction: {
        id: 'default',
      },
    },
  });
};

export const getFcmToken = async () => {
  const token = await messaging().getToken();
  console.log('FCM Token:', token);
  return token;
};
