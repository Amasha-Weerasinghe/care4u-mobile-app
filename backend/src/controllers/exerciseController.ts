import { Request, Response } from 'express';
import { ExerciseService } from '../services/exerciseService';
import { CreateExerciseRequest, UpdateExerciseRequest, GetExerciseHistoryRequest } from '../types/exercise.types';
import { AuthenticatedRequest } from '../types/auth.types';

export class ExerciseController {
  /**
   * Creates a new exercise activity for the authenticated user
   * @param req - The authenticated request containing exercise data
   * @param res - The response object
   * @returns Promise<void>
   */
  static async createExercise(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const exerciseData: CreateExerciseRequest = req.body;

      const exercise = await ExerciseService.createExercise(userId, exerciseData);

      res.status(201).json({
        success: true,
        message: 'Exercise activity created successfully',
        activity: exercise
      });
    } catch (error) {
      console.error('ExerciseController - createExercise error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create exercise activity'
      });
    }
  }

  /**
   * Gets today's exercise summary for the authenticated user
   * @param req - The authenticated request
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getTodayExerciseSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      const summary = await ExerciseService.getTodayExerciseSummary(userId);

      res.status(200).json({
        success: true,
        summary
      });
    } catch (error) {
      console.error('ExerciseController - getTodayExerciseSummary error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get today\'s exercise summary'
      });
    }
  }

  /**
   * Gets daily exercise summary for a specific date for the authenticated user
   * @param req - The authenticated request containing date parameter
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getDailyExerciseSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { date } = req.params;

      if (!date) {
        res.status(400).json({
          success: false,
          message: 'Date parameter is required'
        });
        return;
      }

      const summary = await ExerciseService.getDailyExerciseSummary(userId, date);

      res.status(200).json({
        success: true,
        summary
      });
    } catch (error) {
      console.error('ExerciseController - getDailyExerciseSummary error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get daily exercise summary'
      });
    }
  }

  /**
   * Gets exercise history for the authenticated user with optional filters
   * @param req - The authenticated request with optional date and activity_type parameters
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getExerciseHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { date, activity_type } = req.query;

      const params: GetExerciseHistoryRequest = {};
      if (date && typeof date === 'string') {
        params.date = date;
      }
      if (activity_type && typeof activity_type === 'string') {
        params.activity_type = activity_type;
      }

      const activities = await ExerciseService.getExerciseHistory(userId, params);

      res.status(200).json({
        success: true,
        activities
      });
    } catch (error) {
      console.error('ExerciseController - getExerciseHistory error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get exercise history'
      });
    }
  }

  /**
   * Updates an existing exercise activity for the authenticated user
   * @param req - The authenticated request containing exercise ID and update data
   * @param res - The response object
   * @returns Promise<void>
   */
  static async updateExercise(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const exerciseId = parseInt(req.params.id);
      const updateData: UpdateExerciseRequest = req.body;

      if (isNaN(exerciseId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid exercise ID'
        });
        return;
      }

      const exercise = await ExerciseService.updateExercise(userId, exerciseId, updateData);

      res.status(200).json({
        success: true,
        message: 'Exercise activity updated successfully',
        activity: exercise
      });
    } catch (error) {
      console.error('ExerciseController - updateExercise error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update exercise activity'
      });
    }
  }

  /**
   * Deletes an exercise activity for the authenticated user
   * @param req - The authenticated request containing exercise ID
   * @param res - The response object
   * @returns Promise<void>
   */
  static async deleteExercise(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const exerciseId = parseInt(req.params.id);

      if (isNaN(exerciseId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid exercise ID'
        });
        return;
      }

      await ExerciseService.deleteExercise(userId, exerciseId);

      res.status(200).json({
        success: true,
        message: 'Exercise activity deleted successfully'
      });
    } catch (error) {
      console.error('ExerciseController - deleteExercise error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete exercise activity'
      });
    }
  }

  /**
   * Deletes exercise activities by date and type for the authenticated user
   * @param req - The authenticated request containing activity_date and activity_type parameters
   * @param res - The response object
   * @returns Promise<void>
   */
  static async deleteExerciseActivitiesByDateAndType(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { activity_date, activity_type } = req.query;

      if (!activity_date || typeof activity_date !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Activity date is required'
        });
        return;
      }

      if (!activity_type || typeof activity_type !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Activity type is required'
        });
        return;
      }

      const deletedCount = await ExerciseService.deleteExerciseActivitiesByDateAndType(userId, activity_date, activity_type);

      res.status(200).json({
        success: true,
        message: `${deletedCount} exercise activities deleted successfully`,
        deletedCount
      });
    } catch (error) {
      console.error('ExerciseController - deleteExerciseActivitiesByDateAndType error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete exercise activities'
      });
    }
  }

  /**
   * Gets available activity types for exercise tracking
   * @param req - The request object
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getActivityTypes(req: Request, res: Response): Promise<void> {
    try {
      const activityTypes = await ExerciseService.getActivityTypes();

      res.status(200).json({
        success: true,
        activity_types: activityTypes
      });
    } catch (error) {
      console.error('ExerciseController - getActivityTypes error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get activity types'
      });
    }
  }

  /**
   * Gets exercise summary for a specific date for the authenticated user
   * @param req - The request object containing date parameter
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getExerciseSummaryByDate(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { date } = req.params;

      if (!date) {
        res.status(400).json({
          success: false,
          message: 'Date parameter is required'
        });
        return;
      }

      const summary = await ExerciseService.getExerciseSummaryByDate(userId, date);

      res.status(200).json({
        success: true,
        summary
      });
    } catch (error) {
      console.error('ExerciseController - getExerciseSummaryByDate error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get exercise summary for date'
      });
    }
  }

  /**
   * Gets exercise statistics for a date range for the authenticated user
   * @param req - The authenticated request containing startDate and endDate parameters
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getExerciseStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Both startDate and endDate parameters are required in YYYY-MM-DD format'
        });
        return;
      }

      const stats = await ExerciseService.getExerciseStats(userId, startDate, endDate);

      res.status(200).json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('ExerciseController - getExerciseStats error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get exercise statistics'
      });
    }
  }

  /**
   * Calculates calories burned for a specific activity
   * @param req - The request object containing activityType, durationMinutes, and optional userWeight
   * @param res - The response object
   * @returns Promise<void>
   */
  static async calculateCalories(req: Request, res: Response): Promise<void> {
    try {
      const { activityType, durationMinutes, userWeight } = req.body;

      if (!activityType || !durationMinutes) {
        res.status(400).json({
          success: false,
          message: 'Activity type and duration are required'
        });
        return;
      }

      if (durationMinutes <= 0) {
        res.status(400).json({
          success: false,
          message: 'Duration must be greater than 0'
        });
        return;
      }

      const caloriesBurned = ExerciseService.calculateCaloriesBurned(
        activityType,
        durationMinutes,
        userWeight
      );

      res.status(200).json({
        success: true,
        calories_burned: caloriesBurned,
        activity_type: activityType,
        duration_minutes: durationMinutes
      });
    } catch (error) {
      console.error('ExerciseController - calculateCalories error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to calculate calories'
      });
    }
  }

  /**
   * Gets a specific exercise activity by ID for the authenticated user
   * @param req - The authenticated request containing exercise ID
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getExerciseById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const exerciseId = parseInt(req.params.id);

      if (isNaN(exerciseId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid exercise ID'
        });
        return;
      }

      // Get all activities and find the specific one
      const activities = await ExerciseService.getExerciseHistory(userId, {});
      const exercise = activities.find(activity => activity.id === exerciseId);

      if (!exercise) {
        res.status(404).json({
          success: false,
          message: 'Exercise activity not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        activity: exercise
      });
    } catch (error) {
      console.error('ExerciseController - getExerciseById error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get exercise activity'
      });
    }
  }
}
