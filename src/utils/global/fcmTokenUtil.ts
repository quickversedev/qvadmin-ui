import {useEffect} from 'react';
import messaging from '@react-native-firebase/messaging';

import {sendFCMToken} from '../../services/apis/fcpApi';
import {useAuth} from '../../contexts/Login/AuthProvider';
import {StorageService} from '../../services/storage/MMKV/storage.service';
import {getToken} from '../../hooks/notification/useNotification';

const useFCMTokenHandler = () => {
  const {authData} = useAuth();

  const refreshFCMToken = async () => {
    try {
      const currentToken = await getToken();
      const storedToken = StorageService.getFCMToken();
      console.log('storedToken', storedToken);
      if (!currentToken) {
        console.warn('❌ FCM token is null or undefined');
        return;
      }
      if (storedToken && storedToken !== currentToken) {
        StorageService.setFCMToken(currentToken);
        await sendFCMToken(storedToken, currentToken, authData);
      }
    } catch (error) {
      console.error('❌ Error getting FCM token', error);
    }
  };

  useEffect(() => {
    refreshFCMToken();
    const unsubscribe = messaging().onTokenRefresh(async newToken => {
      const storedToken = StorageService.getFCMToken();
      StorageService.setFCMToken(newToken);
      storedToken && (await sendFCMToken(storedToken, newToken, authData));
    });

    return unsubscribe;
  }, []);
};

export default useFCMTokenHandler;
