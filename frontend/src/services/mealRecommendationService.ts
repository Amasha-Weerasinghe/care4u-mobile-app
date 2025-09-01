import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

export interface MealRecommendation {
  meal_id: number;
  meal_type: string;
  meal: string;
  calories: number;
  is_veg: boolean;
}

export interface MealRecommendationsResponse {
  success: boolean;
  recommendations: MealRecommendation[];
}

export interface AllMealRecommendationsResponse {
  success: boolean;
  recommendations: {
    breakfast: MealRecommendation[];
    lunch: MealRecommendation[];
    dinner: MealRecommendation[];
  };
}

export interface WeeklyMealRecommendation {
  day: string;
  date: string;
  breakfast: MealRecommendation[];
  lunch: MealRecommendation[];
  dinner: MealRecommendation[];
  totalCalories: number;
}

export interface WeeklyMealRecommendationsResponse {
  success: boolean;
  data: WeeklyMealRecommendation[];
  user_preference: string;
}

class MealRecommendationService {
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
      (response) => response,
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

  // Get meal recommendations for a specific meal type
  async getMealRecommendations(
    mealType?: string,
    limit: number = 1
  ): Promise<MealRecommendationsResponse> {
    const params = new URLSearchParams();
    if (mealType) params.append('meal_type', mealType);
    if (limit) params.append('limit', limit.toString());

    const response = await this.api.get(`/api/meal-recommendations?${params.toString()}`);
    return response.data;
  }

  // Get weekly meal recommendations (7 days)
  async getWeeklyMealRecommendations(
    limitPerMeal: number = 1
  ): Promise<WeeklyMealRecommendationsResponse> {
    const params = new URLSearchParams();
    if (limitPerMeal) params.append('limit_per_meal', limitPerMeal.toString());

    const response = await this.api.get(`/api/meal-recommendations/weekly?${params.toString()}`);
    return response.data;
  }

  // Get meal recommendations for all meal types
  async getAllMealRecommendations(
    limitPerType: number = 1
  ): Promise<AllMealRecommendationsResponse> {
    try {
      const [breakfastRes, lunchRes, dinnerRes] = await Promise.all([
        this.getMealRecommendations('breakfast', limitPerType),
        this.getMealRecommendations('lunch', limitPerType),
        this.getMealRecommendations('dinner', limitPerType)
      ]);

      return {
        success: true,
        recommendations: {
          breakfast: breakfastRes.recommendations || [],
          lunch: lunchRes.recommendations || [],
          dinner: dinnerRes.recommendations || []
        }
      };
    } catch (error) {
      console.error('Error getting all meal recommendations:', error);
      throw error;
    }
  }

  // Get meal recommendations for breakfast
  async getBreakfastRecommendations(limit: number = 1): Promise<MealRecommendationsResponse> {
    return this.getMealRecommendations('breakfast', limit);
  }

  // Get meal recommendations for lunch
  async getLunchRecommendations(limit: number = 1): Promise<MealRecommendationsResponse> {
    return this.getMealRecommendations('lunch', limit);
  }

  // Get meal recommendations for dinner
  async getDinnerRecommendations(limit: number = 1): Promise<MealRecommendationsResponse> {
    return this.getMealRecommendations('dinner', limit);
  }
}

export default new MealRecommendationService();
