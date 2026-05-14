import {Platform} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import axiosInstance, {apiCall} from '../services/apis/axios.config';
import {
  getFcmToken,
  requestNotificationPermission,
} from '../hooks/notification/useNotification';
import {useAuthStore} from '../store';

export interface DeviceInfoRequest {
  phone: string | number;
  role: 'USER' | 'TRANSPORTER' | 'CAPTAIN';
  deviceId: string;
  deviceType: string;
  deviceModel: string;
  deviceBrand: string;
  osVersion: string;
  appVersion: string;
  fcmToken: string;
  tokenType: string;
  lastActiveTimestamp: string;
  notificationEnabled: boolean;
  longitude?: number;
  latitude?: number;
  loginTimestamp: string;
}

export interface DeviceInfoResponse {
  success: boolean;
  message?: string;
}

class DeviceInfoService {
  private async getDeviceInfo(): Promise<Partial<DeviceInfoRequest>> {
    try {
      const [
        notificationEnabled,
        uniqueId,
        brand,
        model,
        systemVersion,
        version,
        fcmToken,
      ] = await Promise.all([
        requestNotificationPermission(),
        DeviceInfo.getUniqueId(),
        DeviceInfo.getBrand(),
        DeviceInfo.getModel(),
        DeviceInfo.getSystemVersion(),
        DeviceInfo.getVersion(),
        getFcmToken(),
      ]);

      return {
        deviceId: uniqueId,
        deviceType: Platform.OS.toUpperCase(),
        deviceBrand: brand,
        deviceModel: model,
        osVersion: systemVersion,
        appVersion: version,
        fcmToken: fcmToken || '',
        tokenType: 'FCM',
        notificationEnabled: notificationEnabled,
        lastActiveTimestamp: new Date().toISOString(),
        loginTimestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting device info:', error);

      return {};
    }
  }

  async updateDeviceInfo(
    sessionKey: string,
    phone: string,
    longitude?: number,
    latitude?: number,
  ): Promise<DeviceInfoResponse> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      const authPhone = useAuthStore.getState().authData?.phone || phone;

      const requestData: DeviceInfoRequest = {
        phone: authPhone,
        role: 'CAPTAIN',
        deviceId: deviceInfo.deviceId || '',
        deviceType: deviceInfo.deviceType || Platform.OS.toUpperCase(),
        deviceModel: deviceInfo.deviceModel || '',
        deviceBrand: deviceInfo.deviceBrand || '',
        osVersion: deviceInfo.osVersion || '',
        appVersion: deviceInfo.appVersion || '',
        fcmToken: deviceInfo.fcmToken || '',
        tokenType: deviceInfo.tokenType || 'FCM',
        lastActiveTimestamp:
          deviceInfo.lastActiveTimestamp || new Date().toISOString(),
        notificationEnabled: deviceInfo.notificationEnabled ?? true,
        longitude,
        latitude,
        loginTimestamp: deviceInfo.loginTimestamp || new Date().toISOString(),
      };

      console.log(requestData);

      const response = await apiCall(
        axiosInstance.post<DeviceInfoResponse>(
          '/quickVerse/v1/updateDeviceRegistry',
          requestData,
          {
            headers: {
              SessionKey: sessionKey,
              phone: authPhone,
            },
          },
        ),
      );

      return response;
    } catch (error) {
      console.error('Error updating device info:', error);

      throw error;
    }
  }

  async getDeviceInfoForLogging(): Promise<Record<string, any>> {
    try {
      const [
        uniqueId,
        brand,
        model,
        systemName,
        systemVersion,
        version,
        buildNumber,
        bundleId,
        isTablet,
        isEmulator,
        deviceName,
        manufacturer,
        apiLevel,
        totalMemory,
        batteryLevel,
        carrier,
      ] = await Promise.all([
        DeviceInfo.getUniqueId(),
        DeviceInfo.getBrand(),
        DeviceInfo.getModel(),
        DeviceInfo.getSystemName(),
        DeviceInfo.getSystemVersion(),
        DeviceInfo.getVersion(),
        DeviceInfo.getBuildNumber(),
        DeviceInfo.getBundleId(),
        DeviceInfo.isTablet(),
        DeviceInfo.isEmulator(),
        DeviceInfo.getDeviceName(),
        DeviceInfo.getManufacturer(),
        DeviceInfo.getApiLevel(),
        DeviceInfo.getTotalMemory(),
        DeviceInfo.getBatteryLevel(),
        DeviceInfo.getCarrier(),
      ]);

      return {
        uniqueId,
        brand,
        model,
        systemName,
        systemVersion,
        version,
        buildNumber,
        bundleId,
        isTablet,
        isEmulator,
        deviceName,
        manufacturer,
        apiLevel,
        totalMemory,
        batteryLevel,
        carrier,
        platform: Platform.OS,
      };
    } catch (error) {
      console.error('Error getting device info for logging:', error);

      return {};
    }
  }
}

export default new DeviceInfoService();
