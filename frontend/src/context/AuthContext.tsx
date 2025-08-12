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
        if (error.response && error.response.status === 403) {
          console.log('Received 403 error, logging out');
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
      
      const response = await axios.post('/api/auth/login', {
        username: email, // Changed from 'email' to 'username' to match backend expectations
        password,
      });

      const { accessToken, user } = response.data;
      
      await AsyncStorage.setItem('token', accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login failed', error);
      Alert.alert('Login Failed', 'Invalid credentials. Please try again.');
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
      
      await axios.post('/api/auth/register', {
        name,
        email,
        password,
      });
      
      // After registration, log the user in
      await login(email, password);
    } catch (error) {
      console.error('Registration failed', error);
      Alert.alert('Registration Failed', 'Could not create account. Please try again.');
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