import React, {useRef} from 'react';
import {WebView} from 'react-native-webview';
import {RouteProp} from '@react-navigation/native';
import {View, Text, StyleSheet, SafeAreaView} from 'react-native';

interface WebViewScreenProps {
  url?: string;
  route?: RouteProp<any, any>;
}

const WebViewScreen: React.FC<WebViewScreenProps> = ({route, url}) => {
  const webViewRef = useRef<WebView>(null);
  const Url = url || route?.params?.url;
  console.log('URL:', Url);
  if (!Url) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>Error: No URL provided.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <WebView
        ref={(ref: any) => {
          if (ref) {
            webViewRef.current = ref;
          }
        }}
        source={{uri: Url}}
        style={styles.webview}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});

export default WebViewScreen;
