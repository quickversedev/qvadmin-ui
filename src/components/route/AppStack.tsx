import React, {useEffect, useState} from 'react';
import messaging from '@react-native-firebase/messaging';
import TabNavigation from '../../navigation/TabNavigation';
import NotificationModal from '../common/notificationModel';
import notifee from '@notifee/react-native';
import {InteractionManager} from 'react-native';
import useFCMTokenHandler from '../../utils/global/fcmTokenUtil';

const AppStack = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState<any>('');
  const [modalBody, setModalBody] = useState<any>('');

  const onClose = () => {
    setShowModal(false);
    setModalTitle('');
    setModalBody('');
  };

  useFCMTokenHandler();

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      try {
        InteractionManager.runAfterInteractions(() => {
          try {
            const title = remoteMessage?.notification?.title;

            setModalTitle(title);
            setModalBody(remoteMessage?.data?.customBody);
            setShowModal(true);

            // Close modal after 5 seconds
            setTimeout(() => {
              setShowModal(false);
            }, 5000);
          } catch (modalError) {
            console.warn('⚠️ Modal error:', modalError);
          }
        });

        try {
          await notifee.displayNotification({
            title: remoteMessage?.notification?.title ?? 'Notification',
            body: remoteMessage?.notification?.body ?? '',
            android: {
              channelId: 'custom-sound',
              sound: 'noti',
              smallIcon: 'qv_blue',
              pressAction: {
                id: 'default',
              },
            },
          });
        } catch (notifeeError) {
          console.warn('⚠️ Notifee error:', notifeeError);
        }
      } catch (msgError) {
        console.error('❌ Failed to handle foreground message:', msgError);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <>
      <TabNavigation />
      <NotificationModal
        visible={showModal}
        title={modalTitle}
        body={modalBody}
        onClose={onClose}
      />
    </>
  );
};

export default AppStack;
