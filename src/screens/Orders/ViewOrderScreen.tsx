import React from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {RouteProp, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  convertUTCToIST,
  formatTime,
  openMap,
  parseAddress,
} from '../../utils/orderUtils';
import {FONT_FAMILY} from '../../assets/constants/fonts';
import {OrdersNavigationStackParamList} from '../../navigation/OrdersNavigation';
import {useGetOrderByIdQuery} from '../../apis/order';
import {useGetPricingConfigQuery} from '../../apis/pricingConfig';

type ViewOrderScreenProp = RouteProp<
  OrdersNavigationStackParamList,
  'ViewOrderScreen'
>;

const formatMobile = (
  customerMobile: string | number | null | undefined,
): string => {
  if (!customerMobile) return '';

  const mobile = String(customerMobile).trim();

  // Case: starts with 91 and length is 12
  if (mobile.length === 12 && mobile.startsWith('91')) {
    return mobile.slice(2);
  }

  return mobile;
};

const ViewOrderScreen = () => {
  const route = useRoute<ViewOrderScreenProp>();
  const {orderId} = route.params;

  const {
    data: orderData,
    error,
    isLoading,
    refetch: loadOrder,
  } = useGetOrderByIdQuery(orderId, {skip: !orderId});

  const {data: pricingConfigData} = useGetPricingConfigQuery(
    orderData?.response?.shop?.category.toString().toUpperCase(),
    {skip: !orderData?.response?.shop?.category},
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#f04d7d" />
        <Text style={styles.subtitle}>Fetching order details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Could not load order</Text>
        <Text style={styles.errorMessage}>{'An unknown error occurred'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadOrder}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!orderData?.response?.order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Order not found</Text>
        <Text style={styles.errorMessage}>
          No order found for ID: {orderData?.response?.order?.orderId}
        </Text>
      </View>
    );
  }

  const customerAddress = parseAddress(
    orderData?.response?.order.customerAddress || '',
  );

  const handleCallCustomer = () => {
    if (!orderData?.response?.order.customerMobile) {
      return;
    }

    Linking.openURL(
      `tel:${formatMobile(orderData?.response?.order.customerMobile)}`,
    ).catch(err => {
      console.error('Failed to open dialer:', err);
    });
  };

  const handleOpenDirections = () => {
    const lat = customerAddress?.latitude;
    const lng = customerAddress?.longitude;

    if (!lat || !lng) {
      return;
    }

    openMap({
      lat: Number(lat),
      lng: Number(lng),
      label: `${
        orderData?.response?.order.customerName || 'Customer'
      } Location`,
    });
  };

  const handleCallShop = () => {
    const shopPhone = orderData?.response?.shop?.phone;
    if (!shopPhone) {
      return;
    }

    Linking.openURL(`tel:${formatMobile(shopPhone)}`).catch(err => {
      console.error('Failed to open shop dialer:', err);
    });
  };

  const handleOpenShopDirections = () => {
    const shopAddressLabel =
      orderData?.response?.shop?.address?.address ||
      orderData?.response?.shop?.name ||
      'Shop Location';

    const encodedLabel = encodeURIComponent(shopAddressLabel);
    const scheme = Platform.select({
      ios: `maps://?q=${encodedLabel}`,
      android: `geo:0,0?q=${encodedLabel}`,
    });

    if (!scheme) {
      return;
    }

    Linking.openURL(scheme).catch(err => {
      console.error('Failed to open shop directions:', err);
    });
  };

  const pricingKeyMap: Record<string, string> = {
    DELIVERY_FEE: 'deliveryFee',
    PLATFORM_FEE: 'platformFee',
    PACKAGING_CHARGE: 'packagingCharges',
    COMMISSION: 'commissionRate',
    GST: 'gstRate',
  };

  // `finance` is the new, authoritative source for order money math.
  // When the backend sends it, use it directly. Otherwise fall back to the
  // old pricing-config-derived calculation for backward compatibility.
  const financeData = orderData?.response?.order?.finance;

  let subTotalAmount: number;
  let deliveryFee: number;
  let deliveryFeeOriginal: number | undefined;
  let platformFee: number;
  let platformFeeOriginal: number | undefined;
  let packagingCharges: number;
  let packagingChargesOriginal: number | undefined;
  let taxes: number;
  let totalAmount: number;
  let couponDiscount = 0;
  let couponCode: string | null = null;
  let codCharges = 0;

  if (financeData) {
    subTotalAmount = Number(financeData.itemTotalAmount || 0);
    deliveryFee = Number(financeData.deliveryFee || 0);
    // Only show a strikethrough "original" delivery fee when it was actually
    // discounted away (e.g. free delivery), otherwise there's nothing to
    // cross out.
    deliveryFeeOriginal =
      financeData.isFreeDelivery &&
      Number(financeData.actualDeliveryFee || 0) !== deliveryFee
        ? Number(financeData.actualDeliveryFee || 0)
        : undefined;
    platformFee = Number(financeData.platformFee || 0);
    platformFeeOriginal = undefined;
    packagingCharges = Number(financeData.packagingCharges || 0);
    packagingChargesOriginal = undefined;
    taxes = Number(financeData.totalGst || 0);
    totalAmount = Number(financeData.payableAmount || 0);
    couponDiscount = Number(financeData.couponDiscount || 0);
    couponCode = financeData.couponCode || null;
    codCharges = Number(financeData.codCharges || 0);
  } else {
    // Legacy fee calculation matching client app logic
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

    subTotalAmount = Number(
      orderData?.response?.order.amountExcludingDeliveryFee || 0,
    );
    deliveryFee = pricing?.deliveryFeeActual;
    deliveryFeeOriginal = pricing?.deliveryFeeExpected;
    platformFee = pricing?.platformFeeActual;
    platformFeeOriginal = pricing?.platformFeeExpected;
    packagingCharges = pricing?.packagingChargesActual;
    packagingChargesOriginal = pricing?.packagingChargesExpected;
    const taxableAmount = deliveryFee + platformFee;
    taxes = Math.round((pricing?.gstRateActual / 100) * taxableAmount);
    totalAmount =
      subTotalAmount + deliveryFee + platformFee + packagingCharges + taxes;
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <View>
          <Text style={styles.orderId}>
            #{orderData?.response?.order.orderId}
          </Text>
          <Text style={styles.orderTime}>
            {formatTime(orderData?.response?.order.creationTime)}
          </Text>
        </View>
        <View style={styles.statusChip}>
          <Text style={styles.statusChipText}>
            {orderData?.response?.order.state}
          </Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          Items ({orderData?.response?.order.totalItemCount})
        </Text>
        {orderData?.response?.order.orderItem?.length ? (
          orderData?.response?.order.orderItem.map((item: any) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQty}>x {item.itemCount}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No item details available.</Text>
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Customer</Text>
        <View style={styles.customerHeaderRow}>
          <Text style={styles.customerName}>
            {orderData?.response?.order.customerName || 'N/A'}
          </Text>
          <TouchableOpacity
            style={styles.inlineButton}
            onPress={handleCallCustomer}>
            <Icon name="phone" size={16} color="#0057A0" />
            <Text style={styles.inlineButtonText}>Call</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtleText}>
          {formatMobile(orderData?.response?.order.customerMobile)}
        </Text>
      </View>

      {!!orderData?.response?.shop && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Shop Details</Text>
          {!!(
            orderData?.response?.shop.banner || orderData?.response?.shop.logo
          ) && (
            <Image
              source={{
                uri:
                  orderData?.response?.shop.banner ||
                  orderData?.response?.shop.logo,
              }}
              style={styles.shopImage}
              resizeMode="cover"
            />
          )}
          <Text style={styles.customerName}>
            {orderData?.response?.shop.name || 'N/A'}
          </Text>

          {!!orderData?.response?.shop.owner && (
            <Text style={styles.subtleText}>
              Owner: {orderData?.response?.shop.owner}
            </Text>
          )}
          {!!orderData?.response?.shop.phone && (
            <Text style={styles.subtleText}>
              Phone: {formatMobile(orderData?.response?.shop.phone)}
            </Text>
          )}

          <View style={styles.shopMetaRow}>
            {!!orderData?.response?.shop.category && (
              <Text style={styles.metaChip}>
                {orderData?.response?.shop.category}
              </Text>
            )}
            {!!orderData?.response?.shop.preparationTime && (
              <Text style={styles.metaChip}>
                Prep: {orderData?.response?.shop.preparationTime}
              </Text>
            )}
          </View>

          <View style={styles.shopActionRow}>
            {!!orderData?.response?.shop.phone && (
              <TouchableOpacity
                style={styles.inlineButton}
                onPress={handleCallShop}>
                <Icon name="phone" size={16} color="#0057A0" />
                <Text style={styles.inlineButtonText}>Call Shop</Text>
              </TouchableOpacity>
            )}
            {!!(
              orderData?.response?.shop.address?.address ||
              orderData?.response?.shop.name
            ) && (
              <TouchableOpacity
                style={[styles.inlineButton, styles.shopDirectionButton]}
                onPress={handleOpenShopDirections}>
                <Icon name="map-marker-path" size={16} color="#0057A0" />
                <Text style={styles.inlineButtonText}>Directions</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.addressText}>
            {orderData?.response?.shop.openingTime || '--'} -{' '}
            {orderData?.response?.shop.closingTime || '--'}
          </Text>

          {!!orderData?.response?.shop.description && (
            <Text style={styles.subtleText}>
              {orderData?.response?.shop.description}
            </Text>
          )}

          {!!orderData?.response?.shop.address?.address && (
            <Text style={styles.addressText}>
              {orderData?.response?.shop.address.address}
            </Text>
          )}
        </View>
      )}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <Text style={styles.addressText}>
          {customerAddress?.addressLine1 || '--'}
        </Text>
        {!!customerAddress?.addressLine2 && (
          <Text style={styles.addressText}>
            {customerAddress?.addressLine2}
          </Text>
        )}
        <Text style={styles.addressText}>
          {[
            customerAddress?.city,
            customerAddress?.state,
            customerAddress?.pincode,
          ]
            .filter(Boolean)
            .join(', ') || '--'}
        </Text>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={handleOpenDirections}>
          <Text style={styles.linkButtonText}>Get Directions</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Bill</Text>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Sub Total</Text>
          <Text style={styles.billValue}>₹{subTotalAmount?.toFixed(2)}</Text>
        </View>

        {!!couponDiscount && (
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>
              Coupon Discount{couponCode ? ` (${couponCode})` : ''}
            </Text>
            <Text style={styles.billValue}>-₹{couponDiscount?.toFixed(2)}</Text>
          </View>
        )}

        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Delivery Fee</Text>
          <View style={styles.billAmountRow}>
            {deliveryFeeOriginal !== undefined &&
              deliveryFeeOriginal !== deliveryFee && (
                <Text style={styles.strikethroughAmount}>
                  ₹{deliveryFeeOriginal?.toFixed(2)}
                </Text>
              )}
            <Text style={styles.billValue}>₹{deliveryFee?.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Platform Fee</Text>
          <View style={styles.billAmountRow}>
            {platformFeeOriginal !== undefined &&
              platformFeeOriginal !== platformFee && (
                <Text style={styles.strikethroughAmount}>
                  ₹{platformFeeOriginal?.toFixed(2)}
                </Text>
              )}
            <Text style={styles.billValue}>₹{platformFee?.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Packaging Charges</Text>
          <View style={styles.billAmountRow}>
            {packagingChargesOriginal !== undefined &&
              packagingChargesOriginal !== packagingCharges && (
                <Text style={styles.strikethroughAmount}>
                  ₹{packagingChargesOriginal}
                </Text>
              )}
            <Text style={styles.billValue}>
              ₹{packagingCharges?.toFixed(2)}
            </Text>
          </View>
        </View>

        {!!codCharges && (
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>COD Charges</Text>
            <Text style={styles.billValue}>₹{codCharges?.toFixed(2)}</Text>
          </View>
        )}

        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Taxes (GST & Services)</Text>
          <Text style={styles.billValue}>₹{taxes?.toFixed(2)}</Text>
        </View>

        <View style={styles.billDivider} />
        <View style={styles.billRow}>
          <Text style={styles.billTotalLabel}>Total Pay</Text>
          <Text style={styles.billTotalValue}>₹{totalAmount?.toFixed(2)}</Text>
        </View>
        <View style={[styles.billRow, styles.paymentRow]}>
          <Text style={styles.billLabel}>Payment Method</Text>
          <Text style={styles.paymentChip}>
            {orderData?.response?.order?.finance?.paymentMethod ||
              orderData?.response?.order.paymentMethod ||
              'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Order Timeline</Text>

        <View style={styles.timelineRow}>
          <Icon
            name="clock-outline"
            size={18}
            color="#0057A0"
            style={styles.timelineIcon}
          />
          <View>
            <Text style={styles.timelineLabel}>Order Created</Text>
            <Text style={styles.timelineValue}>
              {convertUTCToIST(orderData?.response?.order.creationTime)}
            </Text>
          </View>
        </View>

        {!!orderData?.response?.order.acceptedDate && (
          <View style={styles.timelineRow}>
            <Icon
              name="check-circle-outline"
              size={18}
              color="#2E7D32"
              style={styles.timelineIcon}
            />
            <View>
              <Text style={styles.timelineLabel}>Order Accepted</Text>
              <Text style={styles.timelineValue}>
                {convertUTCToIST(orderData?.response?.order.acceptedDate)}
              </Text>
            </View>
          </View>
        )}

        {!!orderData?.response?.order.completedDate && (
          <View style={styles.timelineRow}>
            <Icon
              name="check-all"
              size={18}
              color="#1B5E20"
              style={styles.timelineIcon}
            />
            <View>
              <Text style={styles.timelineLabel}>Order Completed</Text>
              <Text style={styles.timelineValue}>
                {convertUTCToIST(orderData?.response?.order.completedDate)}
              </Text>
            </View>
          </View>
        )}

        {!!orderData?.response?.order.rejectedDate && (
          <View style={styles.timelineRow}>
            <Icon
              name="close-circle-outline"
              size={18}
              color="#C62828"
              style={styles.timelineIcon}
            />
            <View>
              <Text style={styles.timelineLabel}>Order Rejected</Text>
              <Text style={styles.timelineValue}>
                {convertUTCToIST(orderData?.response?.order.rejectedDate)}
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#0C5D9B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderId: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: FONT_FAMILY.outfitExtraBold,
  },
  orderTime: {
    marginTop: 6,
    color: '#E3F2FD',
    fontSize: 13,
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  statusChip: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusChipText: {
    color: '#0C5D9B',
    fontSize: 12,
    fontFamily: FONT_FAMILY.outfitBold,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ececec',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.outfitBold,
    color: '#2d2d2d',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    color: '#222',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  itemQty: {
    color: '#5a5a5a',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  emptyText: {
    color: '#757575',
    fontSize: 14,
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  customerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerName: {
    color: '#1d1d1d',
    fontFamily: FONT_FAMILY.outfitBold,
    fontSize: 16,
  },
  inlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF5FF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inlineButtonText: {
    color: '#0057A0',
    fontSize: 14,
    fontFamily: FONT_FAMILY.outfitBold,
    marginLeft: 6,
  },
  subtleText: {
    marginTop: 8,
    color: '#4a4a4a',
    fontSize: 14,
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  shopImage: {
    width: '100%',
    height: 130,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#eef2f7',
  },
  shopMetaRow: {
    marginTop: 10,
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shopActionRow: {
    marginBottom: 10,
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  shopDirectionButton: {
    backgroundColor: '#F2FAF6',
  },
  metaChip: {
    color: '#0C5D9B',
    borderWidth: 1,
    borderColor: '#BFD9EF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    fontFamily: FONT_FAMILY.bricolageMedium,
    backgroundColor: '#F2F8FD',
  },
  addressText: {
    fontSize: 14,
    color: '#303030',
    marginBottom: 4,
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  linkButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  linkButtonText: {
    color: '#0057A0',
    fontFamily: FONT_FAMILY.outfitBold,
    fontSize: 14,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billLabel: {
    color: '#5e5e5e',
    fontSize: 14,
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  billValue: {
    color: '#2d2d2d',
    fontSize: 14,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  billAmountRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  strikethroughAmount: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through' as const,
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  billDivider: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginVertical: 6,
  },
  billTotalLabel: {
    color: '#151515',
    fontSize: 15,
    fontFamily: FONT_FAMILY.outfitBold,
  },
  billTotalValue: {
    color: '#151515',
    fontSize: 15,
    fontFamily: FONT_FAMILY.outfitExtraBold,
  },
  paymentRow: {
    marginTop: 4,
    marginBottom: 0,
  },
  paymentChip: {
    backgroundColor: '#F6EAF3',
    color: '#8D1B62',
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 12,
    fontFamily: FONT_FAMILY.outfitBold,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timelineIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  timelineLabel: {
    fontSize: 14,
    color: '#2d2d2d',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  timelineValue: {
    fontSize: 13,
    color: '#222',
    marginTop: 2,
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: FONT_FAMILY.outfitBold,
    marginBottom: 6,
    color: '#222',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  retryButton: {
    backgroundColor: '#f04d7d',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  subtitle: {
    marginTop: 8,
    color: '#4d4d4d',
    fontSize: 14,
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
});

export default ViewOrderScreen;
