import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/config';

// Types
export interface ExerciseActivity {
  id: number;
  user_id: number;
  activity_type: string;
  duration_seconds: number; 
  calories_burned: number;
  notes?: string;
  activity_date: string;
  created_at: string;
  updated_at: string;
}

export interface ExerciseSummary {
  totalActivities: number;
  totalDuration: number; 
  totalCaloriesBurned: number;
  activities: ExerciseActivity[];
}

export interface CreateExerciseRequest {
  activity_type: string;
  duration_seconds: number; 
  calories_burned: number;
  notes?: string;
  activity_date?: string; 
}

export interface UpdateExerciseRequest {
  activity_type?: string;
  duration_seconds?: number; 
  calories_burned?: number;
  notes?: string;
}

export interface GetExerciseHistoryRequest {
  date?: string;
  activity_type?: string;
}

// Exercise Service
class ExerciseService {
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

  // Create new exercise activity
  async createExercise(data: CreateExerciseRequest): Promise<{ activity: ExerciseActivity }> {
    const response = await this.api.post(API_ENDPOINTS.EXERCISE_CREATE, data);
    return response.data;
  }

  // Get today's exercise summary
  async getTodayExerciseSummary(): Promise<{ summary: ExerciseSummary }> {
    const response = await this.api.get(API_ENDPOINTS.EXERCISE_TODAY_SUMMARY);
    return response.data;
  }

  // Get daily exercise summary for a specific date
  async getDailyExerciseSummary(date: string): Promise<{ summary: ExerciseSummary }> {
    const response = await this.api.get(`${API_ENDPOINTS.EXERCISE_DAILY_SUMMARY}/${date}`);
    return response.data;
  }

  // Get exercise history
  async getExerciseHistory(params: GetExerciseHistoryRequest = {}): Promise<{ activities: ExerciseActivity[] }> {
    const response = await this.api.get(API_ENDPOINTS.EXERCISE_HISTORY, { params });
    return response.data;
  }

  // Update exercise activity
  async updateExercise(id: number, data: UpdateExerciseRequest): Promise<{ activity: ExerciseActivity }> {
    const response = await this.api.put(`${API_ENDPOINTS.EXERCISE_UPDATE}/${id}`, data);
    return response.data;
  }

  // Delete exercise activity
  async deleteExercise(id: number): Promise<{ message: string }> {
    const response = await this.api.delete(`${API_ENDPOINTS.EXERCISE_DELETE}/${id}`);
    return response.data;
  }

  // Delete exercise activities by date and type
  async deleteExerciseActivitiesByDateAndType(activityDate: string, activityType: string): Promise<{ message: string; deletedCount: number }> {
    const params = new URLSearchParams();
    params.append('activity_date', activityDate);
    params.append('activity_type', activityType);

    const response = await this.api.delete(`${API_ENDPOINTS.EXERCISE_DELETE}?${params.toString()}`);
    return response.data;
  }

  // Get available activity types
  async getActivityTypes(): Promise<{ activity_types: string[] }> {
    const response = await this.api.get(API_ENDPOINTS.EXERCISE_ACTIVITY_TYPES);
    return response.data;
  }
}

export default new ExerciseService();
