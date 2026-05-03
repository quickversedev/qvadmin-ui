import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import {storage} from '../services/storage/MMKV/zustandMmkvStorage';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: 'https://superscientifically-revengeless-ronald.ngrok-free.dev',
  prepareHeaders: (headers, {endpoint}) => {
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
      'getOrdersFinance',
      'getOrderById',
      'getPricingConfig',
      'getPages',
      'createPromotion',
      'getOrderHistory',
    ];

    if (!noAuthEndpoints.includes(endpoint)) {
      if (authData?.jwt) {
        headers.set('SessionKey', `Bearer ${authData.jwt}`);
      }
    }

    headers.set(
      'Authorization',
      'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
    );
    headers.set('Request-Origin', 'CAPTAIN');

    return headers;
  },
});

const baseQueryWithLogger: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const start = Date.now();

  const request = typeof args === 'string' ? {url: args, method: 'GET'} : args;

  const result = await rawBaseQuery(args, api, extraOptions);

  const end = Date.now();

  if (__DEV__) {
    const logObject = {
      type: result.error ? 'ERROR' : 'SUCCESS',
      url: request.url,
      method: request.method || 'GET',
      params: request.params || null,
      body: request.body || null,
      status: result.error ? result.error.status : 'OK',
      response: result.error ? result.error.data : result.data,
      duration: `${end - start}ms`,
      timestamp: new Date().toISOString(),
    };

    console.log(`${request.url} : `, logObject);
  }

  return result;
};

const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithLogger,
  tagTypes: ['Orders'],
  endpoints: () => ({}),
});

export default api;
