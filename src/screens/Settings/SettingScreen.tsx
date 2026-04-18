import React from 'react';
import {View, StyleSheet, TouchableOpacity, Text, Alert} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../../contexts/Login/AuthProvider';
import {SettingsStackParamList} from '../../navigation/SettingsNavigation';
import {SafeAreaView} from 'react-native-safe-area-context';
import {FONT_FAMILY} from '../../assets/constants/fonts';

type Props = StackScreenProps<SettingsStackParamList, 'SettingsHome'>;

const SettingsScreen: React.FC<Props> = ({navigation}) => {
  const auth = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => auth.signOut(),
        },
      ],
      {cancelable: false},
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Settings</Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => navigation.navigate('Transporters')}
            activeOpacity={0.8}>
            <View style={styles.optionLeft}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons
                  name="truck-fast-outline"
                  size={20}
                  color="#0F766E"
                />
              </View>
              <Text style={styles.optionLabel}>Transporters</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color="#64748B"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => navigation.navigate('Configurations')}
            activeOpacity={0.8}>
            <View style={styles.optionLeft}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons
                  name="tune-variant"
                  size={20}
                  color="#0F766E"
                />
              </View>
              <Text style={styles.optionLabel}>Configurations</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color="#64748B"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => navigation.navigate('PagesPromotionalBanners')}
            activeOpacity={0.8}>
            <View style={styles.optionLeft}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons
                  name="image-multiple-outline"
                  size={20}
                  color="#0F766E"
                />
              </View>
              <Text style={styles.optionLabel}>
                Pages / Promotional Banners
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color="#64748B"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: FONT_FAMILY.outfitExtraBold,
    color: '#0F172A',
    marginBottom: 18,
  },
  optionsContainer: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ECFEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bricolageMedium,
    color: '#1E293B',
  },
  signOutButton: {
    backgroundColor: '#DC2626',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY.outfitBold,
    fontSize: 16,
  },
});

export default SettingsScreen;
