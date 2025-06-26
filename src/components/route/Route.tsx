import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {Text} from 'react-native';
import {useAuth} from '../../contexts/Login/AuthProvider';
import AppStack from './AppStack';
import {AuthStack} from './AuthStack';
import ForceUpdateChecker from '../common/ForceUpdate';
import {useNotification} from '../../hooks/notification/useNotification';

export const Router = () => {
  const {authData, loading} = useAuth();
  useNotification();

  if (loading) {
    return <Text>Loading</Text>;
  }
  return (
    <NavigationContainer>
      <ForceUpdateChecker>
        {authData ? <AppStack /> : <AuthStack />}
      </ForceUpdateChecker>
    </NavigationContainer>
  );
};
