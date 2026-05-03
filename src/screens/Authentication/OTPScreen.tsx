import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';

import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import {AuthNavigationStackParamList} from '../../navigation/AuthStack';
import {useAuth} from '../../contexts/Login/AuthProvider';
import {FONT_FAMILY} from '../../assets/constants/fonts';

const {height} = Dimensions.get('window');

const CELL_COUNT = 4;
type LoginScreenRouteProp = RouteProp<
  AuthNavigationStackParamList,
  'OTPScreen'
>;
const OTPScreen: React.FC = () => {
  const route = useRoute<LoginScreenRouteProp>();
  const {phoneNumber, verificationId} = route.params;
  const navigation = useNavigation();
  const [value, setValue] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Resend OTP Timer
  const [resendTimeout, setResendTimeout] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [currentVerificationId, setCurrentVerificationId] =
    useState(verificationId);

  const ref = useBlurOnFulfill({value, cellCount: CELL_COUNT});
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue,
  });
  const auth = useAuth();

  // Timer effect
  useEffect(() => {
    let interval: any;

    if (!canResend && resendTimeout > 0) {
      interval = setInterval(() => {
        setResendTimeout(prev => prev - 1);
      }, 1000);
    } else if (resendTimeout === 0) {
      setCanResend(true);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [canResend, resendTimeout]);

  const verifyOTP = async () => {
    if (value.length !== CELL_COUNT) {
      Alert.alert('Invalid OTP', 'Please enter a valid 4-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await auth.verifyOtp(phoneNumber, value, currentVerificationId);
    } catch (err) {
      Alert.alert('Error', 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) {
      return;
    }

    try {
      setLoading(true);
      const newVerificationId = await auth.sendOtp(phoneNumber);
      setCurrentVerificationId(newVerificationId);
      setResendTimeout(60);
      setCanResend(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeNumber = () => {
    navigation.goBack();
  };

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
        <Text style={styles.title}>Enter Your OTP</Text>
        <Text style={styles.subtitle}>{`OTP sent to ${phoneNumber}`}</Text>

        <CodeField
          ref={ref}
          {...props}
          value={value}
          onChangeText={setValue}
          cellCount={CELL_COUNT}
          rootStyle={styles.codeFieldRoot}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          renderCell={({index, symbol, isFocused}) => (
            <View
              onLayout={getCellOnLayoutHandler(index)}
              key={index}
              style={[styles.cell, isFocused && styles.focusCell]}>
              <Text style={styles.cellText}>
                {symbol || (isFocused ? <Cursor /> : null)}
              </Text>
            </View>
          )}
        />

        <Text style={styles.subTitle_2}>
          Didn’t receive the OTP?{' '}
          {canResend ? (
            <Text style={styles.link} onPress={handleResendOtp}>
              Resend Code
            </Text>
          ) : (
            <Text style={styles.disabledLink}>
              Resend Code in {resendTimeout}s
            </Text>
          )}
        </Text>

        <TouchableOpacity
          style={{marginTop: 'auto', marginBottom: 15}}
          onPress={handleChangeNumber}>
          <Text style={styles.changeNumber}>Change Number</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.otpButton}
          onPress={verifyOTP}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.otpText}>Verify and Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OTPScreen;

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
    height: '58%',
    marginTop: 100,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,

    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },

  title: {
    fontSize: 28,
    color: '#F3F4F6',
    fontFamily: FONT_FAMILY.outfitExtraBold,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 5,
    marginBottom: 16,
    fontSize: 14,
    fontFamily: FONT_FAMILY.bricolageRegular,
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
    borderRadius: 10,
    paddingVertical: 14,
    // marginTop: "auto",
  },
  otpText: {
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
    fontFamily: FONT_FAMILY.outfitBold,
  },

  subTitle_2: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 13,
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  link: {
    color: '#FAE588',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },

  changeNumber: {
    fontSize: 15,
    color: '#FAE588',
    textAlign: 'center',
    marginTop: 'auto',
    fontFamily: FONT_FAMILY.bricolageMedium,
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
    borderColor: '#4B5563',
    backgroundColor: '#111827',
    borderRadius: 10,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 22,
    color: '#F9FAFB',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  focusCell: {
    borderColor: '#FAE588',
  },
  disabledLink: {
    color: '#6B7280',
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
});
