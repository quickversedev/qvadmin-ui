import api from '.';

const promotionApi = api.injectEndpoints({
  endpoints: builder => ({
    // To Create Pages (Home, Restaurant, Grocery Etc.)
    createPage: builder.mutation({
      query: payload => ({
        url: '/quickVerse/v1/page',
        method: 'POST',
        body: payload,
      }),
    }),
    // To Get Pages (Home, Restaurant, Grocery Etc.) Based on Region Id
    getPages: builder.query({
      query: regionId => `/quickVerse/v3/pages?regionId=${regionId}`,
    }),
    // To Update Pages (Home, Restaurant, Grocery Etc.)
    updatePage: builder.mutation({
      query: ({pageId, ...payload}) => ({
        url: `/quickVerse/v1/page/${pageId}`,
        method: 'PATCH',
        body: payload,
      }),
    }),
    // To Delete Pages (Home, Restaurant, Grocery Etc.)
    deletePage: builder.mutation({
      query: pageId => ({
        url: `/quickVerse/v1/page/${pageId}`,
        method: 'DELETE',
      }),
    }),

    // To Create Promotion Banners (For Home, Restaurant, Grocery Etc.)
    createPromotion: builder.mutation({
      query: payload => ({
        url: '/quickVerse/v1/promotions',
        method: 'POST',
        body: payload,
      }),
    }),
    // To Update Promotion Banners (For Home, Restaurant, Grocery Etc.)
    updatePromotion: builder.mutation({
      query: ({promotionId, ...payload}) => ({
        url: `/quickVerse/v1/promotions/${promotionId}`,
        method: 'PATCH',
        body: payload,
      }),
    }),
    // To Delete Promotion Banners (For Home, Restaurant, Grocery Etc.)
    deletePromotion: builder.mutation({
      query: promotionId => ({
        url: `/quickVerse/v1/promotions/${promotionId}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useCreatePageMutation,
  useGetPagesQuery,
  useUpdatePageMutation,
  useDeletePageMutation,
  useCreatePromotionMutation,
  useUpdatePromotionMutation,
  useDeletePromotionMutation,
} = promotionApi;
