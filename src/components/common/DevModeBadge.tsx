import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {FONT_FAMILY} from '../../assets/constants/fonts';
import {useDevModeStore} from '../../store/app/useDevModeStore';

const DevModeBadge: React.FC = () => {
  const insets = useSafeAreaInsets();
  const isDevMode = useDevModeStore(state => state.isDevMode);

  if (!isDevMode) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[styles.badge, {top: Math.max(insets.top, 8) + 6}]}>
      <Text style={styles.badgeText}>DEV MODE</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: 12,
    zIndex: 999,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#B91C1C',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: FONT_FAMILY.outfitExtraBold,
    letterSpacing: 0.6,
  },
});

export default DevModeBadge;
