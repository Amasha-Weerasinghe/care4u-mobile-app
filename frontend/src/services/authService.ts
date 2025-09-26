import { API_ENDPOINTS } from '../constants/config';
import { BaseApiService } from './baseApiService';
import tokenManager from '../utils/tokenManager';
import {
  LoginRequest,
  LoginResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
  CompleteProfileRequest,
  CompleteProfileResponse,
  GetUserResponse,
} from '../types';

// TokenInfo interface is now in tokenManager.ts

class AuthService extends BaseApiService {
  private tokenCheckInterval: NodeJS.Timeout | null = null;
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

  // Token management - delegate to tokenManager
  async setAuthToken(token: string): Promise<void> {
    return tokenManager.setAuthToken(token);
  }

  async getAuthToken(): Promise<string | null> {
    return tokenManager.getAuthToken();
  }

  async removeAuthToken(): Promise<void> {
    return tokenManager.removeAuthToken();
  }

  // User data management - delegate to tokenManager
  async setUserData(userData: any): Promise<void> {
    return tokenManager.setUserData(userData);
  }

  async getUserData(): Promise<any> {
    return tokenManager.getUserData();
  }

  async removeUserData(): Promise<void> {
    return tokenManager.removeUserData();
  }

  // Logout
  async logout(): Promise<void> {
    await this.removeAuthToken();
    await this.removeUserData();
    this.stopTokenMonitoring();
  }

  // Token expiration handling - delegate to tokenManager
  isTokenExpired(token: string): boolean {
    return tokenManager.isTokenExpired(token);
  }

  getTokenInfo(token: string) {
    return tokenManager.getTokenInfo(token);
  }

  isTokenExpiringSoon(token: string): boolean {
    return tokenManager.isTokenExpiringSoon(token);
  }

  // Start monitoring token expiration
  startTokenMonitoring(): void {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
    }

    this.tokenCheckInterval = setInterval(async () => {
      await this.checkTokenStatus();
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  // Stop monitoring token expiration
  stopTokenMonitoring(): void {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
      this.tokenCheckInterval = null;
    }
  }

  // Check current token status
  private async checkTokenStatus(): Promise<void> {
    try {
      const token = await this.getAuthToken();
      if (!token) return;

      if (this.isTokenExpired(token)) {
        await this.handleAuthTokenExpiration();
      } else if (this.isTokenExpiringSoon(token)) {
        await this.handleTokenExpiringSoon();
      }
    } catch (error) {
      console.error('Error checking token status:', error);
    }
  }

  // Handle token expiration - delegate to tokenManager
  private async handleAuthTokenExpiration(): Promise<void> {
    try {
      await this.logout();
      await tokenManager.handleTokenExpiration();
    } catch (error) {
      console.error('Error handling token expiration:', error);
    }
  }

  // Handle token expiring soon
  private async handleTokenExpiringSoon(): Promise<void> {
    console.warn('Token will expire soon. Consider refreshing.');
  }
}

export default new AuthService();
