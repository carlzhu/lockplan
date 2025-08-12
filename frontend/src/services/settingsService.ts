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
    
    // Update the backend about the AI model change
    try {
      await axios.post('/api/user/settings/ai-model', { model });
    } catch (error) {
      console.error('Error updating AI model on server:', error);
      // Continue even if server update fails
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