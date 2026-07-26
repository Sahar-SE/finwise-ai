import axios from 'axios';

function resolveApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!configured) return '';

  const localHosts = ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://0.0.0.0:8000'];
  if (localHosts.includes(configured)) return '';

  return configured;
}

const API_BASE_URL = resolveApiBaseUrl();

const client = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
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
