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
import { getTask, updateTask } from '../services/taskServiceLocal';
import { scheduleTaskNotification, cancelNotification } from '../services/notificationService';

const EditTaskScreen = ({ route, navigation }: any) => {
  const { taskId } = route.params;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueDateTime, setDueDateTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [priority, setPriority] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [notificationId, setNotificationId] = useState<string | null>(null);
  
  // Add a listener to handle tapping outside the picker
  useEffect(() => {
    const backHandler = () => {
      if (showDatePicker || showTimePicker) {
        setShowDatePicker(false);
        setShowTimePicker(false);
        return true; // Prevent default behavior
      }
      return false;
    };
    
    // This will be called when the component unmounts
    return () => {
      // Clean up
    };
  }, [showDatePicker, showTimePicker]);

  // Date and time picker handlers
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    setShowTimePicker(false); // Close time picker if open
    
    // If event is "dismissed" (clicked outside) or selectedDate is undefined, do nothing
    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }
    
    // Keep the time from the existing date if there is one
    if (dueDate) {
      const existingDate = new Date(dueDateTime);
      selectedDate.setHours(existingDate.getHours());
      selectedDate.setMinutes(existingDate.getMinutes());
      selectedDate.setSeconds(existingDate.getSeconds());
    }
    
    setDueDateTime(selectedDate);
    
    // Format date as YYYY-MM-DD HH:MM:SS
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const hours = String(selectedDate.getHours()).padStart(2, '0');
    const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
    const seconds = String(selectedDate.getSeconds()).padStart(2, '0');
    
    setDueDate(`${year}-${month}-${day} ${hours}:${minutes}:${seconds}`);
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    setShowDatePicker(false); // Close date picker if open
    
    // If event is "dismissed" (clicked outside) or selectedTime is undefined, do nothing
    if (event.type === 'dismissed' || !selectedTime) {
      return;
    }
    
    const newDateTime = new Date(dueDateTime);
    newDateTime.setHours(selectedTime.getHours());
    newDateTime.setMinutes(selectedTime.getMinutes());
    newDateTime.setSeconds(selectedTime.getSeconds());
    setDueDateTime(newDateTime);
    
    // Update the formatted date string
    const year = newDateTime.getFullYear();
    const month = String(newDateTime.getMonth() + 1).padStart(2, '0');
    const day = String(newDateTime.getDate()).padStart(2, '0');
    const hours = String(newDateTime.getHours()).padStart(2, '0');
    const minutes = String(newDateTime.getMinutes()).padStart(2, '0');
    const seconds = String(newDateTime.getSeconds()).padStart(2, '0');
    
    setDueDate(`${year}-${month}-${day} ${hours}:${minutes}:${seconds}`);
  };

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const task = await getTask(taskId);
        setTitle(task.title || '');
        setDescription(task.description || '');
        
        // Parse the due date if it exists
        if (task.dueDate) {
          // Remove any timezone indicator (T or Z) and standardize the format
          const cleanDate = task.dueDate.replace('T', ' ').replace('Z', '').split('.')[0];
          setDueDate(cleanDate);
          
          // Set the date object for the picker
          const dateObj = new Date(task.dueDate);
          if (!isNaN(dateObj.getTime())) {
            setDueDateTime(dateObj);
          }
        }
        
        // Convert priority to proper case (first letter uppercase, rest lowercase)
        // This matches the format expected by our priority buttons: 'Low', 'Medium', 'High'
        if (task.priority) {
          const formattedPriority = task.priority.charAt(0).toUpperCase() + 
                                   task.priority.slice(1).toLowerCase();
          setPriority(formattedPriority);
          console.log('Setting priority to:', formattedPriority);
        } else {
          setPriority('');
        }
        
        // Load notification settings if available
        if (task.notificationId) {
          setNotificationId(task.notificationId);
          setEnableReminder(true);
        }
      } catch (error) {
        console.error('Error fetching task:', error);
        Alert.alert('Error', 'Failed to load task details');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the task');
      return;
    }

    try {
      setSubmitting(true);
      
      // Format the date for the backend if it exists
      let formattedDueDate = undefined;
      if (dueDate) {
        // Ensure the date is in the correct format (YYYY-MM-DD HH:MM:SS)
        formattedDueDate = dueDate;
      }
      
      const updatedTask = {
        title,
        description,
        dueDate: formattedDueDate,
        // Keep the priority as is - the taskService will convert it to uppercase
        priority: priority || undefined,
      };

      console.log('Task ID type:', typeof taskId);
      console.log('Task ID value:', taskId);

      console.log('Updating task with ID:', taskId, 'Type:', typeof taskId);
      console.log('Task data:', JSON.stringify(updatedTask));
      
      try {
        await updateTask(taskId, updatedTask);
        console.log('Task updated successfully');
        
        // Handle notification updates
        if (notificationId) {
          // Cancel existing notification
          await cancelNotification(notificationId);
        }
        
        // Schedule new notification if enabled and due date is set
        if (enableReminder && dueDate) {
          const dueDateTime = new Date(dueDate);
          const reminderTime = new Date(dueDateTime.getTime() - reminderMinutes * 60000);
          
          if (reminderTime > new Date()) {
            const newNotificationId = await scheduleTaskNotification(
              taskId,
              title,
              description || '点击查看详情',
              reminderTime,
              priority === 'High' ? 'high' : priority === 'Medium' ? 'medium' : 'low'
            );
            console.log(`Notification scheduled for ${reminderMinutes} minutes before due date`);
          }
        }
        
        // Return to the previous screen without triggering a full refresh
        navigation.goBack();
        
        // Show success message after navigation to prevent UI blocking
        setTimeout(() => {
          Alert.alert('Success', 'Task updated successfully!');
        }, 300);
      } catch (apiError: any) {
        console.error('API Error details:', apiError);
        
        // Check if there's a response with error details
        if (apiError.response) {
          console.error('Error response:', apiError.response.status, apiError.response.data);
          Alert.alert('Error', `Failed to update task: ${apiError.response.status} - ${JSON.stringify(apiError.response.data)}`);
        } else if (apiError.request) {
          // Request was made but no response received
          console.error('No response received:', apiError.request);
          Alert.alert('Error', 'No response from server. Please check your connection.');
        } else {
          // Something else caused the error
          console.error('Error message:', apiError.message);
          Alert.alert('Error', `Failed to update task: ${apiError.message}`);
        }
      }
    } catch (error: any) {
      console.error('General error in handleSubmit:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
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
          <Text style={styles.title}>Edit Task</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter task title"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Enter task description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Due Date and Time</Text>
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateTimeInputWrapper}>
                <Text style={dueDate ? styles.dateTimeText : styles.dateTimePlaceholder}>
                  {dueDate ? dueDate : "No date selected"}
                </Text>
              </View>
              <View style={styles.dateTimeButtonsContainer}>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => {
                    setShowDatePicker(true);
                    setShowTimePicker(false); // Close time picker when date picker is opened
                  }}
                >
                  <Text style={styles.dateButtonText}>📅 Date</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => {
                    setShowTimePicker(true);
                    setShowDatePicker(false); // Close date picker when time picker is opened
                  }}
                  disabled={!dueDate}
                >
                  <Text style={[styles.timeButtonText, !dueDate && styles.disabledButtonText]}>🕒 Time</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {showDatePicker && (
              <DateTimePicker
                value={dueDateTime}
                mode="date"
                display="spinner"
                onChange={onDateChange}
                style={styles.datePicker}
              />
            )}
            
            {showTimePicker && (
              <DateTimePicker
                value={dueDateTime}
                mode="time"
                display="spinner"
                onChange={onTimeChange}
                style={styles.datePicker}
              />
            )}
            
            {dueDate && (
              <TouchableOpacity 
                style={styles.clearDateButton}
                onPress={() => {
                  setDueDate('');
                  setDueDateTime(new Date());
                }}
              >
                <Text style={styles.clearDateButtonText}>Clear Date</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityContainer}>
              {['Low', 'Medium', 'High'].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityButton,
                    priority.toLowerCase() === p.toLowerCase() && styles.priorityButtonSelected,
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      priority.toLowerCase() === p.toLowerCase() && styles.priorityButtonTextSelected,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.reminderHeader}>
              <Text style={styles.label}>提醒通知</Text>
              <Switch
                value={enableReminder}
                onValueChange={setEnableReminder}
                disabled={!dueDate}
              />
            </View>
            {enableReminder && dueDate && (
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

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Update Task</Text>
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

export default EditTaskScreen;