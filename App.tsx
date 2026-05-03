import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from './src/contexts/Login/AuthProvider';
import RootNavigation from './src/navigation/RootNavigation';
import React from 'react';
import {Text, TextInput} from 'react-native';
import {FONT_FAMILY} from './src/assets/constants/fonts';

const textDefaults = {
  fontFamily: FONT_FAMILY.bricolageRegular,
  includeFontPadding: false,
};

(Text as any).defaultProps = {
  ...((Text as any).defaultProps || {}),
  style: [textDefaults, (Text as any).defaultProps?.style],
};

(TextInput as any).defaultProps = {
  ...((TextInput as any).defaultProps || {}),
  style: [textDefaults, (TextInput as any).defaultProps?.style],
};

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
