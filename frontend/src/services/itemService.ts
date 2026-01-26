import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ItemType = 'task' | 'event' | 'project' | 'note';

export interface Item {
  id: number;
  title: string;
  description?: string;
  type: ItemType;
  dueDate?: string;
  eventTime?: string;
  reminderTime?: string;
  isCompleted: boolean;
  completedAt?: string;
  priority?: string;
  category?: string;
  parentId?: number;
  subItems?: Item[];
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateItemDto {
  title: string;
  description?: string;
  type: ItemType;
  dueDate?: string;
  eventTime?: string;
  reminderTime?: string;
  priority?: string;
  category?: string;
  parentId?: number;
  tags?: string[];
  originalInput?: string;
}

export interface UpdateItemDto {
  title?: string;
  description?: string;
  dueDate?: string;
  eventTime?: string;
  reminderTime?: string;
  isCompleted?: boolean;
  priority?: string;
  category?: string;
  parentId?: number;
  tags?: string[];
}

const ITEMS_STORAGE_KEY = '@donow_items';

/**
 * 获取所有项目
 */
export const getItems = async (
  type?: ItemType,
  includeSubItems: boolean = false,
  topLevelOnly: boolean = false
): Promise<Item[]> => {
  try {
    const params: any = {};
    if (type) params.type = type;
    if (includeSubItems) params.includeSubItems = true;
    if (topLevelOnly) params.topLevelOnly = true;

    const response = await axios.get('/items', { params });
    
    // 保存到本地存储
    await AsyncStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(response.data));
    
    return response.data;
  } catch (error) {
    console.error('Error fetching items:', error);
    
    // 从本地存储加载
    const cached = await AsyncStorage.getItem(ITEMS_STORAGE_KEY);
    if (cached) {
      const items = JSON.parse(cached);
      // 应用筛选
      if (type) {
        return items.filter((item: Item) => item.type === type);
      }
      return items;
    }
    
    throw error;
  }
};

/**
 * 获取单个项目
 */
export const getItemById = async (
  id: number,
  includeSubItems: boolean = false
): Promise<Item> => {
  const params: any = {};
  if (includeSubItems) params.includeSubItems = true;

  const response = await axios.get(`/items/${id}`, { params });
  return response.data;
};

/**
 * 创建项目
 */
export const createItem = async (dto: CreateItemDto): Promise<Item> => {
  const response = await axios.post('/items', dto);
  return response.data;
};

/**
 * 更新项目
 */
export const updateItem = async (id: number, dto: UpdateItemDto): Promise<Item> => {
  const response = await axios.put(`/items/${id}`, dto);
  return response.data;
};

/**
 * 删除项目
 */
export const deleteItem = async (id: number): Promise<void> => {
  await axios.delete(`/items/${id}`);
};

/**
 * 标记为已完成
 */
export const completeItem = async (id: number): Promise<Item> => {
  const response = await axios.post(`/items/${id}/complete`);
  return response.data;
};

/**
 * 标记为未完成
 */
export const uncompleteItem = async (id: number): Promise<Item> => {
  const response = await axios.post(`/items/${id}/uncomplete`);
  return response.data;
};

/**
 * 获取子项目
 */
export const getSubItems = async (parentId: number): Promise<Item[]> => {
  const response = await axios.get(`/items/${parentId}/subitems`);
  return response.data;
};

/**
 * 添加子项目
 */
export const addSubItem = async (parentId: number, dto: CreateItemDto): Promise<Item> => {
  const response = await axios.post(`/items/${parentId}/subitems`, dto);
  return response.data;
};

/**
 * 获取任务（便捷方法）
 */
export const getTasks = async (): Promise<Item[]> => {
  return getItems('task');
};

/**
 * 获取事件（便捷方法）
 */
export const getEvents = async (): Promise<Item[]> => {
  return getItems('event');
};

/**
 * 创建任务（便捷方法）
 */
export const createTask = async (data: Omit<CreateItemDto, 'type'>): Promise<Item> => {
  return createItem({ ...data, type: 'task' });
};

/**
 * 创建事件（便捷方法）
 */
export const createEvent = async (data: Omit<CreateItemDto, 'type'>): Promise<Item> => {
  return createItem({ ...data, type: 'event' });
};
