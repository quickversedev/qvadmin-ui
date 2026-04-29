import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import {TimeFilter, useOrderStore} from '../../store/orders/useOrdersStore';
import DashboardTile from './DashboardTile';
import {useNavigation} from '@react-navigation/native';
import {OrderStackParamList} from '../../navigation/DashboardNavigation';
import {StackNavigationProp} from '@react-navigation/stack';

import {ORDER_STATUS} from '../../assets/constants/constant';
import {useRegionsStore} from '../../store/regions/useRegionsStore';
import {useAuth} from '../../contexts/Login/AuthProvider';
import {FONT_FAMILY} from '../../assets/constants/fonts';

type OrderListScreenNavigationProp = StackNavigationProp<
  OrderStackParamList,
  'OrderList'
>;

const OrderListScreen = () => {
  const navigation = useNavigation<OrderListScreenNavigationProp>();
  const {
    orders,
    loading,
    error,
    fetchOrders,
    getOrderCount,
    getOrdersCountByStatus,
  } = useOrderStore();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('1d');
  const {selectedRegion} = useRegionsStore();
  const {authData} = useAuth();

  const fetchFilteredOrders = useCallback(() => {
    fetchOrders(selectedRegion?.regionId, timeFilter, authData?.jwt);
  }, [fetchOrders, selectedRegion?.regionId, timeFilter, authData?.jwt]);

  useEffect(() => {
    fetchFilteredOrders();
  }, [timeFilter, fetchFilteredOrders]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchFilteredOrders();
    }, 180000);

    return () => clearInterval(intervalId);
  }, [timeFilter, fetchFilteredOrders]);

  const onRefresh = () => {
    fetchFilteredOrders();
  };

  const filterButtons: {id: TimeFilter; label: string}[] = [
    {id: '1h', label: 'Last Hour'},
    {id: '3h', label: 'Last 3 Hours'},
    {id: '1d', label: 'Today'},
    {id: '30d', label: 'This Month'},
  ];

  const renderFilterButtons = () => (
    <View style={styles.filterWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}>
        {filterButtons.map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              timeFilter === filter.id && styles.activeFilterButton,
            ]}
            onPress={() => setTimeFilter(filter.id)}>
            <Text
              style={[
                styles.filterButtonText,
                timeFilter === filter.id && styles.activeFilterButtonText,
              ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (!selectedRegion) {
    return (
      <View style={styles.emptyStateContainer}>
        {renderFilterButtons()}
        <View style={styles.emptyStateContent}>
          <Image
            source={require('../../assets/images/task-list.png')}
            style={styles.emptyStateImage}
          />
          <Text style={styles.emptyStateTitle}>No Region Selected</Text>
          <Text style={styles.emptyStateText}>
            Please select a Region to view order summary
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.centered, {flex: 1}]}>
        {renderFilterButtons()}
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, {flex: 1}]}>
        {renderFilterButtons()}
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchFilteredOrders}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (orders.length === 0 && !loading) {
    return (
      <View style={[styles.centered, {flex: 1}]}>
        {renderFilterButtons()}
        <Text>There are no orders at the moment...!!!</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchFilteredOrders}>
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }>
      {renderFilterButtons()}
      <View style={{display: 'flex', justifyContent: 'space-between'}}>
        <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
          <DashboardTile
            size="m"
            label="Pending Orders"
            value={getOrdersCountByStatus(ORDER_STATUS.PENDING)}
            color="#f8d7da"
            onPress={() =>
              navigation.navigate('VendorOrders', {tab: ORDER_STATUS.PENDING})
            }
          />
          <DashboardTile
            size="m"
            label="Accepted Orders"
            value={getOrdersCountByStatus(ORDER_STATUS.ACCEPTED)}
            color="#d4edda"
            onPress={() =>
              navigation.navigate('VendorOrders', {
                tab: ORDER_STATUS.ACCEPTED,
              })
            }
          />
          <DashboardTile
            size="m"
            label="Ready To Ship"
            value={getOrdersCountByStatus(ORDER_STATUS.PACKED)}
            color="#ffeeba"
            onPress={() =>
              navigation.navigate('VendorOrders', {tab: ORDER_STATUS.PACKED})
            }
          />
          <DashboardTile
            size="m"
            label="In Transit"
            value={getOrdersCountByStatus(ORDER_STATUS.SHIPPED)}
            color="#ffeeba"
            onPress={() =>
              navigation.navigate('VendorOrders', {tab: ORDER_STATUS.SHIPPED})
            }
          />
          <DashboardTile
            size="m"
            label="Completed"
            value={getOrdersCountByStatus(ORDER_STATUS.COMPLETED)}
            color="#D7DCF8"
            onPress={() =>
              navigation.navigate('VendorOrders', {
                tab: ORDER_STATUS.COMPLETED,
              })
            }
          />
          <DashboardTile
            size="m"
            label="Cancelled/Rejected"
            value={
              getOrdersCountByStatus(ORDER_STATUS.CANCELLED) +
              getOrdersCountByStatus(ORDER_STATUS.REJECTED)
            }
            color="#D4E2EA"
            onPress={() =>
              navigation.navigate('VendorOrders', {
                tab: ORDER_STATUS.CANCELLED,
              })
            }
          />
          <DashboardTile
            size="l"
            label="Total Orders"
            value={getOrderCount()}
            color="#A3D8F0"
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f7ff',
    paddingHorizontal: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    color: '#b91c1c',
    marginBottom: 20,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  retryButton: {
    backgroundColor: '#0f62fe',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  retryButtonText: {
    color: 'white',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  emptyStateContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#f5f5f5',
  },
  emptyStateContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  emptyStateImage: {
    width: 50,
    height: 50,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  emptyStateTitle: {
    fontSize: 22,
    marginBottom: 10,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.outfitExtraBold,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 8,
  },
  filterWrapper: {
    width: '100%',
    minHeight: 56,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  activeFilterButton: {
    backgroundColor: '#0f62fe',
  },
  filterButtonText: {
    color: '#334155',
    fontSize: 13,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  activeFilterButtonText: {
    color: 'white',
    fontFamily: FONT_FAMILY.outfitBold,
  },
});

export default OrderListScreen;
