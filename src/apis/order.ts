import api from '.';

const orderApi = api.injectEndpoints({
  endpoints: builder => ({
    // To fetch order stats for a specific region and time range
    getOrderStats: builder.query({
      query: (params: {regionId: string; timeRange: string}) => ({
        url: `/quickVerse/v2/order/stats?regionId=${params.regionId}&timeRange=${params.timeRange}`,
        method: 'GET',
      }),
    }),
    // To fetch orders based on filters like region, time range, and status
    getOrders: builder.query({
      query: (params: {
        regionId: string;
        timeRange: string;
        orderStatus?: string;
      }) => ({
        url: `/quickVerse/v2/order/region-orders?regionId=${
          params.regionId
        }&timeRange=${params.timeRange}&orderStatus=${
          params.orderStatus || ''
        }`,
        method: 'GET',
      }),
      providesTags: ['Orders'],
    }),
    // To fetch order details by order ID
    getOrderById: builder.query({
      query: (orderId: string) => ({
        url: `/quickVerse/v2/order/${orderId}`,
        method: 'GET',
      }),
    }),
    // To fetch financial details of orders based on filters like region, time range, and status
    getOrdersFinance: builder.query({
      query: (params: {regionId: string; timeRange: string}) => ({
        url: `/quickVerse/v2/order/finance?regionId=${params.regionId}&timeRange=${params.timeRange}`,
        method: 'GET',
      }),
    }),
    // To assign an order to a delivery partner
    assignOrder: builder.mutation({
      query: (params: {orderId: string; deliveryPartnerId: string}) => ({
        url: `/v1/order-master/assignOrder`,
        method: 'POST',
        body: {
          orderId: params.orderId,
          deliveryPartnerId: params.deliveryPartnerId,
        },
      }),
      invalidatesTags: ['Orders'],
    }),
  }),
});

export const {
  useGetOrderStatsQuery,
  useGetOrdersQuery,
  useGetOrdersFinanceQuery,
  useGetOrderByIdQuery,
} = orderApi;
