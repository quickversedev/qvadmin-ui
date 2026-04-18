import {create} from 'zustand';
import {
  fetchPagesByRegion,
  PageItem,
  PromotionBanner,
} from '../../services/apis/pagesService';

interface PagesState {
  pages: PageItem[];
  selectedPageName: string | null;
  loading: boolean;
  error: string | null;
  fetchPages: (regionId: string, sessionKey?: string) => Promise<void>;
  setSelectedPageName: (pageName: string | null) => void;
  getPageNames: () => string[];
  getSelectedPage: () => PageItem | null;
  addPageLocal: (page: PageItem) => void;
  addPromotionLocal: (pageName: string, banner: PromotionBanner) => void;
  updatePromotionLocal: (
    pageName: string,
    index: number,
    banner: PromotionBanner,
  ) => void;
  deletePromotionLocal: (pageName: string, index: number) => void;
}

export const usePagesStore = create<PagesState>()((set, get) => ({
  pages: [],
  selectedPageName: null,
  loading: false,
  error: null,

  fetchPages: async (regionId: string, sessionKey?: string) => {
    set({loading: true, error: null});

    try {
      const pages = await fetchPagesByRegion(regionId, sessionKey);

      set(state => {
        const pageNames = pages.map(page => page.pageName);
        const selectedPageName =
          state.selectedPageName && pageNames.includes(state.selectedPageName)
            ? state.selectedPageName
            : pages[0]?.pageName || null;

        return {
          pages,
          selectedPageName,
          loading: false,
          error: null,
        };
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pages',
      });
    }
  },

  setSelectedPageName: (pageName: string | null) => {
    set({selectedPageName: pageName});
  },

  getPageNames: () => {
    return get().pages.map(page => page.pageName);
  },

  getSelectedPage: () => {
    const {pages, selectedPageName} = get();
    if (!selectedPageName) {
      return pages[0] || null;
    }

    return pages.find(page => page.pageName === selectedPageName) || null;
  },

  addPageLocal: (page: PageItem) => {
    set(state => ({
      pages: [...state.pages, page],
      selectedPageName: state.selectedPageName || page.pageName,
    }));
  },

  addPromotionLocal: (pageName: string, banner: PromotionBanner) => {
    set(state => ({
      pages: state.pages.map(page =>
        page.pageName === pageName
          ? {...page, promotion: [...(page.promotion || []), banner]}
          : page,
      ),
    }));
  },

  updatePromotionLocal: (
    pageName: string,
    index: number,
    banner: PromotionBanner,
  ) => {
    set(state => ({
      pages: state.pages.map(page => {
        if (page.pageName !== pageName) {
          return page;
        }

        const currentPromotion = [...(page.promotion || [])];
        if (index < 0 || index >= currentPromotion.length) {
          return page;
        }

        currentPromotion[index] = banner;
        return {...page, promotion: currentPromotion};
      }),
    }));
  },

  deletePromotionLocal: (pageName: string, index: number) => {
    set(state => ({
      pages: state.pages.map(page => {
        if (page.pageName !== pageName) {
          return page;
        }

        const currentPromotion = [...(page.promotion || [])];
        if (index < 0 || index >= currentPromotion.length) {
          return page;
        }

        currentPromotion.splice(index, 1);
        return {...page, promotion: currentPromotion};
      }),
    }));
  },
}));
