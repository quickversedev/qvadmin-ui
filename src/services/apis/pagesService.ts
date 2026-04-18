import {apiCall, createRequestWithHeaders} from './axios.config';

export interface PromotionBanner {
  id?: string | number;
  promotionId?: string | number;
  promoId?: string | number;
  bannerId?: string | number;
  promoBannerId?: string | number;
  promotionBannerId?: string | number;
  sequence?: string | number;
  shopId: string;
  title: string;
  subtitle: string;
  size: string;
  backgroundColor: string;
  imageURL: string;
  isBannerImage?: boolean;
  bannerImage: boolean;
}

export interface PageItem {
  pageId?: string | number;
  pageName: string;
  posterLink: string;
  promotion: PromotionBanner[];
}

const PAGES_ENDPOINT = '/quickVerse/v3/pages';
const PAGE_MUTATION_ENDPOINT = '/quickVerse/v3/page';
const AUTHORIZATION_HEADER =
  'Bearer Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx';

export interface CreatePagePayload {
  pageName: string;
  regionId: string;
  posterLink?: string;
}

export interface UpdatePagePayload {
  pageName?: string;
  posterLink?: string;
}

export const fetchPagesByRegion = async (
  regionId: string,
  sessionKey?: string,
): Promise<PageItem[]> => {
  if (!regionId) {
    throw new Error('Region ID is required');
  }

  if (!sessionKey) {
    throw new Error('No authentication token available');
  }

  const endpoint = `${PAGES_ENDPOINT}?regionId=${encodeURIComponent(regionId)}`;

  const pages = await apiCall<PageItem[]>(
    createRequestWithHeaders('get', endpoint, undefined, {
      SessionKey: sessionKey,
    }),
  );

  return pages || [];
};

const buildPageHeaders = (sessionKey?: string) => {
  if (!sessionKey) {
    throw new Error('No authentication token available');
  }

  return {
    Authorization: AUTHORIZATION_HEADER,
    SessionKey: sessionKey,
    'Request-Origin': 'CAPTAIN',
    'Content-Type': 'application/json',
  };
};

export const createPage = async (
  payload: CreatePagePayload,
  sessionKey?: string,
) => {
  if (!payload.pageName?.trim()) {
    throw new Error('pageName is required');
  }

  if (!payload.regionId?.trim()) {
    throw new Error('regionId is required');
  }

  const response = await apiCall<any>(
    createRequestWithHeaders(
      'post',
      PAGE_MUTATION_ENDPOINT,
      {
        pageName: payload.pageName.trim(),
        regionId: payload.regionId.trim(),
        posterLink: payload.posterLink?.trim() || '',
      },
      buildPageHeaders(sessionKey),
    ),
  );

  return response;
};

export const updatePage = async (
  pageId: string | number,
  payload: UpdatePagePayload,
  sessionKey?: string,
) => {
  if (pageId === undefined || pageId === null || String(pageId).trim() === '') {
    throw new Error('Page ID is required');
  }

  if (!payload.pageName?.trim() && !payload.posterLink?.trim()) {
    throw new Error('At least one field is required to update page');
  }

  const response = await apiCall<any>(
    createRequestWithHeaders(
      'patch',
      `${PAGE_MUTATION_ENDPOINT}/${encodeURIComponent(String(pageId))}`,
      {
        ...(payload.pageName?.trim()
          ? {pageName: payload.pageName.trim()}
          : {}),
        ...(payload.posterLink?.trim()
          ? {posterLink: payload.posterLink.trim()}
          : {posterLink: ''}),
      },
      buildPageHeaders(sessionKey),
    ),
  );

  return response;
};

export const deletePage = async (
  pageId: string | number,
  sessionKey?: string,
) => {
  if (pageId === undefined || pageId === null || String(pageId).trim() === '') {
    throw new Error('Page ID is required');
  }

  await apiCall<any>(
    createRequestWithHeaders(
      'delete',
      `${PAGE_MUTATION_ENDPOINT}/${encodeURIComponent(String(pageId))}`,
      undefined,
      buildPageHeaders(sessionKey),
    ),
  );
};

export const pagesService = {
  fetchPagesByRegion,
  createPage,
  updatePage,
  deletePage,
};
