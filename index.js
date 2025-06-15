/**
 * @format
 */

import {AppRegistry} from 'react-native';
import {AndroidBadgeIconType} from '@notifee/react-native';
import App from './App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  if (!remoteMessage) {
    return;
  }

  if (remoteMessage.data && remoteMessage.data.customPayload) {
    const parsedPayload = JSON.parse(remoteMessage?.data?.customPayload);

    console.log(
      '[notificationnn]Background notification received:',
      remoteMessage.data,
    );
    // const msg = `New order received:ID ${parsedPayload?.orderId}, Name:${parsedPayload?.customerName} Amount: ${parsedPayload?.amount}`;
    const msg = `New order received: From ${parsedPayload?.customerName}, Amount: ₹${parsedPayload?.amount}`;
    console.log('[notificationnn] Parsed Payload:', parsedPayload);
    console.log('[notificationnn] msg:', msg);
    await notifee.displayNotification({
      title: remoteMessage?.data?.title,
      body: msg,
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
  }
});

AppRegistry.registerComponent(appName, () => App);
