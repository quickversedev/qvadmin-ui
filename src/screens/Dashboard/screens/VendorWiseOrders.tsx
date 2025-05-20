import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import PendingTab from '../tabs/PendingTab';
import AcceptedTab from '../tabs/AcceptedTab';
import ReadyToShipTab from '../tabs/ReadyToShipTab';
import {useVendorStore, Vendor} from '../../../store/vendors/useVendorStore';
import {useCampusesStore} from '../../../store/campuses/useCampusesStore';
import {OrderStackParamList} from '../../../navigation/DashboardNavigation';
import {RouteProp, useRoute} from '@react-navigation/native';
import CancelledTab from '../tabs/CancelledTab';
import CompletedTab from '../tabs/CompletedTab';
import InTransitTab from '../tabs/InTransitTab';
import {ORDER_STATUS} from '../../../assets/constants/constant';
import {useOrderStore} from '../../../store/orders/useOrdersStore';

type VendorWiseOrdersRouteProp = RouteProp<OrderStackParamList, 'VendorOrders'>;

const TABS = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.ACCEPTED,
  ORDER_STATUS.PACKED,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.COMPLETED,
] as const;
type TabType = (typeof TABS)[number];

const VendorWiseOrders: React.FC = () => {
  const route = useRoute<VendorWiseOrdersRouteProp>();
  const {tab} = route.params;
  const [activeTab, setActiveTab] = useState<TabType>(tab);
  const {vendors, loading, error, fetchVendors} = useVendorStore();
  const [allVendors, setAllVEndors] = useState<Vendor[]>([]);
  const selectedCampus = useCampusesStore(state => state.selectedCampus);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const tabItemRefs = useRef<{[key in TabType]: View | null}>({
    PENDING: null,
    ACCEPTED: null,
    PACKED: null,
    SHIPPED: null,
    CANCELLED: null,
    COMPLETED: null,
  });
  const {fetchOrders} = useOrderStore();
  const lastFilter = useOrderStore(state => state.lastTimeFilter);
  useEffect(() => {
    if (selectedCampus) {
      fetchVendors(selectedCampus.campusId);
    }
  }, [fetchVendors, selectedCampus]);

  useEffect(() => {
    if (vendors.length > 0) {
      setAllVEndors(vendors);
    }
  }, [vendors]);

  const scrollToTab = (taba: TabType) => {
    const index = TABS.indexOf(taba);
    scrollViewRef.current?.scrollTo({
      x: index * 80, // Adjust this value based on your tab width
      animated: true,
    });
  };

  useEffect(() => {
    if (activeTab) {
      setTimeout(() => scrollToTab(activeTab), 100);
    }
  }, [activeTab]);

  useEffect(() => {
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [tab]);

  const setTabRef = (taba: TabType) => (ref: View | null) => {
    tabItemRefs.current[taba] = ref;
  };
  const onRefresh = async () => {
    setRefreshing(true);

    try {
      await fetchOrders(selectedCampus?.campusId, lastFilter);
    } catch (err) {
      console.error('Error refreshing orders:', err);
    } finally {
      setRefreshing(false);
    }
  };
  const renderTabContent = () => {
    switch (activeTab) {
      case ORDER_STATUS.PENDING:
        return (
          <PendingTab
            vendors={allVendors}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        );
      case ORDER_STATUS.ACCEPTED:
        return (
          <AcceptedTab
            vendors={allVendors}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        );
      case ORDER_STATUS.PACKED:
        return (
          <ReadyToShipTab
            vendors={allVendors}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        );
      case ORDER_STATUS.CANCELLED:
        return (
          <CancelledTab
            vendors={allVendors}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        );
      case ORDER_STATUS.COMPLETED:
        return (
          <CompletedTab
            vendors={allVendors}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        );
      case ORDER_STATUS.SHIPPED:
        return (
          <InTransitTab
            vendors={allVendors}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabWrapper}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContainer}>
          {TABS.map(tabItem => (
            <TouchableOpacity
              key={tabItem}
              ref={setTabRef(tabItem)}
              onPress={() => setActiveTab(tabItem)}
              style={styles.tabButton}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tabItem && styles.activeTabText,
                ]}>
                {tabItem}
              </Text>
              {activeTab === tabItem && <View style={styles.activeUnderline} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.contentContainer}>
        {loading ? (
          <View style={[styles.stateContainer, styles.loadingContainer]}>
            <ActivityIndicator size="large" color="#f04d7d" />
            <Text style={styles.stateTitle}>Loading Vendors</Text>
            <Text style={styles.stateSubtitle}>
              Please wait while we fetch your data
            </Text>
          </View>
        ) : error ? (
          <View style={[styles.stateContainer, styles.errorContainer]}>
            <Image
              source={require('../../../assets/images/404.png')}
              style={styles.stateIcon}
            />
            <Text style={styles.stateTitle}>Something Went Wrong</Text>
            <Text style={styles.stateSubtitle}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() =>
                selectedCampus && fetchVendors(selectedCampus.campusId)
              }>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : vendors.length === 0 ? (
          <View style={[styles.stateContainer, styles.emptyContainer]}>
            <Image
              source={require('../../../assets/images/empty-state.png')}
              style={styles.stateIcon}
            />
            <Text style={styles.stateTitle}>No Vendors Available</Text>
            <Text style={styles.stateSubtitle}>
              There are currently no vendors registered at this campus
            </Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#f04d7d']} // Android
                tintColor="#f04d7d" // iOS
              />
            }>
            {renderTabContent()}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  contentContainer: {
    flex: 1,
  },
  tabWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#d1d1d1',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f5f5f5',
  },
  tabButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5c5c5c',
  },
  activeTabText: {
    color: '#f04d7d',
  },
  activeUnderline: {
    marginTop: 10,
    height: 5,
    width: '90%',
    backgroundColor: '#f04d7d',
    borderRadius: 2,
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
  retryButton: {
    backgroundColor: '#f04d7d',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default VendorWiseOrders;
