// src/api/fcmApi.ts
import { apiCall, createRequestWithHeaders } from './axios.config';

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
    const response = await apiCall(
      createRequestWithHeaders(
        'put',
        '/v1/updateDeviceInfo',
        payload,
        {
          sessionToken: sessionToken || '',
        }
      )
    );
    console.log('✅ FCM token sent successfully:', response);
    return response;
  } catch (error: any) {
    console.error(
      '❌ Failed to send FCM token:',
      error.message || 'Unknown error',
    );
    throw error;
  }
};
export const deleteFCMToken = async (sessionToken: string) => {
  try {
    const response = await apiCall(
      createRequestWithHeaders(
        'delete',
        '/api/fcm-token',
        undefined,
        {
          sessionToken,
        }
      )
    );
    console.log('✅ FCM token deleted successfully:', response);
    return response;
  } catch (error: any) {
    console.error(
      '❌ Failed to delete FCM token:',
      error.message || 'Unknown error',
    );
    throw error;
  }
};
