// src/utils/orderUtils.ts
import {Platform, Linking} from 'react-native';

// Address parsing utility
export const parseAddress = (addressString: string) => {
  try {
    const cleaned = addressString?.replace(/[{}]/g, '');
    const parts = cleaned?.split(', ');
    const addressObj: Record<string, string> = {};

    parts?.forEach(part => {
      const [key, value] = part.split('=');
      addressObj[key] = value;
    });

    return addressObj;
  } catch (e) {
    console.error('Error parsing address:', e);
    return {
      name: 'Unknown',
      addressLine1: 'Address not available',
      addressLine2: '',
      addressLine3: '',
      city: '',
      state: '',
      pincode: '',
    };
  }
};

// Map utility
type OpenMapArgs = {
  lat: string | number;
  lng: string | number;
  label: string;
};

export const openMap = ({lat, lng, label}: OpenMapArgs) => {
  const scheme = Platform.select({
    ios: `maps://?q=${label}&ll=${lat},${lng}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
  });

  if (scheme) {
    Linking.openURL(scheme).catch(err =>
      console.error('Error opening map: ', err),
    );
  }
};

// Time formatting
export const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
};

export const getTimeElapsed = (time: string | number | Date) => {
  const createdTimeUTC = new Date(time).getTime();
  const nowIST = new Date();
  const now = nowIST.getTime();
  const diffMins = Math.floor((now - createdTimeUTC) / (1000 * 60));

  const hours = Math.floor(diffMins / 60);
  const minutes = diffMins % 60;

  return `${hours}h:${minutes}m`;
};
export const convertUTCToIST = (utcTime: string): string => {
  try {
    const date = new Date(utcTime);
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(date.getTime());

    return istTime.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  } catch (error) {
    console.error('Error converting UTC to IST:', error);
    return '--';
  }
};
