/**
 * 文本处理工具函数
 */

/**
 * 为语音识别文本智能添加标点符号（优化版 - 减少过多逗号）
 * @param text 原始文本
 * @returns 添加标点符号后的文本
 */
export const addSmartPunctuation = (text: string): string => {
  if (!text) return text;
  
  let result = text.trim();
  
  // 1. 先处理明显的句子分隔
  const sentenceEndPatterns = [
    /([完成结束搞定做好弄好]了)(?![，。！？、])/g,
  ];
  sentenceEndPatterns.forEach(pattern => {
    result = result.replace(pattern, '$1。');
  });
  
  // 2. 处理疑问句
  const questionWords = ['吗', '呢', '什么', '怎么', '为什么', '哪里', '谁', '几点', '多少', '哪个', '如何'];
  questionWords.forEach(word => {
    const regex = new RegExp(`(${word})(?![，。！？、])(?=\\s|$)`, 'g');
    result = result.replace(regex, `${word}？`);
  });
  
  // 3. 处理感叹句
  const exclamationWords = ['太好了', '真棒', '完成了', '成功了', '太棒了'];
  exclamationWords.forEach(word => {
    const regex = new RegExp(`(${word})(?![，。！？、])`, 'g');
    result = result.replace(regex, `${word}！`);
  });
  
  // 4. 只在重要的连接词后添加逗号
  const pauseWords = ['然后', '接着', '但是', '不过', '所以', '因此'];
  pauseWords.forEach(word => {
    const regex = new RegExp(`(${word})(?![，。！？、])`, 'g');
    result = result.replace(regex, `${word}，`);
  });
  
  // 5. 处理时间表达（只在后面跟动词时添加逗号）
  // 明天下午3点 + 要/需要 → 明天下午3点，要
  result = result.replace(/(明天|后天|今天)(?![，。！？、])(?=.{0,10}[要需得])/g, '$1，');
  result = result.replace(/(\d+点\d*分?)(?![，。！？、])(?=.{0,5}[要需得开始])/g, '$1，');
  
  // 6. 处理长句子（超过40个字，在"的"后添加逗号）
  const segments = result.split(/[，。！？、]/);
  const processedSegments = segments.map(segment => {
    if (segment.length > 40) {
      // 只在"的"后添加逗号，且后面还有较长内容
      segment = segment.replace(/([的])(?![，。！？、])(?=.{10,})/g, '$1，');
    }
    return segment;
  });
  result = processedSegments.join('');
  
  // 7. 在句子结尾添加标点
  if (result && !result.match(/[，。！？、]$/)) {
    if (questionWords.some(word => result.includes(word))) {
      result += '？';
    } else {
      result += '。';
    }
  }
  
  // 8. 清理
  result = result.replace(/\s+/g, ' ').trim();
  result = result.replace(/([，。！？、])\1+/g, '$1');
  result = result.replace(/\s+([，。！？、])/g, '$1');
  
  // 9. 清理过于密集的逗号
  result = result.replace(/，(.{1,2})，/g, '$1');
  
  return result;
};

/**
 * 格式化日期时间
 * @param dateStr 日期字符串
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 截断文本
 * @param text 原始文本
 * @param maxLength 最大长度
 * @returns 截断后的文本
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * 高亮搜索关键词
 * @param text 原始文本
 * @param keyword 搜索关键词
 * @returns 包含高亮标记的文本
 */
export const highlightKeyword = (text: string, keyword: string): string => {
  if (!keyword) return text;
  const regex = new RegExp(`(${keyword})`, 'gi');
  return text.replace(regex, '**$1**');
};
