// src/store/vendorStore.ts
import {create} from 'zustand';
import axiosInstance, {apiCall, withHeaders} from '../../services/apis/axios.config';

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
  loading: boolean;
  error: string | null;
  fetchVendors: (regionId: string) => Promise<void>;
  setVendors: (vendors: Vendor[]) => void;
  clearVendors: () => void;
  getVendorById: (shopId: string) => Vendor | undefined;
  getActiveVendors: () => Vendor[];
  getFeaturedVendors: () => Vendor[];
}

export const useVendorStore = create<VendorState>((set, get) => ({
  vendors: [],
  loading: false,
  error: null,

  fetchVendors: async (regionId: string) => {
    set({loading: true, error: null});
    try {
      const endpoint = `/v3/region/shops?region=${regionId}`;
      const headers = {
        Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
      };

      const vendors = await apiCall<Vendor[]>(
        axiosInstance.get(endpoint, withHeaders(headers))
      );
      console.log('vendors in fetchVendors', vendors);
      set({vendors, loading: false});
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch vendors',
        loading: false,
      });
    }
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
}));
