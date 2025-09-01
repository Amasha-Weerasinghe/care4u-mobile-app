import { BaseEntity } from './common.types';

export interface FoodItem extends BaseEntity {
  name: string;
  category: string;
  calories_per_100g: number;
  is_veg: boolean;
  created_by: number;
}

export interface CalorieGoals {
  calorie_intake_goal: number;
  calorie_burn_goal: number;
}

export interface MealTemplate extends BaseEntity {
  user_id: number;
  name: string;
  meal_type: string;
  total_calories: number;
  items: MealTemplateItem[];
}

export interface MealTemplateItem {
  id: number;
  template_id: number;
  food_item_id: number;
  quantity_grams: number;
  food_name: string;
  calories: number;
}

export interface MealRecord extends BaseEntity {
  user_id: number;
  meal_type: string;
  total_calories: number;
  meal_date: string;
  items: MealRecordItem[];
}

export interface MealRecordItem {
  id: number;
  meal_record_id: number;
  food_item_id: number;
  quantity_grams: number;
  food_name: string;
  calories: number;
}

export interface CreateFoodItemRequest {
  name: string;
  category: string;
  calories_per_100g: number;
  is_veg: boolean;
}

export interface CreateMealTemplateRequest {
  name: string;
  meal_type: string;
  items: {
    food_item_id: number;
    quantity_grams: number;
  }[];
}

export interface CreateMealRecordRequest {
  meal_type: string;
  meal_date: string;
  items: {
    food_item_id: number;
    quantity_grams: number;
  }[];
}

export interface UpdateCalorieGoalsRequest {
  calorie_intake_goal: number;
  calorie_burn_goal: number;
}
