import NetInfo from '@react-native-community/netinfo';
import {
  getLocalTasks,
  updateLocalTask,
  getSyncQueue,
  updateSyncOperation,
  removeSyncOperation,
  getTimestamp,
  setLastSyncTime,
  getLastSyncTime,
  LocalTask,
  SyncOperation,
} from './localStorageService';
import { API_URL } from '../config/apiConfig';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============ 网络状态 ============

// 检查网络连接
export async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected || false;
  } catch (error) {
    console.error('Error checking network status:', error);
    return false;
  }
}

// ============ 同步操作 ============

// 同步单个操作到服务器
async function syncOperationToServer(op: SyncOperation): Promise<boolean> {
  try {
    // 获取认证 token
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      return false;
    }
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    
    switch (op.operation) {
      case 'create':
        // 创建任务
        const createData = {
          title: op.data.title,
          description: op.data.description,
          dueDate: op.data.dueDate,
          priority: op.data.priority,
          completed: op.data.completed,
          categoryId: op.data.categoryId,
        };
        
        const createResponse = await axios.post(
          `${API_URL}/tasks`,
          createData,
          { headers }
        );
        
        // 更新本地任务的 serverId
        await updateLocalTask(op.entityId, {
          serverId: createResponse.data.id,
          syncStatus: 'synced',
          lastSyncedAt: getTimestamp(),
        });
        
        console.log(`Task created on server: ${op.entityId} -> ${createResponse.data.id}`);
        break;
      
      case 'update':
        // 更新任务
        const task = op.data;
        const serverId = task.serverId;
        
        if (!serverId) {
          console.error('No serverId for update operation');
          return false;
        }
        
        const updateData = {
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          priority: task.priority,
          completed: task.completed,
          categoryId: task.categoryId,
        };
        
        await axios.put(
          `${API_URL}/tasks/${serverId}`,
          updateData,
          { headers }
        );
        
        // 更新本地同步状态
        await updateLocalTask(op.entityId, {
          syncStatus: 'synced',
          lastSyncedAt: getTimestamp(),
        });
        
        console.log(`Task updated on server: ${op.entityId} (${serverId})`);
        break;
      
      case 'delete':
        // 删除任务
        const deleteTask = op.data;
        const deleteServerId = deleteTask.serverId;
        
        if (!deleteServerId) {
          console.error('No serverId for delete operation');
          return false;
        }
        
        await axios.delete(
          `${API_URL}/tasks/${deleteServerId}`,
          { headers }
        );
        
        console.log(`Task deleted on server: ${op.entityId} (${deleteServerId})`);
        break;
    }
    
    return true;
  } catch (error: any) {
    console.error('Error syncing operation to server:', error);
    
    if (error.response) {
      console.error('Server response:', error.response.status, error.response.data);
    }
    
    return false;
  }
}

// 执行同步
export async function syncWithServer(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  const online = await isOnline();
  if (!online) {
    console.log('Offline, skipping sync');
    return { success: 0, failed: 0, total: 0 };
  }
  
  const queue = await getSyncQueue();
  const pendingOps = queue.filter(
    op => op.status === 'pending' || (op.status === 'failed' && op.retryCount < 3)
  );
  
  if (pendingOps.length === 0) {
    console.log('No pending operations to sync');
    return { success: 0, failed: 0, total: 0 };
  }
  
  console.log(`Syncing ${pendingOps.length} operations...`);
  
  let success = 0;
  let failed = 0;
  
  for (const op of pendingOps) {
    // 更新状态为 syncing
    await updateSyncOperation(op.id, { status: 'syncing' });
    
    const result = await syncOperationToServer(op);
    
    if (result) {
      success++;
      // 移除成功的操作
      await removeSyncOperation(op.id);
    } else {
      failed++;
      // 更新失败状态
      await updateSyncOperation(op.id, {
        status: 'failed',
        retryCount: op.retryCount + 1,
        error: 'Sync failed',
      });
    }
  }
  
  // 更新最后同步时间
  if (success > 0) {
    await setLastSyncTime(getTimestamp());
  }
  
  console.log(`Sync complete: ${success} success, ${failed} failed`);
  
  return { success, failed, total: pendingOps.length };
}

// ============ 从服务器拉取数据 ============

// 从服务器拉取任务
export async function pullTasksFromServer(): Promise<void> {
  try {
    const online = await isOnline();
    if (!online) {
      console.log('Offline, skipping pull');
      return;
    }
    
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      return;
    }
    
    const headers = {
      'Authorization': `Bearer ${token}`,
    };
    
    // 获取服务器上的所有任务
    const response = await axios.get(`${API_URL}/tasks`, { headers });
    const serverTasks = response.data;
    
    console.log(`Pulled ${serverTasks.length} tasks from server`);
    
    // TODO: 合并服务器数据到本地
    // 这里需要实现冲突检测和解决逻辑
    // 暂时跳过，等待完整实现
    
  } catch (error) {
    console.error('Error pulling tasks from server:', error);
  }
}

// ============ 自动同步 ============

let syncInterval: NodeJS.Timeout | null = null;
let networkUnsubscribe: (() => void) | null = null;

// 启动自动同步
export function startAutoSync(intervalMs: number = 60000): void {
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  // 定期同步
  syncInterval = setInterval(async () => {
    console.log('Auto sync triggered');
    await syncWithServer();
  }, intervalMs);
  
  console.log(`Auto sync started (interval: ${intervalMs}ms)`);
}

// 停止自动同步
export function stopAutoSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('Auto sync stopped');
  }
}

// 设置网络监听器
export function setupNetworkListener(): void {
  if (networkUnsubscribe) {
    networkUnsubscribe();
  }
  
  networkUnsubscribe = NetInfo.addEventListener(state => {
    console.log('Network state changed:', state.isConnected);
    
    if (state.isConnected) {
      // 网络恢复，立即同步
      console.log('Network restored, syncing...');
      syncWithServer();
    }
  });
  
  console.log('Network listener setup');
}

// 清理监听器
export function cleanupNetworkListener(): void {
  if (networkUnsubscribe) {
    networkUnsubscribe();
    networkUnsubscribe = null;
    console.log('Network listener cleaned up');
  }
}

// ============ 同步状态 ============

// 获取同步状态
export async function getSyncStatus(): Promise<{
  isOnline: boolean;
  pendingOperations: number;
  lastSyncTime: number;
  lastSyncTimeFormatted: string;
}> {
  const online = await isOnline();
  const queue = await getSyncQueue();
  const pendingOps = queue.filter(op => op.status === 'pending');
  const lastSync = await getLastSyncTime();
  
  const lastSyncDate = lastSync > 0 ? new Date(lastSync) : null;
  const lastSyncFormatted = lastSyncDate
    ? lastSyncDate.toLocaleString('zh-CN')
    : '从未同步';
  
  return {
    isOnline: online,
    pendingOperations: pendingOps.length,
    lastSyncTime: lastSync,
    lastSyncTimeFormatted: lastSyncFormatted,
  };
}
