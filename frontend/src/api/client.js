import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('finwise_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('finwise_token');
      localStorage.removeItem('finwise_user');
    }
    return Promise.reject(err);
  }
);

export default client;
export { API_BASE_URL };
