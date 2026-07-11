import React, {useMemo, useState, useEffect} from 'react';
import {
  FlatList,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  AppState,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Order} from '../../store/orders/useOrdersStore';
import {getStatusStyles} from './DashBoardUtil';
import OrderDetailsModal from './OrderDetailsModel';
import {convertUTCToIST, getTimeElapsed} from '../../utils/orderUtils';
import {Shop} from '../../types';
import {
  DeliveryPartner,
  getDeliveryPartnerId,
  getDeliveryPartnerName,
} from '../../services/apis/deliveryPartnerService';
import {FONT_FAMILY} from '../../assets/constants/fonts';

import {ORDER_STATUS} from '../../assets/constants/constant';
import {navigationRef} from '../../navigation/NavigationHelper';
import {useUnassignOrderMutation} from '../../apis/order';

const formatMobile = (
  customerMobile: string | number | null | undefined,
): string => {
  if (!customerMobile) return '';

  const mobile = String(customerMobile).trim();

  if (mobile.length === 12 && mobile.startsWith('91')) {
    return mobile.slice(2);
  }

  return mobile;
};

type OrderSummaryCardProps = Order & {
  key?: string;
  vendor: Shop;
  showAssignment?: boolean;
  onlinePartners?: DeliveryPartner[];
  assignedPartnerId?: string;
  partnerOrderCounts?: Record<string, number>;
  onAssignPartner?: (orderId: string, partnerId: string) => void;
  deliveryPartnerDetails: any;
  showShopInfo?: boolean;
  assignedPartnerDetails?: DeliveryPartnerAssignmentDetails | null;
  paymentProofURLImageUrl?: string | null;
  finance?: OrderFinance | null;
};

type OrderFinance = {
  itemTotalAmount?: number;
  couponId?: string | null;
  couponCode?: string | null;
  couponDiscount?: number;
  isFreeDelivery?: boolean;
  amountAfterCoupon?: number;
  packagingCharges?: number;
  actualDeliveryFee?: number;
  deliveryFee?: number;
  platformFee?: number;
  razorpayCharges?: number;
  serviceGstRate?: number;
  commissionGst?: number;
  deliveryGst?: number;
  packagingGst?: number;
  codGst?: number;
  platformGst?: number;
  totalGst?: number;
  taxableAmount?: number;
  payableAmount?: number;
  commissionRate?: number;
  commission?: number;
  paymentMethod?: string | null;
  codCharges?: number;
  createdAt?: string | number;
  updatedAt?: string | number | null;
};

type DeliveryPartnerAssignmentDetails = DeliveryPartner & {
  orderStatus?: string | null;
  arrivedAtStoreAt?: string | null;
  pickedUpAt?: string | null;
  reachedLocationAt?: string | null;
  deliveredAt?: string | null;
  paymentProofUrl?: string | null;
  assignedAt: string | null;
};

const toCoordinate = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const distanceInKm = (
  sourceLat: number,
  sourceLng: number,
  targetLat: number,
  targetLng: number,
) => {
  const toRadians = (degree: number) => (degree * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRadians(targetLat - sourceLat);
  const dLng = toRadians(targetLng - sourceLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(sourceLat)) *
      Math.cos(toRadians(targetLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const TIMELINES = [
  {label: 'At Store', icon: '🏪', statuses: ['ARRIVED_AT_STORE']},
  {label: 'Picked Up', icon: '📦', statuses: ['ORDER_PICKED_UP', 'PICKED_UP']},
  {
    label: 'Reached',
    icon: '🛵',
    statuses: ['REACHED_LOCATION', 'REACH_DESTINATION'],
  },
  {label: 'Delivered', icon: '✅', statuses: ['DELIVERED']},
];

const getTransporterDisplayName = (partner: DeliveryPartnerAssignmentDetails) =>
  getDeliveryPartnerName(partner) !== 'Unnamed Partner'
    ? getDeliveryPartnerName(partner)
    : partner.deliveryPartnerId || partner.id || 'Unnamed Partner';

const getAssignedTimeMs = (
  assignedAt: string | number | null | undefined,
): number | null => {
  if (!assignedAt) {
    return null;
  }
  const num = Number(assignedAt);
  if (!isNaN(num) && num > 0) {
    return num;
  }
  const dateNum = Date.parse(String(assignedAt));
  if (!isNaN(dateNum) && dateNum > 0) {
    return dateNum;
  }
  return null;
};

const formatTimer = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatCurrency = (value: number | undefined | null): string => {
  const num = Number(value || 0);
  return num.toFixed(2);
};

const OrderSummaryCard = (props: OrderSummaryCardProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const {
    orderId,
    customerMobile,
    totalItemCount,
    creationTime,
    acceptedDate,
    rejectedDate,
    completedDate,
    state,
    vendor,
    onlinePartners = [],
    assignedPartnerId,
    onAssignPartner,
    partnerOrderCounts = {},
    customerName,
    orderLink,
    deliveryPartnerDetails,
    assignedPartnerDetails,
    paymentProofURLImageUrl: paymentProofUrl,
  } = props;
  const finance = props?.finance ?? null;

  const arrivedAtStoreAt = assignedPartnerDetails?.arrivedAtStoreAt ?? null;
  const pickedUpAt = assignedPartnerDetails?.pickedUpAt ?? null;
  const reachedLocationAt = assignedPartnerDetails?.reachedLocationAt ?? null;
  const deliveredAt = assignedPartnerDetails?.deliveredAt ?? null;
  const assignedAt = assignedPartnerDetails?.assignedAt ?? null;

  const [unassignOrder, {isLoading: isUnassignedLoading}] =
    useUnassignOrderMutation();

  const statusStyles = getStatusStyles(state);
  const assignedPartner = deliveryPartnerDetails || assignedPartnerDetails;

  const deliveryLifecycleStatus =
    assignedPartnerDetails?.orderStatus || assignedPartner?.orderStatus || '';
  const activeTimelineIndex = TIMELINES.findIndex(timeline =>
    timeline.statuses.includes(deliveryLifecycleStatus),
  );
  const shopLatitude = toCoordinate(vendor?.shopDetails?.coordinates?.latitude);
  const shopLongitude = toCoordinate(
    vendor?.shopDetails?.coordinates?.longitude,
  );
  const partnersWithDistance = useMemo(
    () =>
      onlinePartners
        .map(partner => {
          const partnerLatitude = toCoordinate(partner.latitude);
          const partnerLongitude = toCoordinate(partner.longitude);

          if (
            shopLatitude === null ||
            shopLongitude === null ||
            partnerLatitude === null ||
            partnerLongitude === null
          ) {
            return {partner, distanceKm: null as number | null};
          }

          return {
            partner,
            distanceKm: distanceInKm(
              shopLatitude,
              shopLongitude,
              partnerLatitude,
              partnerLongitude,
            ),
          };
        })
        .sort((a, b) => {
          if (a.distanceKm === null && b.distanceKm === null) {
            return 0;
          }

          if (a.distanceKm === null) {
            return 1;
          }

          if (b.distanceKm === null) {
            return -1;
          }

          return a.distanceKm - b.distanceKm;
        }),
    [onlinePartners, shopLatitude, shopLongitude],
  );

  const getTime = () => {
    switch (state) {
      case ORDER_STATUS.PENDING:
        return getTimeElapsed(creationTime);
      case ORDER_STATUS.ACCEPTED:
        return acceptedDate ? getTimeElapsed(acceptedDate) : '--';
      case ORDER_STATUS.PACKED:
        return '--';
      case ORDER_STATUS.SHIPPED:
        return '--';
      case ORDER_STATUS.CANCELLED:
        return rejectedDate ? convertUTCToIST(rejectedDate) : '--';
      case ORDER_STATUS.REJECTED:
        return rejectedDate ? convertUTCToIST(rejectedDate) : '--';
      case ORDER_STATUS.COMPLETED:
        return completedDate ? convertUTCToIST(completedDate) : '--';
      default:
        return '--';
    }
  };
  const handleCallCustomer = () => {
    const phoneNumber = `tel:${formatMobile(customerMobile)}`;
    Linking.openURL(phoneNumber);
  };

  const transporterMobile = assignedPartner?.mobileNumber
    ? String(assignedPartner.mobileNumber)
    : '';

  const handleCallTransporter = () => {
    if (!transporterMobile) {
      return;
    }

    Linking.openURL(`tel:${transporterMobile}`);
  };

  const handleSelectPartner = (partnerId: string) => {
    if (!orderId || !partnerId || !onAssignPartner) {
      return;
    }

    onAssignPartner(orderId, partnerId);
    setAssignModalVisible(false);
  };

  const canAssignPartner =
    (state === ORDER_STATUS.ACCEPTED || state === ORDER_STATUS.SHIPPED) &&
    !!orderId &&
    !deliveryPartnerDetails;

  const partnerAssigned =
    deliveryPartnerDetails &&
    (state === ORDER_STATUS.ACCEPTED || state === ORDER_STATUS.SHIPPED);

  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!partnerAssigned || !assignedAt) {
      setSecondsRemaining(null);
      return;
    }

    const assignedTimeMs = getAssignedTimeMs(assignedAt);
    if (!assignedTimeMs) {
      setSecondsRemaining(0);
      return;
    }

    const calculateTimeLeft = () => {
      const deadline = assignedTimeMs + 150000; // 2m 30s = 150,000ms
      const diff = deadline - Date.now();
      const remaining = Math.max(0, Math.ceil(diff / 1000));
      setSecondsRemaining(remaining);
      return remaining;
    };

    calculateTimeLeft();

    const intervalId = setInterval(calculateTimeLeft, 1000);

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        calculateTimeLeft();
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [partnerAssigned, assignedAt]);

  const handleCallShop = () => {
    const shopPhone = vendor?.shopDetails?.phone;
    if (shopPhone) {
      const phoneNumber = `tel:${formatMobile(shopPhone)}`;
      Linking.openURL(phoneNumber);
    }
  };

  const showFinanceDeliveryStrikethrough =
    !!finance &&
    Number(finance.actualDeliveryFee || 0) !==
      Number(finance.deliveryFee || 0) &&
    !finance.isFreeDelivery;

  return (
    <View style={styles.card}>
      {props.showShopInfo && vendor?.shopDetails && (
        <View style={styles.shopInfoRow}>
          <View style={styles.shopLogoContainer}>
            <Image
              source={
                vendor.shopDetails.logo
                  ? {uri: vendor.shopDetails.logo}
                  : require('../../assets/images/default_logo.png')
              }
              style={styles.shopLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.shopDetailsBlock}>
            <Text style={styles.shopName} numberOfLines={1}>
              {vendor.shopDetails.name}
            </Text>
            <Text style={styles.shopAddress} numberOfLines={1}>
              {vendor.shopDetails.address?.address || 'Address not available'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.shopCallButton}
            onPress={handleCallShop}>
            <Icon name="phone" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.header}>
        <Text style={styles.orderId}>#{orderId}</Text>
        <View style={styles.headerTimeBlock}>
          <Icon
            name="clock-outline"
            size={18}
            color="#0057A0"
            style={styles.clockIcon}
          />
          <Text style={[styles.time, {color: statusStyles.color}]}>
            {new Date(creationTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
      <View style={styles.customerNameRow}>
        <Text
          style={{
            fontSize: 17,
            color: '#1E293B',
            fontFamily: FONT_FAMILY.outfitExtraBold,
          }}>
          {customerName}'s Order
        </Text>
        <TouchableOpacity
          style={styles.customerCallIcon}
          onPress={handleCallCustomer}>
          <Icon name="phone" size={18} color="#0EA5E9" />
        </TouchableOpacity>
      </View>
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusBadge,
            {backgroundColor: statusStyles.backgroundColor},
          ]}>
          <Icon
            name={statusStyles.icon}
            size={12}
            color={statusStyles.color}
            style={{marginRight: 4}}
          />
          <Text style={[styles.statusText, {color: statusStyles.color}]}>
            {state}
          </Text>
        </View>

        {finance?.paymentMethod && (
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: statusStyles.backgroundColor},
            ]}>
            <Text style={[styles.statusText, {color: statusStyles.color}]}>
              {finance?.paymentMethod || 'N/A'}
            </Text>
          </View>
        )}

        {!!assignedPartner && (
          <View style={styles.assignedBadge}>
            <Icon name="bike-fast" size={12} color="#065F46" />
            <Text style={styles.assignedBadgeText} numberOfLines={1}>
              {getDeliveryPartnerName(assignedPartner)}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            {state === ORDER_STATUS.PENDING
              ? 'Pending Time: '
              : state === ORDER_STATUS.ACCEPTED
              ? 'Preparing Time: '
              : state === ORDER_STATUS.PACKED
              ? 'Packed Time: '
              : state === ORDER_STATUS.SHIPPED
              ? 'Shipped Time: '
              : state === ORDER_STATUS.COMPLETED
              ? 'Completed In: '
              : state === ORDER_STATUS.CANCELLED ||
                state === ORDER_STATUS.REJECTED
              ? 'Cancelled In: '
              : 'Time: '}
          </Text>
          <Text style={[styles.pendingTimeValue, {color: statusStyles.color}]}>
            {getTime()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon
            name="food-takeout-box-outline"
            size={18}
            color="#0057A0"
            style={{marginRight: 4}}
          />
          <Text style={styles.detailLabel}>{totalItemCount} </Text>
          <Text style={styles.itemsLabel}>Items</Text>
        </View>
      </View>

      {(!!assignedPartner || !!deliveryLifecycleStatus) && (
        <View style={styles.transporterCard}>
          {!!assignedPartner && (
            <View style={styles.transporterHeader}>
              {assignedPartner?.profilePicture ? (
                <Image
                  source={{uri: assignedPartner.profilePicture}}
                  style={styles.transporterAvatar}
                />
              ) : (
                <View style={styles.transporterAvatarPlaceholder}>
                  <Icon name="account" size={20} color="#64748B" />
                </View>
              )}
              <View style={styles.transporterInfoBlock}>
                <Text style={styles.transporterLabel}>
                  Assigned Transporter
                </Text>
                <Text style={styles.transporterName} numberOfLines={1}>
                  {getTransporterDisplayName(assignedPartner)}
                </Text>
                <Text style={styles.transporterMeta} numberOfLines={1}>
                  {transporterMobile || 'Mobile not available'}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.callTransporterButton,
                  !transporterMobile && styles.callTransporterButtonDisabled,
                ]}
                disabled={!transporterMobile}
                onPress={handleCallTransporter}>
                <Icon name="phone" size={14} color="#ffffff" />
                <Text style={styles.callTransporterButtonText}>Call</Text>
              </TouchableOpacity>
            </View>
          )}

          {secondsRemaining !== null && (
            <View
              style={[
                styles.timerRow,
                secondsRemaining <= 0
                  ? styles.timerRowExpired
                  : styles.timerRowActive,
              ]}>
              <Icon
                name="clock-outline"
                size={15}
                color={secondsRemaining <= 0 ? '#DC2626' : '#B45309'}
              />
              <Text
                style={[
                  styles.timerText,
                  secondsRemaining <= 0
                    ? styles.timerTextExpired
                    : styles.timerTextActive,
                ]}>
                {secondsRemaining > 0
                  ? `You can unassign partner until this window: ${formatTimer(
                      secondsRemaining,
                    )}`
                  : 'Unassign window has expired'}
              </Text>
            </View>
          )}

          {!!deliveryLifecycleStatus && (
            <>
              <View style={styles.timelineWrapper}>
                {TIMELINES.map((timeline, index) => {
                  const isCompleted =
                    activeTimelineIndex >= 0 && index <= activeTimelineIndex;
                  const isCurrent =
                    activeTimelineIndex >= 0 && index === activeTimelineIndex;

                  // Map each step to its timestamp
                  const timestamps = [
                    arrivedAtStoreAt,
                    pickedUpAt,
                    reachedLocationAt,
                    deliveredAt,
                  ];
                  const ts = timestamps[index];

                  return (
                    <View key={timeline.label} style={styles.timelineItem}>
                      {index > 0 && (
                        <View
                          style={[
                            styles.timelineConnector,
                            styles.timelineConnectorLeft,
                            isCompleted && styles.timelineConnectorCompleted,
                          ]}
                        />
                      )}
                      {index < TIMELINES.length - 1 && (
                        <View
                          style={[
                            styles.timelineConnector,
                            styles.timelineConnectorRight,
                            activeTimelineIndex > index &&
                              styles.timelineConnectorCompleted,
                          ]}
                        />
                      )}
                      <View
                        style={[
                          styles.timelineIcon,
                          isCompleted && styles.timelineIconCompleted,
                          isCurrent && styles.timelineIconCurrent,
                        ]}>
                        <Text style={styles.timelineIconText}>
                          {timeline.icon}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.timelineLabel,
                          isCompleted && styles.timelineLabelCompleted,
                        ]}
                        numberOfLines={1}>
                        {timeline.label}
                      </Text>
                      {!!ts && !isNaN(Number(ts)) && (
                        <Text
                          style={styles.timelineTimestamp}
                          numberOfLines={1}>
                          {new Date(Number(ts)).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true, // 12-hour format ensure karne ke liye
                          })}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Payment proof row */}
              {!!paymentProofUrl && (
                <TouchableOpacity
                  style={styles.paymentProofRow}
                  onPress={() => setImageModalVisible(true)}
                  activeOpacity={0.8}>
                  <Text style={styles.paymentProofText}>
                    View Payment Proof
                  </Text>
                  <Icon name="chevron-right" size={15} color="#0B6B4A" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.viewButton]}
          onPress={() => setModalVisible(true)}>
          <Text style={styles.buttonText}>View Order ➔</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.viewButton]}
          onPress={() =>
            navigationRef.current?.navigate('WebViewScreen', {url: orderLink})
          }>
          <Text
            style={{
              ...styles.buttonText,
              fontFamily: FONT_FAMILY.bricolageBold,
              fontSize: 13,
            }}>
            SmartBiz Order ➔
          </Text>
        </TouchableOpacity>
      </View>

      {canAssignPartner && (
        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => {
            navigationRef.current?.navigate('AssignTransporterScreen', {
              order: props,
            });
          }}>
          <Icon name="account-switch" size={16} color="#fff" />
          <Text style={styles.assignButtonText}>Assign Delivery Partner</Text>
        </TouchableOpacity>
      )}

      {partnerAssigned && (
        <TouchableOpacity
          disabled={
            isUnassignedLoading ||
            (secondsRemaining !== null && secondsRemaining <= 0)
          }
          style={[
            styles.assignButton,
            secondsRemaining !== null &&
              secondsRemaining <= 0 &&
              styles.assignButtonDisabled,
          ]}
          onPress={async () => {
            try {
              if (props.orderId && deliveryPartnerDetails.id) {
                console.log(
                  'Unassigning order:',
                  props.orderId,
                  deliveryPartnerDetails.id,
                );
                await unassignOrder({
                  orderId: props.orderId,
                  deliveryPartnerId: deliveryPartnerDetails.id,
                }).unwrap();
              }
            } catch (error) {
              console.log('Unassign error:', error);
            }
          }}>
          <Icon name="account-switch" size={16} color="#fff" />
          {isUnassignedLoading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.assignButtonText}>
              Unassign {deliveryPartnerDetails?.name || 'Delivery Partner'}
            </Text>
          )}
        </TouchableOpacity>
      )}

      <OrderDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        order={props}
        vendor={vendor}
        finance={finance}
      />

      <Modal
        visible={assignModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAssignModalVisible(false)}>
        <View style={styles.assignModalOverlay}>
          <View style={styles.assignModalCard}>
            <View style={styles.assignModalHeader}>
              <Text style={styles.assignModalTitle}>
                Assign Delivery Partner
              </Text>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                <Icon name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>
            <Text style={styles.assignModalSubTitle}>
              Online partners available for order #{orderId}
            </Text>
            {!!partnersWithDistance.length && (
              <Text style={styles.assignHintText}>
                Showing nearest partners first based on shop location.
              </Text>
            )}

            {onlinePartners.length === 0 ? (
              <View style={styles.emptyPartnerState}>
                <Icon name="wifi-alert" size={18} color="#9CA3AF" />
                <Text style={styles.emptyPartnerStateText}>
                  No online delivery partners right now.
                </Text>
              </View>
            ) : (
              <FlatList
                data={partnersWithDistance}
                keyExtractor={(item, index) =>
                  getDeliveryPartnerId(item.partner) || `${index}`
                }
                contentContainerStyle={styles.partnerList}
                renderItem={({item}) => {
                  const partner = item.partner;
                  const partnerId = getDeliveryPartnerId(partner) || '';
                  const isSelected = partnerId === assignedPartnerId;
                  const assignedCount = partnerOrderCounts[partnerId] || 0;
                  const distanceText =
                    item.distanceKm === null
                      ? 'Distance unavailable'
                      : `${item.distanceKm.toFixed(2)} km from shop`;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.partnerRow,
                        isSelected && styles.partnerRowSelected,
                      ]}
                      disabled={!partnerId}
                      onPress={() => handleSelectPartner(partnerId)}>
                      <View style={styles.partnerAvatar}>
                        <Icon
                          name="account"
                          size={14}
                          color={isSelected ? '#0B6B4A' : '#0F172A'}
                        />
                      </View>
                      <View style={styles.partnerInfoBlock}>
                        <Text style={styles.partnerName} numberOfLines={1}>
                          {getDeliveryPartnerName(partner)}
                        </Text>
                        <Text style={styles.partnerMeta} numberOfLines={1}>
                          {partner.mobileNumber || 'Mobile not available'}
                        </Text>
                        <Text style={styles.partnerDistance} numberOfLines={1}>
                          {distanceText}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                        <Text style={{fontSize: 12, color: '#0B6B4A'}}>
                          {assignedCount} assigned
                        </Text>
                        {isSelected ? (
                          <Icon name="check-circle" size={18} color="#0B6B4A" />
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
      {/* Payment Proof Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}>
        <TouchableOpacity
          style={styles.imageModalOverlay}
          activeOpacity={1}
          onPress={() => setImageModalVisible(false)}>
          <View style={styles.imageModalCard}>
            <View style={styles.imageModalHeader}>
              <Text style={styles.imageModalTitle}>Payment Proof</Text>
              <TouchableOpacity onPress={() => setImageModalVisible(false)}>
                <Icon name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>
            {paymentProofUrl ? (
              <Image
                source={{uri: paymentProofUrl}}
                style={styles.imageModalImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default OrderSummaryCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTimeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 17,
    color: '#1E293B',
    fontFamily: FONT_FAMILY.outfitExtraBold,
  },
  clockIcon: {
    marginRight: 4,
  },
  time: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  details: {
    marginTop: 10,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    marginRight: 8,
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '62%',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  assignedBadgeText: {
    color: '#065F46',
    fontSize: 11,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  statusText: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.outfitBold,
    textTransform: 'capitalize',
  },
  detailLabel: {
    fontSize: 13,
    color: '#111827',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  pendingTimeValue: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bricolageBold,
  },
  itemsLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  financeCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  financeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  financeHeaderText: {
    color: '#0F172A',
    fontSize: 13,
    fontFamily: FONT_FAMILY.outfitBold,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  financeLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  financeValue: {
    fontSize: 12,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  financeDiscountLabel: {
    fontSize: 12,
    color: '#0B6B4A',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  financeDiscountValue: {
    fontSize: 12,
    color: '#0B6B4A',
    fontFamily: FONT_FAMILY.bricolageBold,
  },
  financeAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  financeStrikethrough: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  financeFreeText: {
    fontSize: 12,
    color: '#0B6B4A',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  financeDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
  },
  financeTotalLabel: {
    fontSize: 13,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  financeTotalValue: {
    fontSize: 13,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  transporterCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 12,
  },
  transporterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  transporterInfoBlock: {
    flex: 1,
  },
  transporterLabel: {
    color: '#1D4ED8',
    fontSize: 11,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  transporterName: {
    marginTop: 2,
    color: '#0F172A',
    fontSize: 13,
    fontFamily: FONT_FAMILY.outfitBold,
  },
  transporterMeta: {
    marginTop: 1,
    color: '#334155',
    fontSize: 12,
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  callTransporterButton: {
    borderRadius: 999,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  callTransporterButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  callTransporterButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  timelineWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 2,
  },
  timelineItem: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
    position: 'relative',
  },
  timelineConnector: {
    position: 'absolute',
    top: 17,
    height: 2,
    backgroundColor: '#CBD5E1',
    zIndex: 0,
  },
  timelineConnectorLeft: {
    left: 0,
    right: '50%',
  },
  timelineConnectorRight: {
    left: '50%',
    right: 0,
  },
  timelineConnectorCompleted: {
    backgroundColor: '#16A34A',
  },
  timelineIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineIconCompleted: {
    borderColor: '#86EFAC',
    backgroundColor: '#DCFCE7',
  },
  timelineIconCurrent: {
    borderColor: '#16A34A',
    borderWidth: 2,
  },
  timelineIconText: {
    fontSize: 15,
  },
  timelineLabel: {
    marginTop: 5,
    color: '#64748B',
    fontSize: 10,
    textAlign: 'center',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  timelineLabelCompleted: {
    color: '#166534',
    fontFamily: FONT_FAMILY.bricolageBold,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButton: {
    backgroundColor: '#EFF6FF',
  },
  contactButton: {
    backgroundColor: '#0EA5E9',
  },
  buttonText: {
    fontSize: 13,
    color: '#0C4A6E',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  contactButtonText: {
    color: '#ffffff',
  },
  assignButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  assignButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT_FAMILY.outfitBold,
  },
  assignModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  assignModalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    minHeight: 280,
    maxHeight: '72%',
  },
  assignModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignModalTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontFamily: FONT_FAMILY.outfitExtraBold,
  },
  assignModalSubTitle: {
    marginTop: 4,
    marginBottom: 10,
    color: '#475569',
    fontSize: 12,
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  assignHintText: {
    marginBottom: 8,
    color: '#0B6B4A',
    fontSize: 11,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  partnerList: {
    gap: 8,
    paddingBottom: 8,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  partnerRowSelected: {
    borderColor: '#6EE7B7',
    backgroundColor: '#ECFDF5',
  },
  partnerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  partnerInfoBlock: {
    flex: 1,
  },
  partnerName: {
    color: '#0F172A',
    fontSize: 13,
    fontFamily: FONT_FAMILY.outfitBold,
  },
  partnerMeta: {
    marginTop: 1,
    color: '#64748B',
    fontSize: 12,
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  partnerDistance: {
    marginTop: 2,
    color: '#0B6B4A',
    fontSize: 11,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  emptyPartnerState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  emptyPartnerStateText: {
    color: '#6B7280',
    fontSize: 13,
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  shopInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
    gap: 10,
  },
  shopLogoContainer: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shopLogo: {
    width: '100%',
    height: '100%',
  },
  shopDetailsBlock: {
    flex: 1,
  },
  shopName: {
    fontSize: 14,
    color: '#1E293B',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  shopAddress: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: FONT_FAMILY.bricolageRegular,
    marginTop: 2,
  },
  shopCallButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerCallIcon: {
    padding: 6,
  },
  timelineTimestamp: {
    marginTop: 3,
    color: '#475569',
    fontSize: 9,
    textAlign: 'center',
    fontFamily: FONT_FAMILY.bricolageRegular,
  },
  paymentProofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  paymentProofText: {
    flex: 1,
    color: '#065F46',
    fontSize: 12,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageModalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '75%',
    overflow: 'hidden',
  },
  imageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  imageModalTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontFamily: FONT_FAMILY.outfitBold,
  },
  imageModalImage: {
    width: '100%',
    height: 340,
  },
  transporterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 4,
  },
  transporterAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  timerRowActive: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  timerRowExpired: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  timerText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  timerTextActive: {
    color: '#B45309',
  },
  timerTextExpired: {
    color: '#DC2626',
  },
  assignButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
});
