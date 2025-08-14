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
  ToastAndroid,
} from 'react-native';
import { createTaskFromText } from '../services/taskService';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

const TaskInputScreen = ({ navigation }: any) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Request permissions when component mounts
    const getPermissions = async () => {
      try {
        console.log('Requesting audio recording permissions...');
        const { status } = await Audio.requestPermissionsAsync();
        console.log('Permission status:', status);
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Please grant microphone permissions to use voice input');
        }
      } catch (error) {
        console.error('Error requesting permissions:', error);
      }
    };
    
    getPermissions();
    
    // Configure audio mode for recording
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      staysActiveInBackground: false,
      playThroughEarpieceAndroid: false,
    });
    
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  const startRecording = async () => {
    try {
      console.log('Starting voice recording...');
      setIsRecording(true);
      setRecordingStatus('正在录音...');
      setRecordingDuration(0);
      
      // Prepare recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: false,
      });
      
      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      
      // Start timer to track recording duration
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to start recording', error);
      setIsRecording(false);
      setRecordingStatus('');
      Alert.alert('Error', 'Failed to start recording');
    }
  };
  
  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setRecordingStatus('处理中...');
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Stop recording
      if (!recording) {
        console.error('No recording to stop');
        return;
      }
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      if (!uri) {
        throw new Error('Recording URI is undefined');
      }
      
      console.log('Recording stopped, URI:', uri);
      
      // For now, we'll simulate the speech-to-text conversion
      // In a real app, you would send this audio file to a speech-to-text service
      simulateVoiceToText();
      
    } catch (error) {
      console.error('Failed to stop recording', error);
      setRecordingStatus('');
      Alert.alert('Error', 'Failed to process recording');
    }
  };
  
  const simulateVoiceToText = () => {
    // Common task-related phrases in Chinese
    const commonPhrases = [
      "明天上午9点开会",
      "提醒我下周一下午2点去医院",
      "高优先级：完成项目报告",
      "购物清单：牛奶，鸡蛋，面包",
      "下周三下午3点与客户电话会议",
      "记得给妈妈打电话",
      "本周五前完成季度报告",
      "安排下周团队建设活动",
      "准备下周演讲材料",
      "提前一天提醒我准备会议资料"
    ];
    
    // Get a random phrase based on recording duration
    // Longer recordings get longer phrases
    const index = Math.min(
      Math.floor(recordingDuration / 2), 
      commonPhrases.length - 1
    );
    const randomPhrase = commonPhrases[index];
    
    // Show processing status
    setRecordingStatus('语音转文字中...');
    
    // Simulate typing the phrase character by character
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= randomPhrase.length) {
        setText(randomPhrase.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        
        // Show success message
        setRecordingStatus('语音已转换为文本');
        
        // Clear status after a delay
        setTimeout(() => {
          setRecordingStatus('');
        }, 2000);
      }
    }, 50);
  };

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
        const taskTitles = result.map((task: { title: string }) => `• ${task.title}`).join('\n');
        
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

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading || isRecording}
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
            
            <TouchableOpacity
              style={[styles.button, styles.voiceButton, isRecording ? styles.recordingActive : null]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={loading}
            >
              <View style={styles.voiceButtonContent}>
                <Ionicons 
                  name={isRecording ? "stop-circle" : "mic"} 
                  size={24} 
                  color="#fff" 
                  style={styles.voiceIcon} 
                />
                <Text style={styles.voiceButtonText}>
                  {isRecording ? 'Stop Recording' : 'Voice Input'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {recordingStatus ? (
            <View style={styles.recordingStatusContainer}>
              <Text style={styles.recordingStatusText}>
                {recordingStatus}
                {isRecording && recordingDuration > 0 && ` (${recordingDuration}秒)`}
              </Text>
              {isRecording && (
                <View style={styles.recordingIndicator}>
                  <View style={[styles.recordingDot, styles.pulsing]} />
                </View>
              )}
            </View>
          ) : null}

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
            <Text style={styles.tipsText}>
              • 点击麦克风按钮开始录音，再次点击停止录音
            </Text>
            <Text style={styles.tipsText}>
              • 录音时间越长，生成的任务描述可能越详细
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: 10,
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#4a90e2',
  },
  voiceButton: {
    backgroundColor: '#34c759',
  },
  voiceButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceIcon: {
    marginRight: 8,
  },
  voiceButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  recordingActive: {
    backgroundColor: '#ff3b30',
  },
  recordingStatusContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingStatusText: {
    color: '#333',
    fontSize: 14,
  },
  recordingIndicator: {
    marginLeft: 10,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff3b30',
  },
  pulsing: {
    opacity: 1,
    transform: [{ scale: 1 }],
  },
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