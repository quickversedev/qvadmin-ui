// stores/orderStore.ts
import {create} from 'zustand';
import axios from 'axios';
import {mockOrders} from '../../assets/mockData/orders';

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
  fetchOrders: (timeFilter?: TimeFilter) => Promise<void>;
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
  switch (filter) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000).toLocaleString();
    case '3h':
      return new Date(now.getTime() - 3 * 60 * 60 * 1000).toJSON();
    case '1d':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toString();
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toDateString();

    default:
      return undefined;
  }
};
// const getStartDate = (filter: TimeFilter): number | undefined => {
//   const now = Date.now(); // Current timestamp in milliseconds
//   switch (filter) {
//     case '1h':
//       return now - 60 * 60 * 1000; // 1 hour ago
//     case '3h':
//       return now - 3 * 60 * 60 * 1000; // 3 hours ago
//     case '1d':
//       return now - 24 * 60 * 60 * 1000; // 1 day ago
//     case '7d':
//       return now - 7 * 24 * 60 * 60 * 1000; // 7 days ago
//     case '30d':
//       return now - 30 * 24 * 60 * 60 * 1000; // 30 days ago
//     case 'all':
//     default:
//       return undefined;
//   }
// };

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  fetchOrders: async (timeFilter: TimeFilter = '1d') => {
    set({loading: true, error: null});
    try {
      const startDate = getStartDate(timeFilter);
      console.log('Fetching orders with filter:', startDate);
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', startDate);
      }

      // const response = await axios.get<OrderResponse>(
      //   'http://localhost:8080/quickVerse/v2/OrderStatus',
      //   {
      //     params,
      //     headers: {
      //       SessionKey:
      //         'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJtb2JpbGUiOiI5MTk3ODI2NjI3NzgiLCJpYXQiOjE3MzIxOTg2NzMsImV4cCI6MTc2MzczNDY3M30.vPMvPZQa3Mv49ccbG_pgOxLeYTS1JQUOD63p4g8p9m8',
      //     },
      //   },
      // );

      await new Promise(resolve => setTimeout(resolve, 1000));

      const parsedOrders = mockOrders.orders.order.map(order => {
        let customerAddress = order.customerAddress;
        // if (typeof customerAddress === 'string') {
        //   try {
        //     const addressStr = customerAddress.replace(/^{|}$/g, '');
        //     const addressParts = addressStr.split(', ').reduce((acc, part) => {
        //       const [key, value] = part.split('=');
        //       acc[key] = value;
        //       return acc;
        //     }, {} as Record<string, string>);

        //     customerAddress = {
        //       name: addressParts.name,
        //       addressLine1: addressParts.addressLine1,
        //       addressLine2: addressParts.addressLine2,
        //       addressLine3: addressParts.addressLine3,
        //       city: addressParts.city,
        //       state: addressParts.state,
        //       pincode: addressParts.pincode,
        //       latitude: parseFloat(addressParts.latitude),
        //       longitude: parseFloat(addressParts.longitude),
        //     };
        //   } catch (e) {
        //     console.error('Error parsing address', e);
        //   }
        // }

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
