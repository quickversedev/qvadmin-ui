import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {SafeAreaView} from 'react-native-safe-area-context';
import {launchImageLibrary} from 'react-native-image-picker';

import {useAuth} from '../../contexts/Login/AuthProvider';
import {SettingsStackParamList} from '../../navigation/SettingsNavigation';
import {
  DeliveryPartner,
  DeliveryPartnerGender,
  DeliveryPartnerPayload,
  getDeliveryPartnerId,
} from '../../services/apis/deliveryPartnerService';
import {useDeliveryPartnerStore} from '../../store/deliveryPartners/useDeliveryPartnerStore';
import {FONT_FAMILY} from '../../assets/constants/fonts';

type Props = StackScreenProps<SettingsStackParamList, 'AddTransporter'>;

type FormGender = '' | DeliveryPartnerGender;

type FormState = {
  name: string;
  mobileNumber: string;
  email: string;
  address: string;
  gender: FormGender;
  profilePicture: SelectedFile | null;
  aadharCard: SelectedFile | null;
  drivingLicence: SelectedFile | null;
  rcDocument: SelectedFile | null;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

type SelectedFile = {
  uri: string;
  type?: string | null;
  name?: string | null;
};

const emptyFormState: FormState = {
  name: '',
  mobileNumber: '',
  email: '',
  address: '',
  gender: '',
  profilePicture: null,
  aadharCard: null,
  drivingLicence: null,
  rcDocument: null,
};

const genderOptions: Array<{label: string; value: DeliveryPartnerGender}> = [
  {label: 'Male', value: 'MALE'},
  {label: 'Female', value: 'FEMALE'},
  {label: 'Other', value: 'OTHER'},
];

const isImageAsset = (asset?: SelectedFile | null) => {
  const mimeType = asset?.type || '';
  return mimeType.startsWith('image/');
};

const getAssetFileName = (asset?: SelectedFile | null) => {
  if (!asset) {
    return '';
  }

  return asset.name || asset.uri?.split('/').pop() || 'Selected file';
};

const getRemoteFileLabel = (partner?: DeliveryPartner | null, key?: string) => {
  const rawValue = partner?.[key as keyof DeliveryPartner];

  if (typeof rawValue !== 'string' || !rawValue) {
    return '';
  }

  const fileName = rawValue.split('/').pop() || rawValue;
  return fileName;
};

const getRemoteFileUri = (
  partner?: DeliveryPartner | null,
  key?: string,
): string | undefined => {
  const rawValue = partner?.[key as keyof DeliveryPartner];

  if (typeof rawValue !== 'string' || !rawValue) {
    return undefined;
  }

  const isUri =
    rawValue.startsWith('http://') ||
    rawValue.startsWith('https://') ||
    rawValue.startsWith('file://') ||
    rawValue.startsWith('content://');

  return isUri ? rawValue : undefined;
};

const normalizeGender = (gender?: string): FormGender => {
  if (!gender) {
    return '';
  }

  const upper = gender.toUpperCase();
  if (upper === 'MALE' || upper === 'M') {
    return 'MALE';
  }

  if (upper === 'FEMALE' || upper === 'F') {
    return 'FEMALE';
  }

  if (upper === 'OTHER') {
    return 'OTHER';
  }

  return '';
};

const normalizeMobileNumber = (value: unknown): string => {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim();
};

const getDisplayMobileNumber = (value: unknown): string => {
  const normalized = normalizeMobileNumber(value).replace(/\D/g, '');

  if (normalized.length > 10 && normalized.startsWith('91')) {
    return normalized.slice(2, 12);
  }

  return normalized.slice(0, 10);
};

const getApiMobileNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  const localNumber = digits.length > 10 ? digits.slice(-10) : digits;
  return `91${localNumber}`;
};

const extractPartner = (value: any): DeliveryPartner | null => {
  if (!value) {
    return null;
  }

  if (value.deliveryPartner) {
    return value.deliveryPartner;
  }

  if (value.partner) {
    return value.partner;
  }

  if (value.item) {
    return value.item;
  }

  if (value.response) {
    return extractPartner(value.response);
  }

  if (value.data) {
    return extractPartner(value.data);
  }

  if (value.id || value.dpId || value.deliveryPartnerId || value._id) {
    return value;
  }

  return null;
};

const toFormState = (partner: DeliveryPartner): FormState => ({
  name: partner.name || partner.fullName || '',
  mobileNumber: getDisplayMobileNumber(
    partner.mobileNumber ||
      (partner as any).mobile ||
      (partner as any).phoneNumber ||
      (partner as any).phone ||
      (partner as any).phoneNo ||
      (partner as any).phone_number ||
      (partner as any).contactNumber,
  ),
  email: partner.email || '',
  address: partner.address || '',
  gender: normalizeGender(partner.gender),
  profilePicture: null,
  aadharCard: null,
  drivingLicence: null,
  rcDocument: null,
});

const createUploadFile = (asset: SelectedFile | null) => {
  if (!asset?.uri) {
    return null;
  }

  return {
    uri: asset.uri,
    type: asset.type || 'application/octet-stream',
    name: asset.name || asset.uri.split('/').pop() || `file_${Date.now()}`,
  };
};

const hasExistingDocument = (
  partner: DeliveryPartner | null,
  key: keyof DeliveryPartner,
) => {
  const value = partner?.[key];
  return typeof value === 'string' && value.trim().length > 0;
};

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as {message?: string}).message;
    if (message) {
      return message;
    }
  }

  return 'Something went wrong while saving the delivery partner';
};

const getSubmitErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object') {
    const status = (error as {status?: number}).status;
    if (status === 500 || status === undefined || status >= 400) {
      return 'Email or mobile number already exists';
    }
  }

  return 'Email or mobile number already exists';
};

const AddTransporterScreen: React.FC<Props> = ({navigation, route}) => {
  const {authData} = useAuth();
  const transporterId = route.params?.transporterId;
  const isEditMode = Boolean(transporterId);

  const {
    selectedPartner,
    fetchPartnerById,
    getPartnerById,
    createPartner,
    updatePartner,
    clearSelectedPartner,
  } = useDeliveryPartnerStore();

  const [form, setForm] = useState<FormState>(emptyFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loadingPartner, setLoadingPartner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPartner, setCurrentPartner] = useState<DeliveryPartner | null>(
    null,
  );

  const title = useMemo(
    () => (isEditMode ? 'Edit Delivery Partner' : 'Add Delivery Partner'),
    [isEditMode],
  );

  const submitLabel = isEditMode ? 'Save Changes' : 'Save Partner';

  useEffect(() => {
    let isActive = true;

    const loadPartner = async () => {
      if (!transporterId) {
        clearSelectedPartner();
        setCurrentPartner(null);
        setForm(emptyFormState);
        return;
      }

      const cachedPartner = getPartnerById(transporterId);
      if (cachedPartner) {
        if (isActive) {
          const normalizedCached =
            extractPartner(cachedPartner) || cachedPartner;
          setCurrentPartner(normalizedCached);
          setForm(toFormState(normalizedCached));
        }
        return;
      }

      setLoadingPartner(true);
      try {
        const partner = await fetchPartnerById(transporterId, authData?.jwt);
        if (!isActive) {
          return;
        }

        const normalizedPartner = extractPartner(partner);

        if (!normalizedPartner) {
          throw new Error('Delivery partner not found');
        }

        setCurrentPartner(normalizedPartner);
        setForm(toFormState(normalizedPartner));
      } catch (error) {
        if (isActive) {
          Alert.alert('Error', getErrorMessage(error));
        }
      } finally {
        if (isActive) {
          setLoadingPartner(false);
        }
      }
    };

    loadPartner();

    return () => {
      isActive = false;
    };
  }, [
    authData?.jwt,
    clearSelectedPartner,
    fetchPartnerById,
    getPartnerById,
    transporterId,
  ]);

  useEffect(() => {
    if (!selectedPartner || !transporterId) {
      return;
    }

    if (getDeliveryPartnerId(selectedPartner) !== transporterId) {
      return;
    }

    const normalizedSelected =
      extractPartner(selectedPartner) || selectedPartner;
    setCurrentPartner(normalizedSelected);
    setForm(toFormState(normalizedSelected));
  }, [selectedPartner, transporterId]);

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm(prev => ({...prev, [field]: value}));

    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: undefined}));
    }
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = 'Name is required';
    }

    if (!form.mobileNumber.trim()) {
      nextErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(form.mobileNumber.trim())) {
      nextErrors.mobileNumber = 'Enter a valid 10-digit mobile number';
    }

    if (!form.address.trim()) {
      nextErrors.address = 'Address is required';
    }

    if (!form.gender) {
      nextErrors.gender = 'Gender is required';
    }

    if (
      !form.profilePicture &&
      !hasExistingDocument(currentPartner, 'profilePicture')
    ) {
      nextErrors.profilePicture = 'Profile picture is required';
    }

    if (
      !form.aadharCard &&
      !hasExistingDocument(currentPartner, 'aadharCard')
    ) {
      nextErrors.aadharCard = 'Aadhar card is required';
    }

    if (
      !form.drivingLicence &&
      !hasExistingDocument(currentPartner, 'drivingLicence')
    ) {
      nextErrors.drivingLicence = 'Driving licence is required';
    }

    if (
      !form.rcDocument &&
      !hasExistingDocument(currentPartner, 'rcDocument')
    ) {
      nextErrors.rcDocument = 'RC document is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const pickDocument = async (setter: (file: SelectedFile | null) => void) => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.9,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert(
          'Picker Error',
          result.errorMessage || 'Unable to select file',
        );
        return;
      }

      const selected = result.assets?.[0];
      if (!selected?.uri) {
        Alert.alert('Picker Error', 'Unable to access the selected file');
        return;
      }

      setter({
        uri: selected.uri,
        type: selected.type,
        name: selected.fileName,
      });
    } catch {
      Alert.alert('Picker Error', 'Unable to select file');
    }
  };

  const submitPartner = async () => {
    if (!validateForm()) {
      return;
    }

    const payload: DeliveryPartnerPayload = {
      name: form.name.trim(),
      mobileNumber: getApiMobileNumber(form.mobileNumber.trim()),
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      gender: form.gender || undefined,
    };

    const profilePicture = createUploadFile(form.profilePicture);
    const aadharCard = createUploadFile(form.aadharCard);
    const drivingLicence = createUploadFile(form.drivingLicence);
    const rcDocument = createUploadFile(form.rcDocument);

    if (profilePicture) {
      payload.profilePicture = profilePicture;
    }

    if (aadharCard) {
      payload.aadharCard = aadharCard;
    }

    if (drivingLicence) {
      payload.drivingLicence = drivingLicence;
    }

    if (rcDocument) {
      payload.rcDocument = rcDocument;
    }

    setSaving(true);
    try {
      if (isEditMode && transporterId) {
        await updatePartner(transporterId, payload, authData?.jwt);
      } else {
        await createPartner(payload, authData?.jwt);
      }

      Alert.alert(
        'Success',
        isEditMode
          ? 'Delivery partner updated successfully'
          : 'Delivery partner created successfully',
      );
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', getSubmitErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const isBusy = loadingPartner || saving;

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
          <Text style={styles.title}>{title}</Text>
          <View style={styles.iconButtonPlaceholder} />
        </View>

        {loadingPartner ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#0F766E" />
            <Text style={styles.loadingText}>Loading partner details...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Basic Details</Text>

            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              value={form.name}
              onChangeText={text => updateField('name', text)}
              placeholder="Enter full name"
              placeholderTextColor="#94A3B8"
              style={[styles.input, errors.name && styles.inputError]}
            />
            {errors.name ? (
              <Text style={styles.errorText}>{errors.name}</Text>
            ) : null}

            <Text style={styles.label}>Mobile Number *</Text>
            <TextInput
              value={form.mobileNumber}
              onChangeText={text =>
                updateField(
                  'mobileNumber',
                  text.replace(/\D/g, '').slice(0, 10),
                )
              }
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
              value={form.email}
              onChangeText={text => updateField('email', text)}
              placeholder="Enter email"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Address *</Text>
            <TextInput
              value={form.address}
              onChangeText={text => updateField('address', text)}
              placeholder="Enter address"
              placeholderTextColor="#94A3B8"
              style={[
                styles.input,
                styles.multilineInput,
                errors.address && styles.inputError,
              ]}
              multiline
            />
            {errors.address ? (
              <Text style={styles.errorText}>{errors.address}</Text>
            ) : null}

            <Text style={styles.label}>Gender *</Text>
            <View style={styles.genderRow}>
              {genderOptions.map(option => {
                const active = form.gender === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.genderPill,
                      active && styles.genderPillActive,
                    ]}
                    onPress={() => updateField('gender', option.value)}>
                    <Text
                      style={[
                        styles.genderPillText,
                        active && styles.genderPillTextActive,
                      ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.gender ? (
              <Text style={styles.errorText}>{errors.gender}</Text>
            ) : null}

            <Text style={styles.sectionTitle}>Images & Documents</Text>

            <DocPicker
              label="Profile Picture"
              required={!hasExistingDocument(currentPartner, 'profilePicture')}
              asset={form.profilePicture}
              existingLabel={getRemoteFileLabel(
                currentPartner,
                'profilePicture',
              )}
              existingImageUri={getRemoteFileUri(
                currentPartner,
                'profilePicture',
              )}
              onPick={() =>
                pickDocument(file => updateField('profilePicture', file))
              }
              error={errors.profilePicture}
            />

            <DocPicker
              label="Aadhar Card"
              required={!hasExistingDocument(currentPartner, 'aadharCard')}
              asset={form.aadharCard}
              existingLabel={getRemoteFileLabel(currentPartner, 'aadharCard')}
              existingImageUri={getRemoteFileUri(currentPartner, 'aadharCard')}
              onPick={() =>
                pickDocument(file => updateField('aadharCard', file))
              }
              error={errors.aadharCard}
            />

            <DocPicker
              label="Driving Licence"
              required={!hasExistingDocument(currentPartner, 'drivingLicence')}
              asset={form.drivingLicence}
              existingLabel={getRemoteFileLabel(
                currentPartner,
                'drivingLicence',
              )}
              existingImageUri={getRemoteFileUri(
                currentPartner,
                'drivingLicence',
              )}
              onPick={() =>
                pickDocument(file => updateField('drivingLicence', file))
              }
              error={errors.drivingLicence}
            />

            <DocPicker
              label="RC Document"
              required={!hasExistingDocument(currentPartner, 'rcDocument')}
              asset={form.rcDocument}
              existingLabel={getRemoteFileLabel(currentPartner, 'rcDocument')}
              existingImageUri={getRemoteFileUri(currentPartner, 'rcDocument')}
              onPick={() =>
                pickDocument(file => updateField('rcDocument', file))
              }
              error={errors.rcDocument}
            />

            {Object.values(errors).some(Boolean) ? (
              <View style={styles.errorSummary}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={16}
                  color="#DC2626"
                />
                <Text style={styles.errorSummaryText}>
                  Please fix the highlighted fields
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.submitButton,
                isBusy && styles.submitButtonDisabled,
              ]}
              onPress={submitPartner}
              disabled={isBusy}>
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>{submitLabel}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

type DocPickerProps = {
  label: string;
  required?: boolean;
  asset: SelectedFile | null;
  existingLabel?: string;
  existingImageUri?: string;
  onPick: () => void;
  error?: string;
};

const DocPicker: React.FC<DocPickerProps> = ({
  label,
  required,
  asset,
  existingLabel,
  existingImageUri,
  onPick,
  error,
}) => {
  const previewLabel = asset ? getAssetFileName(asset) : existingLabel;

  return (
    <View style={styles.docCard}>
      <View style={styles.docHeader}>
        <Text style={styles.docTitle}>
          {label}
          {required ? ' *' : ''}
        </Text>
        <TouchableOpacity onPress={onPick} style={styles.docButton}>
          <MaterialCommunityIcons name="image-plus" size={16} color="#FFFFFF" />
          <Text style={styles.docButtonText}>Select</Text>
        </TouchableOpacity>
      </View>

      {asset?.uri && isImageAsset(asset) ? (
        <Image source={{uri: asset.uri}} style={styles.docPreview} />
      ) : existingImageUri ? (
        <Image source={{uri: existingImageUri}} style={styles.docPreview} />
      ) : previewLabel ? (
        <View
          style={[styles.docPlaceholder, error && styles.docPlaceholderError]}>
          <MaterialCommunityIcons
            name="file-document-outline"
            size={18}
            color={error ? '#DC2626' : '#0F766E'}
          />
          <View style={styles.docLabelWrap}>
            <Text
              numberOfLines={1}
              style={[
                styles.docPlaceholderText,
                error && styles.docPlaceholderTextError,
              ]}>
              {previewLabel}
            </Text>
            <Text style={styles.docMetaText}>
              {asset ? 'Ready to upload' : 'Existing file on record'}
            </Text>
          </View>
        </View>
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
            No file selected
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
    fontFamily: FONT_FAMILY.outfitBold,
    color: '#0F172A',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#475569',
    fontSize: 14,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 16,
    fontFamily: FONT_FAMILY.outfitBold,
    color: '#0F172A',
  },
  label: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bricolageMedium,
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
    fontFamily: FONT_FAMILY.bricolageMedium,
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
    fontFamily: FONT_FAMILY.bricolageMedium,
    marginLeft: 8,
  },
  multilineInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  genderRow: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  genderPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 8,
    marginBottom: 8,
  },
  genderPillActive: {
    backgroundColor: '#115E59',
    borderColor: '#115E59',
  },
  genderPillText: {
    color: '#334155',
    fontFamily: FONT_FAMILY.bricolageMedium,
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
    fontFamily: FONT_FAMILY.outfitBold,
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
    fontFamily: FONT_FAMILY.outfitBold,
  },
  docPreview: {
    width: '100%',
    height: 170,
    borderRadius: 10,
    marginBottom: 2,
  },
  docPlaceholder: {
    minHeight: 90,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
  },
  docPlaceholderError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  docLabelWrap: {
    flex: 1,
    marginLeft: 8,
  },
  docPlaceholderText: {
    color: '#0F172A',
    fontSize: 13,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  docPlaceholderTextError: {
    color: '#DC2626',
  },
  docMetaText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
  },
  submitButton: {
    marginTop: 6,
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  submitButtonDisabled: {
    opacity: 0.8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONT_FAMILY.outfitBold,
  },
});

export default AddTransporterScreen;
