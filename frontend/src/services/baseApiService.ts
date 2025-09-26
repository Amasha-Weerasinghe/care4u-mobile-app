import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, STORAGE_KEYS } from '../constants/config';
import { Alert } from 'react-native';
import authService from './authService';

export class BaseApiService {
  protected api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        // Handle token expiration
        if (error.response?.status === 401) {
          await this.handleTokenExpiration();
        }
        return Promise.reject(error);
      }
    );
  }

  // Handle token expiration
  private async handleTokenExpiration(): Promise<void> {
    try {
      // Use AuthService to handle expiration
      await authService.logout();

      // Show user-friendly message
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please log in again.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to login screen
              // Note: You'll need to implement navigation logic here
              console.log('Redirecting to login...');
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error handling token expiration:', error);
    }
  }

  // Generic CRUD methods
  protected async get<T>(endpoint: string, params?: any): Promise<T> {
    const response = await this.api.get(endpoint, { params });
    return response.data;
  }

  protected async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.api.post(endpoint, data);
    return response.data;
  }

  protected async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.api.put(endpoint, data);
    return response.data;
  }

  protected async delete<T>(endpoint: string): Promise<T> {
    const response = await this.api.delete(endpoint);
    return response.data;
  }
}
