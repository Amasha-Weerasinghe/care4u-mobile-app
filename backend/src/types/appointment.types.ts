import { BaseEntity } from './common.types';

export interface Appointment extends BaseEntity {
  user_id: number;
  title: string;
  date: string;
  time: string;
  location?: string;
  notes?: string;
}

export interface CreateAppointmentRequest {
  user_id: number;
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

export interface AppointmentSummary {
  totalAppointments: number;
  upcomingAppointments: number;
  pastAppointments: number;
  nextAppointment?: Appointment;
}
