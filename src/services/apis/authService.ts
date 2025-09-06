import { apiCall, createRequestWithHeaders } from './axios.config';

import {StorageService} from '../storage/MMKV/storage.service.ts';

export type AuthData = {
  session: {
    token: string;
    phoneNumber: string;
    newUser?: boolean;
   
  };
};
const sendOtp = async (phoneNumber: string): Promise<any> => {
  //*********************mock****************
  // return new Promise(resolve => {
  //   setTimeout(() => {
  //     resolve({});
  //   }, 1000);
  // });

  try {
    const response = await apiCall(
      createRequestWithHeaders(
        'post',
        '/v1/requestOtp',
        {
          phone: '91'+phoneNumber,
        },
        {
          Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
        }
      )
    );
    return response?.response?.verificationId;
  } catch (error) {
    console.error('Error in sendOtp:', error);
    throw error;
  }
};
const verifyOtp = async (
  phoneNumber: string,
  otp: string,
  verificationId: string,
): Promise<AuthData> => {
  //   *********************mock****************

  // return new Promise(resolve => {
  //   setTimeout(() => {
  //     resolve({
  //       session: {
  //         token: JWTTokenMock,
  //         phoneNumber: phoneNumber,
  //         name: 'Lucas Garcez',
  //         //campus: 'IIM Udaipur',
  //         email: 'abhilashghope@gmail.com',
  //       },
  //     });
  //   }, 1000);
  // });

  console.log('phoneNumber', phoneNumber);
  console.log('otp', otp);
  console.log('verificationId', verificationId);
  try {
    const response = await apiCall(
      createRequestWithHeaders(
        'post',
        '/v1/login',
        {
          phone: '91'+phoneNumber,
          otp: otp,
          verificationId: verificationId,
        },
        {
          Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
        }
      )
    );
    console.log('response', response);
    const data = response;
    return {
      session: {
        token: data.jwt,
        phoneNumber: data.phone,
        newUser: data.newUser,
        
      },
    };
  } catch (error) {
    console.error('Error in verifyOtp:', error);
    throw error;
  }
};


export const authService = {
  verifyOtp,
  sendOtp,
};

