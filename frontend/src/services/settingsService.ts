import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// AI model types
export type AIModel = 'qianwen' | 'ollama';

// Default AI model
export const DEFAULT_AI_MODEL: AIModel = 'qianwen';

// Function to get the current AI model
export const getAIModel = async (): Promise<AIModel> => {
  try {
    const model = await AsyncStorage.getItem('aiModel');
    return (model as AIModel) || DEFAULT_AI_MODEL;
  } catch (error) {
    console.error('Error getting AI model:', error);
    return DEFAULT_AI_MODEL;
  }
};

// Function to set the AI model
export const setAIModel = async (model: AIModel): Promise<boolean> => {
  try {
    await AsyncStorage.setItem('aiModel', model);
    
    // Only try to update the backend if we have a valid token
    const token = await AsyncStorage.getItem('token');
    if (token) {
      try {
        // Check if the endpoint exists before calling it
        await axios.get('/api/user/settings/check', { timeout: 2000 })
          .then(async () => {
            // If the check endpoint exists, try to update the AI model
            await axios.post('/api/user/settings/ai-model', { model }, { 
              headers: { 'Authorization': `Bearer ${token}` },
              timeout: 3000
            });
          })
          .catch(error => {
            console.log('Settings endpoint not available, skipping server update');
          });
      } catch (error) {
        console.log('Error checking settings endpoint, skipping server update');
        // Continue even if server update fails
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error setting AI model:', error);
    return false;
  }
};

// Function to initialize settings
export const initializeSettings = async (): Promise<void> => {
  try {
    // Check if AI model is set, if not set the default
    const aiModel = await AsyncStorage.getItem('aiModel');
    if (!aiModel) {
      await AsyncStorage.setItem('aiModel', DEFAULT_AI_MODEL);
    }
  } catch (error) {
    console.error('Error initializing settings:', error);
  }
};