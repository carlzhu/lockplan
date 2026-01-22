import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

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

// Helper function to get the current API URL
const getCurrentApiUrl = async (): Promise<string> => {
  try {
    const storedApiUrl = await AsyncStorage.getItem('apiUrl');
    return storedApiUrl || 'http://127.0.0.1:5000';
  } catch (error) {
    console.error('Error getting API URL:', error);
    return 'http://127.0.0.1:5000';
  }
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
    
    // Get the current API URL from storage
    const apiUrl = await getCurrentApiUrl();
    if (!apiUrl) {
      console.error('API URL not configured');
      return false;
    }
    
    // Update the AI model via API using axios defaults (which should be updated)
    const response = await axios.post('/user/settings/ai-model', { aiModel: model });
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
    
    // Use axios defaults which should be updated by updateApiUrl
    console.log('Fetching settings from API using axios defaults');
    console.log('Axios baseURL:', axios.defaults.baseURL);
    console.log('Using token (first 10 chars):', token.substring(0, 10) + '...');
    
    // Make API call using axios defaults
    const response = await axios.get('/user/settings', {
      headers: {
        'Authorization': `Bearer ${token}`,
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
      console.error('No response received');
      console.error('Request URL:', error.config?.url);
      console.error('Request baseURL:', error.config?.baseURL);
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
    
    console.log('Updating settings via API');
    console.log('Settings data:', JSON.stringify(settings));
    console.log('Axios baseURL:', axios.defaults.baseURL);
    
    // Make API call to update settings using axios defaults
    const response = await axios.post('/user/settings', settings, {
      headers: {
        'Authorization': `Bearer ${token}`,
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
    } else if (error.request) {
      console.error('No response received');
      console.error('Request URL:', error.config?.url);
      console.error('Request baseURL:', error.config?.baseURL);
    }
    return false;
  }
};

// Function to test API connectivity
export const testSettingsApi = async (): Promise<boolean> => {
  try {
    console.log('Testing settings API connectivity');
    console.log('Axios baseURL:', axios.defaults.baseURL);
    
    // Call the test endpoint using axios defaults
    const response = await axios.get('/user/settings/test', {
      timeout: 5000
    });
    
    console.log('Settings API test response:', response.status, response.data);
    return response.status === 200;
  } catch (error: any) {
    console.error('Settings API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data));
    } else if (error.request) {
      console.error('No response received');
      console.error('Request URL:', error.config?.url);
      console.error('Request baseURL:', error.config?.baseURL);
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
