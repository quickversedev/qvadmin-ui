// src/components/OrderSummaryCard.tsx
import React, {useState} from 'react';
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
import {Vendor} from '../../store/vendors/useVendorStore';
import {
  DeliveryPartner,
  getDeliveryPartnerId,
  getDeliveryPartnerName,
} from '../../services/apis/deliveryPartnerService';
import {FONT_FAMILY} from '../../assets/constants/fonts';

import {ORDER_STATUS} from '../../assets/constants/constant';

type OrderSummaryCardProps = Order & {
  key?: string;
  vendor: Vendor;
  showAssignment?: boolean;
  onlinePartners?: DeliveryPartner[];
  assignedPartnerId?: string;
  onAssignPartner?: (orderId: string, partnerId: string) => void;
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
    showAssignment,
    onlinePartners = [],
    assignedPartnerId,
    onAssignPartner,
  } = props;

  const statusStyles = getStatusStyles(state);
  const assignedPartner = onlinePartners.find(
    partner => getDeliveryPartnerId(partner) === assignedPartnerId,
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
    const phoneNumber = `tel:${customerMobile}`;
    Linking.openURL(phoneNumber);
  };

  const handleSelectPartner = (partnerId: string) => {
    if (!orderId || !partnerId || !onAssignPartner) {
      return;
    }

    onAssignPartner(orderId, partnerId);
    setAssignModalVisible(false);
  };

  const canAssignPartner =
    showAssignment &&
    state === ORDER_STATUS.ACCEPTED &&
    orderId &&
    typeof onAssignPartner === 'function';

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

      {canAssignPartner && (
        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => setAssignModalVisible(true)}>
          <Icon name="account-switch" size={16} color="#fff" />
          <Text style={styles.assignButtonText}>
            {assignedPartner ? 'Reassign Partner' : 'Assign Delivery Partner'}
          </Text>
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

            {onlinePartners.length === 0 ? (
              <View style={styles.emptyPartnerState}>
                <Icon name="wifi-alert" size={18} color="#9CA3AF" />
                <Text style={styles.emptyPartnerStateText}>
                  No online delivery partners right now.
                </Text>
              </View>
            ) : (
              <FlatList
                data={onlinePartners}
                keyExtractor={(item, index) =>
                  getDeliveryPartnerId(item) || `${index}`
                }
                contentContainerStyle={styles.partnerList}
                renderItem={({item}) => {
                  const partnerId = getDeliveryPartnerId(item);
                  const isSelected = partnerId === assignedPartnerId;

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
                          {getDeliveryPartnerName(item)}
                        </Text>
                        <Text style={styles.partnerMeta} numberOfLines={1}>
                          {item.mobileNumber || 'Mobile not available'}
                        </Text>
                      </View>
                      {isSelected ? (
                        <Icon name="check-circle" size={18} color="#0B6B4A" />
                      ) : null}
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
