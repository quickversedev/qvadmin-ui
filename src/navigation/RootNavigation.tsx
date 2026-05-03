import {navigationRef, onRootNavigationReady} from './NavigationHelper';
import ForceUpdateChecker from '../components/common/ForceUpdate';
import {NavigationContainer} from '@react-navigation/native';
import {ApiProvider} from '@reduxjs/toolkit/query/react';
import {useAuthStore} from '../store';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import api from '../apis';
import React from 'react';

const RootNavigation = () => {
  const {isAuthenticated} = useAuthStore(state => state);

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
