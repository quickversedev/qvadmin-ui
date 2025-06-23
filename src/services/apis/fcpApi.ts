// src/api/fcmApi.ts
import axios from 'axios';

const BASE_URL = 'https://your-api.com'; // Replace with your backend URL

interface FCMTokenPayload {
  fcmToken: string;
  userType: 'captain';
}

export const sendFCMToken = async (
  fcmToken: string,
  sessionToken: string | undefined,
) => {
  const payload: FCMTokenPayload = {
    fcmToken,
    userType: 'captain',
  };
  try {
    const response = await axios.post(`${BASE_URL}/api/fcm-token`, payload, {
      headers: {
        sessionToken, // custom header
      },
    });
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
    const response = await axios.delete(`${BASE_URL}/api/fcm-token`, {
      headers: {
        sessionToken,
      },
    });
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
