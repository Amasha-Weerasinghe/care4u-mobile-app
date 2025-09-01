import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/config';

export interface SugarRecord {
  id: number;
  user_id: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  blood_sugar_value: number;
  record_date: string;
  created_at: string;
  updated_at: string;
  status?: {
    status: 'normal' | 'elevated' | 'high' | 'very_high' | 'low' | 'very_low';
    message: string;
    color: string;
  };
}

export interface SugarSummary {
  totalRecords: number;
  averageBloodSugar: number;
  records: SugarRecord[];
  date?: string;
}

export interface CreateSugarRecordRequest {
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  blood_sugar_value: number;
  record_date: string;
}

export interface UpdateSugarRecordRequest {
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  blood_sugar_value: number;
  record_date: string;
}

class SugarService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
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
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          AsyncStorage.removeItem('auth_token');
          AsyncStorage.removeItem('user_data');
        }
        return Promise.reject(error);
      }
    );
  }

  // Create sugar record
  async createSugarRecord(data: CreateSugarRecordRequest): Promise<{ success: boolean; record: SugarRecord; message: string }> {
    const response = await this.api.post(API_ENDPOINTS.SUGAR_RECORDS, data);
    return response.data;
  }

  // Get sugar records
  async getSugarRecords(recordDate?: string, mealType?: string): Promise<{ success: boolean; records: SugarRecord[] }> {
    const params: any = {};
    if (recordDate) params.record_date = recordDate;
    if (mealType) params.meal_type = mealType;

    const response = await this.api.get(API_ENDPOINTS.SUGAR_RECORDS, { params });
    return response.data;
  }

  // Get sugar summary
  async getSugarSummary(recordDate?: string): Promise<{ success: boolean; summary: SugarSummary }> {
    const params: any = {};
    if (recordDate) params.record_date = recordDate;

    const response = await this.api.get(API_ENDPOINTS.SUGAR_SUMMARY, { params });
    return response.data;
  }

  // Get today's sugar summary
  async getTodaySugarSummary(): Promise<{ success: boolean; summary: SugarSummary }> {
    const response = await this.api.get(API_ENDPOINTS.SUGAR_TODAY_SUMMARY);
    return response.data;
  }

  // Update sugar record
  async updateSugarRecord(id: number, data: UpdateSugarRecordRequest): Promise<{ success: boolean; record: SugarRecord; message: string }> {
    const response = await this.api.put(`${API_ENDPOINTS.SUGAR_RECORDS}/${id}`, data);
    return response.data;
  }

  // Delete sugar record
  async deleteSugarRecord(id: number): Promise<{ success: boolean; message: string }> {
    const response = await this.api.delete(`${API_ENDPOINTS.SUGAR_RECORDS}/${id}`);
    return response.data;
  }

  // Delete sugar records by date and type
  async deleteSugarRecordsByDateAndType(recordDate: string, mealType: string): Promise<{ success: boolean; deletedCount: number; message: string }> {
    const params = new URLSearchParams();
    params.append('record_date', recordDate);
    params.append('meal_type', mealType);

    const response = await this.api.delete(`${API_ENDPOINTS.SUGAR_RECORDS}?${params.toString()}`);
    return response.data;
  }
}

export default new SugarService();
