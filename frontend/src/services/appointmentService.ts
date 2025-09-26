import { API_ENDPOINTS, STORAGE_KEYS } from '../constants/config';
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

  // Get all appointments for the user with retry logic
  async getAppointments(): Promise<GetAppointmentsResponse> {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        return await this.get(API_ENDPOINTS.APPOINTMENTS);
      } catch (error: any) {
        retryCount++;
        console.error(`Error loading appointments (attempt ${retryCount}/${maxRetries}):`, error);
        
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
          throw error;
        }
        
        if (retryCount === maxRetries) {
          console.error('Failed to load appointments after all retries');
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    throw new Error('Failed to load appointments');
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

  // Get upcoming appointments with retry logic
  async getUpcomingAppointments(limit: number = 10): Promise<GetAppointmentsResponse> {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        return await this.get(`${API_ENDPOINTS.APPOINTMENTS_UPCOMING}?limit=${limit}`);
      } catch (error: any) {
        retryCount++;
        console.error(`Error loading upcoming appointments (attempt ${retryCount}/${maxRetries}):`, error);
        
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
          throw error;
        }
        
        if (retryCount === maxRetries) {
          console.error('Failed to load upcoming appointments after all retries');
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    throw new Error('Failed to load upcoming appointments');
  }

  // Get past appointments with retry logic
  async getPastAppointments(limit: number = 10): Promise<GetAppointmentsResponse> {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        return await this.get(`${API_ENDPOINTS.APPOINTMENTS_PAST}?limit=${limit}`);
      } catch (error: any) {
        retryCount++;
        console.error(`Error loading past appointments (attempt ${retryCount}/${maxRetries}):`, error);
        
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
          throw error;
        }
        
        if (retryCount === maxRetries) {
          console.error('Failed to load past appointments after all retries');
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    throw new Error('Failed to load past appointments');
  }
}

// Export a singleton instance
export const appointmentService = new AppointmentService();
