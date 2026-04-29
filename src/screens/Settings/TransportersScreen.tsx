import React, {useEffect} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useAuth} from '../../contexts/Login/AuthProvider';
import {SettingsStackParamList} from '../../navigation/SettingsNavigation';
import {
  DeliveryPartner,
  getDeliveryPartnerId,
  getDeliveryPartnerName,
} from '../../services/apis/deliveryPartnerService';
import {useDeliveryPartnerStore} from '../../store/deliveryPartners/useDeliveryPartnerStore';
import {FONT_FAMILY} from '../../assets/constants/fonts';

type Props = StackScreenProps<SettingsStackParamList, 'Transporters'>;

const defaultFilter = {
  isDeleted: false,
  Order: 'asc' as const,
  order_by: 'createdAt',
};

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as {message?: string}).message;
    if (message) {
      return message;
    }
  }

  return 'Unable to load delivery partners';
};

const getDisplayMobileNumber = (value?: string) => {
  if (!value) {
    return 'No mobile number';
  }

  const digits = String(value).replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) {
    return digits.slice(2, 12);
  }

  return digits || 'No mobile number';
};

const TransportersScreen: React.FC<Props> = ({navigation}) => {
  const {authData} = useAuth();
  const {partners, loading, error, fetchPartners, removePartner} =
    useDeliveryPartnerStore();

  useEffect(() => {
    const refreshPartners = async () => {
      try {
        await fetchPartners(defaultFilter, authData?.jwt);
      } catch (loadError) {
        console.log('Failed to load delivery partners', loadError);
      }
    };

    const unsubscribe = navigation.addListener('focus', () => {
      refreshPartners();
    });

    refreshPartners();

    return unsubscribe;
  }, [authData?.jwt, fetchPartners, navigation]);

  const handleEdit = (partner: DeliveryPartner) => {
    const partnerId = getDeliveryPartnerId(partner);
    if (!partnerId) {
      Alert.alert('Error', 'This partner does not have a valid ID yet');
      return;
    }

    navigation.navigate('AddTransporter', {transporterId: partnerId});
  };

  const handleDelete = (partner: DeliveryPartner) => {
    const partnerId = getDeliveryPartnerId(partner);
    if (!partnerId) {
      Alert.alert('Error', 'This partner does not have a valid ID yet');
      return;
    }

    Alert.alert(
      'Delete Delivery Partner',
      `Are you sure you wanna delete ${getDeliveryPartnerName(partner)}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removePartner(partnerId, authData?.jwt);
            } catch (deleteError) {
              Alert.alert('Error', getErrorMessage(deleteError));
            }
          },
        },
      ],
    );
  };

  const renderItem = ({item}: {item: DeliveryPartner}) => {
    const partnerName = getDeliveryPartnerName(item);
    const partnerId = getDeliveryPartnerId(item);

    return (
      <TouchableOpacity
        style={styles.transporterCard}
        activeOpacity={0.85}
        onPress={() => handleEdit(item)}>
        <View style={styles.avatarWrap}>
          {item?.profilePicture ? (
            <Image
              source={{uri: item?.profilePicture}}
              style={{
                height: '100%',
                width: '100%',
                overflow: 'hidden',
                borderRadius: 22,
              }}
              resizeMode="contain"
            />
          ) : (
            <MaterialCommunityIcons
              name="account-tie"
              size={22}
              color="#0F766E"
            />
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.transporterName} numberOfLines={1}>
              {partnerName}
            </Text>
            {item.gender ? (
              <Text style={styles.badge}>{item.gender}</Text>
            ) : null}
          </View>

          <Text style={styles.transporterMeta} numberOfLines={1}>
            {getDisplayMobileNumber(item.mobileNumber)}
          </Text>
          <Text style={styles.transporterMeta} numberOfLines={2}>
            {item.address || 'No address available'}
          </Text>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEdit(item)}>
              <MaterialCommunityIcons name="pencil" size={16} color="#0F766E" />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteActionButton]}
              onPress={() => handleDelete(item)}>
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={16}
                color="#DC2626"
              />
              <Text style={[styles.actionText, styles.deleteActionText]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
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
          <Text style={styles.title}>Delivery Partners</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddTransporter')}>
            <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={18}
              color="#DC2626"
            />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        <FlatList
          data={partners}
          keyExtractor={(item, index) =>
            getDeliveryPartnerId(item) || String(index)
          }
          contentContainerStyle={[
            styles.listContent,
            !partners.length && styles.emptyListContent,
          ]}
          renderItem={renderItem}
          ListEmptyComponent={
            loading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color="#0F766E" />
                <Text style={styles.loadingText}>Loading partners...</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="truck-fast-outline"
                  size={42}
                  color="#94A3B8"
                />
                <Text style={styles.emptyTitle}>No delivery partners yet</Text>
                <Text style={styles.emptyText}>
                  Add a partner to manage their documents and profile details.
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('AddTransporter')}>
                  <Text style={styles.emptyButtonText}>Add Partner</Text>
                </TouchableOpacity>
              </View>
            )
          }
        />
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
  title: {
    fontSize: 20,
    fontFamily: FONT_FAMILY.outfitBold,
    color: '#0F172A',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addText: {
    marginLeft: 4,
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY.outfitBold,
    fontSize: 14,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    marginLeft: 8,
    color: '#991B1B',
    fontSize: 13,
    fontFamily: FONT_FAMILY.bricolageMedium,
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  transporterCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  transporterName: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONT_FAMILY.outfitBold,
    color: '#0F172A',
    marginRight: 10,
  },
  badge: {
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
    color: '#166534',
    fontSize: 11,
    fontFamily: FONT_FAMILY.outfitBold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  transporterMeta: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 6,
  },
  deleteActionButton: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  actionText: {
    marginLeft: 4,
    color: '#0F766E',
    fontSize: 12,
    fontFamily: FONT_FAMILY.outfitBold,
  },
  deleteActionText: {
    color: '#DC2626',
  },
  idText: {
    width: '100%',
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: FONT_FAMILY.bricolageMedium,
    marginTop: 2,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 70,
  },
  loadingText: {
    marginTop: 10,
    color: '#475569',
    fontSize: 14,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontFamily: FONT_FAMILY.outfitExtraBold,
    color: '#0F172A',
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 16,
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY.outfitBold,
    fontSize: 14,
  },
});

export default TransportersScreen;
