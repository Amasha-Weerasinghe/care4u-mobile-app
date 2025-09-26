import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { API_BASE_URL } from '../constants/config';
import tokenManager from '../utils/tokenManager';

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
        const token = await tokenManager.getAuthToken();
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
      // Use TokenManager to handle expiration
      await tokenManager.handleTokenExpiration();
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
