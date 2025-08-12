import axios from 'axios';
import { API_URL, updateAxiosBaseUrl } from '../config/apiConfig';

// Initialize axios with the base URL
updateAxiosBaseUrl(API_URL);

export interface Task {
  id?: number;
  title: string;
  description?: string;
  dueDate?: string;
  completed?: boolean;
  priority?: string;
  reminder?: string;
  tags?: string[];
}

export const getTasks = async () => {
  try {
    const response = await axios.get('/api/tasks');
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const getTask = async (id: number) => {
  try {
    const response = await axios.get(`/api/tasks/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching task ${id}:`, error);
    throw error;
  }
};

export const createTask = async (task: Task) => {
  try {
    const response = await axios.post('/api/tasks', task);
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const createTaskFromText = async (text: string) => {
  try {
    const response = await axios.post('/api/tasks/process-text', text, {
      headers: {
        'Content-Type': 'text/plain'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating task from text:', error);
    throw error;
  }
};

export const updateTask = async (id: number, task: Task) => {
  try {
    const response = await axios.put(`/api/tasks/${id}`, task);
    return response.data;
  } catch (error) {
    console.error(`Error updating task ${id}:`, error);
    throw error;
  }
};

export const deleteTask = async (id: number) => {
  try {
    await axios.delete(`/api/tasks/${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting task ${id}:`, error);
    throw error;
  }
};

export const completeTask = async (id: number) => {
  try {
    const response = await axios.patch(`/api/tasks/${id}/complete`);
    return response.data;
  } catch (error) {
    console.error(`Error completing task ${id}:`, error);
    throw error;
  }
};