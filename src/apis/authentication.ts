import api from '.';

const authenticationApi = api.injectEndpoints({
  endpoints: builder => ({
    requestOtp: builder.mutation({
      query: (phone: string) => ({
        url: '/quickVerse/v1/requestOtp',
        method: 'POST',
        body: {phone},
      }),
    }),

    login: builder.mutation({
      query: (credentials: {
        phone: string;
        otp: string;
        verificationId: string;
      }) => ({
        url: '/quickVerse/v1/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    getRegions: builder.query({
      query: () => ({
        url: '/quickVerse/v3/regions',
        method: 'GET',
      }),
    }),
  }),
});

export const {useRequestOtpMutation, useLoginMutation, useGetRegionsQuery} =
  authenticationApi;
