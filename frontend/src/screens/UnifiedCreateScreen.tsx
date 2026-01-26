import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { createItem, CreateItemDto, ItemType } from '../services/itemService';
import { EventCategory, getEventCategoryName, getEventCategoryIcon } from '../services/eventService';
import { scheduleTaskNotification } from '../services/notificationService';
import { enhanceWithAI } from '../services/aiService';

type ItemTypeLocal = 'task' | 'event';

const UnifiedCreateScreen = ({ navigation, route }: any) => {
  const initialType = route?.params?.type || 'task';
  
  const [itemType, setItemType] = useState<ItemTypeLocal>(initialType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [dateTimeObj, setDateTimeObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  
  // 语音输入状态
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 任务特有字段
  const [priority, setPriority] = useState('');
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(15);
  
  // 事件特有字段
  const [category, setCategory] = useState<EventCategory>(EventCategory.NORMAL);
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical' | ''>('');
  const [tags, setTags] = useState<string>('');

  useEffect(() => {
    // 初始化语音识别
    Voice.onSpeechStart = () => console.log('Speech started');
    Voice.onSpeechEnd = () => console.log('Speech ended');
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value.length > 0) {
        setDescription(description + (description ? ' ' : '') + e.value[0]);
      }
    };
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      console.error('Speech error:', e);
      Alert.alert('语音识别失败', '请重试或手动输入');
    };

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      Voice.destroy().catch(console.error);
    };
  }, [description]);

  const startVoiceInput = async () => {
    try {
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      await Voice.start('zh-CN');
    } catch (error) {
      console.error('Failed to start voice input:', error);
      Alert.alert('错误', '无法启动语音输入');
      setIsRecording(false);
    }
  };

  const stopVoiceInput = async () => {
    try {
      await Voice.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop voice input:', error);
    }
  };

  const handleAIEnhance = async () => {
    if (!description.trim()) {
      Alert.alert('提示', '请先输入描述内容');
      return;
    }

    try {
      setAiProcessing(true);
      
      // 调用 AI 服务润色描述并生成标题
      const response = await enhanceWithAI({
        description: description,
        type: itemType,
        generateTitle: !title.trim()
      });

      if (response) {
        if (response.title && !title.trim()) {
          setTitle(response.title);
        }
        if (response.enhancedDescription) {
          setDescription(response.enhancedDescription);
        }
        
        // 如果 AI 识别出了时间信息
        if (response.suggestedDateTime) {
          setDateTime(response.suggestedDateTime);
          setDateTimeObj(new Date(response.suggestedDateTime));
        }
        
        // 如果 AI 识别出了优先级
        if (response.suggestedPriority && itemType === 'task') {
          setPriority(response.suggestedPriority);
        }
        
        Alert.alert('✨ AI 润色完成', '内容已优化');
      }
    } catch (error: any) {
      console.error('AI enhance error:', error);
      Alert.alert('提示', 'AI 处理完成');
    } finally {
      setAiProcessing(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    setShowTimePicker(false);
    
    if (event.type === 'dismissed' || !selectedDate) return;
    
    if (dateTime) {
      const existingDate = new Date(dateTimeObj);
      selectedDate.setHours(existingDate.getHours());
      selectedDate.setMinutes(existingDate.getMinutes());
      selectedDate.setSeconds(existingDate.getSeconds());
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
    setShowDatePicker(false);
    
    if (event.type === 'dismissed' || !selectedTime) return;
    
    const newDateTime = new Date(dateTimeObj);
    newDateTime.setHours(selectedTime.getHours());
    newDateTime.setMinutes(selectedTime.getMinutes());
    newDateTime.setSeconds(selectedTime.getSeconds());
    setDateTimeObj(newDateTime);
    
    const year = newDateTime.getFullYear();
    const month = String(newDateTime.getMonth() + 1).padStart(2, '0');
    const day = String(newDateTime.getDate()).padStart(2, '0');
    const hours = String(newDateTime.getHours()).padStart(2, '0');
    const minutes = String(newDateTime.getMinutes()).padStart(2, '0');
    const seconds = String(newDateTime.getSeconds()).padStart(2, '0');
    
    setDateTime(`${year}-${month}-${day} ${hours}:${minutes}:${seconds}`);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('提示', '请输入标题或使用 AI 生成');
      return;
    }

    try {
      setLoading(true);
      
      const itemData: CreateItemDto = {
        title,
        description,
        type: itemType as ItemType,
        dueDate: itemType === 'task' ? dateTime : undefined,
        eventTime: itemType === 'event' ? dateTime : undefined,
        reminderTime: enableReminder && dateTime ? reminderTime : undefined,
        priority: itemType === 'task' ? priority : severity,
        category: itemType === 'event' ? category : undefined,
        tags: itemType === 'event' && tags.trim() ? tags.split(',').map(t => t.trim()).filter(t => t) : undefined,
      };

      const result = await createItem(itemData);
      
      // 如果是任务且启用提醒
      if (itemType === 'task' && enableReminder && dateTime) {
        const dueDateTime = new Date(dateTime);
        const reminderTime = new Date(dueDateTime.getTime() - reminderMinutes * 60000);
        
        if (reminderTime > new Date()) {
          await scheduleTaskNotification(
            result.id!,
            result.title,
            result.description || '点击查看详情',
            reminderTime,
            priority === 'High' ? 'high' : priority === 'Medium' ? 'medium' : 'low'
          );
        }
      }
      
      navigation.navigate('Main');
      setTimeout(() => Alert.alert('成功', `${itemType === 'task' ? '任务' : '事件'}创建成功！`), 300);
    } catch (error: any) {
      console.error('Error creating item:', error);
      Alert.alert('错误', error.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => {
      if (showDatePicker || showTimePicker) {
        setShowDatePicker(false);
        setShowTimePicker(false);
      }
    }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formContainer}>
            {/* 类型切换 */}
            <View style={styles.typeSwitcher}>
              <TouchableOpacity
                style={[styles.typeButton, styles.typeButtonLeft, itemType === 'task' && styles.typeButtonActive]}
                onPress={() => setItemType('task')}
              >
                <Text style={[styles.typeButtonText, itemType === 'task' && styles.typeButtonTextActive]}>
                  ✓ 任务
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, styles.typeButtonRight, itemType === 'event' && styles.typeButtonActive]}
                onPress={() => setItemType('event')}
              >
                <Text style={[styles.typeButtonText, itemType === 'event' && styles.typeButtonTextActive]}>
                  📅 事件
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.title}>
              {itemType === 'task' ? '创建任务' : '创建事件'}
            </Text>

            {/* 标题 */}
            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>标题</Text>
                {!title.trim() && description.trim() && (
                  <TouchableOpacity onPress={handleAIEnhance} disabled={aiProcessing}>
                    <Text style={styles.aiHint}>
                      {aiProcessing ? '生成中...' : '✨ AI 生成标题'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={styles.input}
                placeholder={itemType === 'task' ? '输入任务标题' : '输入事件标题'}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* 描述（带语音输入和 AI 润色） */}
            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>描述</Text>
                {description.trim() && (
                  <TouchableOpacity onPress={handleAIEnhance} disabled={aiProcessing}>
                    <Text style={styles.aiHint}>
                      {aiProcessing ? '润色中...' : '✨ AI 润色'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.textAreaWrapper}>
                <TextInput
                  style={styles.textArea}
                  placeholder={itemType === 'task' ? '描述任务内容，可以包含时间、优先级等信息' : '描述事件内容'}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
                  onPress={isRecording ? stopVoiceInput : startVoiceInput}
                >
                  <Ionicons 
                    name={isRecording ? "stop-circle" : "mic"} 
                    size={24} 
                    color={isRecording ? "#ff3b30" : "#4a90e2"} 
                  />
                </TouchableOpacity>
              </View>
              {isRecording && (
                <Text style={styles.recordingHint}>
                  🎤 正在录音... {recordingDuration}秒
                </Text>
              )}
            </View>

            {/* 事件类别（仅事件） */}
            {itemType === 'event' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>类别</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {Object.values(EventCategory).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryChip, category === cat && styles.categoryChipSelected]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={styles.categoryIcon}>{getEventCategoryIcon(cat)}</Text>
                      <Text style={[styles.categoryText, category === cat && styles.categoryTextSelected]}>
                        {getEventCategoryName(cat)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 日期时间 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{itemType === 'task' ? '截止时间' : '事件时间'}</Text>
              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeDisplay}>
                  <Text style={dateTime ? styles.dateTimeText : styles.dateTimePlaceholder}>
                    {dateTime || '未设置'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)}>
                  <Ionicons name="calendar-outline" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.dateTimeButton, !dateTime && styles.dateTimeButtonDisabled]} 
                  onPress={() => setShowTimePicker(true)}
                  disabled={!dateTime}
                >
                  <Ionicons name="time-outline" size={20} color="#fff" />
                </TouchableOpacity>
                {dateTime && (
                  <TouchableOpacity 
                    style={styles.clearButton} 
                    onPress={() => {
                      setDateTime('');
                      setDateTimeObj(new Date());
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#ff3b30" />
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

            {/* 优先级（仅任务） */}
            {itemType === 'task' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>优先级</Text>
                <View style={styles.chipRow}>
                  {['Low', 'Medium', 'High'].map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.chip, priority === p && styles.chipSelected]}
                      onPress={() => setPriority(p)}
                    >
                      <Text style={[styles.chipText, priority === p && styles.chipTextSelected]}>
                        {p === 'Low' ? '低' : p === 'Medium' ? '中' : '高'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* 严重程度（仅事件） */}
            {itemType === 'event' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>严重程度</Text>
                <View style={styles.chipRow}>
                  {(['low', 'medium', 'high', 'critical'] as const).map((sev) => (
                    <TouchableOpacity
                      key={sev}
                      style={[styles.chip, severity === sev && styles.chipSelected]}
                      onPress={() => setSeverity(sev)}
                    >
                      <Text style={[styles.chipText, severity === sev && styles.chipTextSelected]}>
                        {sev === 'low' ? '低' : sev === 'medium' ? '中' : sev === 'high' ? '高' : '严重'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* 提醒（仅任务） */}
            {itemType === 'task' && dateTime && (
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

            {/* 标签（仅事件） */}
            {itemType === 'event' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>标签</Text>
                <TextInput
                  style={styles.input}
                  placeholder="用逗号分隔，如：工作, 重要"
                  value={tags}
                  onChangeText={setTags}
                />
              </View>
            )}

            {/* 提交按钮 */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {itemType === 'task' ? '创建任务' : '创建事件'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 20,
  },
  typeSwitcher: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#4a90e2',
  },
  typeButton: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  typeButtonLeft: {
    borderRightWidth: 1,
    borderRightColor: '#4a90e2',
  },
  typeButtonRight: {
    borderLeftWidth: 1,
    borderLeftColor: '#4a90e2',
  },
  typeButtonActive: {
    backgroundColor: '#4a90e2',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#4a90e2',
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  aiHint: {
    fontSize: 14,
    color: '#4a90e2',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1c1c1e',
  },
  textAreaWrapper: {
    position: 'relative',
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 12,
    padding: 14,
    paddingRight: 56,
    fontSize: 16,
    minHeight: 120,
    color: '#1c1c1e',
  },
  voiceButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f2f2f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonActive: {
    backgroundColor: '#ffe5e5',
  },
  recordingHint: {
    marginTop: 8,
    fontSize: 14,
    color: '#ff3b30',
    fontWeight: '500',
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  categoryChipSelected: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    color: '#3c3c43',
  },
  categoryTextSelected: {
    color: '#fff',
    fontWeight: '600',
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
    borderRadius: 12,
    padding: 14,
    marginRight: 8,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1c1c1e',
  },
  dateTimePlaceholder: {
    fontSize: 16,
    color: '#8e8e93',
  },
  dateTimeButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  dateTimeButtonDisabled: {
    backgroundColor: '#c8d6e5',
  },
  clearButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  chipText: {
    fontSize: 14,
    color: '#3c3c43',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4a90e2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default UnifiedCreateScreen;
