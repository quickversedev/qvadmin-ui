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

interface InTransitTabProps {
  vendors: Vendor[];
  refreshing?: boolean;
  onRefresh?: () => void;
}
const InTransitTab: React.FC<InTransitTabProps> = ({
  vendors,
  refreshing = false,
  onRefresh,
}) => {
  const {getVendorOrdersByStatus} = useOrderStore();
  const [vendorsWithInTransitOrders, setVendorsWithInTransitOrders] = useState<
    Vendor[]
  >([]);

  useEffect(() => {
    const fetchInTransitVendors = () => {
      const inTransitVendors: Vendor[] = vendors.filter(vendor => {
        // ⚡ vendor.vendorId is string, shopId is number — need to convert
        const inTransitOrders = getVendorOrdersByStatus(
          Number(vendor.vendorId),
          ORDER_STATUS.SHIPPED,
        );
        return inTransitOrders?.length > 0;
      });

      setVendorsWithInTransitOrders(inTransitVendors);
    };

    if (vendors?.length > 0) {
      fetchInTransitVendors();
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
      {vendorsWithInTransitOrders?.length === 0 ? (
        <View style={[styles.stateContainer, styles.emptyContainer]}>
          <Image
            source={require('../../../assets/images/empty-state.png')} // Add your empty state icon
            style={styles.stateIcon}
          />
          <Text style={styles.stateTitle}>0 InTransit Orders</Text>
          <Text style={styles.stateSubtitle}>
            There are currently no InTransit orders at this campus
          </Text>
        </View>
      ) : (
        vendorsWithInTransitOrders.map(vendor => (
          <CollapsableVendor
            key={`inTransit_${vendor.vendorId}`}
            vendorName={vendor.vendorName}
            vendorLogoUrl={vendor.vendorLogo}
            status={ORDER_STATUS.SHIPPED}
            vendorPhone={vendor.vendorPhone}>
            <OrderCardList
              key={`InTransit_orders_${vendor.vendorId}`}
              vendorId={vendor.vendorId}
              status={ORDER_STATUS.SHIPPED}
            />
          </CollapsableVendor>
        ))
      )}
    </ScrollView>
  );
};

export default InTransitTab;

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
