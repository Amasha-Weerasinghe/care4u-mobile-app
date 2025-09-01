// API Configuration
export const API_BASE_URL = 'https://choice-reliably-mullet.ngrok-free.app';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/auth/login',
  VERIFY_OTP: '/api/auth/verify-otp',
  COMPLETE_PROFILE: '/api/auth/complete-profile',
  UPDATE_PROFILE: '/api/auth/update-profile',
  GET_USER: '/api/auth/user',
  CHECK_AUTH: '/api/auth/check-auth',
  
  // Health check
  HEALTH: '/health',
  
  // Meal System
  FOOD_ITEMS: '/api/meals/food-items',
  FOOD_CATEGORIES: '/api/meals/food-categories',
  USER_FOOD_ITEMS: '/api/meals/user-food-items',
  CALORIE_GOALS: '/api/meals/calorie-goals',
  MEAL_TEMPLATES: '/api/meals/templates',
  MEAL_RECORDS: '/api/meals/records',
  TODAY_SUMMARY: '/api/meals/today-summary',
  MEAL_RECOMMENDATIONS: '/api/meal-recommendations',
  
  // Sugar System
  SUGAR_RECORDS: '/api/sugar',
  SUGAR_SUMMARY: '/api/sugar/summary',
  SUGAR_TODAY_SUMMARY: '/api/sugar/today-summary',
  
  // Exercise System
  EXERCISE_CREATE: '/api/exercise/create',
  EXERCISE_TODAY_SUMMARY: '/api/exercise/today-summary',
  EXERCISE_DAILY_SUMMARY: '/api/exercise/daily-summary',
  EXERCISE_HISTORY: '/api/exercise/history',
  EXERCISE_UPDATE: '/api/exercise/update',
  EXERCISE_DELETE: '/api/exercise',
  EXERCISE_ACTIVITY_TYPES: '/api/exercise/activity-types',
  
  // Appointment System
  APPOINTMENTS: '/api/appointments',
  APPOINTMENT_BY_ID: '/api/appointments/:id',
  APPOINTMENTS_BY_DATE: '/api/appointments/date/:date',
  APPOINTMENTS_UPCOMING: '/api/appointments/upcoming',
  APPOINTMENTS_PAST: '/api/appointments/past',
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'Care4U',
  VERSION: '1.0.0',
  OTP_EXPIRY_MINUTES: 10,
  TOKEN_EXPIRY_DAYS: 360,
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  IS_FIRST_TIME: 'is_first_time',
};



