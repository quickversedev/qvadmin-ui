import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  Pressable,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {FONT_FAMILY} from '../../assets/constants/fonts';
import {RouteProp, useRoute} from '@react-navigation/native';
import {OrdersNavigationStackParamList} from '../../navigation/OrdersNavigation';
import {useGetAllOrdersQuery, useGetOrderStatsQuery} from '../../apis/order';
import {useRegionsStore} from '../../store/regions/useRegionsStore';
import {OrderSummaryCard} from '../../components/orders';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type OrdersScreenRouteProp = RouteProp<
  OrdersNavigationStackParamList,
  'OrdersScreen'
>;

const TIME_RANGE_OPTIONS = [
  {label: 'Last 1 Hours', value: 'LAST_1_HOUR'},
  {label: 'Last 3 Hours', value: 'LAST_3_HOUR'},
  {label: 'Today', value: 'TODAY'},
] as const;

const OrdersScreen = () => {
  const route = useRoute<OrdersScreenRouteProp>();
  const {selectedRegion} = useRegionsStore(state => state);
  const {orderStatus} = route.params;

  const [activeTab, setActiveTab] = useState<string>(orderStatus);
  const [timeRange, setTimeRange] =
    useState<(typeof TIME_RANGE_OPTIONS)[number]['value']>('LAST_3_HOUR');
  const [isTimeRangeMenuVisible, setIsTimeRangeMenuVisible] = useState(false);
  const [isVendorMenuVisible, setIsVendorMenuVisible] = useState(false);
  const [isTransporterMenuVisible, setIsTransporterMenuVisible] =
    useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [selectedTransporterId, setSelectedTransporterId] = useState<
    string | null
  >(null);
  const [refreshing, setRefreshing] = useState(false);

  const tabScrollRef = useRef<ScrollView | null>(null);
  const tabLayoutsRef = useRef<Record<string, {x: number; width: number}>>({});

  const regionId = selectedRegion?.regionId || 'BEED-431122';

  const {
    data: orderStatsData,
    error: orderStatsError,
    refetch: refetchOrderStats,
    isFetching: isOrderStatsFetching,
  } = useGetOrderStatsQuery(
    {
      regionId,
      timeRange,
    },
    {pollingInterval: 5000},
  );

  const {
    data: allOrdersData,
    error: ordersError,
    refetch: refetchOrders,
    isLoading: isOrdersLoading,
    isFetching: isOrdersFetching,
  } = useGetAllOrdersQuery(
    {
      regionId,
      timeRange,
      orderStatus: activeTab,
      vendorId: selectedVendorId || undefined,
      transporterId: selectedTransporterId || undefined,
    },
    {pollingInterval: 5000},
  );

  console.log('All Orders : ', allOrdersData);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await Promise.all([refetchOrderStats(), refetchOrders()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchOrderStats, refetchOrders]);

  const scrollActiveTabIntoView = useCallback(() => {
    const activeLayout = tabLayoutsRef.current[activeTab];

    if (!activeLayout) {
      return;
    }

    tabScrollRef.current?.scrollTo({
      x: Math.max(0, activeLayout.x - 24),
      animated: false,
    });
  }, [activeTab]);

  useEffect(() => {
    const frame = requestAnimationFrame(scrollActiveTabIntoView);

    return () => cancelAnimationFrame(frame);
  }, [scrollActiveTabIntoView]);

  const TABS = {
    PENDING: {
      label: 'Pending',
      value: 'PENDING',
      count: orderStatsData?.response?.pendingOrders || 0,
    },
    ACCEPTED: {
      label: 'Accepted',
      value: 'ACCEPTED',
      count: orderStatsData?.response?.acceptedOrders || 0,
    },
    SHIPPED: {
      label: 'Shipped',
      value: 'SHIPPED',
      count: orderStatsData?.response?.inTransitOrders || 0,
    },
    COMPLETED: {
      label: 'Completed',
      value: 'COMPLETED',
      count: orderStatsData?.response?.completedOrders || 0,
    },
    CANCELLED: {
      label: 'Cancelled',
      value: 'CANCELLED',
      count: orderStatsData?.response?.cancelledOrders || 0,
    },
    REJECTED: {
      label: 'Rejected',
      value: 'REJECTED',
      count: orderStatsData?.response?.rejectedOrders || 0,
    },
  };

  const SummaryCard = OrderSummaryCard as React.ComponentType<any>;
  const orders = allOrdersData?.response?.orders || [];

  // Show loading when: initial load OR switching tabs/filters
  const isInitialLoading = isOrdersLoading && !allOrdersData;
  const isTabSwitching = isOrdersFetching && orders.length === 0;
  const shouldShowLoading = isInitialLoading || isTabSwitching;

  const isQueryRefreshing =
    refreshing || isOrdersFetching || isOrderStatsFetching;
  const hasOrdersError = Boolean(ordersError) && !allOrdersData;
  const hasStatsError = Boolean(orderStatsError) && !orderStatsData;
  const showError = hasOrdersError || hasStatsError;
  const activeTabLabel =
    TABS[activeTab as keyof typeof TABS]?.label || 'orders';
  const selectedTimeRangeLabel =
    TIME_RANGE_OPTIONS.find(option => option.value === timeRange)?.label ||
    'Last 3 Hours';
  const showEmptyState =
    !shouldShowLoading &&
    !showError &&
    !isQueryRefreshing &&
    orders.length === 0;

  const handleSelectTimeRange = (
    selectedTimeRange: (typeof TIME_RANGE_OPTIONS)[number]['value'],
  ) => {
    setTimeRange(selectedTimeRange);
    setIsTimeRangeMenuVisible(false);
  };

  // Stacked avatars for "All Vendors" display
  const MAX_VISIBLE_AVATARS = 4;
  const allShops: any[] = allOrdersData?.response?.shops || [];
  const transporters: any[] = allOrdersData?.response?.transporters || [];
  const visibleShops = allShops.slice(0, MAX_VISIBLE_AVATARS);
  const overflowCount = allShops.length - MAX_VISIBLE_AVATARS;
  const visibleTransporters = transporters.slice(0, MAX_VISIBLE_AVATARS);
  const transporterOverflowCount = transporters.length - MAX_VISIBLE_AVATARS;

  const selectedShop = selectedVendorId
    ? allShops.find(
        (s: any) => String(s.shop.shopId) === String(selectedVendorId),
      )
    : null;
  const selectedTransporter = selectedTransporterId
    ? transporters.find(
        (t: any) => String(t.transporter?.id) === String(selectedTransporterId),
      )
    : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.topSection}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>All Orders</Text>

          <TouchableOpacity
            style={[styles.filterButton, styles.activeFilterButton]}
            onPress={() => setIsTimeRangeMenuVisible(true)}>
            <View style={styles.filterButtonContent}>
              <Text
                style={[
                  styles.filterButtonText,
                  styles.activeFilterButtonText,
                ]}>
                {selectedTimeRangeLabel}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={18}
                color="#FFFFFF"
              />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={tabScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContainer}
          style={styles.tabScrollView}>
          {Object.values(TABS).map(tabItem => (
            <TouchableOpacity
              key={tabItem.value}
              onLayout={event => {
                tabLayoutsRef.current[tabItem.value] = {
                  x: event.nativeEvent.layout.x,
                  width: event.nativeEvent.layout.width,
                };

                if (tabItem.value === activeTab) {
                  requestAnimationFrame(scrollActiveTabIntoView);
                }
              }}
              onPress={() => setActiveTab(tabItem?.value)}
              style={[
                styles.tabButton,
                activeTab === tabItem?.value && styles.activeTabButton,
              ]}>
              <View style={styles.tabContent}>
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tabItem.value && styles.activeTabText,
                  ]}>
                  {tabItem?.label}
                </Text>
              </View>
              <View
                style={[
                  styles.countBadge,
                  activeTab === tabItem.value && styles.activeCountBadge,
                ]}>
                <Text
                  style={[
                    styles.countText,
                    activeTab === tabItem?.value && styles.activeCountText,
                  ]}>
                  {tabItem?.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Shop filter bar ── */}
        <View style={styles.shopFilterSection}>
          <TouchableOpacity
            style={styles.shopFilterButton}
            onPress={() => setIsVendorMenuVisible(true)}>
            <View style={styles.shopOptionContent}>
              {selectedVendorId ? (
                /* Single selected vendor – show its logo */
                <Image
                  source={{
                    uri: selectedShop?.shop?.logo,
                  }}
                  style={styles.selectedVendorImage}
                />
              ) : (
                /* All vendors – stacked avatar strip */
                <View style={styles.stackedAvatarsRow}>
                  {visibleShops.map((s: any, idx: number) =>
                    s.shop?.logo ? (
                      <Image
                        key={s.shop.shopId}
                        source={{uri: s.shop.logo}}
                        style={[
                          styles.stackedAvatar,
                          {
                            marginLeft: idx === 0 ? 0 : -8,
                            zIndex: MAX_VISIBLE_AVATARS - idx,
                          },
                        ]}
                      />
                    ) : (
                      <View
                        key={s.shop?.shopId ?? idx}
                        style={[
                          styles.stackedAvatar,
                          styles.stackedAvatarPlaceholder,
                          {
                            marginLeft: idx === 0 ? 0 : -8,
                            zIndex: MAX_VISIBLE_AVATARS - idx,
                          },
                        ]}
                      />
                    ),
                  )}
                  {overflowCount > 0 && (
                    <View
                      style={[
                        styles.stackedAvatar,
                        styles.stackedAvatarOverflow,
                        {marginLeft: -8, zIndex: 0},
                      ]}>
                      <Text style={styles.stackedAvatarOverflowText}>
                        +{overflowCount}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <Text style={styles.shopFilterButtonText} numberOfLines={1}>
                {selectedVendorId
                  ? selectedShop?.shop?.name || 'Selected vendor'
                  : `All (${allShops.length}) Vendors`}
              </Text>

              {selectedVendorId ? (
                <TouchableOpacity
                  style={styles.clearFilterButton}
                  onPress={() => setSelectedVendorId(null)}>
                  <MaterialCommunityIcons
                    name="close"
                    size={16}
                    color="#0F62FE"
                  />
                </TouchableOpacity>
              ) : null}
            </View>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={[styles.shopFilterButton, styles.transporterFilterButton]}
            onPress={() => setIsTransporterMenuVisible(true)}>
            <View style={styles.shopOptionContent}>
              {selectedTransporterId ? (
                <Image
                  source={{
                    uri: selectedTransporter?.transporter?.profilePictureUrl,
                  }}
                  style={styles.selectedVendorImage}
                />
              ) : (
                <View style={styles.stackedAvatarsRow}>
                  {visibleTransporters.map((t: any, idx: number) =>
                    t.transporter?.profilePictureUrl ? (
                      <Image
                        key={t.transporter.id}
                        source={{uri: t.transporter.profilePictureUrl}}
                        style={[
                          styles.stackedAvatar,
                          {
                            marginLeft: idx === 0 ? 0 : -8,
                            zIndex: MAX_VISIBLE_AVATARS - idx,
                          },
                        ]}
                      />
                    ) : (
                      <View
                        key={t.transporter?.id ?? idx}
                        style={[
                          styles.stackedAvatar,
                          styles.stackedAvatarPlaceholder,
                          {
                            marginLeft: idx === 0 ? 0 : -8,
                            zIndex: MAX_VISIBLE_AVATARS - idx,
                          },
                        ]}
                      />
                    ),
                  )}
                  {transporterOverflowCount > 0 && (
                    <View
                      style={[
                        styles.stackedAvatar,
                        styles.stackedAvatarOverflow,
                        {marginLeft: -8, zIndex: 0},
                      ]}>
                      <Text style={styles.stackedAvatarOverflowText}>
                        +{transporterOverflowCount}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <Text style={styles.shopFilterButtonText} numberOfLines={1}>
                {selectedTransporterId
                  ? selectedTransporter?.transporter?.name ||
                    'Selected transporter'
                  : `All (${transporters.length}) Transporters`}
              </Text>

              {selectedTransporterId ? (
                <TouchableOpacity
                  style={styles.clearFilterButton}
                  onPress={() => setSelectedTransporterId(null)}>
                  <MaterialCommunityIcons
                    name="close"
                    size={16}
                    color="#0F62FE"
                  />
                </TouchableOpacity>
              ) : null}
            </View>
          </TouchableOpacity> */}
        </View>
      </View>

      {/* ── Vendor Filter Modal ── */}
      <Modal
        transparent
        visible={isVendorMenuVisible}
        animationType="fade"
        onRequestClose={() => setIsVendorMenuVisible(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsVendorMenuVisible(false)}>
          {/* Stop touch propagation so tapping inside doesn't close modal */}
          <Pressable style={styles.dropdownCard} onPress={() => null}>
            <Text style={styles.dropdownTitle}>Select vendor</Text>
            {/* ScrollView replaces the fixed-height View so content never overflows */}
            <ScrollView
              style={styles.vendorListContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}>
              {allShops.map((s: any) => {
                const shop = s.shop || s;
                const isSelected =
                  String(shop.shopId) === String(selectedVendorId);

                return (
                  <TouchableOpacity
                    key={shop.shopId}
                    onPress={() => {
                      setSelectedVendorId(String(shop.shopId));
                      setIsVendorMenuVisible(false);
                    }}
                    style={[
                      styles.dropdownOption,
                      isSelected && styles.dropdownOptionSelected,
                    ]}>
                    <View style={styles.shopOptionContent}>
                      {shop.logo ? (
                        <Image
                          source={{uri: shop.logo}}
                          style={styles.shopOptionImage}
                        />
                      ) : (
                        <View style={styles.shopOptionImagePlaceholder} />
                      )}
                      <Text style={styles.dropdownOptionText}>{shop.name}</Text>
                    </View>
                    <Text
                      style={
                        isSelected
                          ? styles.dropdownOptionValueSelected
                          : styles.dropdownOptionValue
                      }>
                      {s.ordersCount ? `${s.ordersCount}` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        visible={isTransporterMenuVisible}
        animationType="fade"
        onRequestClose={() => setIsTransporterMenuVisible(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsTransporterMenuVisible(false)}>
          <Pressable style={styles.dropdownCard} onPress={() => null}>
            <Text style={styles.dropdownTitle}>Select transporter</Text>
            <ScrollView
              style={styles.vendorListContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}>
              {transporters.map((t: any) => {
                const transporter = t.transporter || t;
                const isSelected =
                  String(transporter.id) === String(selectedTransporterId);

                return (
                  <TouchableOpacity
                    key={transporter.id}
                    onPress={() => {
                      setSelectedTransporterId(String(transporter.id));
                      setIsTransporterMenuVisible(false);
                    }}
                    style={[
                      styles.dropdownOption,
                      isSelected && styles.dropdownOptionSelected,
                    ]}>
                    <View style={styles.shopOptionContent}>
                      {transporter.profilePictureUrl ? (
                        <Image
                          source={{uri: transporter.profilePictureUrl}}
                          style={styles.shopOptionImage}
                        />
                      ) : (
                        <View style={styles.shopOptionImagePlaceholder} />
                      )}
                      <Text style={styles.dropdownOptionText}>
                        {transporter.name}
                      </Text>
                    </View>
                    <Text
                      style={
                        isSelected
                          ? styles.dropdownOptionValueSelected
                          : styles.dropdownOptionValue
                      }>
                      {t.ordersCount ? `${t.ordersCount}` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        visible={isTimeRangeMenuVisible}
        animationType="fade"
        onRequestClose={() => setIsTimeRangeMenuVisible(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsTimeRangeMenuVisible(false)}>
          <Pressable style={styles.dropdownCard} onPress={() => null}>
            <Text style={styles.dropdownTitle}>Select time range</Text>
            {TIME_RANGE_OPTIONS.map(option => {
              const isSelected = option.value === timeRange;

              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => handleSelectTimeRange(option.value)}
                  style={[
                    styles.dropdownOption,
                    isSelected && styles.dropdownOptionSelected,
                  ]}>
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      isSelected && styles.dropdownOptionTextSelected,
                    ]}>
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.dropdownOptionValue,
                      isSelected && styles.dropdownOptionValueSelected,
                    ]}>
                    {option.value}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {shouldShowLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#0F62FE" />
          <Text style={styles.loadingTitle}>Loading orders</Text>
          <Text style={styles.loadingSubtitle}>
            Please wait while we fetch the latest vendor orders.
          </Text>
        </View>
      ) : showError ? (
        <View style={styles.stateContainer}>
          <Image
            source={require('../../assets/images/task-list.png')}
            style={styles.stateImage}
          />
          <Text style={styles.stateTitle}>Unable to load orders</Text>
          <Text style={styles.stateSubtitle}>
            {(ordersError as any)?.message ||
              (orderStatsError as any)?.message ||
              'Please try again in a moment.'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : showEmptyState ? (
        <View style={styles.stateContainer}>
          <Image
            source={require('../../assets/images/task-list.png')}
            style={styles.stateImage}
          />
          <Text style={styles.stateTitle}>No orders found</Text>
          <Text style={styles.stateSubtitle}>
            There are no {activeTabLabel.toLowerCase()} orders for this region
            right now.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={isQueryRefreshing}
              onRefresh={handleRefresh}
              colors={['#0F62FE']}
              tintColor="#0F62FE"
            />
          }>
          {orders.map((item: any) => (
            <SummaryCard
              key={`${activeTab}_${item.order.orderId}`}
              {...item.order}
              assignedPartnerDetails={item.assignedPartner}
              vendor={{
                ...item.shop,
                shopDetails: item.shop,
              }}
              showShopInfo={true}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default OrdersScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topSection: {
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.bricolageBold,
  },
  tabScrollView: {
    flexGrow: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 20,
  },
  contentScroll: {
    flex: 1,
  },
  tabButton: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  activeTabButton: {
    backgroundColor: '#0F62FE',
    borderColor: '#0F62FE',
  },
  tabText: {
    fontSize: 13,
    color: '#475569',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countBadge: {
    backgroundColor: '#64748B',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCountBadge: {
    backgroundColor: '#DBEAFE',
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONT_FAMILY.outfitBold,
  },
  activeCountText: {
    color: '#1D4ED8',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingTitle: {
    marginTop: 14,
    fontSize: 18,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.bricolageBold,
  },
  loadingSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748b',
    fontFamily: FONT_FAMILY.bricolageMedium,
    textAlign: 'center',
    lineHeight: 20,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  stateImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  stateTitle: {
    fontSize: 18,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.bricolageBold,
    textAlign: 'center',
  },
  stateSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    fontFamily: FONT_FAMILY.bricolageMedium,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#0F62FE',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONT_FAMILY.outfitBold,
  },
  inlineLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  inlineLoadingText: {
    color: '#475569',
    fontSize: 13,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  activeFilterButton: {
    backgroundColor: '#1d4ed8',
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
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 88,
  },
  dropdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 8},
    elevation: 8,
    // ← no maxHeight here; the ScrollView inside constrains content naturally
    overflow: 'hidden',
  },
  // ── Vendor list ScrollView (replaces the old fixed-height View) ──
  vendorListContainer: {
    maxHeight: 400,
  },
  dropdownTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontFamily: FONT_FAMILY.outfitBold,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  dropdownOptionSelected: {
    backgroundColor: '#DBEAFE',
  },
  dropdownOptionText: {
    color: '#334155',
    fontSize: 14,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  dropdownOptionTextSelected: {
    color: '#1D4ED8',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  dropdownOptionValue: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  dropdownOptionValueSelected: {
    color: '#1D4ED8',
  },
  shopFilterSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  shopFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0F62FE',
    backgroundColor: '#F0F7FF',
  },
  shopFilterButtonText: {
    flex: 1,
    fontSize: 13,
    color: '#0F62FE',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  transporterFilterButton: {
    marginTop: 0,
  },
  clearFilterButton: {
    padding: 4,
  },
  shopOptionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopOptionImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  shopOptionImagePlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedVendorImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  // ── Stacked avatars ──
  stackedAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackedAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F0F7FF', // matches button background for clean separation
    backgroundColor: '#E2E8F0',
  },
  stackedAvatarPlaceholder: {
    backgroundColor: '#CBD5E1',
  },
  stackedAvatarOverflow: {
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackedAvatarOverflowText: {
    fontSize: 9,
    color: '#1D4ED8',
    fontFamily: FONT_FAMILY.outfitBold,
  },
});
