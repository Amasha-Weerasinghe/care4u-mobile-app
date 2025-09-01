import { BaseEntity } from './common.types';

export interface SugarRecord extends BaseEntity {
  user_id: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  blood_sugar_value: number;
  record_date: string;
}

export interface SugarSummary {
  totalRecords: number;
  averageBloodSugar: number;
  highestBloodSugar: number;
  lowestBloodSugar: number;
  records: SugarRecord[];
}

export interface CreateSugarRecordRequest {
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  blood_sugar_value: number;
  record_date: string;
}

export interface UpdateSugarRecordRequest {
  meal_type?: 'breakfast' | 'lunch' | 'dinner';
  blood_sugar_value?: number;
  record_date?: string;
}

export interface SugarStatus {
  status: 'normal' | 'elevated' | 'high' | 'very_high' | 'low' | 'very_low';
  message: string;
  color: string;
}
