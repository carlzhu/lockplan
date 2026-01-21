import React, { useState, useEffect } from 'react';
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
import { createTask } from '../services/taskServiceLocal';
import { createEvent, EventCategory, getEventCategoryName, getEventCategoryIcon } from '../services/eventService';
import { scheduleTaskNotification } from '../services/notificationService';

type ItemType = 'task' | 'event';

const CreateItemScreen = ({ navigation, route }: any) => {
  // 从路由参数获取初始类型，默认为任务
  const initialType = route?.params?.type || 'task';
  
  const [itemType, setItemType] = useState<ItemType>(initialType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [dateTimeObj, setDateTimeObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 任务特有字段
  const [priority, setPriority] = useState('');
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(15);
  
  // 事件特有字段
  const [category, setCategory] = useState<EventCategory>(EventCategory.NORMAL);
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical' | ''>('');
  const [tags, setTags] = useState<string>('');
  
  useEffect(() => {
    const backHandler = () => {
      if (showDatePicker || showTimePicker) {
        setShowDatePicker(false);
        setShowTimePicker(false);
        return true;
      }
      return false;
    };
    
    return () => {};
  }, [showDatePicker, showTimePicker]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    setShowTimePicker(false);
    
    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }
    
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
    
    if (event.type === 'dismissed' || !selectedTime) {
      return;
    }
    
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

  const handleSubmitTask = async () => {
    if (!title.trim()) {
      Alert.alert('错误', '请输入任务标题');
      return;
    }

    try {
      setLoading(true);
      
      const newTask = {
        title,
        description,
        dueDate: dateTime || undefined,
        priority: priority || undefined,
        completed: false,
      };

      console.log('Creating task with data:', JSON.stringify(newTask));
      
      const result = await createTask(newTask);
      console.log('Task created successfully:', result);
      
      // 安排通知
      if (result && enableReminder && dateTime) {
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
          console.log(`Notification scheduled for ${reminderMinutes} minutes before due date`);
        }
      }
      
      navigation.navigate('Home');
      
      setTimeout(() => {
        Alert.alert('成功', '任务创建成功！');
      }, 300);
    } catch (error: any) {
      console.error('Error creating task:', error);
      Alert.alert('错误', error.message || '创建任务失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEvent = async () => {
    if (!title.trim()) {
      Alert.alert('错误', '请输入事件标题');
      return;
    }

    try {
      setLoading(true);
      
      const tagArray = tags.trim() ? tags.split(',').map(t => t.trim()).filter(t => t) : [];
      
      const newEvent = {
        title,
        description: description || undefined,
        category,
        eventTime: dateTime || undefined,
        severity: severity || undefined,
        tags: tagArray.length > 0 ? tagArray : undefined,
      };

      console.log('Creating event with data:', JSON.stringify(newEvent));
      
      const result = await createEvent(newEvent);
      console.log('Event created successfully:', result);
      
      navigation.navigate('Events');
      
      setTimeout(() => {
        Alert.alert('成功', '事件创建成功！');
      }, 300);
    } catch (error: any) {
      console.error('Error creating event:', error);
      Alert.alert('错误', error.message || '创建事件失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (itemType === 'task') {
      handleSubmitTask();
    } else {
      handleSubmitEvent();
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
            {/* 类型切换器 */}
            <View style={styles.typeSwitcher}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  styles.typeButtonLeft,
                  itemType === 'task' && styles.typeButtonActive,
                ]}
                onPress={() => setItemType('task')}
              >
                <Text style={[
                  styles.typeButtonText,
                  itemType === 'task' && styles.typeButtonTextActive,
                ]}>
                  ✓ 任务
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  styles.typeButtonRight,
                  itemType === 'event' && styles.typeButtonActive,
                ]}
                onPress={() => setItemType('event')}
              >
                <Text style={[
                  styles.typeButtonText,
                  itemType === 'event' && styles.typeButtonTextActive,
                ]}>
                  📅 事件
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.title}>
              {itemType === 'task' ? '创建新任务' : '创建新事件'}
            </Text>

            {/* 标题 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>标题 *</Text>
              <TextInput
                style={styles.input}
                placeholder={itemType === 'task' ? '输入任务标题' : '输入事件标题'}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* 描述 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>描述</Text>
              <TextInput
                style={styles.textArea}
                placeholder={itemType === 'task' ? '输入任务描述' : '输入事件描述'}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* 事件类别（仅事件） */}
            {itemType === 'event' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>事件类别 *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {Object.values(EventCategory).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryButton,
                        category === cat && styles.categoryButtonSelected,
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={styles.categoryIcon}>{getEventCategoryIcon(cat)}</Text>
                      <Text
                        style={[
                          styles.categoryButtonText,
                          category === cat && styles.categoryButtonTextSelected,
                        ]}
                      >
                        {getEventCategoryName(cat)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 日期时间 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {itemType === 'task' ? '截止日期' : '事件时间'}
              </Text>
              <View style={styles.dateTimeContainer}>
                <View style={styles.dateTimeInputWrapper}>
                  <Text style={dateTime ? styles.dateTimeText : styles.dateTimePlaceholder}>
                    {dateTime ? dateTime : "未选择时间"}
                  </Text>
                </View>
                <View style={styles.dateTimeButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.dateButton}
                    onPress={() => {
                      setShowDatePicker(true);
                      setShowTimePicker(false);
                    }}
                  >
                    <Text style={styles.dateButtonText}>📅 日期</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.timeButton}
                    onPress={() => {
                      setShowTimePicker(true);
                      setShowDatePicker(false);
                    }}
                    disabled={!dateTime}
                  >
                    <Text style={[styles.timeButtonText, !dateTime && styles.disabledButtonText]}>
                      🕒 时间
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {showDatePicker && (
                <DateTimePicker
                  value={dateTimeObj}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  style={styles.datePicker}
                />
              )}
              
              {showTimePicker && (
                <DateTimePicker
                  value={dateTimeObj}
                  mode="time"
                  display="spinner"
                  onChange={onTimeChange}
                  style={styles.datePicker}
                />
              )}
              
              {dateTime && (
                <TouchableOpacity 
                  style={styles.clearDateButton}
                  onPress={() => {
                    setDateTime('');
                    setDateTimeObj(new Date());
                  }}
                >
                  <Text style={styles.clearDateButtonText}>清除时间</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 优先级（仅任务） */}
            {itemType === 'task' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>优先级</Text>
                <View style={styles.priorityContainer}>
                  {['Low', 'Medium', 'High'].map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityButton,
                        priority === p && styles.priorityButtonSelected,
                      ]}
                      onPress={() => setPriority(p)}
                    >
                      <Text
                        style={[
                          styles.priorityButtonText,
                          priority === p && styles.priorityButtonTextSelected,
                        ]}
                      >
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
                <View style={styles.severityContainer}>
                  {(['low', 'medium', 'high', 'critical'] as const).map((sev) => (
                    <TouchableOpacity
                      key={sev}
                      style={[
                        styles.severityButton,
                        severity === sev && styles.severityButtonSelected,
                      ]}
                      onPress={() => setSeverity(sev)}
                    >
                      <Text
                        style={[
                          styles.severityButtonText,
                          severity === sev && styles.severityButtonTextSelected,
                        ]}
                      >
                        {sev === 'low' ? '低' : sev === 'medium' ? '中' : sev === 'high' ? '高' : '严重'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* 提醒通知（仅任务） */}
            {itemType === 'task' && (
              <View style={styles.inputContainer}>
                <View style={styles.reminderHeader}>
                  <Text style={styles.label}>提醒通知</Text>
                  <Switch
                    value={enableReminder}
                    onValueChange={setEnableReminder}
                    disabled={!dateTime}
                  />
                </View>
                {enableReminder && dateTime && (
                  <View style={styles.reminderOptions}>
                    <Text style={styles.reminderLabel}>提前提醒时间：</Text>
                    <View style={styles.reminderButtonsContainer}>
                      {[5, 15, 30, 60].map((minutes) => (
                        <TouchableOpacity
                          key={minutes}
                          style={[
                            styles.reminderButton,
                            reminderMinutes === minutes && styles.reminderButtonSelected,
                          ]}
                          onPress={() => setReminderMinutes(minutes)}
                        >
                          <Text
                            style={[
                              styles.reminderButtonText,
                              reminderMinutes === minutes && styles.reminderButtonTextSelected,
                            ]}
                          >
                            {minutes < 60 ? `${minutes}分钟` : '1小时'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* 标签（仅事件） */}
            {itemType === 'event' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>标签 (用逗号分隔)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="例如: 工作, 重要, 紧急"
                  value={tags}
                  onChangeText={setTags}
                />
              </View>
            )}

            {/* 提交按钮 */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
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
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#4a90e2',
  },
  typeButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  typeButtonLeft: {
    borderRightWidth: 0.5,
    borderRightColor: '#4a90e2',
  },
  typeButtonRight: {
    borderLeftWidth: 0.5,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
    minWidth: 80,
  },
  categoryButtonSelected: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryButtonText: {
    color: '#666',
    fontSize: 12,
  },
  categoryButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  priorityButtonSelected: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  priorityButtonText: {
    color: '#666',
  },
  priorityButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  severityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  severityButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  severityButtonSelected: {
    backgroundColor: '#ff9500',
    borderColor: '#ff9500',
  },
  severityButtonText: {
    color: '#666',
    fontSize: 12,
  },
  severityButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTimeInputWrapper: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
  },
  dateTimeButtonsContainer: {
    flexDirection: 'row',
  },
  dateButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    padding: 10,
    marginRight: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  dateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  timeButton: {
    backgroundColor: '#5ac8fa',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  timeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButtonText: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#333',
  },
  dateTimePlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  datePicker: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  clearDateButton: {
    marginTop: 10,
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  clearDateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderOptions: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  reminderLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  reminderButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reminderButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  reminderButtonSelected: {
    backgroundColor: '#5ac8fa',
    borderColor: '#5ac8fa',
  },
  reminderButtonText: {
    fontSize: 12,
    color: '#666',
  },
  reminderButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default CreateItemScreen;
