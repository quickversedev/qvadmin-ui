import React from 'react';
import {Router} from './src/components/route/Route';
import {AuthProvider} from './src/contexts/Login/AuthProvider';
import {SafeAreaProvider} from 'react-native-safe-area-context';

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
