import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';
import { Alert } from 'react-native';

export interface TokenInfo {
  token: string;
  expiresAt: number;
  userId: number;
  email: string;
}

class TokenManager {
  // Token management
  async setAuthToken(token: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  async removeAuthToken(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  // User data management
  async setUserData(userData: any): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  }

  async getUserData(): Promise<any> {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  }

  async removeUserData(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }

  // Token expiration handling
  isTokenExpired(token: string): boolean {
    try {
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

  // Handle token expiration
  async handleTokenExpiration(): Promise<void> {
    try {
      await this.removeAuthToken();
      await this.removeUserData();

      Alert.alert(
        'Session Expired',
        'Your session has expired. Please log in again.',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('Redirecting to login...');
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error handling token expiration:', error);
    }
  }
}

export default new TokenManager();
