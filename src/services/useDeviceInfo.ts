import deviceInfoService from '../services/deviceInfoService';
import {useAuthStore} from '../store';
import {useCallback} from 'react';

export const useDeviceInfo = () => {
  const {authData} = useAuthStore(state => state);

  /**
   * Update device information to backend
   */
  const updateDeviceInfo = useCallback(async () => {
    try {
      if (!authData?.jwt) {
        console.warn('No auth token available for device info update');
        return null;
      }
      const response = await deviceInfoService.updateDeviceInfo(
        authData.jwt,
        authData.empId,
      );
      console.log('response', response);
      return response;
    } catch (error) {
      console.error('Failed to update device info:', error);
      throw error;
    }
  }, [authData?.empId, authData?.jwt]);

  /**
   * Get device info for logging/debugging
   */
  const getDeviceInfoForLogging = useCallback(async () => {
    try {
      const deviceInfo = await deviceInfoService.getDeviceInfoForLogging();
      //console.log('Device Info:', deviceInfo);
      return deviceInfo;
    } catch (error) {
      console.error('Failed to get device info for logging:', error);
      return null;
    }
  }, []);

  return {
    updateDeviceInfo,
    getDeviceInfoForLogging,
  };
};
