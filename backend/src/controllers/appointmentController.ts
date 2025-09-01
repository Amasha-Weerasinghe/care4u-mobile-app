import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import { AppointmentService } from '../services/appointmentService';
import { CreateAppointmentRequest, UpdateAppointmentRequest } from '../types/appointment.types';

export class AppointmentController {
  /**
   * Creates a new appointment for the authenticated user
   * @param req - The authenticated request containing appointment data
   * @param res - The response object
   * @returns Promise<void>
   */
  static async createAppointment(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const appointmentData: CreateAppointmentRequest = {
        user_id: userId,
        title: req.body.title,
        date: req.body.date,
        time: req.body.time,
        location: req.body.location,
        notes: req.body.notes
      };
      
      const appointment = await AppointmentService.createAppointment(appointmentData);
      
      res.status(201).json({
        success: true,
        message: 'Appointment created successfully',
        appointment
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create appointment'
      });
    }
  }

  /**
   * Gets all appointments for the authenticated user
   * @param req - The authenticated request
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getUserAppointments(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const appointments = await AppointmentService.getUserAppointments(userId);
      
      res.status(200).json({
        success: true,
        appointments
      });
    } catch (error) {
      console.error('Error fetching appointments:', error);
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
   * Gets a specific appointment by ID for the authenticated user
   * @param req - The authenticated request containing appointment ID
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getAppointmentById(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const appointmentId = parseInt(req.params.id);

      if (isNaN(appointmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid appointment ID'
        });
      }

      const appointment = await AppointmentService.getAppointmentById(appointmentId, userId);
      
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      res.status(200).json({
        success: true,
        appointment
      });
    } catch (error) {
      console.error('Error fetching appointment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch appointment'
      });
    }
  }

  /**
   * Updates an existing appointment for the authenticated user
   * @param req - The authenticated request containing appointment ID and update data
   * @param res - The response object
   * @returns Promise<void>
   */
  static async updateAppointment(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const appointmentId = parseInt(req.params.id);

      if (isNaN(appointmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid appointment ID'
        });
      }

      const updates: UpdateAppointmentRequest = {
        title: req.body.title,
        date: req.body.date,
        time: req.body.time,
        location: req.body.location,
        notes: req.body.notes
      };

      const appointment = await AppointmentService.updateAppointment(appointmentId, userId, updates);
      
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Appointment updated successfully',
        appointment
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update appointment'
      });
    }
  }

  /**
   * Deletes an appointment for the authenticated user
   * @param req - The authenticated request containing appointment ID
   * @param res - The response object
   * @returns Promise<void>
   */
  static async deleteAppointment(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const appointmentId = parseInt(req.params.id);

      if (isNaN(appointmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid appointment ID'
        });
      }

      const deleted = await AppointmentService.deleteAppointment(appointmentId, userId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Appointment deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete appointment'
      });
    }
  }

  /**
   * Gets appointments for a specific date for the authenticated user
   * @param req - The authenticated request containing date parameter
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getAppointmentsByDate(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { date } = req.params;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date parameter is required'
        });
      }

      const appointments = await AppointmentService.getAppointmentsByDate(userId, date);
      
      res.status(200).json({
        success: true,
        appointments
      });
    } catch (error) {
      console.error('Error fetching appointments by date:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch appointments'
      });
    }
  }

  /**
   * Gets upcoming appointments for the authenticated user
   * @param req - The authenticated request with optional limit parameter
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getUpcomingAppointments(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const appointments = await AppointmentService.getUpcomingAppointments(userId, limit);
      
      res.status(200).json({
        success: true,
        appointments
      });
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch upcoming appointments'
      });
    }
  }

  /**
   * Gets past appointments for the authenticated user
   * @param req - The authenticated request with optional limit parameter
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getPastAppointments(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const appointments = await AppointmentService.getPastAppointments(userId, limit);
      
      res.status(200).json({
        success: true,
        appointments
      });
    } catch (error) {
      console.error('Error fetching past appointments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch past appointments'
      });
    }
  }
}
