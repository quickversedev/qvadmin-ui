import React, {useMemo, useState} from 'react';
import {
  FlatList,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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

const OrderSummaryCard = (props: OrderSummaryCardProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
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
  } = props;

  const statusStyles = getStatusStyles(state);
  const assignedPartner = deliveryPartnerDetails;
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
    state === ORDER_STATUS.ACCEPTED && orderId && !deliveryPartnerDetails;

  return (
    <View style={styles.card}>
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
      <Text
        style={{
          fontSize: 17,
          color: '#1E293B',
          fontFamily: FONT_FAMILY.outfitExtraBold,
          marginBottom: 8,
        }}>
        {customerName}'s Order
      </Text>
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

      {!!assignedPartner && (
        <View style={styles.transporterCard}>
          <View style={styles.transporterInfoBlock}>
            <Text style={styles.transporterLabel}>Assigned Transporter</Text>
            <Text style={styles.transporterName} numberOfLines={1}>
              {getDeliveryPartnerName(assignedPartner)}
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

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.viewButton]}
          onPress={() => setModalVisible(true)}>
          <Text style={styles.buttonText}>View Order ➔</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.contactButton]}
          onPress={handleCallCustomer}>
          <Text style={[styles.buttonText, styles.contactButtonText]}>
            Contact Customer
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          styles.viewButton,
          {marginTop: 10, backgroundColor: '#0f62fe'},
        ]}
        onPress={() =>
          navigationRef.current?.navigate('WebViewScreen', {url: orderLink})
        }>
        <Text
          style={{
            ...styles.buttonText,
            color: '#FFF',
            fontFamily: FONT_FAMILY.bricolageBold,
            fontSize: 13,
          }}>
          View SmartBiz Order ➔
        </Text>
      </TouchableOpacity>

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

      <OrderDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        order={props}
        vendor={vendor}
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
  transporterCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 10,
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
});
