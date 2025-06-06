import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {OrderStatus} from '../../types/Order';

import {getStatusStyles} from './DashBoardUtil';
import {useOrderStore} from '../../store/orders/useOrdersStore';

type OrderCardProps = {
  vendorName: string;
  vendorLogoUrl: string;
  status: OrderStatus;
  children?: React.ReactNode;
  vendorPhone: string;
  vendorId: string; // Optional, if needed for further functionality
};

const CollapsableVendor: React.FC<OrderCardProps> = ({
  vendorName,
  vendorLogoUrl,
  status,
  vendorPhone,
  children,
  vendorId,
}) => {
  const [expanded, setExpanded] = useState(false);
  const {getVendorOrdersCountByStatus} = useOrderStore();
  const handleToggleExpand = () => {
    setExpanded(prev => !prev);
  };
  const handleCallCustomer = () => {
    const phoneNumber = `tel:${vendorPhone}`;
    Linking.openURL(phoneNumber);
  };
  const statusStyles = getStatusStyles(status);
  const orderCount = getVendorOrdersCountByStatus(Number(vendorId), status);
  console.log(
    `CollapsableVendor: vendorId=${vendorId}, status=${status}, orderCount=${orderCount}`,
  );
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={handleToggleExpand}>
        <View style={styles.vendorInfo}>
          <View style={styles.logoContainer}>
            <Image
              source={
                vendorLogoUrl
                  ? {uri: vendorLogoUrl}
                  : require('../../assets/images/default_logo.png')
              }
              style={styles.vendorLogo}
              resizeMode="contain"
            />
            {orderCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{orderCount}</Text>
              </View>
            )}
          </View>

          <Text numberOfLines={2} style={styles.vendorName}>
            {vendorName}
          </Text>

          <Icon
            name={statusStyles.icon}
            size={20}
            color={statusStyles.color}
            style={{
              marginRight: 4,
              backgroundColor: statusStyles.backgroundColor,
              borderRadius: 6,
            }}
          />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.callButton}
            onPress={handleCallCustomer}>
            <Icon
              name="phone"
              size={16}
              color="#fff"
              style={{marginRight: 4}}
            />
          </TouchableOpacity>

          <Icon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color="#333"
          />
        </View>
      </TouchableOpacity>

      {expanded && <View style={styles.details}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginVertical: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // vendorLogo: {
  //   width: 40,
  //   height: 40,
  //   marginRight: 10,
  //   borderRadius: 20,
  // },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginRight: 6,
    width: '50%',
  },
  // statusStyle: {
  //   width: 12,
  //   height: 12,
  //   borderRadius: 6,
  // },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callButton: {
    backgroundColor: '#0057A0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginRight: 10,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  details: {
    marginTop: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
  },
  logoContainer: {
    position: 'relative',
    marginRight: 10,
  },
  vendorLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  countBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#f04d7d',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    borderWidth: 1.5,
    borderColor: 'white',
  },
  countText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default CollapsableVendor;
