// OrderStatusCard.tsx
import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  GestureResponderEvent,
} from 'react-native';

interface OrderStatusCardProps {
  size: 's' | 'm' | 'l';
  label: string;
  value: number;
  color: string;
  onPress?: (event: GestureResponderEvent) => void;
}

const sizeStyles = {
  m: {width: '45%', height: 100, fontSizeValue: 30, fontSizeLabel: 14},
  l: {width: '95%', height: 100, fontSizeValue: 40, fontSizeLabel: 18},
};

const DashboardTile: React.FC<OrderStatusCardProps> = ({
  size,
  label,
  value,
  color,
  onPress,
}) => {
  const currentSize = sizeStyles[size];

  return (
    // <View
    //   style={[
    //     styles.container,
    //     {
    //       backgroundColor: color,
    //       width: currentSize.width,
    //       height: currentSize.height,
    //     },
    //   ]}>
    //   <Text style={[styles.valueText, {fontSize: currentSize.fontSizeValue}]}>
    //     {value}
    //   </Text>
    //   <Text style={[styles.labelText, {fontSize: currentSize.fontSizeLabel}]}>
    //     {label} ›
    //   </Text>
    // </View>
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
      style={[
        styles.container,
        {
          backgroundColor: color,
          width: currentSize.width,
          height: currentSize.height,
        },
      ]}>
      <Text style={[styles.valueText, {fontSize: currentSize.fontSizeValue}]}>
        {value}
      </Text>
      <Text style={[styles.labelText, {fontSize: currentSize.fontSizeLabel}]}>
        {label} ›
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 10,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    margin: 8,
  },
  valueText: {
    fontWeight: 'bold',
    color: '#000',
  },
  labelText: {
    fontWeight: '600',
    color: '#000',
  },
});

export default DashboardTile;
