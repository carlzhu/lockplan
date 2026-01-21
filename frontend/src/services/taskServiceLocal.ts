/**
 * 离线优先的任务服务
 * 
 * 所有操作优先使用本地存储，然后异步同步到服务器
 */

import {
  getLocalTasks,
  getLocalTask,
  saveLocalTask,
  updateLocalTask,
  deleteLocalTask,
  completeLocalTask,
  LocalTask,
} from './localStorageService';
import { syncWithServer } from './syncService';

// 导出 Task 类型（兼容现有代码）
export interface Task {
  id?: string | number;
  title: string;
  description?: string;
  dueDate?: string;
  completed?: boolean;
  priority?: string;
  reminderTime?: string;
  tags?: string[];
  createdAt?: string;
  categoryId?: number;
  categoryName?: string;
  completedAt?: string;
  
  // 本地特有字段
  syncStatus?: 'synced' | 'pending' | 'conflict';
  notificationId?: string;
  reminderEnabled?: boolean;
  reminderMinutes?: number;
}

// 将 LocalTask 转换为 Task（用于界面显示）
function localTaskToTask(localTask: LocalTask): Task {
  return {
    id: localTask.id,
    title: localTask.title,
    description: localTask.description,
    dueDate: localTask.dueDate,
    completed: localTask.completed,
    priority: localTask.priority,
    categoryId: localTask.categoryId,
    createdAt: new Date(localTask.createdAt).toISOString(),
    
    // 本地特有字段
    syncStatus: localTask.syncStatus,
    notificationId: localTask.notificationId,
    reminderEnabled: localTask.reminderEnabled,
    reminderMinutes: localTask.reminderMinutes,
  };
}

// 将 Task 转换为 LocalTask（用于保存）
function taskToLocalTask(task: Task): Partial<LocalTask> {
  return {
    id: typeof task.id === 'string' ? task.id : undefined,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    completed: task.completed || false,
    priority: task.priority,
    categoryId: task.categoryId,
    notificationId: task.notificationId,
    reminderEnabled: task.reminderEnabled || false,
    reminderMinutes: task.reminderMinutes || 15,
  };
}

// ============ 任务 CRUD 操作 ============

/**
 * 获取所有任务
 * 优先从本地读取，后台触发同步
 */
export const getTasks = async (): Promise<Task[]> => {
  try {
    console.log('Getting tasks from local storage');
    const localTasks = await getLocalTasks();
    const tasks = localTasks.map(localTaskToTask);
    
    console.log(`Loaded ${tasks.length} tasks from local storage`);
    
    // 后台触发同步（不阻塞返回）
    syncWithServer().catch(err => {
      console.error('Background sync failed:', err);
    });
    
    return tasks;
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw error;
  }
};

/**
 * 获取单个任务
 */
export const getTask = async (id: string | number): Promise<Task | null> => {
  try {
    const taskId = typeof id === 'string' ? id : id.toString();
    console.log(`Getting task ${taskId} from local storage`);
    
    const localTask = await getLocalTask(taskId);
    if (!localTask) {
      console.log(`Task ${taskId} not found`);
      return null;
    }
    
    return localTaskToTask(localTask);
  } catch (error) {
    console.error(`Error getting task ${id}:`, error);
    throw error;
  }
};

/**
 * 创建任务
 * 立即保存到本地，后台同步到服务器
 */
export const createTask = async (task: Task): Promise<Task> => {
  try {
    console.log('Creating task locally:', task.title);
    
    const localTaskData = taskToLocalTask(task);
    const savedTask = await saveLocalTask(localTaskData);
    
    console.log('Task created locally:', savedTask.id);
    
    // 后台触发同步（不阻塞返回）
    syncWithServer().catch(err => {
      console.error('Background sync failed:', err);
    });
    
    return localTaskToTask(savedTask);
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

/**
 * 更新任务
 * 立即更新本地，后台同步到服务器
 */
export const updateTask = async (id: string | number, task: Task): Promise<Task> => {
  try {
    const taskId = typeof id === 'string' ? id : id.toString();
    console.log(`Updating task ${taskId} locally`);
    
    const updates = taskToLocalTask(task);
    const updatedTask = await updateLocalTask(taskId, updates);
    
    console.log('Task updated locally:', taskId);
    
    // 后台触发同步（不阻塞返回）
    syncWithServer().catch(err => {
      console.error('Background sync failed:', err);
    });
    
    return localTaskToTask(updatedTask);
  } catch (error) {
    console.error(`Error updating task ${id}:`, error);
    throw error;
  }
};

/**
 * 删除任务
 * 立即从本地删除（软删除），后台同步到服务器
 */
export const deleteTask = async (id: string | number): Promise<boolean> => {
  try {
    const taskId = typeof id === 'string' ? id : id.toString();
    console.log(`Deleting task ${taskId} locally`);
    
    await deleteLocalTask(taskId);
    
    console.log('Task deleted locally:', taskId);
    
    // 后台触发同步（不阻塞返回）
    syncWithServer().catch(err => {
      console.error('Background sync failed:', err);
    });
    
    return true;
  } catch (error) {
    console.error(`Error deleting task ${id}:`, error);
    throw error;
  }
};

/**
 * 完成任务
 * 立即更新本地，后台同步到服务器
 */
export const completeTask = async (id: string | number): Promise<Task> => {
  try {
    const taskId = typeof id === 'string' ? id : id.toString();
    console.log(`Completing task ${taskId} locally`);
    
    const completedTask = await completeLocalTask(taskId);
    
    console.log('Task completed locally:', taskId);
    
    // 后台触发同步（不阻塞返回）
    syncWithServer().catch(err => {
      console.error('Background sync failed:', err);
    });
    
    return localTaskToTask(completedTask);
  } catch (error) {
    console.error(`Error completing task ${id}:`, error);
    throw error;
  }
};

// ============ 语音和文本处理（暂时保留原有实现）============

/**
 * 从文本创建任务
 * TODO: 实现本地 AI 处理或使用服务器 API
 */
export const createTaskFromText = async (text: string): Promise<Task> => {
  // 暂时使用简单解析
  console.log('Creating task from text:', text);
  
  const task: Task = {
    title: text.substring(0, 100), // 取前100个字符作为标题
    description: text.length > 100 ? text : undefined,
    completed: false,
  };
  
  return createTask(task);
};

/**
 * 从语音创建任务
 * TODO: 实现本地语音识别或使用服务器 API
 */
export const createTaskFromVoice = async (audioUri: string): Promise<Task[]> => {
  console.log('Creating task from voice:', audioUri);
  
  // 暂时返回模拟数据
  const task: Task = {
    title: '语音输入的任务',
    description: '这是从语音创建的任务（模拟）',
    completed: false,
  };
  
  const createdTask = await createTask(task);
  return [createdTask];
};
