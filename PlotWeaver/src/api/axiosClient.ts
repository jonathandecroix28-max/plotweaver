import axios from 'axios';

function getDeviceId(): string {
  let deviceId = localStorage.getItem('plotweaver_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('plotweaver_device_id', deviceId);
  }
  return deviceId;
}

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    config.headers['X-Device-ID'] = getDeviceId();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.message || 'Une erreur est survenue';
    console.error('API Error:', errorMessage);
    return Promise.reject(error);
  }
);

export default axiosClient;