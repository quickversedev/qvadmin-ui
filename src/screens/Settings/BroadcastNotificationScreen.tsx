import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {SafeAreaView} from 'react-native-safe-area-context';

import {FONT_FAMILY} from '../../assets/constants/fonts';
import {SettingsNavigationStackParamList} from '../../navigation/SettingsNavigation';
import {sendCustomerBroadcastNotification} from '../../services/apis/broadcastNotificationService';
import {useDevModeStore} from '../../store/app/useDevModeStore';

type Props = StackScreenProps<
  SettingsNavigationStackParamList,
  'BroadcastNotifications'
>;

type BroadcastAudience = 'CUSTOMERS' | 'CAPTAINS' | 'TRANSPORTERS';

type FeedbackModalState = {
  visible: boolean;
  title: string;
  message: string;
  buttonLabel: string;
  variant: 'success' | 'error' | 'info';
};

const BroadcastNotificationScreen: React.FC<Props> = ({navigation}) => {
  const isDevMode = useDevModeStore(state => state.isDevMode);
  const [activeAudience, setActiveAudience] =
    useState<BroadcastAudience>('CUSTOMERS');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState>({
    visible: false,
    title: '',
    message: '',
    buttonLabel: 'OK',
    variant: 'info',
  });

  const isCustomersAudience = activeAudience === 'CUSTOMERS';

  const audienceHelpText = useMemo(() => {
    if (isCustomersAudience) {
      return 'Send a notification broadcast to all customers.';
    }

    return 'Broadcast API for this audience is not available yet.';
  }, [isCustomersAudience]);

  const showFeedbackModal = (
    modalTitle: string,
    message: string,
    variant: FeedbackModalState['variant'] = 'info',
    buttonLabel = 'OK',
  ) => {
    setFeedbackModal({
      visible: true,
      title: modalTitle,
      message,
      buttonLabel,
      variant,
    });
  };

  const hideFeedbackModal = () => {
    setFeedbackModal(prev => ({...prev, visible: false}));
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
  };

  useEffect(() => {
    if (!isDevMode) {
      navigation.goBack();
    }
  }, [isDevMode, navigation]);

  const onSend = async () => {
    if (!isDevMode) {
      return;
    }

    if (!isCustomersAudience) {
      showFeedbackModal(
        'Not Available',
        'Only customer broadcast is enabled right now.',
        'info',
      );
      return;
    }

    if (!title.trim()) {
      showFeedbackModal('Validation', 'Title is required.', 'error');
      return;
    }

    if (!description.trim()) {
      showFeedbackModal('Validation', 'Description is required.', 'error');
      return;
    }

    setSending(true);
    try {
      await sendCustomerBroadcastNotification({
        title,
        description,
      });

      resetForm();
      showFeedbackModal(
        'Success',
        'Broadcast notification sent successfully.',
        'success',
        'Done',
      );
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as {message?: string}).message)
          : 'Failed to send broadcast notification';

      showFeedbackModal('Send Failed', errorMessage, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Audience</Text>
            <View style={styles.tabRow}>
              {(['CUSTOMERS', 'CAPTAINS', 'TRANSPORTERS'] as const).map(
                audience => {
                  const isActive = activeAudience === audience;

                  return (
                    <TouchableOpacity
                      key={audience}
                      style={[styles.tabPill, isActive && styles.tabPillActive]}
                      onPress={() => setActiveAudience(audience)}
                      activeOpacity={0.85}>
                      <Text
                        style={[
                          styles.tabPillText,
                          isActive && styles.tabPillTextActive,
                        ]}>
                        {audience.charAt(0) + audience.slice(1).toLowerCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                },
              )}
            </View>
            <Text
              style={[
                styles.helperText,
                !isCustomersAudience && styles.helperTextWarning,
              ]}>
              {audienceHelpText}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Compose Notification</Text>

            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              placeholder="Enter title"
              placeholderTextColor="#94A3B8"
              editable={!sending && isCustomersAudience}
              maxLength={120}
            />

            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={[styles.input, styles.descriptionInput]}
              placeholder="Enter description"
              placeholderTextColor="#94A3B8"
              editable={!sending && isCustomersAudience}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (sending || !isCustomersAudience) && styles.submitButtonDisabled,
            ]}
            onPress={onSend}
            disabled={sending || !isCustomersAudience}>
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={feedbackModal.visible}
          transparent
          animationType="fade"
          onRequestClose={hideFeedbackModal}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{feedbackModal.title}</Text>
              <Text style={styles.modalMessage}>{feedbackModal.message}</Text>

              <TouchableOpacity
                style={[
                  styles.modalPrimaryButton,
                  feedbackModal.variant === 'success'
                    ? styles.modalPrimaryButtonSuccess
                    : feedbackModal.variant === 'error'
                    ? styles.modalPrimaryButtonError
                    : styles.modalPrimaryButtonInfo,
                ]}
                onPress={() => {
                  const shouldNavigateBack =
                    feedbackModal.variant === 'success';
                  hideFeedbackModal();

                  if (shouldNavigateBack) {
                    navigation.goBack();
                  }
                }}>
                <Text style={styles.modalPrimaryButtonText}>
                  {feedbackModal.buttonLabel}
                </Text>
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
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  content: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.outfitBold,
    marginBottom: 10,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tabPill: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  tabPillActive: {
    borderColor: '#0F766E',
    backgroundColor: '#0F766E',
  },
  tabPillText: {
    color: '#334155',
    fontSize: 13,
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
  helperText: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 12,
    fontFamily: FONT_FAMILY.outfitRegular,
  },
  helperTextWarning: {
    color: '#B45309',
  },
  inputLabel: {
    fontSize: 12,
    color: '#334155',
    fontFamily: FONT_FAMILY.bricolageMedium,
    marginBottom: 6,
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.outfitRegular,
    marginBottom: 10,
  },
  descriptionInput: {
    minHeight: 104,
    maxHeight: 180,
  },
  submitButton: {
    backgroundColor: '#0F766E',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONT_FAMILY.outfitBold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 18,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.outfitBold,
    marginBottom: 6,
  },
  modalMessage: {
    fontSize: 14,
    color: '#334155',
    fontFamily: FONT_FAMILY.outfitRegular,
    lineHeight: 20,
    marginBottom: 14,
  },
  modalPrimaryButton: {
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalPrimaryButtonSuccess: {
    backgroundColor: '#15803D',
  },
  modalPrimaryButtonError: {
    backgroundColor: '#B91C1C',
  },
  modalPrimaryButtonInfo: {
    backgroundColor: '#0F766E',
  },
  modalPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONT_FAMILY.outfitBold,
  },
});

export default BroadcastNotificationScreen;
