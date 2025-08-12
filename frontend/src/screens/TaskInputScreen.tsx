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
  ToastAndroid,
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
      
      // Show different messages based on the number of tasks created
      if (result && result.length > 0) {
        const taskCount = result.length;
        const taskTitles = result.map(task => `• ${task.title}`).join('\n');
        
        Alert.alert(
          'Success',
          `${taskCount} ${taskCount === 1 ? 'task' : 'tasks'} created:\n\n${taskTitles}`,
          [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
        );
        
        // Show toast on Android
        if (Platform.OS === 'android') {
          ToastAndroid.show(`${taskCount} ${taskCount === 1 ? 'task' : 'tasks'} created successfully!`, ToastAndroid.SHORT);
        }
        
        setText('');
      } else {
        Alert.alert(
          'Warning',
          'No tasks were created. Please try with more specific text.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Error creating task from text:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to create task. Please try again.'
      );
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
          <Text style={styles.title}>AI Task Creation</Text>
          <Text style={styles.subtitle}>
            Describe your task in natural language and our AI will create it for you
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Task Description</Text>
            <TextInput
              style={styles.textArea}
              placeholder="e.g., '当前电网公司的动态防逆流周期计划详情内部待分享给HEMS组'"
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
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.loadingText}>AI is processing your request...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Create Task with AI</Text>
            )}
          </TouchableOpacity>

          <View style={styles.exampleContainer}>
            <Text style={styles.exampleTitle}>AI understands:</Text>
            <Text style={styles.exampleText}>
              • 时间信息: "明天上午9点", "下周一下午2点", "本周末"
            </Text>
            <Text style={styles.exampleText}>
              • 优先级: "高优先级", "紧急", "重要", "低优先级"
            </Text>
            <Text style={styles.exampleText}>
              • 提醒: "提前5分钟提醒", "提前一天提醒"
            </Text>
            <Text style={styles.exampleText}>
              • 分类: "工作", "会议", "个人", "购物"
            </Text>
          </View>
          
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>提示:</Text>
            <Text style={styles.tipsText}>
              • 如果没有指定时间，系统将默认设置为明天
            </Text>
            <Text style={styles.tipsText}>
              • 任务创建后可以在主页面编辑更多详细信息
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  exampleContainer: {
    marginTop: 20,
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
  tipsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#feca57',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  tipsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
});

export default TaskInputScreen;