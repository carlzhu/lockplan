import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// 配置通知处理器
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// 请求通知权限
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '任务提醒',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4a90e2',
      description: '任务和事件的提醒通知',
    });

    // 创建高优先级通知渠道
    await Notifications.setNotificationChannelAsync('high-priority', {
      name: '高优先级提醒',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#ff3b30',
      description: '重要任务的提醒通知',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    console.log('Notification permissions granted');
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

// 调度任务提醒
export async function scheduleTaskNotification(
  taskId: string | number,
  title: string,
  body: string,
  triggerDate: Date,
  priority: 'high' | 'medium' | 'low' = 'medium'
) {
  try {
    // 确保触发时间在未来
    if (triggerDate <= new Date()) {
      console.log('Trigger date is in the past, skipping notification');
      return null;
    }

    const channelId = priority === 'high' ? 'high-priority' : 'default';

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📋 任务提醒',
        body: `${title}${body ? '\n' + body : ''}`,
        data: { 
          taskId, 
          type: 'task_reminder',
          priority 
        },
        sound: true,
        priority: priority === 'high' 
          ? Notifications.AndroidNotificationPriority.HIGH 
          : Notifications.AndroidNotificationPriority.DEFAULT,
        ...(Platform.OS === 'android' && { channelId }),
      },
      trigger: {
        type: 'date' as const,
        date: triggerDate,
      },
    });

    console.log('Notification scheduled:', identifier, 'for', triggerDate);
    return identifier;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

// 调度事件提醒
export async function scheduleEventNotification(
  eventId: number,
  title: string,
  body: string,
  triggerDate: Date,
  category: string = 'NORMAL'
) {
  try {
    // 确保触发时间在未来
    if (triggerDate <= new Date()) {
      console.log('Trigger date is in the past, skipping notification');
      return null;
    }

    const priority = category === 'EXCEPTION' || category === 'MILESTONE' ? 'high' : 'default';

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: getEventNotificationTitle(category),
        body: `${title}${body ? '\n' + body : ''}`,
        data: { 
          eventId, 
          type: 'event_reminder',
          category 
        },
        sound: true,
        priority: priority === 'high' 
          ? Notifications.AndroidNotificationPriority.HIGH 
          : Notifications.AndroidNotificationPriority.DEFAULT,
        ...(Platform.OS === 'android' && { channelId: priority }),
      },
      trigger: {
        type: 'date' as const,
        date: triggerDate,
      },
    });

    console.log('Event notification scheduled:', identifier, 'for', triggerDate);
    return identifier;
  } catch (error) {
    console.error('Error scheduling event notification:', error);
    return null;
  }
}

// 获取事件通知标题
function getEventNotificationTitle(category: string): string {
  const titles: Record<string, string> = {
    NORMAL: '📝 事件提醒',
    EXCEPTION: '⚠️ 异常提醒',
    MILESTONE: '🎯 里程碑提醒',
    MEETING: '👥 会议提醒',
    FEEDBACK: '💬 反馈提醒',
    IDEA: '💡 想法提醒',
    REMINDER: '⏰ 提醒',
  };
  return titles[category] || '📝 事件提醒';
}

// 取消通知
export async function cancelNotification(identifier: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log('Notification cancelled:', identifier);
    return true;
  } catch (error) {
    console.error('Error cancelling notification:', error);
    return false;
  }
}

// 取消所有通知
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications cancelled');
    return true;
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
    return false;
  }
}

// 获取所有已调度的通知
export async function getAllScheduledNotifications() {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('Scheduled notifications:', notifications.length);
    return notifications;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}

// 立即发送通知（用于测试）
export async function sendImmediateNotification(title: string, body: string, data?: any) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'immediate', ...data },
        sound: true,
      },
      trigger: null, // 立即发送
    });
    console.log('Immediate notification sent');
    return true;
  } catch (error) {
    console.error('Error sending immediate notification:', error);
    return false;
  }
}

// 检查通知权限状态
export async function checkNotificationPermissions() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
}

// 格式化提醒时间显示
export function formatReminderTime(reminderTime: string): string {
  const date = new Date(reminderTime);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  if (diff < 0) {
    return '已过期';
  }
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}天后`;
  } else if (hours > 0) {
    return `${hours}小时后`;
  } else if (minutes > 0) {
    return `${minutes}分钟后`;
  } else {
    return '即将到来';
  }
}
