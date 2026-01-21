// API Debug Utility
// This file contains functions to test and debug API issues

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { API_URL } from '../config/apiConfig';

// Test the echo endpoint to diagnose request issues
export const testEchoEndpoint = async () => {
  try {
    // Get the token
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.error('No token found in AsyncStorage');
      Alert.alert('Error', 'No authentication token found. Please log in again.');
      return;
    }
    
    console.log('Token found:', token.substring(0, 15) + '...');
    
    // Create axios instance with the token
    const api = axios.create({
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Test with different priority formats
    const testCases = [
      { title: "Test 1", priority: "HIGH" },
      { title: "Test 2", priority: "High" },
      { title: "Test 3", priority: "high" },
      { title: "Test 4", priority: "MEDIUM" },
      { title: "Test 5", priority: "LOW" }
    ];
    
    for (const testCase of testCases) {
      console.log(`Testing with priority: ${testCase.priority}`);
      try {
        const response = await api.post(`${API_URL}/test/echo`, testCase);
        console.log(`Test case ${testCase.title} result:`, response.data);
      } catch (error) {
        console.error(`Error with test case ${testCase.title}:`, error.message);
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Data:', JSON.stringify(error.response.data));
        }
      }
    }
    
    // Now test a task update with the correct format
    const taskUpdateTest = {
      title: "Test Task Update",
      description: "Testing task update with correct priority format",
      dueDate: "2025-08-12T13:33:25",
      priority: "HIGH"  // Using uppercase as in the enum
    };
    
    console.log('Testing task update with payload:', JSON.stringify(taskUpdateTest));
    
    // Get a task ID to test with
    try {
      const tasksResponse = await api.get(`${API_URL}/tasks`);
      if (tasksResponse.data && tasksResponse.data.length > 0) {
        const taskId = tasksResponse.data[0].id;
        console.log('Using task ID for update test:', taskId);
        
        try {
          const updateResponse = await api.put(`${API_URL}/tasks/${taskId}`, taskUpdateTest);
          console.log('Task update successful:', updateResponse.status);
          console.log('Updated task:', updateResponse.data);
          Alert.alert('Success', 'Task update test completed successfully!');
        } catch (updateError) {
          console.error('Error updating task:', updateError.message);
          if (updateError.response) {
            console.error('Status:', updateError.response.status);
            console.error('Data:', JSON.stringify(updateError.response.data));
            Alert.alert('Update Error', `Status: ${updateError.response.status}\nData: ${JSON.stringify(updateError.response.data)}`);
          } else {
            Alert.alert('Update Error', updateError.message);
          }
        }
      } else {
        console.log('No tasks found to test update');
        Alert.alert('Info', 'No tasks found to test update.');
      }
    } catch (tasksError) {
      console.error('Error getting tasks:', tasksError.message);
      Alert.alert('Error', 'Failed to get tasks for update test: ' + tasksError.message);
    }
    
  } catch (error) {
    console.error('General error in API debug:', error);
    Alert.alert('Error', 'API debug failed: ' + error.message);
  }
};

// Test direct enum conversion
export const testPriorityEnum = async () => {
  try {
    // Test each priority value directly
    const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
    
    for (const priority of priorities) {
      try {
        const response = await axios.get(`${API_URL}/test/priority/${priority}`);
        console.log(`Priority ${priority} test result:`, response.data);
      } catch (error) {
        console.error(`Error with priority ${priority}:`, error.message);
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Data:', JSON.stringify(error.response.data));
        }
      }
    }
    
    Alert.alert('Test Complete', 'Priority enum tests completed. Check console for results.');
  } catch (error) {
    console.error('Error in priority enum test:', error);
    Alert.alert('Error', 'Priority enum test failed: ' + error.message);
  }
};