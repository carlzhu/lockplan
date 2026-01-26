import axios from 'axios';

export interface AIEnhanceInput {
  text: string;
  type?: 'task' | 'event' | 'project' | 'note';
}

export interface AIEnhanceResult {
  title: string;
  description: string;
  type: 'task' | 'event' | 'project' | 'note';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  tags?: string[];
  dueDate?: string;
  eventTime?: string;
  category?: string;
}

/**
 * 使用 AI 增强用户输入
 * 自动提取标题、描述、时间、优先级、标签等信息
 */
export const enhanceWithAI = async (input: AIEnhanceInput): Promise<AIEnhanceResult> => {
  try {
    const response = await axios.post('/ai/enhance', {
      text: input.text,
      type: input.type || 'task',
    });

    return response.data;
  } catch (error) {
    console.error('AI enhance error:', error);
    // 如果 AI 失败，返回基本解析
    return fallbackParse(input.text, input.type);
  }
};

/**
 * 解析自然语言时间表达
 * 例如："明天下午3点" -> 具体日期时间
 */
export const parseNaturalTime = (text: string): Date | null => {
  const now = new Date();
  const lowerText = text.toLowerCase();

  // 今天
  if (lowerText.includes('今天') || lowerText.includes('今日')) {
    return setTimeFromText(new Date(), text);
  }

  // 明天
  if (lowerText.includes('明天') || lowerText.includes('明日')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return setTimeFromText(tomorrow, text);
  }

  // 后天
  if (lowerText.includes('后天')) {
    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    return setTimeFromText(dayAfterTomorrow, text);
  }

  // 本周X
  const weekdayMatch = text.match(/本?周([一二三四五六日天])/);
  if (weekdayMatch) {
    const weekdayMap: { [key: string]: number } = {
      '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0
    };
    const targetDay = weekdayMap[weekdayMatch[1]];
    const currentDay = now.getDay();
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7;
    
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    return setTimeFromText(targetDate, text);
  }

  // 下周X
  const nextWeekMatch = text.match(/下周([一二三四五六日天])/);
  if (nextWeekMatch) {
    const weekdayMap: { [key: string]: number } = {
      '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0
    };
    const targetDay = weekdayMap[nextWeekMatch[1]];
    const currentDay = now.getDay();
    let daysToAdd = targetDay - currentDay + 7;
    if (daysToAdd <= 7) daysToAdd += 7;
    
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    return setTimeFromText(targetDate, text);
  }

  // X天后
  const daysLaterMatch = text.match(/(\d+)天[后後]/);
  if (daysLaterMatch) {
    const days = parseInt(daysLaterMatch[1]);
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + days);
    return setTimeFromText(targetDate, text);
  }

  // 年前（春节前）
  if (lowerText.includes('年前')) {
    const nextYear = new Date(now.getFullYear() + 1, 0, 1); // 下一年1月1日
    const daysBeforeNewYear = 7; // 假设年前是春节前7天
    const targetDate = new Date(nextYear);
    targetDate.setDate(targetDate.getDate() - daysBeforeNewYear);
    return setTimeFromText(targetDate, text);
  }

  // 月底
  if (lowerText.includes('月底')) {
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return setTimeFromText(lastDay, text);
  }

  return null;
};

/**
 * 从文本中提取时间并设置到日期对象
 */
function setTimeFromText(date: Date, text: string): Date {
  // 提取小时
  const hourMatch = text.match(/(\d{1,2})[点時时]/);
  if (hourMatch) {
    let hour = parseInt(hourMatch[1]);
    
    // 处理上午/下午
    if (text.includes('下午') || text.includes('晚上')) {
      if (hour < 12) hour += 12;
    } else if (text.includes('上午') || text.includes('早上')) {
      if (hour === 12) hour = 0;
    }
    
    date.setHours(hour);
    
    // 提取分钟
    const minuteMatch = text.match(/(\d{1,2})分/);
    if (minuteMatch) {
      date.setMinutes(parseInt(minuteMatch[1]));
    } else {
      date.setMinutes(0);
    }
    
    date.setSeconds(0);
    date.setMilliseconds(0);
  }

  return date;
}

/**
 * 提取优先级关键词
 */
export const extractPriority = (text: string): 'critical' | 'high' | 'medium' | 'low' | undefined => {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('紧急') || lowerText.includes('urgent') || lowerText.includes('asap')) {
    return 'critical';
  }
  if (lowerText.includes('重要') || lowerText.includes('important') || lowerText.includes('高优先')) {
    return 'high';
  }
  if (lowerText.includes('普通') || lowerText.includes('normal') || lowerText.includes('中优先')) {
    return 'medium';
  }
  if (lowerText.includes('次要') || lowerText.includes('low') || lowerText.includes('低优先')) {
    return 'low';
  }
  
  return undefined;
};

/**
 * 提取标签
 */
export const extractTags = (text: string): string[] => {
  const tags: string[] = [];
  
  // 提取 #标签
  const hashtagMatches = text.match(/#[\u4e00-\u9fa5a-zA-Z0-9_]+/g);
  if (hashtagMatches) {
    tags.push(...hashtagMatches.map(tag => tag.substring(1)));
  }
  
  // 提取常见分类关键词
  const categories = ['工作', '生活', '学习', '健康', '家庭', '社交', '财务', '旅行'];
  categories.forEach(category => {
    if (text.includes(category) && !tags.includes(category)) {
      tags.push(category);
    }
  });
  
  return tags;
};

/**
 * 判断类型
 */
export const detectType = (text: string): 'task' | 'event' | 'project' | 'note' => {
  const lowerText = text.toLowerCase();
  
  // 事件关键词
  if (lowerText.includes('会议') || lowerText.includes('活动') || 
      lowerText.includes('聚会') || lowerText.includes('约会') ||
      lowerText.includes('meeting') || lowerText.includes('event')) {
    return 'event';
  }
  
  // 项目关键词
  if (lowerText.includes('项目') || lowerText.includes('计划') ||
      lowerText.includes('project') || lowerText.includes('plan')) {
    return 'project';
  }
  
  // 笔记关键词
  if (lowerText.includes('记录') || lowerText.includes('笔记') ||
      lowerText.includes('note') || lowerText.includes('memo')) {
    return 'note';
  }
  
  // 默认为任务
  return 'task';
};

/**
 * 后备解析方法（当 AI 不可用时）
 */
function fallbackParse(text: string, type?: string): AIEnhanceResult {
  // 提取第一句作为标题
  const sentences = text.split(/[。！？\n]/);
  const title = sentences[0].trim() || text.substring(0, 50);
  const description = sentences.length > 1 ? sentences.slice(1).join('。').trim() : '';
  
  // 解析时间
  const parsedTime = parseNaturalTime(text);
  
  // 提取优先级
  const priority = extractPriority(text);
  
  // 提取标签
  const tags = extractTags(text);
  
  // 检测类型
  const detectedType = type || detectType(text);
  
  const result: AIEnhanceResult = {
    title,
    description: description || text,
    type: detectedType as any,
    priority,
    tags: tags.length > 0 ? tags : undefined,
  };
  
  // 设置时间
  if (parsedTime) {
    if (detectedType === 'event') {
      result.eventTime = parsedTime.toISOString();
    } else {
      result.dueDate = parsedTime.toISOString();
    }
  }
  
  return result;
}

/**
 * 智能补全：根据部分输入提供建议
 */
export const smartComplete = async (partialText: string): Promise<string[]> => {
  // 这里可以调用后端 AI 服务获取建议
  // 暂时返回本地建议
  const suggestions: string[] = [];
  
  if (partialText.length < 2) return suggestions;
  
  // 时间建议
  const timeKeywords = ['今天', '明天', '后天', '本周五', '下周一', '月底', '年前'];
  timeKeywords.forEach(keyword => {
    if (keyword.includes(partialText)) {
      suggestions.push(keyword);
    }
  });
  
  // 优先级建议
  const priorityKeywords = ['紧急', '重要', '普通', '次要'];
  priorityKeywords.forEach(keyword => {
    if (keyword.includes(partialText)) {
      suggestions.push(keyword);
    }
  });
  
  return suggestions;
};
