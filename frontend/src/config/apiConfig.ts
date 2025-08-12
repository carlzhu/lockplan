// API configuration for the LockPlan mobile app
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default API URLs for different environments
// For iOS simulator, use localhost:8080
// For Android emulator, use 10.0.2.2:8080
// For physical devices, use the actual IP address of your backend server

// Default API URL - this will be used if no custom URL is set
// For iOS simulator, use host.docker.internal:8080 or your machine's IP address
export const DEFAULT_API_URL = 'http://host.docker.internal:8080';

// This is the API URL that will be used by the app
// It's initialized with the default value but will be updated when the app starts
export let API_URL = DEFAULT_API_URL;

// Function to initialize the API URL from AsyncStorage
export const initializeApiUrl = async () => {
  try {
    const storedApiUrl = await AsyncStorage.getItem('api_url');
    if (storedApiUrl) {
      API_URL = storedApiUrl;
      // Update axios default base URL
      updateAxiosBaseUrl(API_URL);
    }
  } catch (error) {
    console.error('Error loading API URL from storage:', error);
  }
};

// Function to update the API URL
export const updateApiUrl = async (newUrl: string) => {
  try {
    await AsyncStorage.setItem('api_url', newUrl);
    API_URL = newUrl;
    // Update axios default base URL
    updateAxiosBaseUrl(API_URL);
    return true;
  } catch (error) {
    console.error('Error saving API URL to storage:', error);
    return false;
  }
};

// Function to update axios base URL
export const updateAxiosBaseUrl = (baseUrl: string) => {
  // Set the base URL for all axios requests
  axios.defaults.baseURL = baseUrl;
  console.log(`API URL updated to: ${baseUrl}`);
};

// Import axios here to avoid circular dependencies
import axios from 'axios';
