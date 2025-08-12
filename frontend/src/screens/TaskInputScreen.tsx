import React, { useState } from 'react';
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
} from 'react-native';
import { createTaskFromText } from '../services/taskService';

const TaskInputScreen = ({ navigation }: any) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter some text to create a task');
      return;
    }

    try {
      setLoading(true);
      const result = await createTaskFromText(text);
      Alert.alert(
        'Success',
        'Task created successfully!',
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );
      setText('');
    } catch (error) {
      console.error('Error creating task from text:', error);
      Alert.alert('Error', 'Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Task with Text</Text>
          <Text style={styles.subtitle}>
            Describe your task in natural language and we'll create it for you
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Task Description</Text>
            <TextInput
              style={styles.textArea}
              placeholder="e.g., 'Tomorrow at 9am SEMS meeting, need to prepare a calendar, create a to-do item, remind me 5 minutes before'"
              value={text}
              onChangeText={setText}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Task</Text>
            )}
          </TouchableOpacity>

          <View style={styles.exampleContainer}>
            <Text style={styles.exampleTitle}>Example inputs:</Text>
            <Text style={styles.exampleText}>
              • Tomorrow 9am SEMS meeting, remind me 5 minutes before
            </Text>
            <Text style={styles.exampleText}>
              • Call John about project proposal next Monday at 2pm
            </Text>
            <Text style={styles.exampleText}>
              • Buy groceries this weekend, high priority
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
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
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
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
  exampleContainer: {
    marginTop: 30,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4a90e2',
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  exampleText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
});

export default TaskInputScreen;