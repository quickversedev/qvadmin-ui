import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useOrderStore} from '../../../store/orders/useOrdersStore';
import OrderSummaryCard from '../../../components/Dashboard/OrderSummaryCard';

interface OrderCardListProps {
  vendorId: string;
  status: string;
}

const OrderCardList: React.FC<OrderCardListProps> = ({vendorId, status}) => {
  const {getVendorOrdersByStatus} = useOrderStore();

  const getOrders = () => {
    if (status === 'CANCELLED') {
      const cancelledOrders = getVendorOrdersByStatus(
        Number(vendorId),
        'CANCELLED',
      );
      const rejectedOrders = getVendorOrdersByStatus(
        Number(vendorId),
        'REJECTED',
      );
      return [...cancelledOrders, ...rejectedOrders];
    }
    return getVendorOrdersByStatus(Number(vendorId), status);
  };

  const orders = getOrders();

  return (
    <View style={styles.container}>
      {orders.map(order => (
        <OrderSummaryCard key={`${status}_${order.orderId}`} {...order} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default OrderCardList;
