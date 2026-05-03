import {create} from 'zustand';
import api from '.';
import {deleteDeliveryPartner} from '../services/apis/deliveryPartnerService';

const deliveryPartnerApi = api.injectEndpoints({
  endpoints: builder => ({
    createDeliveryPartner: builder.mutation({
      query: payload => ({
        url: '/v1/delivery-partner',
        method: 'POST',
        body: payload,
      }),
    }),
    // To Get Delivery Partners
    getDeliveryPartners: builder.query({
      query: ({isDeleted = false}) =>
        `/v1/delivery-partner/?isDeleted=${isDeleted}`,
    }),
    // To Get Delivery Partner By Id
    getDeliveryPartnerById: builder.query({
      query: (id: string) => `/v1/delivery-partner/${id}`,
    }),
    // To Update Delivery Partner By Id
    updateDeliveryPartner: builder.mutation({
      query: ({id, ...payload}) => ({
        url: `/v1/delivery-partner/${id}`,
        method: 'PUT',
        body: payload,
      }),
    }),
    // To Delete Delivery Partner By Id
    deleteDeliveryPartner: builder.mutation({
      query: (id: string) => ({
        url: `/v1/delivery-partner/${id}`,
        method: 'DELETE',
      }),
    }),
    // To Get Active Delivery Partners
    getActiveDeliveryPartners: builder.query({
      query: () => `/v1/delivery-partner/getPartnersByOnlineStatus`,
    }),
  }),
});

export const {
  useGetDeliveryPartnersQuery,
  useGetDeliveryPartnerByIdQuery,
  useCreateDeliveryPartnerMutation,
  useUpdateDeliveryPartnerMutation,
  useDeleteDeliveryPartnerMutation,
  useGetActiveDeliveryPartnersQuery,
} = deliveryPartnerApi;
