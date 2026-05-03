import {navigationRef, onRootNavigationReady} from './NavigationHelper';
import ForceUpdateChecker from '../components/common/ForceUpdate';
import {NavigationContainer} from '@react-navigation/native';
import {ApiProvider} from '@reduxjs/toolkit/query/react';
import {useAuth} from '../contexts/Login/AuthProvider';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import {Text} from 'react-native';
import api from '../apis';
import React from 'react';

const RootNavigation = () => {
  const {authData, loading} = useAuth();

  if (loading) {
    return <Text>Loading</Text>;
  }

  return (
    <NavigationContainer ref={navigationRef} onReady={onRootNavigationReady}>
      <ApiProvider api={api}>
        <ForceUpdateChecker>
          {authData?.jwt ? <AppStack /> : <AuthStack />}
        </ForceUpdateChecker>
      </ApiProvider>
    </NavigationContainer>
  );
};

export default RootNavigation;
