import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Linking} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Order} from '../../../store/orders/useOrdersStore';

type OrderSummaryCardProps = Order & {
  key?: string; // accept key as optional
};

const OrderSummaryCard = ({
  orderId,
  customerName,
  customerMobile,
  totalItemCount,
  creationTime,
  orderLink,
  state, // Add status prop to the type
}: OrderSummaryCardProps) => {
  const getPendingTime = () => {
    const createdTime = new Date(creationTime).getTime();
    const now = new Date().getTime();
    const diffMins = Math.floor((now - createdTime) / (1000 * 60));
    return diffMins;
  };

  const handleCallCustomer = () => {
    const phoneNumber = `tel:${customerMobile}`;
    Linking.openURL(phoneNumber);
  };

  // Determine status styles
  const getStatusStyles = () => {
    switch (state) {
      case 'CANCELLED':
        return {
          backgroundColor: '#f8d7da',
          color: '#721c24',
          icon: 'cancel',
        };
      case 'REJECTED':
        return {
          backgroundColor: '#fff3cd',
          color: '#856404',
          icon: 'close-circle-outline',
        };
      default:
        return {
          backgroundColor: '#e6f0fa',
          color: '#0f3057',
          icon: 'clock-outline',
        };
    }
  };

  const statusStyles = getStatusStyles();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Text style={styles.orderId}>#{orderId}</Text>
          {/* Status Badge */}
          {(state === 'CANCELLED' || state === 'REJECTED') && (
            <View
              style={[
                styles.statusBadge,
                {backgroundColor: statusStyles.backgroundColor},
              ]}>
              <Icon
                name={statusStyles.icon}
                size={14}
                color={statusStyles.color}
                style={{marginRight: 4}}
              />
              <Text style={[styles.statusText, {color: statusStyles.color}]}>
                {state}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.pendingTime}>{getPendingTime()} mins</Text>
      </View>

      <View style={styles.customerRow}>
        <View style={{flex: 1}}>
          <View style={styles.customerInfo}>
            <Icon
              name="account"
              size={18}
              color="#0057A0"
              style={{marginRight: 4}}
            />
            <Text style={styles.customerName}>{customerName}</Text>
          </View>
        </View>

        <View style={styles.rightInfo}>
          <View style={styles.customerInfo}>
            <Icon
              name="food-takeout-box-outline"
              size={18}
              color="#0057A0"
              style={{marginRight: 4}}
            />
            <Text style={styles.itemCount}>{totalItemCount} Items</Text>
          </View>
        </View>
      </View>

      <View style={styles.footerRow}>
        <TouchableOpacity
          style={styles.callButton}
          onPress={handleCallCustomer}>
          <Icon name="phone" size={16} color="#fff" style={{marginRight: 4}} />
          <Text style={styles.callButtonText}>Call Customer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{marginTop: 8}}
          onPress={() => Linking.openURL(orderLink)}>
          <Text style={styles.viewOrder}>View Order ➔</Text>
        </TouchableOpacity>
      </View>
      {state === 'READY_TO_SHIP' && (
        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => console.log('Assign order pressed')}>
          <Text style={styles.assignButtonText}>Assign Order</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    margin: 5,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: '#ccc',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontWeight: 'bold',
    backgroundColor: '#e6f0fa',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    color: '#0f3057',
    fontSize: 12,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  pendingTime: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 12,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemCount: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  rightInfo: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  callButton: {
    backgroundColor: '#0057A0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  callButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  footerRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewOrder: {
    color: '#0047AB',
    fontWeight: 'bold',
    fontSize: 14,
  },
  assignButton: {
    backgroundColor: '#f04d7d',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default OrderSummaryCard;
