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
import {FONT_FAMILY} from '../../../assets/constants/fonts';

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
  const hasCancelledOrders = vendorsWithCancelledOrders.length > 0;

  useEffect(() => {
    const fetchCancelledVendors = () => {
      const cancelledVendors: Vendor[] = vendors.filter(vendor => {
        // ⚡ vendor.vendorId is string, shopId is number — need to convert
        const rejectedOrders = getVendorOrdersByStatus(
          Number(vendor.shopId),
          ORDER_STATUS.REJECTED,
        );
        const cancelledOrders = getVendorOrdersByStatus(
          Number(vendor.shopId),
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
      contentContainerStyle={[
        styles.contentContainer,
        !hasCancelledOrders && styles.contentContainerCentered,
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#f04d7d']}
          tintColor="#f04d7d"
        />
      }>
      {!hasCancelledOrders ? (
        <View style={styles.stateContainer}>
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
            key={`cancelled_${vendor.shopId}`}
            vendor={vendor}
            status={ORDER_STATUS.CANCELLED}>
            <OrderCardList
              key={`cancelled_orders_${vendor.shopId}`}
              vendor={vendor}
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
