// src/api/fcmApi.ts
import axios from 'axios';
import globalConfig from '../../utils/global/globalConfig';

interface FCMTokenPayload {
  newFCMToken: string;
  fcmToken: string;
}

export const sendFCMToken = async (
  newFCMToken: string,
  fcmToken: string,
  sessionToken: string | undefined,
) => {
  const payload: FCMTokenPayload = {
    newFCMToken,
    fcmToken,
  };
  try {
    const response = await axios.put(
      `${globalConfig.apiBaseUrl}/v1/updateDeviceInfo`,
      payload,
      {
        headers: {
          sessionToken,
        },
      },
    );
    console.log('✅ FCM token sent successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error(
      '❌ Failed to send FCM token:',
      error.response?.data || error.message,
    );
    throw error;
  }
};
export const deleteFCMToken = async (sessionToken: string) => {
  try {
    const response = await axios.delete(
      `${globalConfig.apiBaseUrl}/api/fcm-token`,
      {
        headers: {
          sessionToken,
        },
      },
    );
    console.log('✅ FCM token deleted successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error(
      '❌ Failed to delete FCM token:',
      error.response?.data || error.message,
    );
    throw error;
  }
};
