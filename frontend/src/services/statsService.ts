import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_PREFIX } from './apiConfig';
export interface FrontendStats {
  TaskTotal: number;
  TaskCompleted: number;
  EventTotal: number;
  EventThisWeek: number;
  EventThisMonth: number;
  ItemTotal: number;
  ItemCompleted: number;
  GeneratedAt?: string;
}

export async function fetchStats(): Promise<FrontendStats | null> {
  try {
    const token = await AsyncStorage.getItem('token');
    const base = (API_URL ?? 'http://localhost:5000') + (API_PREFIX ?? '/api/donow');
    const url = '/stats';
    const resp = await axios.get<FrontendStats>(base + url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
    return resp.data as FrontendStats;
  } catch (e) {
    console.warn('Fetch stats failed', e);
    return null;
  }
}
