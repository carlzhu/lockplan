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
  Linking,
} from 'react-native';
import { createTaskFromText } from '../services/taskService';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';

const TaskInputScreen = ({ navigation }: any) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isVoiceAvailable, setIsVoiceAvailable] = useState(false);
  const [partialResults, setPartialResults] = useState<string[]>([]);
  const [voiceError, setVoiceError] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    
    // Set up Voice recognition
    const setupVoiceRecognition = async () => {
      try {
        // Initialize Voice
        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechEnd = onSpeechEnd;
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechPartialResults = onSpeechPartialResults;
        Voice.onSpeechError = onSpeechError;
        
        // Check if voice recognition is available
        try {
          const isAvailable = await Voice.isAvailable();
          if (isMounted) {
            setIsVoiceAvailable(isAvailable);
          }
          
          if (!isAvailable) {
            console.warn('Voice recognition is not available on this device');
          }
        } catch (availabilityError) {
          console.warn('Error checking voice availability:', availabilityError);
          if (isMounted) {
            setIsVoiceAvailable(false);
          }
        }
        
        // Request microphone permissions
        try {
          console.log('Requesting audio recording permissions...');
          const { status } = await Audio.requestPermissionsAsync();
          console.log('Permission status:', status);
          
          if (status !== 'granted' && isMounted) {
            Alert.alert(
              'Permission Required', 
              'Microphone access is required for voice input. Please enable it in your device settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Open Settings', 
                  onPress: () => {
                    // On iOS this will open the settings app
                    if (Platform.OS === 'ios') {
                      Linking.openURL('app-settings:');
                    }
                  }
                }
              ]
            );
          }
        } catch (permissionError) {
          console.error('Error requesting permissions:', permissionError);
        }
      } catch (error) {
        console.error('Error setting up voice recognition:', error);
        if (isMounted) {
          setVoiceError('Failed to initialize voice recognition');
        }
      }
    };
    
    setupVoiceRecognition();
    
    // Cleanup on unmount
    return () => {
      isMounted = false;
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Clean up Voice and recording resources
      try {
        if (recording) {
          recording.stopAndUnloadAsync().catch(error => 
            console.error('Error stopping recording on unmount:', error)
          );
        }
        
        Voice.destroy().then(() => {
          console.log('Voice destroyed');
        }).catch(e => {
          console.error('Error destroying Voice instance:', e);
        });
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
  }, []);
  
  const onSpeechStart = () => {
    console.log('Speech started');
    setRecordingStatus('正在听取您的语音...');
  };
  
  const onSpeechEnd = () => {
    console.log('Speech ended');
    setIsRecording(false);
    setRecordingStatus('语音识别完成');
    
    // Clear status after a delay
    setTimeout(() => {
      setRecordingStatus('');
    }, 2000);
  };
  
  const onSpeechResults = (e: SpeechResultsEvent) => {
    console.log('Speech results:', e);
    if (e.value && e.value.length > 0) {
      setText(e.value[0]);
    }
  };
  
  const onSpeechPartialResults = (e: SpeechResultsEvent) => {
    console.log('Partial results:', e);
    if (e.value) {
      setPartialResults(e.value);
      if (e.value.length > 0) {
        setText(e.value[0]);
      }
    }
  };
  
  const onSpeechError = (e: SpeechErrorEvent) => {
    console.error('Speech error:', e);
    setVoiceError(`Error: ${e.error?.message || 'Unknown error'}`);
    setIsRecording(false);
    setRecordingStatus('语音识别出错');
    
    // Clear status after a delay
    setTimeout(() => {
      setRecordingStatus('');
    }, 2000);
    
    // If voice recognition fails, fall back to simulation
    if (!partialResults.length) {
      simulateVoiceToText();
    }
  };
  
  const startRecording = async () => {
    try {
      // Reset state
      setPartialResults([]);
      setVoiceError('');
      setText('');
      
      // Start recording duration timer
      setIsRecording(true);
      setRecordingStatus('正在准备语音识别...');
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      // Start voice recognition
      if (isVoiceAvailable) {
        try {
          // Set language based on device locale, defaulting to Chinese
          const locale = Platform.OS === 'ios' ? 'zh-CN' : 'zh';
          await Voice.start(locale);
          console.log('Voice recognition started');
        } catch (voiceError) {
          console.error('Error starting voice recognition:', voiceError);
          throw voiceError;
        }
      } else {
        console.warn('Voice recognition not available, falling back to simulation');
        throw new Error('Voice recognition is not available on this device');
      }
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      setIsRecording(false);
      setRecordingStatus('');
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // More detailed error message
      let errorMessage = 'Failed to start voice recognition. ';
      
      if (error instanceof Error) {
        errorMessage += error.message;
      }
      
      // Fall back to simulation if voice recognition fails
      simulateVoiceToText();
    }
  };
  
  const stopRecording = async () => {
    try {
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setRecordingStatus('处理中...');
      
      // Stop voice recognition
      if (isVoiceAvailable) {
        try {
          await Voice.stop();
          console.log('Voice recognition stopped');
        } catch (voiceError) {
          console.error('Error stopping voice recognition:', voiceError);
        }
      }
      
      // If we didn't get any results, fall back to simulation
      if (!partialResults.length) {
        simulateVoiceToText();
      }
    } catch (error) {
      console.error('Failed to stop voice recognition:', error);
      setRecordingStatus('');
      
      // Fall back to simulation
      simulateVoiceToText();
    } finally {
      setIsRecording(false);
    }
  };
  
  const simulateVoiceToText = () => {
    // Show processing status
    setRecordingStatus('语音转文字中...');
    
    // Show a notification that we're falling back to simulation
    setTimeout(() => {
      Alert.alert(
        '语音识别失败',
        '无法使用设备语音识别功能，正在使用模拟数据。请检查麦克风权限和网络连接。',
        [{ text: '了解' }]
      );
      
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
      
      // Simulate typing the phrase character by character
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex <= randomPhrase.length) {
          setText(randomPhrase.substring(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          
          // Show success message
          setRecordingStatus('模拟语音转换完成');
          
          // Clear status after a delay
          setTimeout(() => {
            setRecordingStatus('');
          }, 2000);
        }
      }, 50);
    }, 1000);
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter some text to create a task');
      return;
    }

    try {
      // Make sure any ongoing voice recognition is stopped before submitting
      if (isRecording) {
        try {
          if (isVoiceAvailable) {
            await Voice.stop().catch(e => 
              console.error('Error stopping voice during submit:', e)
            );
          }
          
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          
          setIsRecording(false);
        } catch (error) {
          console.error('Error stopping recording during submit:', error);
          // Continue with submission even if stopping recording fails
        }
      }
      
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
        setPartialResults([]);
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
              • 请在安静的环境中使用语音输入以提高识别准确率
            </Text>
            <Text style={styles.tipsText}>
              • 语音识别支持中文，请清晰地说出任务描述
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