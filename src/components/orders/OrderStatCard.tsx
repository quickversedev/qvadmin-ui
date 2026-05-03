// OrderStatCard.tsx
import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  GestureResponderEvent,
  ViewStyle,
  View,
} from 'react-native';
import {FONT_FAMILY} from '../../assets/constants/fonts';

interface OrderStatusCardProps {
  size: 'm' | 'l';
  label: string;
  value?: number | string;
  color: string;
  onPress?: (event: GestureResponderEvent) => void;
  icon?: React.ReactNode;
}

const sizeStyles = {
  m: {widthPercent: '46%', height: 100, fontSizeValue: 32, fontSizeLabel: 14},
  l: {widthPercent: '96%', height: 100, fontSizeValue: 40, fontSizeLabel: 18},
};

const OrderStatCard: React.FC<OrderStatusCardProps> = ({
  size,
  label,
  value,
  color,
  onPress,
  icon,
}) => {
  const s = sizeStyles[size];
  const valueText = value === undefined || value === null ? '' : String(value);
  const valueLength = valueText.length;
  const valueFontSize =
    valueLength > 10
      ? s.fontSizeValue - 10
      : valueLength > 7
      ? s.fontSizeValue - 6
      : s.fontSizeValue;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      disabled={!onPress}
      style={[
        styles.container,
        {
          backgroundColor: color,
          width: s.widthPercent,
          height: s.height,
        } as ViewStyle,
      ]}>
      {/* Icon — absolute top-right, matching the reference screenshot */}
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}

      {/* Label — top-left */}
      <Text
        style={[styles.labelText, {fontSize: s.fontSizeLabel}]}
        numberOfLines={2}>
        {label}
      </Text>

      {/* Value — bottom-left */}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.65}
        style={[styles.valueText, {fontSize: valueFontSize}]}>
        {valueText}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: 'space-between', // label top, value bottom
    alignItems: 'flex-start',
    margin: 6,
    shadowColor: '#0f172a',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  valueText: {
    color: '#0f172a',
    fontFamily: FONT_FAMILY.outfitExtraBold,
  },
  labelText: {
    color: '#374151',
    fontFamily: FONT_FAMILY.bricolageMedium,
    flexShrink: 1,
    paddingRight: 28,
  },
  iconWrap: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 2,
    opacity: 0.9,
  },
});

export default OrderStatCard;
