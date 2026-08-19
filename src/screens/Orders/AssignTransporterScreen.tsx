import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {FONT_FAMILY} from '../../assets/constants/fonts';
import {OrdersNavigationStackParamList} from '../../navigation/OrdersNavigation';
import {useGetPricingConfigQuery} from '../../apis/pricingConfig';
import {useGetDeliveryPartnersWithOrdersQuery} from '../../apis/deliveryPartner';
import {useAssignOrderMutation} from '../../apis/order';

type AssignTransporterScreenProp = RouteProp<
  OrdersNavigationStackParamList,
  'AssignTransporterScreen'
>;

const AssignTransporterScreen = () => {
  const route = useRoute<AssignTransporterScreenProp>();
  const navigation = useNavigation();
  const {order} = route.params;
  const [assigningPartnerId, setAssigningPartnerId] = React.useState(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const {
    data: pricingConfigData,
    refetch: refetchPricingConfig,
    isFetching: isPricingFetching,
  } = useGetPricingConfigQuery(
    order?.shopDetails?.category.toString().toUpperCase(),
    {skip: !order?.shopDetails?.category},
  );
  const {
    data: deliveryPartnersData,
    isLoading,
    isFetching: isPartnersFetching,
    refetch: refetchDeliveryPartners,
  } = useGetDeliveryPartnersWithOrdersQuery({});
  const [assignOrder] = useAssignOrderMutation();

  const pricingKeyMap: Record<string, string> = {
    DELIVERY_FEE: 'deliveryFee',
    PLATFORM_FEE: 'platformFee',
    PACKAGING_CHARGE: 'packagingCharges',
    COMMISSION: 'commissionRate',
    GST: 'gstRate',
  };

  const pricing = pricingConfigData?.reduce(
    (
      acc: Record<string, number>,
      item: {configKey: string; actualValue: number; expectedValue: number},
    ) => {
      const key = pricingKeyMap[item.configKey as keyof typeof pricingKeyMap];

      if (key) {
        acc[`${key}Actual`] = item.actualValue;
        acc[`${key}Expected`] = item.expectedValue;
      }

      return acc;
    },
    {},
  );

  const subTotal = Number(order.amountExcludingDeliveryFee || 0);
  const deliveryFee = pricing?.deliveryFeeActual;
  const platformFee = pricing?.platformFeeActual;
  const packagingCharges = pricing?.packagingChargesActual;
  const commissionRate = pricing?.commissionRateActual;
  const taxableAmount = deliveryFee + platformFee;
  const taxes = Math.round((pricing?.gstRateActual / 100) * taxableAmount);
  const calculatedTotal =
    subTotal + deliveryFee + platformFee + packagingCharges + taxes;

  const parseAddressString = (addr?: string) => {
    if (!addr || typeof addr !== 'string') return '';
    const text = addr.replace(/^{|}$/g, '').trim();
    const parts = text.split(/,\s*/);
    const map: Record<string, string> = {};
    for (const p of parts) {
      const idx = p.indexOf('=');
      if (idx > -1) {
        const key = p.slice(0, idx).trim();
        const val = p.slice(idx + 1).trim();
        map[key] = val;
      }
    }

    const line1 = map.addressLine1 || map.address || '';
    const line2 = map.addressLine2 || '';
    const city = map.city || '';
    const pincode = map.pincode || map.postalCode || '';

    const out = [
      line1,
      line2,
      city && `${city}${pincode ? ' - ' + pincode : ''}`,
    ]
      .filter(Boolean)
      .join(', ');
    return out || addr;
  };

  const formatPlacedTime = (ts?: string) => {
    if (!ts) return '';
    const d = new Date(ts.replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return ts;
    return d.toLocaleString(undefined, {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const compactAddress = parseAddressString(order?.customerAddress);

  const haversineDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const shopLatitude = Number(order?.shopDetails?.coordinates?.latitude);
  const shopLongitude = Number(order?.shopDetails?.coordinates?.longitude);
  const hasValidShopCoords =
    Number.isFinite(shopLatitude) && Number.isFinite(shopLongitude);

  const partnersWithDistance = React.useMemo(() => {
    if (!deliveryPartnersData) return [];

    const filtered = (
      Array.isArray(deliveryPartnersData) ? deliveryPartnersData : []
    )
      .filter((p: any) => p?.deliveryPartner?.isOnline)
      .map((p: any) => {
        const partnerLat = Number(p?.deliveryPartner?.latitude) || 0;
        const partnerLng = Number(p?.deliveryPartner?.longitude) || 0;
        const distance = hasValidShopCoords
          ? haversineDistance(
              shopLatitude,
              shopLongitude,
              partnerLat,
              partnerLng,
            )
          : 999;
        const currentOrdersArray = Array.isArray(p?.currentOrders)
          ? p.currentOrders
          : [];
        return {
          ...p?.deliveryPartner,
          distance,
          currentOrdersCount: currentOrdersArray.length,
        };
      })
      .sort((a: any, b: any) => {
        const aTest = String(a.name || '')
          .toLowerCase()
          .includes('test');
        const bTest = String(b.name || '')
          .toLowerCase()
          .includes('test');
        if (aTest !== bTest) return aTest ? 1 : -1;
        return a.distance - b.distance;
      });

    return filtered;
  }, [deliveryPartnersData, hasValidShopCoords, shopLatitude, shopLongitude]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchDeliveryPartners(),
        order?.shopDetails?.category
          ? refetchPricingConfig()
          : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [
    order?.shopDetails?.category,
    refetchDeliveryPartners,
    refetchPricingConfig,
  ]);

  useFocusEffect(
    React.useCallback(() => {
      refetchDeliveryPartners();
    }, [refetchDeliveryPartners]),
  );

  const handleAssignOrder = async (partnerId: string) => {
    if (!order?.orderId || !partnerId) {
      Alert.alert('Unable to assign', 'Order or partner information missing');
      return;
    }

    setAssigningPartnerId(partnerId as any);
    try {
      await assignOrder({
        orderId: String(order.orderId),
        deliveryPartnerId: partnerId,
      }).unwrap();

      navigation.goBack();
    } catch (error) {
      console.log('Assign order error', error);
      Alert.alert(
        'Assign order failed',
        error instanceof Error ? error.message : 'Please try again',
      );
    } finally {
      setAssigningPartnerId(null);
    }
  };

  const formatMobileNumber = (input?: string | number) => {
    if (input === undefined || input === null) return '';
    const s = String(input);
    const digits = s.replace(/\D/g, '');
    if (!digits) return s;
    const last10 = digits.slice(-10);
    return last10;
  };

  const handleCall = (mobile?: string | number) => {
    const cleaned = formatMobileNumber(mobile);
    const phoneNumber = `tel:${cleaned}`;
    Linking.openURL(phoneNumber).catch(() =>
      Alert.alert('Unable to open dialer'),
    );
  };

  const renderPartnerCard = React.useCallback(
    ({item}: any) => (
      <View style={styles.partnerCard}>
        <View style={styles.partnerHeader}>
          {item.profilePicture ? (
            <Image
              source={{uri: item.profilePicture}}
              style={styles.partnerAvatar}
            />
          ) : (
            <View style={styles.partnerAvatarFallback}>
              <Text style={styles.partnerInitials}>
                {item.name
                  ?.split(' ')
                  .slice(0, 2)
                  .map((n: string) => n[0])
                  .join('')}
              </Text>
            </View>
          )}
          <View style={{flex: 1, marginLeft: 12}}>
            <Text style={styles.partnerName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.name?.includes('Test') && (
              <View style={styles.testWarningContainer}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={16}
                  color="#b91c1c"
                  style={{marginRight: 6}}
                />
                <Text style={styles.testWarningText} numberOfLines={1}>
                  Test Partner
                </Text>
              </View>
            )}
            <Text style={styles.partnerPhone}>
              {String(item.mobileNumber || '')}
            </Text>
            <Text style={styles.partnerAddress} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
          <View style={styles.distanceBadge}>
            <MaterialCommunityIcons
              name="map-marker-distance"
              size={14}
              color="#0f62fe"
            />
            <Text style={styles.distanceText}>
              {item.distance?.toFixed(1) || '0'} Km
            </Text>
          </View>
        </View>

        <View style={styles.partnerMetaRow}>
          <Text style={styles.metaLabel}>
            Orders:{' '}
            <Text style={styles.metaValue}>
              {item?.currentOrdersCount ?? 0}
            </Text>
          </Text>
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.callButtonRow}
              onPress={() => handleCall(item.mobileNumber)}>
              <MaterialCommunityIcons name="phone" size={16} color="#065f46" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.assignButton}
              disabled={assigningPartnerId !== null}
              onPress={() => handleAssignOrder(item.id)}>
              <MaterialCommunityIcons
                name="check-circle"
                size={16}
                color="#fff"
              />
              <Text style={styles.assignButtonText}>
                {assigningPartnerId === item.id
                  ? 'Assigning...'
                  : 'Assign Order'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    ),
    [assigningPartnerId],
  );

  const renderListHeader = React.useMemo(
    () => (
      <>
        <View style={styles.orderCardCompact}>
          <View style={styles.orderHeader}>
            {order?.shopDetails?.logo ? (
              <Image
                source={{uri: order.shopDetails.logo}}
                style={styles.shopLogo}
              />
            ) : null}
            <View style={{flex: 1, marginLeft: 12}}>
              <Text style={styles.orderIdHighlighted} numberOfLines={1}>
                {order?.orderId}
              </Text>
              <Text style={styles.shopNameSmall} numberOfLines={1}>
                {order?.shopDetails?.name || 'Shop'} ·{' '}
                {order?.totalItemCount ?? order?.orderItem?.length ?? 0} items
              </Text>
            </View>
            <View style={styles.stateChip}>
              <Text style={styles.stateChipText}>
                {order?.state || 'UNKNOWN'}
              </Text>
            </View>
          </View>

          <Text
            style={{
              fontFamily: FONT_FAMILY.bricolageBold,
              color: '#475569',
              marginTop: 8,
            }}>
            Customer Name : {order?.customerName}
          </Text>
          <View style={styles.compactRow}>
            <Text style={styles.compactLeft}>
              {compactAddress || order?.customerName}
            </Text>
            <Text style={styles.totalValueCompact}>
              ₹{calculatedTotal?.toFixed?.(2) ?? order?.invoiceAmount}
            </Text>
          </View>

          <View style={styles.compactMetaRow}>
            <Text style={styles.metaText}>
              {formatPlacedTime(order?.creationTime)}
            </Text>
          </View>
        </View>

        {!isLoading && partnersWithDistance.length > 0 && (
          <Text style={styles.partnersHeading}>
            Available Delivery Partners
          </Text>
        )}
      </>
    ),
    [
      calculatedTotal,
      compactAddress,
      isLoading,
      order?.customerName,
      order?.invoiceAmount,
      order?.orderId,
      order?.orderItem?.length,
      order?.shopDetails?.logo,
      order?.shopDetails?.name,
      order?.state,
      order?.totalItemCount,
      order?.creationTime,
      partnersWithDistance.length,
    ],
  );

  return (
    <FlatList
      style={styles.page}
      contentContainerStyle={styles.container}
      data={partnersWithDistance}
      keyExtractor={(item: any) => item.id}
      renderItem={renderPartnerCard}
      ListHeaderComponent={renderListHeader}
      ListEmptyComponent={
        isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#0f62fe" />
            <Text style={styles.loadingText}>Loading delivery partners...</Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No delivery partners available</Text>
          </View>
        )
      }
      refreshing={refreshing || isPartnersFetching || isPricingFetching}
      onRefresh={onRefresh}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
      removeClippedSubviews
      keyboardShouldPersistTaps="handled"
    />
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f4f6fb',
  },
  container: {
    padding: 16,
    paddingBottom: 28,
  },
  orderCardCompact: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e6edf6',
    marginBottom: 12,
  },
  orderIdHighlighted: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.outfitBold,
    color: '#0f172a',
  },
  shopNameSmall: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  stateChip: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stateChipText: {
    color: '#0b6cff',
    fontSize: 12,
    fontFamily: FONT_FAMILY.outfitBold,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  compactLeft: {
    flex: 1,
    color: '#475569',
    fontFamily: FONT_FAMILY.bricolageMedium,
    fontSize: 13,
  },
  totalValueCompact: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.outfitBold,
    color: '#0f172a',
    marginLeft: 12,
  },
  compactMetaRow: {
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e6edf6',
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  shopName: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bricolageBold,
    color: '#0f172a',
  },
  orderId: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  stateLabel: {
    fontSize: 12,
    color: '#0b6cff',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#334155',
    fontFamily: FONT_FAMILY.bricolageBold,
    marginBottom: 6,
  },
  customerName: {
    fontSize: 14,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.bricolageBold,
  },
  customerMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  customerAddress: {
    fontSize: 12,
    color: '#475569',
    marginTop: 6,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemCount: {
    width: 30,
    color: '#64748b',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  itemName: {
    flex: 1,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  totalRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  totalValue: {
    fontSize: 16,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  partnersHeading: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bricolageBold,
    color: '#0f172a',
    marginBottom: 12,
    marginTop: 8,
  },
  loadingContainer: {
    marginTop: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6edf6',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748b',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  emptyContainer: {
    marginTop: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6edf6',
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  partnerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e6edf6',
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  partnerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  partnerAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerInitials: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.outfitBold,
    color: '#0f172a',
  },
  partnerName: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bricolageBold,
    color: '#0f172a',
  },
  partnerPhone: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  partnerAddress: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  distanceBadge: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.outfitBold,
    color: '#0f62fe',
  },
  partnerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  metaValue: {
    fontFamily: FONT_FAMILY.outfitBold,
    color: '#0f172a',
  },
  assignButton: {
    backgroundColor: '#0f62fe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  callButtonRow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ecfeff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: FONT_FAMILY.outfitBold,
  },
  testWarningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: '#fff1f2',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  testWarningText: {
    color: '#b91c1c',
    fontSize: 12,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
});

export default AssignTransporterScreen;
