import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
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
import {FONT_FAMILY} from '../../assets/constants/fonts';
import {SettingsNavigationStackParamList} from '../../navigation/SettingsNavigation';
import {useVendorStore} from '../../store/vendors/useVendorStore';
import {
  createPromotion,
  PromotionUploadFile,
  updatePromotion,
} from '../../services/apis/promotionService';
import {useDevModeStore} from '../../store/app/useDevModeStore';

type Props = StackScreenProps<
  SettingsNavigationStackParamList,
  'AddPromotionBanner'
>;

type FormState = {
  pageName: string;
  regionId: string;
  shopId: string;
  title: string;
  subtitle: string;
  size: string;
  backgroundColor: string;
  sequence: string;
  isBannerImage: boolean;
  image: PromotionUploadFile | null;
  currentImageUrl: string;
};

type FeedbackModalState = {
  visible: boolean;
  title: string;
  message: string;
  buttonLabel: string;
  variant: 'success' | 'error' | 'info';
};

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as {message?: string}).message;
    if (message) {
      return message;
    }
  }

  return 'Failed to save promotional banner';
};

const AddPromotionBannerScreen: React.FC<Props> = ({navigation, route}) => {
  const isDevMode = useDevModeStore(state => state.isDevMode);
  const {authData} = useAuth();
  const vendors = useVendorStore(state => state.vendors);
  const vendorsLoading = useVendorStore(state => state.loading);
  const fetchVendors = useVendorStore(state => state.fetchVendors);
  const mode = route.params?.mode || 'create';
  const routePageName = route.params?.pageName;
  const routeRegionId = route.params?.regionId;
  const routePromotionId = route.params?.promotionId;
  const routePromotionData = route.params?.promotionData;
  const isEditMode = mode === 'edit';

  const [form, setForm] = useState<FormState>({
    pageName: routePageName ? String(routePageName) : '',
    regionId: routeRegionId ? String(routeRegionId) : '',
    shopId: routePromotionData?.shopId ? String(routePromotionData.shopId) : '',
    title: routePromotionData?.title ? String(routePromotionData.title) : '',
    subtitle: routePromotionData?.subtitle
      ? String(routePromotionData.subtitle)
      : '',
    size: routePromotionData?.size ? String(routePromotionData.size) : 'Small',
    backgroundColor: routePromotionData?.backgroundColor
      ? String(routePromotionData.backgroundColor)
      : '',
    sequence:
      routePromotionData?.sequence !== undefined &&
      routePromotionData?.sequence !== null
        ? String(routePromotionData.sequence)
        : '',
    isBannerImage:
      routePromotionData?.isBannerImage ??
      routePromotionData?.bannerImage ??
      true,
    image: null,
    currentImageUrl: routePromotionData?.imageURL
      ? String(routePromotionData.imageURL)
      : '',
  });
  const [saving, setSaving] = useState(false);
  const [showShopSelector, setShowShopSelector] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState>({
    visible: false,
    title: '',
    message: '',
    buttonLabel: 'OK',
    variant: 'info',
  });

  const showFeedbackModal = (
    title: string,
    message: string,
    variant: FeedbackModalState['variant'] = 'info',
    buttonLabel = 'OK',
  ) => {
    setFeedbackModal({
      visible: true,
      title,
      message,
      buttonLabel,
      variant,
    });
  };

  const hideFeedbackModal = () => {
    setFeedbackModal(prev => ({...prev, visible: false}));
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditMode ? 'Edit Promotion Banner' : 'Add Promotion Banner',
    });
  }, [navigation, isEditMode]);

  useEffect(() => {
    const normalizedRegionId = form.regionId.trim();

    if (!normalizedRegionId) {
      return;
    }

    fetchVendors(normalizedRegionId);
  }, [form.regionId, fetchVendors]);

  const selectedShopLabel = useMemo(() => {
    if (!form.shopId.trim()) {
      return 'Select shop (optional)';
    }

    const selectedVendor = vendors.find(
      vendor => String(vendor.shopId) === form.shopId.trim(),
    );

    if (selectedVendor) {
      return `${selectedVendor.name} - ${selectedVendor.shopId}`;
    }

    return `Shop ID: ${form.shopId}`;
  }, [form.shopId, vendors]);

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm(prev => ({...prev, [key]: value}));
  };

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.9,
      selectionLimit: 1,
    });

    if (result.didCancel) {
      return;
    }

    if (result.errorCode || !result.assets?.length) {
      showFeedbackModal(
        'Image Error',
        result.errorMessage || 'Unable to select image',
        'error',
      );
      return;
    }

    const asset = result.assets[0];

    if (!asset.uri) {
      showFeedbackModal('Image Error', 'Selected image is invalid', 'error');
      return;
    }

    updateField('image', {
      uri: asset.uri,
      name: asset.fileName || `promotion_${Date.now()}.jpg`,
      type: asset.type || 'image/jpeg',
    });
  };

  const validate = () => {
    if (!authData?.jwt) {
      showFeedbackModal(
        'Validation',
        'Session expired. Please login again.',
        'error',
      );
      return false;
    }

    if (!isEditMode && !form.pageName.trim()) {
      showFeedbackModal('Validation', 'pageName is required', 'error');
      return false;
    }

    if (!isEditMode && !form.regionId.trim()) {
      showFeedbackModal('Validation', 'regionId is required', 'error');
      return false;
    }

    if (!isEditMode && !form.image?.uri) {
      showFeedbackModal('Validation', 'Image is required', 'error');
      return false;
    }

    if (!form.sequence.trim()) {
      showFeedbackModal('Validation', 'sequence is required', 'error');
      return false;
    }

    if (isEditMode && !routePromotionId) {
      showFeedbackModal(
        'Validation',
        'Promotion ID is required for update',
        'error',
      );
      return false;
    }

    return true;
  };

  const onSubmit = async () => {
    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      if (isEditMode) {
        await updatePromotion(
          routePromotionId!,
          {
            sequence: form.sequence,
            title: form.title,
            subtitle: form.subtitle,
            shopId: form.shopId,
            size: form.size,
            backgroundColor: form.backgroundColor,
            isBannerImage: form.isBannerImage,
            imageFile: form.image,
          },
          authData!.jwt,
        );
      } else {
        await createPromotion(
          {
            pageName: form.pageName.trim(),
            regionId: form.regionId.trim(),
            imageFile: form.image!,
            shopId: form.shopId,
            title: form.title,
            subtitle: form.subtitle,
            size: form.size,
            backgroundColor: form.backgroundColor,
            sequence: form.sequence,
            isBannerImage: form.isBannerImage,
          },
          authData!.jwt,
        );
      }

      showFeedbackModal(
        'Success',
        `Promotion banner ${isEditMode ? 'updated' : 'added'} successfully`,
        'success',
        'Done',
      );
    } catch (error) {
      showFeedbackModal(
        isEditMode ? 'Update Banner Failed' : 'Add Banner Failed',
        getErrorMessage(error),
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Required Fields</Text>

            {!isEditMode ? (
              <>
                <Text style={styles.inputLabel}>pageName *</Text>
                <TextInput
                  value={form.pageName}
                  style={[styles.input, styles.readOnlyInput]}
                  placeholder="Selected page"
                  placeholderTextColor="#94A3B8"
                  editable={false}
                  selectTextOnFocus={false}
                />

                <Text style={styles.inputLabel}>regionId *</Text>
                <TextInput
                  value={form.regionId}
                  style={[styles.input, styles.readOnlyInput]}
                  placeholder="Selected region"
                  placeholderTextColor="#94A3B8"
                  editable={false}
                  selectTextOnFocus={false}
                />
              </>
            ) : null}

            <Text style={styles.inputLabel}>
              {isEditMode ? 'Image (optional)' : 'Image *'}
            </Text>
            {form.image?.uri ? (
              <Image
                source={{uri: form.image.uri}}
                style={styles.previewImage}
              />
            ) : form.currentImageUrl ? (
              <Image
                source={{uri: form.currentImageUrl}}
                style={styles.previewImage}
              />
            ) : (
              <View style={styles.emptyImageBox}>
                <MaterialCommunityIcons
                  name="image-outline"
                  size={28}
                  color="#94A3B8"
                />
                <Text style={styles.emptyImageText}>No image selected</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={pickImage}
              disabled={saving}>
              <MaterialCommunityIcons
                name="image-plus"
                size={16}
                color="#0F172A"
              />
              <Text style={styles.uploadButtonText}>
                {isEditMode ? 'Replace Image' : 'Choose Image'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Optional Fields</Text>

            <Text style={styles.inputLabel}>Shop ID</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowShopSelector(true)}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Select shop ID">
              <Text
                style={[
                  styles.selectInputText,
                  !form.shopId.trim() && styles.selectInputPlaceholder,
                ]}
                numberOfLines={1}>
                {selectedShopLabel}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={20}
                color="#475569"
              />
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              value={form.title}
              onChangeText={value => updateField('title', value)}
              style={styles.input}
              placeholder="Banner title"
              placeholderTextColor="#94A3B8"
              editable={!saving}
            />

            <Text style={styles.inputLabel}>Subtitle</Text>
            <TextInput
              value={form.subtitle}
              onChangeText={value => updateField('subtitle', value)}
              style={styles.input}
              placeholder="Banner subtitle"
              placeholderTextColor="#94A3B8"
              editable={!saving}
            />

            <Text style={styles.inputLabel}>Size</Text>
            <TextInput
              value={form.size}
              onChangeText={value => updateField('size', value)}
              style={[styles.input, styles.readOnlyInput]}
              placeholder="Small"
              placeholderTextColor="#94A3B8"
              editable={false}
              selectTextOnFocus={false}
            />

            <Text style={styles.inputLabel}>Background Color</Text>
            <TextInput
              value={form.backgroundColor}
              onChangeText={value => updateField('backgroundColor', value)}
              style={[styles.input, styles.readOnlyInput]}
              placeholder="#FFFFFF"
              placeholderTextColor="#94A3B8"
              editable={false}
              selectTextOnFocus={false}
            />

            <Text style={styles.inputLabel}>Sequence *</Text>
            <TextInput
              value={form.sequence}
              onChangeText={value =>
                updateField('sequence', value.replace(/[^0-9]/g, ''))
              }
              style={styles.input}
              placeholder="1"
              placeholderTextColor="#94A3B8"
              editable={!saving}
              keyboardType="numeric"
            />

            <View style={styles.switchRow}>
              <Text style={styles.inputLabel}>isBannerImage</Text>
              <Switch
                value={form.isBannerImage}
                onValueChange={value => updateField('isBannerImage', value)}
                disabled={saving}
                trackColor={{false: '#CBD5E1', true: '#0F766E'}}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, saving && styles.submitButtonDisabled]}
            onPress={onSubmit}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditMode
                  ? 'Update Promotion Banner'
                  : 'Add Promotion Banner'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={showShopSelector}
          transparent
          animationType="fade"
          onRequestClose={() => setShowShopSelector(false)}>
          <View style={styles.optionModalBackdrop}>
            <View style={styles.optionModalCard}>
              <Text style={styles.optionModalTitle}>
                Select Shop (Optional)
              </Text>

              {vendorsLoading ? (
                <View style={styles.optionLoadingRow}>
                  <ActivityIndicator size="small" color="#0F766E" />
                  <Text style={styles.optionLoadingText}>Loading shops...</Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.optionList}
                  showsVerticalScrollIndicator={false}>
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => {
                      updateField('shopId', '');
                      setShowShopSelector(false);
                    }}>
                    <Text style={styles.optionItemText}>None</Text>
                  </TouchableOpacity>

                  {vendors.map(vendor => {
                    const optionLabel = `${vendor.name} - ${vendor.shopId}`;
                    const isSelected = String(vendor.shopId) === form.shopId;

                    return (
                      <TouchableOpacity
                        key={String(vendor.shopId)}
                        style={[
                          styles.optionItem,
                          isSelected && styles.optionItemSelected,
                        ]}
                        onPress={() => {
                          updateField('shopId', String(vendor.shopId));
                          setShowShopSelector(false);
                        }}>
                        <Text style={styles.optionItemText}>{optionLabel}</Text>
                      </TouchableOpacity>
                    );
                  })}

                  {!vendors.length ? (
                    <Text style={styles.emptyOptionText}>
                      No shops found for this region.
                    </Text>
                  ) : null}
                </ScrollView>
              )}

              <TouchableOpacity
                style={styles.optionCloseButton}
                onPress={() => setShowShopSelector(false)}>
                <Text style={styles.optionCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={feedbackModal.visible}
          transparent
          animationType="fade"
          onRequestClose={hideFeedbackModal}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{feedbackModal.title}</Text>
              <Text style={styles.modalMessage}>{feedbackModal.message}</Text>

              <TouchableOpacity
                style={[
                  styles.modalPrimaryButton,
                  feedbackModal.variant === 'success'
                    ? styles.modalPrimaryButtonSuccess
                    : styles.modalPrimaryButtonError,
                ]}
                onPress={() => {
                  const shouldNavigateBack =
                    feedbackModal.variant === 'success' &&
                    feedbackModal.buttonLabel === 'Done';
                  hideFeedbackModal();

                  if (shouldNavigateBack) {
                    navigation.goBack();
                  }
                }}>
                <Text style={styles.modalPrimaryButtonText}>
                  {feedbackModal.buttonLabel}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
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
    paddingTop: 10,
  },
  content: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.outfitBold,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    color: '#334155',
    fontFamily: FONT_FAMILY.bricolageMedium,
    marginBottom: 6,
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.outfitRegular,
    marginBottom: 10,
  },
  selectInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  selectInputText: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.outfitRegular,
  },
  selectInputPlaceholder: {
    color: '#94A3B8',
  },
  readOnlyInput: {
    backgroundColor: '#EEF2F7',
    color: '#475569',
  },
  emptyImageBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyImageText: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
    fontFamily: FONT_FAMILY.outfitRegular,
  },
  previewImage: {
    width: '100%',
    height: 170,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#E2E8F0',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    borderRadius: 9,
    paddingVertical: 9,
  },
  uploadButtonText: {
    fontSize: 13,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  switchRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  submitButton: {
    backgroundColor: '#0F766E',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  optionModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  optionModalCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
  },
  optionModalTitle: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.outfitBold,
    marginBottom: 10,
  },
  optionLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  optionLoadingText: {
    fontSize: 14,
    color: '#334155',
    fontFamily: FONT_FAMILY.outfitRegular,
  },
  optionList: {
    maxHeight: 320,
  },
  optionItem: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  optionItemSelected: {
    borderColor: '#0F766E',
    backgroundColor: '#ECFDF5',
  },
  optionItemText: {
    fontSize: 14,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  emptyOptionText: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748B',
    fontFamily: FONT_FAMILY.outfitRegular,
  },
  optionCloseButton: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  optionCloseButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.outfitExtraBold,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#475569',
    fontFamily: FONT_FAMILY.outfitRegular,
    lineHeight: 20,
  },
  modalPrimaryButton: {
    marginTop: 18,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryButtonSuccess: {
    backgroundColor: '#0F766E',
  },
  modalPrimaryButtonError: {
    backgroundColor: '#DC2626',
  },
  modalPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONT_FAMILY.outfitBold,
  },
});

export default AddPromotionBannerScreen;
