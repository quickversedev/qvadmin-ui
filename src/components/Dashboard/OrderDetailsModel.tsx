// src/components/OrderDetailsModal.tsx
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Order} from '../../store/orders/useOrdersStore';
import {
  convertUTCToIST,
  formatTime,
  openMap,
  parseAddress,
} from '../../utils/orderUtils';
import {Vendor} from '../../store/vendors/useVendorStore';
import {
  fetchPricingConfigurations,
  PricingConfig,
} from '../../services/apis/pricingConfigService';
import {
  getServiceTypeFromCategory,
  resolvePricingForService,
} from '../../utils/pricingConfigUtils';

type OrderDetailsModalProps = {
  visible: boolean;
  onClose: () => void;
  order: Order;
  vendor: Vendor;
};

const OrderDetailsModal = ({
  visible,
  onClose,
  order,
  vendor,
}: OrderDetailsModalProps) => {
  const [pricingConfigs, setPricingConfigs] = useState<PricingConfig[]>([]);

  const {
    orderId,
    customerName,
    customerMobile,
    totalItemCount,
    acceptedDate,
    completedDate,
    rejectedDate,
    orderItem,
    creationTime,
    customerAddress,
    amountExcludingDeliveryFee,
    paymentMethod,
  } = order;

  console.log(order);

  useEffect(() => {
    let isMounted = true;

    const loadPricingConfigurations = async () => {
      try {
        const response = await fetchPricingConfigurations();
        if (isMounted) {
          setPricingConfigs(response || []);
        }
      } catch (pricingError) {
        console.error('Failed to fetch pricing configurations:', pricingError);
      }
    };

    loadPricingConfigurations();

    return () => {
      isMounted = false;
    };
  }, []);

  const {shopAddress} = vendor || {};

  // Fee calculation matching client app logic — use vendor store category first, fallback to order's shop
  const vendorCategory = vendor?.category || order.shop?.category || '';
  const serviceType = getServiceTypeFromCategory(vendorCategory);
  const pricing = resolvePricingForService(pricingConfigs, serviceType);
  const subTotal = amountExcludingDeliveryFee || 0;
  const deliveryFee = pricing.deliveryFeeActual;
  const deliveryFeeOriginal = pricing.deliveryFeeExpected;
  const platformFee = pricing.platformFeeActual;
  const platformFeeOriginal = pricing.platformFeeExpected;
  const packagingCharges = pricing.packagingChargesActual;
  const packagingChargesOriginal = pricing.packagingChargesExpected;
  const commissionRate = pricing.commissionRate;
  const commission = commissionRate * Number(subTotal);
  const taxableAmount = commission + deliveryFee + platformFee;
  const taxes = Math.round(pricing.gstRate * taxableAmount);
  const calculatedTotal =
    Number(subTotal) + deliveryFee + platformFee + packagingCharges + taxes;
  const customerAddr = customerAddress && parseAddress(customerAddress);

  const vendorAddr = shopAddress && parseAddress(shopAddress.address);

  const handleGetDirections = (latitude: number, longitude: number) => {
    const lat = latitude || '0';
    const lng = longitude || '0';
    openMap({lat, lng, label: `${customerName}'s Location`});
  };

  const handleCallCustomer = () => {
    const phoneNumber = `tel:${customerMobile}`;
    Linking.openURL(phoneNumber);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderIdText}>#{orderId}</Text>
              <Text style={styles.orderTime}>{formatTime(creationTime)}</Text>
            </View>

            <View style={styles.section}>
              <View style={styles.itemsContainer}>
                {orderItem?.length > 0 &&
                  orderItem.map(item => (
                    <View key={item.id} style={styles.itemRow}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemQuantity}>
                        X {item.itemCount}
                      </Text>
                    </View>
                  ))}
                <View style={styles.itemRow}>
                  <Text
                    style={
                      styles.itemName && {fontWeight: 'bold', fontSize: 18}
                    }>
                    Total Item Count
                  </Text>
                  <Text
                    style={
                      styles.itemQuantity && {fontWeight: 'bold', fontSize: 18}
                    }>
                    {totalItemCount}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}>
                {/* <Text style={styles.customerNameText}>{customerName}</Text> */}
                <TouchableOpacity
                  style={styles.phoneButton}
                  onPress={handleCallCustomer}>
                  <Icon name="phone" size={16} color="#0057A0" />
                  <Text style={styles.phoneText}>+91 {customerMobile}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />
            <View style={styles.addressContainer}>
              {vendorAddr && (
                <View style={styles.addressSection}>
                  <Text style={styles.sectionTitle}>Pickup</Text>
                  <Text style={styles.addressText}>{shopAddress.address}</Text>

                  <Text style={styles.addressText}>
                    {shopAddress.city}, {shopAddress.state} -{' '}
                    {shopAddress.postalCode}
                  </Text>
                  <TouchableOpacity
                    style={styles.directionsButton}
                    onPress={() =>
                      handleGetDirections(
                        vendor?.coordinates?.latitude,
                        vendor?.coordinates?.longitude,
                      )
                    }>
                    <Text style={styles.directionsButtonText}>
                      Get Directions {'>'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {customerAddr && (
                <View style={styles.addressSection}>
                  <Text style={styles.sectionTitle}>Drop</Text>
                  <Text style={styles.addressText}>
                    {customerAddr.addressLine1}
                  </Text>
                  <Text style={styles.addressText}>
                    {customerAddr.addressLine2}
                  </Text>
                  <Text style={styles.addressText}>
                    {customerAddr.city}, {customerAddr.state} -{' '}
                    {customerAddr.pincode}
                  </Text>
                  <TouchableOpacity
                    style={styles.directionsButton}
                    onPress={() =>
                      handleGetDirections(
                        Number(customerAddr?.latitude),
                        Number(customerAddr?.longitude),
                      )
                    }>
                    <Text style={styles.directionsButtonText}>
                      Get Directions {'>'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bill</Text>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Sub Total</Text>
                <Text style={styles.billAmount}>₹{subTotal.toFixed(2)}</Text>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Delivery Fee</Text>
                <View style={styles.billAmountRow}>
                  <Text style={styles.strikethroughAmount}>
                    ₹{deliveryFeeOriginal}
                  </Text>
                  <Text style={styles.billAmount}>
                    ₹{deliveryFee.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Platform Fee</Text>
                <View style={styles.billAmountRow}>
                  <Text style={styles.strikethroughAmount}>
                    ₹{platformFeeOriginal}
                  </Text>
                  <Text style={styles.billAmount}>
                    ₹{platformFee.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Packaging Charges</Text>
                <View style={styles.billAmountRow}>
                  <Text style={styles.strikethroughAmount}>
                    ₹{packagingChargesOriginal}
                  </Text>
                  <Text style={styles.billAmount}>
                    ₹{packagingCharges.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Taxes (GST & Services)</Text>
                <Text style={styles.billAmount}>₹{taxes.toFixed(2)}</Text>
              </View>

              <View style={styles.billDivider} />

              <View style={styles.billRow}>
                <Text style={styles.billTotalLabel}>Total Pay</Text>
                <Text style={styles.billTotalAmount}>
                  ₹{calculatedTotal.toFixed(2)}
                </Text>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Payment Method</Text>
                <Text style={styles.billAmount}>{paymentMethod || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Timeline</Text>

              <View style={styles.timelineItem}>
                <Icon
                  name="clock-outline"
                  size={18}
                  color="#0057A0"
                  style={styles.timelineIcon}
                />
                <View>
                  <Text style={styles.timelineLabel}>Order Created</Text>
                  <Text style={styles.timelineTime}>
                    {convertUTCToIST(creationTime)}
                  </Text>
                </View>
              </View>

              {acceptedDate && (
                <View style={styles.timelineItem}>
                  <Icon
                    name="check-circle-outline"
                    size={18}
                    color="#4CAF50"
                    style={styles.timelineIcon}
                  />
                  <View>
                    <Text style={styles.timelineLabel}>Order Accepted</Text>
                    <Text style={styles.timelineTime}>
                      {convertUTCToIST(acceptedDate)}
                    </Text>
                  </View>
                </View>
              )}

              {completedDate && (
                <View style={styles.timelineItem}>
                  <Icon
                    name="check-all"
                    size={18}
                    color="#1e8449"
                    style={styles.timelineIcon}
                  />
                  <View>
                    <Text style={styles.timelineLabel}>Order Completed</Text>
                    <Text style={styles.timelineTime}>
                      {convertUTCToIST(completedDate)}
                    </Text>
                  </View>
                </View>
              )}

              {rejectedDate && (
                <View style={styles.timelineItem}>
                  <Icon
                    name="close-circle-outline"
                    size={18}
                    color="#f44336"
                    style={styles.timelineIcon}
                  />
                  <View>
                    <Text style={styles.timelineLabel}>Order Rejected</Text>
                    <Text style={styles.timelineTime}>
                      {convertUTCToIST(rejectedDate)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    height: '80%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalContent: {
    paddingBottom: 40,
    paddingTop: 10,
    paddingHorizontal: 5, // Add some horizontal padding
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderIdText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  orderTime: {
    fontSize: 14,
    marginTop: 15,
    color: '#666',
  },
  restaurantInfo: {
    marginBottom: 15,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },

  divider: {
    height: 12, // Reduced height to act as spacing between cards
    backgroundColor: 'transparent', // Remove the line divider
  },
  section: {
    marginBottom: 15,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  customerNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  phoneText: {
    fontSize: 14,
    color: '#0057A0',
    marginLeft: 5,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
  },
  doneBadge: {
    backgroundColor: '#e0f7fa',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  doneBadgeText: {
    color: '#00796b',
    fontSize: 12,
    fontWeight: 'bold',
  },
  directionsButton: {
    marginTop: 10,
  },
  directionsButtonText: {
    color: '#0057A0',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemsContainer: {
    marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timelineIcon: {
    marginRight: 12,
  },
  timelineLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  timelineTime: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  addressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  addressSection: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginHorizontal: 5, // Add small margin between cards
    maxWidth: '48%', // Ensure both cards fit side by side
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 14,
    color: '#666',
  },
  billAmount: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
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
  },
  billTotalLabel: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  billTotalAmount: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
});

export default OrderDetailsModal;
