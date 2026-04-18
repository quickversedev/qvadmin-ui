import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import {useFocusEffect} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useAuth} from '../../contexts/Login/AuthProvider';
import {FONT_FAMILY} from '../../assets/constants/fonts';
import {SettingsStackParamList} from '../../navigation/SettingsNavigation';
import {Region, useRegionsStore} from '../../store/regions/useRegionsStore';
import {usePagesStore} from '../../store/pages/usePagesStore';
import {
  createPage,
  deletePage,
  PromotionBanner,
  updatePage,
} from '../../services/apis/pagesService';
import {deletePromotion} from '../../services/apis/promotionService';

type Props = StackScreenProps<
  SettingsStackParamList,
  'PagesPromotionalBanners'
>;

const PagesPromotionalBannersScreen: React.FC<Props> = ({navigation}) => {
  const {authData} = useAuth();
  const {
    regions,
    selectedRegion,
    isLoading: regionsLoading,
    fetchRegions,
    selectRegion,
  } = useRegionsStore();

  const {
    pages,
    selectedPageName,
    loading,
    error,
    fetchPages,
    setSelectedPageName,
  } = usePagesStore();

  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedPromotionForDelete, setSelectedPromotionForDelete] =
    useState<PromotionBanner | null>(null);
  const [deletingPromotionId, setDeletingPromotionId] = useState<string | null>(
    null,
  );
  const [pageFormModalVisible, setPageFormModalVisible] = useState(false);
  const [pageFormMode, setPageFormMode] = useState<'create' | 'edit'>('create');
  const [pageFormSubmitting, setPageFormSubmitting] = useState(false);
  const [deletePageModalVisible, setDeletePageModalVisible] = useState(false);
  const [pageDeleteSubmitting, setPageDeleteSubmitting] = useState(false);
  const [pageForm, setPageForm] = useState({
    pageName: '',
    posterLink: '',
  });
  const [feedbackModal, setFeedbackModal] = useState({
    visible: false,
    title: '',
    message: '',
    variant: 'info' as 'success' | 'error' | 'info',
    buttonLabel: 'OK',
  });

  const showFeedbackModal = (
    title: string,
    message: string,
    variant: 'success' | 'error' | 'info' = 'info',
    buttonLabel = 'OK',
  ) => {
    setFeedbackModal({
      visible: true,
      title,
      message,
      variant,
      buttonLabel,
    });
  };

  const hideFeedbackModal = () => {
    setFeedbackModal(prev => ({...prev, visible: false}));
  };

  const selectedPage = useMemo(() => {
    if (!pages.length) {
      return null;
    }

    if (!selectedPageName) {
      return pages[0];
    }

    return pages.find(page => page.pageName === selectedPageName) || pages[0];
  }, [pages, selectedPageName]);

  const pageNames = useMemo(() => pages.map(page => page.pageName), [pages]);
  const promotions = selectedPage?.promotion || [];

  const getPromotionId = (item: PromotionBanner) => {
    const rawId = item.promoId;
    if (rawId === undefined || rawId === null || String(rawId).trim() === '') {
      return null;
    }

    return String(rawId);
  };

  const getSelectedPageId = () => {
    const page = selectedPage as
      | ({
          pageId?: string | number;
          id?: string | number;
          pageID?: string | number;
        } & typeof selectedPage)
      | null;

    const rawId = page?.pageId ?? page?.id ?? page?.pageID;
    if (rawId === undefined || rawId === null || String(rawId).trim() === '') {
      return null;
    }

    return String(rawId);
  };

  const fetchPagesForRegion = async (region?: Region | null) => {
    if (!region?.regionId || !authData?.jwt) {
      return;
    }

    await fetchPages(region.regionId, authData.jwt);
  };

  useEffect(() => {
    const loadRegionsAndPages = async () => {
      await fetchRegions();
    };

    loadRegionsAndPages();
  }, [fetchRegions]);

  useEffect(() => {
    if (selectedRegion?.regionId && authData?.jwt) {
      fetchPagesForRegion(selectedRegion);
    }
  }, [selectedRegion?.regionId, authData?.jwt]);

  useFocusEffect(
    useCallback(() => {
      if (selectedRegion?.regionId && authData?.jwt) {
        fetchPagesForRegion(selectedRegion);
      }
    }, [selectedRegion?.regionId, authData?.jwt]),
  );

  useEffect(() => {
    if (pageNames.length && !selectedPageName) {
      setSelectedPageName(pageNames[0]);
    }
  }, [pageNames, selectedPageName, setSelectedPageName]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPagesForRegion(selectedRegion);
    } finally {
      setRefreshing(false);
    }
  };

  const onSelectRegion = async (region: Region) => {
    if (selectedRegion?.regionId === region.regionId) {
      return;
    }

    selectRegion(region);
    setSelectedPageName(null);
    await fetchPagesForRegion(region);
  };

  const renderRegionChip = (region: Region) => {
    const isSelected = selectedRegion?.regionId === region.regionId;
    return (
      <TouchableOpacity
        key={region.regionId}
        style={[styles.filterChip, isSelected && styles.filterChipActive]}
        onPress={() => onSelectRegion(region)}
        activeOpacity={0.85}>
        <Text
          style={[
            styles.filterChipText,
            isSelected && styles.filterChipTextActive,
          ]}>
          {region.displayName || region.regionName}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPageChip = (pageName: string) => {
    const isSelected = selectedPageName === pageName;

    return (
      <TouchableOpacity
        key={pageName}
        style={[styles.pageChip, isSelected && styles.pageChipActive]}
        onPress={() => setSelectedPageName(pageName)}
        activeOpacity={0.85}>
        <Text
          style={[
            styles.pageChipText,
            isSelected && styles.pageChipTextActive,
          ]}>
          {pageName}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderBannerItem = ({
    item,
    index,
  }: {
    item: PromotionBanner;
    index: number;
  }) => {
    const promotionId = getPromotionId(item);

    const handleEditBanner = () => {
      if (!promotionId) {
        showFeedbackModal(
          'Edit Unavailable',
          'Promotion ID is missing for this banner, so it cannot be edited.',
          'error',
        );
        return;
      }

      navigation.navigate('AddPromotionBanner', {
        mode: 'edit',
        pageName: selectedPage?.pageName,
        regionId: selectedRegion?.regionId,
        promotionId,
        promotionData: item,
      });
    };

    const handleDeleteBanner = () => {
      setSelectedPromotionForDelete(item);
      setDeleteModalVisible(true);
    };

    return (
      <View style={styles.bannerCard}>
        <Image
          source={{uri: item.imageURL}}
          style={styles.bannerImage}
          resizeMode="cover"
        />
        <View style={styles.bannerMetaWrap}>
          <View style={styles.bannerTitleRow}>
            <Text style={styles.bannerTitle} numberOfLines={1}>
              {item.title || `Banner ${index + 1}`}
            </Text>
            <Text style={styles.shopBadge}>Shop: {item.shopId || 'N/A'}</Text>
          </View>

          {item.subtitle ? (
            <Text style={styles.bannerSubtitle} numberOfLines={2}>
              {item.subtitle}
            </Text>
          ) : null}

          <Text style={styles.bannerMeta}>Size: {item.size || 'NA'}</Text>

          <View style={styles.bannerActionsRow}>
            <TouchableOpacity
              style={styles.smallActionButton}
              onPress={handleEditBanner}>
              <MaterialCommunityIcons
                name="pencil-outline"
                size={14}
                color="#0F172A"
              />
              <Text style={styles.smallActionButtonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallActionButton, styles.smallActionButtonDanger]}
              onPress={handleDeleteBanner}>
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={14}
                color="#B91C1C"
              />
              <Text
                style={[
                  styles.smallActionButtonText,
                  styles.smallActionButtonDangerText,
                ]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderManagementActions = () => {
    const selectedPageId = getSelectedPageId();

    const handleOpenCreatePageModal = () => {
      if (!selectedRegion?.regionId) {
        showFeedbackModal('Add Page Failed', 'Please select a region first.', 'error');
        return;
      }

      setPageFormMode('create');
      setPageForm({pageName: '', posterLink: ''});
      setPageFormModalVisible(true);
    };

    const handleOpenEditPageModal = () => {
      if (!selectedPage || !selectedPageId) {
        showFeedbackModal('Edit Page Failed', 'No page selected to edit.', 'error');
        return;
      }

      setPageFormMode('edit');
      setPageForm({
        pageName: selectedPage.pageName || '',
        posterLink: selectedPage.posterLink || '',
      });
      setPageFormModalVisible(true);
    };

    const handleOpenDeletePageModal = () => {
      if (!selectedPage || !selectedPageId) {
        showFeedbackModal('Delete Page Failed', 'No page selected to delete.', 'error');
        return;
      }

      setDeletePageModalVisible(true);
    };

    return (
      <View style={styles.managementCard}>
        <Text style={styles.managementTitle}>Management Actions</Text>

        <View style={styles.managementItemRow}>
          <View>
            <Text style={styles.managementLabel}>Region</Text>
            <Text style={styles.managementValue} numberOfLines={1}>
              {selectedRegion?.displayName ||
                selectedRegion?.regionName ||
                'No region selected'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.outlineActionButton}
            onPress={handleOpenCreatePageModal}>
            <Text style={styles.outlineActionButtonText}>Add Page Type</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.managementItemRow}>
          <View>
            <Text style={styles.managementLabel}>Page Type</Text>
            <Text style={styles.managementValue} numberOfLines={1}>
              {selectedPage?.pageName || 'No page selected'}
            </Text>
          </View>
          <View style={styles.inlineActionsGroup}>
            <TouchableOpacity
              style={styles.outlineActionButton}
              onPress={handleOpenEditPageModal}>
              <Text style={styles.outlineActionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.outlineActionButton,
                styles.outlineActionButtonDanger,
              ]}
              onPress={handleOpenDeletePageModal}>
              <Text
                style={[
                  styles.outlineActionButtonText,
                  styles.outlineActionButtonDangerText,
                ]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.managementItemRowNoBorder}>
          <View>
            <Text style={styles.managementLabel}>Promotional Banners</Text>
            <Text style={styles.managementValue}>
              {promotions.length} items in selected page
            </Text>
          </View>
          <TouchableOpacity
            style={styles.outlineActionButton}
            onPress={() =>
              navigation.navigate('AddPromotionBanner', {
                mode: 'create',
                pageName: selectedPage?.pageName,
                regionId: selectedRegion?.regionId,
              })
            }>
            <Text style={styles.outlineActionButtonText}>Add Banner</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleSubmitPageForm = async () => {
    if (!authData?.jwt) {
      showFeedbackModal('Save Page Failed', 'Session expired. Please login again.', 'error');
      return;
    }

    if (!selectedRegion?.regionId) {
      showFeedbackModal('Save Page Failed', 'Region is required.', 'error');
      return;
    }

    if (!pageForm.pageName.trim()) {
      showFeedbackModal('Validation', 'pageName is required', 'error');
      return;
    }

    const selectedPageId = getSelectedPageId();
    if (pageFormMode === 'edit' && !selectedPageId) {
      showFeedbackModal('Edit Page Failed', 'Page ID is missing for selected page.', 'error');
      return;
    }

    setPageFormSubmitting(true);
    try {
      if (pageFormMode === 'create') {
        await createPage(
          {
            pageName: pageForm.pageName.trim(),
            regionId: selectedRegion.regionId,
            posterLink: pageForm.posterLink.trim(),
          },
          authData.jwt,
        );
      } else {
        await updatePage(
          selectedPageId!,
          {
            pageName: pageForm.pageName.trim(),
            posterLink: pageForm.posterLink.trim(),
          },
          authData.jwt,
        );
      }

      await fetchPagesForRegion(selectedRegion);
      setSelectedPageName(pageForm.pageName.trim());
      setPageFormModalVisible(false);
      showFeedbackModal(
        'Success',
        `Page ${pageFormMode === 'create' ? 'created' : 'updated'} successfully`,
        'success',
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `Failed to ${pageFormMode} page`;
      showFeedbackModal(
        pageFormMode === 'create' ? 'Create Page Failed' : 'Edit Page Failed',
        message,
        'error',
      );
    } finally {
      setPageFormSubmitting(false);
    }
  };

  const handleConfirmDeletePage = async () => {
    if (!selectedPage) {
      showFeedbackModal('Delete Page Failed', 'No page selected to delete.', 'error');
      return;
    }

    if ((selectedPage.promotion || []).length > 0) {
      showFeedbackModal(
        'Delete Page Blocked',
        'This page has promotions. Delete all promotions in this page before deleting the page.',
        'error',
      );
      return;
    }

    if (!authData?.jwt) {
      showFeedbackModal('Delete Page Failed', 'Session expired. Please login again.', 'error');
      return;
    }

    const selectedPageId = getSelectedPageId();
    if (!selectedPageId) {
      showFeedbackModal('Delete Page Failed', 'Page ID is missing for selected page.', 'error');
      return;
    }

    setPageDeleteSubmitting(true);
    try {
      await deletePage(selectedPageId, authData.jwt);
      await fetchPagesForRegion(selectedRegion);
      setDeletePageModalVisible(false);
      setSelectedPageName(null);
      showFeedbackModal('Success', 'Page deleted successfully', 'success');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete selected page';
      showFeedbackModal('Delete Page Failed', message, 'error');
    } finally {
      setPageDeleteSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedPromotionForDelete) {
      return;
    }

    const promotionId = getPromotionId(selectedPromotionForDelete);
    if (!promotionId) {
      showFeedbackModal(
        'Delete Unavailable',
        'Promotion ID is missing for this banner, so it cannot be deleted.',
        'error',
      );
      setDeleteModalVisible(false);
      setSelectedPromotionForDelete(null);
      return;
    }

    if (!authData?.jwt) {
      showFeedbackModal(
        'Delete Failed',
        'Session expired. Please login again.',
        'error',
      );
      return;
    }

    setDeletingPromotionId(promotionId);
    try {
      await deletePromotion(promotionId, authData.jwt);
      await fetchPagesForRegion(selectedRegion);
      setDeleteModalVisible(false);
      setSelectedPromotionForDelete(null);
      showFeedbackModal(
        'Success',
        'Promotion banner deleted successfully',
        'success',
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to delete promotional banner';
      showFeedbackModal('Delete Failed', message, 'error');
    } finally {
      setDeletingPromotionId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Back">
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color="#1F2937"
            />
          </TouchableOpacity>
          <Text style={styles.title}>Pages / Promotional Banners</Text>
          <View style={styles.iconButtonPlaceholder} />
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Regions</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}>
            {regions.map(renderRegionChip)}
          </ScrollView>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Page Types</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}>
            {pageNames.map(renderPageChip)}
          </ScrollView>
        </View>

        {(loading || regionsLoading) && !refreshing ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#0F766E" />
            <Text style={styles.stateText}>Loading promotional banners...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={36}
              color="#DC2626"
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={promotions}
            keyExtractor={(item, index) => {
              const promotionId = getPromotionId(item);
              if (promotionId) {
                return promotionId;
              }

              return `${item.shopId}-${item.title}-${index}`;
            }}
            renderItem={renderBannerItem}
            contentContainerStyle={[
              styles.listContent,
              !promotions.length && styles.emptyListContent,
            ]}
            ListHeaderComponent={renderManagementActions}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#0F766E']}
                tintColor="#0F766E"
              />
            }
            ListEmptyComponent={
              <View style={styles.centerState}>
                <MaterialCommunityIcons
                  name="image-off-outline"
                  size={40}
                  color="#94A3B8"
                />
                <Text style={styles.stateText}>
                  No promotional banners found for this page.
                </Text>
              </View>
            }
          />
        )}

        <Modal
          visible={deleteModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setDeleteModalVisible(false);
            setSelectedPromotionForDelete(null);
          }}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Delete Banner?</Text>
              <Text style={styles.modalMessage}>
                {selectedPromotionForDelete?.title || 'This promotional banner'}
                will be permanently deleted.
              </Text>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setDeleteModalVisible(false);
                    setSelectedPromotionForDelete(null);
                  }}
                  disabled={!!deletingPromotionId}>
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalDeleteButton}
                  onPress={handleConfirmDelete}
                  disabled={!!deletingPromotionId}>
                  {deletingPromotionId ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalDeleteButtonText}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
                onPress={hideFeedbackModal}>
                <Text style={styles.modalPrimaryButtonText}>
                  {feedbackModal.buttonLabel}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={pageFormModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPageFormModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {pageFormMode === 'create' ? 'Add Page Type' : 'Edit Page Type'}
              </Text>

              <Text style={styles.modalFieldLabel}>pageName *</Text>
              <TextInput
                style={styles.modalInput}
                value={pageForm.pageName}
                onChangeText={value =>
                  setPageForm(prev => ({...prev, pageName: value}))
                }
                placeholder="Electronics"
                placeholderTextColor="#94A3B8"
                editable={!pageFormSubmitting}
              />

              <Text style={styles.modalFieldLabel}>posterLink</Text>
              <TextInput
                style={styles.modalInput}
                value={pageForm.posterLink}
                onChangeText={value =>
                  setPageForm(prev => ({...prev, posterLink: value}))
                }
                placeholder="https://example.com/poster.jpg"
                placeholderTextColor="#94A3B8"
                editable={!pageFormSubmitting}
                autoCapitalize="none"
              />

              <View style={styles.modalActionsRowEqual}>
                <TouchableOpacity
                  style={[styles.modalCancelButton, styles.modalActionButton]}
                  onPress={() => setPageFormModalVisible(false)}
                  disabled={pageFormSubmitting}>
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalPrimaryButton,
                    styles.modalPrimaryButtonSuccess,
                    styles.modalActionButton,
                  ]}
                  onPress={handleSubmitPageForm}
                  disabled={pageFormSubmitting}>
                  {pageFormSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalPrimaryButtonText}>
                      {pageFormMode === 'create' ? 'Create' : 'Update'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={deletePageModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDeletePageModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Delete Page Type?</Text>
              <Text style={styles.modalMessage}>
                {selectedPage?.pageName || 'Selected page'} will be permanently
                deleted.
              </Text>

              {(selectedPage?.promotion || []).length > 0 ? (
                <Text style={styles.modalWarningText}>
                  This page contains promotions and cannot be deleted.
                </Text>
              ) : null}

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setDeletePageModalVisible(false)}
                  disabled={pageDeleteSubmitting}>
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalDeleteButton}
                  onPress={handleConfirmDeletePage}
                  disabled={
                    pageDeleteSubmitting || (selectedPage?.promotion || []).length > 0
                  }>
                  {pageDeleteSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalDeleteButtonText}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPlaceholder: {
    width: 36,
    height: 36,
  },
  title: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 18,
    fontFamily: FONT_FAMILY.outfitExtraBold,
    color: '#0F172A',
  },
  filterSection: {
    marginBottom: 10,
  },
  filterTitle: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bricolageMedium,
    color: '#334155',
    marginBottom: 8,
  },
  filterRow: {
    paddingBottom: 4,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0F766E',
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.outfitRegular,
    color: '#0F172A',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  pageChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
  },
  pageChipActive: {
    backgroundColor: '#1D4ED8',
  },
  pageChipText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.outfitRegular,
    color: '#1E3A8A',
  },
  pageChipTextActive: {
    color: '#FFFFFF',
  },
  managementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  managementTitle: {
    fontSize: 14,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.outfitBold,
    marginBottom: 10,
  },
  managementItemRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
    paddingBottom: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  managementItemRowNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  managementLabel: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: FONT_FAMILY.bricolageRegular,
    marginBottom: 2,
  },
  managementValue: {
    fontSize: 13,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.outfitBold,
    maxWidth: 190,
  },
  inlineActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  outlineActionButton: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#F8FAFC',
  },
  outlineActionButtonDanger: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  outlineActionButtonText: {
    fontSize: 12,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  outlineActionButtonDangerText: {
    color: '#B91C1C',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  bannerCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 12,
  },
  bannerImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F1F5F9',
  },
  bannerMetaWrap: {
    padding: 12,
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  bannerTitle: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  shopBadge: {
    fontSize: 11,
    color: '#0F766E',
    fontFamily: FONT_FAMILY.outfitBold,
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: FONT_FAMILY.outfitRegular,
    marginBottom: 4,
  },
  bannerMeta: {
    fontSize: 12,
    color: '#475569',
    fontFamily: FONT_FAMILY.outfitRegular,
  },
  bannerActionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smallActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  smallActionButtonDanger: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  smallActionButtonText: {
    fontSize: 12,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  smallActionButtonDangerText: {
    color: '#B91C1C',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stateText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontFamily: FONT_FAMILY.outfitRegular,
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: '#B91C1C',
    textAlign: 'center',
    fontFamily: FONT_FAMILY.outfitRegular,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONT_FAMILY.outfitBold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.outfitExtraBold,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#475569',
    fontFamily: FONT_FAMILY.outfitRegular,
    lineHeight: 20,
  },
  modalActionsRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalActionsRowEqual: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalActionButton: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#E2E8F0',
  },
  modalCancelButtonText: {
    fontSize: 13,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  modalDeleteButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#DC2626',
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeleteButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY.outfitBold,
  },
  modalFieldLabel: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 12,
    color: '#334155',
    fontFamily: FONT_FAMILY.bricolageMedium,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    fontFamily: FONT_FAMILY.outfitRegular,
  },
  modalWarningText: {
    marginTop: 10,
    fontSize: 12,
    color: '#B91C1C',
    fontFamily: FONT_FAMILY.outfitRegular,
  },
  modalPrimaryButton: {
    marginTop: 18,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryButtonSuccess: {
    backgroundColor: '#0F766E',
  },
  modalPrimaryButtonError: {
    backgroundColor: '#DC2626',
  },
  modalPrimaryButtonInfo: {
    backgroundColor: '#1D4ED8',
  },
  modalPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONT_FAMILY.outfitBold,
  },
});

export default PagesPromotionalBannersScreen;
