import { MealModel } from '../models/mealModel';
import { FoodItem, CalorieGoals, MealTemplate, MealRecord } from '../types/meal.types';
import { isValidDate, getCurrentDate } from '../utils/timeUtils';

export class MealService {
  // Get all food items with optional search and category filters
  static async getFoodItems(search?: string, category?: string): Promise<FoodItem[]> {
    return await MealModel.getFoodItems(search, category);
  }

  // Get all available food categories
  static async getFoodCategories(): Promise<string[]> {
    return await MealModel.getFoodCategories();
  }

  // Get food items created by a specific user
  static async getUserFoodItems(userId: number): Promise<FoodItem[]> {
    return await MealModel.getUserFoodItems(userId);
  }

  // Create a new food item for a user
  static async createFoodItem(data: {
    name: string;
    category: string;
    calories_per_100g: number;
    is_veg: boolean;
    created_by: number;
  }): Promise<FoodItem> {
    // Check for duplicates , only within user's own items
    const exists = await MealModel.checkFoodItemExists(data.name, data.category, data.created_by);
    if (exists) {
      throw new Error('Food item with this name and category already exists');
    }

    return await MealModel.createFoodItem(data);
  }

  // Update an existing food item
  static async updateFoodItem(id: number, data: {
    name: string;
    category: string;
    calories_per_100g: number;
    is_veg: boolean;
    updated_by: number;
  }): Promise<FoodItem> {
    // Check if item exists and user owns it
    const existingItem = await MealModel.getFoodItemById(id);
    if (!existingItem) {
      throw new Error('Food item not found');
    }

    // Check for duplicates , excluding current item, only within user's own items
    const exists = await MealModel.checkFoodItemExistsExcludingId(data.name, data.category, id, data.updated_by);
    if (exists) {
      throw new Error('Food item with this name and category already exists');
    }

    return await MealModel.updateFoodItem(id, data);
  }

  // Delete a food item owned by a user
  static async deleteFoodItem(id: number, userId: number): Promise<void> {
    // Check if item exists and user owns it
    const existingItem = await MealModel.getFoodItemById(id);
    if (!existingItem) {
      throw new Error('Food item not found');
    }

    if (existingItem.created_by !== userId) {
      throw new Error('You can only delete your own food items');
    }

    await MealModel.deleteFoodItem(id);
  }

  // Get calorie goals for a user
  static async getCalorieGoals(userId: number): Promise<CalorieGoals | null> {
    return await MealModel.getCalorieGoals(userId);
  }

  // Update calorie goals for a user
  static async updateCalorieGoals(userId: number, data: {
    calorie_intake_goal: number;
    calorie_burn_goal: number;
  }): Promise<CalorieGoals> {
    //  Validate calorie goals
    if (data.calorie_intake_goal <= 0 || data.calorie_burn_goal <= 0) {
      throw new Error('Calorie goals must be positive numbers');
    }

    if (data.calorie_intake_goal > 10000 || data.calorie_burn_goal > 10000) {
      throw new Error('Calorie goals cannot exceed 10,000');
    }

    return await MealModel.updateCalorieGoals(userId, data);
  }

  // Create a new meal template for a user
  static async createMealTemplate(data: {
    user_id: number;
    name: string;
    meal_type: string;
    items: Array<{
      food_item_id: number;
      quantity_grams: number;
    }>;
  }): Promise<MealTemplate> {
    // Calculate total calories
    let totalCalories = 0;
    const templateItems = [];

    for (const item of data.items) {
      const calories = await MealModel.calculateCaloriesForItem(item.food_item_id, item.quantity_grams);
      totalCalories += calories;
      templateItems.push({
        food_item_id: item.food_item_id,
        quantity_grams: item.quantity_grams,
        calories
      });
    }

    // Create template
    const template = await MealModel.createMealTemplate({
      user_id: data.user_id,
      name: data.name,
      meal_type: data.meal_type,
      total_calories: totalCalories
    });

    // Add template items
    await MealModel.addMealTemplateItems(template.id, templateItems);

    return {
      ...template,
      items: templateItems.map(item => ({
        id: 0, 
        template_id: template.id,
        food_item_id: item.food_item_id,
        food_name: '',
        quantity_grams: item.quantity_grams,
        calories: item.calories
      }))
    };
  }

  // Get meal templates for a user with meal type filter
  static async getMealTemplates(userId: number, mealType?: string): Promise<MealTemplate[]> {
    return await MealModel.getMealTemplates(userId, mealType);
  }

  // Delete a meal template owned by a user
  static async deleteMealTemplate(id: number, userId: number): Promise<void> {
    // Check if template exists and user owns it
    const existingTemplate = await MealModel.getMealTemplateById(id);
    if (!existingTemplate) {
      throw new Error('Meal template not found');
    }

    if (existingTemplate.user_id !== userId) {
      throw new Error('You can only delete your own meal templates');
    }

    await MealModel.deleteMealTemplate(id);
  }

  // Create a new meal record for a user
  static async createMealRecord(data: {
    user_id: number;
    meal_type: string;
    meal_date: string;
    items: Array<{
      food_item_id: number;
      quantity_grams: number;
    }>;
  }): Promise<MealRecord> {
    // Calculate total calories
    let totalCalories = 0;
    const recordItems = [];

    for (const item of data.items) {
      const calories = await MealModel.calculateCaloriesForItem(item.food_item_id, item.quantity_grams);
      totalCalories += calories;
      recordItems.push({
        food_item_id: item.food_item_id,
        quantity_grams: item.quantity_grams,
        calories
      });
    }

    // Create meal record
    const record = await MealModel.createMealRecord({
      user_id: data.user_id,
      meal_type: data.meal_type,
      total_calories: totalCalories,
      meal_date: data.meal_date
    });

    // Add record items
    await MealModel.addMealRecordItems(record.id, recordItems);

    return {
      ...record,
      items: recordItems.map(item => ({
        id: 0, 
        meal_record_id: record.id,
        food_item_id: item.food_item_id,
        food_name: '', 
        quantity_grams: item.quantity_grams,
        calories: item.calories
      }))
    };
  }

  // Get meal records for a user with optional filters
  static async getMealRecords(userId: number, mealDate?: string, mealType?: string): Promise<MealRecord[]> {
    return await MealModel.getMealRecords(userId, mealDate, mealType);
  }

  // Delete a meal record owned by a user
  static async deleteMealRecord(id: number, userId: number): Promise<boolean> {
    // Check if record exists and user owns it
    const existingRecord = await MealModel.getMealRecordById(id);
    if (!existingRecord) {
      return false;
    }

    if (existingRecord.user_id !== userId) {
      return false;
    }

    await MealModel.deleteMealRecord(id);
    return true;
  }

  // Delete meal records by date and type for a user
  static async deleteMealRecordsByDateAndType(userId: number, mealDate: string, mealType: string): Promise<number> {

    if (!mealDate || !mealType) {
      throw new Error('Meal date and meal type are required');
    }

    if (!isValidDate(mealDate)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!validMealTypes.includes(mealType)) {
      throw new Error('Invalid meal type');
    }

    const deletedCount = await MealModel.deleteMealRecordsByDateAndType(userId, mealDate, mealType);
    return deletedCount;
  }

  // Calculate calorie status based on meal calories and goal
  static calculateCalorieStatus(mealCalories: number, mealTypeGoal: number): {
    status: 'ideal' | 'about_to_exceed' | 'exceeding';
    message: string;
  } {
    const percentage = (mealCalories / mealTypeGoal) * 100;
    
    if (percentage <= 80) {
      return { 
        status: 'ideal', 
        message: 'Calorie intake is within ideal range' 
      };
    } else if (percentage <= 100) {
      return { 
        status: 'about_to_exceed', 
        message: 'Calorie intake is approaching the limit' 
      };
    } else {
      return { 
        status: 'exceeding', 
        message: 'Calorie intake exceeds the recommended limit' 
      };
    }
  }

  // Get calorie status for a user's meal
  static async getMealCalorieStatus(userId: number, mealCalories: number): Promise<{
    status: 'ideal' | 'about_to_exceed' | 'exceeding';
    message: string;
  }> {
    const user = await MealModel.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const dailyCalorieGoal = user.calorie_intake_goal || 2000; 
    const mealTypeGoal = dailyCalorieGoal / 4; // Distribute daily goal across meals

    return this.calculateCalorieStatus(mealCalories, mealTypeGoal);
  }

  // Get today's meal summary for a user
  static async getTodaySummary(userId: number): Promise<{
    totalCalories: number;
    totalMeals: number;
    calorieGoal: number;
    remainingCalories: number;
    progressPercentage: number;
    meals: Array<{
      id: number;
      meal_type: string;
      total_calories: number;
      created_at: Date;
    }>;
  }> {
    // Get user's calorie goals
    const calorieGoals = await MealModel.getCalorieGoals(userId);
    const calorieGoal = calorieGoals?.calorie_intake_goal || 2000; 

    // Get today's date in YYYY-MM-DD format 
    const todayString = getCurrentDate();

    // Get today's meal records
    const todayMeals = await MealModel.getMealRecords(userId, todayString);

    // Calculate totals
    const totalCalories = todayMeals.reduce((sum, meal) => sum + meal.total_calories, 0);
    const totalMeals = todayMeals.length;
    const remainingCalories = Math.max(0, calorieGoal - totalCalories);
    const progressPercentage = Math.min(100, (totalCalories / calorieGoal) * 100);
 
    const meals = todayMeals.map(meal => ({
      id: meal.id,
      meal_type: meal.meal_type,
      total_calories: meal.total_calories,
      created_at: meal.created_at
    }));

    return {
      totalCalories,
      totalMeals,
      calorieGoal,
      remainingCalories,
      progressPercentage: Math.round(progressPercentage * 100) / 100, 
      meals
    };
  }

}
