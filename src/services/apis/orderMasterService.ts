import axiosInstance, {apiCall} from './axios.config';

export interface AssignOrderPayload {
  deliveryPartnerId: string;
  orderId: string;
}

export interface AssignOrderResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const assignOrder = async (
  payload: AssignOrderPayload,
  sessionKey: string,
): Promise<AssignOrderResponse> => {
  const response = await apiCall<AssignOrderResponse>(
    axiosInstance.post('/v1/order-master/assignOrder', payload, {
      headers: {
        'Content-Type': 'application/json',
        SessionKey: sessionKey,
        'Request-Origin': 'CAPTAIN',
      },
    }),
  );
  return response;
};

export const orderMasterService = {
  assignOrder,
};
