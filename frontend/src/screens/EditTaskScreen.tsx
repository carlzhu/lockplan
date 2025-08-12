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
import { getTask, updateTask } from '../services/taskService';

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
        
        setPriority(task.priority || '');
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
        priority: priority || undefined,
      };

      await updateTask(taskId, updatedTask);
      // Return to the previous screen without triggering a full refresh
      navigation.goBack();
      // Show success message after navigation to prevent UI blocking
      setTimeout(() => {
        Alert.alert('Success', 'Task updated successfully!');
      }, 300);
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task. Please try again.');
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
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
});

export default EditTaskScreen;