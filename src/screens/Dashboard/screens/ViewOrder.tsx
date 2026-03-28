import React, {useCallback, useEffect, useState} from 'react';
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
import {HomeScreenStackParamList} from '../../../navigation/HomeScreenNavigation';
import {useAuth} from '../../../contexts/Login/AuthProvider';
import {useOrderStore, Order} from '../../../store/orders/useOrdersStore';
import {useRegionsStore} from '../../../store/regions/useRegionsStore';
import {fetchOrderDetails} from '../../../services/apis/orderService';
import {convertUTCToIST, formatTime, openMap, parseAddress} from '../../../utils/orderUtils';

type ViewOrderRouteProp = RouteProp<HomeScreenStackParamList, 'ViewOrder'>;

const ViewOrderScreen = () => {
  const route = useRoute<ViewOrderRouteProp>();
  const {orderId} = route.params;
  const {authData} = useAuth();
  const selectedRegion = useRegionsStore(state => state.selectedRegion);
  const {getOrderById, fetchOrders, lastTimeFilter} = useOrderStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (value?: number) => `Rs. ${Number(value || 0).toFixed(2)}`;

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setError('Missing order ID in notification payload.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderFromApi = await fetchOrderDetails(orderId);
      setOrder(orderFromApi);
      return;
    } catch (apiError) {
      const localOrder = getOrderById(orderId);
      if (localOrder) {
        setOrder(localOrder);
        return;
      }

      if (selectedRegion?.regionId && authData?.jwt) {
        try {
          await fetchOrders(selectedRegion.regionId, lastTimeFilter, authData.jwt);
          const refreshedOrder = getOrderById(orderId);
          if (refreshedOrder) {
            setOrder(refreshedOrder);
            return;
          }
        } catch (refreshError) {
          console.error('Failed to refresh orders for fallback:', refreshError);
        }
      }

      const message =
        apiError instanceof Error
          ? apiError.message
          : 'Unable to load order details.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [authData?.jwt, fetchOrders, getOrderById, lastTimeFilter, orderId, selectedRegion?.regionId]);

  useEffect(() => {
    loadOrder();
    console.log("Order : ", order)
  }, [loadOrder]);

  if (loading) {
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
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadOrder}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Order not found</Text>
        <Text style={styles.errorMessage}>No order found for ID: {orderId}</Text>
      </View>
    );
  }

  const customerAddress = parseAddress(order.customerAddress || '');

  const handleCallCustomer = () => {
    if (!order.customerMobile) {
      return;
    }

    Linking.openURL(`tel:${order.customerMobile}`).catch(err => {
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
      label: `${order.customerName || 'Customer'} Location`,
    });
  };

  const handleCallShop = () => {
    const shopPhone = order.shop?.phone;
    if (!shopPhone) {
      return;
    }

    Linking.openURL(`tel:${shopPhone}`).catch(err => {
      console.error('Failed to open shop dialer:', err);
    });
  };

  const handleOpenShopDirections = () => {
    const shopAddressLabel =
      order.shop?.address?.address || order.shop?.name || 'Shop Location';

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

  const subTotalAmount = Number(order.amountExcludingDeliveryFee || 0);
  const deliveryFeeAmount = Number(order.deliveryFee || 0);
  const invoiceAmount = Number(order.invoiceAmount || 0);
  const totalAmount = Number(order.totalAmount || invoiceAmount || subTotalAmount + deliveryFeeAmount);
  const shouldShowInvoice = invoiceAmount > 0 && Math.abs(invoiceAmount - totalAmount) > 0.01;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <View>
          <Text style={styles.orderId}>#{order.orderId}</Text>
          <Text style={styles.orderTime}>{formatTime(order.creationTime)}</Text>
        </View>
        <View style={styles.statusChip}>
          <Text style={styles.statusChipText}>{order.state}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Items ({order.totalItemCount})</Text>
        {order.orderItem?.length ? (
          order.orderItem.map(item => (
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
          <Text style={styles.customerName}>{order.customerName || 'N/A'}</Text>
          <TouchableOpacity style={styles.inlineButton} onPress={handleCallCustomer}>
            <Icon name="phone" size={16} color="#0057A0" />
            <Text style={styles.inlineButtonText}>Call</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtleText}>+91 {order.customerMobile}</Text>
      </View>

      {!!order.shop && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Shop Details</Text>
          {!!(order.shop.banner || order.shop.logo) && (
            <Image
              source={{uri: order.shop.banner || order.shop.logo}}
              style={styles.shopImage}
              resizeMode="cover"
            />
          )}
          <Text style={styles.customerName}>{order.shop.name || 'N/A'}</Text>

          {!!order.shop.owner && (
            <Text style={styles.subtleText}>Owner: {order.shop.owner}</Text>
          )}
          {!!order.shop.phone && (
            <Text style={styles.subtleText}>Phone: +91 {order.shop.phone}</Text>
          )}

          <View style={styles.shopMetaRow}>
            {!!order.shop.category && (
              <Text style={styles.metaChip}>{order.shop.category}</Text>
            )}
            {!!order.shop.preparationTime && (
              <Text style={styles.metaChip}>Prep: {order.shop.preparationTime}</Text>
            )}
          </View>

          <View style={styles.shopActionRow}>
            {!!order.shop.phone && (
              <TouchableOpacity style={styles.inlineButton} onPress={handleCallShop}>
                <Icon name="phone" size={16} color="#0057A0" />
                <Text style={styles.inlineButtonText}>Call Shop</Text>
              </TouchableOpacity>
            )}
            {!!(order.shop.address?.address || order.shop.name) && (
              <TouchableOpacity
                style={[styles.inlineButton, styles.shopDirectionButton]}
                onPress={handleOpenShopDirections}>
                <Icon name="map-marker-path" size={16} color="#0057A0" />
                <Text style={styles.inlineButtonText}>Directions</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.addressText}>
            {order.shop.openingTime || '--'} - {order.shop.closingTime || '--'}
          </Text>

          {!!order.shop.description && (
            <Text style={styles.subtleText}>{order.shop.description}</Text>
          )}

          {!!order.shop.address?.address && (
            <Text style={styles.addressText}>{order.shop.address.address}</Text>
          )}
        </View>
      )}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <Text style={styles.addressText}>{customerAddress?.addressLine1 || '--'}</Text>
        {!!customerAddress?.addressLine2 && (
          <Text style={styles.addressText}>{customerAddress?.addressLine2}</Text>
        )}
        <Text style={styles.addressText}>
          {[customerAddress?.city, customerAddress?.state, customerAddress?.pincode]
            .filter(Boolean)
            .join(', ') || '--'}
        </Text>
        <TouchableOpacity style={styles.linkButton} onPress={handleOpenDirections}>
          <Text style={styles.linkButtonText}>Get Directions</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Bill</Text>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Subtotal</Text>
          <Text style={styles.billValue}>{formatCurrency(subTotalAmount)}</Text>
        </View>

        {(deliveryFeeAmount > 0 || order.fulfillmentOption === 'DELIVERY') && (
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>
              {deliveryFeeAmount > 0 ? formatCurrency(deliveryFeeAmount) : 'Free'}
            </Text>
          </View>
        )}

        {shouldShowInvoice && (
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Invoice Amount</Text>
            <Text style={styles.billValue}>{formatCurrency(invoiceAmount)}</Text>
          </View>
        )}

        <View style={styles.billDivider} />
        <View style={styles.billRow}>
          <Text style={styles.billTotalLabel}>Total Amount</Text>
          <Text style={styles.billTotalValue}>{formatCurrency(totalAmount)}</Text>
        </View>
        <View style={[styles.billRow, styles.paymentRow]}>
          <Text style={styles.billLabel}>Payment Method</Text>
          <Text style={styles.paymentChip}>{order.paymentMethod || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Order Timeline</Text>

        <View style={styles.timelineRow}>
          <Icon name="clock-outline" size={18} color="#0057A0" style={styles.timelineIcon} />
          <View>
            <Text style={styles.timelineLabel}>Order Created</Text>
            <Text style={styles.timelineValue}>{convertUTCToIST(order.creationTime)}</Text>
          </View>
        </View>

        {!!order.acceptedDate && (
          <View style={styles.timelineRow}>
            <Icon name="check-circle-outline" size={18} color="#2E7D32" style={styles.timelineIcon} />
            <View>
              <Text style={styles.timelineLabel}>Order Accepted</Text>
              <Text style={styles.timelineValue}>{convertUTCToIST(order.acceptedDate)}</Text>
            </View>
          </View>
        )}

        {!!order.completedDate && (
          <View style={styles.timelineRow}>
            <Icon name="check-all" size={18} color="#1B5E20" style={styles.timelineIcon} />
            <View>
              <Text style={styles.timelineLabel}>Order Completed</Text>
              <Text style={styles.timelineValue}>{convertUTCToIST(order.completedDate)}</Text>
            </View>
          </View>
        )}

        {!!order.rejectedDate && (
          <View style={styles.timelineRow}>
            <Icon name="close-circle-outline" size={18} color="#C62828" style={styles.timelineIcon} />
            <View>
              <Text style={styles.timelineLabel}>Order Rejected</Text>
              <Text style={styles.timelineValue}>{convertUTCToIST(order.rejectedDate)}</Text>
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
    fontWeight: '800',
  },
  orderTime: {
    marginTop: 6,
    color: '#E3F2FD',
    fontSize: 13,
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
    fontWeight: '700',
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
    fontWeight: '700',
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
  },
  itemQty: {
    color: '#5a5a5a',
    fontWeight: '600',
  },
  emptyText: {
    color: '#757575',
    fontSize: 14,
  },
  customerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerName: {
    color: '#1d1d1d',
    fontWeight: '700',
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
    fontWeight: '700',
    marginLeft: 6,
  },
  subtleText: {
    marginTop: 8,
    color: '#4a4a4a',
    fontSize: 14,
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
    fontWeight: '600',
    backgroundColor: '#F2F8FD',
  },
  addressText: {
    fontSize: 14,
    color: '#303030',
    marginBottom: 4,
  },
  linkButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  linkButtonText: {
    color: '#0057A0',
    fontWeight: '700',
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
  },
  billValue: {
    color: '#2d2d2d',
    fontSize: 14,
    fontWeight: '600',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginVertical: 6,
  },
  billTotalLabel: {
    color: '#151515',
    fontSize: 15,
    fontWeight: '700',
  },
  billTotalValue: {
    color: '#151515',
    fontSize: 15,
    fontWeight: '800',
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
    fontWeight: '700',
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
    fontWeight: '600',
  },
  timelineValue: {
    fontSize: 13,
    color: '#222',
    marginTop: 2,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    color: '#222',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#f04d7d',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  subtitle: {
    marginTop: 8,
    color: '#4d4d4d',
    fontSize: 14,
  },
});

export default ViewOrderScreen;
