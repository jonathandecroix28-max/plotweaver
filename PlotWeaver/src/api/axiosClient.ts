import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Permet de récupérer facilement le message de ResponseStatusException du backend
    const errorMessage = error.response?.data?.message || 'Une erreur est survenue';
    console.error('API Error:', errorMessage);
    return Promise.reject(error);
  }
);

export default axiosClient;