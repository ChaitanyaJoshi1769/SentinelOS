import axios, { AxiosInstance, AxiosError } from 'axios';
import { createLogger } from './logger';

const logger = createLogger('axios');

/**
 * Initialize axios with default configuration and interceptors
 */
export function initializeAxios(): AxiosInstance {
  // Set default base URL (empty string for same-origin requests)
  axios.defaults.baseURL = '';
  axios.defaults.timeout = 30000;
  axios.defaults.headers.common['Content-Type'] = 'application/json';

  // Get token from localStorage and add to requests
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      logger.debug(`${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      logger.error('Request setup error', error);
      return Promise.reject(error);
    }
  );

  // Handle responses and errors
  axios.interceptors.response.use(
    (response) => {
      logger.debug(`${response.status} ${response.config.url}`);
      return response;
    },
    (error: AxiosError) => {
      const status = error.response?.status;
      const message = (error.response?.data as any)?.error || error.message;

      logger.error(`${status} ${error.config?.url}`, error);

      // Handle specific error cases
      if (status === 401) {
        // Unauthorized - clear auth token
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');

        // Redirect to login if not already there
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }

      if (status === 403) {
        logger.warn('Access forbidden', { url: error.config?.url });
      }

      if (status === 404) {
        logger.warn('Resource not found', { url: error.config?.url });
      }

      if (status === 500) {
        logger.error('Server error', { url: error.config?.url });
      }

      return Promise.reject(error);
    }
  );

  return axios;
}

/**
 * Create axios instance with proper configuration
 * This should be called once when the app initializes
 */
export const axiosInstance = initializeAxios();
