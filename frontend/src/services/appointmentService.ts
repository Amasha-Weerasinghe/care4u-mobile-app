import { API_ENDPOINTS } from '../constants/config';
import { BaseApiService } from './baseApiService';
import { Appointment } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CreateAppointmentRequest {
  title: string;
  date: string;
  time: string;
  location?: string;
  notes?: string;
}

export interface UpdateAppointmentRequest {
  title?: string;
  date?: string;
  time?: string;
  location?: string;
  notes?: string;
}

export interface GetAppointmentsResponse {
  success: boolean;
  appointments: Appointment[];
}

export interface GetAppointmentResponse {
  success: boolean;
  appointment: Appointment;
}

export interface CreateAppointmentResponse {
  success: boolean;
  message: string;
  appointment: Appointment;
}

export interface UpdateAppointmentResponse {
  success: boolean;
  message: string;
  appointment: Appointment;
}

export interface DeleteAppointmentResponse {
  success: boolean;
  message: string;
}

class AppointmentService extends BaseApiService {

  // Create a new appointment
  async createAppointment(appointmentData: CreateAppointmentRequest): Promise<CreateAppointmentResponse> {
    return this.post(API_ENDPOINTS.APPOINTMENTS, appointmentData);
  }

  // Get all appointments for the user
  async getAppointments(): Promise<GetAppointmentsResponse> {
    try {
      return await this.get(API_ENDPOINTS.APPOINTMENTS);
    } catch (error: any) {
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('user_data');
      }
      throw error;
    }
  }

  // Get appointment by ID
  async getAppointmentById(id: number): Promise<GetAppointmentResponse> {
    return this.get(API_ENDPOINTS.APPOINTMENT_BY_ID.replace(':id', id.toString()));
  }

  // Update an appointment
  async updateAppointment(id: number, updates: UpdateAppointmentRequest): Promise<UpdateAppointmentResponse> {
    return this.put(API_ENDPOINTS.APPOINTMENT_BY_ID.replace(':id', id.toString()), updates);
  }

  // Delete an appointment
  async deleteAppointment(id: number): Promise<DeleteAppointmentResponse> {
    return this.delete(API_ENDPOINTS.APPOINTMENT_BY_ID.replace(':id', id.toString()));
  }

  // Get appointments for a specific date
  async getAppointmentsByDate(date: string): Promise<GetAppointmentsResponse> {
    return this.get(API_ENDPOINTS.APPOINTMENTS_BY_DATE.replace(':date', date));
  }

  // Get upcoming appointments
  async getUpcomingAppointments(limit: number = 10): Promise<GetAppointmentsResponse> {
    try {
      return await this.get(`${API_ENDPOINTS.APPOINTMENTS_UPCOMING}?limit=${limit}`);
    } catch (error: any) {
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('user_data');
      }
      throw error;
    }
  }

  // Get past appointments
  async getPastAppointments(limit: number = 10): Promise<GetAppointmentsResponse> {
    try {
      return await this.get(`${API_ENDPOINTS.APPOINTMENTS_PAST}?limit=${limit}`);
    } catch (error: any) {
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('user_data');
      }
      throw error;
    }
  }
}

// Export a singleton instance
export const appointmentService = new AppointmentService();
