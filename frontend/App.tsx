import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

// Context
import { AuthProvider } from './src/context/AuthContext';

// API Configuration
import { initializeApiUrl } from './src/config/apiConfig';

// Notification Service
import { registerForPushNotificationsAsync } from './src/services/notificationService';

// Sync Service
import { setupNetworkListener, startAutoSync, stopAutoSync, cleanupNetworkListener } from './src/services/syncService';

export default function App() {
  const [isReady, setIsReady] = React.useState(false);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    // Initialize API URL from AsyncStorage before rendering the app
    const initialize = async () => {
      await initializeApiUrl();
      
      // Register for push notifications
      try {
        await registerForPushNotificationsAsync();
        console.log('Notifications initialized');
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
      
      // Setup sync service
      try {
        setupNetworkListener();
        startAutoSync(60000); // 每分钟同步一次
        console.log('Sync service initialized');
      } catch (error) {
        console.error('Error initializing sync service:', error);
      }
      
      setIsReady(true);
    };
    
    initialize();

    // 监听通知接收（应用在前台时）
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
    });

    // 监听通知点击
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification clicked:', response);
      const data = response.notification.request.content.data;
      
      // 根据通知类型导航到相应页面
      if (data.type === 'task_reminder' && data.taskId) {
        console.log('Navigate to task:', data.taskId);
        // TODO: 实现导航到任务详情页
        // navigation.navigate('EditTask', { taskId: data.taskId });
      } else if (data.type === 'event_reminder' && data.eventId) {
        console.log('Navigate to event:', data.eventId);
        // TODO: 实现导航到事件详情页
        // navigation.navigate('EditEvent', { eventId: data.eventId });
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      
      // Cleanup sync service
      stopAutoSync();
      cleanupNetworkListener();
    };
  }, []);

  // Wait for API URL to be initialized before rendering
  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
