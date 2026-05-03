// src/components/OrderDetailsModal.tsx
import React from 'react';
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
import {Shop} from '../../store/vendors/useVendorStore';
import {FONT_FAMILY} from '../../assets/constants/fonts';
import {useGetPricingConfigQuery} from '../../apis/pricingConfig';

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

type OrderDetailsModalProps = {
  visible: boolean;
  onClose: () => void;
  order: Order;
  vendor: Shop;
};

const OrderDetailsModal = ({
  visible,
  onClose,
  order,
  vendor,
}: OrderDetailsModalProps) => {
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
    paymentMethod,
  } = order;

  const {data: pricingConfigData} = useGetPricingConfigQuery(
    vendor?.shopDetails?.category.toString().toUpperCase(),
    {skip: !vendor?.shopDetails?.category},
  );

  const {address} = vendor?.shopDetails || {};

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
  const deliveryFeeOriginal = pricing?.deliveryFeeExpected;
  const platformFee = pricing?.platformFeeActual;
  const platformFeeOriginal = pricing?.platformFeeExpected;
  const packagingCharges = pricing?.packagingChargesActual;
  const packagingChargesOriginal = pricing?.packagingChargesExpected;
  const commissionRate = pricing?.commissionRateActual;
  const commission = (commissionRate / 100) * subTotal;
  const taxableAmount = commission + deliveryFee + platformFee;
  const taxes = Math.round((pricing?.gstRateActual / 100) * taxableAmount);
  const calculatedTotal =
    subTotal + deliveryFee + platformFee + packagingCharges + taxes;

    const customerAddr = customerAddress && parseAddress(customerAddress);

  const vendorAddr = address && parseAddress(address.address);

  const handleGetDirections = (latitude: number, longitude: number) => {
    const lat = latitude || '0';
    const lng = longitude || '0';
    openMap({lat, lng, label: `${customerName}'s Location`});
  };

  const handleCallCustomer = () => {
    const phoneNumber = `tel:${formatMobile(customerMobile)}`;
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
                  <Text style={styles.totalItemCountLabel}>
                    Total Item Count
                  </Text>
                  <Text style={styles.totalItemCountValue}>
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
                <Text style={styles.customerNameText}>{customerName}</Text>
                <TouchableOpacity
                  style={styles.phoneButton}
                  onPress={handleCallCustomer}>
                  <Icon name="phone" size={16} color="#0057A0" />
                  <Text style={styles.phoneText}>
                    {formatMobile(customerMobile)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />
            <View style={styles.addressContainer}>
              {vendorAddr && (
                <View style={styles.addressSection}>
                  <Text style={styles.sectionTitle}>Pickup</Text>
                  <Text style={styles.addressText}>{address.address}</Text>

                  <Text style={styles.addressText}>
                    {address.city}, {address.state} - {address.postalCode}
                  </Text>
                  <TouchableOpacity
                    style={styles.directionsButton}
                    onPress={() =>
                      handleGetDirections(
                        vendor?.shopDetails?.coordinates?.latitude,
                        vendor?.shopDetails?.coordinates?.longitude,
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
                <Text style={styles.billAmount}>₹{subTotal?.toFixed(2)}</Text>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Delivery Fee</Text>
                <View style={styles.billAmountRow}>
                  <Text style={styles.strikethroughAmount}>
                    ₹{deliveryFeeOriginal?.toFixed(2)}
                  </Text>
                  <Text style={styles.billAmount}>
                    ₹{deliveryFee?.toFixed(2)}
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
                    ₹{platformFee?.toFixed(2)}
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
                    ₹{packagingCharges?.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Taxes (GST & Services)</Text>
                <Text style={styles.billAmount}>₹{taxes?.toFixed(2)}</Text>
              </View>

              <View style={styles.billDivider} />

              <View style={styles.billRow}>
                <Text style={styles.billTotalLabel}>Total Pay</Text>
                <Text style={styles.billTotalAmount}>
                  ₹{calculatedTotal?.toFixed(2)}
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
    fontFamily: FONT_FAMILY.outfitBold,
    color: '#000',
  },
  orderTime: {
    fontSize: 14,
    marginTop: 15,
    color: '#666',
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  restaurantInfo: {
    marginBottom: 15,
  },
  restaurantName: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.outfitBold,
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
    fontFamily: FONT_FAMILY.outfitBold,
    color: '#666',
    marginBottom: 8,
  },
  customerNameText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bricolageMedium,
    color: '#000',
    marginBottom: 5,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 14,
    color: '#0057A0',
    marginLeft: 5,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
    fontFamily: FONT_FAMILY.bricolageRegular,
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
    fontFamily: FONT_FAMILY.outfitBold,
  },
  directionsButton: {
    marginTop: 10,
  },
  directionsButtonText: {
    color: '#0057A0',
    fontSize: 14,
    fontFamily: FONT_FAMILY.outfitBold,
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
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    fontFamily: FONT_FAMILY.outfitBold,
  },
  totalItemCountLabel: {
    fontFamily: FONT_FAMILY.outfitBold,
    fontSize: 18,
    color: '#0F172A',
  },
  totalItemCountValue: {
    fontFamily: FONT_FAMILY.outfitBold,
    fontSize: 18,
    color: '#0F172A',
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
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  timelineTime: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    fontFamily: FONT_FAMILY.bricolageRegular,
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
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  billAmount: {
    fontSize: 14,
    color: '#333',
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
  billTotalLabel: {
    fontSize: 16,
    color: '#000',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  billTotalAmount: {
    fontSize: 16,
    color: '#000',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  billDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
});

export default OrderDetailsModal;
