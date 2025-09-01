import { ExerciseModel } from '../models/exerciseModel';
import { CreateExerciseRequest, UpdateExerciseRequest, GetExerciseHistoryRequest, ExerciseActivity, ExerciseSummary } from '../types/exercise.types';
import { isValidDate } from '../utils/timeUtils';

export class ExerciseService {
  // Create new exercise activity
  static async createExercise(userId: number, data: CreateExerciseRequest): Promise<ExerciseActivity> {
    // Validate input data
    if (!data.activity_type || !data.duration_seconds || data.calories_burned === undefined) {
      throw new Error('Missing required fields: activity_type, duration_seconds, calories_burned');
    }

    if (data.duration_seconds <= 0) {
      throw new Error('Duration must be greater than 0');
    }

    if (data.calories_burned < 0) {
      throw new Error('Calories burned cannot be negative');
    }

    if (data.activity_type.trim().length === 0) {
      throw new Error('Activity type cannot be empty');
    }

    // Normalize activity type
    const normalizedActivityType = data.activity_type.toLowerCase().trim();

    // Validate activity type 
    const validActivityTypes = [
      'walking', 'running', 'cycling', 'yoga', 'stretching', 
      'zumba'
    ];

    if (!validActivityTypes.includes(normalizedActivityType)) {
      throw new Error('Invalid activity type. Please choose a valid exercise activity.');
    }

    try {
      const exerciseData: CreateExerciseRequest = {
        activity_type: normalizedActivityType,
        duration_seconds: data.duration_seconds,
        calories_burned: data.calories_burned,
        notes: data.notes?.trim() || undefined
      };

      return await ExerciseModel.createExercise(userId, exerciseData);
    } catch (error) {
      console.error('ExerciseService - createExercise error:', error);
      throw error;
    }
  }

  // Get today's exercise summary
  static async getTodayExerciseSummary(userId: number): Promise<ExerciseSummary> {
    try {
      return await ExerciseModel.getTodayExerciseSummary(userId);
    } catch (error) {
      console.error('ExerciseService - getTodayExerciseSummary error:', error);
      throw error;
    }
  }

  // Get daily exercise summary for a specific date
  static async getDailyExerciseSummary(userId: number, date: string): Promise<ExerciseSummary> {
    try {
      return await ExerciseModel.getDailyExerciseSummary(userId, date);
    } catch (error) {
      console.error('ExerciseService - getDailyExerciseSummary error:', error);
      throw error;
    }
  }

  // Get exercise history
  static async getExerciseHistory(userId: number, params: GetExerciseHistoryRequest = {}): Promise<ExerciseActivity[]> {
    try {
      // Validate date format if provided
      if (params.date) {
        if (!isValidDate(params.date)) {
          throw new Error('Invalid date format. Use YYYY-MM-DD format.');
        }
      }

      // Validate activity type if provided
      if (params.activity_type) {
        const normalizedActivityType = params.activity_type.toLowerCase().trim();
        if (normalizedActivityType.length === 0) {
          throw new Error('Activity type cannot be empty');
        }
        params.activity_type = normalizedActivityType;
      }

      return await ExerciseModel.getExerciseHistory(userId, params);
    } catch (error) {
      console.error('ExerciseService - getExerciseHistory error:', error);
      throw error;
    }
  }

  // Update exercise activity
  static async updateExercise(userId: number, exerciseId: number, data: UpdateExerciseRequest): Promise<ExerciseActivity> {
    
    if (!exerciseId || exerciseId <= 0) {
      throw new Error('Invalid exercise ID');
    }

    if (data.duration_seconds !== undefined && data.duration_seconds <= 0) {
      throw new Error('Duration must be greater than 0');
    }

    if (data.calories_burned !== undefined && data.calories_burned < 0) {
      throw new Error('Calories burned cannot be negative');
    }

    if (data.activity_type !== undefined) {
      if (data.activity_type.trim().length === 0) {
        throw new Error('Activity type cannot be empty');
      }
      data.activity_type = data.activity_type.toLowerCase().trim();
    }

    try {
      const updateData: UpdateExerciseRequest = {
        ...data,
        notes: data.notes?.trim() || undefined
      };

      return await ExerciseModel.updateExercise(userId, exerciseId, updateData);
    } catch (error) {
      console.error('ExerciseService - updateExercise error:', error);
      throw error;
    }
  }

  // Delete exercise activity
  static async deleteExercise(userId: number, exerciseId: number): Promise<void> {
    
    if (!exerciseId || exerciseId <= 0) {
      throw new Error('Invalid exercise ID');
    }

    try {
      await ExerciseModel.deleteExercise(userId, exerciseId);
    } catch (error) {
      console.error('ExerciseService - deleteExercise error:', error);
      throw error;
    }
  }

  // Delete exercise activities by date and type
  static async deleteExerciseActivitiesByDateAndType(userId: number, activityDate: string, activityType: string): Promise<number> {
    
    if (!isValidDate(activityDate)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD format.');
    }

    if (!activityType || activityType.trim().length === 0) {
      throw new Error('Invalid activity type');
    }

    try {
      const deletedCount = await ExerciseModel.deleteExerciseActivitiesByDateAndType(userId, activityDate, activityType);
      return deletedCount;
    } catch (error) {
      console.error('ExerciseService - deleteExerciseActivitiesByDateAndType error:', error);
      throw error;
    }
  }

  // Get available activity types
  static async getActivityTypes(): Promise<string[]> {
    try {
      return await ExerciseModel.getActivityTypes();
    } catch (error) {
      console.error('ExerciseService - getActivityTypes error:', error);
      throw error;
    }
  }

  // Get exercise summary for a specific date
  static async getExerciseSummaryByDate(userId: number, date: string): Promise<ExerciseSummary> {
    // Validate date format
    if (!isValidDate(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD format.');
    }

    try {
      return await ExerciseModel.getExerciseSummaryByDate(userId, date);
    } catch (error) {
      console.error('ExerciseService - getExerciseSummaryByDate error:', error);
      throw error;
    }
  }

  // Calculate calories burned based on activity type and duration
  static calculateCaloriesBurned(activityType: string, durationSeconds: number, userWeight?: number): number {
    const weight = userWeight || 70;
    
    // MET values for different activities (Metabolic Equivalent of Task)
    const metValues: { [key: string]: number } = {
      'walking': 3.5,
      'running': 8.0,
      'cycling': 6.0,
      'yoga': 2.5,
      'stretching': 2.0,
      'zumba': 6.5,
    };

    const met = metValues[activityType.toLowerCase()] || 4.0; // Default MET value
    
    // Formula: Calories = MET × Weight (kg) × Duration (hours)
    const durationHours = durationSeconds / 3600; 
    const calories = Math.round(met * weight * durationHours);
    
    return Math.max(calories, 1); // Ensure at least 1 calorie
  }

  // Get exercise statistics for a date range
  static async getExerciseStats(userId: number, startDate: string, endDate: string): Promise<{
    totalActivities: number;
    totalDuration: number;
    totalCaloriesBurned: number;
    averageDuration: number;
    averageCaloriesPerActivity: number;
    mostCommonActivity: string;
  }> {
    try {
      const activities = await ExerciseModel.getExerciseHistory(userId, {});
      
      // Filter activities within date range
      const filteredActivities = activities.filter(activity => 
        activity.activity_date >= startDate && activity.activity_date <= endDate
      );

      if (filteredActivities.length === 0) {
        return {
          totalActivities: 0,
          totalDuration: 0,
          totalCaloriesBurned: 0,
          averageDuration: 0,
          averageCaloriesPerActivity: 0,
          mostCommonActivity: 'None'
        };
      }

      const totalActivities = filteredActivities.length;
      const totalDuration = filteredActivities.reduce((sum, activity) => sum + activity.duration_seconds, 0);
      const totalCaloriesBurned = filteredActivities.reduce((sum, activity) => sum + activity.calories_burned, 0);
      const averageDuration = Math.round(totalDuration / totalActivities);
      const averageCaloriesPerActivity = Math.round(totalCaloriesBurned / totalActivities);

      // Find most common activity
      const activityCounts: { [key: string]: number } = {};
      filteredActivities.forEach(activity => {
        activityCounts[activity.activity_type] = (activityCounts[activity.activity_type] || 0) + 1;
      });

      const mostCommonActivity = Object.keys(activityCounts).reduce((a, b) => 
        activityCounts[a] > activityCounts[b] ? a : b
      );

      return {
        totalActivities,
        totalDuration,
        totalCaloriesBurned,
        averageDuration,
        averageCaloriesPerActivity,
        mostCommonActivity
      };
    } catch (error) {
      console.error('ExerciseService - getExerciseStats error:', error);
      throw error;
    }
  }
}
