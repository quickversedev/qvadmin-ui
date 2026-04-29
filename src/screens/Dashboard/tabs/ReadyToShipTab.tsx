import React, {useEffect, useState} from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import CollapsableVendor from '../../../components/Dashboard/CollapsableVendor';
import {useOrderStore} from '../../../store/orders/useOrdersStore';
import {Vendor} from '../../../store/vendors/useVendorStore';
import OrderCardList from '../screens/OrderCardList';
import {ORDER_STATUS} from '../../../assets/constants/constant';
import {FONT_FAMILY} from '../../../assets/constants/fonts';

interface ReadyToShipTabProps {
  vendors: Vendor[];
  refreshing?: boolean;
  onRefresh?: () => void;
}
const ReadyToShipTab: React.FC<ReadyToShipTabProps> = ({
  vendors,
  refreshing = false,
  onRefresh,
}) => {
  const {getVendorOrdersByStatus} = useOrderStore();
  const [vendorsWithreadyToShipOrders, setVendorsWithReadyToShipOrders] =
    useState<Vendor[]>([]);
  const hasReadyToShipOrders = vendorsWithreadyToShipOrders.length > 0;

  useEffect(() => {
    const fetchReadyToShipVendors = () => {
      const readyToShipVendors: Vendor[] = vendors.filter(vendor => {
        const readyToShipOrders = getVendorOrdersByStatus(
          Number(vendor.shopId),
          ORDER_STATUS.PACKED,
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
    <ScrollView
      style={{marginHorizontal: 16}}
      contentContainerStyle={[
        styles.contentContainer,
        !hasReadyToShipOrders && styles.contentContainerCentered,
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#f04d7d']}
          tintColor="#f04d7d"
        />
      }>
      {!hasReadyToShipOrders ? (
        <View style={styles.stateContainer}>
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
            key={`readytoship_${vendor.shopId}`}
            vendor={vendor}
            status={ORDER_STATUS.PACKED}>
            <OrderCardList
              key={`readyToShip_orders_${vendor.shopId}`}
              vendor={vendor}
              status={ORDER_STATUS.PACKED}
            />
          </CollapsableVendor>
        ))
      )}
    </ScrollView>
  );
};

export default ReadyToShipTab;

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
