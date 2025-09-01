import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../types/auth.types';
import { SugarService } from '../services/sugarService';

export class SugarController {
  /**
   * Creates a new blood sugar record for the authenticated user
   * @param req - The authenticated request containing blood sugar data
   * @param res - The response object
   * @returns Promise<void>
   */
  static async createSugarRecord(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array()
        });
      }

      const { meal_type, blood_sugar_value, record_date } = req.body;
      const userId = req.user!.userId;

      const record = await SugarService.createSugarRecord({
        user_id: userId,
        meal_type,
        blood_sugar_value,
        record_date
      });

      // Get blood sugar status
      const status = SugarService.getBloodSugarStatus(blood_sugar_value);

      res.json({
        success: true,
        message: 'Blood sugar record created successfully',
        record: {
          ...record,
          status
        }
      });
    } catch (error) {
      console.error('Create sugar record error:', error);
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
   * Gets blood sugar records for the authenticated user with optional filters
   * @param req - The authenticated request with optional record_date and meal_type parameters
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getSugarRecords(req: AuthenticatedRequest, res: Response) {
    try {
      const { record_date, meal_type } = req.query;
      const userId = req.user!.userId;

      const records = await SugarService.getSugarRecords(
        userId,
        record_date as string,
        meal_type as string
      );

      // Add status to each record
      const recordsWithStatus = records.map(record => ({
        ...record,
        status: SugarService.getBloodSugarStatus(record.blood_sugar_value)
      }));

      res.json({
        success: true,
        records: recordsWithStatus
      });
    } catch (error) {
      console.error('Get sugar records error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Gets blood sugar summary for the authenticated user for a specific date
   * @param req - The authenticated request with optional record_date parameter
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getSugarSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const { record_date } = req.query;
      const userId = req.user!.userId;

      const summary = await SugarService.getSugarSummary(userId, record_date as string);

      res.json({
        success: true,
        summary
      });
    } catch (error) {
      console.error('Get sugar summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Gets today's blood sugar summary for the authenticated user
   * @param req - The authenticated request
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getTodaySugarSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const summary = await SugarService.getTodaySugarSummary(userId);

      res.json({
        success: true,
        summary
      });
    } catch (error) {
      console.error('Get today sugar summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Updates an existing blood sugar record for the authenticated user
   * @param req - The authenticated request containing record ID and update data
   * @param res - The response object
   * @returns Promise<void>
   */
  static async updateSugarRecord(req: AuthenticatedRequest, res: Response) {
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
      const { meal_type, blood_sugar_value, record_date } = req.body;
      const userId = req.user!.userId;

      const record = await SugarService.updateSugarRecord(parseInt(id), userId, {
        meal_type,
        blood_sugar_value,
        record_date
      });

      // Get blood sugar status
      const status = SugarService.getBloodSugarStatus(blood_sugar_value);

      res.json({
        success: true,
        message: 'Blood sugar record updated successfully',
        record: {
          ...record,
          status
        }
      });
    } catch (error) {
      console.error('Update sugar record error:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
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
   * Deletes a blood sugar record for the authenticated user
   * @param req - The authenticated request containing record ID
   * @param res - The response object
   * @returns Promise<void>
   */
  static async deleteSugarRecord(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      await SugarService.deleteSugarRecord(parseInt(id), userId);

      res.json({
        success: true,
        message: 'Blood sugar record deleted successfully'
      });
    } catch (error) {
      console.error('Delete sugar record error:', error);
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
   * Deletes blood sugar records by date and type for the authenticated user
   * @param req - The authenticated request containing record_date and meal_type parameters
   * @param res - The response object
   * @returns Promise<void>
   */
  static async deleteSugarRecordsByDateAndType(req: AuthenticatedRequest, res: Response) {
    try {
      const { record_date, meal_type } = req.query;
      const userId = req.user!.userId;

      if (!record_date || !meal_type) {
        return res.status(400).json({
          success: false,
          message: 'record_date and meal_type are required'
        });
      }

      const deletedCount = await SugarService.deleteSugarRecordsByDateAndType(
        userId,
        record_date as string,
        meal_type as string
      );

      res.json({
        success: true,
        message: `${deletedCount} blood sugar records deleted successfully`,
        deletedCount
      });
    } catch (error) {
      console.error('Delete sugar records by date and type error:', error);
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
}
