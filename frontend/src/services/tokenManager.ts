import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';

export interface TokenInfo {
  token: string;
  expiresAt: number;
  userId: number;
  email: string;
}

export class AuthTokenService {
  private static instance: AuthTokenService;
  private tokenCheckInterval: NodeJS.Timeout | null = null;

  static getInstance(): AuthTokenService {
    if (!AuthTokenService.instance) {
      AuthTokenService.instance = new AuthTokenService();
    }
    return AuthTokenService.instance;
  }

  // Check if token is expired
  isTokenExpired(token: string): boolean {
    try {
      // Decode JWT token (base64 decode)
      const parts = token.split('.');
      if (parts.length !== 3) return true;

      const payload = JSON.parse(atob(parts[1]));
      if (!payload || !payload.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  // Get token info
  getTokenInfo(token: string): TokenInfo | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      if (!payload) return null;

      return {
        token,
        expiresAt: payload.exp * 1000, // Convert to milliseconds
        userId: payload.userId,
        email: payload.email,
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      return null;
    }
  }

  // Check if token expires soon (within 1 hour)
  isTokenExpiringSoon(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;

      const payload = JSON.parse(atob(parts[1]));
      if (!payload || !payload.exp) return true;

      const currentTime = Math.floor(Date.now() / 1000);
      const oneHourFromNow = currentTime + (60 * 60); // 1 hour in seconds
      
      return payload.exp < oneHourFromNow;
    } catch (error) {
      console.error('Error checking if token expires soon:', error);
      return true;
    }
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
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) return;

      if (this.isTokenExpired(token)) {
        await this.handleTokenExpiration();
      } else if (this.isTokenExpiringSoon(token)) {
        await this.handleTokenExpiringSoon();
      }
    } catch (error) {
      console.error('Error checking token status:', error);
    }
  }

  // Handle token expiration
  private async handleTokenExpiration(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);

      // Emit event or trigger navigation
      this.emitTokenExpired();
    } catch (error) {
      console.error('Error handling token expiration:', error);
    }
  }

  // Handle token expiring soon
  private async handleTokenExpiringSoon(): Promise<void> {
    // You can implement refresh token logic here
    // For now, just log a warning
    console.warn('Token will expire soon. Consider refreshing.');
  }

  // Emit token expired event
  private emitTokenExpired(): void {
    // You can implement event emission here
    // This could trigger navigation to login screen
    console.log('Token expired - user should be redirected to login');
  }

  // Clear all tokens
  async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
      this.stopTokenMonitoring();
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }
}

export default AuthTokenService.getInstance();
