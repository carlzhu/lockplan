import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const TASKS_KEY = '@donow_tasks';
const SYNC_QUEUE_KEY = '@donow_sync_queue';
const LAST_SYNC_KEY = '@donow_last_sync';

// 本地任务数据结构
export interface LocalTask {
  id: string;  // UUID
  createdAt: number;  // 毫秒时间戳
  updatedAt: number;  // 毫秒时间戳
  syncStatus: 'synced' | 'pending' | 'conflict';
  lastSyncedAt?: number;
  
  // 业务数据
  title: string;
  description?: string;
  dueDate?: string;
  priority?: string;
  completed: boolean;
  categoryId?: number;
  
  // 通知相关
  notificationId?: string;
  reminderEnabled: boolean;
  reminderMinutes: number;
  
  // 软删除
  deleted: boolean;
  deletedAt?: number;
  
  // 服务器 ID（用于已同步的任务）
  serverId?: number;
}

// 同步操作记录
export interface SyncOperation {
  id: string;
  entityType: 'task' | 'event';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  timestamp: number;
  data: any;
  status: 'pending' | 'syncing' | 'success' | 'failed';
  retryCount: number;
  error?: string;
}

// ============ 工具函数 ============

// 生成唯一 ID
export function generateId(): string {
  return uuidv4();
}

// 获取当前时间戳（毫秒）
export function getTimestamp(): number {
  return Date.now();
}

// ============ 任务 CRUD 操作 ============

// 获取所有本地任务（不包括已删除）
export async function getLocalTasks(): Promise<LocalTask[]> {
  try {
    const data = await AsyncStorage.getItem(TASKS_KEY);
    if (!data) return [];
    
    const tasks: LocalTask[] = JSON.parse(data);
    // 过滤已删除的任务
    return tasks.filter(t => !t.deleted).sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error getting local tasks:', error);
    return [];
  }
}

// 获取单个任务
export async function getLocalTask(id: string): Promise<LocalTask | null> {
  try {
    const tasks = await getAllLocalTasks(); // 包括已删除的
    return tasks.find(t => t.id === id) || null;
  } catch (error) {
    console.error('Error getting local task:', error);
    return null;
  }
}

// 获取所有任务（包括已删除）
async function getAllLocalTasks(): Promise<LocalTask[]> {
  try {
    const data = await AsyncStorage.getItem(TASKS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting all local tasks:', error);
    return [];
  }
}

// 保存任务到本地
export async function saveLocalTask(task: Partial<LocalTask>): Promise<LocalTask> {
  try {
    const tasks = await getAllLocalTasks();
    const now = getTimestamp();
    
    const newTask: LocalTask = {
      id: task.id || generateId(),
      createdAt: task.createdAt || now,
      updatedAt: now,
      syncStatus: 'pending',
      
      title: task.title || '',
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      completed: task.completed || false,
      categoryId: task.categoryId,
      
      notificationId: task.notificationId,
      reminderEnabled: task.reminderEnabled || false,
      reminderMinutes: task.reminderMinutes || 15,
      
      deleted: false,
      serverId: task.serverId,
    };
    
    tasks.push(newTask);
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    
    // 添加到同步队列
    await addToSyncQueue('task', newTask.id, 'create', newTask);
    
    console.log('Task saved locally:', newTask.id);
    return newTask;
  } catch (error) {
    console.error('Error saving local task:', error);
    throw error;
  }
}

// 更新本地任务
export async function updateLocalTask(id: string, updates: Partial<LocalTask>): Promise<LocalTask> {
  try {
    const tasks = await getAllLocalTasks();
    const index = tasks.findIndex(t => t.id === id);
    
    if (index === -1) {
      throw new Error(`Task not found: ${id}`);
    }
    
    const now = getTimestamp();
    const updatedTask: LocalTask = {
      ...tasks[index],
      ...updates,
      id: tasks[index].id, // 确保 ID 不被覆盖
      createdAt: tasks[index].createdAt, // 确保创建时间不被覆盖
      updatedAt: now,
      syncStatus: 'pending',
    };
    
    tasks[index] = updatedTask;
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    
    // 添加到同步队列
    await addToSyncQueue('task', id, 'update', updatedTask);
    
    console.log('Task updated locally:', id);
    return updatedTask;
  } catch (error) {
    console.error('Error updating local task:', error);
    throw error;
  }
}

// 删除本地任务（软删除）
export async function deleteLocalTask(id: string): Promise<void> {
  try {
    const tasks = await getAllLocalTasks();
    const index = tasks.findIndex(t => t.id === id);
    
    if (index === -1) {
      throw new Error(`Task not found: ${id}`);
    }
    
    const now = getTimestamp();
    tasks[index].deleted = true;
    tasks[index].deletedAt = now;
    tasks[index].updatedAt = now;
    tasks[index].syncStatus = 'pending';
    
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    
    // 添加到同步队列
    await addToSyncQueue('task', id, 'delete', { id, deletedAt: now });
    
    console.log('Task deleted locally:', id);
  } catch (error) {
    console.error('Error deleting local task:', error);
    throw error;
  }
}

// 完成任务
export async function completeLocalTask(id: string): Promise<LocalTask> {
  return updateLocalTask(id, { completed: true });
}

// ============ 同步队列操作 ============

// 添加到同步队列
async function addToSyncQueue(
  entityType: 'task' | 'event',
  entityId: string,
  operation: 'create' | 'update' | 'delete',
  data: any
): Promise<void> {
  try {
    const queueData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    const queue: SyncOperation[] = queueData ? JSON.parse(queueData) : [];
    
    // 检查是否已有相同实体的待同步操作
    const existingIndex = queue.findIndex(
      op => op.entityId === entityId && op.status === 'pending'
    );
    
    if (existingIndex !== -1) {
      // 更新现有操作
      queue[existingIndex] = {
        ...queue[existingIndex],
        operation,
        timestamp: getTimestamp(),
        data,
      };
    } else {
      // 添加新操作
      const syncOp: SyncOperation = {
        id: generateId(),
        entityType,
        entityId,
        operation,
        timestamp: getTimestamp(),
        data,
        status: 'pending',
        retryCount: 0,
      };
      queue.push(syncOp);
    }
    
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    console.log(`Added to sync queue: ${operation} ${entityType} ${entityId}`);
  } catch (error) {
    console.error('Error adding to sync queue:', error);
  }
}

// 获取同步队列
export async function getSyncQueue(): Promise<SyncOperation[]> {
  try {
    const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting sync queue:', error);
    return [];
  }
}

// 更新同步操作状态
export async function updateSyncOperation(
  id: string,
  updates: Partial<SyncOperation>
): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const index = queue.findIndex(op => op.id === id);
    
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    }
  } catch (error) {
    console.error('Error updating sync operation:', error);
  }
}

// 移除同步操作
export async function removeSyncOperation(id: string): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const filtered = queue.filter(op => op.id !== id);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing sync operation:', error);
  }
}

// 清空同步队列
export async function clearSyncQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify([]));
    console.log('Sync queue cleared');
  } catch (error) {
    console.error('Error clearing sync queue:', error);
  }
}

// ============ 同步时间戳 ============

// 获取最后同步时间
export async function getLastSyncTime(): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return data ? parseInt(data, 10) : 0;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return 0;
  }
}

// 设置最后同步时间
export async function setLastSyncTime(timestamp: number): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_SYNC_KEY, timestamp.toString());
  } catch (error) {
    console.error('Error setting last sync time:', error);
  }
}

// ============ 数据清理 ============

// 清空所有本地数据（慎用！）
export async function clearAllLocalData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([TASKS_KEY, SYNC_QUEUE_KEY, LAST_SYNC_KEY]);
    console.log('All local data cleared');
  } catch (error) {
    console.error('Error clearing local data:', error);
  }
}

// 获取存储统计
export async function getStorageStats(): Promise<{
  totalTasks: number;
  activeTasks: number;
  deletedTasks: number;
  pendingSync: number;
}> {
  try {
    const allTasks = await getAllLocalTasks();
    const queue = await getSyncQueue();
    
    return {
      totalTasks: allTasks.length,
      activeTasks: allTasks.filter(t => !t.deleted).length,
      deletedTasks: allTasks.filter(t => t.deleted).length,
      pendingSync: queue.filter(op => op.status === 'pending').length,
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return {
      totalTasks: 0,
      activeTasks: 0,
      deletedTasks: 0,
      pendingSync: 0,
    };
  }
}
