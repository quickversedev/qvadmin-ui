import React, {useEffect} from 'react';
import TabNavigation from '../../navigation/TabNavigation';

import {
  registerNotificationListeners,
  requestNotificationPermission,
} from '../../hooks/notification/useNotification';
import {useDeviceInfo} from '../../services/useDeviceInfo';


const AppStack = () => {
  const {updateDeviceInfo} = useDeviceInfo();

  useEffect(() => {
    let unsubscribeNotifications = () => {};

    async function initNotifications() {
      await requestNotificationPermission();

      unsubscribeNotifications = registerNotificationListeners();
    }

    initNotifications();
    updateDeviceInfo();

    return () => {
      unsubscribeNotifications();
    };
  }, []);

  return (
    <>
      <TabNavigation />
    </>
  );
};

export default AppStack;
