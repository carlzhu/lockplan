/**
 * 文本处理工具函数
 */

/**
 * 为语音识别文本智能添加标点符号
 * @param text 原始文本
 * @returns 添加标点符号后的文本
 */
export const addSmartPunctuation = (text: string): string => {
  if (!text) return text;
  
  let result = text.trim();
  
  // 1. 先处理明显的句子分隔（长停顿通常表示句子结束）
  // 检测可能的句子结束点（动词+名词结构后）
  const sentenceEndPatterns = [
    /([完成结束搞定做好弄好]了)(?![，。！？、])/g,
    /([说讲告诉通知]过)(?![，。！？、])/g,
  ];
  sentenceEndPatterns.forEach(pattern => {
    result = result.replace(pattern, '$1。');
  });
  
  // 2. 处理疑问句
  const questionWords = ['吗', '呢', '啊', '什么', '怎么', '为什么', '哪里', '谁', '几点', '多少', '哪个', '如何', '是否', '能否'];
  questionWords.forEach(word => {
    // 在疑问词后如果没有标点，添加问号
    const regex = new RegExp(`(${word})(?![，。！？、])(?=\\s|$)`, 'g');
    result = result.replace(regex, `${word}？`);
  });
  
  // 3. 处理感叹句
  const exclamationWords = ['太好了', '真棒', '加油', '完成了', '成功了', '糟糕', '不行', '太棒了', '厉害', '太赞了', '牛'];
  exclamationWords.forEach(word => {
    const regex = new RegExp(`(${word})(?![，。！？、])`, 'g');
    result = result.replace(regex, `${word}！`);
  });
  
  // 4. 在常见的连接词后添加逗号（表示停顿）
  const pauseWords = [
    '然后', '接着', '另外', '还有', '以及', '并且', '而且', 
    '同时', '此外', '其次', '首先', '最后', '因此', '所以',
    '但是', '不过', '可是', '然而', '虽然', '尽管', '如果',
    '那么', '这样', '这时', '那时', '后来', '接下来'
  ];
  pauseWords.forEach(word => {
    // 只在词后面没有标点符号时添加逗号
    const regex = new RegExp(`(${word})(?![，。！？、])`, 'g');
    result = result.replace(regex, `${word}，`);
  });
  
  // 5. 处理时间表达后的逗号
  const timePatterns = [
    /(\d+月\d+日)(?![，。！？、])/g,
    /(\d+点\d*分?)(?![，。！？、])/g,
    /(周[一二三四五六日天])(?![，。！？、])/g,
    /(星期[一二三四五六日天])(?![，。！？、])/g,
    /(今天|明天|后天|昨天|前天|大后天)(?![，。！？、])/g,
    /(上午|下午|晚上|早上|中午|傍晚|深夜|凌晨)(?![，。！？、])/g,
    /(这周|下周|上周|本周|下个月|上个月|这个月)(?![，。！？、])/g,
  ];
  timePatterns.forEach(pattern => {
    result = result.replace(pattern, '$1，');
  });
  
  // 6. 处理地点表达后的逗号
  const locationPatterns = [
    /(在.{1,10}[里处])(?![，。！？、])/g,
    /(去.{1,10}[里处])(?![，。！？、])/g,
  ];
  locationPatterns.forEach(pattern => {
    result = result.replace(pattern, '$1，');
  });
  
  // 7. 处理动作完成后的停顿
  const actionCompleteWords = ['需要', '要', '得', '应该', '必须', '可以', '能够', '打算', '准备', '想要'];
  actionCompleteWords.forEach(word => {
    const regex = new RegExp(`(${word})(?![，。！？、])`, 'g');
    result = result.replace(regex, `${word} `);
  });
  
  // 8. 处理长句子（超过30个字没有标点的，在合适位置添加逗号）
  const segments = result.split(/[，。！？、]/);
  const processedSegments = segments.map(segment => {
    if (segment.length > 30) {
      // 在"的"、"了"、"着"等助词后添加逗号
      segment = segment.replace(/([的了着过])(?![，。！？、])/g, '$1，');
    }
    return segment;
  });
  result = processedSegments.join('');
  
  // 9. 在句子结尾添加标点（如果还没有）
  if (result && !result.match(/[，。！？、]$/)) {
    // 如果是疑问句特征但没加问号，加问号
    if (questionWords.some(word => result.includes(word))) {
      result += '？';
    } else {
      result += '。';
    }
  }
  
  // 10. 清理多余的空格
  result = result.replace(/\s+/g, ' ').trim();
  
  // 11. 清理重复的标点符号
  result = result.replace(/([，。！？、])\1+/g, '$1');
  
  // 12. 清理标点符号前的空格
  result = result.replace(/\s+([，。！？、])/g, '$1');
  
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
