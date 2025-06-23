import {useEffect} from 'react';
import {Alert, PermissionsAndroid, Platform} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import {get} from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import notifee, {AndroidImportance} from '@notifee/react-native';

const requestNotification = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Notification permission granted');
      return true;
    } else {
      return false;
    }
  }
  return true;
};

export const getToken = async () => {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

const createCustomChannel = async () => {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: 'custom-sound',
      name: 'Custom Sound Channel',
      sound: 'noti',
      importance: AndroidImportance.HIGH,
    });
  }
};

export function useNotification() {
  useEffect(() => {
    const setupNotification = async () => {
      const notificationPermission = await requestNotification();
      if (notificationPermission) {
        await createCustomChannel();
        getToken();
      }
    };
    setupNotification();
  }, []);
}
