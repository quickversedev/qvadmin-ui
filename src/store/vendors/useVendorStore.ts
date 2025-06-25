// src/store/vendorStore.ts
import {create} from 'zustand';
import axios from 'axios';
import globalConfig from '../../utils/global/globalConfig';

export interface Vendor {
  vendorId: string;
  campusId: string;
  vendorName: string;
  vendorEndPoint: string;
  vendorAddress: string;
  vendorBanner: string;
  vendorOwner: string;
  vendorPhone: string;
  vendorLogoUrl: string;
  vendorLogo: string;
  distance: string;
  storeOpeningTime: string;
  storeClosingTime: string;
  storeDescription: string;
  storeCategory: string;
  storeEnabled: boolean;
}

interface VendorState {
  vendors: Vendor[];
  loading: boolean;
  error: string | null;
  fetchVendors: (campusId: string) => Promise<void>;
  setVendors: (vendors: Vendor[]) => void;
  clearVendors: () => void;
  getVendorById: (vendorId: string) => Vendor | undefined;
}

export const useVendorStore = create<VendorState>((set, get) => ({
  vendors: [],
  loading: false,
  error: null,

  fetchVendors: async (campusId: string) => {
    set({loading: true, error: null});
    try {
      const response = await axios.get(
        `${globalConfig.apiBaseUrl}/v1/campus/${campusId}/vendors`,
        {
          headers: {
            Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
          },
        },
      );

      const vendors = response.data.vendors.vendor;
      set({vendors, loading: false});
    } catch (error: any) {
      set({error: error.message || 'Failed to fetch vendors', loading: false});
    }
  },

  setVendors: vendors => set({vendors}),

  clearVendors: () => set({vendors: []}),

  getVendorById: (vendorId: string) => {
    const vendors = get().vendors;
    return vendors.find(vendor => vendor.vendorId === vendorId);
  },
}));
