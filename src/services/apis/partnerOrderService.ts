import axiosInstance, {apiCall} from './axios.config';

export interface PartnerOrder {
  id: string;
  orderId: string;
  deliveryPartnerId: string;
  orderStatus: string;
  // ...other fields as needed
}

export const fetchOrdersByPartner = async (
  deliveryPartnerId: string,
  sessionKey: string,
): Promise<PartnerOrder[]> => {
  const response = await apiCall<PartnerOrder[]>(
    axiosInstance.get(
      `/v1/order-master/delivery-partner/${deliveryPartnerId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          SessionKey: sessionKey,
          'Request-Origin': 'CAPTAIN',
        },
      },
    ),
  );
  return response;
};

export const partnerOrderService = {
  fetchOrdersByPartner,
};
