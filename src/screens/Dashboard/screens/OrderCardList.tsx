import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useOrderStore} from '../../../store/orders/useOrdersStore';
import OrderSummaryCard from '../../../components/Dashboard/OrderSummaryCard';
import {Vendor} from '../../../store/vendors/useVendorStore';

interface OrderCardListProps {
  vendor: Vendor;
  status: string;
}

const OrderCardList: React.FC<OrderCardListProps> = ({vendor, status}) => {
  const {getVendorOrdersByStatus} = useOrderStore();

  const {shopId} = vendor || {};
  const getOrders = () => {
    if (status === 'CANCELLED') {
      const cancelledOrders = getVendorOrdersByStatus(
        Number(shopId),
        'CANCELLED',
      );
      const rejectedOrders = getVendorOrdersByStatus(
        Number(shopId),
        'REJECTED',
      );
      return [...cancelledOrders, ...rejectedOrders];
    }
    return getVendorOrdersByStatus(Number(shopId), status);
  };

  const orders = getOrders();

  return (
    <View style={styles.container}>
      {orders.map(order => (
        <OrderSummaryCard
          key={`${status}_${order.orderId}`}
          {...order}
          vendor={vendor}
        />
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
