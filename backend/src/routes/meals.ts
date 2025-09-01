import express from 'express';
import { MealController } from '../controllers/mealController';
import { authenticateToken } from '../middleware/auth';
import {
  foodItemValidation,
  calorieGoalsValidation,
  mealTemplateValidation,
  mealRecordValidation
} from '../middleware/mealValidation';

const router = express.Router();

// Get all food items with search functionality
router.get('/food-items', authenticateToken, MealController.getFoodItems);

// Get food item categories
router.get('/food-categories', authenticateToken, MealController.getFoodCategories);

// Get user's food items
router.get('/user-food-items', authenticateToken, MealController.getUserFoodItems);

// Create new food item
router.post('/food-items', authenticateToken, foodItemValidation, MealController.createFoodItem);

// Update food item
router.put('/food-items/:id', authenticateToken, foodItemValidation, MealController.updateFoodItem);

// Delete food item
router.delete('/food-items/:id', authenticateToken, MealController.deleteFoodItem);

// Update user calorie goals
router.put('/calorie-goals', authenticateToken, calorieGoalsValidation, MealController.updateCalorieGoals);

// Get user calorie goals
router.get('/calorie-goals', authenticateToken, MealController.getCalorieGoals);

// Create meal template
router.post('/templates', authenticateToken, mealTemplateValidation, MealController.createMealTemplate);

// Get user's meal templates
router.get('/templates', authenticateToken, MealController.getMealTemplates);

// Delete meal template
router.delete('/templates/:id', authenticateToken, MealController.deleteMealTemplate);

// Create meal record
router.post('/records', authenticateToken, mealRecordValidation, MealController.createMealRecord);

// Get user's meal records
router.get('/records', authenticateToken, MealController.getMealRecords);

// Delete meal record by ID
router.delete('/records/:id', authenticateToken, MealController.deleteMealRecord);

// Delete meal records by date and type
router.delete('/records', authenticateToken, MealController.deleteMealRecordsByDateAndType);

// Get today's summary
router.get('/today-summary', authenticateToken, MealController.getTodaySummary);

// Get meal recommendations
router.get('/recommendations', authenticateToken, MealController.getMealRecommendations);

export default router;
