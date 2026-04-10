// src/store/vendorStore.ts
import {create} from 'zustand';

import axiosInstance, {
  apiCall,
  withHeaders,
} from '../../services/apis/axios.config';

export interface ShopAddress {
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface Coordinates {
  longitude: number;
  latitude: number;
}

export interface Vendor {
  shopId: string;
  name: string;
  shopAddress: ShopAddress;
  logo: string;
  banner: string;
  owner: string;
  phone: string;
  openingTime: string;
  closingTime: string;
  preparationTime: string;
  description: string;
  category: string;
  coordinates: Coordinates;
  storeActive: boolean;
  featured: boolean;
}

interface VendorState {
  vendors: Vendor[];
  selectedVendor: Vendor | null;
  loading: boolean;
  error: string | null;
  fetchVendors: (regionId: string) => Promise<void>;
  selectVendor: (vendor: Vendor) => void;
  clearSelectedVendor: () => void;
  setVendors: (vendors: Vendor[]) => void;
  clearVendors: () => void;
  getVendorById: (shopId: string) => Vendor | undefined;
  getActiveVendors: () => Vendor[];
  getFeaturedVendors: () => Vendor[];
  addVendor: (vendor: Vendor) => void;
  updateVendor: (shopId: string, updatedData: Partial<Vendor>) => void;
  deleteVendor: (shopId: string) => void;
}

export const useVendorStore = create<VendorState>()((set, get) => ({
  vendors: [],
  selectedVendor: null,
  loading: false,
  error: null,

  fetchVendors: async (regionId: string) => {
    set({loading: true, error: null});
    try {
      const endpoint = `/quickVerse/v3/regions/shops?regionId=${regionId}`;
      const headers = {
        Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
      };

      const vendors = await apiCall<Vendor[]>(
        axiosInstance.get(endpoint, withHeaders(headers)),
      );

      set({vendors, loading: false});
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to fetch vendors',
        loading: false,
      });
    }
  },

  selectVendor: (vendor: Vendor) => {
    set({selectedVendor: vendor});
  },

  clearSelectedVendor: () => {
    set({selectedVendor: null});
  },

  setVendors: vendors => set({vendors}),

  clearVendors: () => set({vendors: []}),

  getVendorById: (shopId: string) => {
    const vendors = get().vendors;
    return vendors.find(vendor => vendor.shopId === shopId);
  },

  getActiveVendors: () => {
    const vendors = get().vendors;
    return vendors.filter(vendor => vendor.storeActive);
  },

  getFeaturedVendors: () => {
    const vendors = get().vendors;
    return vendors.filter(vendor => vendor.featured);
  },

  addVendor: (vendor: Vendor) => {
    set(state => ({
      vendors: [...state.vendors, vendor],
    }));
  },

  updateVendor: (shopId: string, updatedData: Partial<Vendor>) => {
    set(state => ({
      vendors: state.vendors.map(vendor =>
        vendor.shopId === shopId ? {...vendor, ...updatedData} : vendor,
      ),
      selectedVendor:
        state.selectedVendor?.shopId === shopId
          ? {...state.selectedVendor, ...updatedData}
          : state.selectedVendor,
    }));
  },

  deleteVendor: (shopId: string) => {
    set(state => ({
      vendors: state.vendors.filter(vendor => vendor.shopId !== shopId),
      selectedVendor:
        state.selectedVendor?.shopId === shopId ? null : state.selectedVendor,
    }));
  },
}));
