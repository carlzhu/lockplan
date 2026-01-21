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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getEvent, updateEvent, EventCategory, getEventCategoryName, getEventCategoryIcon } from '../services/eventService';

const EditEventScreen = ({ route, navigation }: any) => {
  const { eventId } = route.params;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventDateTime, setEventDateTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [category, setCategory] = useState<EventCategory>(EventCategory.NORMAL);
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical' | ''>('');
  const [tags, setTags] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    fetchEvent();
  }, []);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const event = await getEvent(eventId);
      
      setTitle(event.title);
      setDescription(event.description || '');
      setCategory(event.category);
      setSeverity((event.severity as 'low' | 'medium' | 'high' | 'critical') || '');
      setTags(event.tags ? event.tags.join(', ') : '');
      
      if (event.eventTime) {
        setEventTime(event.eventTime);
        setEventDateTime(new Date(event.eventTime));
      }
    } catch (error: any) {
      console.error('Error fetching event:', error);
      Alert.alert('错误', '加载事件失败，请重试。');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };


  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    setShowTimePicker(false);
    
    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }
    
    if (eventTime) {
      const existingDate = new Date(eventDateTime);
      selectedDate.setHours(existingDate.getHours());
      selectedDate.setMinutes(existingDate.getMinutes());
      selectedDate.setSeconds(existingDate.getSeconds());
    }
    
    setEventDateTime(selectedDate);
    
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const hours = String(selectedDate.getHours()).padStart(2, '0');
    const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
    const seconds = String(selectedDate.getSeconds()).padStart(2, '0');
    
    setEventTime(`${year}-${month}-${day} ${hours}:${minutes}:${seconds}`);
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    setShowDatePicker(false);
    
    if (event.type === 'dismissed' || !selectedTime) {
      return;
    }
    
    const newDateTime = new Date(eventDateTime);
    newDateTime.setHours(selectedTime.getHours());
    newDateTime.setMinutes(selectedTime.getMinutes());
    newDateTime.setSeconds(selectedTime.getSeconds());
    setEventDateTime(newDateTime);
    
    const year = newDateTime.getFullYear();
    const month = String(newDateTime.getMonth() + 1).padStart(2, '0');
    const day = String(newDateTime.getDate()).padStart(2, '0');
    const hours = String(newDateTime.getHours()).padStart(2, '0');
    const minutes = String(newDateTime.getMinutes()).padStart(2, '0');
    const seconds = String(newDateTime.getSeconds()).padStart(2, '0');
    
    setEventTime(`${year}-${month}-${day} ${hours}:${minutes}:${seconds}`);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('错误', '请输入事件标题');
      return;
    }

    try {
      setSubmitting(true);
      
      let formattedEventTime = undefined;
      if (eventTime) {
        formattedEventTime = eventTime;
      }
      
      const tagArray = tags.trim() ? tags.split(',').map(t => t.trim()).filter(t => t) : [];
      
      const updatedEvent = {
        title,
        description: description || undefined,
        category,
        eventTime: formattedEventTime,
        severity: severity || undefined,
        tags: tagArray.length > 0 ? tagArray : undefined,
      };

      console.log('Updating event with data:', JSON.stringify(updatedEvent));
      
      try {
        const result = await updateEvent(eventId, updatedEvent);
        console.log('Event updated successfully:', result);
        
        navigation.navigate('Events');
        
        setTimeout(() => {
          Alert.alert('成功', '事件更新成功！');
        }, 300);
      } catch (apiError: any) {
        console.error('API Error details:', apiError);
        
        if (apiError.response) {
          console.error('Error response status:', apiError.response.status);
          console.error('Error response data:', JSON.stringify(apiError.response.data));
          Alert.alert('错误', `更新事件失败: ${apiError.response.status} - ${JSON.stringify(apiError.response.data)}`);
        } else if (apiError.request) {
          console.error('No response received. Request details:', JSON.stringify(apiError.request));
          Alert.alert('错误', '服务器无响应，请检查网络连接。');
        } else {
          console.error('Error message:', apiError.message);
          Alert.alert('错误', `更新事件失败: ${apiError.message}`);
        }
      }
    } catch (error) {
      console.error('General error in handleSubmit:', error);
      Alert.alert('错误', '发生意外错误，请重试。');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

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
          <Text style={styles.title}>编辑事件</Text>


          <View style={styles.inputContainer}>
            <Text style={styles.label}>标题 *</Text>
            <TextInput
              style={styles.input}
              placeholder="输入事件标题"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>描述</Text>
            <TextInput
              style={styles.textArea}
              placeholder="输入事件描述"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

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

          <View style={styles.inputContainer}>
            <Text style={styles.label}>事件时间</Text>
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateTimeInputWrapper}>
                <Text style={eventTime ? styles.dateTimeText : styles.dateTimePlaceholder}>
                  {eventTime ? eventTime : "未选择时间"}
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
                  disabled={!eventTime}
                >
                  <Text style={[styles.timeButtonText, !eventTime && styles.disabledButtonText]}>🕒 时间</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {showDatePicker && (
              <DateTimePicker
                value={eventDateTime}
                mode="date"
                display="spinner"
                onChange={onDateChange}
                style={styles.datePicker}
              />
            )}
            
            {showTimePicker && (
              <DateTimePicker
                value={eventDateTime}
                mode="time"
                display="spinner"
                onChange={onTimeChange}
                style={styles.datePicker}
              />
            )}
            
            {eventTime && (
              <TouchableOpacity 
                style={styles.clearDateButton}
                onPress={() => {
                  setEventTime('');
                  setEventDateTime(new Date());
                }}
              >
                <Text style={styles.clearDateButtonText}>清除时间</Text>
              </TouchableOpacity>
            )}
          </View>

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

          <View style={styles.inputContainer}>
            <Text style={styles.label}>标签 (用逗号分隔)</Text>
            <TextInput
              style={styles.input}
              placeholder="例如: 工作, 重要, 紧急"
              value={tags}
              onChangeText={setTags}
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>更新事件</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 20,
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
});

export default EditEventScreen;
