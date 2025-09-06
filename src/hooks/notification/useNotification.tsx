import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';

// ✅ Ask for notification permission (iOS + Android 13+)
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      console.log('iOS Notification Permission:', enabled);
      return enabled;
    } else if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        console.log('Android Notification Permission:', isGranted);
        return isGranted;
      }
      return true; // No explicit permission required < Android 13
    }
    return false;
  } catch (error) {
    console.error('Permission error:', error);
    return false;
  }
}

// ✅ Check if permission is already granted
export async function checkNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'ios') {
      const settings = await messaging().hasPermission();
      return settings === messaging.AuthorizationStatus.AUTHORIZED;
    } else if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const result = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        return result;
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Check permission error:', error);
    return false;
  }
}

// ✅ Get FCM Token
export async function getFcmToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error fetching FCM token:', error);
    return null;
  }
}

// ✅ Export getToken for backward compatibility
export const getToken = getFcmToken;

// ✅ Display local notification
async function displayNotification(remoteMessage: any): Promise<void> {
  try {
    const { title, body } = remoteMessage?.notification ?? {};

    // Handle data-only payloads if needed
    const dataTitle = remoteMessage?.data?.title;
    const dataBody = remoteMessage?.data?.body;

    const finalTitle = title || dataTitle;
    const finalBody = body || dataBody;

    if (!finalTitle && !finalBody) {
      console.warn('Skipping empty notification:', remoteMessage);
      return; // ✅ prevents empty notification
    }

    await notifee.requestPermission();

    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
      sound: 'noti', // 👈 custom sound (file in res/raw/noti.wav)
    });

    await notifee.displayNotification({
      title: finalTitle,
      body: finalBody,
      android: {
        channelId,
        pressAction: { id: 'default' },
      },
    });
  } catch (error) {
    console.error('Error displaying notification:', error);
  }
}


// ✅ Register notification listeners
// ✅ Register notification listeners
export function registerNotificationListeners() {
  try {
    // Foreground → show custom notification
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      try {
        console.log('Foreground Message:', remoteMessage);
        await displayNotification(remoteMessage); // only here
      } catch (err) {
        console.error('Foreground listener error:', err);
      }
    });

    // Background / when app opened via notification
    messaging().onNotificationOpenedApp(remoteMessage => {
      try {
        console.log('App opened from background by notification:', remoteMessage);
        // ❌ don't call displayNotification here
      } catch (err) {
        console.error('Background notification handler error:', err);
      }
    });

    // Killed state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('App opened from quit state by notification:', remoteMessage);
          // ❌ don't call displayNotification here
        }
      })
      .catch(err => {
        console.error('Killed state notification handler error:', err);
      });

    return unsubscribe;
  } catch (error) {
    console.error('Error registering notification listeners:', error);
    return () => {};
  }
}

