import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
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
import {useAuth} from '../../../contexts/Login/AuthProvider';
import {useDeliveryPartnerStore} from '../../../store/deliveryPartners/useDeliveryPartnerStore';
import {FONT_FAMILY} from '../../../assets/constants/fonts';

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
  const {authData} = useAuth();
  const {getVendorOrdersByStatus} = useOrderStore();
  const {
    onlinePartners,
    loadingOnlinePartners,
    fetchOnlinePartners,
    error: deliveryPartnerError,
  } = useDeliveryPartnerStore();
  const [vendorsWithAcceptedOrders, setVendorsWithAcceptedOrders] = useState<
    Vendor[]
  >([]);
  const [assignedPartnerByOrder, setAssignedPartnerByOrder] = useState<
    Record<string, string>
  >({});

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

  useEffect(() => {
    if (!authData?.jwt) {
      return;
    }

    fetchOnlinePartners(authData.jwt).catch(error => {
      console.log('Failed to fetch online delivery partners', error);
    });
  }, [authData?.jwt, fetchOnlinePartners]);

  const acceptedOrderCount = vendorsWithAcceptedOrders.reduce(
    (total, vendor) =>
      total +
      getVendorOrdersByStatus(Number(vendor.shopId), ORDER_STATUS.ACCEPTED)
        .length,
    0,
  );

  const assignedOrderCount = Object.keys(assignedPartnerByOrder).length;

  const handleAssignPartner = (orderId: string, partnerId: string) => {
    if (!orderId || !partnerId) {
      return;
    }

    setAssignedPartnerByOrder(prev => ({
      ...prev,
      [orderId]: partnerId,
    }));
  };

  return (
    <ScrollView
      style={styles.wrapper}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#f04d7d']}
          tintColor="#f04d7d"
        />
      }>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroTitle}>Accepted Orders Control Desk</Text>
          {loadingOnlinePartners ? (
            <ActivityIndicator size="small" color="#0369A1" />
          ) : null}
        </View>
        <Text style={styles.heroSubtitle}>
          Assign available delivery partners to accepted orders quickly.
        </Text>
        <View style={styles.heroStatsRow}>
          <View style={styles.heroStatBox}>
            <Text style={styles.heroStatValue}>{acceptedOrderCount}</Text>
            <Text style={styles.heroStatLabel}>Accepted</Text>
          </View>
          <View style={styles.heroStatBox}>
            <Text style={styles.heroStatValue}>{onlinePartners.length}</Text>
            <Text style={styles.heroStatLabel}>Online Partners</Text>
          </View>
          <View style={styles.heroStatBox}>
            <Text style={styles.heroStatValue}>{assignedOrderCount}</Text>
            <Text style={styles.heroStatLabel}>Assigned</Text>
          </View>
        </View>
        {!!deliveryPartnerError && (
          <Text style={styles.heroErrorText}>{deliveryPartnerError}</Text>
        )}
      </View>

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
              showAssignment
              onlinePartners={onlinePartners}
              assignedPartnerByOrder={assignedPartnerByOrder}
              onAssignPartner={handleAssignPartner}
            />
          </CollapsableVendor>
        ))
      )}
    </ScrollView>
  );
};

export default AcceptedTab;

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
  },
  heroCard: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D1EAFE',
    backgroundColor: '#EFF8FF',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 16,
    color: '#0C4A6E',
    fontFamily: FONT_FAMILY.outfitExtraBold,
  },
  heroSubtitle: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 13,
    color: '#0369A1',
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroStatBox: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 17,
    color: '#075985',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  heroStatLabel: {
    marginTop: 2,
    fontSize: 11,
    color: '#0C4A6E',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  heroErrorText: {
    marginTop: 10,
    color: '#b91c1c',
    fontSize: 12,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
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
