import {apiCall, createRequestWithHeaders} from './axios.config';
import {Order, ShopDetails} from '../../store/orders/useOrdersStore';

type OrderDetailsApiResponse = {
  response?: {
    order?: Partial<Order>;
    shop?: ShopDetails;
  };
};

const BASIC_AUTH_HEADER =
  'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx';

export const fetchOrderDetails = async (orderId: string): Promise<Order> => {
  if (!orderId) {
    throw new Error('Order ID is required');
  }

  const endpoint = `/quickVerse/v2/order/${encodeURIComponent(orderId)}`;

  const response = await apiCall<OrderDetailsApiResponse>(
    createRequestWithHeaders(
      'get',
      endpoint,
      undefined,
      {
        Authorization: BASIC_AUTH_HEADER,
      },
    ),
  );

  const order = response?.response?.order;
  const shop = response?.response?.shop;
  if (!order) {
    throw new Error('Order details not found in API response');
  }

  return {
    ...order,
    acceptedDate: order.acceptedDate ?? '',
    completedDate: order.completedDate ?? '',
    rejectedDate: order.rejectedDate ?? '',
    orderItem: order.orderItem ?? [],
    shop,
  } as Order;
};
