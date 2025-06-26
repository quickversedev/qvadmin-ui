import React from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Props {
  visible: boolean;
  title: string;
  body: string;
  onClose: () => void;
}

const NotificationModal: React.FC<Props> = ({
  visible,
  title,
  body,
  onClose,
}) => {
  let parsedPayload: Record<string, any> = {};
  try {
    parsedPayload = JSON.parse(body);
  } catch (error) {
    console.warn('Failed to parse notification payload:', error);
  }
  console.log('Parsed payload:', parsedPayload);
  const {
    orderId,
    amount,
    campusName,
    campusId,
    vendorId,
    vendorName,
    customerName,
  } = parsedPayload || {};

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Image
            source={require('../../assets/images/logo_qv.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.titleText}>{title}</Text>

          <Text style={styles.bodyText}>
            🆕 New Order For{vendorName ? ` (${vendorName})` : ''}
          </Text>
          {orderId && (
            <Text style={styles.detailText}>🆔 Order ID: {orderId}</Text>
          )}
          {amount && (
            <Text style={styles.detailText}>💰 Amount: ₹{amount}</Text>
          )}
          {customerName && (
            <Text style={styles.detailText}>👤 Customer: {customerName}</Text>
          )}
          {campusName && (
            <Text style={styles.detailText}>👤 Camppus: {campusName}</Text>
          )}

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>❌ Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    position: 'absolute',
    top: 5,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 5,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
  },
  logo: {
    width: 48,
    height: 48,
    marginBottom: 10,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 6,
    textAlign: 'center',
  },
  bodyText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#eee',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#000',
    fontSize: 14,
  },
});

export default NotificationModal;
