import { Platform } from 'react-native';

/**
 * API Configuration
 * Update this with your server URL
 * 
 * For development:
 * - iOS Simulator: use 'http://localhost:8000'
 * - Android Emulator: use 'http://10.0.2.2:8000'
 * - Physical Device: use your computer's IP address (e.g., 'http://192.168.1.100:8000')
 */
export const API_CONFIG = {
  BASE_URL: __DEV__
    ? Platform.OS === 'android'
      ? 'http://10.0.2.2:8000' // Android emulator
      : 'http://localhost:8000' // iOS simulator or web
    : 'https://your-production-api.com', // Production server
};

export const getApiUrl = () => {
  return API_CONFIG.BASE_URL;
};

