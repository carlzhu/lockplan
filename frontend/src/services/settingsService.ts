import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config/apiConfig';

// AI model types
export type AIModel = 'qianwen' | 'ollama';

// Default AI model
export const DEFAULT_AI_MODEL: AIModel = 'qianwen';

// User settings interface
export interface UserSettings {
  aiModel: AIModel;
  darkMode: boolean;
  notificationsEnabled: boolean;
  preferredLanguage: string;
  biometricAuthEnabled: boolean;
  dataBackupEnabled: boolean;
  reminderLeadTime: number;
}

// Default settings
export const DEFAULT_SETTINGS: UserSettings = {
  aiModel: DEFAULT_AI_MODEL,
  darkMode: false,
  notificationsEnabled: true,
  preferredLanguage: 'en',
  biometricAuthEnabled: false,
  dataBackupEnabled: true,
  reminderLeadTime: 15
};

// Function to get the current AI model
export const getAIModel = async (): Promise<AIModel> => {
  try {
    // Get from API
    const settings = await getSettings();
    return settings.aiModel;
  } catch (error) {
    console.error('Error getting AI model from API:', error);
    return DEFAULT_AI_MODEL;
  }
};

// Function to set the AI model
export const setAIModel = async (model: AIModel): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.error('No authentication token available');
      return false;
    }
    
    // Use the API_URL constant
    const apiUrl = API_URL;
    if (!apiUrl) {
      console.error('API URL not configured');
      return false;
    }
    
    // Create a new axios instance with the correct baseURL
    const api = axios.create({
      baseURL: apiUrl,
      timeout: 5000,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Update the AI model via API
    const response = await api.post('/user/settings/ai-model', { aiModel: model });
    console.log('AI model updated successfully via API:', response.status);
    
    // Save to local storage as cache for offline access
    await AsyncStorage.setItem('aiModel', model);
    
    return true;
  } catch (error: any) {
    console.error('Error setting AI model:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data));
    }
    return false;
  }
};

// Function to get all settings
export const getSettings = async (): Promise<UserSettings> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token available, using default settings');
      return DEFAULT_SETTINGS;
    }
    
    // Use the API_URL constant
    const apiUrl = API_URL;
    if (!apiUrl) {
      console.warn('API URL not configured, using default settings');
      return DEFAULT_SETTINGS;
    }
    
    console.log('Fetching settings from API:', `${apiUrl}/user/settings`);
    console.log('Using token (first 10 chars):', token.substring(0, 10) + '...');
    
    // Make direct API call with full URL
    const response = await axios({
      method: 'get',
      url: `${apiUrl}/user/settings`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('Settings API response status:', response.status);
    console.log('Settings API response data:', JSON.stringify(response.data));
    
    // Save to local storage as cache for offline access
    await AsyncStorage.setItem('userSettings', JSON.stringify(response.data));
    await AsyncStorage.setItem('aiModel', response.data.aiModel);
    
    return response.data;
  } catch (error: any) {
    console.error('Error getting settings from API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data));
    } else if (error.request) {
      console.error('No response received, request details:', error.request._url || 'No URL available');
    }
    
    // Try to get from local storage as fallback for offline access
    try {
      const settingsJson = await AsyncStorage.getItem('userSettings');
      if (settingsJson) {
        const localSettings = JSON.parse(settingsJson);
        console.log('Retrieved settings from local storage cache');
        return localSettings;
      }
    } catch (localError: any) {
      console.warn('Error reading from local storage:', localError.message);
    }
    
    // Return defaults if all else fails
    return DEFAULT_SETTINGS;
  }
};

// Function to update all settings
export const updateSettings = async (settings: UserSettings): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.error('No authentication token available');
      return false;
    }
    
    // Get the API URL
    const apiUrl = API_URL;
    if (!apiUrl) {
      console.error('API URL not configured');
      return false;
    }
    
    console.log('Updating settings via API');
    console.log('Settings data:', JSON.stringify(settings));
    console.log('Full API URL:', `${apiUrl}/user/settings`);
    
    // Make API call to update settings
    const response = await axios({
      method: 'post',
      url: `${apiUrl}/user/settings`,
      data: settings,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('Settings update API response:', response.status);
    console.log('Settings update API response data:', JSON.stringify(response.data));
    
    // Save to local storage as cache for offline access
    await AsyncStorage.setItem('userSettings', JSON.stringify(settings));
    await AsyncStorage.setItem('aiModel', settings.aiModel);
    
    return true;
  } catch (error: any) {
    console.error('Error updating settings via API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      if (error.response.data) {
        console.error('Response data:', JSON.stringify(error.response.data));
      }
    }
    return false;
  }
};

// Function to test API connectivity
export const testSettingsApi = async (): Promise<boolean> => {
  try {
    // Use the API_URL constant
    const apiUrl = API_URL;
    if (!apiUrl) {
      console.error('API URL not configured');
      return false;
    }
    
    console.log('Testing settings API connectivity:', `${apiUrl}/user/settings/test`);
    
    // Call the test endpoint
    const response = await axios.get(`${apiUrl}/user/settings/test`, {
      timeout: 5000
    });
    
    console.log('Settings API test response:', response.status, response.data);
    return response.status === 200;
  } catch (error: any) {
    console.error('Settings API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data));
    }
    return false;
  }
};

// Function to initialize settings
export const initializeSettings = async (): Promise<void> => {
  try {
    console.log('Initializing settings...');
    
    // Get settings from API
    await getSettings();
    console.log('Settings initialized successfully');
  } catch (error: any) {
    console.error('Error initializing settings:', error.message);
  }
};
