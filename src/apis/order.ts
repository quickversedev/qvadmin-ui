import api from '.';

const orderApi = api.injectEndpoints({
  endpoints: builder => ({
    // To fetch order stats for a specific region and time range
    getOrderStats: builder.query({
      query: (params: {
        regionId: string;
        timeRange: string;
        fromDate?: string;
        toDate?: string;
      }) => {
        const queryParams = new URLSearchParams({
          regionId: params.regionId,
          timeRange: params.timeRange,
        });

        // send only for CUSTOM
        if (params.timeRange === 'CUSTOM') {
          if (params.fromDate) {
            queryParams.append('fromDate', params.fromDate);
          }

          if (params.toDate) {
            queryParams.append('toDate', params.toDate);
          }
        }

        return {
          url: `/quickVerse/v2/order/stats?${queryParams.toString()}`,
          method: 'GET',
        };
      },
    }),
    getAllOrders: builder.query({
      query: (params: {
        regionId: string;
        timeRange: string;
        orderStatus?: string;
        vendorId?: string;
        transporterId?: string;
      }) => {
        let url = `/quickVerse/v2/orders?regionId=${
          params.regionId
        }&timeRange=${params.timeRange}&orderStatus=${
          params.orderStatus || ''
        }&page=0&pageSize=999`;

        if (params.vendorId) {
          url += `&vendorId=${params.vendorId}`;
        }

        if (params.transporterId) {
          url += `&transporterId=${params.transporterId}`;
        }

        return {
          url,
          method: 'GET',
        };
      },
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
      query: (params: {
        regionId: string;
        timeRange: string;
        fromDate?: string;
        toDate?: string;
      }) => {
        const queryParams = new URLSearchParams({
          regionId: params.regionId,
          timeRange: params.timeRange,
        });

        // send only for CUSTOM
        if (params.timeRange === 'CUSTOM') {
          if (params.fromDate) {
            queryParams.append('fromDate', params.fromDate);
          }

          if (params.toDate) {
            queryParams.append('toDate', params.toDate);
          }
        }

        return {
          url: `/quickVerse/v2/order/finance?${queryParams.toString()}`,
          method: 'GET',
        };
      },
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
    // To unassign an order from a delivery partner
    unassignOrder: builder.mutation({
      query: (params: {orderId: string; deliveryPartnerId: string}) => ({
        url: `/v1/order-master/unAssignOrder`,
        method: 'POST',
        body: {
          orderId: params.orderId,
          deliveryPartnerId: params.deliveryPartnerId,
        },
      }),
      invalidatesTags: ['Orders'],
    }),
    // To Get Orders History (supports pagination)
    getOrderHistory: builder.query({
      query: (params: {
        regionId: string;
        period: string;
        page?: number;
        size?: number;
      }) => {
        const page = params.page ?? 0;
        const size = params.size ?? 20;
        console.log(page, size);
        return {
          url: `/quickVerse/v2/order/history?regionId=${params.regionId}&period=${params.period}&page=${page}&size=${size}`,
          method: 'GET',
        };
      },
    }),
  }),
});

export const {
  useGetOrderStatsQuery,
  useGetAllOrdersQuery,
  useGetOrdersFinanceQuery,
  useGetOrderByIdQuery,
  useAssignOrderMutation,
  useUnassignOrderMutation,
  useGetOrderHistoryQuery,
} = orderApi;
