import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {Text} from 'react-native';
import {useAuth} from '../../contexts/Login/AuthProvider';
import AppStack from './AppStack';
import {AuthStack} from './AuthStack';
import ForceUpdateChecker from '../common/ForceUpdate';
import {
  navigationRef,
  onRootNavigationReady,
} from '../../navigation/RootNavigation';

export const Router = () => {
  const {authData, loading} = useAuth();

  if (loading) {
    return <Text>Loading</Text>;
  }
  return (
    <NavigationContainer ref={navigationRef} onReady={onRootNavigationReady}>
      <ForceUpdateChecker>
        {authData?.jwt ? <AppStack /> : <AuthStack />}
      </ForceUpdateChecker>
    </NavigationContainer>
  );
};
