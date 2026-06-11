import {SafeAreaView} from 'react-native-safe-area-context';
import RegionSelector from '../../components/common/RegionSelector';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {OrderStatCard} from '../../components/orders';
import {FONT_FAMILY} from '../../assets/constants/fonts';
import {useRegionsStore} from '../../store/regions/useRegionsStore';
import {
  useGetOrdersFinanceQuery,
  useGetOrderStatsQuery,
} from '../../apis/order';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {OrdersNavigationStackParamList} from '../../navigation/OrdersNavigation';

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeFilterId =
  | 'LAST_30_MIN'
  | 'LAST_1_HOUR'
  | 'LAST_3_HOUR'
  | 'TODAY'
  | 'LAST_WEEK'
  | 'LAST_1_MONTH'
  | 'THIS_MONTH'
  | 'THIS_YEAR'
  | 'ALL'
  | 'CUSTOM';

type OrdersNavigationStackProp = StackNavigationProp<
  OrdersNavigationStackParamList,
  'OrdersScreen'
>;

type FinanceServiceBreakdown = {
  serviceType?: string;
  totalOrders?: number;
  totalOrderSales?: number;
  averageOrderTimeMinutes?: number;
  platformFeeCollected?: number;
  deliveryFeeCollected?: number;
  packagingChargeCollected?: number;
  commissionCollected?: number;
  gstCollected?: number;
  totalChargesCollected?: number;
  netRevenue?: number;
  vendorPayout?: number;
  platformFeeRate?: number;
  deliveryFeeRate?: number;
  packagingChargeRate?: number;
  commissionPercent?: number;
  gstPercent?: number;
};

type FinanceCardConfig = {
  id: string;
  label: string;
  value: string;
  color: string;
  icon: React.ReactNode;
};

type ServiceMetricCardConfig = {
  id: string;
  label: string;
  value: string;
  color: string;
  icon: React.ReactNode;
  rateLabel?: string;
  rateValue?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const filterButtons: {id: TimeFilterId; label: string}[] = [
  {id: 'LAST_30_MIN', label: 'Last 30 Min'},
  {id: 'LAST_1_HOUR', label: 'Last Hour'},
  {id: 'LAST_3_HOUR', label: 'Last 3 Hours'},
  {id: 'TODAY', label: 'Today'},
  {id: 'LAST_WEEK', label: 'Last Week'},
  {id: 'LAST_1_MONTH', label: 'Last 30 Days'},
  {id: 'THIS_MONTH', label: 'This Month'},
  {id: 'THIS_YEAR', label: 'This Year'},
  {id: 'ALL', label: 'All Time'},
  {id: 'CUSTOM', label: 'Custom'},
];

const dashboardTabs: {id: 'ORDERS' | 'EARNINGS'; label: string}[] = [
  {id: 'ORDERS', label: 'Orders'},
  {id: 'EARNINGS', label: 'Earnings'},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const roundToTwo = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) return 0;
  return Number(value.toFixed(2));
};

const formatCurrency = (value?: number | null) => {
  const normalizedValue = roundToTwo(value);
  const hasDecimals = normalizedValue % 1 !== 0;
  return `₹${normalizedValue.toLocaleString('en-IN', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
};

const formatPercent = (value?: number | null) => {
  if (value === undefined || value === null) return '0%';
  return `${value}%`;
};

const formatRatePerOrder = (value?: number | null) =>
  `${formatCurrency(value)}/order`;

/** Format a Date as "DD MMM YYYY" for display */
const formatDateLabel = (date: Date) =>
  date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

/** Convert Date → "YYYY-MM-DD" for the API */
const toISODate = (date: Date) => date.toISOString().split('T')[0];

// ─── Sub-components ───────────────────────────────────────────────────────────

const FinanceCardGrid = ({items}: {items: FinanceCardConfig[]}) => (
  <View style={styles.financeCardsGrid}>
    {items.map(item => (
      <OrderStatCard
        key={item.id}
        size="m"
        label={item.label}
        value={item.value}
        color={item.color}
        icon={item.icon}
      />
    ))}
  </View>
);

const ServiceMetricGrid = ({items}: {items: ServiceMetricCardConfig[]}) => (
  <View style={styles.serviceMetricGrid}>
    {items.map(item => (
      <View
        key={item.id}
        style={[styles.serviceMetricCard, {backgroundColor: item.color}]}>
        <View style={styles.serviceMetricTopRow}>
          <Text style={styles.serviceMetricLabel} numberOfLines={2}>
            {item.label}
          </Text>
          <View style={styles.serviceMetricIcon}>{item.icon}</View>
        </View>
        <Text style={styles.serviceMetricValue} numberOfLines={1}>
          {item.value}
        </Text>
        {item.rateValue ? (
          <View style={styles.serviceMetricRateRow}>
            <Text style={styles.serviceMetricRateLabel}>
              {item.rateLabel || 'Rate'}
            </Text>
            <Text style={styles.serviceMetricRateValue} numberOfLines={1}>
              {item.rateValue}
            </Text>
          </View>
        ) : null}
      </View>
    ))}
  </View>
);

const FinanceServiceCard = ({item}: {item: FinanceServiceBreakdown}) => (
  <View style={styles.financeBreakdownCard}>
    <View style={styles.financeBreakdownHeader}>
      <View>
        <Text style={styles.financeBreakdownTitle}>{item.serviceType}</Text>
        <Text style={styles.financeBreakdownSubtitle}>
          {item.totalOrders ?? 0} completed orders ·{' '}
          {formatCurrency(item.totalOrderSales)} sales
        </Text>
      </View>
      <View style={styles.financeBreakdownPayoutChip}>
        <Text style={styles.financeBreakdownPayoutLabel}>Vendor</Text>
        <Text style={styles.financeBreakdownPayoutValue}>
          {formatCurrency(
            roundToTwo(
              (item.totalOrderSales ?? 0) - (item.totalChargesCollected ?? 0),
            ),
          )}
        </Text>
      </View>
    </View>

    <FinanceCardGrid
      items={[
        {
          id: `${item.serviceType}-orders`,
          label: 'Completed Orders',
          value: String(item.totalOrders ?? 0),
          color: '#E0F2FE',
          icon: (
            <MaterialCommunityIcons
              name="package-variant"
              size={32}
              color="#0284C7"
            />
          ),
        },
        {
          id: `${item.serviceType}-time`,
          label: 'Average Order Delivery Time',
          value: `${String(
            item?.averageOrderTimeMinutes?.toFixed(0) ?? 0,
          )} mins`,
          color: '#E0F2FE',
          icon: (
            <MaterialCommunityIcons
              name="clock-outline"
              size={32}
              color="#0284C7"
            />
          ),
        },
        {
          id: `${item.serviceType}-sales`,
          label: 'Total Order Sales',
          value: formatCurrency(item.totalOrderSales),
          color: '#DBEAFE',
          icon: (
            <MaterialCommunityIcons
              name="cash-multiple"
              size={32}
              color="#2563EB"
            />
          ),
        },
        {
          id: `${item.serviceType}-aov`,
          label: 'Average Order Value',
          value: formatCurrency(
            item.totalOrders
              ? (item.totalOrderSales ?? 0) / item.totalOrders
              : 0,
          ),
          color: '#DCFCE7',
          icon: (
            <MaterialCommunityIcons
              name="chart-line-variant"
              size={32}
              color="#16A34A"
            />
          ),
        },
        {
          id: `${item.serviceType}-vendor`,
          label: 'Vendor Payout',
          value: formatCurrency(
            roundToTwo(
              (item.totalOrderSales ?? 0) - (item.totalChargesCollected ?? 0),
            ),
          ),
          color: '#FCE7F3',
          icon: (
            <MaterialCommunityIcons
              name="account-cash-outline"
              size={32}
              color="#DB2777"
            />
          ),
        },
        {
          id: `${item.serviceType}-collected`,
          label: 'Collected Amount',
          value: formatCurrency(
            roundToTwo(
              (item.totalOrderSales ?? 0) + (item.totalChargesCollected ?? 0),
            ),
          ),
          color: '#FEF3C7',
          icon: (
            <MaterialCommunityIcons
              name="wallet-outline"
              size={32}
              color="#D97706"
            />
          ),
        },
      ]}
    />

    <View style={styles.financeSectionDivider} />
    <Text style={styles.financeBreakdownSectionTitle}>Service Metrics</Text>
    <Text style={styles.financeBreakdownSectionSubtitle}>
      Value and rate are shown together in each card.
    </Text>

    <ServiceMetricGrid
      items={[
        {
          id: `${item.serviceType}-gst`,
          label: 'GST Collected',
          value: formatCurrency(item.gstCollected),
          color: '#DCFCE7',
          icon: (
            <MaterialCommunityIcons
              name="file-document-outline"
              size={28}
              color="#16A34A"
            />
          ),
          rateLabel: 'Rate',
          rateValue: formatPercent(item.gstPercent),
        },
        {
          id: `${item.serviceType}-commission`,
          label: 'Commission Earned',
          value: formatCurrency(item.commissionCollected),
          color: '#FEE2E2',
          icon: (
            <MaterialCommunityIcons
              name="percent-outline"
              size={28}
              color="#DC2626"
            />
          ),
          rateLabel: 'Rate',
          rateValue: formatPercent(item.commissionPercent),
        },
        {
          id: `${item.serviceType}-delivery`,
          label: 'Delivery Fee Collected',
          value: formatCurrency(item.deliveryFeeCollected),
          color: '#E0F2FE',
          icon: (
            <MaterialCommunityIcons
              name="truck-fast-outline"
              size={28}
              color="#0EA5E9"
            />
          ),
          rateLabel: 'Rate',
          rateValue: formatRatePerOrder(item.deliveryFeeRate),
        },
        {
          id: `${item.serviceType}-platform`,
          label: 'Platform Fee Collected',
          value: formatCurrency(item.platformFeeCollected),
          color: '#E0E7FF',
          icon: (
            <MaterialCommunityIcons
              name="storefront-outline"
              size={28}
              color="#4F46E5"
            />
          ),
          rateLabel: 'Rate',
          rateValue: formatRatePerOrder(item.platformFeeRate),
        },
        {
          id: `${item.serviceType}-packaging`,
          label: 'Packaging Charges',
          value: formatCurrency(item.packagingChargeCollected),
          color: '#FFF7ED',
          icon: (
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={28}
              color="#EA580C"
            />
          ),
          rateLabel: 'Rate',
          rateValue: formatRatePerOrder(item.packagingChargeRate),
        },
        {
          id: `${item.serviceType}-total`,
          label: 'Total Platform Earnings',
          value: formatCurrency(item.totalChargesCollected),
          color: '#F3F4F6',
          icon: (
            <MaterialCommunityIcons
              name="wallet-outline"
              size={28}
              color="#4B5563"
            />
          ),
        },
      ]}
    />
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const OrderStatsScreen = () => {
  const navigation = useNavigation<OrdersNavigationStackProp>();
  const {selectedRegion} = useRegionsStore(state => state);

  const [timeFilter, setTimeFilter] =
    React.useState<TimeFilterId>('LAST_1_HOUR');
  const [activeTab, setActiveTab] = React.useState<'ORDERS' | 'EARNINGS'>(
    'ORDERS',
  );
  const [showFormulaHint, setShowFormulaHint] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  // ── Custom date range state ──
  const [isCustomModalVisible, setIsCustomModalVisible] = React.useState(false);
  // Drafts shown inside the modal before confirming
  const [draftStart, setDraftStart] = React.useState<Date>(new Date());
  const [draftEnd, setDraftEnd] = React.useState<Date>(new Date());
  // Confirmed custom range sent to the API
  const [customStart, setCustomStart] = React.useState<Date | null>(null);
  const [customEnd, setCustomEnd] = React.useState<Date | null>(null);
  // Which picker is currently shown on Android (one at a time)
  const [androidPicker, setAndroidPicker] = React.useState<
    'start' | 'end' | null
  >(null);

  // ── Build query params ──
  // When CUSTOM is active, pass fromDate/toDate and timeRange=CUSTOM.
  // For all other filters, pass timeRange and no dates.
  const queryParams = React.useMemo(() => {
    const base = {regionId: selectedRegion?.regionId || ''};
    if (timeFilter === 'CUSTOM' && customStart && customEnd) {
      return {
        ...base,
        timeRange: 'CUSTOM' as const,
        fromDate: toISODate(customStart),
        toDate: toISODate(customEnd),
      };
    }
    return {...base, timeRange: timeFilter};
  }, [timeFilter, customStart, customEnd, selectedRegion?.regionId]);

  const {
    data: orderStatsData,
    error,
    refetch: refetchOrderStats,
    isLoading: isOrderStatsLoading,
    isFetching: isOrderStatsFetching,
  } = useGetOrderStatsQuery(queryParams, {pollingInterval: 180000});

  const {
    data: orderFinanceData,
    error: financeError,
    refetch: refetchFinance,
    isLoading: isFinanceLoading,
    isFetching: isFinanceFetching,
  } = useGetOrdersFinanceQuery(queryParams);

  const financeData = orderFinanceData?.result;
  const serviceBreakdown: FinanceServiceBreakdown[] =
    financeData?.serviceBreakdown || [];
  const combinedCompletedOrders = financeData?.totalOrders ?? 0;
  const combinedTotalOrderSales = roundToTwo(financeData?.totalOrderSales);
  const combinedTotalChargesCollected = roundToTwo(
    financeData?.totalChargesCollected,
  );
  const combinedCollectedAmount = roundToTwo(
    combinedTotalOrderSales + combinedTotalChargesCollected,
  );
  const combinedAverageOrderValue = combinedCompletedOrders
    ? roundToTwo(combinedTotalOrderSales / combinedCompletedOrders)
    : 0;
  const combinedVendorPayout = roundToTwo(
    combinedTotalOrderSales - combinedTotalChargesCollected,
  );

  const handleRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([refetchOrderStats(), refetchFinance()])
      .then(() => setRefreshing(false))
      .catch(() => setRefreshing(false));
  }, [refetchFinance, refetchOrderStats]);

  // ── Custom date modal handlers ──

  const openCustomModal = () => {
    // Pre-fill drafts with last confirmed range or today
    setDraftStart(customStart ?? new Date());
    setDraftEnd(customEnd ?? new Date());
    setIsCustomModalVisible(true);
  };

  const confirmCustomRange = () => {
    setCustomStart(draftStart);
    setCustomEnd(draftEnd);
    setTimeFilter('CUSTOM');
    setIsCustomModalVisible(false);
  };

  const handleFilterPress = (id: TimeFilterId) => {
    if (id === 'CUSTOM') {
      openCustomModal();
    } else {
      setTimeFilter(id);
      // Clear custom range so stale dates don't persist if user switches back
      setCustomStart(null);
      setCustomEnd(null);
    }
  };

  // Android: show pickers sequentially (start → end)
  const handleAndroidDateChange = (
    event: DateTimePickerEvent,
    selected?: Date,
  ) => {
    if (event.type === 'dismissed') {
      setAndroidPicker(null);
      return;
    }
    if (androidPicker === 'start') {
      setDraftStart(selected ?? draftStart);
      setAndroidPicker('end'); // immediately open end picker
    } else if (androidPicker === 'end') {
      setDraftEnd(selected ?? draftEnd);
      setAndroidPicker(null);
    }
  };

  // ── Active filter label (shows date range when CUSTOM is active) ──
  const customLabel =
    timeFilter === 'CUSTOM' && customStart && customEnd
      ? `${formatDateLabel(customStart)} – ${formatDateLabel(customEnd)}`
      : null;

  // ── Render helpers ──

  const renderFilterButtons = () => (
    <View style={styles.filterWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}>
        {filterButtons.map(filter => {
          const isActive = timeFilter === filter.id;
          return (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                isActive && styles.activeFilterButton,
                filter.id === 'CUSTOM' && styles.customFilterButton,
                filter.id === 'CUSTOM' &&
                  isActive &&
                  styles.customFilterButtonActive,
              ]}
              onPress={() => handleFilterPress(filter.id)}>
              {filter.id === 'CUSTOM' ? (
                <View style={styles.customFilterContent}>
                  <MaterialCommunityIcons
                    name="calendar-range"
                    size={14}
                    color={isActive ? '#ffffff' : '#0f62fe'}
                    style={{marginRight: 4}}
                  />
                  <Text
                    style={[
                      styles.filterButtonText,
                      isActive && styles.activeFilterButtonText,
                      !isActive && {color: '#0f62fe'},
                    ]}>
                    {isActive && customLabel ? customLabel : 'Custom'}
                  </Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.filterButtonText,
                    isActive && styles.activeFilterButtonText,
                  ]}>
                  {filter.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderTabButtons = () => (
    <View style={styles.tabWrapper}>
      <View style={styles.tabContainer}>
        {dashboardTabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab(tab.id)}>
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText,
              ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const {
    pendingOrders,
    acceptedOrders,
    inTransitOrders,
    completedOrders,
    cancelledOrders,
    rejectedOrders,
    totalOrders,
  } = orderStatsData?.response || {};

  const isOrderLoading = isOrderStatsLoading || isOrderStatsFetching;
  const isFinanceBusy = isFinanceLoading || isFinanceFetching;

  const renderOrdersTab = () => (
    <>
      <View style={styles.tilesGrid}>
        <OrderStatCard
          size="m"
          label="Pending"
          value={isOrderLoading ? '—' : pendingOrders}
          color="#FEF3C7"
          icon={
            <MaterialCommunityIcons
              name="clock-outline"
              size={32}
              color="#D97706"
            />
          }
          onPress={() =>
            navigation.navigate('OrdersScreen', {orderStatus: 'PENDING'})
          }
        />
        <OrderStatCard
          size="m"
          label="Accepted"
          value={isOrderLoading ? '—' : acceptedOrders}
          color="#DBEAFE"
          icon={
            <MaterialCommunityIcons
              name="thumb-up-outline"
              size={32}
              color="#2563EB"
            />
          }
          onPress={() =>
            navigation.navigate('OrdersScreen', {orderStatus: 'ACCEPTED'})
          }
        />
        <OrderStatCard
          size="m"
          label="Shipped"
          value={isOrderLoading ? '—' : inTransitOrders}
          color="#EDE9FE"
          icon={
            <MaterialCommunityIcons
              name="truck-delivery-outline"
              size={32}
              color="#7C3AED"
            />
          }
          onPress={() =>
            navigation.navigate('OrdersScreen', {orderStatus: 'SHIPPED'})
          }
        />
        <OrderStatCard
          size="m"
          label="Completed"
          value={isOrderLoading ? '—' : completedOrders}
          color="#DCFCE7"
          icon={
            <MaterialCommunityIcons
              name="checkbox-marked-circle-outline"
              size={32}
              color="#16A34A"
            />
          }
          onPress={() =>
            navigation.navigate('OrdersScreen', {orderStatus: 'COMPLETED'})
          }
        />
        <OrderStatCard
          size="m"
          label="Cancelled"
          value={isOrderLoading ? '—' : cancelledOrders}
          color="#FEE2E2"
          icon={
            <MaterialCommunityIcons name="cancel" size={32} color="#DC2626" />
          }
          onPress={() =>
            navigation.navigate('OrdersScreen', {orderStatus: 'CANCELLED'})
          }
        />
        <OrderStatCard
          size="m"
          label="Rejected"
          value={isOrderLoading ? '—' : rejectedOrders}
          color="#FFEDD5"
          icon={
            <MaterialCommunityIcons
              name="alert-octagon-outline"
              size={32}
              color="#EA580C"
            />
          }
          onPress={() =>
            navigation.navigate('OrdersScreen', {orderStatus: 'REJECTED'})
          }
        />
        <OrderStatCard
          size="m"
          label="Total Orders"
          value={isOrderLoading ? '—' : totalOrders}
          color="#F3F4F6"
          icon={
            <MaterialCommunityIcons
              name="clipboard-list-outline"
              size={32}
              color="#4B5563"
            />
          }
        />
        <OrderStatCard
          size="m"
          label="Order History"
          value="View"
          color="#EFF6FF"
          icon={
            <MaterialCommunityIcons name="history" size={32} color="#0f62fe" />
          }
          onPress={() => navigation.navigate('OrderHistoryScreen')}
        />
      </View>
      {completedOrders > 0 && (
        <View style={{...styles.motivationBanner, marginBottom: 5}}>
          <MaterialCommunityIcons
            name="trophy-outline"
            size={40}
            color="#f59e0b"
            style={styles.trophyIcon}
          />
          <View style={styles.motivationText}>
            <Text style={styles.motivationTitle}>Great Job Captain! 🎉</Text>
            <Text style={styles.motivationSubtitle}>
              You completed{' '}
              <Text style={{fontFamily: FONT_FAMILY.bricolageBold}}>
                {isOrderLoading ? '—' : completedOrders}
              </Text>{' '}
              orders{' '}
              {timeFilter === 'CUSTOM' && customStart && customEnd
                ? `from ${formatDateLabel(customStart)} to ${formatDateLabel(
                    customEnd,
                  )}`
                : timeFilter === 'LAST_30_MIN'
                ? 'in the last 30 minutes'
                : timeFilter === 'LAST_1_HOUR'
                ? 'in the last hour'
                : timeFilter === 'LAST_3_HOUR'
                ? 'in the last 3 hours'
                : timeFilter === 'TODAY'
                ? 'today'
                : timeFilter === 'LAST_WEEK'
                ? 'in the last week'
                : timeFilter === 'LAST_1_MONTH'
                ? 'in the last 30 days'
                : timeFilter === 'THIS_MONTH'
                ? 'this month'
                : timeFilter === 'THIS_YEAR'
                ? 'this year'
                : timeFilter === 'ALL'
                ? 'for all time'
                : 'this month'}
              .
            </Text>
          </View>
        </View>
      )}
    </>
  );

  const renderFinanceTab = () => (
    <>
      <Pressable
        onPress={() => setShowFormulaHint(current => !current)}
        style={({pressed}) => [
          styles.financeHeroCard,
          pressed && styles.financeHeroCardPressed,
        ]}>
        <View style={styles.financeHeroHeader}>
          <View>
            <Text style={styles.financeHeroTitle}>Finance Snapshot</Text>
            <Text style={styles.financeHeroSubtitle}>
              {timeFilter === 'CUSTOM' && customStart && customEnd
                ? `${formatDateLabel(customStart)} – ${formatDateLabel(
                    customEnd,
                  )}`
                : timeFilter}
            </Text>
          </View>
          <View style={styles.financeHeroBadge}>
            <Text style={styles.financeHeroBadgeLabel}>Collected</Text>
            <Text style={styles.financeHeroBadgeValue}>
              {isFinanceBusy ? '—' : formatCurrency(combinedCollectedAmount)}
            </Text>
          </View>
        </View>
        <Text style={styles.financeHeroDescription}>
          Tap to see the formulas used for the combined finance summary.
        </Text>
        {showFormulaHint ? (
          <View style={styles.financeFormulaBox}>
            <Text style={styles.financeFormulaText}>
              Collected Amount = Total Order Sales + Total Charges Collected
            </Text>
            <Text style={styles.financeFormulaText}>
              Vendor Payout = Total Order Sales - Total Charges Collected
            </Text>
          </View>
        ) : null}
      </Pressable>

      <View style={styles.financeSectionHeader}>
        <Text style={styles.financeSectionTitle}>Combined Summary</Text>
        <Text style={styles.financeSectionSubtitle}>
          Aggregated totals only. Rates are hidden here because they differ by
          service.
        </Text>
      </View>

      <FinanceCardGrid
        items={[
          {
            id: 'combined-orders',
            label: 'Total Completed Orders',
            value: isFinanceBusy ? '—' : String(combinedCompletedOrders),
            color: '#E0F2FE',
            icon: (
              <MaterialCommunityIcons
                name="package-variant"
                size={32}
                color="#0284C7"
              />
            ),
          },
          {
            id: 'combined-aod',
            label: 'Average Order Delivery Time',
            value: isFinanceBusy
              ? '—'
              : `${String(
                  financeData?.averageOrderTimeMinutes?.toFixed(0),
                )} mins`,
            color: '#E0F2FE',
            icon: (
              <MaterialCommunityIcons
                name="clock-outline"
                size={32}
                color="#0284C7"
              />
            ),
          },
          {
            id: 'combined-collected',
            label: 'Collected Amount',
            value: isFinanceBusy
              ? '—'
              : formatCurrency(combinedCollectedAmount),
            color: '#DBEAFE',
            icon: (
              <MaterialCommunityIcons
                name="cash-multiple"
                size={32}
                color="#2563EB"
              />
            ),
          },
          {
            id: 'combined-sales',
            label: 'Total Order Sales',
            value: isFinanceBusy
              ? '—'
              : formatCurrency(combinedTotalOrderSales),
            color: '#DCFCE7',
            icon: (
              <MaterialCommunityIcons
                name="chart-line-variant"
                size={32}
                color="#16A34A"
              />
            ),
          },
          {
            id: 'combined-aov',
            label: 'Average Order Value',
            value: isFinanceBusy
              ? '—'
              : formatCurrency(combinedAverageOrderValue),
            color: '#FEF3C7',
            icon: (
              <MaterialCommunityIcons
                name="calculator-variant-outline"
                size={32}
                color="#D97706"
              />
            ),
          },
          {
            id: 'combined-vendor',
            label: 'Vendor Payout',
            value: isFinanceBusy ? '—' : formatCurrency(combinedVendorPayout),
            color: '#FCE7F3',
            icon: (
              <MaterialCommunityIcons
                name="account-cash-outline"
                size={32}
                color="#DB2777"
              />
            ),
          },
        ]}
      />

      <View style={styles.financeSectionHeader}>
        <Text style={styles.financeSectionTitle}>Platform Earnings</Text>
        <Text style={styles.financeSectionSubtitle}>
          Breakdown of the money retained by the platform.
        </Text>
      </View>

      <FinanceCardGrid
        items={[
          {
            id: 'gst',
            label: 'GST Collected',
            value: isFinanceBusy
              ? '—'
              : formatCurrency(financeData?.gstCollected),
            color: '#DCFCE7',
            icon: (
              <MaterialCommunityIcons
                name="file-document-outline"
                size={32}
                color="#16A34A"
              />
            ),
          },
          {
            id: 'commission',
            label: 'Commission Earned',
            value: isFinanceBusy
              ? '—'
              : formatCurrency(financeData?.commissionCollected),
            color: '#FEE2E2',
            icon: (
              <MaterialCommunityIcons
                name="percent-outline"
                size={32}
                color="#DC2626"
              />
            ),
          },
          {
            id: 'delivery',
            label: 'Delivery Fee Collected',
            value: isFinanceBusy
              ? '—'
              : formatCurrency(financeData?.deliveryFeeCollected),
            color: '#E0F2FE',
            icon: (
              <MaterialCommunityIcons
                name="truck-fast-outline"
                size={32}
                color="#0EA5E9"
              />
            ),
          },
          {
            id: 'platform',
            label: 'Platform Fee Collected',
            value: isFinanceBusy
              ? '—'
              : formatCurrency(financeData?.platformFeeCollected),
            color: '#E0E7FF',
            icon: (
              <MaterialCommunityIcons
                name="storefront-outline"
                size={32}
                color="#4F46E5"
              />
            ),
          },
          {
            id: 'packaging',
            label: 'Packaging Charges',
            value: isFinanceBusy
              ? '—'
              : formatCurrency(financeData?.packagingChargeCollected),
            color: '#FFF7ED',
            icon: (
              <MaterialCommunityIcons
                name="package-variant-closed"
                size={32}
                color="#EA580C"
              />
            ),
          },
          {
            id: 'platform-total',
            label: 'Total Platform Earnings',
            value: isFinanceBusy
              ? '—'
              : formatCurrency(combinedTotalChargesCollected),
            color: '#F3F4F6',
            icon: (
              <MaterialCommunityIcons
                name="wallet-outline"
                size={32}
                color="#4B5563"
              />
            ),
          },
        ]}
      />

      <View style={styles.financeSectionHeader}>
        <Text style={styles.financeSectionTitle}>Service Breakdown</Text>
        <Text style={styles.financeSectionSubtitle}>
          Grocery and food stay separate so their rates remain meaningful.
        </Text>
      </View>

      {serviceBreakdown.length > 0 ? (
        serviceBreakdown.map(item => (
          <FinanceServiceCard key={item.serviceType} item={item} />
        ))
      ) : (
        <View style={styles.financeEmptyState}>
          <Text style={styles.financeEmptyStateText}>
            No service breakdown available for the selected filters.
          </Text>
        </View>
      )}
    </>
  );

  // ── Custom date range modal ──
  const renderCustomDateModal = () => {
    const isValidRange = draftStart <= draftEnd;

    return (
      <Modal
        visible={isCustomModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCustomModalVisible(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsCustomModalVisible(false)}>
          <Pressable style={styles.customModalCard} onPress={() => null}>
            {/* Header */}
            <View style={styles.customModalHeader}>
              <MaterialCommunityIcons
                name="calendar-range"
                size={20}
                color="#0f62fe"
              />
              <Text style={styles.customModalTitle}>Select Date Range</Text>
              <TouchableOpacity
                onPress={() => setIsCustomModalVisible(false)}
                hitSlop={8}>
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            {/* Date rows */}
            {Platform.OS === 'ios' ? (
              // iOS: show both pickers inline
              <>
                <View style={styles.datePickerRow}>
                  <View style={styles.datePickerLabelCol}>
                    <MaterialCommunityIcons
                      name="calendar-start"
                      size={16}
                      color="#0f62fe"
                    />
                    <Text style={styles.datePickerLabel}>Start Date</Text>
                  </View>
                  <DateTimePicker
                    value={draftStart}
                    mode="date"
                    display="compact"
                    maximumDate={draftEnd}
                    onChange={(_e, date) => date && setDraftStart(date)}
                    style={styles.datePickerIOS}
                  />
                </View>

                <View style={styles.datePickerDivider} />

                <View style={styles.datePickerRow}>
                  <View style={styles.datePickerLabelCol}>
                    <MaterialCommunityIcons
                      name="calendar-end"
                      size={16}
                      color="#0f62fe"
                    />
                    <Text style={styles.datePickerLabel}>End Date</Text>
                  </View>
                  <DateTimePicker
                    value={draftEnd}
                    mode="date"
                    display="compact"
                    minimumDate={draftStart}
                    maximumDate={new Date()}
                    onChange={(_e, date) => date && setDraftEnd(date)}
                    style={styles.datePickerIOS}
                  />
                </View>
              </>
            ) : (
              // Android: tappable date buttons that open the native picker
              <>
                <TouchableOpacity
                  style={styles.datePickerRow}
                  onPress={() => setAndroidPicker('start')}>
                  <View style={styles.datePickerLabelCol}>
                    <MaterialCommunityIcons
                      name="calendar-start"
                      size={16}
                      color="#0f62fe"
                    />
                    <Text style={styles.datePickerLabel}>Start Date</Text>
                  </View>
                  <View style={styles.androidDateChip}>
                    <Text style={styles.androidDateChipText}>
                      {formatDateLabel(draftStart)}
                    </Text>
                    <MaterialCommunityIcons
                      name="chevron-down"
                      size={16}
                      color="#0f62fe"
                    />
                  </View>
                </TouchableOpacity>

                <View style={styles.datePickerDivider} />

                <TouchableOpacity
                  style={styles.datePickerRow}
                  onPress={() => setAndroidPicker('end')}>
                  <View style={styles.datePickerLabelCol}>
                    <MaterialCommunityIcons
                      name="calendar-end"
                      size={16}
                      color="#0f62fe"
                    />
                    <Text style={styles.datePickerLabel}>End Date</Text>
                  </View>
                  <View style={styles.androidDateChip}>
                    <Text style={styles.androidDateChipText}>
                      {formatDateLabel(draftEnd)}
                    </Text>
                    <MaterialCommunityIcons
                      name="chevron-down"
                      size={16}
                      color="#0f62fe"
                    />
                  </View>
                </TouchableOpacity>

                {/* Native Android picker rendered outside the modal UI */}
                {androidPicker !== null && (
                  <DateTimePicker
                    value={androidPicker === 'start' ? draftStart : draftEnd}
                    mode="date"
                    display="default"
                    maximumDate={
                      androidPicker === 'start' ? draftEnd : new Date()
                    }
                    minimumDate={
                      androidPicker === 'end' ? draftStart : undefined
                    }
                    onChange={handleAndroidDateChange}
                  />
                )}
              </>
            )}

            {/* Validation hint */}
            {!isValidRange && (
              <Text style={styles.dateValidationError}>
                Start date must be on or before end date.
              </Text>
            )}

            {/* Preview chip */}
            {isValidRange && (
              <View style={styles.datePreviewChip}>
                <MaterialCommunityIcons
                  name="calendar-check"
                  size={14}
                  color="#0f62fe"
                />
                <Text style={styles.datePreviewText}>
                  {formatDateLabel(draftStart)} → {formatDateLabel(draftEnd)}
                </Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.customModalActions}>
              <TouchableOpacity
                style={styles.customModalCancelBtn}
                onPress={() => setIsCustomModalVisible(false)}>
                <Text style={styles.customModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.customModalApplyBtn,
                  !isValidRange && styles.customModalApplyBtnDisabled,
                ]}
                disabled={!isValidRange}
                onPress={confirmCustomRange}>
                <Text style={styles.customModalApplyText}>Apply Range</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  // ── Main render ──

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Orders Dashboard</Text>
          <TouchableOpacity
            style={[styles.filterButton, styles.activeFilterButton]}>
            <RegionSelector />
          </TouchableOpacity>
        </View>

        <View style={{...styles.addressHeader}} />

        <View style={styles.content}>
          <ScrollView
            style={styles.container}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#0f62fe"
                colors={['#0f62fe']}
              />
            }>
            {renderFilterButtons()}
            {renderTabButtons()}

            {!selectedRegion ? (
              <View style={styles.emptyStateContainer}>
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
            ) : activeTab === 'ORDERS' && error ? (
              <View style={styles.errorContainer}>
                <View style={styles.errorContent}>
                  <Image
                    source={require('../../assets/images/task-list.png')}
                    style={styles.errorImage}
                  />
                  <Text style={styles.errorTitle}>Unable to Load Stats</Text>
                  <Text style={styles.errorMessage}>
                    {(error as any)?.message || 'Please try again later'}
                  </Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleRefresh}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : activeTab === 'EARNINGS' && financeError ? (
              <View style={styles.errorContainer}>
                <View style={styles.errorContent}>
                  <Image
                    source={require('../../assets/images/task-list.png')}
                    style={styles.errorImage}
                  />
                  <Text style={styles.errorTitle}>Unable to Load Earnings</Text>
                  <Text style={styles.errorMessage}>
                    {(financeError as any)?.message || 'Please try again later'}
                  </Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleRefresh}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.tabContent}>
                {activeTab === 'ORDERS'
                  ? renderOrdersTab()
                  : renderFinanceTab()}
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Custom date range modal (outside ScrollView so it overlays correctly) */}
      {renderCustomDateModal()}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#f5f5f5'},
  container: {flex: 1},
  header: {
    paddingHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.bricolageBold,
  },
  addressHeader: {paddingHorizontal: 16, paddingBottom: 12},
  tabWrapper: {paddingHorizontal: 16, paddingBottom: 4},
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 999,
  },
  activeTabButton: {backgroundColor: '#0f62fe'},
  tabText: {
    color: '#334155',
    fontSize: 13,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  activeTabText: {color: '#ffffff', fontFamily: FONT_FAMILY.outfitBold},
  content: {flex: 1},
  filterWrapper: {width: '100%', minHeight: 56, paddingLeft: 14},
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  activeFilterButton: {backgroundColor: '#1d4ed8'},
  // Custom button gets a distinct outlined style when inactive
  customFilterButton: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#0f62fe',
  },
  customFilterButtonActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  customFilterContent: {flexDirection: 'row', alignItems: 'center'},
  filterButtonText: {
    color: '#334155',
    fontSize: 13,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  activeFilterButtonText: {color: 'white', fontFamily: FONT_FAMILY.outfitBold},
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 6,
    marginTop: 4,
  },
  tabContent: {paddingBottom: 8},
  motivationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 3},
    elevation: 2,
  },
  trophyIcon: {marginRight: 14},
  motivationText: {flex: 1},
  motivationTitle: {
    fontSize: 15,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.outfitBold,
    marginBottom: 2,
  },
  motivationSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  emptyStateContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#f5f5f5',
    marginTop: 40,
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
  errorContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    backgroundColor: '#f5f5f5',
  },
  errorContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  errorImage: {
    width: 50,
    height: 50,
    marginBottom: 20,
    resizeMode: 'contain',
    tintColor: '#ef4444',
  },
  errorTitle: {
    fontSize: 20,
    marginBottom: 12,
    color: '#dc2626',
    fontFamily: FONT_FAMILY.outfitBold,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#7f1d1d',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  retryButton: {
    backgroundColor: '#0f62fe',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontFamily: FONT_FAMILY.outfitBold,
    fontSize: 14,
  },
  // Finance styles (unchanged from original)
  financeHeroCard: {
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#1e3a8a',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 6},
    elevation: 2,
  },
  financeHeroCardPressed: {transform: [{scale: 0.99}], opacity: 0.98},
  financeHeroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  financeHeroTitle: {
    fontSize: 18,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  financeHeroSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#475569',
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  financeHeroBadge: {
    alignItems: 'flex-end',
    backgroundColor: '#0f62fe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  financeHeroBadgeLabel: {
    fontSize: 11,
    color: '#dbeafe',
    fontFamily: FONT_FAMILY.bricolageMedium,
    textTransform: 'uppercase',
  },
  financeHeroBadgeValue: {
    marginTop: 4,
    fontSize: 18,
    color: '#ffffff',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  financeHeroDescription: {
    marginTop: 12,
    fontSize: 12,
    color: '#1d4ed8',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  financeFormulaBox: {
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
  },
  financeFormulaText: {
    fontSize: 12,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.bricolageRegular,
    marginBottom: 4,
  },
  financeHeroSummaryRows: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 8,
    gap: 8,
  },
  financeSectionHeader: {marginHorizontal: 14, marginTop: 6, marginBottom: 8},
  financeSectionTitle: {
    fontSize: 16,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  financeSectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  financeTilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 6,
    marginTop: 0,
  },
  financeCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 6,
    marginTop: 0,
  },
  serviceMetricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 6,
    marginTop: 0,
  },
  serviceMetricCard: {
    width: '46%',
    margin: 6,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 126,
    justifyContent: 'space-between',
    shadowColor: '#0f172a',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  serviceMetricTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  serviceMetricLabel: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    fontFamily: FONT_FAMILY.bricolageMedium,
    paddingRight: 8,
  },
  serviceMetricIcon: {opacity: 0.9},
  serviceMetricValue: {
    marginTop: 10,
    fontSize: 18,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  serviceMetricRateRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15, 23, 42, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  serviceMetricRateLabel: {
    fontSize: 11,
    color: '#475569',
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  serviceMetricRateValue: {
    fontSize: 11,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.outfitBold,
    textAlign: 'right',
    flexShrink: 0,
    maxWidth: '58%',
  },
  financeSummaryCard: {
    marginHorizontal: 14,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 3},
    elevation: 2,
  },
  financeStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  financeStatLabelWrap: {flex: 1, paddingRight: 12},
  financeStatLabel: {
    fontSize: 13,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  financeStatLabelDark: {
    fontSize: 13,
    color: '#f8fafc',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  financeStatMeta: {
    marginTop: 2,
    fontSize: 11,
    color: '#64748b',
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  financeStatMetaDark: {
    marginTop: 2,
    fontSize: 11,
    color: '#bfdbfe',
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  financeStatValue: {
    fontSize: 14,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.outfitBold,
    textAlign: 'right',
    flexShrink: 0,
    maxWidth: '44%',
  },
  financeStatValueDark: {
    fontSize: 14,
    color: '#ffffff',
    fontFamily: FONT_FAMILY.outfitBold,
    textAlign: 'right',
    flexShrink: 0,
    maxWidth: '44%',
  },
  financeBreakdownCard: {
    marginHorizontal: 14,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 3},
    elevation: 2,
  },
  financeBreakdownHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  financeBreakdownTitle: {
    fontSize: 16,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  financeBreakdownSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  financeBreakdownPayoutChip: {
    alignItems: 'flex-end',
    backgroundColor: '#ecfeff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  financeBreakdownPayoutLabel: {
    fontSize: 11,
    color: '#0e7490',
    fontFamily: FONT_FAMILY.bricolageMedium,
    textTransform: 'uppercase',
  },
  financeBreakdownPayoutValue: {
    marginTop: 4,
    fontSize: 16,
    color: '#155e75',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  financeBreakdownList: {borderTopWidth: 1, borderTopColor: '#e2e8f0'},
  financeBreakdownInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  financeBreakdownInlineRowStrong: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  financeBreakdownInlineLabel: {
    flex: 1,
    paddingRight: 12,
    fontSize: 12,
    color: '#334155',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  financeBreakdownInlineLabelStrong: {
    flex: 1,
    paddingRight: 12,
    fontSize: 12,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  financeBreakdownInlineValue: {
    fontSize: 12,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.outfitBold,
    textAlign: 'right',
    flexShrink: 0,
    maxWidth: '44%',
  },
  financeBreakdownInlineValueStrong: {
    fontSize: 12,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.outfitBold,
    textAlign: 'right',
    flexShrink: 0,
    maxWidth: '44%',
  },
  financeSectionDivider: {
    marginHorizontal: 4,
    marginTop: 8,
    marginBottom: 12,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  financeBreakdownSectionTitle: {
    marginHorizontal: 14,
    fontSize: 14,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  financeBreakdownSectionSubtitle: {
    marginHorizontal: 14,
    marginTop: 4,
    marginBottom: 8,
    fontSize: 12,
    color: '#64748b',
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  financeEmptyState: {
    marginHorizontal: 14,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  financeEmptyStateText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  // ── Custom date modal ──────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  customModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: 8},
    elevation: 10,
  },
  customModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  customModalTitle: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  datePickerLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  datePickerLabel: {
    fontSize: 14,
    color: '#334155',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  datePickerIOS: {
    // compact spinner; width is auto on iOS
  },
  datePickerDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 2,
  },
  androidDateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  androidDateChipText: {
    fontSize: 13,
    color: '#0f62fe',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  dateValidationError: {
    marginTop: 10,
    fontSize: 12,
    color: '#dc2626',
    fontFamily: FONT_FAMILY.bricolageRegular,
    textAlign: 'center',
  },
  datePreviewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: 14,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  datePreviewText: {
    fontSize: 13,
    color: '#0f62fe',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  customModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  customModalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  customModalCancelText: {
    fontSize: 14,
    color: '#475569',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  customModalApplyBtn: {
    flex: 2,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0f62fe',
  },
  customModalApplyBtnDisabled: {
    backgroundColor: '#93c5fd',
  },
  customModalApplyText: {
    fontSize: 14,
    color: '#ffffff',
    fontFamily: FONT_FAMILY.outfitBold,
  },
});

export default OrderStatsScreen;
