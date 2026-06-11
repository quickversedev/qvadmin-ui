import {navigationRef, onRootNavigationReady} from './NavigationHelper';
import ForceUpdateChecker from '../components/common/ForceUpdate';
import {NavigationContainer} from '@react-navigation/native';
import {ApiProvider} from '@reduxjs/toolkit/query/react';
import {useAuthStore} from '../store';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import api from '../apis';
import React, {useEffect} from 'react';
import {connectSocket, disconnectSocket} from '../socket/socketClient';

const RootNavigation = () => {
  const {isAuthenticated} = useAuthStore(state => state);
  const SOCKET_URL =
    'ws://superscientifically-revengeless-ronald.ngrok-free.dev/ws';

  useEffect(() => {
    connectSocket(SOCKET_URL);

    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef} onReady={onRootNavigationReady}>
      <ApiProvider api={api}>
        <ForceUpdateChecker>
          {isAuthenticated ? <AppStack /> : <AuthStack />}
        </ForceUpdateChecker>
      </ApiProvider>
    </NavigationContainer>
  );
};

export default RootNavigation;
