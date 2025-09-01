// User Types
export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  dietary_preference?: 'veg' | 'non-veg';
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  emergency_contact_number?: string;
  emergency_contact_name?: string;
  contact_number?: string;
  height?: string;
  weight?: string;
  bmi?: number;
  calorie_intake_goal?: number;
  calorie_burn_goal?: number;
  breakfast_calorie_goal?: number;
  lunch_calorie_goal?: number;
  dinner_calorie_goal?: number;
  snack_calorie_goal?: number;
  is_profile_complete: boolean;
  created_at?: string;
  updated_at?: string;
}

// Authentication Types
export interface LoginRequest {
  email: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  email: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  token: string;
  user?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    isProfileComplete: boolean;
  };
  isNewUser?: boolean;
  redirectTo?: 'home' | 'complete-profile';
}

export interface CompleteProfileRequest {
  first_name: string;
  last_name: string;
  dietary_preference: 'veg' | 'non-veg';
  birth_date: string;
  gender: 'male' | 'female' | 'other';
  emergency_contact_number: string;
  emergency_contact_name: string;
  contact_number: string;
  height: string;
  weight: string;
  bmi: number;
}

export interface CompleteProfileResponse {
  success: boolean;
  message: string;
  token: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    isProfileComplete: boolean;
  };
  redirectTo?: 'home';
}

export interface GetUserResponse {
  success: boolean;
  message: string;
  profile: User;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  OTPVerification: { email: string };
  CompleteProfile: { email: string; token: string };
  MainTabs: undefined;
  Profile: undefined;
  AddMeal: undefined;
  AddMealItem: undefined;
  MealTemplates: undefined;
  MealHistory: undefined;
  MealRecommendation: undefined;
  RecordBloodSugar: undefined;
  SugarHistory: undefined;
  BloodSugarGuidelines: undefined;
  RecordActivity: undefined;
  TrackActivity: { activity: { id: string; name: string; icon: string; color: string } };
  ActivityHistory: undefined;
  Appointment: undefined;
  AppointmentDetails: { appointmentToEdit?: Appointment } | undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Meals: undefined;
  Exercise: undefined;
  Sugar: undefined;
  Analytics: undefined;
};

// Meal System Types
export interface FoodItem {
  id: number;
  name: string;
  calories_per_100g: number;
  category: string;
  is_veg: boolean;
  created_at: string;
  updated_at: string;
}

export interface MealItem {
  food_item_id: number;
  food_name: string;
  quantity_grams: number;
  calories: number;
}

export interface CalorieStatus {
  status: 'ideal' | 'about_to_exceed' | 'exceeding';
  message: string;
}

export interface MealTemplate {
  id: number;
  user_id: number;
  name: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  total_calories: number;
  items: MealItem[];
  created_at: string;
  updated_at: string;
}

export interface MealRecord {
  id: number;
  user_id: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  total_calories: number;
  meal_date: string;
  items: MealItem[];
  calorie_status?: CalorieStatus;
  created_at: string;
  updated_at: string;
}

export interface CalorieGoals {
  calorie_intake_goal: number;
  calorie_burn_goal: number;
}

// Meal API Types
export interface GetFoodItemsResponse {
  success: boolean;
  foodItems: FoodItem[];
}

export interface GetFoodCategoriesResponse {
  success: boolean;
  categories: string[];
}

export interface GetCalorieGoalsResponse {
  success: boolean;
  calorieGoals: CalorieGoals;
}

export interface UpdateCalorieGoalsRequest {
  calorie_intake_goal: number;
  calorie_burn_goal: number;
}

export interface CreateMealTemplateRequest {
  name: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  items: {
    food_item_id: number;
    quantity_grams: number;
  }[];
}

export interface GetMealTemplatesResponse {
  success: boolean;
  templates: MealTemplate[];
}

export interface CreateMealRecordRequest {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_date: string;
  items: {
    food_item_id: number;
    quantity_grams: number;
  }[];
}

export interface GetMealRecordsResponse {
  success: boolean;
  records: MealRecord[];
}

export interface TodaySummary {
  totalCalories: number;
  totalMeals: number;
  calorieGoal: number;
  remainingCalories: number;
  progressPercentage: number;
  meals: Array<{
    id: number;
    meal_type: string;
    total_calories: number;
    created_at: string;
  }>;
}

export interface Appointment {
  id: number;
  title: string;
  date: string;
  time: string;
  location?: string;
  notes?: string;
}

// Meal Recommendation Types
export interface RecommendedMealItem {
  id: number;
  name: string;
  calories: number;
  category: string;
  is_veg: boolean;
}

export interface DayMeals {
  day: string;
  date: string;
  breakfast: RecommendedMealItem[];
  lunch: RecommendedMealItem[];
  dinner: RecommendedMealItem[];
  totalCalories: number;
}

export interface GetMealRecommendationsResponse {
  success: boolean;
  weeklyMeals: DayMeals[];
  dietaryPreference: 'veg' | 'non-veg';
}

export interface GetTodaySummaryResponse {
  success: boolean;
  summary: TodaySummary;
  date: string;
}