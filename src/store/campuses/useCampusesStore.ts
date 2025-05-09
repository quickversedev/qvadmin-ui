import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';

import globalConfig from '../../utils/global/globalConfig';
import axios from 'axios';
import {zustandMmkvStorage} from '../../services/storage/MMKV/zustandMmkvStorage';

export interface Campus {
  campusId: string;
  displayName: string;
  campusName: string;
  location: string;
}

interface CampusesState {
  campuses: Campus[];
  selectedCampus: Campus | null;
  isLoading: boolean;
  error: string | null;
  fetchCampuses: () => Promise<void>;
  selectCampus: (campus: Campus) => void;
  clearSelectedCampus: () => void;
  addCampus: (campus: Campus) => void;
  updateCampus: (campusId: string, updatedData: Partial<Campus>) => void;
  deleteCampus: (campusId: string) => void;
}
interface CampusesResponse {
  campuses: {
    campus: Campus[];
  };
  message: string;
}
const API_ENDPOINT = '/v1/campus'; // Endpoint relative to base URL
const AUTH_HEADER = {
  Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
};
export const useCampusesStore = create<CampusesState>()(
  persist(
    (set, get) => ({
      campuses: [],
      selectedCampus: null,
      isLoading: false,
      error: null,

      fetchCampuses: async () => {
        set({isLoading: true, error: null});
        try {
          // Replace with your actual API call
          const response = await axios.get<CampusesResponse>(
            `${globalConfig.apiBaseUrl}${API_ENDPOINT}`,
            {
              headers: AUTH_HEADER,
            },
          );

          set({campuses: response.data.campuses.campus, isLoading: false});
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
        }
      },

      selectCampus: (campus: Campus) => {
        set({selectedCampus: campus});
      },

      clearSelectedCampus: () => {
        set({selectedCampus: null});
      },

      addCampus: (campus: Campus) => {
        set(state => ({
          campuses: [...state.campuses, campus],
        }));
      },

      updateCampus: (campusId: string, updatedData: Partial<Campus>) => {
        set(state => ({
          campuses: state.campuses.map(campus =>
            campus.campusId === campusId ? {...campus, ...updatedData} : campus,
          ),
          selectedCampus:
            state.selectedCampus?.campusId === campusId
              ? {...state.selectedCampus, ...updatedData}
              : state.selectedCampus,
        }));
      },

      deleteCampus: (campusId: string) => {
        set(state => ({
          campuses: state.campuses.filter(
            campus => campus.campusId !== campusId,
          ),
          selectedCampus:
            state.selectedCampus?.campusId === campusId
              ? null
              : state.selectedCampus,
        }));
      },
    }),
    {
      name: 'campuses-storage',
      storage: createJSONStorage(() => zustandMmkvStorage),
      partialize: state => ({
        campuses: state.campuses,
        selectedCampus: state.selectedCampus,
      }),
    },
  ),
);
