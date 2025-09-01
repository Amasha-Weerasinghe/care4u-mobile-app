import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appointment } from '../types';
import { appointmentService } from '../services/appointmentService';

interface AppointmentContextType {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  addAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<void>;
  removeAppointment: (id: number) => Promise<void>;
  updateAppointment: (id: number, appointment: Partial<Appointment>) => Promise<void>;
  refreshAppointments: () => Promise<void>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};

interface AppointmentProviderProps {
  children: ReactNode;
}

export const AppointmentProvider: React.FC<AppointmentProviderProps> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load appointments on mount
  useEffect(() => {
    refreshAppointments();
  }, []);

  const refreshAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentService.getAppointments();
      setAppointments(response.appointments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
      console.error('Error loading appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const addAppointment = async (appointmentData: Omit<Appointment, 'id'>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentService.createAppointment(appointmentData);
      setAppointments(prev => [...prev, response.appointment]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create appointment');
      console.error('Error creating appointment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeAppointment = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await appointmentService.deleteAppointment(id);
      setAppointments(prev => prev.filter(apt => apt.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete appointment');
      console.error('Error deleting appointment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAppointment = async (id: number, appointmentData: Partial<Appointment>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentService.updateAppointment(id, appointmentData);
      setAppointments(prev => prev.map(apt => apt.id === id ? response.appointment : apt));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update appointment');
      console.error('Error updating appointment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppointmentContext.Provider value={{
      appointments,
      loading,
      error,
      addAppointment,
      removeAppointment,
      updateAppointment,
      refreshAppointments,
    }}>
      {children}
    </AppointmentContext.Provider>
  );
};
