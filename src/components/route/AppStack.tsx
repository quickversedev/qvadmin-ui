import React, {useEffect} from 'react';
import TabNavigation from '../../navigation/TabNavigation';

import useFCMTokenHandler from '../../utils/global/fcmTokenUtil';
import {
  checkNotificationPermission,
  getFcmToken,
  registerNotificationListeners,
  requestNotificationPermission,

} from '../../hooks/notification/useNotification';

const AppStack = () => {
  useEffect(() => {
    async function initNotifications() {
      const granted = await requestNotificationPermission();
      if (granted) {
        const alreadyGranted = await checkNotificationPermission();
        if (alreadyGranted) {
         const token = await getFcmToken();
         console.log('token', token);
        }
      }
      registerNotificationListeners();
    }

    initNotifications();
  }, []);
  useFCMTokenHandler();

  return (
    <>
      <TabNavigation />
    </>
  );
};

export default AppStack;
