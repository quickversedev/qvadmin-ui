import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from './src/contexts/Login/AuthProvider';
import {Router} from './src/components/route/Route';
import React from 'react';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
