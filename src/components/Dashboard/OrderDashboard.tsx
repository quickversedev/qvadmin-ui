import React, {useEffect} from 'react';
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
import {useOrderStore} from '../../store/orders/useOrdersStore';
import DashboardTile from './dashboardTile/DashboardTile';
import {useNavigation} from '@react-navigation/native';
import {OrderStackParamList} from '../../navigation/DashboardNavigation';
import {StackNavigationProp} from '@react-navigation/stack';
import {useCampuses} from '../../hooks/campuses/useCampuses';

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
    getPendingOrderCount,
    getAcceptedOrderCount,
    getReadyToShipOrderCount,
    getOrderCount,
  } = useOrderStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchOrders();
    }, 180000); // 3 minutes in milliseconds

    return () => clearInterval(intervalId);
  }, [fetchOrders]);

  const onRefresh = () => {
    fetchOrders();
  };
  const {selectedCampus} = useCampuses();

  if (loading) {
    return (
      <View style={[styles.centered, {flex: 1}]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, {flex: 1}]}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state when no campus is selected
  if (!selectedCampus) {
    return (
      <View style={styles.emptyStateContainer}>
        <Image
          source={require('../../assets/images/task-list.png')} // Add an appropriate image
          style={styles.emptyStateImage}
        />
        <Text style={styles.emptyStateTitle}>No Campus Selected</Text>
        <Text style={styles.emptyStateText}>
          Please select a campus to view order summary
        </Text>
      </View>
    );
  }

  if (orders.length === 0 && !loading) {
    return (
      <View style={[styles.centered, {flex: 1}]}>
        <Text>No orders found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }>
        <View style={{display: 'flex', justifyContent: 'space-between'}}>
          <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
            <DashboardTile
              size="m"
              label="Pending Orders"
              value={getPendingOrderCount()}
              color="#f8d7da"
              onPress={() =>
                navigation.navigate('VendorOrders', {tab: 'Pending'})
              }
            />
            <DashboardTile
              size="m"
              label="Accepted Orders"
              value={getAcceptedOrderCount()}
              color="#d4edda"
              onPress={() =>
                navigation.navigate('VendorOrders', {tab: 'Accepted'})
              }
            />
            <DashboardTile
              size="l"
              label="Ready To Ship"
              value={getReadyToShipOrderCount()}
              color="#ffeeba"
              onPress={() =>
                navigation.navigate('VendorOrders', {tab: 'ReadyToShip'})
              }
            />
            <DashboardTile
              size="m"
              label="Completed"
              value={getReadyToShipOrderCount()}
              color="#D7DCF8"
              onPress={() =>
                navigation.navigate('VendorOrders', {tab: 'Completed'})
              }
            />
            <DashboardTile
              size="m"
              label="Cancelled/Rejected"
              value={getReadyToShipOrderCount()}
              color="#D4E2EA"
              onPress={() =>
                navigation.navigate('VendorOrders', {tab: 'Cancelled'})
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
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4169E1',
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  emptyStateImage: {
    width: 50,
    height: 50,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default OrderListScreen;
