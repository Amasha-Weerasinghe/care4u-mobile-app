import pool from '../config/database';

export interface MealRecommendation {
  meal_id: number;
  meal_type: string;
  meal: string;
  calories: number;
  is_veg: boolean;
}

export interface WeeklyMealPlan {
  breakfast: MealRecommendation[];
  lunch: MealRecommendation[];
  dinner: MealRecommendation[];
}

export interface MealTypeCount {
  meal_type: string;
  count: number;
}

export class MealRecommendationModel {
  private static buildBaseQuery(
    dietaryPreference?: string,
    mealType?: string
  ): { query: string; params: any[] } {
    let query = `
      SELECT meal_id, meal_type, meal, calories, is_veg
      FROM meal_recommendations 
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // Filter by dietary preference
    if (dietaryPreference === 'veg') {
      query += ` AND is_veg = true`;
    } else if (dietaryPreference === 'non-veg') {
      // Non-veg users can have both veg and non-veg meals
      query += ` AND (is_veg = true OR is_veg = false)`;
    } else if (!dietaryPreference) {
      // If no dietary preference specified, return all meals
    }

    // Filter by meal type if specified
    if (mealType) {
      query += ` AND meal_type = $${paramIndex}`;
      params.push(mealType);
      paramIndex++;
    }

    return { query, params };
  }

  // Utility function to shuffle array using Fisher-Yates algorithm
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Get meal recommendations based on dietary preference and meal type
  static async getMealRecommendations(
    dietaryPreference?: string,
    mealType?: string,
    limit: number = 1
  ): Promise<MealRecommendation[]> {
    try {
      const { query, params } = this.buildBaseQuery(dietaryPreference, mealType);
      const finalQuery = `${query} ORDER BY RANDOM() LIMIT $${params.length + 1}`;
      const finalParams = [...params, limit];

      const result = await pool.query(finalQuery, finalParams);
      return result.rows;
    } catch (error) {
      console.error('Error in getMealRecommendations:', error);
      throw error;
    }
  }

  // Get multiple unique meal recommendations for weekly planning
  static async getWeeklyMealRecommendations(
    dietaryPreference?: string,
    mealType?: string,
    daysCount: number = 7
  ): Promise<MealRecommendation[]> {
    try {
      const { query, params } = this.buildBaseQuery(dietaryPreference, mealType);
      const finalQuery = `${query} ORDER BY meal_id`;
      const result = await pool.query(finalQuery, params);

      if (result.rows.length === 0) {
        return [];
      }

      // Shuffle and return the required number of meals
      const shuffled = this.shuffleArray(result.rows);
      return shuffled.slice(0, Math.min(daysCount, result.rows.length));
    } catch (error) {
      console.error('Error in getWeeklyMealRecommendations:', error);
      throw error;
    }
  }

  // Get all meal recommendations
  static async getAllMealRecommendations(): Promise<MealRecommendation[]> {
    try {
      const query = `
        SELECT meal_id, meal_type, meal, calories, is_veg
        FROM meal_recommendations 
        ORDER BY meal_type, meal_id
      `;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error in getAllMealRecommendations:', error);
      throw error;
    }
  }

  // Get meal recommendations by meal type
  static async getMealRecommendationsByType(
    mealType: string,
    dietaryPreference?: string,
    limit: number = 5
  ): Promise<MealRecommendation[]> {
    try {
      const { query, params } = this.buildBaseQuery(dietaryPreference, mealType);

      const finalQuery = `${query} ORDER BY RANDOM() LIMIT $${params.length + 1}`;
      const finalParams = [...params, limit];

      const result = await pool.query(finalQuery, finalParams);
      return result.rows;
    } catch (error) {
      console.error('Error in getMealRecommendationsByType:', error);
      throw error;
    }
  }

  // Get meal recommendation by ID
  static async getMealRecommendationById(mealId: number): Promise<MealRecommendation | null> {
    try {
      const query = `
        SELECT meal_id, meal_type, meal, calories, is_veg
        FROM meal_recommendations 
        WHERE meal_id = $1
      `;

      const result = await pool.query(query, [mealId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getMealRecommendationById:', error);
      throw error;
    }
  }

  // Get available meal types
  static async getAvailableMealTypes(): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT meal_type
        FROM meal_recommendations 
        ORDER BY meal_type
      `;

      const result = await pool.query(query);
      return result.rows.map(row => row.meal_type);
    } catch (error) {
      console.error('Error in getAvailableMealTypes:', error);
      throw error;
    }
  }

  // Get meal recommendations count by type
  static async getMealRecommendationsCount(): Promise<MealTypeCount[]> {
    try {
      const query = `
        SELECT meal_type, COUNT(*) as count
        FROM meal_recommendations 
        GROUP BY meal_type
        ORDER BY meal_type
      `;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error in getMealRecommendationsCount:', error);
      throw error;
    }
  }

  // Get weekly meal recommendations with enhanced randomization
  static async getWeeklyMealRecommendationsEnhanced(
    dietaryPreference?: string,
    daysCount: number = 7
  ): Promise<WeeklyMealPlan> {
    try {
      const [breakfastMeals, lunchMeals, dinnerMeals] = await Promise.all([
        this.getWeeklyMealRecommendations(dietaryPreference, 'breakfast', daysCount),
        this.getWeeklyMealRecommendations(dietaryPreference, 'lunch', daysCount),
        this.getWeeklyMealRecommendations(dietaryPreference, 'dinner', daysCount)
      ]);

      return {
        breakfast: breakfastMeals,
        lunch: lunchMeals,
        dinner: dinnerMeals
      };
    } catch (error) {
      console.error('Error in getWeeklyMealRecommendationsEnhanced:', error);
      throw error;
    }
  }
}
