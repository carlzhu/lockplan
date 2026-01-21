// API Test Utility
// This file contains functions to test API endpoints directly

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { API_URL } from '../config/apiConfig';

// Test the authentication and task API
export const testTaskApi = async () => {
  try {
    // Step 1: Get the token
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.error('No token found in AsyncStorage');
      Alert.alert('Error', 'No authentication token found. Please log in again.');
      return;
    }
    
    console.log('Token found:', token.substring(0, 15) + '...');
    
    // Step 2: Create axios instance with the token
    const api = axios.create({
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Step 3: Test GET /tasks
    console.log('Testing GET /tasks...');
    try {
      const tasksResponse = await api.get(`${API_URL}/tasks`);
      console.log('GET /tasks successful:', tasksResponse.status);
      console.log('Tasks count:', tasksResponse.data.length);
      
      // If we have tasks, test updating one
      if (tasksResponse.data.length > 0) {
        const taskToUpdate = tasksResponse.data[0];
        console.log('Testing PUT /tasks/{id} with task ID:', taskToUpdate.id);
        
        // Create update payload
        const updatePayload = {
          title: taskToUpdate.title + ' (Updated)',
          description: taskToUpdate.description || 'Test description',
          dueDate: taskToUpdate.dueDate,
          // Ensure priority is in uppercase to match backend expectations
          priority: taskToUpdate.priority ? taskToUpdate.priority.toUpperCase() : 'HIGH'
        };
        
        console.log('Update payload:', JSON.stringify(updatePayload));
        
        // Test the update
        try {
          const updateResponse = await api.put(`${API_URL}/tasks/${taskToUpdate.id}`, updatePayload);
          console.log('PUT /tasks/{id} successful:', updateResponse.status);
          Alert.alert('Success', 'API test completed successfully!');
        } catch (updateError) {
          console.error('Error updating task:', updateError);
          if (updateError.response) {
            console.error('Status:', updateError.response.status);
            console.error('Data:', JSON.stringify(updateError.response.data));
            console.error('Headers:', JSON.stringify(updateError.response.headers));
            Alert.alert('Update Error', `Status: ${updateError.response.status}\nData: ${JSON.stringify(updateError.response.data)}`);
          } else {
            Alert.alert('Update Error', updateError.message);
          }
        }
      } else {
        console.log('No tasks found to update');
        Alert.alert('Info', 'No tasks found to update. Test GET successful.');
      }
    } catch (tasksError) {
      console.error('Error getting tasks:', tasksError);
      if (tasksError.response) {
        console.error('Status:', tasksError.response.status);
        console.error('Data:', JSON.stringify(tasksError.response.data));
        Alert.alert('GET Error', `Status: ${tasksError.response.status}\nData: ${JSON.stringify(tasksError.response.data)}`);
      } else {
        Alert.alert('GET Error', tasksError.message);
      }
    }
  } catch (error) {
    console.error('General error in API test:', error);
    Alert.alert('Error', 'API test failed: ' + error.message);
  }
};

// Test just the authentication
export const testAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert('No Token', 'No authentication token found');
      return;
    }
    
    // Display token details
    Alert.alert(
      'Token Found',
      `Token length: ${token.length}\nFirst 10 chars: ${token.substring(0, 10)}...`
    );
    
    // Parse JWT token to show payload
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      console.log('Token payload:', jsonPayload);
      const payload = JSON.parse(jsonPayload);
      
      Alert.alert(
        'Token Details',
        `Subject: ${payload.sub}\nRoles: ${payload.roles}\nExpires: ${new Date(payload.exp * 1000).toLocaleString()}`
      );
    } catch (parseError) {
      console.error('Error parsing token:', parseError);
      Alert.alert('Parse Error', 'Could not parse token: ' + parseError.message);
    }
  } catch (error) {
    console.error('Error testing auth token:', error);
    Alert.alert('Error', 'Auth token test failed: ' + error.message);
  }
};