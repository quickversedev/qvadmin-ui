import React, {useEffect, useState} from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {Vendor} from '../../../store/vendors/useVendorStore';
import {useOrderStore} from '../../../store/orders/useOrdersStore';
import CollapsableVendor from '../../../components/Dashboard/CollapsableVendor';
import OrderCardList from '../screens/OrderCardList';
import {ORDER_STATUS} from '../../../assets/constants/constant';
import {FONT_FAMILY} from '../../../assets/constants/fonts';

interface PendingTabProps {
  vendors: Vendor[];
  refreshing?: boolean;
  onRefresh?: () => void;
}

const PendingTab: React.FC<PendingTabProps> = ({
  vendors,
  refreshing = false,
  onRefresh,
}) => {
  const {getVendorOrdersByStatus} = useOrderStore();
  const [vendorsWithPendingOrders, setVendorsWithPendingOrders] = useState<
    Vendor[]
  >([]);
  const hasPendingOrders = vendorsWithPendingOrders.length > 0;

  useEffect(() => {
    const fetchPendingVendors = () => {
      const pendingVendors: Vendor[] = vendors.filter(vendor => {
        // ⚡ vendor.vendorId is string, shopId is number — need to convert
        const pendingOrders = getVendorOrdersByStatus(
          Number(vendor.shopId),
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
    <ScrollView
      style={{marginHorizontal: 16}}
      contentContainerStyle={[
        styles.contentContainer,
        !hasPendingOrders && styles.contentContainerCentered,
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#f04d7d']}
          tintColor="#f04d7d"
        />
      }>
      {!hasPendingOrders ? (
        <View style={styles.stateContainer}>
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
            key={`pending_${vendor.shopId}`}
            vendor={vendor}
            status={ORDER_STATUS.PENDING}>
            <OrderCardList
              key={`pending_orders_${vendor.shopId}`}
              vendor={vendor}
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
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 12,
  },
  contentContainerCentered: {
    justifyContent: 'center',
  },
  stateContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  stateIcon: {
    width: 120,
    height: 120,
    marginBottom: 24,
    tintColor: '#d1d1d1',
  },
  stateTitle: {
    fontSize: 20,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  stateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
});
