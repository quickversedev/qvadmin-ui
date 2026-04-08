import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Asset, launchImageLibrary} from 'react-native-image-picker';
import {SettingsStackParamList} from '../../navigation/SettingsNavigation';
import {SafeAreaView} from 'react-native-safe-area-context'; // Add this import

type Props = StackScreenProps<SettingsStackParamList, 'AddTransporter'>;
type Gender = 'Male' | 'Female' | 'Other' | '';

const AddTransporterScreen: React.FC<Props> = ({navigation}) => {
  // Form data
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Gender>('');
  const [address, setAddress] = useState('');
  const [profileImage, setProfileImage] = useState<Asset | null>(null);
  const [drivingLicenceImage, setDrivingLicenceImage] = useState<Asset | null>(
    null,
  );
  const [rcImage, setRcImage] = useState<Asset | null>(null);
  const [aadharImage, setAadharImage] = useState<Asset | null>(null);

  // Error states
  const [errors, setErrors] = useState({
    fullName: '',
    mobileNumber: '',
  });

  const validateField = (fieldName: string, value: any) => {
    let error = '';

    switch (fieldName) {
      case 'fullName':
        if (!value || !value.trim()) {
          error = 'Full Name is required';
        }
        break;
      case 'mobileNumber':
        if (!value || !value.trim()) {
          error = 'Mobile Number is required';
        }
        break;
    }

    setErrors(prev => ({
      ...prev,
      [fieldName]: error,
    }));
  };

  const handleFieldBlur = (fieldName: string, value: any) => {
    validateField(fieldName, value);
  };

  const isFormValid = () => {
    const newErrors = {
      fullName: fullName.trim() ? '' : 'Full Name is required',
      mobileNumber: mobileNumber.trim() ? '' : 'Mobile Number is required',
    };

    setErrors(newErrors);

    return Object.values(newErrors).every(err => err === '');
  };

  const pickImage = async (setter: (asset: Asset | null) => void) => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.8,
    });

    if (result.didCancel) {
      return;
    }

    if (result.errorCode) {
      Alert.alert(
        'Image Error',
        result.errorMessage || 'Unable to select image',
      );
      return;
    }

    const selected =
      result.assets && result.assets[0] ? result.assets[0] : null;
    setter(selected);
  };

  const onSubmit = () => {
    if (!isFormValid()) {
      return;
    }

    Alert.alert(
      'Delivery Partner Added',
      'Delivery partner registration details are captured. API integration can be added next.',
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Back">
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color="#1F2937"
            />
          </TouchableOpacity>
          <Text style={styles.title}>Add Delivery Partner</Text>
          <View style={styles.iconButtonPlaceholder} />
        </View>

        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Basic Details</Text>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            onBlur={() => handleFieldBlur('fullName', fullName)}
            placeholder="Enter full name"
            placeholderTextColor="#94A3B8"
            style={[styles.input, errors.fullName && styles.inputError]}
          />
          {errors.fullName ? (
            <Text style={styles.errorText}>{errors.fullName}</Text>
          ) : null}

          <Text style={styles.label}>Mobile Number *</Text>
          <TextInput
            value={mobileNumber}
            onChangeText={setMobileNumber}
            onBlur={() => handleFieldBlur('mobileNumber', mobileNumber)}
            placeholder="Enter mobile number"
            placeholderTextColor="#94A3B8"
            style={[styles.input, errors.mobileNumber && styles.inputError]}
            keyboardType="number-pad"
            maxLength={10}
          />
          {errors.mobileNumber ? (
            <Text style={styles.errorText}>{errors.mobileNumber}</Text>
          ) : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email"
            placeholderTextColor="#94A3B8"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            {(['Male', 'Female', 'Other'] as const).map(value => {
              const active = gender === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.genderPill, active && styles.genderPillActive]}
                  onPress={() => {
                    setGender(value);
                    validateField('gender', value);
                  }}>
                  <Text
                    style={[
                      styles.genderPillText,
                      active && styles.genderPillTextActive,
                    ]}>
                    {value}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.label}>Address</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Enter address"
            placeholderTextColor="#94A3B8"
            style={[styles.input, styles.multilineInput]}
            multiline
          />

          <Text style={styles.sectionTitle}>Images & Documents</Text>

          <DocPicker
            label="Profile Image"
            required={false}
            asset={profileImage}
            onPick={() => pickImage(setProfileImage)}
          />

          <DocPicker
            label="Driving Licence"
            required={false}
            asset={drivingLicenceImage}
            onPick={() => pickImage(setDrivingLicenceImage)}
          />

          <DocPicker
            label="RC"
            required={false}
            asset={rcImage}
            onPick={() => pickImage(setRcImage)}
          />

          <DocPicker
            label="Aadhar Card"
            required={false}
            asset={aadharImage}
            onPick={() => pickImage(setAadharImage)}
          />

          {Object.values(errors).some(err => err !== '') && (
            <View style={styles.errorSummary}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={16}
                color="#DC2626"
              />
              <Text style={styles.errorSummaryText}>
                Please fix the errors below
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
            <Text style={styles.submitButtonText}>Save Transporter</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

type DocPickerProps = {
  label: string;
  required?: boolean;
  asset: Asset | null;
  onPick: () => void;
  error?: string;
};

const DocPicker: React.FC<DocPickerProps> = ({
  label,
  required,
  asset,
  onPick,
  error,
}) => {
  return (
    <View style={styles.docCard}>
      <View style={styles.docHeader}>
        <Text style={styles.docTitle}>
          {label}
          {required ? ' *' : ''}
        </Text>
        <TouchableOpacity
          onPress={() => {
            onPick();
          }}
          style={styles.docButton}>
          <MaterialCommunityIcons name="image-plus" size={16} color="#FFFFFF" />
          <Text style={styles.docButtonText}>Select</Text>
        </TouchableOpacity>
      </View>

      {asset?.uri ? (
        <Image source={{uri: asset.uri}} style={styles.docPreview} />
      ) : (
        <View
          style={[styles.docPlaceholder, error && styles.docPlaceholderError]}>
          <MaterialCommunityIcons
            name="image-outline"
            size={18}
            color={error ? '#DC2626' : '#94A3B8'}
          />
          <Text
            style={[
              styles.docPlaceholderText,
              error && styles.docPlaceholderTextError,
            ]}>
            No image selected
          </Text>
        </View>
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  iconButtonPlaceholder: {
    width: 36,
    height: 36,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 6,
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 2,
  },
  errorSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    marginTop: 4,
  },
  errorSummaryText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  multilineInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  genderRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  genderPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 8,
  },
  genderPillActive: {
    backgroundColor: '#115E59',
    borderColor: '#115E59',
  },
  genderPillText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 13,
  },
  genderPillTextActive: {
    color: '#FFFFFF',
  },
  docCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  docButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  docButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 5,
    fontWeight: '700',
  },
  docPreview: {
    width: '100%',
    height: 170,
    borderRadius: 10,
  },
  docPlaceholder: {
    height: 90,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
  },
  docPlaceholderError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  docPlaceholderText: {
    marginLeft: 6,
    color: '#64748B',
    fontSize: 13,
  },
  docPlaceholderTextError: {
    color: '#DC2626',
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 6,
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default AddTransporterScreen;
