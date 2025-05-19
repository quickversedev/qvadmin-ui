import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  Image,
} from 'react-native';

import {useAuth} from '../../contexts/Login/AuthProvider';
import CountryPicker, {
  Country,
  CountryCode,
} from 'react-native-country-picker-modal';
import {LoginStackParamList} from '../../navigation/LoginNavigation';
import {StackNavigationProp} from '@react-navigation/stack';
import {useNavigation} from '@react-navigation/native';

const {height} = Dimensions.get('window');
type LoginScreenNavigationProp = StackNavigationProp<
  LoginStackParamList,
  'LoginScreen'
>;
const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [countryCode, setCountryCode] = useState<CountryCode>('IN');
  const [callingCode, setCallingCode] = useState('91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const onSelect = (country: Country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
  };
  const auth = useAuth();
  const handleLogin = async () => {
    setLoading(true);
    try {
      const verificationId = await auth.sendOtp(phoneNumber);
      navigation.navigate({
        name: 'OTPScreen',
        params: {phoneNumber, verificationId: verificationId},
      });
    } catch (err) {
      Alert.alert('Error', 'Login failed');
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>Log In to your Quickverse account</Text>

        <Text style={{color: '#9CA3AF', marginTop: 36}}>Phone number</Text>
        <View style={styles.phoneInputWrapper}>
          <CountryPicker
            withCallingCode
            withFilter
            countryCode={countryCode}
            withFlag
            withEmoji
            onSelect={onSelect}
            containerButtonStyle={styles.countryPicker}
          />
          <Text style={styles.callingCode}>+{callingCode}</Text>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Enter phone number"
            keyboardType="number-pad"
            maxLength={10}
            style={styles.input}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <TouchableOpacity
          style={styles.otpButton}
          onPress={handleLogin}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.otpText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    alignItems: 'center',
  },
  topBackground: {
    height: height * 0.6,
    width: '100%',
    position: 'absolute',
    top: -80,
  },
  logoContainer: {
    position: 'absolute',
    top: 70,
    alignItems: 'center',
    width: '100%',
  },
  topLogo: {
    width: 90,
    resizeMode: 'contain',
  },
  card: {
    width: '90%',
    height: '50%',
    marginTop: 150,
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
    fontWeight: 'bold',
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
    marginRight: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 5,
    marginBottom: '15%',
    paddingHorizontal: 10,
    height: 55,
  },
  countryPicker: {
    marginRight: 8,
  },
  callingCode: {
    color: 'white',
    fontSize: 16,
    marginRight: 6,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
  },
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
});
export default LoginScreen;
