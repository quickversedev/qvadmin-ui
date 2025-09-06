import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';

import axiosInstance, {apiCall, withHeaders} from '../../services/apis/axios.config';
import {zustandMmkvStorage} from '../../services/storage/MMKV/zustandMmkvStorage';

export interface Region {
  regionId: string;
  regionName: string;
  displayName: string;
  regionEnabled: boolean;
}

interface RegionsState {
  regions: Region[];
  selectedRegion: Region | null;
  isLoading: boolean;
  error: string | null;
  fetchRegions: () => Promise<void>;
  selectRegion: (region: Region) => void;
  clearSelectedRegion: () => void;
  addRegion: (region: Region) => void;
  updateRegion: (regionId: string, updatedData: Partial<Region>) => void;
  deleteRegion: (regionId: string) => void;
  getEnabledRegions: () => Region[];
}

const API_ENDPOINT = '/v3/regions'; // Endpoint relative to base URL
const AUTH_HEADER = {
  Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
};

export const useRegionsStore = create<RegionsState>()(
  persist(
    (set, get) => ({
      regions: [],
      selectedRegion: null,
      isLoading: false,
      error: null,

      fetchRegions: async () => {
        set({isLoading: true, error: null});
        try {
          const regions = await apiCall<Region[]>(
            axiosInstance.get(API_ENDPOINT, withHeaders(AUTH_HEADER))
          );

          set({regions, isLoading: false});
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
        }
      },

      selectRegion: (region: Region) => {
        set({selectedRegion: region});
      },

      clearSelectedRegion: () => {
        set({selectedRegion: null});
      },

      addRegion: (region: Region) => {
        set(state => ({
          regions: [...state.regions, region],
        }));
      },

      updateRegion: (regionId: string, updatedData: Partial<Region>) => {
        set(state => ({
          regions: state.regions.map(region =>
            region.regionId === regionId ? {...region, ...updatedData} : region,
          ),
          selectedRegion:
            state.selectedRegion?.regionId === regionId
              ? {...state.selectedRegion, ...updatedData}
              : state.selectedRegion,
        }));
      },

      deleteRegion: (regionId: string) => {
        set(state => ({
          regions: state.regions.filter(
            region => region.regionId !== regionId,
          ),
          selectedRegion:
            state.selectedRegion?.regionId === regionId
              ? null
              : state.selectedRegion,
        }));
      },

      getEnabledRegions: () => {
        const {regions} = get();
        return regions.filter(region => region.regionEnabled);
      },
    }),
    {
      name: 'regions-storage',
      storage: createJSONStorage(() => zustandMmkvStorage),
      partialize: state => ({
        regions: state.regions,
        selectedRegion: state.selectedRegion,
      }),
    },
  ),
);
