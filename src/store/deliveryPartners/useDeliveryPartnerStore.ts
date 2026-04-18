import {create} from 'zustand';

import {
  createDeliveryPartner,
  deleteDeliveryPartner,
  DeliveryPartner,
  DeliveryPartnerFilter,
  DeliveryPartnerPayload,
  fetchDeliveryPartnerById,
  fetchDeliveryPartners,
  fetchOnlineDeliveryPartners,
  getDeliveryPartnerId,
  updateDeliveryPartner,
} from '../../services/apis/deliveryPartnerService';

interface DeliveryPartnerState {
  partners: DeliveryPartner[];
  selectedPartner: DeliveryPartner | null;
  onlinePartners: DeliveryPartner[];
  loading: boolean;
  loadingSelected: boolean;
  loadingOnlinePartners: boolean;
  error: string | null;
  fetchPartners: (
    filter?: DeliveryPartnerFilter,
    sessionKey?: string,
  ) => Promise<DeliveryPartner[]>;
  fetchPartnerById: (
    id: string,
    sessionKey?: string,
  ) => Promise<DeliveryPartner | null>;
  fetchOnlinePartners: (sessionKey?: string) => Promise<DeliveryPartner[]>;
  createPartner: (
    payload: DeliveryPartnerPayload,
    sessionKey?: string,
  ) => Promise<DeliveryPartner>;
  updatePartner: (
    id: string,
    payload: DeliveryPartnerPayload,
    sessionKey?: string,
  ) => Promise<DeliveryPartner>;
  removePartner: (id: string, sessionKey?: string) => Promise<void>;
  setSelectedPartner: (partner: DeliveryPartner | null) => void;
  clearSelectedPartner: () => void;
  clearPartners: () => void;
  getPartnerById: (id: string) => DeliveryPartner | undefined;
}

const upsertPartner = (
  partners: DeliveryPartner[],
  partner: DeliveryPartner,
) => {
  const partnerId = getDeliveryPartnerId(partner);
  const index = partners.findIndex(
    item => getDeliveryPartnerId(item) === partnerId,
  );

  if (index === -1) {
    return [...partners, partner];
  }

  const cloned = [...partners];
  cloned[index] = partner;
  return cloned;
};

const removePartnerById = (partners: DeliveryPartner[], id: string) =>
  partners.filter(partner => getDeliveryPartnerId(partner) !== id);

export const useDeliveryPartnerStore = create<DeliveryPartnerState>()(
  (set, get) => ({
    partners: [],
    selectedPartner: null,
    onlinePartners: [],
    loading: false,
    loadingSelected: false,
    loadingOnlinePartners: false,
    error: null,

    fetchPartners: async (filter, sessionKey) => {
      set({loading: true, error: null});

      try {
        const partners = await fetchDeliveryPartners(filter, sessionKey);
        set({partners, loading: false});
        return partners;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to fetch delivery partners';
        set({error: message, loading: false});
        throw error;
      }
    },

    fetchPartnerById: async (id, sessionKey) => {
      set({loadingSelected: true, error: null});

      try {
        const partner = await fetchDeliveryPartnerById(id, sessionKey);
        set(state => ({
          selectedPartner: partner,
          partners: upsertPartner(state.partners, partner),
          loadingSelected: false,
        }));
        return partner;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to fetch delivery partner';
        set({error: message, loadingSelected: false});
        throw error;
      }
    },

    fetchOnlinePartners: async (sessionKey?: string) => {
      set({loadingOnlinePartners: true, error: null});

      try {
        const partners = await fetchOnlineDeliveryPartners(sessionKey);
        set({onlinePartners: partners, loadingOnlinePartners: false});
        return partners;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to fetch online delivery partners';
        set({error: message, loadingOnlinePartners: false});
        throw error;
      }
    },

    createPartner: async (payload, sessionKey) => {
      set({loading: true, error: null});

      try {
        const partner = await createDeliveryPartner(payload, sessionKey);
        set(state => ({
          partners: upsertPartner(state.partners, partner),
          selectedPartner: partner,
          loading: false,
        }));
        return partner;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to create delivery partner';
        set({error: message, loading: false});
        throw error;
      }
    },

    updatePartner: async (id, payload, sessionKey) => {
      set({loading: true, error: null});

      try {
        const partner = await updateDeliveryPartner(id, payload, sessionKey);
        set(state => ({
          partners: upsertPartner(state.partners, partner),
          selectedPartner: partner,
          loading: false,
        }));
        return partner;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to update delivery partner';
        set({error: message, loading: false});
        throw error;
      }
    },

    removePartner: async (id, sessionKey) => {
      set({loading: true, error: null});

      try {
        await deleteDeliveryPartner(id, sessionKey);
        set(state => ({
          partners: removePartnerById(state.partners, id),
          selectedPartner:
            state.selectedPartner &&
            getDeliveryPartnerId(state.selectedPartner) === id
              ? null
              : state.selectedPartner,
          loading: false,
        }));
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to delete delivery partner';
        set({error: message, loading: false});
        throw error;
      }
    },

    setSelectedPartner: partner => set({selectedPartner: partner}),

    clearSelectedPartner: () => set({selectedPartner: null}),

    clearPartners: () => set({partners: []}),

    getPartnerById: (id: string) => {
      const partners = get().partners;
      return partners.find(partner => getDeliveryPartnerId(partner) === id);
    },
  }),
);
