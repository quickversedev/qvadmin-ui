import React, {useEffect, useState} from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {useOrderStore} from '../../../store/orders/useOrdersStore';
import {Vendor} from '../../../store/vendors/useVendorStore';
import CollapsableVendor from '../../../components/Dashboard/CollapsableVendor';
import OrderCardList from '../screens/OrderCardList';
import {ORDER_STATUS} from '../../../assets/constants/constant';

interface AcceptedTabProps {
  vendors: Vendor[];
  refreshing?: boolean;
  onRefresh?: () => void;
}
const AcceptedTab: React.FC<AcceptedTabProps> = ({
  vendors,
  refreshing = false,
  onRefresh,
}) => {
  const {getVendorOrdersByStatus} = useOrderStore();
  const [vendorsWithAcceptedOrders, setVendorsWithAcceptedOrders] = useState<
    Vendor[]
  >([]);

  useEffect(() => {
    const fetchAcceptedVendors = () => {
      const acceptedVendors: Vendor[] = vendors.filter(vendor => {
        // ⚡ vendor.vendorId is string, shopId is number — need to convert
        const acceptedOrders = getVendorOrdersByStatus(
          Number(vendor.shopId),
          ORDER_STATUS.ACCEPTED,
        );
        return acceptedOrders?.length > 0;
      });

      setVendorsWithAcceptedOrders(acceptedVendors);
    };

    if (vendors?.length > 0) {
      fetchAcceptedVendors();
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
      {vendorsWithAcceptedOrders?.length === 0 ? (
        <View style={[styles.stateContainer, styles.emptyContainer]}>
          <Image
            source={require('../../../assets/images/empty-state.png')} // Add your empty state icon
            style={styles.stateIcon}
          />
          <Text style={styles.stateTitle}>0 Accepted Orders</Text>
          <Text style={styles.stateSubtitle}>
            There are currently no Accepted orders at this campus
          </Text>
        </View>
      ) : (
        vendorsWithAcceptedOrders.map(vendor => (
          <CollapsableVendor
            key={`accepted_${vendor.shopId}`}
            vendor={vendor}
            status={ORDER_STATUS.ACCEPTED}>
            <OrderCardList
              key={`accepted_orders_${vendor.shopId}`}
              vendor={vendor}
              status={ORDER_STATUS.ACCEPTED}
            />
          </CollapsableVendor>
        ))
      )}
    </ScrollView>
  );
};

export default AcceptedTab;

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
