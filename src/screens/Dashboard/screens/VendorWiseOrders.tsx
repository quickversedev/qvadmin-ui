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
import {useVendorStore} from '../../../store/vendors/useVendorStore';

import {OrderStackParamList} from '../../../navigation/DashboardNavigation';
import {RouteProp, useRoute} from '@react-navigation/native';
import CancelledTab from '../tabs/CancelledTab';
import CompletedTab from '../tabs/CompletedTab';
import InTransitTab from '../tabs/InTransitTab';
import {ORDER_STATUS} from '../../../assets/constants/constant';
import {useOrderStore} from '../../../store/orders/useOrdersStore';
import {useRegionsStore} from '../../../store/regions/useRegionsStore';
import {useAuth} from '../../../contexts/Login/AuthProvider';
import {FONT_FAMILY} from '../../../assets/constants/fonts';

type VendorWiseOrdersRouteProp = RouteProp<OrderStackParamList, 'VendorOrders'>;

const TABS = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.ACCEPTED,
  ORDER_STATUS.PACKED,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.COMPLETED,
] as const;
export type TabType = (typeof TABS)[number];

const VendorWiseOrders: React.FC = () => {
  const route = useRoute<VendorWiseOrdersRouteProp>();
  const {tab} = route.params;
  const [activeTab, setActiveTab] = useState<TabType>(tab);
  const {authData} = useAuth();
  const {loading, vendors, error, fetchVendors, getActiveVendors} =
    useVendorStore();
  const selectedRegion = useRegionsStore(state => state.selectedRegion);
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
  const {fetchOrders, getOrdersCountByStatus} = useOrderStore();
  const lastFilter = useOrderStore(state => state.lastTimeFilter);

  useEffect(() => {
    if (selectedRegion) {
      onRefresh();
      fetchVendors(selectedRegion.regionId);
    }
  }, [fetchVendors, selectedRegion]);

  // Get active vendors for display

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
      await fetchOrders(selectedRegion?.regionId, lastFilter, authData?.jwt);
    } catch (err) {
      console.error('Error refreshing orders:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const getCountForTab = (tabStatus: TabType) => {
    switch (tabStatus) {
      case ORDER_STATUS.PENDING:
        return getOrdersCountByStatus(ORDER_STATUS.PENDING);
      case ORDER_STATUS.ACCEPTED:
        return getOrdersCountByStatus(ORDER_STATUS.ACCEPTED);
      case ORDER_STATUS.PACKED:
        return getOrdersCountByStatus(ORDER_STATUS.PACKED);
      case ORDER_STATUS.SHIPPED:
        return getOrdersCountByStatus(ORDER_STATUS.SHIPPED);
      case ORDER_STATUS.CANCELLED:
        return (
          getOrdersCountByStatus(ORDER_STATUS.CANCELLED) +
          getOrdersCountByStatus(ORDER_STATUS.REJECTED)
        ); // Combined cancelled/rejected
      case ORDER_STATUS.COMPLETED:
        return getOrdersCountByStatus(ORDER_STATUS.COMPLETED);
      default:
        return 0;
    }
  };
  const renderTabContent = () => {
    switch (activeTab) {
      case ORDER_STATUS.PENDING:
        return (
          <PendingTab
            vendors={vendors}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        );
      case ORDER_STATUS.ACCEPTED:
        return (
          <AcceptedTab
            vendors={vendors}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        );
      case ORDER_STATUS.PACKED:
        return (
          <ReadyToShipTab
            vendors={vendors}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        );
      case ORDER_STATUS.CANCELLED:
        return (
          <CancelledTab
            vendors={vendors}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        );
      case ORDER_STATUS.COMPLETED:
        return (
          <CompletedTab
            vendors={vendors}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        );
      case ORDER_STATUS.SHIPPED:
        return (
          <InTransitTab
            vendors={vendors}
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
              <View style={styles.tabContent}>
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tabItem && styles.activeTabText,
                  ]}>
                  {tabItem}
                </Text>
                {getCountForTab(tabItem) > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>
                      {getCountForTab(tabItem)}
                    </Text>
                  </View>
                )}
              </View>
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
                selectedRegion && fetchVendors(selectedRegion.regionId)
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
            <Text style={styles.stateTitle}>No Active Vendors</Text>
            <Text style={styles.stateSubtitle}>
              There are currently no active vendors in this region
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
    backgroundColor: '#f3f7ff',
  },
  contentContainer: {
    flex: 1,
  },
  tabWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#dbe4f6',
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#eef3ff',
    paddingVertical: 6,
  },
  tabButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tabText: {
    fontSize: 15,
    color: '#475569',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  activeTabText: {
    color: '#0f62fe',
  },
  activeUnderline: {
    marginTop: 8,
    height: 4,
    width: '90%',
    backgroundColor: '#0f62fe',
    borderRadius: 999,
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
  retryButton: {
    backgroundColor: '#0f62fe',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: FONT_FAMILY.outfitBold,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    backgroundColor: '#0f62fe',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: 'white',
    fontSize: 12,
    fontFamily: FONT_FAMILY.outfitBold,
  },
});

export default VendorWiseOrders;
