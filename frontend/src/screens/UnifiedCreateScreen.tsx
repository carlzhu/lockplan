import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Switch,
  SafeAreaView,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { createItem, CreateItemDto } from '../services/itemService';
import { EventCategory, getEventCategoryName, getEventCategoryIcon } from '../services/eventService';
import { scheduleTaskNotification } from '../services/notificationService';
import { enhanceWithAI } from '../services/aiService';
import { useSingleExecution } from '../hooks/useDebounce';
import { addSmartPunctuation } from '../utils/textUtils';

const UnifiedCreateScreen = ({ navigation }: any) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [dateTimeObj, setDateTimeObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [category, setCategory] = useState<EventCategory>(EventCategory.NORMAL);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical' | ''>('');
  const [tags, setTags] = useState<string>('');
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(15);

  // Voice input state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // AI processing state
  const [aiProcessing, setAiProcessing] = useState(false);
  
  // Quick input state (for raw voice/text input before AI enhancement)
  const [quickInput, setQuickInput] = useState('');
  const [showQuickInput, setShowQuickInput] = useState(false);

  useEffect(() => {
    // Initialize Voice
    Voice.onSpeechStart = () => {
      console.log('Speech started');
      setIsRecording(true);
    };
    
    Voice.onSpeechEnd = () => {
      console.log('Speech ended');
      setIsRecording(false);
    };
    
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      console.log('Speech results:', e);
      if (e.value && e.value.length > 0) {
        // 只使用最终结果，不追加
        let recognizedText = e.value[0];
        // 添加智能标点符号
        recognizedText = addSmartPunctuation(recognizedText);
        setQuickInput(recognizedText);
      }
    };
    
    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
      // 显示实时识别结果（不添加标点，避免频繁变化）
      if (e.value && e.value.length > 0) {
        setQuickInput(e.value[0]);
      }
    };
    
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      console.error('Speech error:', e);
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingDuration(0);
      Alert.alert('提示', '语音识别出错，请重试');
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startVoiceInput = async () => {
    try {
      await Voice.start('zh-CN');
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting voice:', error);
      Alert.alert('错误', '无法启动语音输入');
    }
  };

  const stopVoiceInput = async () => {
    try {
      await Voice.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingDuration(0);
    } catch (error) {
      console.error('Error stopping voice:', error);
    }
  };

  const handleAIEnhance = async () => {
    const inputText = quickInput.trim() || description.trim();
    
    if (!inputText) {
      Alert.alert('提示', '请先输入内容或使用语音输入');
      return;
    }

    try {
      setAiProcessing(true);
      const result = await enhanceWithAI({
        description: inputText,
        type: category === EventCategory.NORMAL ? 'task' : 'event',
        generateTitle: true,
      });

      console.log('AI Enhancement Result:', JSON.stringify(result, null, 2));

      // 智能填充所有字段
      if (result.title) {
        setTitle(result.title);
      }
      
      if (result.enhancedDescription || result.description) {
        setDescription(result.enhancedDescription || result.description || '');
      }
      
      if (result.suggestedPriority || result.priority) {
        const priorityValue = result.priority || result.suggestedPriority;
        const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
          'Low': 'low',
          'low': 'low',
          'Medium': 'medium',
          'medium': 'medium',
          'High': 'high',
          'high': 'high',
          'Critical': 'critical',
          'critical': 'critical',
        };
        setPriority(priorityMap[priorityValue] || 'medium');
      }
      
      if (result.suggestedTags && result.suggestedTags.length > 0) {
        setTags(result.suggestedTags.join(', '));
      } else if (result.tags && result.tags.length > 0) {
        setTags(result.tags.join(', '));
      }
      
      // 处理建议的时间 - 支持多种字段名
      const timeValue = result.suggestedDateTime || result.dueDate || result.eventTime;
      if (timeValue) {
        try {
          const suggestedDate = new Date(timeValue);
          if (!isNaN(suggestedDate.getTime())) {
            setDateTimeObj(suggestedDate);
            const year = suggestedDate.getFullYear();
            const month = String(suggestedDate.getMonth() + 1).padStart(2, '0');
            const day = String(suggestedDate.getDate()).padStart(2, '0');
            const hours = String(suggestedDate.getHours()).padStart(2, '0');
            const minutes = String(suggestedDate.getMinutes()).padStart(2, '0');
            const seconds = String(suggestedDate.getSeconds()).padStart(2, '0');
            setDateTime(`${year}-${month}-${day} ${hours}:${minutes}:${seconds}`);
          }
        } catch (e) {
          console.error('Error parsing suggested date:', e);
        }
      }
      
      // 处理建议的类别 - 支持多种字段名
      const categoryValue = result.suggestedCategory || result.category || result.type;
      if (categoryValue) {
        const categoryMap: Record<string, EventCategory> = {
          'task': EventCategory.NORMAL,
          'normal': EventCategory.NORMAL,
          'meeting': EventCategory.MEETING,
          'reminder': EventCategory.REMINDER,
          'milestone': EventCategory.MILESTONE,
          'exception': EventCategory.EXCEPTION,
          'feedback': EventCategory.FEEDBACK,
          'idea': EventCategory.IDEA,
          'event': EventCategory.NORMAL,
          'project': EventCategory.MILESTONE,
          'note': EventCategory.IDEA,
        };
        const suggestedCat = categoryMap[categoryValue.toLowerCase()];
        if (suggestedCat) {
          setCategory(suggestedCat);
        }
      }

      // 清空快速输入框，收起该区域
      setQuickInput('');
      setShowQuickInput(false);
      
      Alert.alert('成功', 'AI 已根据描述智能填充各项内容');
    } catch (error) {
      console.error('AI enhance error:', error);
      Alert.alert('提示', 'AI 润色失败，请稍后重试');
    } finally {
      setAiProcessing(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'dismissed' || !selectedDate) return;
    
    if (dateTime) {
      const existingDate = new Date(dateTimeObj);
      selectedDate.setHours(existingDate.getHours());
      selectedDate.setMinutes(existingDate.getMinutes());
    }
    
    setDateTimeObj(selectedDate);
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const hours = String(selectedDate.getHours()).padStart(2, '0');
    const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
    const seconds = String(selectedDate.getSeconds()).padStart(2, '0');
    
    setDateTime(`${year}-${month}-${day} ${hours}:${minutes}:${seconds}`);
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (event.type === 'dismissed' || !selectedTime) return;
    
    const newDateTime = new Date(dateTimeObj);
    newDateTime.setHours(selectedTime.getHours());
    newDateTime.setMinutes(selectedTime.getMinutes());
    setDateTimeObj(newDateTime);
    
    const year = newDateTime.getFullYear();
    const month = String(newDateTime.getMonth() + 1).padStart(2, '0');
    const day = String(newDateTime.getDate()).padStart(2, '0');
    const hours = String(newDateTime.getHours()).padStart(2, '0');
    const minutes = String(newDateTime.getMinutes()).padStart(2, '0');
    const seconds = String(newDateTime.getSeconds()).padStart(2, '0');
    
    setDateTime(`${year}-${month}-${day} ${hours}:${minutes}:${seconds}`);
  };

  const handleSubmitInternal = async () => {
    if (!title.trim()) {
      Alert.alert('提示', '请输入标题');
      return;
    }

    try {
      setLoading(true);
      
      const isTask = category === EventCategory.NORMAL;
      
      let reminderTime: string | undefined = undefined;
      if (enableReminder && dateTime) {
        const dueDateTime = new Date(dateTime);
        const reminderDateTime = new Date(dueDateTime.getTime() - reminderMinutes * 60000);
        const year = reminderDateTime.getFullYear();
        const month = String(reminderDateTime.getMonth() + 1).padStart(2, '0');
        const day = String(reminderDateTime.getDate()).padStart(2, '0');
        const hours = String(reminderDateTime.getHours()).padStart(2, '0');
        const minutes = String(reminderDateTime.getMinutes()).padStart(2, '0');
        const seconds = String(reminderDateTime.getSeconds()).padStart(2, '0');
        reminderTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
      
      const itemData: CreateItemDto = {
        title,
        description,
        type: isTask ? 'task' : 'event',
        dueDate: isTask ? dateTime : undefined,
        eventTime: !isTask ? dateTime : undefined,
        reminderTime: reminderTime,
        priority: priority || undefined,
        category: !isTask ? category : undefined,
        tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(t => t) : undefined,
      };

      const result = await createItem(itemData);
      
      if (isTask && enableReminder && dateTime && reminderTime) {
        const reminderDateTime = new Date(reminderTime);
        
        if (reminderDateTime > new Date()) {
          await scheduleTaskNotification(
            result.id!,
            result.title,
            result.description || '点击查看详情',
            reminderDateTime,
            priority === 'high' ? 'high' : priority === 'medium' ? 'medium' : 'low'
          );
        }
      }
      
      navigation.navigate('Main');
      setTimeout(() => Alert.alert('成功', `${isTask ? '任务' : '事件'}创建成功！`), 300);
    } catch (error: any) {
      console.error('Error creating item:', error);
      Alert.alert('错误', error.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  // 使用防抖 Hook 包装提交函数
  const [handleSubmit, isSubmitting] = useSingleExecution(handleSubmitInternal);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* 快速输入小按钮 - 浮动在右上角 */}
        <TouchableOpacity 
          style={styles.floatingQuickButton}
          onPress={() => setShowQuickInput(true)}
        >
          <Ionicons name="flash" size={20} color="#fff" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>创建项目</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>标题</Text>
              <View style={styles.titleRow}>
                <TextInput
                  style={styles.titleInput}
                  placeholder="输入标题"
                  value={title}
                  onChangeText={setTitle}
                />
                <TouchableOpacity 
                  style={styles.categoryDropdown}
                  onPress={() => {
                    // 显示类别选择器
                    Alert.alert(
                      '选择类别',
                      '',
                      [
                        { text: '✓ 任务', onPress: () => setCategory(EventCategory.NORMAL) },
                        { text: '👥 会议', onPress: () => setCategory(EventCategory.MEETING) },
                        { text: '⏰ 提醒', onPress: () => setCategory(EventCategory.REMINDER) },
                        { text: '🎯 里程碑', onPress: () => setCategory(EventCategory.MILESTONE) },
                        { text: '⚠️ 异常', onPress: () => setCategory(EventCategory.EXCEPTION) },
                        { text: '💬 反馈', onPress: () => setCategory(EventCategory.FEEDBACK) },
                        { text: '💡 想法', onPress: () => setCategory(EventCategory.IDEA) },
                        { text: '取消', style: 'cancel' },
                      ]
                    );
                  }}
                >
                  <Text style={styles.categoryDropdownText}>
                    {getEventCategoryIcon(category)} {getEventCategoryName(category)}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>描述</Text>
              <TextInput
                style={styles.textArea}
                placeholder="描述内容"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>时间</Text>
              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeDisplay}>
                  <Text style={dateTime ? styles.dateTimeText : styles.dateTimePlaceholder}>
                    {dateTime || '未设置'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.buttonText}>📅</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.dateTimeButton, !dateTime && styles.dateTimeButtonDisabled]} 
                  onPress={() => setShowTimePicker(true)}
                  disabled={!dateTime}
                >
                  <Text style={styles.buttonText}>🕒</Text>
                </TouchableOpacity>
                {dateTime && (
                  <TouchableOpacity 
                    style={styles.clearButton} 
                    onPress={() => {
                      setDateTime('');
                      setDateTimeObj(new Date());
                    }}
                  >
                    <Text style={styles.buttonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {showDatePicker && (
                <DateTimePicker
                  value={dateTimeObj}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                />
              )}
              
              {showTimePicker && (
                <DateTimePicker
                  value={dateTimeObj}
                  mode="time"
                  display="spinner"
                  onChange={onTimeChange}
                />
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>优先级</Text>
              <View style={styles.chipRow}>
                {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.chip, priority === p && styles.chipSelected]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[styles.chipText, priority === p && styles.chipTextSelected]}>
                      {p === 'low' ? '次要' : p === 'medium' ? '普通' : p === 'high' ? '重要' : '紧急'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {category === EventCategory.NORMAL && dateTime && (
              <View style={styles.inputContainer}>
                <View style={styles.reminderRow}>
                  <Text style={styles.label}>提醒</Text>
                  <Switch value={enableReminder} onValueChange={setEnableReminder} />
                </View>
                {enableReminder && (
                  <View style={styles.chipRow}>
                    {[5, 15, 30, 60].map((min) => (
                      <TouchableOpacity
                        key={min}
                        style={[styles.chip, reminderMinutes === min && styles.chipSelected]}
                        onPress={() => setReminderMinutes(min)}
                      >
                        <Text style={[styles.chipText, reminderMinutes === min && styles.chipTextSelected]}>
                          {min < 60 ? `${min}分钟` : '1小时'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>标签</Text>
              <TextInput
                style={styles.input}
                placeholder="用逗号分隔，如：工作, 重要"
                value={tags}
                onChangeText={setTags}
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading || isSubmitting}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>创建</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 快速输入 Modal */}
      <Modal
        visible={showQuickInput}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowQuickInput(false);
          setQuickInput('');
        }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowQuickInput(false);
            setQuickInput('');
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <TouchableOpacity 
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.modalContentWrapper}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleRow}>
                    <Ionicons name="flash" size={24} color="#4a90e2" />
                    <Text style={styles.modalTitle}>快速输入</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => {
                      setShowQuickInput(false);
                      setQuickInput('');
                    }}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={28} color="#8e8e93" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.modalHint}>
                  💡 语音或文字输入原始内容，AI 将自动优化并填充表单
                </Text>
                
                <View style={styles.modalInputWrapper}>
                  <TextInput
                    style={styles.modalInputArea}
                    placeholder="例如：秒级数据需要周五前完成确认"
                    value={quickInput}
                    onChangeText={setQuickInput}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                  <TouchableOpacity
                    style={[styles.modalVoiceButton, isRecording && styles.modalVoiceButtonActive]}
                    onPress={isRecording ? stopVoiceInput : startVoiceInput}
                    disabled={loading || aiProcessing}
                  >
                    <Ionicons 
                      name={isRecording ? "stop-circle" : "mic"} 
                      size={32} 
                      color={isRecording ? "#ff3b30" : "#4a90e2"} 
                    />
                  </TouchableOpacity>
                </View>
                
                {isRecording && (
                  <View style={styles.modalRecordingStatus}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.modalRecordingText}>
                      正在录音... ({recordingDuration}秒)
                    </Text>
                  </View>
                )}
                
                <TouchableOpacity
                  style={[styles.modalEnhanceButton, (aiProcessing || !quickInput.trim()) && styles.modalEnhanceButtonDisabled]}
                  onPress={handleAIEnhance}
                  disabled={aiProcessing || !quickInput.trim()}
                >
                  {aiProcessing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={22} color="#fff" />
                      <Text style={styles.modalEnhanceButtonText}>AI 智能润色并填充</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  floatingQuickButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 8,
  },
  formContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#1c1c1e',
    marginRight: 8,
  },
  categoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 100,
  },
  categoryDropdownText: {
    fontSize: 14,
    color: '#1c1c1e',
    marginRight: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#1c1c1e',
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    minHeight: 80,
    color: '#1c1c1e',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeDisplay: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 8,
    padding: 10,
    marginRight: 6,
  },
  dateTimeText: {
    fontSize: 14,
    color: '#1c1c1e',
  },
  dateTimePlaceholder: {
    fontSize: 14,
    color: '#8e8e93',
  },
  dateTimeButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  dateTimeButtonDisabled: {
    backgroundColor: '#c8d6e5',
  },
  clearButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
    minWidth: 60,
  },
  chipSelected: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  chipText: {
    fontSize: 13,
    color: '#3c3c43',
    textAlign: 'center',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalKeyboardView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentWrapper: {
    width: '100%',
    maxWidth: 500,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginLeft: 8,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  modalInputWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  modalInputArea: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 12,
    padding: 14,
    paddingRight: 60,
    fontSize: 16,
    minHeight: 120,
    maxHeight: 200,
    color: '#1c1c1e',
  },
  modalVoiceButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  modalVoiceButtonActive: {
    backgroundColor: '#ffe5e5',
  },
  modalRecordingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3b30',
    marginRight: 8,
  },
  modalRecordingText: {
    fontSize: 14,
    color: '#856404',
  },
  modalEnhanceButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEnhanceButtonDisabled: {
    backgroundColor: '#c8d6e5',
  },
  modalEnhanceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default UnifiedCreateScreen;
