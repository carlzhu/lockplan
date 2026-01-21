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

export enum EventCategory {
  NORMAL = 'NORMAL',
  EXCEPTION = 'EXCEPTION',
  MILESTONE = 'MILESTONE',
  MEETING = 'MEETING',
  FEEDBACK = 'FEEDBACK',
  IDEA = 'IDEA',
  REMINDER = 'REMINDER'
}

export interface EventData {
  id?: number;
  title: string;
  description?: string;
  category: EventCategory;
  eventTime?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export const getEvents = async (category?: string) => {
  try {
    await ensureAuthHeader();
    const url = category ? `${API_URL}/events?category=${category}` : `${API_URL}/events`;
    console.log('Fetching events from:', url);
    const response = await axios.get(url);
    console.log('Events fetched successfully, count:', response.data ? response.data.length : 0);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching events:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

export const getRecentEvents = async (count: number = 10) => {
  try {
    await ensureAuthHeader();
    console.log(`Fetching recent ${count} events`);
    const response = await axios.get(`${API_URL}/events/recent?count=${count}`);
    console.log('Recent events fetched successfully');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching recent events:', error.message);
    throw error;
  }
};

export const getEvent = async (id: number) => {
  try {
    await ensureAuthHeader();
    console.log(`Fetching event with ID: ${id}`);
    const response = await axios.get(`${API_URL}/events/${id}`);
    console.log('Event fetched successfully');
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching event ${id}:`, error.message);
    throw error;
  }
};

export const createEvent = async (event: EventData) => {
  try {
    console.log('Starting createEvent with:', JSON.stringify(event));
    await ensureAuthHeader();
    
    // Format the event time properly if it exists
    let formattedEventTime = null;
    if (event.eventTime) {
      if (!event.eventTime.includes('T')) {
        formattedEventTime = event.eventTime.replace(' ', 'T');
      } else {
        formattedEventTime = event.eventTime;
      }
    }
    
    const createEventDto = {
      title: event.title,
      description: event.description || null,
      category: event.category,
      eventTime: formattedEventTime,
      severity: event.severity || null,
      tags: event.tags || []
    };
    
    console.log('Making API request to:', `${API_URL}/events`);
    console.log('Request payload:', JSON.stringify(createEventDto));
    
    const response = await axios.post(`${API_URL}/events`, createEventDto);
    console.log('API response status:', response.status);
    return response.data;
  } catch (error: any) {
    console.error('Error creating event:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data ? JSON.stringify(error.response.data) : 'No response data');
    }
    throw error;
  }
};

export const updateEvent = async (id: number, event: EventData) => {
  try {
    console.log(`Starting updateEvent for ID: ${id}`);
    await ensureAuthHeader();
    
    // Format the event time properly if it exists
    let formattedEventTime = null;
    if (event.eventTime) {
      if (!event.eventTime.includes('T')) {
        formattedEventTime = event.eventTime.replace(' ', 'T');
      } else {
        formattedEventTime = event.eventTime;
      }
    }
    
    const updateEventDto = {
      title: event.title,
      description: event.description || null,
      category: event.category,
      eventTime: formattedEventTime,
      severity: event.severity || null,
      tags: event.tags || []
    };
    
    console.log('Making API request to:', `${API_URL}/events/${id}`);
    console.log('Request payload:', JSON.stringify(updateEventDto));
    
    const response = await axios.put(`${API_URL}/events/${id}`, updateEventDto);
    console.log('API response status:', response.status);
    return response.data;
  } catch (error: any) {
    console.error(`Error updating event ${id}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response?.data ? JSON.stringify(error.response.data) : 'No response data');
    }
    throw error;
  }
};

export const deleteEvent = async (id: number) => {
  try {
    await ensureAuthHeader();
    console.log(`Deleting event with ID: ${id}`);
    await axios.delete(`${API_URL}/events/${id}`);
    console.log('Event deleted successfully');
    return true;
  } catch (error: any) {
    console.error(`Error deleting event ${id}:`, error.message);
    throw error;
  }
};

// Helper function to get event category display name
export const getEventCategoryName = (category: EventCategory): string => {
  const names: Record<EventCategory, string> = {
    [EventCategory.NORMAL]: '普通事件',
    [EventCategory.EXCEPTION]: '异常',
    [EventCategory.MILESTONE]: '里程碑',
    [EventCategory.MEETING]: '会议',
    [EventCategory.FEEDBACK]: '反馈',
    [EventCategory.IDEA]: '想法',
    [EventCategory.REMINDER]: '提醒'
  };
  return names[category] || category;
};

// Helper function to get event category icon
export const getEventCategoryIcon = (category: EventCategory): string => {
  const icons: Record<EventCategory, string> = {
    [EventCategory.NORMAL]: '📝',
    [EventCategory.EXCEPTION]: '⚠️',
    [EventCategory.MILESTONE]: '🎯',
    [EventCategory.MEETING]: '👥',
    [EventCategory.FEEDBACK]: '💬',
    [EventCategory.IDEA]: '💡',
    [EventCategory.REMINDER]: '⏰'
  };
  return icons[category] || '📝';
};

// Helper function to get event category color
export const getEventCategoryColor = (category: EventCategory): string => {
  const colors: Record<EventCategory, string> = {
    [EventCategory.NORMAL]: '#007AFF',
    [EventCategory.EXCEPTION]: '#FF3B30',
    [EventCategory.MILESTONE]: '#FF9500',
    [EventCategory.MEETING]: '#5856D6',
    [EventCategory.FEEDBACK]: '#34C759',
    [EventCategory.IDEA]: '#FFCC00',
    [EventCategory.REMINDER]: '#FF2D55'
  };
  return colors[category] || '#007AFF';
};

// Helper function to get severity color
export const getSeverityColor = (severity?: string): string => {
  const colors: Record<string, string> = {
    low: '#34C759',
    medium: '#FFCC00',
    high: '#FF9500',
    critical: '#FF3B30'
  };
  return severity ? colors[severity] || '#8E8E93' : '#8E8E93';
};
