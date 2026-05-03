import api from '.';

const pricingConfigApi = api.injectEndpoints({
  endpoints: builder => ({
    // To Get Pricing Config Based on Service Type (Food, Grocery Etc.)
    getPricingConfig: builder.query({
      query: serviceType =>
        `/quickVerse/v3/pricing-configurations?serviceType=${serviceType}`,
    }),
    // To Update Pricing Config Based on Config Id
    updatePricingConfig: builder.mutation({
      query: ({id, ...config}) => ({
        url: `/quickVerse/v3/pricing-configurations/${id}`,
        method: 'PUT',
        body: config,
      }),
    }),
  }),
});

export const {useGetPricingConfigQuery, useUpdatePricingConfigMutation} =
  pricingConfigApi;
