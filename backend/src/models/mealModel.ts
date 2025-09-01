import pool from '../config/database';
import { 
  FoodItem, 
  CalorieGoals, 
  MealTemplate, 
  MealTemplateItem, 
  MealRecord, 
  MealRecordItem,
  CreateFoodItemRequest,
  CreateMealTemplateRequest,
  CreateMealRecordRequest,
  UpdateCalorieGoalsRequest
} from '../types/meal.types';
import { isValidDate } from '../utils/timeUtils';

export class MealModel {
  // Food Items Operations
  static async getFoodItems(search?: string, category?: string): Promise<FoodItem[]> {
    let query = 'SELECT * FROM food_items WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getFoodCategories(): Promise<string[]> {
    const result = await pool.query(
      `SELECT DISTINCT category FROM food_items 
       WHERE category IS NOT NULL 
       AND category NOT IN ('breakfast', 'lunch', 'dinner', 'snack')
       ORDER BY category`
    );
    return result.rows.map(row => row.category);
  }

  static async getUserFoodItems(userId: number): Promise<FoodItem[]> {
    const result = await pool.query(
      'SELECT * FROM food_items WHERE created_by = $1 ORDER BY name ASC',
      [userId]
    );
    return result.rows;
  }

  static async createFoodItem(data: {
    name: string;
    category: string;
    calories_per_100g: number;
    is_veg: boolean;
    created_by: number;
  }): Promise<FoodItem> {
    const result = await pool.query(
      'INSERT INTO food_items (name, category, calories_per_100g, is_veg, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [data.name, data.category, data.calories_per_100g, data.is_veg, data.created_by]
    );
    return result.rows[0];
  }

  static async checkFoodItemExists(name: string, category: string, userId: number): Promise<boolean> {
    const result = await pool.query(
      'SELECT id FROM food_items WHERE name ILIKE $1 AND category = $2 AND created_by = $3',
      [name, category, userId]
    );
    return result.rows.length > 0;
  }

  static async checkFoodItemExistsExcludingId(name: string, category: string, excludeId: number, userId: number): Promise<boolean> {
    const result = await pool.query(
      'SELECT id FROM food_items WHERE name ILIKE $1 AND category = $2 AND id != $3 AND created_by = $4',
      [name, category, excludeId, userId]
    );
    return result.rows.length > 0;
  }

  static async updateFoodItem(id: number, data: {
    name: string;
    category: string;
    calories_per_100g: number;
    is_veg: boolean;
    updated_by: number;
  }): Promise<FoodItem> {
    const result = await pool.query(
      `UPDATE food_items SET 
        name = $1, 
        category = $2, 
        calories_per_100g = $3, 
        is_veg = $4,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = $5 RETURNING *`,
      [data.name, data.category, data.calories_per_100g, data.is_veg, id]
    );
    return result.rows[0];
  }

  static async deleteFoodItem(id: number): Promise<void> {
    await pool.query('DELETE FROM food_items WHERE id = $1', [id]);
  }

  static async getFoodItemById(id: number): Promise<FoodItem | null> {
    const result = await pool.query('SELECT * FROM food_items WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  // Calorie Goals Operations
  static async getCalorieGoals(userId: number): Promise<CalorieGoals | null> {
    const result = await pool.query(
      'SELECT calorie_intake_goal, calorie_burn_goal FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  static async updateCalorieGoals(userId: number, data: {
    calorie_intake_goal: number;
    calorie_burn_goal: number;
  }): Promise<CalorieGoals> {
    const result = await pool.query(
      `UPDATE users SET 
        calorie_intake_goal = $1,
        calorie_burn_goal = $2,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 RETURNING calorie_intake_goal, calorie_burn_goal`,
      [data.calorie_intake_goal, data.calorie_burn_goal, userId]
    );
    return result.rows[0];
  }

  // Meal Templates Operations
  static async createMealTemplate(data: {
    user_id: number;
    name: string;
    meal_type: string;
    total_calories: number;
  }): Promise<MealTemplate> {
    const result = await pool.query(
      'INSERT INTO meal_templates (user_id, name, meal_type, total_calories) VALUES ($1, $2, $3, $4) RETURNING *',
      [data.user_id, data.name, data.meal_type, data.total_calories]
    );
    return result.rows[0];
  }

  static async addMealTemplateItems(templateId: number, items: Array<{
    food_item_id: number;
    quantity_grams: number;
    calories: number;
  }>): Promise<void> {
    for (const item of items) {
      await pool.query(
        'INSERT INTO meal_template_items (template_id, food_item_id, quantity_grams, calories) VALUES ($1, $2, $3, $4)',
        [templateId, item.food_item_id, item.quantity_grams, item.calories]
      );
    }
  }

  static async getMealTemplates(userId: number, mealType?: string): Promise<MealTemplate[]> {
    let query = `
      SELECT mt.*, 
             json_agg(
               json_build_object(
                 'id', mti.id,
                 'food_item_id', mti.food_item_id,
                 'food_name', fi.name,
                 'quantity_grams', mti.quantity_grams,
                 'calories', mti.calories
               )
             ) as items
      FROM meal_templates mt
      LEFT JOIN meal_template_items mti ON mt.id = mti.template_id
      LEFT JOIN food_items fi ON mti.food_item_id = fi.id
      WHERE mt.user_id = $1
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    if (mealType) {
      query += ` AND mt.meal_type = $${paramIndex}`;
      params.push(mealType);
      paramIndex++;
    }

    query += ' GROUP BY mt.id ORDER BY mt.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getMealTemplateById(id: number): Promise<MealTemplate | null> {
    const result = await pool.query('SELECT * FROM meal_templates WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async deleteMealTemplate(id: number): Promise<void> {
    await pool.query('DELETE FROM meal_template_items WHERE template_id = $1', [id]);
    await pool.query('DELETE FROM meal_templates WHERE id = $1', [id]);
  }

  // Meal Records Operations
  static async createMealRecord(data: {
    user_id: number;
    meal_type: string;
    total_calories: number;
    meal_date: string;
  }): Promise<MealRecord> {
    let processedDate = data.meal_date;
    if (processedDate.includes('T')) {
      processedDate = processedDate.split('T')[0];
    }
    if (!isValidDate(processedDate)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    const result = await pool.query(
      `INSERT INTO meal_records (user_id, meal_type, total_calories, meal_date) 
       VALUES ($1, $2, $3, $4::date) 
       RETURNING id, user_id, meal_type, total_calories, 
                TO_CHAR(meal_date, 'YYYY-MM-DD') as meal_date,
                created_at, updated_at`,
      [data.user_id, data.meal_type, data.total_calories, processedDate]
    );

    return result.rows[0];
  }

  static async addMealRecordItems(mealRecordId: number, items: Array<{
    food_item_id: number;
    quantity_grams: number;
    calories: number;
  }>): Promise<void> {
    if (items.length === 0) {
      return;
    }

    for (const item of items) {
      await pool.query(
        'INSERT INTO meal_record_items (meal_record_id, food_item_id, quantity_grams, calories) VALUES ($1, $2, $3, $4)',
        [mealRecordId, item.food_item_id, item.quantity_grams, item.calories]
      );
    }
  }

  static async getMealRecords(userId: number, mealDate?: string, mealType?: string): Promise<MealRecord[]> {
    let query = `
      SELECT mr.id, mr.user_id, mr.meal_type, mr.total_calories, 
             TO_CHAR(mr.meal_date, 'YYYY-MM-DD') as meal_date,
             mr.created_at, mr.updated_at,
             COALESCE(
               json_agg(
                 CASE 
                   WHEN mri.id IS NOT NULL THEN
                     json_build_object(
                       'id', mri.id,
                       'food_item_id', mri.food_item_id,
                       'food_name', fi.name,
                       'quantity_grams', mri.quantity_grams,
                       'calories', mri.calories
                     )
                   ELSE NULL
                 END
               ) FILTER (WHERE mri.id IS NOT NULL),
               '[]'::json
             ) as items
      FROM meal_records mr
      LEFT JOIN meal_record_items mri ON mr.id = mri.meal_record_id
      LEFT JOIN food_items fi ON mri.food_item_id = fi.id
      WHERE mr.user_id = $1
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    if (mealDate) {
      let processedDate = mealDate;
      if (processedDate.includes('T')) {
        processedDate = processedDate.split('T')[0];
      }
      query += ` AND mr.meal_date = $${paramIndex}::date`;
      params.push(processedDate);
      paramIndex++;
    }

    if (mealType) {
      query += ` AND mr.meal_type = $${paramIndex}`;
      params.push(mealType);
      paramIndex++;
    }

    query += ' GROUP BY mr.id, mr.user_id, mr.meal_type, mr.total_calories, mr.meal_date, mr.created_at, mr.updated_at ORDER BY mr.meal_date DESC, mr.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Utility Methods
  static async calculateCaloriesForItem(foodItemId: number, quantityGrams: number): Promise<number> {
    const foodItem = await this.getFoodItemById(foodItemId);
    if (!foodItem) {
      throw new Error(`Food item with id ${foodItemId} not found`);
    }
    return Math.round((quantityGrams / 100) * foodItem.calories_per_100g);
  }

  static async getUserById(userId: number): Promise<{ id: number; calorie_intake_goal: number } | null> {
    const result = await pool.query(
      'SELECT id, calorie_intake_goal FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  static async getMealRecordById(id: number): Promise<MealRecord | null> {
    const result = await pool.query(
      'SELECT id, user_id, meal_type, total_calories, TO_CHAR(meal_date, \'YYYY-MM-DD\') as meal_date, created_at, updated_at FROM meal_records WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async deleteMealRecord(id: number): Promise<void> {
    await pool.query('DELETE FROM meal_record_items WHERE meal_record_id = $1', [id]);
    await pool.query('DELETE FROM meal_records WHERE id = $1', [id]);
  }

  static async deleteMealRecordsByDateAndType(userId: number, mealDate: string, mealType: string): Promise<number> {
    const mealRecordsResult = await pool.query(
      'SELECT id FROM meal_records WHERE user_id = $1 AND meal_date = $2::date AND meal_type = $3',
      [userId, mealDate, mealType]
    );

    const mealRecordIds = mealRecordsResult.rows.map(row => row.id);

    if (mealRecordIds.length === 0) {
      return 0;
    }

    // Delete meal record items for these records
    await pool.query(
      'DELETE FROM meal_record_items WHERE meal_record_id = ANY($1)',
      [mealRecordIds]
    );

    // Delete the meal records
    const deleteResult = await pool.query(
      'DELETE FROM meal_records WHERE id = ANY($1)',
      [mealRecordIds]
    );

    return deleteResult.rowCount || 0;
  }
}
