import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {Text} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import {useAuth} from '../../contexts/Login/AuthProvider';
import AppStack from './AppStack';
import {AuthStack} from './AuthStack';
import ForceUpdateChecker from '../common/ForceUpdate';
import {
  getFcmToken,
  requestNotificationPermission,
  setupNotificationChannel,
  showForegroundNotification,
} from '../../utils/notifiaction/notificationUtil';
import NotificationModal from '../common/NotificationModel';

export const Router = () => {
  const {authData, loading} = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalBody, setModalBody] = useState<any>();
  const onClose = () => {
    setShowModal(false);
    setModalTitle('');
    setModalBody(null);
  };
  useEffect(() => {
    const initNotifications = async () => {
      const granted = await requestNotificationPermission();
      if (granted) {
        await setupNotificationChannel();
        await getFcmToken();
      }
    };

    initNotifications();
  }, []);

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      if (!remoteMessage) {
        return;
      }
      const title = remoteMessage?.notification?.title || 'Notification';
      const body = remoteMessage?.data?.customPayload;
      console.log('Foreground notification received:', remoteMessage);
      setModalTitle(title);
      setModalBody(body);
      setShowModal(true);

      await showForegroundNotification(title, body);

      setTimeout(() => setShowModal(false), 5000);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return <Text>Loading</Text>;
  }

  return (
    <NavigationContainer>
      <ForceUpdateChecker>
        {authData ? <AppStack /> : <AuthStack />}
      </ForceUpdateChecker>
      <NotificationModal
        visible={showModal}
        title={modalTitle}
        body={modalBody}
        onClose={onClose}
      />
    </NavigationContainer>
  );
};
