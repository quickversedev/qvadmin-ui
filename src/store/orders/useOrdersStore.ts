// stores/orderStore.ts
import {create} from 'zustand';
import axiosInstance, {
  apiCall,
  withHeaders,
} from '../../services/apis/axios.config';

export interface OrderItems {
  id: number;
  name: string;
  itemCount: number;
}

export interface ShopAddress {
  id?: number;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface ShopDetails {
  shopId?: string;
  name?: string;
  logo?: string;
  banner?: string;
  owner?: string;
  phone?: string;
  openingTime?: string;
  closingTime?: string;
  preparationTime?: string;
  description?: string;
  category?: string;
  storeActive?: boolean;
  storeEnabled?: boolean;
  featured?: boolean;
  address?: ShopAddress;
}

export interface Order {
  orderId: string;
  campusId: string;
  shopId: number;
  customerId: number;
  customerName: string;
  customerMobile: number;
  customerAddress: string;

  state: string;
  totalAmount: number;
  acceptedDate: string;
  completedDate: string;
  rejectedDate: string;
  orderItem: OrderItems[] | [];
  totalItemCount: number;
  productCount: number;
  invoiceAmount: number;
  fulfillmentOption: string;
  creationTime: string;
  amountExcludingDeliveryFee: number;
  deliveryFee: number;
  productImageURLs: string;
  stateLabel: string;
  orderDescription: string;
  orderLink: string;
  paymentMethod: string;
  shop?: ShopDetails;
}

interface OrderResponse {
  orders: {
    order: Order[];
  };
}

interface OrderStore {
  orders: Order[];
  loading: boolean;
  error: string | null;
  lastTimeFilter: TimeFilter;
  fetchOrders: (
    regionId: string | undefined,
    timeFilter?: TimeFilter,
    authToken?: string,
  ) => Promise<void>;
  getOrderCount: () => number;
  getOrderById: (orderId: string) => Order | undefined;
  getTotalPendingOrders: () => Order[];
  getTotalAcceptedOrders: () => Order[];
  getTotalReadyToShipOrders: () => Order[];
  getVendorOrdersByStatus: (vendorId: number, status: string) => Order[];
  getOrdersCountByStatus: (status: string) => number;
  getVendorOrdersCountByStatus: (vendorId: number, status: string) => number;
}
export type TimeFilter = '1h' | '3h' | '1d' | '7d' | '30d' | 'all';
const getStartDate = (filter: TimeFilter): string | undefined => {
  const now = new Date();
  let date: Date;
  let timeRange: string;

  switch (filter) {
    case '1h':
      timeRange = 'LAST_1_HOUR';
      break;

    case '3h':
      timeRange = 'LAST_3_HOUR';
      break;

    case '1d':
      timeRange = 'TODAY';
      break;

    case '30d':
      timeRange = 'LAST_1_MONTH';
      break;

    default:
      return 'LAST_1_HOUR';
  }

  return timeRange;
};

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  loading: false,
  error: null,
  lastTimeFilter: '1d',

  fetchOrders: async (
    regionId?: string,
    timeFilter: TimeFilter = '1d',
    authToken?: string,
  ) => {
    set({loading: true, error: null, lastTimeFilter: timeFilter});
    try {
      const timeRange = getStartDate(timeFilter);
      const endpoint = `/v2/order/region-orders?regionId=${regionId}&timeRange=${timeRange}`;

      if (!authToken) {
        throw new Error('No authentication token available');
      }

      const headers = {
        SessionKey: authToken,
      };

      const response = await apiCall<OrderResponse>(
        axiosInstance.get(endpoint, withHeaders(headers)),
      );

      const parsedOrders = response.orders.order.map(order => {
        let customerAddress = order.customerAddress;

        return {
          ...order,
          customerAddress,
          acceptedDate: order.acceptedDate ?? '',
          completedDate: order.completedDate ?? '',
          rejectedDate: order.rejectedDate ?? '',
          orderItem: order.orderItem ?? [],
        };
      });

      set({orders: parsedOrders, loading: false});
    } catch (error) {
      console.log('error in fetchOrders', error);
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false,
      });
    }
  },

  getOrderCount: () => {
    return get().orders.length;
  },

  getOrderById: (orderId: string) => {
    return get().orders.find(order => order.orderId === orderId);
  },

  getTotalPendingOrders: () => {
    return get().orders.filter(order => order.state === 'PENDING');
  },

  getTotalAcceptedOrders: () => {
    return get().orders.filter(order => order.state === 'ACCEPTED');
  },

  getTotalReadyToShipOrders: () => {
    return get().orders.filter(order => order.state === 'READY_TO_SHIP');
  },

  getVendorOrdersByStatus: (vendorId: number, status: string) => {
    return get().orders.filter(
      order => order.shopId === vendorId && order.state === status,
    );
  },
  getVendorOrdersCountByStatus: (vendorId: number, status: string) => {
    return get().orders.filter(
      order => order.shopId === vendorId && order.state === status,
    ).length;
  },
  getOrdersCountByStatus: (status: string) => {
    return get().orders.filter(order => order.state === status).length;
  },
}));
