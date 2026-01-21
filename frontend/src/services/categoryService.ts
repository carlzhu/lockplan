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
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Authorization header set successfully');
    } else {
      console.warn('No token found in AsyncStorage');
      throw new Error('Authentication token not found. Please log in again.');
    }
  } catch (error) {
    console.error('Error retrieving token from AsyncStorage:', error);
    throw error;
  }
};

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateCategoryDto {
  name: string;
  color: string;
  icon: string;
  isDefault?: boolean;
}

export interface UpdateCategoryDto {
  name: string;
  color: string;
  icon: string;
  isDefault?: boolean;
}

export const getCategories = async (): Promise<Category[]> => {
  try {
    await ensureAuthHeader();
    console.log('Fetching categories from:', `${API_URL}/categories`);
    const response = await axios.get(`${API_URL}/categories`);
    console.log('Categories fetched successfully, count:', response.data ? response.data.length : 0);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching categories:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

export const getCategoryById = async (id: number): Promise<Category> => {
  try {
    await ensureAuthHeader();
    console.log(`Fetching category with ID: ${id}`);
    const response = await axios.get(`${API_URL}/categories/${id}`);
    console.log('Category fetched successfully');
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching category ${id}:`, error.message);
    throw error;
  }
};

export const createCategory = async (category: CreateCategoryDto): Promise<Category> => {
  try {
    await ensureAuthHeader();
    console.log('Creating category:', JSON.stringify(category));
    const response = await axios.post(`${API_URL}/categories`, category);
    console.log('Category created successfully');
    return response.data;
  } catch (error: any) {
    console.error('Error creating category:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

export const updateCategory = async (id: number, category: UpdateCategoryDto): Promise<Category> => {
  try {
    await ensureAuthHeader();
    console.log(`Updating category ${id}:`, JSON.stringify(category));
    const response = await axios.put(`${API_URL}/categories/${id}`, category);
    console.log('Category updated successfully');
    return response.data;
  } catch (error: any) {
    console.error(`Error updating category ${id}:`, error.message);
    throw error;
  }
};

export const deleteCategory = async (id: number): Promise<boolean> => {
  try {
    await ensureAuthHeader();
    console.log(`Deleting category with ID: ${id}`);
    await axios.delete(`${API_URL}/categories/${id}`);
    console.log('Category deleted successfully');
    return true;
  } catch (error: any) {
    console.error(`Error deleting category ${id}:`, error.message);
    throw error;
  }
};

export const initializeDefaultCategories = async (): Promise<void> => {
  try {
    await ensureAuthHeader();
    console.log('Initializing default categories');
    await axios.post(`${API_URL}/categories/initialize`);
    console.log('Default categories initialized successfully');
  } catch (error: any) {
    console.error('Error initializing default categories:', error.message);
    throw error;
  }
};

// Helper function to get category color
export const getCategoryColor = (category?: Category | null): string => {
  return category?.color || '#808080';
};

// Helper function to get category icon
export const getCategoryIcon = (category?: Category | null): string => {
  return category?.icon || '📁';
};

// Helper function to get category name
export const getCategoryName = (category?: Category | null): string => {
  return category?.name || '未分类';
};
