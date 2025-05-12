import axios from 'axios';

import globalConfig from '../../utils/global/globalConfig.ts';

export type AuthData = {
  session: {
    token: string;
    phoneNumber: string;

    name: string;
    email: string;
  };
};
const sendOtp = async (phoneNumber: string): Promise<any> => {
  //*********************mock****************
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({});
    }, 1000);
  });

  // return axios
  //   .post(
  //     `${globalConfig.apiBaseUrl}/v1/requestOtp`,
  //     {
  //       mobile: phoneNumber,
  //     },
  //     {
  //       headers: {
  //         Authorization: 'token',
  //       },
  //     },
  //   )
  //   .then(response => {
  //     return response.data?.response?.verificationId;
  //   })
  //   .catch(error => {
  //     if (error?.response) {
  //       // The request was made and the server responded with a status code
  //       console.log(
  //         'Server responded with non-2xx status:',
  //         error.response.status,
  //       );
  //       console.log('Response data:', error.response.data);
  //     } else if (error.request) {
  //       // The request was made but no response was received
  //       console.log('No response received:', error.request);
  //     } else {
  //       // Something happened in setting up the request that triggered an Error
  //       console.log('Error setting up the request:', error.message);
  //     }
  //     // Throw the error again to propagate it to the caller
  //     throw error;
  //   });
};
const verifyOtp = async (
  phoneNumber: string,
  otp: string,
  verificationId: string,
): Promise<AuthData> => {
  //   *********************mock****************
  console.log('response: Inside verify otp', otp, verificationId);
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        session: {
          token: JWTTokenMock,
          phoneNumber: phoneNumber,
          name: 'Lucas Garcez',
          //campus: 'IIM Udaipur',
          email: 'abhilashghope@gmail.com',
        },
      });
    }, 1000);
  });
  //   let token;
  //   let fcmToken = '';

  //   return axios
  //     .post(
  //       `${globalConfig.apiBaseUrl}/v1/login`,
  //       {
  //         mobile: phoneNumber,
  //         otp: otp,
  //         verificationId: verificationId,
  //         fcmToken: fcmToken,
  //       },
  //       {
  //         headers: {
  //           Authorization: token,
  //         },
  //       },
  //     )
  //     .then(response => {
  //       const data1 = response.data;
  //       const data = data1?.session;
  //       return {
  //         session: {
  //           token: data.jwt,
  //           phoneNumber: data.mobile,
  //           newUser: data.newUser,
  //           name: data.userName,
  //           campus: data.campusId,
  //           email: data.email,
  //         },
  //       };
  //     })
  //     .catch(error => {
  //       if (error?.response) {
  //         // The request was made and the server responded with a status code
  //         console.log(
  //           'Server responded with non-2xx status:',
  //           error.response.status,
  //         );
  //         console.log('Response data:', error.response.data);
  //       } else if (error.request) {
  //         // The request was made but no response was received
  //         console.log('No response received:', error.request);
  //       } else {
  //         // Something happened in setting up the request that triggered an Error
  //         console.log('Error setting up the request:', error.message);
  //       }
  //       // Throw the error again to propagate it to the caller
  //       throw error;
  //     });
};
const signUp = async (
  fullName: string,
  dob: string,
  campusId: string,
  email: string,
): Promise<any> => {
  // return new Promise(resolve => {
  //   setTimeout(() => {
  //     resolve({
  //       Response,
  //     });
  //   }, 1000);
  // });

  return axios
    .post(
      `${globalConfig.apiBaseUrl}/v1/registerUser`,
      {
        birthdate: dob,
        campusId: campusId,
        emailId: email,
        userName: fullName,
      },
      {
        headers: {
          SessionKey: 'token',
        },
      },
    )
    .then(response => {
      return response;
    })
    .catch(error => {
      const {code} = error.response.data.error;
      if (error.response) {
        // The request was made and the server responded with a status code
        console.log(
          'Server responded with non-2xx status:',
          error.response.status,
        );
        console.log('Response data:', error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.log('No response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error setting up the request:', error.message);
      }
      // Throw the error again to propagate it to the caller
      throw code;
    });
};

const signOut = async () => {
  // return new Promise(resolve => {
  //   setTimeout(() => {
  //     resolve({
  //       Response,
  //     });
  //   }, 1000);
  // });

  return axios
    .delete(`${globalConfig.apiBaseUrl}/v1/logout`, {
      headers: {
        SessionKey: 'token',
      },
    })
    .then(response => {
      return response;
    })
    .catch(error => {
      if (error.response) {
        // The request was made and the server responded with a status code
        console.log(
          'Server responded with non-2xx status:',
          error.response.status,
        );
        console.log('Response data:', error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.log('No response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error setting up the request:', error.message);
      }
      // Throw the error again to propagate it to the caller
      throw error;
    });
};

export const authService = {
  verifyOtp,
  sendOtp,
  signUp,
  signOut,
};

const JWTTokenMock =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic3VwZXItdXNlciIsImNhbXB1cyI6IklJTVUtMzEzMDAxIiwibW9iaWxlIjoiOTE4OTUwNjE5NjkzIiwiaWF0IjoxNzQ2ODgxMDQ0LCJleHAiOjE3Nzg0MTcwNDR9.n6VOOpXWTMFF3c9lUDTJkLHA7EfnMCdt4ds17c1rsEE';
