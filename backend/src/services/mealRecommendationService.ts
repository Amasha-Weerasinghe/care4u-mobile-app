import { AuthModel } from '../models/authModel';
import { User } from '../types/auth.types';
import { MealRecommendationModel, MealRecommendation } from '../models/mealRecommendationModel';
import { addDays, formatDate } from '../utils/timeUtils';

export class MealRecommendationService {
  // Get meal recommendations based on user's dietary preference and meal type
  static async getMealRecommendations(
    userId: number, 
    mealType?: string, 
    limit: number = 1
  ): Promise<MealRecommendation[]> {
    try {
      // Get user's dietary preference
      const user = await AuthModel.getUserProfile(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Use the model to get recommendations
      return await MealRecommendationModel.getMealRecommendations(
        user.dietary_preference,
        mealType,
        limit
      );
    } catch (error) {
      console.error('Error in getMealRecommendations:', error);
      throw error;
    }
  }

  // Get meal recommendations for all meal types (breakfast, lunch, dinner)
  static async getAllMealRecommendations(
    userId: number, 
    limitPerType: number = 1
  ): Promise<{
    breakfast: MealRecommendation[];
    lunch: MealRecommendation[];
    dinner: MealRecommendation[];
  }> {
    try {
      const [breakfast, lunch, dinner] = await Promise.all([
        this.getMealRecommendations(userId, 'breakfast', limitPerType),
        this.getMealRecommendations(userId, 'lunch', limitPerType),
        this.getMealRecommendations(userId, 'dinner', limitPerType)
      ]);

      return {
        breakfast,
        lunch,
        dinner
      };
    } catch (error) {
      console.error('Error in getAllMealRecommendations:', error);
      throw error;
    }
  }

  // Get weekly meal recommendations (7 days with different meals each day)
  static async getWeeklyMealRecommendations(
    userId: number
  ): Promise<Array<{
    day: string;
    date: string;
    breakfast: MealRecommendation[];
    lunch: MealRecommendation[];
    dinner: MealRecommendation[];
    totalCalories: number;
  }>> {
    try {
      // Get user's dietary preference
      const user = await AuthModel.getUserProfile(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get all unique meals for the week at once
      const weeklyMeals = await MealRecommendationModel.getWeeklyMealRecommendationsEnhanced(
        user.dietary_preference,
        7
      );

      const { breakfast: breakfastMeals, lunch: lunchMeals, dinner: dinnerMeals } = weeklyMeals;

      const weeklyRecommendations = [];
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      // Get current date
      const today = new Date();
      
      for (let i = 0; i < 7; i++) {
        const currentDate = addDays(today, i);
        
        const dayName = days[i];
        const dateString = formatDate(currentDate);
        
        // Use the pre-fetched unique meals for each day
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
      
      return weeklyRecommendations;
    } catch (error) {
      console.error('Error in getWeeklyMealRecommendations:', error);
      throw error;
    }
  }
}
