// VendorCard.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, Switch } from 'react-native';

interface VendorCardProps {
  vendorName: string;
}

const VendorCard: React.FC<VendorCardProps> = ({ vendorName }) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const toggleSwitch = () => setIsEnabled(previousState => !previousState);

  return (
    <View style={styles.card}>
      <Text style={styles.vendorName}>{vendorName}</Text>
      <Switch
        trackColor={{ false: '#767577', true: '#103E60' }}
        thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
        onValueChange={toggleSwitch}
        value={isEnabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginVertical: 10,
    borderColor: '#111',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: 'transparent',
    width: '100%',
  },
  vendorName: {
    fontSize: 22,
    fontWeight: '500',
    color: 'black',
  },
});

export default VendorCard;
