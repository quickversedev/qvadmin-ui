import {useOrderStore} from '../../store/orders/useOrdersStore';
import {useAuth} from '../../contexts/Login/AuthProvider';

export const useOrders = () => {
  const {authData} = useAuth();
  const orderStore = useOrderStore();

  const fetchOrders = async (regionId?: string, timeFilter?: any) => {
    if (!authData?.jwt) {
      throw new Error('User not authenticated');
    }
    
    return await orderStore.fetchOrders(regionId, timeFilter, authData.jwt);
  };

  return {
    ...orderStore,
    fetchOrders,
  };
};
