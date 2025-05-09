import React, {useEffect, useState} from 'react';
import {Image, ScrollView, StyleSheet, Text, View} from 'react-native';
import CollapsableVendor from '../../../components/Dashboard/pending/CollapsableVendor';
import {useOrderStore} from '../../../store/orders/useOrdersStore';
import {Vendor} from '../../../store/vendors/useVendorStore';
import OrderCardList from '../screens/OrderCardList';

interface ReadyToShipTabProps {
  vendors: Vendor[];
}
const ReadyToShipTab: React.FC<ReadyToShipTabProps> = ({vendors}) => {
  const {getVendorOrdersByStatus} = useOrderStore();
  const [vendorsWithreadyToShipOrders, setVendorsWithReadyToShipOrders] =
    useState<Vendor[]>([]);
  console.log('ReadyToShipTab vendors:', vendors);
  useEffect(() => {
    const fetchReadyToShipVendors = () => {
      const readyToShipVendors: Vendor[] = vendors.filter(vendor => {
        // ⚡ vendor.vendorId is string, shopId is number — need to convert
        const readyToShipOrders = getVendorOrdersByStatus(
          Number(vendor.vendorId),
          'READY_TO_SHIP',
        );
        return readyToShipOrders?.length > 0;
      });

      setVendorsWithReadyToShipOrders(readyToShipVendors);
    };

    if (vendors?.length > 0) {
      fetchReadyToShipVendors();
    }
  }, [vendors, getVendorOrdersByStatus]);
  return (
    <ScrollView style={{marginHorizontal: 16}}>
      {vendorsWithreadyToShipOrders?.length === 0 ? (
        <View style={[styles.stateContainer, styles.emptyContainer]}>
          <Image
            source={require('../../../assets/images/empty-state.png')} // Add your empty state icon
            style={styles.stateIcon}
          />
          <Text style={styles.stateTitle}>0 Ready To Ship Orders</Text>
          <Text style={styles.stateSubtitle}>
            There are currently no Ready-To-Ship orders at this campus
          </Text>
        </View>
      ) : (
        vendorsWithreadyToShipOrders.map(vendor => (
          <CollapsableVendor
            key={`readytoship_${vendor.vendorId}`}
            vendorName={vendor.vendorName}
            vendorLogoUrl="https://example.com/logo.png"
            status="readytoship"
            vendorPhone={vendor.vendorPhone}>
            <OrderCardList
              key={`readyToShip_orders_${vendor.vendorId}`}
              vendorId={vendor.vendorId}
              status="READY_TO_SHIP"
            />
          </CollapsableVendor>
        ))
      )}
    </ScrollView>
  );
};

export default ReadyToShipTab;

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
