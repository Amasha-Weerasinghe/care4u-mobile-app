import { BaseEntity } from './common.types';

export interface ExerciseActivity extends BaseEntity {
  user_id: number;
  activity_type: string;
  duration_seconds: number;
  calories_burned: number;
  notes?: string;
  activity_date: string;
}

export interface ExerciseSummary {
  totalActivities: number;
  totalDuration: number;
  totalCaloriesBurned: number;
  averageCaloriesPerActivity: number;
  activities: ExerciseActivity[];
}

export interface CreateExerciseRequest {
  activity_type: string;
  duration_seconds: number;
  calories_burned: number;
  notes?: string;
  activity_date?: string;
}

export interface UpdateExerciseRequest {
  activity_type?: string;
  duration_seconds?: number;
  calories_burned?: number;
  notes?: string;
}

export interface GetExerciseHistoryRequest {
  date?: string;
  activity_type?: string;
}

export interface ExerciseActivityType {
  id: number;
  name: string;
  description?: string;
  averageCaloriesPerMinute: number;
}
