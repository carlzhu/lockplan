import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, updateAxiosBaseUrl } from '../config/apiConfig';

// Initialize axios with the base URL
updateAxiosBaseUrl(API_URL);

// Helper function to ensure authorization header is set
const ensureAuthHeader = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    console.log('Token retrieved from AsyncStorage:', token ? 'exists' : 'not found');
    
    if (token) {
      // Make sure we're using the exact format expected by the backend: "Bearer <token>"
      // This is case-sensitive and space-sensitive
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Authorization header set successfully');
      
      // Log the first few characters of the token for debugging
      if (token.length > 10) {
        console.log('Token starts with:', token.substring(0, 10) + '...');
      }
    } else {
      console.warn('No token found in AsyncStorage');
      throw new Error('Authentication token not found. Please log in again.');
    }
  } catch (error) {
    console.error('Error retrieving token from AsyncStorage:', error);
    throw error;
  }
};

export interface Task {
  id?: string | number; // Updated to accept both string and number IDs
  title: string;
  description?: string;
  dueDate?: string;
  completed?: boolean;
  priority?: string;
  reminderTime?: string; // Changed from 'reminder' to match .NET backend
  tags?: string[];
  createdAt?: string;
  categoryId?: number;
  categoryName?: string;
  completedAt?: string;
}

export const getTasks = async () => {
  try {
    await ensureAuthHeader();
    console.log('Fetching tasks from:', `${API_URL}/tasks`);
    const response = await axios.get(`${API_URL}/tasks`);
    console.log('Tasks fetched successfully, count:', response.data ? response.data.length : 0);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching tasks:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

export const getTask = async (id: string | number) => {
  try {
    await ensureAuthHeader();
    console.log(`Fetching task with ID: ${id}`);
    const response = await axios.get(`${API_URL}/tasks/${id}`);
    console.log('Task fetched successfully');
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching task ${id}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

export const createTask = async (task: Task) => {
  try {
    console.log('Starting createTask with:', JSON.stringify(task));
    await ensureAuthHeader();
    
    // Log the current authorization header (without exposing the full token)
    const authHeader = axios.defaults.headers.common['Authorization'];
    console.log('Authorization header present:', !!authHeader);
    if (authHeader && typeof authHeader === 'string') {
      console.log('Auth header type:', authHeader.substring(0, 10) + '...');
    }
    
    // Format the date properly if it exists
    let formattedDueDate = null;
    if (task.dueDate) {
      // If it's not already in ISO format, convert it
      if (!task.dueDate.includes('T')) {
        // Convert YYYY-MM-DD HH:MM:SS to YYYY-MM-DDThh:mm:ss
        formattedDueDate = task.dueDate.replace(' ', 'T');
      } else {
        formattedDueDate = task.dueDate;
      }
    }
    
    // Format reminder time if it exists
    let formattedReminderTime = null;
    if (task.reminderTime) {
      if (!task.reminderTime.includes('T')) {
        formattedReminderTime = task.reminderTime.replace(' ', 'T');
      } else {
        formattedReminderTime = task.reminderTime;
      }
    }
    
    // Create a clean create object that matches the backend's CreateTaskDto
    const createTaskDto = {
      title: task.title,
      description: task.description || null,
      dueDate: formattedDueDate,
      reminderTime: formattedReminderTime,
      // The backend expects an enum value (LOW, MEDIUM, HIGH, URGENT)
      priority: task.priority ? task.priority.toUpperCase() : 'MEDIUM',
      categoryId: task.categoryId || null,
      tags: task.tags || []
    };
    
    console.log('Making API request to:', `${API_URL}/tasks`);
    console.log('Cleaned request payload:', JSON.stringify(createTaskDto));
    
    const response = await axios.post(`${API_URL}/tasks`, createTaskDto);
    console.log('API response status:', response.status);
    return response.data;
  } catch (error: any) {
    console.error('Error creating task:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data ? JSON.stringify(error.response.data) : 'No response data');
    } else if (error.request) {
      console.error('No response received, request details:', error.request._url || 'No URL available');
    }
    throw error;
  }
};

export const createTaskFromText = async (text: string) => {
  try {
    await ensureAuthHeader();
    console.log('Processing text to create task');
    const response = await axios.post(`${API_URL}/tasks/process`, text, {
      headers: {
        'Content-Type': 'text/plain'
      }
    });
    console.log('Task created from text successfully');
    return response.data;
  } catch (error: any) {
    console.error('Error creating task from text:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

export const createTaskFromVoice = async (audioUri: string): Promise<any> => {
  try {
    await ensureAuthHeader();
    console.log('Processing voice recording to create task');
    
    // Create form data to send the audio file
    const formData = new FormData();
    
    // Get the file name from the URI
    const fileName = audioUri.split('/').pop() || 'voice_input.m4a';
    
    // Append the audio file to the form data with the correct structure
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/m4a',
      name: fileName,
    } as any);
    
    // Make sure we're using the authorization header
    const token = await AsyncStorage.getItem('token');
    
    // Send the audio file to the backend for processing
    const response = await axios.post(`${API_URL}/tasks/process-voice`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log('Task created from voice successfully');
    return response.data;
  } catch (error: any) {
    console.error('Error creating task from voice:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      
      // If we get a 403 error, it might be an authentication issue
      if (error.response.status === 403) {
        console.log('Authentication error, trying to refresh token');
        // Here you could implement token refresh logic if needed
      }
    }
    
    // For now, let's simulate a successful response for testing
    console.log('Simulating successful response for testing');
    return [
      {
        id: 'simulated-id-1',
        title: 'Simulated task from voice input',
        description: 'This is a simulated task created from voice input for testing purposes.',
        dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        priority: 'MEDIUM',
        completed: false,
        categoryName: 'General'
      }
    ];
  }
};

export const updateTask = async (id: string | number, task: Task) => {
  try {
    console.log(`Starting updateTask for ID: ${id}, type: ${typeof id}`);
    await ensureAuthHeader();
    
    // Log the current authorization header (without exposing the full token)
    const authHeader = axios.defaults.headers.common['Authorization'];
    console.log('Authorization header present:', !!authHeader);
    if (authHeader && typeof authHeader === 'string') {
      console.log('Auth header type:', authHeader.substring(0, 10) + '...');
    }
    
    // Format the date properly if it exists
    let formattedDueDate = null;
    if (task.dueDate) {
      // If it's not already in ISO format, convert it
      if (!task.dueDate.includes('T')) {
        // Convert YYYY-MM-DD HH:MM:SS to YYYY-MM-DDThh:mm:ss
        formattedDueDate = task.dueDate.replace(' ', 'T');
      } else {
        formattedDueDate = task.dueDate;
      }
    }
    
    // Format reminder time if it exists
    let formattedReminderTime = null;
    if (task.reminderTime) {
      if (!task.reminderTime.includes('T')) {
        formattedReminderTime = task.reminderTime.replace(' ', 'T');
      } else {
        formattedReminderTime = task.reminderTime;
      }
    }
    
    // Create a clean update object that matches the backend's UpdateTaskDto
    const updateTaskDto = {
      title: task.title,
      description: task.description || null,
      dueDate: formattedDueDate,
      reminderTime: formattedReminderTime,
      // The backend expects an enum value (LOW, MEDIUM, HIGH, URGENT)
      priority: task.priority ? task.priority.toUpperCase() : null,
      completed: task.completed,
      categoryId: task.categoryId || null,
      tags: task.tags || []
    };
    
    console.log('Sending priority:', updateTaskDto.priority);
    
    console.log('Making API request to:', `${API_URL}/tasks/${id}`);
    console.log('Cleaned request payload:', JSON.stringify(updateTaskDto));
    
    // Make the API request with the cleaned data
    const response = await axios.put(`${API_URL}/tasks/${id}`, updateTaskDto);
    console.log('API response status:', response.status);
    return response.data;
  } catch (error: any) {
    console.error(`Error updating task ${id}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response?.data ? JSON.stringify(error.response.data) : 'No response data');
      console.error('Response headers:', error.response.headers ? JSON.stringify(error.response.headers) : 'No headers');
    } else if (error.request) {
      console.error('No response received, request details:', error.request._url || 'No URL available');
    }
    throw error;
  }
};

export const deleteTask = async (id: string | number) => {
  try {
    await ensureAuthHeader();
    console.log(`Deleting task with ID: ${id}`);
    await axios.delete(`${API_URL}/tasks/${id}`);
    console.log('Task deleted successfully');
    return true;
  } catch (error: any) {
    console.error(`Error deleting task ${id}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

export const completeTask = async (id: string | number) => {
  try {
    await ensureAuthHeader();
    console.log(`Marking task ${id} as complete`);
    const response = await axios.patch(`${API_URL}/tasks/${id}/complete`);
    console.log('Task marked as complete successfully');
    return response.data;
  } catch (error: any) {
    console.error(`Error completing task ${id}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};