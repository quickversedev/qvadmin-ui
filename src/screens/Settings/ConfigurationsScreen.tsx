import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {SettingsNavigationStackParamList} from '../../navigation/SettingsNavigation';
import {
  createPricingConfiguration,
  fetchPricingConfigurations,
  PricingConfig,
  ServiceType,
  updatePricingConfiguration,
} from '../../services/apis/pricingConfigService';
import {useAuth} from '../../contexts/Login/AuthProvider';
import {SafeAreaView} from 'react-native-safe-area-context'; // Add this import
import {FONT_FAMILY} from '../../assets/constants/fonts';

type Props = StackScreenProps<
  SettingsNavigationStackParamList,
  'Configurations'
>;

type ConfigModel = {
  serviceType: ServiceType;
  fees: {
    platformFee: {actual: number; expected: number};
    deliveryFee: {actual: number; expected: number};
    packagingCharge: {actual: number; expected: number};
  };
  charges: {
    commissionPercent: number;
    gstPercent: number;
  };
};

type FeeKey = keyof ConfigModel['fees'];

const defaultConfigByType: Record<ServiceType, ConfigModel> = {
  FOOD: {
    serviceType: 'FOOD',
    fees: {
      platformFee: {actual: 0, expected: 0},
      deliveryFee: {actual: 0, expected: 0},
      packagingCharge: {actual: 0, expected: 0},
    },
    charges: {
      commissionPercent: 0,
      gstPercent: 0,
    },
  },
  GROCERY: {
    serviceType: 'GROCERY',
    fees: {
      platformFee: {actual: 0, expected: 0},
      deliveryFee: {actual: 0, expected: 0},
      packagingCharge: {actual: 0, expected: 0},
    },
    charges: {
      commissionPercent: 0,
      gstPercent: 0,
    },
  },
};

const feeKeyToConfigCandidates: Record<FeeKey, string[]> = {
  platformFee: ['PLATFORM_FEE'],
  deliveryFee: ['DELIVERY_CHARGE', 'DELIVERY_FEE'],
  packagingCharge: ['PACKAGING_CHARGE', 'PACKAGING_FEE'],
};

const chargeKeyCandidates = {
  commissionPercent: ['COMMISSION', 'COMMISSION_PERCENT'],
  gstPercent: ['GST', 'SERVICE_TAX', 'GST_PERCENT'],
};

const findByCandidates = (configs: PricingConfig[], candidates: string[]) => {
  const upperCandidates = candidates.map(item => item.toUpperCase());
  return configs.find(item =>
    upperCandidates.includes(String(item.configKey).toUpperCase()),
  );
};

const mapApiToModel = (
  serviceType: ServiceType,
  configs: PricingConfig[],
): ConfigModel => {
  const platform = findByCandidates(
    configs,
    feeKeyToConfigCandidates.platformFee,
  );
  const delivery = findByCandidates(
    configs,
    feeKeyToConfigCandidates.deliveryFee,
  );
  const packaging = findByCandidates(
    configs,
    feeKeyToConfigCandidates.packagingCharge,
  );
  const commission = findByCandidates(
    configs,
    chargeKeyCandidates.commissionPercent,
  );
  const gst = findByCandidates(configs, chargeKeyCandidates.gstPercent);

  return {
    serviceType,
    fees: {
      platformFee: {
        actual: Number(platform?.actualValue ?? 0),
        expected: Number(platform?.expectedValue ?? 0),
      },
      deliveryFee: {
        actual: Number(delivery?.actualValue ?? 0),
        expected: Number(delivery?.expectedValue ?? 0),
      },
      packagingCharge: {
        actual: Number(packaging?.actualValue ?? 0),
        expected: Number(packaging?.expectedValue ?? 0),
      },
    },
    charges: {
      commissionPercent: Number(commission?.actualValue ?? 0),
      gstPercent: Number(gst?.actualValue ?? 0),
    },
  };
};

const ConfigurationsScreen: React.FC<Props> = ({navigation}) => {
  const {authData} = useAuth();
  const [serviceType, setServiceType] = useState<ServiceType>('FOOD');
  const [apiConfigsByType, setApiConfigsByType] = useState<
    Record<ServiceType, PricingConfig[]>
  >({
    FOOD: [],
    GROCERY: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editingFeeKey, setEditingFeeKey] = useState<FeeKey | null>(null);
  const [isEditingCharges, setIsEditingCharges] = useState(false);
  const [feeDraft, setFeeDraft] = useState({expected: '', actual: ''});
  const [chargesDraft, setChargesDraft] = useState({
    commissionPercent: '',
    gstPercent: '',
  });

  const config = useMemo(() => {
    const list = apiConfigsByType[serviceType] || [];
    if (!list.length) {
      return defaultConfigByType[serviceType];
    }
    return mapApiToModel(serviceType, list);
  }, [apiConfigsByType, serviceType]);

  const feeCards = [
    {label: 'Platform Fee', key: 'platformFee' as const},
    {label: 'Delivery Fee', key: 'deliveryFee' as const},
    {label: 'Packaging Charge', key: 'packagingCharge' as const},
  ];

  const loadConfigurations = async (type: ServiceType) => {
    setIsLoading(true);
    try {
      const configs = await fetchPricingConfigurations(type);
      console.log(configs);
      setApiConfigsByType(prev => ({...prev, [type]: configs || []}));
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'Failed to fetch pricing configurations',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfigurations(serviceType);
  }, [serviceType]);

  const mergeUpdatedConfig = (updated: PricingConfig) => {
    setApiConfigsByType(prev => {
      const current = prev[serviceType] || [];
      const foundById = current.findIndex(
        item => item.id && item.id === updated.id,
      );

      if (foundById >= 0) {
        const cloned = [...current];
        cloned[foundById] = updated;
        return {...prev, [serviceType]: cloned};
      }

      const foundByKey = current.findIndex(
        item =>
          String(item.configKey).toUpperCase() ===
          String(updated.configKey).toUpperCase(),
      );

      if (foundByKey >= 0) {
        const cloned = [...current];
        cloned[foundByKey] = updated;
        return {...prev, [serviceType]: cloned};
      }

      return {...prev, [serviceType]: [...current, updated]};
    });
  };

  const upsertConfig = async (
    configKeyCandidates: string[],
    actualValue: number,
    expectedValue: number,
  ) => {
    const current = apiConfigsByType[serviceType] || [];
    const existing = findByCandidates(current, configKeyCandidates);

    const payload = {
      serviceType,
      configKey: (existing?.configKey || configKeyCandidates[0]) as any,
      actualValue,
      expectedValue,
      isActive: existing?.isActive ?? true,
    };

    if (existing?.id) {
      const updated = await updatePricingConfiguration(
        existing.id,
        payload,
        authData?.jwt,
      );
      mergeUpdatedConfig(updated);
      return;
    }

    const created = await createPricingConfiguration(payload, authData?.jwt);
    mergeUpdatedConfig(created);
  };

  const startEditFee = (feeKey: FeeKey) => {
    const fee = config.fees[feeKey];
    setEditingFeeKey(feeKey);
    setFeeDraft({expected: String(fee.expected), actual: String(fee.actual)});
  };

  const cancelEditFee = () => {
    setEditingFeeKey(null);
    setFeeDraft({expected: '', actual: ''});
  };

  const saveFee = async (feeKey: FeeKey) => {
    const expected = Number(feeDraft.expected);
    const actual = Number(feeDraft.actual);

    if (Number.isNaN(expected) || Number.isNaN(actual)) {
      Alert.alert('Invalid Input', 'Please enter valid numeric values.');
      return;
    }

    setIsSaving(true);
    try {
      await upsertConfig(feeKeyToConfigCandidates[feeKey], actual, expected);
      cancelEditFee();
    } catch (error: any) {
      Alert.alert(
        'Update Failed',
        error?.message || 'Failed to update fee configuration',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const startEditCharges = () => {
    setIsEditingCharges(true);
    setChargesDraft({
      commissionPercent: String(config.charges.commissionPercent),
      gstPercent: String(config.charges.gstPercent),
    });
  };

  const cancelEditCharges = () => {
    setIsEditingCharges(false);
    setChargesDraft({commissionPercent: '', gstPercent: ''});
  };

  const saveCharges = async () => {
    const commissionPercent = Number(chargesDraft.commissionPercent);
    const gstPercent = Number(chargesDraft.gstPercent);

    if (Number.isNaN(commissionPercent) || Number.isNaN(gstPercent)) {
      Alert.alert('Invalid Input', 'Please enter valid numeric values.');
      return;
    }

    const current = apiConfigsByType[serviceType] || [];
    const commissionConfig = findByCandidates(
      current,
      chargeKeyCandidates.commissionPercent,
    );
    const gstConfig = findByCandidates(current, chargeKeyCandidates.gstPercent);

    setIsSaving(true);
    try {
      await Promise.all([
        upsertConfig(
          chargeKeyCandidates.commissionPercent,
          commissionPercent,
          Number(commissionConfig?.expectedValue ?? commissionPercent),
        ),
        upsertConfig(
          chargeKeyCandidates.gstPercent,
          gstPercent,
          Number(gstConfig?.expectedValue ?? gstPercent),
        ),
      ]);
      cancelEditCharges();
    } catch (error: any) {
      Alert.alert(
        'Update Failed',
        error?.message || 'Failed to update charges',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const onSelectServiceType = (type: ServiceType) => {
    setServiceType(type);
    cancelEditFee();
    cancelEditCharges();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#0F766E" />
            <Text style={styles.loaderText}>Loading configurations...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionLabel}>Service Type</Text>
            <View style={styles.typeRow}>
              {(['FOOD', 'GROCERY'] as const).map(type => {
                const active = serviceType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typePill, active && styles.typePillActive]}
                    onPress={() => onSelectServiceType(type)}>
                    <Text
                      style={[
                        styles.typePillText,
                        active && styles.typePillTextActive,
                      ]}>
                      {type === 'FOOD' ? 'Food' : 'Grocery'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Fees</Text>
            {feeCards.map(fee => {
              const item = config.fees[fee.key];
              const isEditing = editingFeeKey === fee.key;
              return (
                <View key={fee.key} style={styles.card}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{fee.label}</Text>
                    {!isEditing ? (
                      <TouchableOpacity
                        onPress={() => startEditFee(fee.key)}
                        style={styles.editIconButton}>
                        <MaterialCommunityIcons
                          name="pencil-outline"
                          size={18}
                          color="#0F766E"
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <View style={styles.feeValuesRow}>
                    <View style={styles.valueBoxMuted}>
                      <Text style={styles.valueLabel}>Expected</Text>
                      {isEditing ? (
                        <TextInput
                          value={feeDraft.expected}
                          onChangeText={value =>
                            setFeeDraft(prev => ({...prev, expected: value}))
                          }
                          style={styles.input}
                          keyboardType="decimal-pad"
                          placeholder="Expected"
                          placeholderTextColor="#94A3B8"
                        />
                      ) : (
                        <Text style={styles.expectedValue}>
                          Rs {item.expected}
                        </Text>
                      )}
                    </View>
                    <View style={styles.valueBoxActive}>
                      <Text style={styles.valueLabelActive}>Actual</Text>
                      {isEditing ? (
                        <TextInput
                          value={feeDraft.actual}
                          onChangeText={value =>
                            setFeeDraft(prev => ({...prev, actual: value}))
                          }
                          style={[styles.input, styles.inputActive]}
                          keyboardType="decimal-pad"
                          placeholder="Actual"
                          placeholderTextColor="#7C8A97"
                        />
                      ) : (
                        <Text style={styles.actualValue}>Rs {item.actual}</Text>
                      )}
                    </View>
                  </View>
                  {isEditing ? (
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={cancelEditFee}
                        disabled={isSaving}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.saveBtn, isSaving && styles.disabledBtn]}
                        onPress={() => saveFee(fee.key)}
                        disabled={isSaving}>
                        <Text style={styles.saveBtnText}>
                          {isSaving ? 'Saving...' : 'Save'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                  <Text style={styles.hintText}>
                    Expected shows with line-through in customer app, actual is
                    charged.
                  </Text>
                </View>
              );
            })}

            <Text style={styles.sectionLabel}>Charges</Text>
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>Charges</Text>
                {!isEditingCharges ? (
                  <TouchableOpacity
                    onPress={startEditCharges}
                    style={styles.editIconButton}>
                    <MaterialCommunityIcons
                      name="pencil-outline"
                      size={18}
                      color="#0F766E"
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.rowLabel}>Commission</Text>
                {isEditingCharges ? (
                  <TextInput
                    value={chargesDraft.commissionPercent}
                    onChangeText={value =>
                      setChargesDraft(prev => ({
                        ...prev,
                        commissionPercent: value,
                      }))
                    }
                    style={styles.smallInput}
                    keyboardType="decimal-pad"
                    placeholder="0"
                  />
                ) : (
                  <Text style={styles.rowValue}>
                    {config.charges.commissionPercent}%
                  </Text>
                )}
              </View>
              <View style={styles.rowDivider} />
              <View style={styles.rowBetween}>
                <Text style={styles.rowLabel}>GST</Text>
                {isEditingCharges ? (
                  <TextInput
                    value={chargesDraft.gstPercent}
                    onChangeText={value =>
                      setChargesDraft(prev => ({...prev, gstPercent: value}))
                    }
                    style={styles.smallInput}
                    keyboardType="decimal-pad"
                    placeholder="0"
                  />
                ) : (
                  <Text style={styles.rowValue}>
                    {config.charges.gstPercent}%
                  </Text>
                )}
              </View>
              {isEditingCharges ? (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={cancelEditCharges}
                    disabled={isSaving}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, isSaving && styles.disabledBtn]}
                    onPress={saveCharges}
                    disabled={isSaving}>
                    <Text style={styles.saveBtnText}>
                      {isSaving ? 'Saving...' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </ScrollView>
        )}
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
    paddingTop: 8,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 10,
    color: '#334155',
    fontSize: 14,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.outfitBold,
    color: '#334155',
    marginBottom: 8,
    marginTop: 6,
  },
  typeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  typePill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    marginRight: 10,
  },
  typePillActive: {
    borderColor: '#0F766E',
    backgroundColor: '#0F766E',
  },
  typePillText: {
    color: '#334155',
    fontSize: 13,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  typePillTextActive: {
    color: '#FFFFFF',
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.outfitBold,
    color: '#0F172A',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  editIconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFEFF',
  },
  feeValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  valueBoxMuted: {
    width: '48%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    padding: 10,
  },
  valueBoxActive: {
    width: '48%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#99F6E4',
    backgroundColor: '#ECFEFF',
    padding: 10,
  },
  valueLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  valueLabelActive: {
    fontSize: 12,
    color: '#0F766E',
    marginBottom: 4,
  },
  expectedValue: {
    fontSize: 16,
    color: '#64748B',
    textDecorationLine: 'line-through',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  actualValue: {
    fontSize: 18,
    color: '#115E59',
    fontFamily: FONT_FAMILY.outfitExtraBold,
  },
  hintText: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    paddingHorizontal: 10,
    color: '#0F172A',
    fontSize: 14,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  inputActive: {
    borderColor: '#2DD4BF',
  },
  smallInput: {
    minWidth: 72,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    textAlign: 'right',
    color: '#0F172A',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  rowLabel: {
    fontSize: 14,
    color: '#334155',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  rowValue: {
    fontSize: 15,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  cancelBtnText: {
    color: '#334155',
    fontFamily: FONT_FAMILY.outfitBold,
    fontSize: 13,
  },
  saveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#0F766E',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY.outfitBold,
    fontSize: 13,
  },
  disabledBtn: {
    opacity: 0.7,
  },
});

export default ConfigurationsScreen;
