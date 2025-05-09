import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import PendingTab from '../tabs/PendingTab';
import AcceptedTab from '../tabs/AcceptedTab';
import ReadyToShipTab from '../tabs/ReadyToShipTab';
import {useVendorStore, Vendor} from '../../../store/vendors/useVendorStore';
import {useCampusesStore} from '../../../store/campuses/useCampusesStore';
import {OrderStackParamList} from '../../../navigation/DashboardNavigation';
import {RouteProp, useRoute} from '@react-navigation/native';
import CancelledTab from '../tabs/CancelledTab';
import CompletedTab from '../tabs/CompletedTab';

type VendorWiseOrdersRouteProp = RouteProp<OrderStackParamList, 'VendorOrders'>;

const TABS = [
  'Pending',
  'Accepted',
  'ReadyToShip',
  'Cancelled',
  'Completed',
] as const;
type TabType = (typeof TABS)[number];

const VendorWiseOrders: React.FC = () => {
  const route = useRoute<VendorWiseOrdersRouteProp>();
  const {tab} = route.params;
  const [activeTab, setActiveTab] = useState<TabType>(tab);
  const {vendors, loading, error, fetchVendors} = useVendorStore();
  const [allVendors, setAllVEndors] = useState<Vendor[]>([]);
  const selectedCampus = useCampusesStore(state => state.selectedCampus);

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Pending':
        return <PendingTab vendors={allVendors} />;
      case 'Accepted':
        return <AcceptedTab vendors={allVendors} />;
      case 'ReadyToShip':
        return <ReadyToShipTab vendors={allVendors} />;
      case 'Cancelled':
        return <CancelledTab vendors={allVendors} />;
      case 'Completed':
        return <CompletedTab vendors={allVendors} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabWrapper}>
        <View style={styles.tabWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabContainer}>
            {TABS.map(tabItem => (
              <TouchableOpacity
                key={tabItem}
                onPress={() => setActiveTab(tabItem)}
                style={styles.tabButton}>
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tabItem && styles.activeTabText,
                  ]}>
                  {tabItem}
                </Text>
                {activeTab === tabItem && (
                  <View style={styles.activeUnderline} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Tab Content */}
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
              source={require('../../../assets/images/404.png')} // Add your error icon
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
              source={require('../../../assets/images/empty-state.png')} // Add your empty state icon
              style={styles.stateIcon}
            />
            <Text style={styles.stateTitle}>No Vendors Available</Text>
            <Text style={styles.stateSubtitle}>
              There are currently no vendors registered at this campus
            </Text>
          </View>
        ) : (
          renderTabContent()
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
    borderBottomColor: '#d1d1d1', // Light gray border
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
    color: '#5c5c5c', // Inactive color
  },
  activeTabText: {
    color: '#f04d7d', // Active color (pinkish)
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
