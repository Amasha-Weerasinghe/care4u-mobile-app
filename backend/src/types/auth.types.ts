import { Request } from 'express';
import { BaseEntity } from './common.types';

export interface User extends BaseEntity {
  email: string;
  is_verified?: boolean;
  first_name?: string;
  last_name?: string;
  dietary_preference?: string;
  birth_date?: string;
  gender?: string;
  emergency_contact_number?: string;
  emergency_contact_name?: string;
  contact_number?: string;
  height?: number;
  weight?: number;
  bmi?: number;
  is_profile_complete?: boolean;
  calorie_intake_goal?: number;
  calorie_burn_goal?: number;
}

// Simplified user for API responses
export interface UserResponse {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  is_profile_complete?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

export interface OTPResult {
  success: boolean;
  message: string;
  otp?: string;
  userId?: number;
}

export interface ProfileResult {
  success: boolean;
  message: string;
  user?: UserResponse;
  token?: string;
  profile?: User;
}

export interface LoginRequest {
  email: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface CompleteProfileRequest {
  first_name: string;
  last_name: string;
  contact_number: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  emergency_contact_name: string;
  emergency_contact_number: string;
  dietary_preference: 'veg' | 'non-veg';
  calorie_intake_goal: number;
  calorie_burn_goal: number;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  contact_number?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  emergency_contact_name?: string;
  emergency_contact_number?: string;
  dietary_preference?: 'veg' | 'non-veg';
  calorie_intake_goal?: number;
  calorie_burn_goal?: number;
}
