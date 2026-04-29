import React, {useEffect, useState} from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useOrderStore} from '../../../store/orders/useOrdersStore';
import {Vendor} from '../../../store/vendors/useVendorStore';
import CollapsableVendor from '../../../components/Dashboard/CollapsableVendor';
import OrderCardList from '../screens/OrderCardList';
import {ORDER_STATUS} from '../../../assets/constants/constant';
import {FONT_FAMILY} from '../../../assets/constants/fonts';

interface completedTabProps {
  vendors: Vendor[];
  refreshing?: boolean;
  onRefresh?: () => void;
}
const CompletedTab: React.FC<completedTabProps> = ({
  vendors,
  refreshing = false,
  onRefresh,
}) => {
  const {getVendorOrdersByStatus} = useOrderStore();
  const [vendorsWithCompletedOrders, setVendorsWithCompletedOrders] = useState<
    Vendor[]
  >([]);
  const hasCompletedOrders = vendorsWithCompletedOrders.length > 0;

  useEffect(() => {
    const fetchCompletedVendors = () => {
      const completedVendors: Vendor[] = vendors.filter(vendor => {
        // ⚡ vendor.vendorId is string, shopId is number — need to convert
        const completedOrders = getVendorOrdersByStatus(
          Number(vendor.shopId),
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
    <ScrollView
      style={{marginHorizontal: 16}}
      contentContainerStyle={[
        styles.contentContainer,
        !hasCompletedOrders && styles.contentContainerCentered,
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#f04d7d']}
          tintColor="#f04d7d"
        />
      }>
      {!hasCompletedOrders ? (
        <View style={styles.stateContainer}>
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
            key={`Completed_${vendor.shopId}`}
            vendor={vendor}
            status={ORDER_STATUS.COMPLETED}>
            <OrderCardList
              key={`Completed_orders_${vendor.shopId}`}
              vendor={vendor}
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
