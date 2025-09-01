import pool from '../config/database';
import { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest } from '../types/appointment.types';
import { isValidDate } from '../utils/timeUtils';

export class AppointmentModel {
  // Create a new appointment
  static async create(appointment: CreateAppointmentRequest): Promise<Appointment> {
    let client;
    try {
      client = await pool.connect();

      // Ensure the date is properly formatted
      let processedDate = appointment.date;

      // If the date contains time information, extract only the date part
      if (processedDate.includes('T')) {
        processedDate = processedDate.split('T')[0];
      }

      // Validate the date format (YYYY-MM-DD)
      if (!isValidDate(processedDate)) {
        throw new Error('Invalid date format. Expected YYYY-MM-DD');
      }

      const query = `
        INSERT INTO appointments (user_id, title, date, time, location, notes)
        VALUES ($1, $2, $3::date, $4, $5, $6)
        RETURNING id, user_id, title, TO_CHAR(date, 'YYYY-MM-DD') as date, time, location, notes, created_at, updated_at
      `;

      const values = [
        appointment.user_id,
        appointment.title,
        processedDate,
        appointment.time,
        appointment.location || null,
        appointment.notes || null
      ];

      const result = await client.query(query, values);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  // Get all appointments for a user
  static async getByUserId(userId: number): Promise<Appointment[]> {
    let client;
    try {
      client = await pool.connect();
      const query = `
        SELECT id, user_id, title, TO_CHAR(date, 'YYYY-MM-DD') as date, time, location, notes, created_at, updated_at
        FROM appointments 
        WHERE user_id = $1 
        ORDER BY date ASC, time ASC
      `;

      const result = await client.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting appointments by user ID:', error);
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  // Get appointment by ID
  static async getById(id: number, userId: number): Promise<Appointment | null> {
    let client;
    try {
      client = await pool.connect();
      const query = `
        SELECT id, user_id, title, TO_CHAR(date, 'YYYY-MM-DD') as date, time, location, notes, created_at, updated_at
        FROM appointments 
        WHERE id = $1 AND user_id = $2
      `;

      const result = await client.query(query, [id, userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting appointment by ID:', error);
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  // Update an appointment
  static async update(id: number, userId: number, updates: UpdateAppointmentRequest): Promise<Appointment | null> {
    let client;
    try {
      client = await pool.connect();
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (updates.title !== undefined) {
        fields.push(`title = $${paramCount++}`);
        values.push(updates.title);
      }
      if (updates.date !== undefined) {
        let processedDate = updates.date;
        if (processedDate.includes('T')) {
          processedDate = processedDate.split('T')[0];
        }
        fields.push(`date = $${paramCount++}::date`);
        values.push(processedDate);
      }
      if (updates.time !== undefined) {
        fields.push(`time = $${paramCount++}`);
        values.push(updates.time);
      }
      if (updates.location !== undefined) {
        fields.push(`location = $${paramCount++}`);
        values.push(updates.location);
      }
      if (updates.notes !== undefined) {
        fields.push(`notes = $${paramCount++}`);
        values.push(updates.notes);
      }

      if (fields.length === 0) {
        return null;
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id, userId);

      const query = `
        UPDATE appointments 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount++} AND user_id = $${paramCount++}
        RETURNING id, user_id, title, TO_CHAR(date, 'YYYY-MM-DD') as date, time, location, notes, created_at, updated_at
      `;

      const result = await client.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  // Delete an appointment
  static async delete(id: number, userId: number): Promise<boolean> {
    let client;
    try {
      client = await pool.connect();
      const query = `
        DELETE FROM appointments 
        WHERE id = $1 AND user_id = $2
      `;

      const result = await client.query(query, [id, userId]);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  // Get appointments for a specific date
  static async getByDate(userId: number, date: string): Promise<Appointment[]> {
    let client;
    try {
      client = await pool.connect();
      let processedDate = date;
      if (processedDate.includes('T')) {
        processedDate = processedDate.split('T')[0];
      }

      const query = `
        SELECT id, user_id, title, TO_CHAR(date, 'YYYY-MM-DD') as date, time, location, notes, created_at, updated_at
        FROM appointments 
        WHERE user_id = $1 AND date = $2::date
        ORDER BY time ASC
      `;

      const result = await client.query(query, [userId, processedDate]);
      return result.rows;
    } catch (error) {
      console.error('Error getting appointments by date:', error);
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  // Helper function to convert time to minutes for comparison
  private static timeToMinutes(timeStr: string): number {
    try {
      if (!timeStr || typeof timeStr !== 'string') {
        console.error('Invalid time string:', timeStr);
        return 0;
      }

      // Remove AM/PM and convert to 24-hour format
      let time = timeStr.trim().toUpperCase();
      let isPM = false;

      if (time.includes('PM')) {
        isPM = true;
        time = time.replace('PM', '').trim();
      } else if (time.includes('AM')) {
        time = time.replace('AM', '').trim();
      }

      const parts = time.split(':');
      if (parts.length < 2) {
        console.error('Invalid time format (missing colon):', timeStr);
        return 0;
      }

      let hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1] || '0');

      // Validate that we have valid numbers
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.error('Invalid time values:', timeStr, 'hours:', hours, 'minutes:', minutes);
        return 0;
      }

      // Convert 12-hour to 24-hour format
      if (isPM && hours !== 12) {
        hours += 12;
      } else if (!isPM && hours === 12) {
        hours = 0;
      }

      return hours * 60 + minutes;
    } catch (error) {
      console.error('Error parsing time:', timeStr, error);
      return 0;
    }
  }

  // Helper function to check if appointment is in the past
  private static isAppointmentPast(appointment: Appointment): boolean {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const currentDate = `${year}-${month}-${day}`;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const [appointmentYear, appointmentMonth, appointmentDay] = appointment.date.split('-').map(Number);
      const [currentYear, currentMonth, currentDay] = currentDate.split('-').map(Number);

      // Compare dates numerically
      if (appointmentYear < currentYear) {
        return true;
      }
      if (appointmentYear > currentYear) {
        return false;
      }

      if (appointmentMonth < currentMonth) {
        return true;
      }
      if (appointmentMonth > currentMonth) {
        return false;
      }

      if (appointmentDay < currentDay) {
        return true;
      }
      if (appointmentDay > currentDay) {
        return false;
      }

      // If same date, compare times
      const appointmentMinutes = this.timeToMinutes(appointment.time);
      const isPast = appointmentMinutes < currentMinutes;
      return isPast;
    } catch (error) {
      console.error('Error checking if appointment is past:', error, appointment);
      return false;
    }
  }

  // Get upcoming appointments
  static async getUpcoming(userId: number, limit: number = 10): Promise<Appointment[]> {
    let client;
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Database query timeout'));
        }, 10000);
      });

      const clientPromise = pool.connect();

      client = await Promise.race([clientPromise, timeoutPromise]);

      // Get all appointments for the user
      const query = `
        SELECT id, user_id, title, TO_CHAR(date, 'YYYY-MM-DD') as date, time, location, notes, created_at, updated_at
        FROM appointments 
        WHERE user_id = $1
        ORDER BY date ASC, time ASC
      `;

      const result = await client.query(query, [userId]);
      const allAppointments = result.rows;

      // Filter upcoming appointments using the helper method
      const upcomingAppointments = allAppointments.filter(appointment => !this.isAppointmentPast(appointment));

      // Apply limit
      return upcomingAppointments.slice(0, limit);
    } catch (error) {
      console.error('Error in getUpcoming:', error);
      throw error;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (client) {
        client.release();
      }
    }
  }

  // Get past appointments
  static async getPast(userId: number, limit: number = 10): Promise<Appointment[]> {
    let client;
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Database query timeout'));
        }, 10000);
      });

      const clientPromise = pool.connect();

      client = await Promise.race([clientPromise, timeoutPromise]);

      // Get all appointments for the user
      const query = `
        SELECT id, user_id, title, TO_CHAR(date, 'YYYY-MM-DD') as date, time, location, notes, created_at, updated_at
        FROM appointments 
        WHERE user_id = $1
        ORDER BY date DESC, time DESC
      `;

      const result = await client.query(query, [userId]);
      const allAppointments = result.rows;

      // Filter past appointments using the helper method
      const pastAppointments = allAppointments.filter(appointment => this.isAppointmentPast(appointment));

      // Apply limit
      return pastAppointments.slice(0, limit);
    } catch (error) {
      console.error('Error in getPast:', error);
      throw error;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (client) {
        client.release();
      }
    }
  }
}
