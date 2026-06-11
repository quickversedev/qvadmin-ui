import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import {storage} from '../services/storage/MMKV/zustandMmkvStorage';

/**
 * 🔹 Build Headers (Reusable)
 */
const buildHeaders = (endpoint: string) => {
  const headers = new Headers();

  const authStorage = storage.getString('auth-storage');
  const authData = authStorage
    ? JSON.parse(authStorage)?.state?.authData
    : null;

  const noAuthEndpoints = [
    'requestOtp',
    'login',
    'getRegions',
    'getOrderStats',
    'getOrders',
    'getAllOrders',
    'getOrdersFinance',
    'getOrderById',
    'getPricingConfig',
    'getPages',
    'createPromotion',
    'getOrderHistory',
    'getDeliveryPartnersWithOrders',
    'assignOrder',
    'unassignOrder',
  ];

  // 🔐 Conditional JWT
  if (!noAuthEndpoints.includes(endpoint)) {
    if (authData?.jwt) {
      headers.set('SessionKey', `Bearer ${authData.jwt}`);
    }
  }

  // 🔒 Static Headers
  headers.set(
    'Authorization',
    'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
  );
  headers.set('Request-Origin', 'CAPTAIN');

  return headers;
};

/**
 * 🔹 Raw Base Query
 */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: 'http://prd.quickverse.in',
  // baseUrl: 'http://qvadmin-dev.quickverse.in',
  // baseUrl: 'http://console-wharf-overplant.ngrok-free.dev',
  // baseUrl: 'https://8d19-27-60-4-109.ngrok-free.app',
  // baseUrl: 'https://superscientifically-revengeless-ronald.ngrok-free.dev',
  prepareHeaders: (headers, {endpoint}) => {
    const builtHeaders = buildHeaders(endpoint);

    builtHeaders.forEach((value, key) => {
      headers.set(key, value);
    });

    return headers;
  },
});

/**
 * 🔹 Logger Wrapper
 */
const baseQueryWithLogger: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const start = Date.now();

  const request = typeof args === 'string' ? {url: args, method: 'GET'} : args;

  /**
   * ✅ Build full URL with params
   */
  let fullUrl = request.url;

  if (request.params) {
    const queryString = new URLSearchParams(
      Object.entries(request.params).reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>),
    ).toString();

    if (queryString) {
      fullUrl += fullUrl.includes('?') ? `&${queryString}` : `?${queryString}`;
    }
  }

  /**
   * ✅ Build headers for logging (same as API)
   */
  const headersObj: Record<string, string> = {};
  const builtHeaders = buildHeaders(api.endpoint);

  builtHeaders.forEach((value, key) => {
    headersObj[key] = value;
  });

  /**
   * 🔥 API Call
   */
  const result = await rawBaseQuery(args, api, extraOptions);

  const end = Date.now();

  /**
   * 🧾 Logging
   */
  if (__DEV__) {
    const logObject = {
      type: result.error ? 'ERROR' : 'SUCCESS',
      url: fullUrl,
      method: request.method || 'GET',
      headers: headersObj,
      body: request.body || null,
      status: result.error ? result.error.status : 'OK',
      response: result.error ? result.error.data : result.data,
      duration: `${end - start}ms`,
      timestamp: new Date().toISOString(),
    };

    console.log(`[API LOG] ${request.method || 'GET'} ${fullUrl}`, logObject);
  }

  return result;
};

/**
 * 🔹 API Setup
 */
const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithLogger,
  tagTypes: ['Orders'],
  endpoints: () => ({}),
});

export default api;
