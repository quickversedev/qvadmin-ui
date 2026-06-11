import {SafeAreaProvider} from 'react-native-safe-area-context';
import RootNavigation from './src/navigation/RootNavigation';
import {FONT_FAMILY} from './src/assets/constants/fonts';
import {Text, TextInput,View} from 'react-native';
import React from 'react';

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
      <RootNavigation />
    </SafeAreaProvider>
  );
}

export default App;
