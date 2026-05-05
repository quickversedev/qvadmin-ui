import {useGetOrderHistoryQuery} from '../../apis/order';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {useRegionsStore} from '../../store/regions/useRegionsStore';
import {FONT_FAMILY} from '../../assets/constants/fonts';

const OrderHistoryScreen = () => {
  const {selectedRegion} = useRegionsStore(state => state);

  const [period, setPeriod] = React.useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>(
    'DAILY',
  );
  const [page, setPage] = React.useState(0);
  const [size] = React.useState(20);
  const [displayBuckets, setDisplayBuckets] = React.useState<any[]>([]);

  const displayPeriodRef = React.useRef<string>(period);
  const resolvedPageRef = React.useRef<number>(-1);
  const isLoadingMoreRef = React.useRef(false);

  const {data, isFetching} = useGetOrderHistoryQuery({
    regionId: selectedRegion?.regionId as string,
    period,
    page,
    size,
  });

  const buckets = data?.response?.buckets;
  const total = data?.response?.totalBuckets ?? 0;
  const serverPage = data?.response?.page ?? page;

  React.useEffect(() => {
    if (!Array.isArray(buckets)) return;
    if (displayPeriodRef.current !== period) return;

    isLoadingMoreRef.current = false;

    setDisplayBuckets(current => {
      if (serverPage === 0) {
        resolvedPageRef.current = 0;
        return buckets;
      }
      if (serverPage <= resolvedPageRef.current) return current;

      resolvedPageRef.current = serverPage;
      const merged = [...current];
      buckets.forEach(bucket => {
        if (!merged.some(existing => existing.bucket === bucket.bucket)) {
          merged.push(bucket);
        }
      });
      return merged;
    });
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const animatedValues = React.useRef<Animated.Value[]>([]);
  const prevLengthRef = React.useRef(0);

  React.useEffect(() => {
    const newCount = displayBuckets.length;
    const prevCount = prevLengthRef.current;

    if (newCount === 0) {
      animatedValues.current = [];
      prevLengthRef.current = 0;
      return;
    }

    if (newCount > prevCount) {
      for (let i = prevCount; i < newCount; i++) {
        animatedValues.current.push(new Animated.Value(0));
      }
      const newAnimations = animatedValues.current
        .slice(prevCount, newCount)
        .map(av =>
          Animated.timing(av, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
        );
      Animated.stagger(60, newAnimations).start();
    }

    prevLengthRef.current = newCount;
  }, [displayBuckets.length]);

  const handlePeriodChange = (newPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY') => {
    if (newPeriod === period) return;

    displayPeriodRef.current = newPeriod;
    resolvedPageRef.current = -1;
    animatedValues.current = [];
    prevLengthRef.current = 0;
    setDisplayBuckets([]);
    setPage(0);
    setPeriod(newPeriod);
  };

  const handleLoadMore = () => {
    if (isLoadingMoreRef.current || isFetching) return;

    const loaded = (serverPage + 1) * size;
    if (loaded < total) {
      isLoadingMoreRef.current = true;
      setPage(prev => prev + 1);
    }
  };

  const formatBucketLabel = (bucketDateStr: string) => {
    try {
      const bucketDate = new Date(bucketDateStr + 'T00:00:00');
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (bucketDate.toDateString() === today.toDateString()) return 'Today';
      if (bucketDate.toDateString() === yesterday.toDateString())
        return 'Yesterday';

      return bucketDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return bucketDateStr;
    }
  };

  const getTotalOrders = (item: any) =>
    (item.completedOrders ?? 0) +
    (item.rejectedOrders ?? 0) +
    (item.cancelledOrders ?? 0);

  const hasMore = (serverPage + 1) * size < total;
  const isInitialLoading = isFetching && displayBuckets.length === 0;
  const isLoadingMore = isFetching && displayBuckets.length > 0 && hasMore;

  const renderBucket = ({item, index}: {item: any; index: number}) => {
    const av = animatedValues.current[index] ?? new Animated.Value(1);
    const translateY = av.interpolate({
      inputRange: [0, 1],
      outputRange: [10, 0],
    });
    const totalOrders = getTotalOrders(item);

    return (
      <Animated.View
        style={[styles.bucketCard, {opacity: av, transform: [{translateY}]}]}>
        <View style={styles.bucketHeader}>
          <View>
            <Text style={styles.bucketDate}>
              {formatBucketLabel(item.bucket)}
            </Text>
            <Text style={styles.bucketSubtitle}>
              {totalOrders} order{totalOrders !== 1 ? 's' : ''} total
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statPill, styles.completedPill]}>
              <View style={[styles.statDot, styles.completedDot]} />
              <Text style={styles.statCount}>{item.completedOrders}</Text>
            </View>
            <View style={[styles.statPill, styles.rejectedPill]}>
              <View style={[styles.statDot, styles.rejectedDot]} />
              <Text style={styles.statCount}>{item.rejectedOrders}</Text>
            </View>
            <View style={[styles.statPill, styles.cancelledPill]}>
              <View style={[styles.statDot, styles.cancelledDot]} />
              <Text style={styles.statCount}>{item.cancelledOrders}</Text>
            </View>
          </View>
        </View>

        {totalOrders > 0 && (
          <View style={styles.progressBar}>
            {item.completedOrders > 0 && (
              <View
                style={[
                  styles.progressSegment,
                  styles.completedSeg,
                  {flex: item.completedOrders},
                ]}
              />
            )}
            {item.rejectedOrders > 0 && (
              <View
                style={[
                  styles.progressSegment,
                  styles.rejectedSeg,
                  {flex: item.rejectedOrders},
                ]}
              />
            )}
            {item.cancelledOrders > 0 && (
              <View
                style={[
                  styles.progressSegment,
                  styles.cancelledSeg,
                  {flex: item.cancelledOrders},
                ]}
              />
            )}
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={styles.page}>
      <View style={styles.filterRow}>
        {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map(p => (
          <TouchableOpacity
            key={p}
            style={[
              styles.filterButton,
              period === p && styles.filterButtonActive,
            ]}
            onPress={() => handlePeriodChange(p)}
            activeOpacity={0.75}>
            <Text
              style={[
                styles.filterText,
                period === p && styles.filterTextActive,
              ]}>
              {p === 'DAILY' ? 'Daily' : p === 'WEEKLY' ? 'Weekly' : 'Monthly'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.legendRow}>
        {[
          {label: 'Completed', dot: styles.completedDot},
          {label: 'Rejected', dot: styles.rejectedDot},
          {label: 'Cancelled', dot: styles.cancelledDot},
        ].map(({label, dot}) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, dot]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>

      <FlatList
        data={displayBuckets}
        keyExtractor={item => String(item.bucket)}
        renderItem={renderBucket}
        contentContainerStyle={styles.container}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator
              size="small"
              color="#0f62fe"
              style={{marginVertical: 16}}
            />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {isInitialLoading ? (
              <>
                <ActivityIndicator
                  size="large"
                  color="#0f62fe"
                  style={{marginBottom: 14}}
                />
                <Text style={styles.loadingLabel}>Order History Loading</Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>No History Yet</Text>
                <Text style={styles.emptyText}>
                  Orders will appear here once placed.
                </Text>
              </>
            )}
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  page: {flex: 1, backgroundColor: '#f0f4ff'},
  container: {padding: 14, paddingBottom: 32},

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#f0f4ff',
  },
  filterButton: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#dce6fa',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#0f62fe',
    shadowColor: '#0f62fe',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
    elevation: 4,
  },
  filterText: {
    color: '#334155',
    fontSize: 13,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  filterTextActive: {color: '#ffffff', fontFamily: FONT_FAMILY.outfitBold},

  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
    marginBottom: 4,
  },
  legendDot: {width: 8, height: 8, borderRadius: 4, marginRight: 5},
  legendText: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },

  bucketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#1e3a8a',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 3},
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e8eef8',
  },
  bucketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bucketDate: {
    fontSize: 15,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.outfitExtraBold,
    includeFontPadding: false,
    lineHeight: 20,
  },
  bucketSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: FONT_FAMILY.bricolageMedium,
    marginTop: 2,
  },

  statsRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 5,
  },
  statDot: {width: 7, height: 7, borderRadius: 4},
  statCount: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.outfitBold,
    color: '#1e293b',
  },
  completedPill: {backgroundColor: '#DCFCE7'},
  rejectedPill: {backgroundColor: '#FEE2E2'},
  cancelledPill: {backgroundColor: '#FEF3C7'},
  completedDot: {backgroundColor: '#16a34a'},
  rejectedDot: {backgroundColor: '#dc2626'},
  cancelledDot: {backgroundColor: '#d97706'},

  progressBar: {
    flexDirection: 'row',
    height: 5,
    borderRadius: 99,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  progressSegment: {height: '100%'},
  completedSeg: {backgroundColor: '#22c55e'},
  rejectedSeg: {backgroundColor: '#ef4444'},
  cancelledSeg: {backgroundColor: '#f59e0b'},

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 72,
  },
  loadingLabel: {
    fontSize: 15,
    color: '#0f62fe',
    fontFamily: FONT_FAMILY.outfitBold,
    letterSpacing: 0.3,
  },
  emptyIcon: {fontSize: 36, marginBottom: 10},
  emptyTitle: {
    fontSize: 16,
    color: '#1e293b',
    fontFamily: FONT_FAMILY.outfitBold,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
});

export default OrderHistoryScreen;
