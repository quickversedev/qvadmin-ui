import React, {useEffect, useState} from 'react';
import {Image, ScrollView, StyleSheet, Text, View} from 'react-native';

import {Vendor} from '../../../store/vendors/useVendorStore';
import {useOrderStore} from '../../../store/orders/useOrdersStore';
import CollapsableVendor from '../../../components/Dashboard/CollapsableVendor';
import OrderCardList from '../screens/OrderCardList';
import {ORDER_STATUS} from '../../../assets/constants/constant';

interface PendingTabProps {
  vendors: Vendor[];
}

const PendingTab: React.FC<PendingTabProps> = ({vendors}) => {
  const {getVendorOrdersByStatus} = useOrderStore();
  const [vendorsWithPendingOrders, setVendorsWithPendingOrders] = useState<
    Vendor[]
  >([]);

  useEffect(() => {
    const fetchPendingVendors = () => {
      const pendingVendors: Vendor[] = vendors.filter(vendor => {
        // ⚡ vendor.vendorId is string, shopId is number — need to convert
        const pendingOrders = getVendorOrdersByStatus(
          Number(vendor.vendorId),
          ORDER_STATUS.PENDING,
        );
        return pendingOrders?.length > 0;
      });

      setVendorsWithPendingOrders(pendingVendors);
    };

    if (vendors?.length > 0) {
      fetchPendingVendors();
    }
  }, [vendors, getVendorOrdersByStatus]);

  return (
    <ScrollView style={{marginHorizontal: 16}}>
      {vendorsWithPendingOrders?.length === 0 ? (
        <View style={[styles.stateContainer, styles.emptyContainer]}>
          <Image
            source={require('../../../assets/images/empty-state.png')} // Add your empty state icon
            style={styles.stateIcon}
          />
          <Text style={styles.stateTitle}>0 Pending Orders</Text>
          <Text style={styles.stateSubtitle}>
            There are currently no pending Orders at this campus
          </Text>
        </View>
      ) : (
        vendorsWithPendingOrders.map(vendor => (
          <CollapsableVendor
            key={`pending_${vendor.vendorId}`}
            vendorName={vendor.vendorName}
            vendorLogoUrl={vendor.vendorLogo}
            status={ORDER_STATUS.PENDING}
            vendorPhone={vendor.vendorPhone}>
            <OrderCardList
              key={`pending_orders_${vendor.vendorId}`}
              vendorId={vendor.vendorId}
              status={ORDER_STATUS.PENDING}
            />
          </CollapsableVendor>
        ))
      )}
    </ScrollView>
  );
};

export default PendingTab;

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
