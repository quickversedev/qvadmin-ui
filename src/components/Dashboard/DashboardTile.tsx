// OrderStatusCard.tsx
import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  GestureResponderEvent,
  ViewStyle,
} from 'react-native';
import {FONT_FAMILY} from '../../assets/constants/fonts';

interface OrderStatusCardProps {
  size: 'm' | 'l';
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
        } as ViewStyle,
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
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    margin: 8,
    borderWidth: 1,
    borderColor: '#dbe9ff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 3},
    elevation: 2,
  },
  valueText: {
    color: '#0f172a',
    fontFamily: FONT_FAMILY.outfitExtraBold,
  },
  labelText: {
    color: '#0f172a',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
});

export default DashboardTile;
