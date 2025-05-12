import React, {useEffect, useState} from 'react';
import {Image, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useOrderStore} from '../../../store/orders/useOrdersStore';
import {Vendor} from '../../../store/vendors/useVendorStore';
import CollapsableVendor from '../../../components/Dashboard/CollapsableVendor';
import OrderCardList from '../screens/OrderCardList';
import {ORDER_STATUS} from '../../../assets/constants/constant';

interface completedTabProps {
  vendors: Vendor[];
}
const CompletedTab: React.FC<completedTabProps> = ({vendors}) => {
  const {getVendorOrdersByStatus} = useOrderStore();
  const [vendorsWithCompletedOrders, setVendorsWithCompletedOrders] = useState<
    Vendor[]
  >([]);

  useEffect(() => {
    const fetchCompletedVendors = () => {
      const completedVendors: Vendor[] = vendors.filter(vendor => {
        // ⚡ vendor.vendorId is string, shopId is number — need to convert
        const completedOrders = getVendorOrdersByStatus(
          Number(vendor.vendorId),
          ORDER_STATUS.COMPLETED,
        );
        return completedOrders?.length > 0;
      });

      setVendorsWithCompletedOrders(completedVendors);
    };

    if (vendors?.length > 0) {
      fetchCompletedVendors();
    }
  }, [getVendorOrdersByStatus, vendors]);
  return (
    <ScrollView style={{marginHorizontal: 16}}>
      {vendorsWithCompletedOrders?.length === 0 ? (
        <View style={[styles.stateContainer, styles.emptyContainer]}>
          <Image
            source={require('../../../assets/images/empty-state.png')} // Add your empty state icon
            style={styles.stateIcon}
          />
          <Text style={styles.stateTitle}>0 Completed Orders</Text>
          <Text style={styles.stateSubtitle}>
            There are currently 0 Completed Orders at this campus
          </Text>
        </View>
      ) : (
        vendorsWithCompletedOrders.map(vendor => (
          <CollapsableVendor
            key={`Completed_${vendor.vendorId}`}
            vendorName={vendor.vendorName}
            vendorLogoUrl={vendor.vendorLogo}
            status={ORDER_STATUS.COMPLETED}
            vendorPhone={vendor.vendorPhone}>
            <OrderCardList
              key={`Completed_orders_${vendor.vendorId}`}
              vendorId={vendor.vendorId}
              status={ORDER_STATUS.COMPLETED}
            />
          </CollapsableVendor>
        ))
      )}
    </ScrollView>
  );
};

export default CompletedTab;

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
