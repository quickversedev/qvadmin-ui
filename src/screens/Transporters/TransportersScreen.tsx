import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {useGetDeliveryPartnersWithOrdersQuery} from '../../apis/deliveryPartner';
import {FONT_FAMILY} from '../../assets/constants/fonts';
import {
  DeliveryPartner,
  getDeliveryPartnerId,
  getDeliveryPartnerName,
} from '../../services/apis/deliveryPartnerService';
import {navigationRef} from '../../navigation/NavigationHelper';

type FilterKey = 'ALL' | 'ONLINE' | 'OFFLINE';

type TransporterItem = DeliveryPartner & {
  totalOrders?: number;
  orderSuccess?: number;
  orderFailed?: number;
  lastLocationUpdatedAt?: string | null;
};

type PartnerOrder = {
  id?: string;
  orderId?: string;
  orderStatus?: string;
  createdAt?: string;
  updatedAt?: string | null;
  shopDetails?: {
    name?: string;
    logo?: string;
  };
  orderDetails?: {
    orderId?: string;
    customerName?: string;
    customerMobile?: string | number;
    orderDescription?: string;
    totalAmount?: number;
    totalItemCount?: number;
    creationTime?: string;
    state?: string;
    orderLink?: string;
    shopDetails?: {
      name?: string;
      logo?: string;
    };
  };
};

type TransporterBucket = TransporterItem & {
  deliveryPartner?: DeliveryPartner;
  currentOrders?: PartnerOrder[];
  currentOrderCount?: number;
};

const filterButtons: {id: FilterKey; label: string}[] = [
  {id: 'ALL', label: 'All'},
  {id: 'ONLINE', label: 'Online'},
  {id: 'OFFLINE', label: 'Offline'},
];

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as {message?: string}).message;
    if (message) return message;
  }
  return 'Unable to load delivery partners';
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'DP';
  return parts
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('');
};

const formatMobileNumber = (value?: string | number | null) => {
  if (value === undefined || value === null || value === '') {
    return 'No mobile number';
  }

  const digits = String(value).replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }

  return digits;
};

const formatLastLocation = (value?: string | null) => {
  if (!value) return 'Location not updated';

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 'Location not updated';

  const elapsedMinutes = Math.max(
    1,
    Math.round((Date.now() - timestamp) / 60000),
  );

  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;

  return `${Math.max(1, Math.round(elapsedHours / 24))}d ago`;
};

const getPartnerSource = (item: TransporterBucket): TransporterItem =>
  item.deliveryPartner || item;

const getPartnerOrders = (item: TransporterBucket): PartnerOrder[] => {
  if (Array.isArray(item.currentOrders)) {
    return item.currentOrders;
  }

  return [];
};

const extractPartnerList = (response: unknown): TransporterBucket[] => {
  if (Array.isArray(response)) return response as TransporterBucket[];

  if (!response || typeof response !== 'object') return [];

  const payload = response as Record<string, unknown>;
  const directCandidates = [
    payload.result,
    payload.data,
    payload.response,
    payload.partners,
    payload.deliveryPartners,
  ];

  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) {
      return candidate as TransporterBucket[];
    }
  }

  for (const candidate of [payload.result, payload.data, payload.response]) {
    if (
      !candidate ||
      typeof candidate !== 'object' ||
      Array.isArray(candidate)
    ) {
      continue;
    }

    const nested = candidate as Record<string, unknown>;
    const nestedCandidates = [
      nested.result,
      nested.data,
      nested.response,
      nested.partners,
      nested.deliveryPartners,
    ];

    for (const nestedCandidate of nestedCandidates) {
      if (Array.isArray(nestedCandidate)) {
        return nestedCandidate as TransporterBucket[];
      }
    }
  }

  return [];
};

const formatOrderStatus = (value?: string | null) => {
  if (!value) return 'Unknown';

  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
};

const getOrderStatusColor = (value?: string | null) => {
  const normalized = String(value || '').toUpperCase();

  if (normalized.includes('COMPLETED')) return '#059669';
  if (normalized.includes('CANCEL')) return '#dc2626';
  if (normalized.includes('ASSIGNED')) return '#2563eb';
  if (normalized.includes('PACK') || normalized.includes('PICK'))
    return '#d97706';

  return '#475569';
};

const TransportersScreen = () => {
  const [refreshing, setRefreshing] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState<FilterKey>('ALL');
  const [expandedMaps, setExpandedMaps] = React.useState<
    Record<string, boolean>
  >({});
  const [expandedOrders, setExpandedOrders] = React.useState<
    Record<string, boolean>
  >({});

  const {
    data: deliveryPartnersData,
    refetch: refetchDeliveryPartners,
    error,
    isLoading,
    isFetching,
  } = useGetDeliveryPartnersWithOrdersQuery({});

  const deliveryPartners = React.useMemo(
    () => extractPartnerList(deliveryPartnersData),
    [deliveryPartnersData],
  );

  const filteredPartners = React.useMemo(() => {
    let result = deliveryPartners;

    if (activeFilter === 'ONLINE') {
      result = deliveryPartners.filter(p =>
        Boolean(getPartnerSource(p).isOnline),
      );
    } else if (activeFilter !== 'ALL') {
      result = deliveryPartners.filter(p => !getPartnerSource(p).isOnline);
    }

    return [...result].sort((a, b) => {
      const partnerA = getPartnerSource(a);
      const partnerB = getPartnerSource(b);
      const aTest = String(getDeliveryPartnerName(partnerA) || '')
        .toLowerCase()
        .includes('test');
      const bTest = String(getDeliveryPartnerName(partnerB) || '')
        .toLowerCase()
        .includes('test');

      if (aTest !== bTest) {
        return aTest ? 1 : -1;
      }

      const aOnline = Boolean(partnerA.isOnline);
      const bOnline = Boolean(partnerB.isOnline);
      return aOnline === bOnline ? 0 : aOnline ? -1 : 1;
    });
  }, [activeFilter, deliveryPartners]);

  const onlineCount = React.useMemo(
    () =>
      deliveryPartners.filter(p => Boolean(getPartnerSource(p).isOnline))
        .length,
    [deliveryPartners],
  );

  const offlineCount = React.useMemo(
    () => deliveryPartners.filter(p => !getPartnerSource(p).isOnline).length,
    [deliveryPartners],
  );

  const handleRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([refetchDeliveryPartners()])
      .then(() => setRefreshing(false))
      .catch(() => setRefreshing(false));
  }, [refetchDeliveryPartners]);

  const openMap = (lat?: string, lng?: string) => {
    if (!lat || !lng) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url);
  };

  const handleCall = (mobile?: string | number | null) => {
    const cleaned = formatMobileNumber(mobile);
    if (!cleaned || cleaned === 'No mobile number') return;
    Linking.openURL(`tel:${cleaned}`);
  };

  const isInitialLoading = isLoading && !deliveryPartners.length;
  const isQueryRefreshing = refreshing || (isFetching && !isLoading);
  const showError = Boolean(error) && !deliveryPartners.length;

  const renderFilterButtons = () => (
    <View style={styles.filterWrapper}>
      <FlatList
        horizontal
        data={filterButtons}
        keyExtractor={item => item?.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
        renderItem={({item}) => (
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === item?.id && styles.activeFilterButton,
            ]}
            onPress={() => setActiveFilter(item?.id)}>
            <Text
              style={[
                styles.filterButtonText,
                activeFilter === item?.id && styles.activeFilterButtonText,
              ]}>
              {item?.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderLegend = () => (
    <View style={styles.legendContainer}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.liveDot]} />
          <Text style={styles.legendText}>All ({deliveryPartners.length})</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.onlineDot]} />
          <Text style={styles.legendText}>Online ({onlineCount})</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.offlineDot]} />
          <Text style={styles.legendText}>Offline ({offlineCount})</Text>
        </View>
      </View>
    </View>
  );

  const renderTransporterItem: ListRenderItem<TransporterBucket> = ({item}) => {
    const transporter = getPartnerSource(item);
    const transporterName = getDeliveryPartnerName(transporter);
    const transporterId =
      getDeliveryPartnerId(transporter) ||
      transporterName ||
      String(transporter?.mobileNumber || '');
    const isMapExpanded = Boolean(expandedMaps[transporterId]);
    const isOrdersExpanded = Boolean(expandedOrders[transporterId]);
    const currentOrders = getPartnerOrders(item);
    const currentOrderCount = item.currentOrderCount ?? currentOrders.length;

    const toggleMapExpand = () => {
      setExpandedMaps(prev => ({
        ...prev,
        [transporterId]: !prev[transporterId],
      }));
    };

    const toggleOrdersExpand = () => {
      setExpandedOrders(prev => ({
        ...prev,
        [transporterId]: !prev[transporterId],
      }));
    };

    return (
      <View style={styles.card}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <View style={styles.cardLeft}>
            <View style={styles.avatarWrap}>
              {transporter?.profilePicture ? (
                <Image
                  source={{uri: transporter?.profilePicture}}
                  style={styles.avatar}
                />
              ) : (
                <Text style={styles.avatarFallback}>
                  {getInitials(transporterName)}
                </Text>
              )}

              <View
                style={[
                  styles.avatarStatusDot,
                  transporter?.isOnline
                    ? styles.statusOnline
                    : styles.statusOffline,
                ]}
              />
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.partnerName} numberOfLines={1}>
                {transporterName}
              </Text>

              <Text style={styles.partnerMeta} numberOfLines={1}>
                {formatMobileNumber(transporter?.mobileNumber)}
              </Text>

              <Text style={styles.partnerMeta} numberOfLines={1}>
                {transporter?.address || 'No address available'}
              </Text>

              <Text style={styles.updatedTextInline}>
                Updated {formatLastLocation(transporter?.lastLocationUpdatedAt)}
              </Text>
            </View>
          </View>

          <View style={styles.cardRight}>
            <Text style={styles.orderCountValue}>{currentOrderCount}</Text>
            <Text style={styles.orderCountLabel}>Orders</Text>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCall(transporter?.mobileNumber)}
                activeOpacity={0.8}>
                <MaterialCommunityIcons
                  name="phone"
                  size={14}
                  color="#065f46"
                />
              </TouchableOpacity>
              {transporter?.latitude && transporter?.longitude && (
                <TouchableOpacity
                  style={styles.mapToggleButton}
                  onPress={toggleMapExpand}
                  activeOpacity={0.7}>
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={20}
                    color="#0f62fe"
                  />
                  <Text
                    style={{
                      fontFamily: FONT_FAMILY.bricolageRegular,
                      color: '#000',
                      fontSize: 13,
                    }}>
                    {isMapExpanded ? 'Hide' : 'Show'} Location
                  </Text>
                  <MaterialCommunityIcons
                    name={isMapExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#0f62fe"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.ordersSection}>
          {currentOrderCount && (
            <TouchableOpacity
              style={styles.ordersToggleButton}
              activeOpacity={0.75}
              onPress={toggleOrdersExpand}>
              <View style={styles.ordersToggleLeft}>
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={18}
                  color="#0f62fe"
                />
                <Text style={styles.ordersToggleText}>
                  Current Orders ({currentOrderCount})
                </Text>
              </View>
              <MaterialCommunityIcons
                name={isOrdersExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#0f62fe"
              />
            </TouchableOpacity>
          )}

          {isOrdersExpanded && (
            <View style={styles.ordersList}>
              {currentOrders.length === 0 ? (
                <View style={styles.ordersEmptyState}>
                  <Text style={styles.ordersEmptyText}>
                    No active orders for this partner.
                  </Text>
                </View>
              ) : (
                currentOrders.map((order, index) => {
                  const orderDetails = order.orderDetails || {};
                  const orderId =
                    order.orderId || orderDetails.orderId || `order-${index}`;
                  const orderStatus = order.orderStatus || orderDetails.state;
                  const orderShopName =
                    orderDetails.shopDetails?.name ||
                    order.shopDetails?.name ||
                    'Shop';
                  const orderTitle =
                    orderDetails.orderDescription ||
                    orderDetails.customerName ||
                    'Order details';

                  return (
                    <View key={orderId} style={styles.orderCard}>
                      <View style={styles.orderCardHeader}>
                        <View style={{flex: 1}}>
                          <Text style={styles.orderCardTitle} numberOfLines={1}>
                            #{orderId}
                          </Text>
                          <Text
                            style={styles.orderCardSubtitle}
                            numberOfLines={1}>
                            {orderTitle}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.orderCardMeta} numberOfLines={1}>
                        {orderShopName}
                      </Text>

                      <View style={styles.orderStatsRow}>
                        <Text style={styles.orderStatText}>
                          {orderDetails.totalItemCount ?? 0} items
                        </Text>
                        <Text style={styles.orderStatText}>
                          ₹{orderDetails.totalAmount ?? 0}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.orderActionButton}
                        onPress={() => {
                          navigationRef.current?.navigate('Orders', {
                            screen: 'ViewOrderScreen',
                            params: {orderId: order?.orderId},
                          });
                        }}
                        activeOpacity={0.8}>
                        <Text style={styles.orderActionText}>View Order</Text>
                        <MaterialCommunityIcons
                          name="open-in-new"
                          size={14}
                          color="#0f62fe"
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>

        {transporterName?.includes('Test') && (
          <View style={styles.testWarningContainer}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={16}
              color="#b91c1c"
              style={{marginRight: 6}}
            />
            <Text style={styles.testWarningText}>
              Test Partner — Ignore for real orders, do not assign orders
            </Text>
          </View>
        )}

        {transporter?.latitude && transporter?.longitude && isMapExpanded && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              openMap(
                transporter?.latitude as string,
                transporter?.longitude as string,
              )
            }
            style={styles.mapExpandedContainer}>
            <Image
              source={{
                uri: `https://maps.googleapis.com/maps/api/staticmap?center=${transporter?.latitude},${transporter?.longitude}&zoom=15&size=800x300&markers=color:red%7C${transporter?.latitude},${transporter?.longitude}&key=AIzaSyAIIjpfah1Kbsl38kyy8yqGtfzh33XSXzY`,
              }}
              style={styles.mapExpandedPreview}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmptyState = () => {
    if (isInitialLoading) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="#0f62fe" />
          <Text style={styles.stateTitle}>Loading delivery partners</Text>
          <Text style={styles.stateMessage}>
            Fetching the latest partner list.
          </Text>
        </View>
      );
    }

    if (showError) {
      return (
        <View style={styles.stateContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={44}
            color="#dc2626"
          />
          <Text style={styles.stateTitle}>Unable to load partners</Text>
          <Text style={styles.stateMessage}>
            {getErrorMessage(error) || 'Please try again later'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.stateContainer}>
        <MaterialCommunityIcons
          name="account-group-outline"
          size={44}
          color="#94a3b8"
        />
        <Text style={styles.stateTitle}>No partners found</Text>
        <Text style={styles.stateMessage}>
          Try switching filters or refreshing the list.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transporters Dashboard</Text>
        </View>

        <View style={styles.content}>
          {renderFilterButtons()}
          {renderLegend()}

          <FlatList
            data={filteredPartners}
            keyExtractor={(item, index) =>
              getDeliveryPartnerId(getPartnerSource(item)) || String(index)
            }
            renderItem={renderTransporterItem}
            contentContainerStyle={[
              styles.listContent,
              !filteredPartners.length && styles.emptyListContent,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={isQueryRefreshing}
                onRefresh={handleRefresh}
                tintColor="#0f62fe"
                colors={['#0f62fe']}
              />
            }
            ListEmptyComponent={renderEmptyState}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
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
  content: {
    flex: 1,
  },
  filterWrapper: {
    paddingLeft: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
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
    color: '#fff',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  legendContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 99,
  },
  onlineDot: {
    backgroundColor: '#3b82f6',
  },
  liveDot: {
    backgroundColor: '#10b981',
  },
  offlineDot: {
    backgroundColor: '#dc2626',
  },
  legendText: {
    fontSize: 12,
    color: '#475569',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
  },
  avatarWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    // overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  avatarFallback: {
    fontSize: 16,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  avatarStatusDot: {
    position: 'absolute',
    bottom: -3,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 10,
  },
  statusOnline: {
    backgroundColor: '#22c55e',
  },
  statusOffline: {
    backgroundColor: '#ef4444',
  },
  cardBody: {
    flex: 1,
    marginLeft: 12,
  },
  partnerName: {
    fontSize: 15,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.bricolageBold,
  },
  partnerMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  updatedTextInline: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 6,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  ordersSection: {
    marginTop: 10,
  },
  ordersToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  ordersToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ordersToggleText: {
    color: '#0f172a',
    fontSize: 13,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  ordersList: {
    marginTop: 8,
    gap: 8,
  },
  ordersEmptyState: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ordersEmptyText: {
    color: '#64748b',
    fontSize: 12,
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  orderCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  orderCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  orderCardTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontFamily: FONT_FAMILY.outfitBold,
  },
  orderCardSubtitle: {
    marginTop: 2,
    color: '#475569',
    fontSize: 12,
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  orderStatusText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bricolageBold,
    textTransform: 'capitalize',
  },
  orderCardMeta: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 12,
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  orderStatsRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderStatText: {
    color: '#0f172a',
    fontSize: 12,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  orderActionButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  orderActionText: {
    color: '#0f62fe',
    fontSize: 12,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  testWarningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    alignSelf: 'flex-start',
  },
  testWarningText: {
    fontSize: 11,
    color: '#b91c1c',
    fontFamily: FONT_FAMILY.outfitRegular,
  },
  orderCountValue: {
    fontSize: 18,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  orderCountLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 6,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  mapPreview: {
    height: 180,
    borderRadius: 8,
    marginTop: 6,
  },
  mapToggleButton: {
    marginTop: 6,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    borderRadius: 6,
  },
  mapExpandedContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  mapExpandedPreview: {
    width: '100%',
    height: 240,
    borderRadius: 8,
  },
  mapFallback: {
    width: 100,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: 18,
    color: '#0f172a',
    marginTop: 12,
    fontFamily: FONT_FAMILY.bricolageBold,
  },
  stateMessage: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#0f62fe',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: FONT_FAMILY.outfitBold,
  },
});

export default TransportersScreen;
