import pool from '../config/database';
import { 
  ExerciseActivity, 
  ExerciseSummary, 
  CreateExerciseRequest, 
  UpdateExerciseRequest, 
  GetExerciseHistoryRequest 
} from '../types/exercise.types';
import { getCurrentDate, isValidDate } from '../utils/timeUtils';

export class ExerciseModel {
  // Create new exercise activity
  static async createExercise(userId: number, data: CreateExerciseRequest): Promise<ExerciseActivity> {
    const { activity_type, duration_seconds, calories_burned, notes, activity_date } = data;

    let finalActivityDate = activity_date || getCurrentDate();

    if (finalActivityDate.includes('T')) {
      finalActivityDate = finalActivityDate.split('T')[0];
    }

    // Validate the date format (YYYY-MM-DD)
    if (!isValidDate(finalActivityDate)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    const query = `
      INSERT INTO exercise_activities (user_id, activity_type, duration_seconds, calories_burned, notes, activity_date)
      VALUES ($1, $2, $3, $4, $5, $6::date)
      RETURNING id, user_id, activity_type, duration_seconds, calories_burned, notes,
                TO_CHAR(activity_date, 'YYYY-MM-DD') as activity_date,
                created_at, updated_at
    `;

    const values = [userId, activity_type, duration_seconds, calories_burned, notes, finalActivityDate];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating exercise activity:', error);
      throw new Error('Failed to create exercise activity');
    }
  }

  // Get today's exercise summary
  static async getTodayExerciseSummary(userId: number): Promise<ExerciseSummary> {
    const todayString = getCurrentDate();

    return this.getDailyExerciseSummary(userId, todayString);
  }

  // Get daily exercise summary for a specific date
  static async getDailyExerciseSummary(userId: number, date: string): Promise<ExerciseSummary> {
    const query = `
      SELECT 
        COUNT(*) as total_activities,
        COALESCE(SUM(duration_seconds), 0) as total_duration_seconds,
        COALESCE(SUM(calories_burned), 0) as total_calories_burned
      FROM exercise_activities 
      WHERE user_id = $1 AND activity_date = $2
    `;

    const activitiesQuery = `
      SELECT * FROM exercise_activities 
      WHERE user_id = $1 AND activity_date = $2
      ORDER BY created_at DESC
    `;

    try {
      const [summaryResult, activitiesResult] = await Promise.all([
        pool.query(query, [userId, date]),
        pool.query(activitiesQuery, [userId, date])
      ]);

      const summary = summaryResult.rows[0];
      const totalActivities = parseInt(summary.total_activities);
      const totalCaloriesBurned = parseInt(summary.total_calories_burned);
      
      return {
        totalActivities,
        totalDuration: parseInt(summary.total_duration_seconds),
        totalCaloriesBurned,
        averageCaloriesPerActivity: totalActivities > 0 ? totalCaloriesBurned / totalActivities : 0,
        activities: activitiesResult.rows
      };
    } catch (error) {
      console.error('Error getting daily exercise summary:', error);
      throw new Error('Failed to get daily exercise summary');
    }
  }

  // Get exercise history
  static async getExerciseHistory(userId: number, params: GetExerciseHistoryRequest = {}): Promise<ExerciseActivity[]> {
    let query = `
      SELECT id, user_id, activity_type, duration_seconds, calories_burned, notes,
             TO_CHAR(activity_date, 'YYYY-MM-DD') as activity_date,
             created_at, updated_at
      FROM exercise_activities 
      WHERE user_id = $1
    `;

    const values: any[] = [userId];
    let paramIndex = 2;

    if (params.date) {
      let processedDate = params.date;
      if (processedDate.includes('T')) {
        processedDate = processedDate.split('T')[0];
      }
      query += ` AND activity_date = $${paramIndex}::date`;
      values.push(processedDate);
      paramIndex++;
    }

    if (params.activity_type) {
      query += ` AND activity_type = $${paramIndex}`;
      values.push(params.activity_type);
      paramIndex++;
    }

    query += ` ORDER BY activity_date DESC, created_at DESC`;

    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error getting exercise history:', error);
      throw new Error('Failed to get exercise history');
    }
  }

  // Update exercise activity
  static async updateExercise(userId: number, exerciseId: number, data: UpdateExerciseRequest): Promise<ExerciseActivity> {
    const { activity_type, duration_seconds, calories_burned, notes } = data;

    let query = `
      UPDATE exercise_activities 
      SET updated_at = CURRENT_TIMESTAMP
    `;

    const values: any[] = [];
    let paramIndex = 1;

    if (activity_type !== undefined) {
      query += `, activity_type = $${paramIndex}`;
      values.push(activity_type);
      paramIndex++;
    }

    if (duration_seconds !== undefined) {
      query += `, duration_seconds = $${paramIndex}`;
      values.push(duration_seconds);
      paramIndex++;
    }

    if (calories_burned !== undefined) {
      query += `, calories_burned = $${paramIndex}`;
      values.push(calories_burned);
      paramIndex++;
    }

    if (notes !== undefined) {
      query += `, notes = $${paramIndex}`;
      values.push(notes);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`;
    values.push(exerciseId, userId);

    try {
      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Exercise activity not found or access denied');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error updating exercise activity:', error);
      throw new Error('Failed to update exercise activity');
    }
  }

  // Delete exercise activity
  static async deleteExercise(userId: number, exerciseId: number): Promise<void> {
    const query = `
      DELETE FROM exercise_activities 
      WHERE id = $1 AND user_id = $2
    `;

    try {
      const result = await pool.query(query, [exerciseId, userId]);

      if (result.rowCount === 0) {
        throw new Error('Exercise activity not found or access denied');
      }
    } catch (error) {
      console.error('Error deleting exercise activity:', error);
      throw new Error('Failed to delete exercise activity');
    }
  }

  // Delete exercise activities by date and type
  static async deleteExerciseActivitiesByDateAndType(userId: number, activityDate: string, activityType: string): Promise<number> {
    const query = `
      DELETE FROM exercise_activities 
      WHERE user_id = $1 AND activity_date = $2 AND activity_type = $3
    `;

    try {
      const result = await pool.query(query, [userId, activityDate, activityType]);
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error deleting exercise activities by date and type:', error);
      throw new Error('Failed to delete exercise activities');
    }
  }

  // Get available activity types
  static async getActivityTypes(): Promise<string[]> {
    const query = `
      SELECT DISTINCT activity_type 
      FROM exercise_activities 
      ORDER BY activity_type
    `;

    try {
      const result = await pool.query(query);
      return result.rows.map(row => row.activity_type);
    } catch (error) {
      console.error('Error getting activity types:', error);
      throw new Error('Failed to get activity types');
    }
  }

  // Get exercise summary for a specific date
  static async getExerciseSummaryByDate(userId: number, date: string): Promise<ExerciseSummary> {
    const query = `
      SELECT 
        COUNT(*) as total_activities,
        COALESCE(SUM(duration_seconds), 0) as total_duration_seconds,
        COALESCE(SUM(calories_burned), 0) as total_calories_burned
      FROM exercise_activities 
      WHERE user_id = $1 AND activity_date = $2
    `;

    const activitiesQuery = `
      SELECT * FROM exercise_activities 
      WHERE user_id = $1 AND activity_date = $2
      ORDER BY created_at DESC
    `;

    try {
      const [summaryResult, activitiesResult] = await Promise.all([
        pool.query(query, [userId, date]),
        pool.query(activitiesQuery, [userId, date])
      ]);

      const summary = summaryResult.rows[0];
      const totalActivities = parseInt(summary.total_activities);
      const totalCaloriesBurned = parseInt(summary.total_calories_burned);
      
      return {
        totalActivities,
        totalDuration: parseInt(summary.total_duration_seconds),
        totalCaloriesBurned,
        averageCaloriesPerActivity: totalActivities > 0 ? totalCaloriesBurned / totalActivities : 0,
        activities: activitiesResult.rows
      };
    } catch (error) {
      console.error('Error getting exercise summary by date:', error);
      throw new Error('Failed to get exercise summary by date');
    }
  }
}
