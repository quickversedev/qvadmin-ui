import axiosInstance, {API_CONFIG, apiCall} from './axios.config';
import {Platform} from 'react-native';

export interface PromotionUploadFile {
  uri: string;
  type?: string | null;
  name?: string | null;
}

export interface CreatePromotionPayload {
  sequence: string;
  pageName: string;
  regionId: string;
  imageFile: PromotionUploadFile;
  shopId?: string;
  title?: string;
  subtitle?: string;
  size?: string;
  backgroundColor?: string;
  isBannerImage?: boolean;
}

export interface UpdatePromotionPayload {
  sequence: string;
  title?: string;
  subtitle?: string;
  shopId?: string;
  size?: string;
  backgroundColor?: string;
  isBannerImage?: boolean;
  imageFile?: PromotionUploadFile | null;
}

const PROMOTION_ENDPOINT = '/quickVerse/v3/promotion';
const UPLOAD_TIMEOUT_MS = 120000;
const AUTHORIZATION_HEADER =
  'Bearer Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx';

const normalizeUploadUri = (uri: string) => {
  if (!uri) {
    return uri;
  }

  if (Platform.OS !== 'android') {
    return uri;
  }

  if (uri.startsWith('content://') || uri.startsWith('file://')) {
    return uri;
  }

  return `file://${uri}`;
};

const resolveUploadFileName = (uri: string, explicitName?: string | null) => {
  if (explicitName?.trim()) {
    return explicitName.trim();
  }

  const uriPath = uri.split('?')[0];
  const lastSegment = uriPath.substring(uriPath.lastIndexOf('/') + 1);

  if (lastSegment) {
    return lastSegment;
  }

  return `promotion_${Date.now()}.jpg`;
};

const buildImagePart = (file: PromotionUploadFile) => {
  if (!file?.uri?.trim()) {
    throw new Error('Image file uri is required');
  }

  const normalizedUri = normalizeUploadUri(file.uri.trim());

  return {
    uri: normalizedUri,
    type: file.type || 'image/jpeg',
    name: resolveUploadFileName(normalizedUri, file.name),
  } as any;
};

const buildHeaders = (sessionKey?: string) => {
  const headers: Record<string, string> = {
    Authorization: AUTHORIZATION_HEADER,
    'Request-Origin': 'CAPTAIN',
  };

  if (sessionKey) {
    headers.SessionKey = sessionKey;
  }

  return headers;
};

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, '');

const normalizeEndpointPath = (path: string) =>
  path.startsWith('/') ? path : `/${path}`;

const buildAbsoluteUrl = (path: string) =>
  `${normalizeBaseUrl(API_CONFIG.baseURL)}${normalizeEndpointPath(path)}`;

const parseFetchResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text ? {message: text} : {};
};

const fetchMultipart = async (
  method: 'POST' | 'PATCH',
  path: string,
  formData: FormData,
  sessionKey?: string,
) => {
  const response = await fetch(buildAbsoluteUrl(path), {
    method,
    headers: buildHeaders(sessionKey),
    body: formData,
  });

  const payload = await parseFetchResponse(response);

  if (response.status < 200 || response.status > 302) {
    throw {
      status: response.status,
      message:
        (payload as {message?: string; error?: {message?: string}})?.message ||
        (payload as {error?: {message?: string}})?.error?.message ||
        `Request failed with status ${response.status}`,
      code: String(response.status),
      isCancelled: false,
      apiEndpoint: path,
      error: payload,
    };
  }

  return payload;
};

const isAxiosNetworkError = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = (error as {code?: string}).code;
  const message = (error as {message?: string}).message;

  return (
    code === 'NETWORK_ERROR' ||
    message === 'Network error. Please check your internet connection.'
  );
};

const buildCreateFormData = (payload: CreatePromotionPayload) => {
  const formData = new FormData();
  const sequence = payload.sequence?.trim();
  if (!sequence) {
    throw new Error('sequence is required');
  }
  formData.append('sequence', sequence);

  formData.append('pageName', payload.pageName.trim());
  formData.append('regionId', payload.regionId.trim());
  formData.append('imageFile', buildImagePart(payload.imageFile));

  if (payload.shopId?.trim()) {
    formData.append('shopId', payload.shopId.trim());
  }

  if (payload.title?.trim()) {
    formData.append('title', payload.title.trim());
  }

  if (payload.subtitle?.trim()) {
    formData.append('subtitle', payload.subtitle.trim());
  }

  if (payload.size?.trim()) {
    formData.append('size', payload.size.trim());
  }

  if (payload.backgroundColor?.trim()) {
    formData.append('backgroundColor', payload.backgroundColor.trim());
  }

  formData.append('isBannerImage', String(payload.isBannerImage ?? true));

  return formData;
};

const buildUpdateFormData = (payload: UpdatePromotionPayload) => {
  const formData = new FormData();
  const sequence = payload.sequence?.trim();
  if (!sequence) {
    throw new Error('sequence is required');
  }
  formData.append('sequence', sequence);

  if (payload.title?.trim()) {
    formData.append('title', payload.title.trim());
  }

  if (payload.subtitle?.trim()) {
    formData.append('subtitle', payload.subtitle.trim());
  }

  if (payload.shopId?.trim()) {
    formData.append('shopId', payload.shopId.trim());
  }

  if (payload.size?.trim()) {
    formData.append('size', payload.size.trim());
  }

  if (payload.backgroundColor?.trim()) {
    formData.append('backgroundColor', payload.backgroundColor.trim());
  }

  if (payload.imageFile?.uri) {
    formData.append('imageFile', buildImagePart(payload.imageFile));
  }

  if (payload.isBannerImage !== undefined) {
    formData.append('isBannerImage', String(payload.isBannerImage));
  }

  return formData;
};

export const createPromotion = async (
  payload: CreatePromotionPayload,
  sessionKey?: string,
) => {
  const formData = buildCreateFormData(payload);

  try {
    const response = await apiCall<any>(
      axiosInstance.post(PROMOTION_ENDPOINT, formData, {
        headers: buildHeaders(sessionKey),
        timeout: UPLOAD_TIMEOUT_MS,
        validateStatus: status => status >= 200 && status <= 302,
      }),
    );

    return response;
  } catch (error) {
    if (!isAxiosNetworkError(error)) {
      throw error;
    }

    // Android XHR can fail multipart uploads with ERR_NETWORK; fetch is more reliable.
    return fetchMultipart('POST', PROMOTION_ENDPOINT, formData, sessionKey);
  }
};

export const updatePromotion = async (
  promoId: string | number,
  payload: UpdatePromotionPayload,
  sessionKey?: string,
) => {
  if (
    promoId === undefined ||
    promoId === null ||
    String(promoId).trim() === ''
  ) {
    throw new Error('Promotion ID is required');
  }

  const endpointWithId = `${PROMOTION_ENDPOINT}/${encodeURIComponent(
    String(promoId),
  )}`;
  const formData = buildUpdateFormData(payload);

  try {
    const response = await apiCall<any>(
      axiosInstance.patch(endpointWithId, formData, {
        headers: buildHeaders(sessionKey),
        timeout: UPLOAD_TIMEOUT_MS,
        validateStatus: status => status >= 200 && status <= 302,
      }),
    );

    return response;
  } catch (error) {
    if (!isAxiosNetworkError(error)) {
      throw error;
    }

    // Android XHR can fail multipart uploads with ERR_NETWORK; fetch is more reliable.
    return fetchMultipart('PATCH', endpointWithId, formData, sessionKey);
  }
};

export const deletePromotion = async (
  promoId: string | number,
  sessionKey?: string,
) => {
  if (
    promoId === undefined ||
    promoId === null ||
    String(promoId).trim() === ''
  ) {
    throw new Error('Promotion ID is required');
  }

  await apiCall<any>(
    axiosInstance.delete(
      `${PROMOTION_ENDPOINT}/${encodeURIComponent(String(promoId))}`,
      {
        headers: {
          Authorization: AUTHORIZATION_HEADER,
          'Request-Origin': 'CAPTAIN',
          ...(sessionKey ? {SessionKey: sessionKey} : {}),
        },
        validateStatus: status => status >= 200 && status <= 302,
      },
    ),
  );
};

export const promotionService = {
  createPromotion,
  updatePromotion,
  deletePromotion,
};
