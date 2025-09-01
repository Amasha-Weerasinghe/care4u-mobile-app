import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../constants/config';
import { BaseApiService } from './baseApiService';
import {
  LoginRequest,
  LoginResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
  CompleteProfileRequest,
  CompleteProfileResponse,
  GetUserResponse,
} from '../types';

class AuthService extends BaseApiService {
  // Authentication APIs
  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.post(API_ENDPOINTS.LOGIN, data);
  }

  async verifyOTP(data: VerifyOTPRequest): Promise<VerifyOTPResponse> {
    return this.post(API_ENDPOINTS.VERIFY_OTP, data);
  }

  async completeProfile(data: CompleteProfileRequest): Promise<CompleteProfileResponse> {
    return this.post(API_ENDPOINTS.COMPLETE_PROFILE, data);
  }

  async updateProfile(data: CompleteProfileRequest): Promise<CompleteProfileResponse> {
    return this.put(API_ENDPOINTS.UPDATE_PROFILE, data);
  }

  async getUser(): Promise<GetUserResponse> {
    return this.get(API_ENDPOINTS.GET_USER);
  }

  async checkAuth(): Promise<GetUserResponse> {
    return this.get(API_ENDPOINTS.CHECK_AUTH);
  }

  // Token management
  async setAuthToken(token: string): Promise<void> {
    await AsyncStorage.setItem('auth_token', token);
  }

  async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('auth_token');
  }

  async removeAuthToken(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
  }

  // User data management
  async setUserData(userData: any): Promise<void> {
    await AsyncStorage.setItem('user_data', JSON.stringify(userData));
  }

  async getUserData(): Promise<any> {
    const userData = await AsyncStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  async removeUserData(): Promise<void> {
    await AsyncStorage.removeItem('user_data');
  }

  // Logout
  async logout(): Promise<void> {
    await this.removeAuthToken();
    await this.removeUserData();
  }
}

export default new AuthService();
