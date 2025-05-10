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
  fetchOrders: () => Promise<void>;
  getOrderCount: () => number;
  getOrderById: (orderId: string) => Order | undefined;
  getTotalPendingOrders: () => Order[];
  getTotalAcceptedOrders: () => Order[];
  getTotalReadyToShipOrders: () => Order[];
  getVendorOrdersByStatus: (vendorId: number, status: string) => Order[];
  getOrdersCountByStatus: (status: string) => number;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  fetchOrders: async () => {
    set({loading: true, error: null});
    try {
      //   const response = await axios.post<OrderResponse>(
      //     'http://localhost:8080/quickVerse/v2/OrderStatus?status=PENDING&startDate=2024/09/29',
      //     {
      //       pending: true,
      //       accepted: true,
      //     },
      //     {
      //       headers: {
      //         SessionKey:
      //           'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJtb2JpbGUiOiI5MTk3ODI2NjI3NzgiLCJpYXQiOjE3MzIxOTg2NzMsImV4cCI6MTc2MzczNDY3M30.vPMvPZQa3Mv49ccbG_pgOxLeYTS1JQUOD63p4g8p9m8',
      //         'Content-Type': 'application/json',
      //       },
      //     },
      //   );
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
