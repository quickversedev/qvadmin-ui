import React, {useEffect, useState} from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import {useOrderStore} from '../../../store/orders/useOrdersStore';
import {Vendor} from '../../../store/vendors/useVendorStore';
import CollapsableVendor from '../../../components/Dashboard/CollapsableVendor';
import OrderCardList from '../screens/OrderCardList';
import {ORDER_STATUS} from '../../../assets/constants/constant';

interface cancelledTabProps {
  vendors: Vendor[];
  refreshing?: boolean;
  onRefresh?: () => void;
}
const CancelledTab: React.FC<cancelledTabProps> = ({
  vendors,
  refreshing = false,
  onRefresh,
}) => {
  const {getVendorOrdersByStatus} = useOrderStore();
  const [vendorsWithCancelledOrders, setVendorsWithCancelledOrders] = useState<
    Vendor[]
  >([]);

  useEffect(() => {
    const fetchCancelledVendors = () => {
      const cancelledVendors: Vendor[] = vendors.filter(vendor => {
        // ⚡ vendor.vendorId is string, shopId is number — need to convert
        const rejectedOrders = getVendorOrdersByStatus(
          Number(vendor.vendorId),
          ORDER_STATUS.REJECTED,
        );
        const cancelledOrders = getVendorOrdersByStatus(
          Number(vendor.vendorId),
          ORDER_STATUS.CANCELLED,
        );

        return cancelledOrders?.length > 0 || rejectedOrders?.length > 0;
      });

      setVendorsWithCancelledOrders(cancelledVendors);
    };

    if (vendors?.length > 0) {
      fetchCancelledVendors();
    }
  }, [getVendorOrdersByStatus, vendors]);
  return (
    <ScrollView
      style={{marginHorizontal: 16}}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#f04d7d']}
          tintColor="#f04d7d"
        />
      }>
      {vendorsWithCancelledOrders?.length === 0 ? (
        <View style={[styles.stateContainer, styles.emptyContainer]}>
          <Image
            source={require('../../../assets/images/empty-state.png')} // Add your empty state icon
            style={styles.stateIcon}
          />
          <Text style={styles.stateTitle}>0 Cancelled/Rejected Available</Text>
          <Text style={styles.stateSubtitle}>
            There are currently no Cancelled/Rejected Orders at this campus
          </Text>
        </View>
      ) : (
        vendorsWithCancelledOrders.map(vendor => (
          <CollapsableVendor
            key={`cancelled_${vendor.vendorId}`}
            vendorName={vendor.vendorName}
            vendorLogoUrl={vendor.vendorLogo}
            status={ORDER_STATUS.CANCELLED}
            vendorId={vendor.vendorId}
            vendorPhone={vendor.vendorPhone}>
            <OrderCardList
              key={`cancelled_orders_${vendor.vendorId}`}
              vendorId={vendor.vendorId}
              status={ORDER_STATUS.CANCELLED}
            />
          </CollapsableVendor>
        ))
      )}
    </ScrollView>
  );
};

export default CancelledTab;

const styles = StyleSheet.create({
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingContainer: {
    backgroundColor: '#fafafa',
  },
  errorContainer: {
    backgroundColor: '#fff9f9',
  },
  emptyContainer: {
    backgroundColor: '#f9f9f9',
  },
  stateIcon: {
    width: 120,
    height: 120,
    marginBottom: 24,
    tintColor: '#d1d1d1',
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
});
