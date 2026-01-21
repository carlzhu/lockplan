import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';
import { API_URL, updateAxiosBaseUrl } from '../config/apiConfig';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  register: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Define logout function early so it can be used in the interceptor
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };
  
  // Set up axios interceptor to handle 403 errors
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        // Only handle 403 errors for auth-related endpoints
        if (error.response && 
            error.response.status === 403 && 
            error.config && 
            error.config.url && 
            !error.config.url.includes('/settings/') && 
            !error.config.url.includes('/user/settings/')) {
          console.log('Received 403 error from auth endpoint, logging out');
          handleLogout();
        }
        return Promise.reject(error);
      }
    );
    
    // Clean up interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  useEffect(() => {
    // Check if user is logged in
    const checkLoggedIn = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          // Set the Authorization header for all future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Update the API URL before making any requests
          updateAxiosBaseUrl(API_URL);
          
          const userResponse = await AsyncStorage.getItem('user');
          if (userResponse) {
            setUser(JSON.parse(userResponse));
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Authentication check failed', error);
        // Clear any invalid authentication data
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Update axios base URL before making the request
      updateAxiosBaseUrl(API_URL);
      
      console.log('Attempting login with username:', email);
      console.log('Using API URL:', API_URL);
      
      // Add timeout to prevent hanging on network issues
      const response = await axios.post(`${API_URL}/auth/login`, {
        username: email, // Changed from 'email' to 'username' to match backend expectations
        password,
      }, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Login response received:', response.status);
      
      // Check if we have the expected response structure
      if (!response.data || !response.data.accessToken) {
        console.error('Invalid login response structure:', response.data);
        Alert.alert(
          'Login Failed', 
          'The server response was invalid. Please check your API settings and try again.'
        );
        throw new Error('Invalid server response');
      }

      const { accessToken, user } = response.data;
      console.log('Token received, user data:', user ? 'exists' : 'missing');
      
      // Store token and user data
      await AsyncStorage.setItem('token', accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      // Set authorization header for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      console.log('Authorization header set after login');
      
      setUser(user);
      setIsAuthenticated(true);
      console.log('Authentication state updated, user is now authenticated');
    } catch (error: any) {
      console.error('Login failed', error.message);
      
      let errorMessage = 'Invalid credentials. Please try again.';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Connection timed out. Please check your network and API settings.';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection and API settings.';
      } else if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        // Handle specific status codes
        if (error.response.status === 418) {
          errorMessage = 'Server configuration error. Please check your API settings.';
        } else if (error.response.status === 401) {
          errorMessage = 'Invalid username or password.';
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      }
      
      Alert.alert('Login Failed', errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await handleLogout();
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      
      // Update axios base URL before making the request
      updateAxiosBaseUrl(API_URL);
      
      console.log('Attempting registration with username:', name);
      console.log('Using API URL:', API_URL);
      
      // .NET backend expects: username, email, password
      await axios.post(`${API_URL}/auth/register`, {
        username: name,  // Changed from 'name' to 'username' to match .NET backend
        email,
        password,
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Registration successful, attempting login');
      
      // After registration, log the user in using username (not email)
      await login(name, password);
    } catch (error: any) {
      console.error('Registration failed', error.message);
      
      let errorMessage = 'Could not create account. Please try again.';
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid registration data. Please check your input.';
        }
      }
      
      Alert.alert('Registration Failed', errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};