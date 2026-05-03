import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../../contexts/Login/AuthProvider';
import {SettingsNavigationStackParamList} from '../../navigation/SettingsNavigation';
import {SafeAreaView} from 'react-native-safe-area-context';
import {FONT_FAMILY} from '../../assets/constants/fonts';
import {useDevModeStore} from '../../store/app/useDevModeStore';

type Props = StackScreenProps<SettingsNavigationStackParamList, 'SettingsHome'>;

const DEV_MODE_SECRET = 'Devmode';
const SECRET_TAP_WINDOW_MS = 1000;

const SettingsScreen: React.FC<Props> = ({navigation}) => {
  const auth = useAuth();
  const isDevMode = useDevModeStore(state => state.isDevMode);
  const enableDevMode = useDevModeStore(state => state.enableDevMode);
  const disableDevMode = useDevModeStore(state => state.disableDevMode);

  const [tapCount, setTapCount] = useState(0);
  const [lastTapAt, setLastTapAt] = useState(0);
  const [secretModalVisible, setSecretModalVisible] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [secretError, setSecretError] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleSignOut = () => {
    setLogoutModalVisible(true);
  };

  const handleConfirmSignOut = () => {
    setLogoutModalVisible(false);
    auth.signOut();
  };

  const handleHeaderTap = () => {
    const now = Date.now();
    const isTapInWindow = now - lastTapAt <= SECRET_TAP_WINDOW_MS;
    const nextTapCount = isTapInWindow ? tapCount + 1 : 1;

    setTapCount(nextTapCount);
    setLastTapAt(now);

    if (nextTapCount >= 3) {
      setTapCount(0);
      setSecretInput('');
      setSecretError('');
      setSecretModalVisible(true);
    }
  };

  const handleSubmitSecret = () => {
    if (secretInput.trim() !== DEV_MODE_SECRET) {
      setSecretError('Invalid secret. Please try again.');
      return;
    }

    enableDevMode();
    setSecretModalVisible(false);
    setSecretInput('');
    setSecretError('');
    setSuccessModalVisible(true);
  };

  const handleBroadcastPress = () => {
    if (!isDevMode) {
      return;
    }

    navigation.navigate('BroadcastNotifications');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={1} onPress={handleHeaderTap}>
            <Text style={styles.headerTitle}>Settings</Text>
          </TouchableOpacity>
          {isDevMode ? (
            <View style={styles.devChip}>
              <Text style={styles.devChipText}>DEV MODE</Text>
            </View>
          ) : (
            <View />
          )}
        </View>

        <View style={{padding: 16, flex: 1}}>
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

            {isDevMode ? (
              <TouchableOpacity
                style={styles.optionRow}
                onPress={handleBroadcastPress}
                activeOpacity={0.8}>
                <View style={styles.optionLeft}>
                  <View style={styles.iconWrap}>
                    <MaterialCommunityIcons
                      name="bullhorn-variant-outline"
                      size={20}
                      color="#0F766E"
                    />
                  </View>
                  <Text style={styles.optionLabel}>
                    Broadcast Notifications
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color="#64748B"
                />
              </TouchableOpacity>
            ) : null}

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

          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={logoutModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setLogoutModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.logoutIconWrap}>
                <MaterialCommunityIcons
                  name="logout-variant"
                  size={24}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.modalTitle}>Sign Out</Text>
              <Text style={styles.modalDescription}>
                Are you sure you want to sign out of this account?
              </Text>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setLogoutModalVisible(false)}>
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.logoutConfirmButton}
                  onPress={handleConfirmSignOut}>
                  <Text style={styles.modalPrimaryButtonText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={secretModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSecretModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Developer Access</Text>
              <Text style={styles.modalDescription}>
                Enter secret to unlock Dev Mode.
              </Text>

              <TextInput
                value={secretInput}
                onChangeText={value => {
                  setSecretInput(value);
                  if (secretError) {
                    setSecretError('');
                  }
                }}
                placeholder="Enter secret"
                placeholderTextColor="#94A3B8"
                style={styles.modalInput}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />

              {secretError ? (
                <Text style={styles.modalErrorText}>{secretError}</Text>
              ) : null}

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setSecretModalVisible(false);
                    setSecretInput('');
                    setSecretError('');
                  }}>
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                {isDevMode ? (
                  <TouchableOpacity
                    style={styles.modalDisableButton}
                    onPress={() => {
                      disableDevMode();
                      setSecretModalVisible(false);
                      setSecretInput('');
                      setSecretError('');
                    }}>
                    <Text style={styles.modalPrimaryButtonText}>Disable</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.modalPrimaryButton}
                    onPress={handleSubmitSecret}>
                    <Text style={styles.modalPrimaryButtonText}>Enable</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={successModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSuccessModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.successIconWrap}>
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={24}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.modalTitle}>Developer Mode Enabled</Text>
              <Text style={styles.modalDescription}>
                You now have developer access in this app.
              </Text>

              <TouchableOpacity
                style={[styles.modalPrimaryButton, styles.successModalButton]}
                onPress={() => setSuccessModalVisible(false)}>
                <Text style={styles.modalPrimaryButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    color: '#0f172a',
    fontFamily: FONT_FAMILY.bricolageBold,
  },
  devChip: {
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  devChipText: {
    fontSize: 11,
    color: '#B91C1C',
    fontFamily: FONT_FAMILY.outfitBold,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.outfitExtraBold,
  },
  modalDescription: {
    marginTop: 6,
    fontSize: 14,
    color: '#475569',
    fontFamily: FONT_FAMILY.outfitRegular,
  },
  modalInput: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.outfitRegular,
  },
  modalErrorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#B91C1C',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  modalActionsRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalCancelButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  modalCancelButtonText: {
    color: '#334155',
    fontFamily: FONT_FAMILY.outfitBold,
    fontSize: 13,
  },
  modalPrimaryButton: {
    borderRadius: 10,
    backgroundColor: '#0F766E',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  logoutConfirmButton: {
    borderRadius: 10,
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  modalDisableButton: {
    borderRadius: 10,
    backgroundColor: '#B91C1C',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  modalPrimaryButtonText: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY.outfitBold,
    fontSize: 13,
    textAlign: 'center',
  },
  successIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  successModalButton: {
    alignSelf: 'stretch',
  },
  logoutIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
});

export default SettingsScreen;
