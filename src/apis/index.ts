import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {storage} from '../services/storage/MMKV/zustandMmkvStorage';

const api = createApi({
  reducerPath: 'api',

  baseQuery: fetchBaseQuery({
    baseUrl: 'https://superscientifically-revengeless-ronald.ngrok-free.dev',

    prepareHeaders: (headers, {endpoint}) => {
      const authData = storage.getString('@AuthData');
      const authDataObj = authData ? JSON.parse(authData) : null;

      const noAuthEndpoints = [
        'requestOtp',
        'login',
        'getRegions',
        'getOrderStats',
        'getOrders',
        'getOrdersFinance',
        'getOrderById',
        'getPricingConfig',
      ];

      if (!noAuthEndpoints.includes(endpoint)) {
        if (authDataObj?.jwt) {
          headers.set('SessionKey', `Bearer ${authDataObj.jwt}`);
        }
      }

      headers.set(
        'Authorization',
        'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
      );
      headers.set('Request-Origin', 'CAPTAIN');

      return headers;
    },
  }),
  tagTypes: ['Orders'],
  endpoints: () => ({}),
});

export default api;
