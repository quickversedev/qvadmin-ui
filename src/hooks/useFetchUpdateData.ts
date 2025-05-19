// src/hooks/useFetchUpdateData.js
import {useState, useEffect} from 'react';
import axios from 'axios';
import globalConfig from '../utils/global/globalConfig';

const useFetchUpdateData = () => {
  const [updateData, setUpdateData] = useState({
    admin_min_required_version: '',
    admin_ios_url: '',
    admin_android_url: '',
    admin_latest_version: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0); // Track retry attempts

  const fetchUpdateData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${globalConfig.apiBaseUrl}/v1/initialConfig`,
        {
          headers: {
            Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
          },
        },
      ); // Replace with your API endpoint
      // const response = {
      //   data: {
      //     minVersion: '1',
      //     appStoreURL: 'http://www.google.com',
      //     playStoreURL: 'http://www.facebook.com',
      //     latestVersion: '4',
      //   },
      // };
      setUpdateData({
        admin_min_required_version: response.data.minVersionAdmin,
        admin_ios_url: response.data.adminAppStoreURL,
        admin_android_url: response.data.adminPlayStoreURL,
        admin_latest_version: response.data.latestVersionAdmin,
      });
    } catch (err) {
      setError(err);
      console.error('Error fetching update data:', err);
    } finally {
      setLoading(false);
    }
  };

  const retry = () => {
    setRetryCount(prev => prev + 1); // Increment retry count
  };

  useEffect(() => {
    fetchUpdateData();
  }, [retryCount]); // Refetch data when retryCount changes

  return {updateData, loading, error, retry};
};

export default useFetchUpdateData;
