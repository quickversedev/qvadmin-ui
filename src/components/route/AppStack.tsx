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
    async function initNotifications() {
      await requestNotificationPermission();

      registerNotificationListeners();
    }

    initNotifications();
    updateDeviceInfo();
  }, []);

  return (
    <>
      <TabNavigation />
    </>
  );
};

export default AppStack;
