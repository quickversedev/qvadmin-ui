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

import {getStatusStyles} from './DashBoardUtil';
import {Shop} from '../../types';
import {FONT_FAMILY} from '../../assets/constants/fonts';

type OrderCardProps = {
  vendor: Shop;
  status: string;
  children?: React.ReactNode;
};

const formatMobile = (
  customerMobile: string | number | null | undefined,
): string => {
  if (!customerMobile) return '';

  const mobile = String(customerMobile).trim();

  // Case: starts with 91 and length is 12
  if (mobile.length === 12 && mobile.startsWith('91')) {
    return mobile.slice(2);
  }

  return mobile;
};

const CollapsableVendor: React.FC<OrderCardProps> = ({
  status,
  vendor,
  children,
}) => {
  const [expanded, setExpanded] = useState(false);
  const {phone, logo, name} = vendor?.shopDetails || {};

  const handleToggleExpand = () => {
    setExpanded(prev => !prev);
  };

  const handleCallCustomer = () => {
    const phoneNumber = `tel:${formatMobile(phone)}`;
    Linking.openURL(phoneNumber);
  };

  const statusStyles = getStatusStyles(status);
  const orderCount = vendor?.orders?.length;

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={handleToggleExpand}>
        <View style={styles.vendorInfo}>
          <View style={styles.logoContainer}>
            <Image
              source={
                logo
                  ? {uri: logo}
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
            {name}
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
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginVertical: 5,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 9,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
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
  vendorName: {
    fontSize: 16,
    color: '#111',
    marginRight: 6,
    width: '50%',
    fontFamily: FONT_FAMILY.outfitBold,
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
    backgroundColor: '#0f62fe',
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
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  details: {
    marginTop: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 8,
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
    fontFamily: FONT_FAMILY.outfitBold,
  },
});

export default CollapsableVendor;
