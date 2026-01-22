// API configuration for the VocalClerk mobile app
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API route prefix - all API endpoints will be prefixed with this
export const API_PREFIX = '/api/vpp';

// Default API URLs for different environments
// .NET 8 backend runs on port 5000 by default
// For iOS simulator, use localhost:5000
// For Android emulator, use 10.0.2.2:5000
// For physical devices, use the actual IP address of your backend server

// Default API URL - this will be used if no custom URL is set
// For iOS simulator, use 127.0.0.1:5000 (localhost may not work in some cases)
// For Android emulator, use 10.0.2.2:5000
// For physical devices, use the actual IP address of your backend server (172.25.82.182:5000)
export const DEFAULT_API_URL = 'http://127.0.0.1:5000';

// Helper function to detect if running on a physical device
export const isPhysicalDevice = async () => {
  // This is a simple check - we could enhance this with device info libraries
  // For now, we'll rely on the server configuration modal for physical devices
  return true;
};

// This is the API URL that will be used by the app
// It's initialized with the default value but will be updated when the app starts
export let API_URL = DEFAULT_API_URL;

// Function to initialize the API URL from AsyncStorage
export const initializeApiUrl = async () => {
  try {
    const storedApiUrl = await AsyncStorage.getItem('apiUrl');
    if (storedApiUrl) {
      API_URL = storedApiUrl;
      console.log('API URL initialized from storage:', API_URL);
    } else {
      // Use default API URL
      API_URL = DEFAULT_API_URL;
      console.log('Using default API URL:', API_URL);
    }
    // Always update axios base URL after initialization
    updateAxiosBaseUrl(API_URL);
  } catch (error) {
    console.error('Error loading API URL from storage:', error);
    // Fallback to default URL if there's an error
    API_URL = DEFAULT_API_URL;
    updateAxiosBaseUrl(API_URL);
  }
};

// Function to update the API URL
export const updateApiUrl = async (newUrl: string) => {
  try {
    await AsyncStorage.setItem('apiUrl', newUrl);
    API_URL = newUrl;
    // Update axios default base URL
    updateAxiosBaseUrl(API_URL);
    console.log('API URL updated and saved:', API_URL);
    return true;
  } catch (error) {
    console.error('Error saving API URL to storage:', error);
    return false;
  }
};

// Function to update axios base URL
export const updateAxiosBaseUrl = (baseUrl: string) => {
  if (!baseUrl) {
    console.error('Cannot update axios base URL: URL is empty');
    return;
  }
  
  // Remove trailing slash if present
  const normalizedUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  // Set the base URL for all axios requests (including API prefix)
  axios.defaults.baseURL = `${normalizedUrl}${API_PREFIX}`;
  console.log(`API URL updated to: ${normalizedUrl}${API_PREFIX}`);
};

