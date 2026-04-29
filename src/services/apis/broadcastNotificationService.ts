import {apiCall, createRequestWithHeaders} from './axios.config';

const BROADCAST_NOTIFICATION_ENDPOINT = '/quickVerse/v2/notification/broadcast';
const AUTHORIZATION_HEADER = 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx';

export interface BroadcastNotificationPayload {
  title: string;
  description: string;
}

export const sendCustomerBroadcastNotification = async (
  payload: BroadcastNotificationPayload,
) => {
  if (!payload.title?.trim()) {
    throw new Error('Title is required');
  }

  if (!payload.description?.trim()) {
    throw new Error('Description is required');
  }

  return apiCall<any>(
    createRequestWithHeaders(
      'post',
      BROADCAST_NOTIFICATION_ENDPOINT,
      {
        title: payload.title.trim(),
        description: payload.description.trim(),
      },
      {
        Accept: 'application/json, text/plain',
        Authorization: AUTHORIZATION_HEADER,
        'Request-Origin': 'CAPTAIN',
        'Content-Type': 'application/json',
      },
    ),
  );
};

export const broadcastNotificationService = {
  sendCustomerBroadcastNotification,
};
