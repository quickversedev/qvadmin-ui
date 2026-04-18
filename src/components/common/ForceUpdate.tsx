import React, {useEffect, useState} from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import useFetchUpdateData from '../../hooks/useFetchUpdateData';
import DeviceInfo from 'react-native-device-info';
import {FONT_FAMILY} from '../../assets/constants/fonts';

const {height} = Dimensions.get('window');

const ForceUpdateChecker: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [isUpdateRequired, setIsUpdateRequired] = useState(false);

  // Use the custom hook to fetch update data
  const {updateData, loading, error, retry} = useFetchUpdateData();

  useEffect(() => {
    if (!loading && !error) {
      checkForUpdate();
    }
  }, [loading, error]);

  const checkForUpdate = async () => {
    try {
      const currentVersion = DeviceInfo.getVersion();
      console.log(currentVersion);
      // Compare versions
      if (currentVersion < updateData.admin_min_required_version) {
        setIsUpdateRequired(true);
      }
    } catch (err) {
      console.error('Error checking for updates:', err);
    }
  };

  const handleUpdate = () => {
    const storeUrl =
      Platform.OS === 'ios'
        ? updateData.admin_ios_url
        : updateData.admin_android_url;
    Linking.openURL(storeUrl);
  };

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={styles.errorText}>Failed to fetch update data.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={retry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (isUpdateRequired) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={require('../../assets/images/bg_1.png')}
          style={styles.topBackground}
          resizeMode="cover"
        />

        <View style={styles.logoContainer}>
          <Image
            style={styles.topLogo}
            source={require('../../assets/images/logo_qv.png')}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Update Required</Text>
          <Text style={styles.subtitle}>
            {' '}
            A new version of the app is available. Please update to continue
            using the app.
          </Text>
          {/* <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Modal
            visible={isModalVisible}
            transparent={true}
            animationType="fade">
            <View style={styles.smallModalContainer}>
              <View style={styles.modalContainer}>
                <Text style={styles.title}></Text>
                <Text style={styles.message}></Text>
                <TouchableOpacity style={styles.button} onPress={handleUpdate}>
                  <Text style={styles.buttonText}>Update Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <ActivityIndicator size="large" />
        </View> */}

          <TouchableOpacity style={styles.otpButton} onPress={handleUpdate}>
            <Text style={styles.otpText}>Update Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  return children;
};

export default ForceUpdateChecker;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  topBackground: {
    height: height * 0.6,
    width: '100%',
    position: 'absolute',
    top: -80,
  },
  logoContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 70,
  },
  topLogo: {width: 90, objectFit: 'contain'},

  card: {
    width: '90%',
    height: '40%',
    marginTop: 100,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,

    borderWidth: 1,
    borderColor: 'yellow',
    shadowColor: '#FAE588',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },

  title: {
    fontSize: 22,
    color: '#F3F4F6',
    fontFamily: FONT_FAMILY.outfitBold,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 5,
    marginBottom: 16,
  },

  skipContainer: {
    position: 'absolute',
    top: 8,
    right: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#4B5563',
    alignSelf: 'flex-end',
    marginRight: 16,
    marginTop: 16,

    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,

    // Shadow for Android
    elevation: 3,
  },

  // button
  otpButton: {
    backgroundColor: '#FFE885',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 'auto',
  },
  otpText: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
  },

  subTitle_2: {
    color: 'grey',
    textAlign: 'center',
    marginTop: 12,
  },
  link: {
    color: '#FAE588',
    // fontFamily: FONT_FAMILY.bricolageMedium,
  },

  changeNumber: {
    fontSize: 16,
    color: '#FAE588',
    textAlign: 'center',
    marginTop: 'auto',
  },

  // otp
  codeFieldRoot: {
    marginTop: '12%',
    marginBottom: '5%',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  cell: {
    width: 50,
    height: 50,
    lineHeight: 48,
    fontSize: 24,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 22,
    color: 'white',
  },
  focusCell: {
    borderColor: '#005EB8',
  },
  disabledLink: {
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#FF0000',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: FONT_FAMILY.outfitBold,
  },
});
