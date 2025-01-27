import axios from 'axios';
import { Campus } from '../utils/canonicalModel';
import { fetchToken } from '../utils/KeychainStore/keychainUtil';
import globalConfig from '../utils/GlobalConfig';

export const fetchCampusIds = async (): Promise<Campus[]> => {
  const token = await fetchToken();
  return axios
    .get(`${globalConfig.apiBaseUrl}/v1/campus`, {
      headers: {
        Authorization: token,
      },
    })
    .then((response: { data: any; }) => {
      const data = response.data;
      return data.campuses.campus.map((campus: Campus) => ({
        ...campus,
        vendors: campus.vendors, // Keep vendors as is, allowing undefined
      }));
    })
    .catch(error => {
      const { code } = error.response.data.error;
      if (error.response) {
        console.log(
          'Server responded with non-2xx status:',
          error.response.status,
        );
        console.log('Response data:', error.response.data);
      } else if (error.request) {
        console.log('No response received:', error.request);
      } else {
        console.log('Error setting up the request:', error.message);
      }
      throw code;
    });
};
