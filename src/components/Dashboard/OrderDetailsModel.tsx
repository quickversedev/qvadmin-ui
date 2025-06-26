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
import {Vendor} from '../../store/vendors/useVendorStore';

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
  } = order;
  const {vendorAddress} = vendor || {};
  const customerAddr = customerAddress && parseAddress(customerAddress);

  const vendorAddr = vendorAddress && parseAddress(vendorAddress);

  const handleGetDirections = (address: string) => {
    const addr = parseAddress(address);
    const lat = addr.latitude || '0';
    const lng = addr.longitude || '0';
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
                <Text style={styles.customerNameText}>{customerName}</Text>
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
                  <Text style={styles.addressText}>
                    {vendorAddr.addressLine1}
                  </Text>
                  <Text style={styles.addressText}>
                    {vendorAddr.addressLine2}
                  </Text>
                  <Text style={styles.addressText}>
                    {vendorAddr.city}, {vendorAddr.state} - {vendorAddr.pincode}
                  </Text>
                  <TouchableOpacity
                    style={styles.directionsButton}
                    onPress={() => handleGetDirections(vendorAddress)}>
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
                    onPress={() => handleGetDirections(customerAddress)}>
                    <Text style={styles.directionsButtonText}>
                      Get Directions {'>'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
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
});

export default OrderDetailsModal;
