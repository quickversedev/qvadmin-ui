import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {AppStack} from './AppStack';
import {AuthStack} from './AuthStack';
import {useAuth} from '../../utils/AuthContext';
import { Loading } from '../../util/Loading';
import {saveToken} from '../../utils/KeychainStore/keychainUtil';

export const Router = () => {
  const {authData, loading} = useAuth();

  useEffect(() => {
    saveToken();
  }, []);

  if (loading) {
    return <Loading />;
  }
  // export const Router = () => {
  //   const {authData, loading, skipLogin} = useAuth();
  //   console.log('token', authData);
  //   useEffect(() => {
  //     saveToken();
  //   }, []);

  return (
    <NavigationContainer>
      {authData ? <AuthStack /> : <AppStack />}
    </NavigationContainer>
  );
};
