import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { getAuthToken } from '../utils/auth';

// Get the API URL from environment or use default
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://10.0.2.2:3000/api'; // Use 10.0.2.2 for Android emulator
console.log('API URL:', API_URL);

// Create axios instance with base configuration
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 30000, // 30 seconds for AI requests
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            const token = await getAuthToken();
            console.log('Making API request:', {
                url: config.url,
                method: config.method,
                baseURL: config.baseURL,
                fullUrl: `${config.baseURL}${config.url}`,
                hasToken: !!token,
                headers: config.headers,
                timeout: config.timeout
            });

            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            // Set longer timeout for AI assistance endpoint
            if (config.url?.includes('/ai-assist')) {
                config.timeout = 30000; // 30 seconds for AI requests
            }

            return config;
        } catch (error) {
            console.error('Request interceptor error:', error);
            return Promise.reject(error);
        }
    },
    (error: AxiosError) => {
        console.error('Request interceptor rejection:', {
            message: error.message,
            code: error.code,
            config: error.config
        });
        return Promise.reject(error);
    }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
    (response: AxiosResponse) => {
        console.log(`API Response [${response.config.method?.toUpperCase()}] ${response.config.url}:`, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data
        });
        return response;
    },
    (error: AxiosError) => {
        // Log detailed error information
        console.error('API Error Details:', {
            url: error.config?.url,
            method: error.config?.method,
            baseURL: error.config?.baseURL,
            fullUrl: `${error.config?.baseURL}${error.config?.url}`,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
            code: error.code,
            headers: error.config?.headers,
            isAxiosError: error.isAxiosError,
            stack: error.stack
        });

        // Handle specific error cases
        if (error.code === 'ECONNABORTED') {
            return Promise.reject({
                message: 'Request timed out. The AI service is taking longer than expected. Please try again.',
                isTimeout: true
            });
        }

        if (!error.response) {
            // Network error (no response received)
            return Promise.reject({
                message: 'Network error: Unable to connect to the server. Please check your internet connection and try again.',
                isNetworkError: true
            });
        }

        if (error.response.status === 401) {
            console.error('Unauthorized access - token may be invalid or expired');
            return Promise.reject({
                message: 'Authentication error: Please sign in again.',
                isAuthError: true
            });
        }
        // Handle other error cases
        const errorMessage = (error.response?.data as { error?: string; message?: string })?.error ||
            (error.response?.data as { error?: string; message?: string })?.message ||
            error.message ||
            'An unexpected error occurred';

        return Promise.reject({
            message: errorMessage,
            status: error.response?.status,
            data: error.response?.data
        });
    }
);

export { api }; 