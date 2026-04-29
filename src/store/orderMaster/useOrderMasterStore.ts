import {useState} from 'react';
import {AssignOrderPayload} from '../../services/apis/orderMasterService';

export interface AssignedOrder {
  deliveryPartnerId: string;
  orderId: string;
}

export function useOrderMasterStore() {
  const [assignedOrders, setAssignedOrders] = useState<AssignedOrder[]>([]);

  const assignOrderLocal = (payload: AssignOrderPayload) => {
    setAssignedOrders(prev => [...prev, payload]);
  };

  const getAssignedOrderCount = (deliveryPartnerId: string) => {
    return assignedOrders.filter(
      order => order.deliveryPartnerId === deliveryPartnerId,
    ).length;
  };

  return {
    assignedOrders,
    assignOrderLocal,
    getAssignedOrderCount,
  };
}
