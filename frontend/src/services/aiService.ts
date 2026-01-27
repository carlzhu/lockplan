import axios from 'axios';

export interface AIEnhanceRequest {
  description: string;
  type: 'task' | 'event';
  generateTitle?: boolean;
}

export interface AIEnhanceResponse {
  title?: string;
  description?: string;
  enhancedDescription?: string;
  type?: string;
  priority?: string;
  suggestedDateTime?: string;
  suggestedPriority?: 'Low' | 'Medium' | 'High';
  suggestedCategory?: string;
  category?: string;
  suggestedTags?: string[];
  tags?: string[];
  dueDate?: string;
  eventTime?: string;
}

/**
 * 使用 AI 增强任务/事件描述
 * 功能：
 * 1. 生成标题（如果需要）
 * 2. 润色描述
 * 3. 提取时间信息
 * 4. 识别优先级
 * 5. 提取标签
 */
export const enhanceWithAI = async (request: AIEnhanceRequest): Promise<AIEnhanceResponse> => {
  try {
    const response = await axios.post('/ai/enhance', request);
    return response.data;
  } catch (error: any) {
    console.error('AI enhance error:', error);
    
    // 如果 AI 服务不可用，提供基本的本地处理
    return fallbackEnhance(request);
  }
};

/**
 * 本地降级处理（当 AI 服务不可用时）
 */
const fallbackEnhance = (request: AIEnhanceRequest): AIEnhanceResponse => {
  const { description, generateTitle } = request;
  const result: AIEnhanceResponse = {};
  
  // 基础标题生成
  if (generateTitle && description) {
    const words = description.trim().split(/\s+/);
    result.title = words.slice(0, 5).join(' ');
    if (result.title.length > 20) {
      result.title = result.title.substring(0, 20) + '...';
    }
  }
  
  // 基础描述优化（去除多余空格）
  result.enhancedDescription = description.trim().replace(/\s+/g, ' ');
  
  // 简单的时间识别
  const timePatterns = [
    /明天|tomorrow/i,
    /下周|next week/i,
    /今天|today/i,
  ];
  
  // 简单的优先级识别
  const highPriorityKeywords = ['紧急', '重要', '急', 'urgent', 'important', 'critical'];
  const mediumPriorityKeywords = ['一般', '普通', 'normal', 'medium'];
  
  const lowerDesc = description.toLowerCase();
  
  if (highPriorityKeywords.some(keyword => lowerDesc.includes(keyword))) {
    result.suggestedPriority = 'High';
  } else if (mediumPriorityKeywords.some(keyword => lowerDesc.includes(keyword))) {
    result.suggestedPriority = 'Medium';
  } else {
    result.suggestedPriority = 'Low';
  }
  
  return result;
};

/**
 * 从文本中提取时间信息
 */
export const extractDateTime = (text: string): Date | null => {
  // 这里可以实现更复杂的时间提取逻辑
  // 目前返回 null，由 AI 服务处理
  return null;
};

/**
 * 从文本中提取优先级
 */
export const extractPriority = (text: string): 'Low' | 'Medium' | 'High' | null => {
  const lowerText = text.toLowerCase();
  
  const highKeywords = ['高优先级', '紧急', '重要', '急', 'high', 'urgent', 'important', 'critical'];
  const mediumKeywords = ['中优先级', '一般', '普通', 'medium', 'normal'];
  const lowKeywords = ['低优先级', '不急', 'low'];
  
  if (highKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'High';
  } else if (mediumKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'Medium';
  } else if (lowKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'Low';
  }
  
  return null;
};

/**
 * 从文本中提取标签
 */
export const extractTags = (text: string): string[] => {
  const tags: string[] = [];
  
  // 提取 #标签
  const hashtagPattern = /#(\w+)/g;
  let match;
  while ((match = hashtagPattern.exec(text)) !== null) {
    tags.push(match[1]);
  }
  
  return tags;
};
