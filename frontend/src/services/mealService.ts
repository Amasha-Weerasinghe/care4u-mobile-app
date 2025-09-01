import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/config';
import {
  GetFoodItemsResponse,
  GetFoodCategoriesResponse,
  GetCalorieGoalsResponse,
  UpdateCalorieGoalsRequest,
  CreateMealTemplateRequest,
  GetMealTemplatesResponse,
  CreateMealRecordRequest,
  GetMealRecordsResponse,
  GetTodaySummaryResponse,
} from '../types';

class MealService {
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

  // Food Items APIs
  async getFoodItems(search?: string, category?: string): Promise<GetFoodItemsResponse> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);

    const response = await this.api.get(`${API_ENDPOINTS.FOOD_ITEMS}?${params.toString()}`);
    return response.data;
  }

  async getFoodCategories(): Promise<GetFoodCategoriesResponse> {
    const response = await this.api.get(API_ENDPOINTS.FOOD_CATEGORIES);
    return response.data;
  }

  // Get user's food items
  async getUserFoodItems(): Promise<any> {
    const response = await this.api.get(API_ENDPOINTS.USER_FOOD_ITEMS);
    return response.data;
  }

  // Calorie Goals APIs
  async getCalorieGoals(): Promise<GetCalorieGoalsResponse> {
    const response = await this.api.get(API_ENDPOINTS.CALORIE_GOALS);
    return response.data;
  }

  async updateCalorieGoals(data: UpdateCalorieGoalsRequest): Promise<any> {
    const response = await this.api.put(API_ENDPOINTS.CALORIE_GOALS, data);
    return response.data;
  }

  // Meal Templates APIs
  async createMealTemplate(data: CreateMealTemplateRequest): Promise<any> {
    const response = await this.api.post(API_ENDPOINTS.MEAL_TEMPLATES, data);
    return response.data;
  }

  async getMealTemplates(mealType?: string): Promise<GetMealTemplatesResponse> {
    const params = mealType ? `?meal_type=${mealType}` : '';
    const response = await this.api.get(`${API_ENDPOINTS.MEAL_TEMPLATES}${params}`);
    return response.data;
  }

  async deleteMealTemplate(id: number): Promise<any> {
    const response = await this.api.delete(`${API_ENDPOINTS.MEAL_TEMPLATES}/${id}`);
    return response.data;
  }

  // Meal Records APIs
  async createMealRecord(data: CreateMealRecordRequest): Promise<any> {
    const response = await this.api.post(API_ENDPOINTS.MEAL_RECORDS, data);
    return response.data;
  }

  async getMealRecords(mealDate?: string, mealType?: string): Promise<GetMealRecordsResponse> {
    const params = new URLSearchParams();
    if (mealDate) params.append('meal_date', mealDate);
    if (mealType) params.append('meal_type', mealType);

    const response = await this.api.get(`${API_ENDPOINTS.MEAL_RECORDS}?${params.toString()}`);
    return response.data;
  }

  async deleteMealRecord(id: number): Promise<any> {
    const response = await this.api.delete(`${API_ENDPOINTS.MEAL_RECORDS}/${id}`);
    return response.data;
  }

  async deleteMealRecordsByDateAndType(mealDate: string, mealType: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('meal_date', mealDate);
    params.append('meal_type', mealType);

    const response = await this.api.delete(`${API_ENDPOINTS.MEAL_RECORDS}?${params.toString()}`);
    return response.data;
  }

  // Create Food Item API
  async createFoodItem(data: {
    name: string;
    category: string;
    calories_per_100g: number;
    is_veg: boolean;
  }): Promise<any> {
    const response = await this.api.post(API_ENDPOINTS.FOOD_ITEMS, data);
    return response.data;
  }

  // Update Food Item API
  async updateFoodItem(id: number, data: {
    name: string;
    category: string;
    calories_per_100g: number;
    is_veg: boolean;
  }): Promise<any> {
    const response = await this.api.put(`${API_ENDPOINTS.FOOD_ITEMS}/${id}`, data);
    return response.data;
  }

  // Delete Food Item API
  async deleteFoodItem(id: number): Promise<any> {
    const response = await this.api.delete(`${API_ENDPOINTS.FOOD_ITEMS}/${id}`);
    return response.data;
  }

  // Today's Summary API
  async getTodaySummary(): Promise<GetTodaySummaryResponse> {
    const response = await this.api.get(API_ENDPOINTS.TODAY_SUMMARY);
    return response.data;
  }

  // Meal Recommendations API
  async getMealRecommendations(mealType?: string, limit: number = 1): Promise<{
    success: boolean;
    recommendations: Array<{
      meal_id: string;
      meal_type: string;
      meal: string;
      calories: number;
      is_veg: boolean;
    }>;
  }> {
    const params = new URLSearchParams();
    if (mealType) params.append('meal_type', mealType);
    if (limit) params.append('limit', limit.toString());
    
    const response = await this.api.get(`${API_ENDPOINTS.MEAL_RECOMMENDATIONS}?${params.toString()}`);
    return response.data;
  }
}

export default new MealService();
