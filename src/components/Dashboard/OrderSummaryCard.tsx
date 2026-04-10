// src/components/OrderSummaryCard.tsx
import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Linking} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Order} from '../../store/orders/useOrdersStore';
import {getStatusStyles} from './DashBoardUtil';
import OrderDetailsModal from './OrderDetailsModel';
import {convertUTCToIST, getTimeElapsed} from '../../utils/orderUtils';
import {Vendor} from '../../store/vendors/useVendorStore';

import {ORDER_STATUS} from '../../assets/constants/constant';

type OrderSummaryCardProps = Order & {
  key?: string;
  vendor: Vendor;
};

const OrderSummaryCard = (props: OrderSummaryCardProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const {
    orderId,
    customerName,
    customerMobile,
    totalItemCount,
    creationTime,
    acceptedDate,
    rejectedDate,
    completedDate,
    state,
    vendor,
  } = props;
 
  const statusStyles = getStatusStyles(state);
  const getTime = () => {
    switch (state) {
      case ORDER_STATUS.PENDING:
        return getTimeElapsed(creationTime);
      case ORDER_STATUS.ACCEPTED:
        return acceptedDate ? getTimeElapsed(acceptedDate) : '--';
      case ORDER_STATUS.PACKED:
        return '--';
      case ORDER_STATUS.SHIPPED:
        return '--';
      case ORDER_STATUS.CANCELLED:
        return rejectedDate ? convertUTCToIST(rejectedDate) : '--';
      case ORDER_STATUS.REJECTED:
        return rejectedDate ? convertUTCToIST(rejectedDate) : '--';
      case ORDER_STATUS.COMPLETED:
        return completedDate ? convertUTCToIST(completedDate) : '--';
      default:
        return '--';
    }
  };
  const handleCallCustomer = () => {
    const phoneNumber = `tel:${customerMobile}`;
    Linking.openURL(phoneNumber);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.orderId}>#{orderId}</Text>
        <View style={{flexDirection: 'row'}}>
          <Icon
            name="clock-outline"
            size={18}
            color="#0057A0"
            style={{marginRight: 4}}
          />
          <Text style={[styles.time, {color: statusStyles.color}]}>
            {new Date(creationTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        {/* <View style={styles.customerInfo}>
          <Icon
            name="account"
            size={18}
            color="#0057A0"
            style={{marginRight: 4}}
          />
          <Text style={styles.customerName}>{customerName}</Text>
        </View> */}
        <View
          style={[
            styles.statusBadge,
            {backgroundColor: statusStyles.backgroundColor},
          ]}>
          <Icon
            name={statusStyles.icon}
            size={12}
            color={statusStyles.color}
            style={{marginRight: 4}}
          />
          <Text style={[styles.statusText, {color: statusStyles.color}]}>
            {state}
          </Text>
        </View>
      </View>
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            {state === ORDER_STATUS.PENDING
              ? 'Pending Time: '
              : state === ORDER_STATUS.ACCEPTED
              ? 'Preparing Time: '
              : state === ORDER_STATUS.PACKED
              ? 'Packed Time: '
              : state === ORDER_STATUS.SHIPPED
              ? 'Shipped Time: '
              : state === ORDER_STATUS.COMPLETED
              ? 'Completed In: '
              : state === ORDER_STATUS.CANCELLED ||
                state === ORDER_STATUS.REJECTED
              ? 'Cancelled In: '
              : 'Time: '}
          </Text>
          <Text style={[styles.pendingTimeValue, {color: statusStyles.color}]}>
            {getTime()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon
            name="food-takeout-box-outline"
            size={18}
            color="#0057A0"
            style={{marginRight: 4}}
          />
          <Text style={styles.detailLabel}>{totalItemCount} </Text>
          <Text style={styles.itemsLabel}>Items</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.viewButton]}
          onPress={() => setModalVisible(true)}>
          <Text style={styles.buttonText}>View Order ➔</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.contactButton]}
          onPress={handleCallCustomer}>
          <Text style={styles.buttonText}>Contact Customer</Text>
        </TouchableOpacity>
      </View>

      <OrderDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        order={props}
        vendor={vendor}
      />
    </View>
  );
};

export default OrderSummaryCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  time: {
    fontSize: 14,
  },
  details: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
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
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  pendingTimeValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemsLabel: {
    fontSize: 14,
    color: 'gray',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButton: {
    backgroundColor: '#f0f0f0',
  },
  contactButton: {
    backgroundColor: '#f04d7d',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
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
  viewButtonText: {
    color: '#0047AB',
  },
  contactButtonText: {
    color: 'white',
  },
});
