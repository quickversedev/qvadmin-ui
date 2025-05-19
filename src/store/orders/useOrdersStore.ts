// stores/orderStore.ts
import {create} from 'zustand';
import axios from 'axios';
import {mockOrders} from '../../assets/mockData/orders';
import globalConfig from '../../utils/global/globalConfig';

interface CustomerAddress {
  name: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export interface Order {
  orderId: string;
  campusId: string;
  shopId: number;
  customerId: number;
  customerName: string;
  customerMobile: number;
  customerAddress: string | CustomerAddress;
  state: string;
  totalAmount: number;
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
    campusId: string | undefined,
    timeFilter?: TimeFilter,
  ) => Promise<void>;
  getOrderCount: () => number;
  getOrderById: (orderId: string) => Order | undefined;
  getTotalPendingOrders: () => Order[];
  getTotalAcceptedOrders: () => Order[];
  getTotalReadyToShipOrders: () => Order[];
  getVendorOrdersByStatus: (vendorId: number, status: string) => Order[];
  getOrdersCountByStatus: (status: string) => number;
}
export type TimeFilter = '1h' | '3h' | '1d' | '7d' | '30d' | 'all';
const getStartDate = (filter: TimeFilter): string | undefined => {
  const now = new Date();
  let date: Date;

  switch (filter) {
    case '1h':
      date = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '3h':
      date = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      break;
    case '1d':
      date = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '30d':
      date = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      return undefined;
  }

  // Format the date as yyyy/mm/dd hh:mm:ss
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
};

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  loading: false,
  error: null,
  lastTimeFilter: '1d',

  fetchOrders: async (campusId?: string, timeFilter: TimeFilter = '1d') => {
    set({loading: true, error: null, lastTimeFilter: timeFilter});
    try {
      const startDate = getStartDate(timeFilter);

      const response = await axios.get<OrderResponse>(
        `${globalConfig.apiBaseUrl}/v2/OrderStatus?campusId=${campusId}&startDate=${startDate}`,
        {
          headers: {
            SessionKey:
              'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJtb2JpbGUiOiI5MTk3NjUwMDgxMTAiLCJpYXQiOjE3NDc2NDgzNDAsImV4cCI6MTc3OTE4NDM0MH0._cj5P6tzOZFbBPrVcNRUgaXv7qQrfyha43cBN1qCBHo',
          },
        },
      );

      // await new Promise(resolve => setTimeout(resolve, 1000));

      const parsedOrders = response.data.orders.order.map(order => {
        let customerAddress = order.customerAddress;

        return {
          ...order,
          customerAddress,
        };
      });

      set({orders: parsedOrders, loading: false});
    } catch (error) {
      set({
        error: axios.isAxiosError(error) ? error.message : 'Unknown error',
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
  getOrdersCountByStatus: (status: string) => {
    return get().orders.filter(order => order.state === status).length;
  },
}));
