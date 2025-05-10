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

type OrderCardProps = {
  vendorName: string;
  vendorLogoUrl: string;
  status: OrderStatus;
  children?: React.ReactNode;
  vendorPhone: string;
};

const CollapsableVendor: React.FC<OrderCardProps> = ({
  vendorName,
  vendorLogoUrl,
  status,
  vendorPhone,
  children,
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleToggleExpand = () => {
    setExpanded(prev => !prev);
  };
  const handleCallCustomer = () => {
    const phoneNumber = `tel:${vendorPhone}`;
    Linking.openURL(phoneNumber);
  };
  const statusStyles = getStatusStyles(status);
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={handleToggleExpand}>
        <View style={styles.vendorInfo}>
          <Image
            source={{uri: vendorLogoUrl}}
            style={styles.vendorLogo}
            resizeMode="contain"
          />

          <Text style={styles.vendorName}>{vendorName}</Text>

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
            <Text style={styles.callButtonText}>Call </Text>
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
  vendorLogo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginRight: 6,
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
});

export default CollapsableVendor;
