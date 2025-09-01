import { Request, Response } from 'express';
import { MealRecommendationModel } from '../models/mealRecommendationModel';
import { AuthModel } from '../models/authModel';
import { AuthenticatedRequest } from '../types/auth.types';
import { addDays, formatDate } from '../utils/timeUtils';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  user_preference?: string;
}

// Utility functions
const getUserId = (req: AuthenticatedRequest): number | null => {
  return req.user?.userId || null;
};

const handleError = (res: Response, error: any, methodName: string) => {
  console.error(`Error in ${methodName}:`, error);
  res.status(500).json({ success: false, error: 'Internal server error' });
};

const validateUser = async (userId: number | null): Promise<{ user: any; error?: string }> => {
  if (!userId) {
    return { user: null, error: 'User not authenticated' };
  }

  const user = await AuthModel.getUserProfile(userId);
  if (!user) {
    return { user: null, error: 'User not found' };
  }

  // If user hasn't set dietary preference, default to non-veg
  if (!user.dietary_preference) {
    user.dietary_preference = 'non-veg';
  }

  return { user };
};

const parseLimit = (limit: any, defaultValue: number = 1): number => {
  const parsed = parseInt(limit as string, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export class MealRecommendationController {
  /**
   * Gets meal recommendations for the authenticated user based on dietary preference
   * @param req - The authenticated request with optional meal_type and limit parameters
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getMealRecommendations(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = getUserId(req);
      const { user, error } = await validateUser(userId);

      if (error) {
        return res.status(401).json({ success: false, error });
      }

      const { meal_type, limit } = req.query;
      const limitValue = parseLimit(limit, 1);

      const recommendations = await MealRecommendationModel.getMealRecommendations(
        user.dietary_preference,
        meal_type as string,
        limitValue
      );

      const response = {
        success: true,
        recommendations: recommendations,
        user_preference: user.dietary_preference
      };

      res.json(response);
    } catch (error) {
      handleError(res, error, 'getMealRecommendations');
    }
  }

  /**
   * Gets meal recommendations for all meal types for the authenticated user
   * @param req - The authenticated request with optional limit_per_type parameter
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getAllMealRecommendations(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = getUserId(req);
      const { user, error } = await validateUser(userId);

      if (error) {
        return res.status(401).json({ success: false, error });
      }

      const { limit_per_type } = req.query;
      const limitValue = parseLimit(limit_per_type, 1);

      const [breakfast, lunch, dinner] = await Promise.all([
        MealRecommendationModel.getMealRecommendations(user.dietary_preference, 'breakfast', limitValue),
        MealRecommendationModel.getMealRecommendations(user.dietary_preference, 'lunch', limitValue),
        MealRecommendationModel.getMealRecommendations(user.dietary_preference, 'dinner', limitValue)
      ]);

      const response = {
        success: true,
        recommendations: { breakfast, lunch, dinner },
        user_preference: user.dietary_preference
      };

      res.json(response);
    } catch (error) {
      handleError(res, error, 'getAllMealRecommendations');
    }
  }

  /**
   * Gets meal recommendations by specific meal type for the authenticated user
   * @param req - The authenticated request containing meal_type parameter and optional limit
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getMealRecommendationsByType(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = getUserId(req);
      const { user, error } = await validateUser(userId);

      if (error) {
        return res.status(401).json({ success: false, error });
      }

      const { meal_type } = req.params;
      const { limit } = req.query;

      if (!meal_type) {
        return res.status(400).json({ success: false, error: 'Meal type is required' });
      }

      const limitValue = parseLimit(limit, 5);

      const recommendations = await MealRecommendationModel.getMealRecommendationsByType(
        meal_type,
        user.dietary_preference,
        limitValue
      );

      const response = {
        success: true,
        recommendations: recommendations,
        user_preference: user.dietary_preference
      };

      res.json(response);
    } catch (error) {
      handleError(res, error, 'getMealRecommendationsByType');
    }
  }

  /**
   * Gets a specific meal recommendation by ID
   * @param req - The request containing meal_id parameter
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getMealRecommendationById(req: AuthenticatedRequest, res: Response) {
    try {
      const { meal_id } = req.params;

      if (!meal_id) {
        return res.status(400).json({ success: false, error: 'Meal ID is required' });
      }

      const mealIdNumber = parseInt(meal_id, 10);

      if (isNaN(mealIdNumber)) {
        return res.status(400).json({ success: false, error: 'Invalid meal ID format' });
      }

      const recommendation = await MealRecommendationModel.getMealRecommendationById(mealIdNumber);

      if (!recommendation) {
        return res.status(404).json({ success: false, error: 'Meal recommendation not found' });
      }

      const response = {
        success: true,
        data: recommendation
      };

      res.json(response);
    } catch (error) {
      handleError(res, error, 'getMealRecommendationById');
    }
  }

  /**
   * Gets all available meal types for recommendations
   * @param req - The authenticated request
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getAvailableMealTypes(req: AuthenticatedRequest, res: Response) {
    try {
      const mealTypes = await MealRecommendationModel.getAvailableMealTypes();

      const response = {
        success: true,
        data: mealTypes
      };

      res.json(response);
    } catch (error) {
      handleError(res, error, 'getAvailableMealTypes');
    }
  }

  /**
   * Gets meal recommendations statistics
   * @param req - The authenticated request
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getMealRecommendationsStats(req: AuthenticatedRequest, res: Response) {
    try {
      const stats = await MealRecommendationModel.getMealRecommendationsCount();

      const response = {
        success: true,
        data: stats
      };

      res.json(response);
    } catch (error) {
      handleError(res, error, 'getMealRecommendationsStats');
    }
  }

  /**
   * Gets weekly meal recommendations for the authenticated user
   * @param req - The authenticated request with optional limit_per_meal parameter
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getWeeklyMealRecommendations(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = getUserId(req);
      const { user, error } = await validateUser(userId);

      if (error) {
        return res.status(401).json({ success: false, error });
      }

      const { limit_per_meal } = req.query;
      const limitValue = parseLimit(limit_per_meal, 1);

      // Get all unique meals for the week at once with randomization
      const weeklyMeals = await MealRecommendationModel.getWeeklyMealRecommendationsEnhanced(
        user.dietary_preference,
        7
      );

      const { breakfast: breakfastMeals, lunch: lunchMeals, dinner: dinnerMeals } = weeklyMeals;

      const weeklyRecommendations = [];
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const today = new Date();

      for (let i = 0; i < 7; i++) {
        const currentDate = addDays(today, i);

        const dayName = days[i];
        const dateString = formatDate(currentDate);
        const breakfast = [breakfastMeals[i]];
        const lunch = [lunchMeals[i]];
        const dinner = [dinnerMeals[i]];

        const totalCalories = (breakfast[0]?.calories || 0) +
          (lunch[0]?.calories || 0) +
          (dinner[0]?.calories || 0);

        weeklyRecommendations.push({
          day: dayName,
          date: dateString,
          breakfast,
          lunch,
          dinner,
          totalCalories
        });
      }

      const response = {
        success: true,
        data: weeklyRecommendations,
        user_preference: user.dietary_preference
      };

      res.json(response);
    } catch (error) {
      handleError(res, error, 'getWeeklyMealRecommendations');
    }
  }
}
