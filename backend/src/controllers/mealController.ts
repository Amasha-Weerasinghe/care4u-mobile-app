import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../types/auth.types';
import { MealService } from '../services/mealService';
import { MealRecommendationService } from '../services/mealRecommendationService';
import { isValidDate, getCurrentDate } from '../utils/timeUtils';

export class MealController {
  /**
   * Gets all food items with optional search and category filters
   * @param req - The authenticated request with optional search and category parameters
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getFoodItems(req: AuthenticatedRequest, res: Response) {
    try {
      const { search, category } = req.query;
      const foodItems = await MealService.getFoodItems(
        search as string, 
        category as string
      );

      res.json({ success: true, foodItems });
    } catch (error) {
      console.error('Get food items error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Gets all available food categories
   * @param req - The authenticated request
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getFoodCategories(req: AuthenticatedRequest, res: Response) {
    try {
      const categories = await MealService.getFoodCategories();
      res.json({ success: true, categories });
    } catch (error) {
      console.error('Get food categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Gets food items created by the authenticated user
   * @param req - The authenticated request
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getUserFoodItems(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const foodItems = await MealService.getUserFoodItems(userId);
      res.json({ success: true, foodItems });
    } catch (error) {
      console.error('Get user food items error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Creates a new food item for the authenticated user
   * @param req - The authenticated request containing food item data
   * @param res - The response object
   * @returns Promise<void>
   */
  static async createFoodItem(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array()
        });
      }

      const { name, category, calories_per_100g, is_veg } = req.body;
      const userId = req.user!.userId;

      const foodItem = await MealService.createFoodItem({
        name,
        category,
        calories_per_100g,
        is_veg,
        created_by: userId
      });

      res.json({
        success: true,
        message: 'Food item created successfully',
        foodItem
      });
    } catch (error) {
      console.error('Create food item error:', error);
      if (error instanceof Error && error.message.includes('already exists')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Updates an existing food item for the authenticated user
   * @param req - The authenticated request containing food item ID and update data
   * @param res - The response object
   * @returns Promise<void>
   */
  static async updateFoodItem(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { name, category, calories_per_100g, is_veg } = req.body;
      const userId = req.user!.userId;

      const foodItem = await MealService.updateFoodItem(parseInt(id), {
        name,
        category,
        calories_per_100g,
        is_veg,
        updated_by: userId
      });

      res.json({
        success: true,
        message: 'Food item updated successfully',
        foodItem
      });
    } catch (error) {
      console.error('Update food item error:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Deletes a food item for the authenticated user
   * @param req - The authenticated request containing food item ID
   * @param res - The response object
   * @returns Promise<void>
   */
  static async deleteFoodItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      await MealService.deleteFoodItem(parseInt(id), userId);

      res.json({
        success: true,
        message: 'Food item deleted successfully'
      });
    } catch (error) {
      console.error('Delete food item error:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Gets calorie goals for the authenticated user
   * @param req - The authenticated request
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getCalorieGoals(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const calorieGoals = await MealService.getCalorieGoals(userId);

      if (!calorieGoals) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({ success: true, calorieGoals });
    } catch (error) {
      console.error('Get calorie goals error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Updates calorie goals for the authenticated user
   * @param req - The authenticated request containing calorie goal data
   * @param res - The response object
   * @returns Promise<void>
   */
  static async updateCalorieGoals(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array()
        });
      }

      const { calorie_intake_goal, calorie_burn_goal } = req.body;
      const userId = req.user!.userId;

      const result = await MealService.updateCalorieGoals(userId, {
        calorie_intake_goal,
        calorie_burn_goal
      });

      res.json({
        success: true,
        message: 'Calorie goals updated successfully',
        user: result
      });
    } catch (error) {
      console.error('Update calorie goals error:', error);
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Creates a new meal template for the authenticated user
   * @param req - The authenticated request containing meal template data
   * @param res - The response object
   * @returns Promise<void>
   */
  static async createMealTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array()
        });
      }

      const { name, meal_type, items } = req.body;
      const userId = req.user!.userId;

      const template = await MealService.createMealTemplate({
        user_id: userId,
        name,
        meal_type,
        items
      });

      res.json({
        success: true,
        message: 'Meal template created successfully',
        template
      });
    } catch (error) {
      console.error('Create meal template error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Gets meal templates for the authenticated user with optional meal type filter
   * @param req - The authenticated request with optional meal_type parameter
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getMealTemplates(req: AuthenticatedRequest, res: Response) {
    try {
      const { meal_type } = req.query;
      const userId = req.user!.userId;

      const templates = await MealService.getMealTemplates(userId, meal_type as string);
      res.json({ success: true, templates });
    } catch (error) {
      console.error('Get meal templates error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Deletes a meal template for the authenticated user
   * @param req - The authenticated request containing template ID
   * @param res - The response object
   * @returns Promise<void>
   */
  static async deleteMealTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      await MealService.deleteMealTemplate(parseInt(id), userId);
      
      res.json({
        success: true,
        message: 'Meal template deleted successfully'
      });
    } catch (error) {
      console.error('Delete meal template error:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      if (error instanceof Error && error.message.includes('own')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Creates a new meal record for the authenticated user
   * @param req - The authenticated request containing meal record data
   * @param res - The response object
   * @returns Promise<void>
   */
  static async createMealRecord(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array()
        });
      }

      const { meal_type, meal_date, items } = req.body;
      const userId = req.user!.userId;


      // Ensure the date is in the correct format 
      let normalizedDate = meal_date;
      
      // If the date contains time information, extract only the date part
      if (typeof normalizedDate === 'string' && normalizedDate.includes('T')) {
        normalizedDate = normalizedDate.split('T')[0];
      }
      
      // Validate the date format (YYYY-MM-DD)
      if (!isValidDate(normalizedDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Expected YYYY-MM-DD'
        });
      }
      
      const record = await MealService.createMealRecord({
        user_id: userId,
        meal_type,
        meal_date: normalizedDate,
        items
      });

      // Get calorie status
      const calorieStatus = await MealService.getMealCalorieStatus(userId, record.total_calories);

      res.json({
        success: true,
        message: 'Meal record created successfully',
        record: {
          ...record,
          calorie_status: calorieStatus
        }
      });
    } catch (error) {
      console.error('Create meal record error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Gets meal records for the authenticated user with optional filters
   * @param req - The authenticated request with optional meal_date and meal_type parameters
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getMealRecords(req: AuthenticatedRequest, res: Response) {
    try {
      const { meal_date, meal_type } = req.query;
      const userId = req.user!.userId;

      const records = await MealService.getMealRecords(userId, meal_date as string, meal_type as string);
      res.json({ success: true, records });
    } catch (error) {
      console.error('Get meal records error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Gets today's meal summary for the authenticated user
   * @param req - The authenticated request
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getTodaySummary(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const summary = await MealService.getTodaySummary(userId);
      
      const todayString = getCurrentDate();

      res.json({ 
        success: true, 
        summary,
        date: todayString
      });
    } catch (error) {
      console.error('Get today summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Deletes a meal record by ID for the authenticated user
   * @param req - The authenticated request containing meal record ID
   * @param res - The response object
   * @returns Promise<void>
   */
  static async deleteMealRecord(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const result = await MealService.deleteMealRecord(parseInt(id), userId);
      
      if (result) {
        res.json({
          success: true,
          message: 'Meal record deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Meal record not found or you do not have permission to delete it'
        });
      }
    } catch (error) {
      console.error('Delete meal record error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Deletes meal records by date and type for the authenticated user
   * @param req - The authenticated request containing meal_date and meal_type parameters
   * @param res - The response object
   * @returns Promise<void>
   */
  static async deleteMealRecordsByDateAndType(req: AuthenticatedRequest, res: Response) {
    try {
      const { meal_date, meal_type } = req.query;
      const userId = req.user!.userId;

      if (!meal_date || !meal_type) {
        return res.status(400).json({
          success: false,
          message: 'meal_date and meal_type are required'
        });
      }

      const result = await MealService.deleteMealRecordsByDateAndType(
        userId, 
        meal_date as string, 
        meal_type as string
      );
      
      res.json({
        success: true,
        message: `Deleted ${result} meal records`,
        deletedCount: result
      });
    } catch (error) {
      console.error('Delete meal records by date and type error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Gets meal recommendations for the authenticated user
   * @param req - The authenticated request with optional meal_type and limit parameters
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getMealRecommendations(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { meal_type, limit = 1 } = req.query;

      const recommendations = await MealRecommendationService.getMealRecommendations(
        userId, 
        meal_type as string, 
        parseInt(limit as string)
      );

      res.json({ 
        success: true, 
        recommendations 
      });
    } catch (error) {
      console.error('Get meal recommendations error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
