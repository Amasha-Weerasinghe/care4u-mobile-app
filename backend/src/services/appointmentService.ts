import { AppointmentModel } from '../models/appointmentModel';
import { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest } from '../types/appointment.types';
import { isValidDate, isPastDate } from '../utils/timeUtils';

export class AppointmentService {
  // Create a new appointment
  static async createAppointment(appointmentData: CreateAppointmentRequest): Promise<Appointment> {
    try {
      // Validate required fields
      if (!appointmentData.title || !appointmentData.date || !appointmentData.time) {
        throw new Error('Title, date, and time are required');
      }

      // Validate date format (YYYY-MM-DD)
      if (!isValidDate(appointmentData.date)) {
        throw new Error('Invalid date format. Use YYYY-MM-DD');
      }

      // Validate time format 
      const timeRegex = /^(\d{1,2}):(\d{2})(:\d{2})?\s*(AM|PM|am|pm)?$/;
      if (!timeRegex.test(appointmentData.time)) {
        throw new Error('Invalid time format. Use HH:MM, HH:MM:SS, or 12-hour format like "4:30 PM"');
      }

      // Check if date is not in the past
      if (isPastDate(appointmentData.date)) {
        throw new Error('Appointment date cannot be in the past');
      }

      const appointment = await AppointmentModel.create(appointmentData);
      return appointment;
    } catch (error) {
      throw error;
    }
  }

  // Get all appointments for a user
  static async getUserAppointments(userId: number): Promise<Appointment[]> {
    try {
      const appointments = await AppointmentModel.getByUserId(userId);
      return appointments;
    } catch (error) {
      throw error;
    }
  }

  // Get appointment by ID
  static async getAppointmentById(id: number, userId: number): Promise<Appointment | null> {
    try {
      const appointment = await AppointmentModel.getById(id, userId);
      return appointment;
    } catch (error) {
      throw error;
    }
  }

  // Update an appointment
  static async updateAppointment(id: number, userId: number, updates: UpdateAppointmentRequest): Promise<Appointment | null> {
    try {
      // Validate date format if provided
      if (updates.date) {
        if (!isValidDate(updates.date)) {
          throw new Error('Invalid date format. Use YYYY-MM-DD');
        }

        // Check if date is not in the past
        if (isPastDate(updates.date)) {
          throw new Error('Appointment date cannot be in the past');
        }
      }

      // Validate time format if provided
      if (updates.time) {
        const timeRegex = /^(\d{1,2}):(\d{2})(:\d{2})?\s*(AM|PM|am|pm)?$/;
        if (!timeRegex.test(updates.time)) {
          throw new Error('Invalid time format. Use HH:MM, HH:MM:SS, or 12-hour format like "4:30 PM"');
        }
      }

      const appointment = await AppointmentModel.update(id, userId, updates);
      return appointment;
    } catch (error) {
      throw error;
    }
  }

  // Delete an appointment
  static async deleteAppointment(id: number, userId: number): Promise<boolean> {
    try {
      const deleted = await AppointmentModel.delete(id, userId);
      return deleted;
    } catch (error) {
      throw error;
    }
  }

  // Get appointments for a specific date
  static async getAppointmentsByDate(userId: number, date: string): Promise<Appointment[]> {
    try {
      // Validate date format
      if (!isValidDate(date)) {
        throw new Error('Invalid date format. Use YYYY-MM-DD');
      }

      const appointments = await AppointmentModel.getByDate(userId, date);
      return appointments;
    } catch (error) {
      throw error;
    }
  }

  // Get upcoming appointments
  static async getUpcomingAppointments(userId: number, limit: number = 10): Promise<Appointment[]> {
    try {
      const appointments = await AppointmentModel.getUpcoming(userId, limit);
      return appointments;
    } catch (error) {
      throw error;
    }
  }

  // Get past appointments
  static async getPastAppointments(userId: number, limit: number = 10): Promise<Appointment[]> {
    try {
      const appointments = await AppointmentModel.getPast(userId, limit);
      return appointments;
    } catch (error) {
      throw error;
    }
  }
}
