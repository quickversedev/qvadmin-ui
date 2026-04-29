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
import {FONT_FAMILY} from '../../../assets/constants/fonts';

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
  const hasInTransitOrders = vendorsWithInTransitOrders.length > 0;

  useEffect(() => {
    const fetchInTransitVendors = () => {
      const inTransitVendors: Vendor[] = vendors.filter(vendor => {
        // ⚡ vendor.vendorId is string, shopId is number — need to convert
        const inTransitOrders = getVendorOrdersByStatus(
          Number(vendor.shopId),
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
      contentContainerStyle={[
        styles.contentContainer,
        !hasInTransitOrders && styles.contentContainerCentered,
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#f04d7d']}
          tintColor="#f04d7d"
        />
      }>
      {!hasInTransitOrders ? (
        <View style={styles.stateContainer}>
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
            key={`inTransit_${vendor.shopId}`}
            vendor={vendor}
            status={ORDER_STATUS.SHIPPED}>
            <OrderCardList
              key={`InTransit_orders_${vendor.shopId}`}
              vendor={vendor}
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
