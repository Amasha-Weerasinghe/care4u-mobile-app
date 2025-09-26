import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';
import authService from '../services/authService';

export class TokenExpirationHandler {
  // Handle 401 Unauthorized responses
  static async handleUnauthorized(): Promise<void> {
    try {
      // Clear all stored data
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);

      // Stop token monitoring
      authService.stopTokenMonitoring();

      // Show user-friendly alert
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please log in again to continue.',
        [
          {
            text: 'Log In',
            onPress: () => {
              // Navigate to login screen
              // You'll need to implement navigation logic here
              console.log('Navigating to login screen...');
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error handling unauthorized response:', error);
    }
  }

  // Check token before making API calls
  static async checkTokenBeforeRequest(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) return false;

      if (authService.isTokenExpired(token)) {
        await this.handleUnauthorized();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking token before request:', error);
      return false;
    }
  }

  // Proactive token expiration warning
  static async checkAndWarnTokenExpiration(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) return;

      if (authService.isTokenExpiringSoon(token)) {
        const tokenInfo = authService.getTokenInfo(token);
        if (tokenInfo) {
          const timeLeft = Math.floor((tokenInfo.expiresAt - Date.now()) / (1000 * 60)); // minutes
          
          Alert.alert(
            'Session Expiring Soon',
            `Your session will expire in ${timeLeft} minutes. Please save your work and log in again.`,
            [
              {
                text: 'Continue',
                style: 'default',
              },
              {
                text: 'Log In Now',
                onPress: () => {
                  // Navigate to login
                  console.log('Navigating to login...');
                },
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
    }
  }
}

export default TokenExpirationHandler;
