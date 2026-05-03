import {ORDER_STATUS} from '../../assets/constants/constant';

export const getStatusStyles = (state: string) => {
  switch (state) {
    case ORDER_STATUS.CANCELLED:
      return {
        backgroundColor: '#f8d7da',
        color: '#721c24',
        icon: 'cancel',
      };
    case ORDER_STATUS.REJECTED:
      return {
        backgroundColor: '#fff3cd',
        color: '#856404',
        icon: 'close-circle-outline',
      };
    case ORDER_STATUS.PENDING:
      return {
        backgroundColor: '#e6f0fa',
        color: '#0f3057',
        icon: 'clock-outline',
      };
    case ORDER_STATUS.ACCEPTED:
      return {
        backgroundColor: '#d4edda',
        color: '#155724',
        icon: 'check-circle-outline',
      };
    case ORDER_STATUS.PACKED:
      return {
        backgroundColor: '#cce5ff',
        color: '#004085',
        icon: 'package-variant-closed',
      };
    case ORDER_STATUS.SHIPPED:
      return {
        backgroundColor: '#d1ecf1',
        color: '#0c5460',
        icon: 'truck-delivery-outline',
      };
    case ORDER_STATUS.COMPLETED:
      return {
        backgroundColor: '#d5f5e3',
        color: '#1e8449',
        icon: 'check-all',
      };
    default:
      return {
        backgroundColor: '#e6f0fa',
        color: '#0f3057',
        icon: 'help-circle-outline',
      };
  }
};
