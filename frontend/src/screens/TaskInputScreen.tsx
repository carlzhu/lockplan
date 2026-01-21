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

// Enable real voice recognition
const useVoiceRecognition = true;

const TaskInputScreen = ({ navigation }: any) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [partialResults, setPartialResults] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    
    // Initialize Voice
    if (useVoiceRecognition) {
      Voice.onSpeechStart = () => {
        console.log('Speech started');
        setRecordingStatus('正在听取您的语音...');
      };
      
      Voice.onSpeechRecognized = () => {
        console.log('Speech recognized');
      };
      
      Voice.onSpeechEnd = () => {
        console.log('Speech ended');
        setRecordingStatus('处理中...');
      };
      
      Voice.onSpeechResults = (e: SpeechResultsEvent) => {
        console.log('Speech results:', e);
        if (e.value && e.value.length > 0) {
          const recognizedText = e.value[0];
          setText(recognizedText);
          setPartialResults(e.value);
          setRecordingStatus('语音转换完成');
          
          // Clear status after a delay
          setTimeout(() => {
            setRecordingStatus('');
          }, 2000);
        }
      };
      
      Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
        console.log('Partial results:', e);
        if (e.value && e.value.length > 0) {
          setText(e.value[0]);
          setPartialResults(e.value);
        }
      };
      
      Voice.onSpeechError = (e: SpeechErrorEvent) => {
        console.error('Speech error:', e);
        setRecordingStatus('语音识别出错，请重试');
        
        // Fall back to simulation if real recognition fails
        if (isRecording) {
          simulateVoiceToText();
        }
        
        // Clear status after a delay
        setTimeout(() => {
          setRecordingStatus('');
        }, 3000);
      };
    }
    
    // Request microphone permissions
    const requestPermissions = async () => {
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
    };
    
    requestPermissions();
    
    // Cleanup on unmount
    return () => {
      isMounted = false;
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Clean up recording resources
      try {
        if (recording) {
          recording.stopAndUnloadAsync().catch(error => 
            console.error('Error stopping recording on unmount:', error)
          );
        }
        
        // Clean up Voice listeners
        if (useVoiceRecognition) {
          Voice.destroy().then(() => {
            console.log('Voice destroyed');
          }).catch(e => {
            console.error('Error destroying Voice instance:', e);
          });
        }
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
  }, []);
  
  const startRecording = async () => {
    try {
      // Reset state
      setPartialResults([]);
      setText('');
      
      // Start recording duration timer
      setIsRecording(true);
      setRecordingStatus('正在准备语音识别...');
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      if (useVoiceRecognition) {
        try {
          // Start voice recognition
          await Voice.start('zh-CN'); // Use Chinese language for recognition
          console.log('Voice recognition started');
        } catch (voiceError) {
          console.error('Error starting voice recognition:', voiceError);
          
          // Fall back to simulation if voice recognition fails
          simulateVoiceToText();
        }
      } else {
        // Start actual audio recording (for UI feedback)
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });
          
          const { recording } = await Audio.Recording.createAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
          );
          
          setRecording(recording);
          setRecordingStatus('正在听取您的语音...');
          
          // Use simulation mode
          console.log('Using voice simulation mode');
        } catch (audioError) {
          console.error('Error starting audio recording:', audioError);
          
          // Fall back to simulation if recording fails
          simulateVoiceToText();
        }
      }
    } catch (error) {
      console.error('Failed to start voice recording:', error);
      
      // Keep recording state active for simulation
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Fall back to simulation if recording fails
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
      
      if (useVoiceRecognition) {
        try {
          // Stop voice recognition
          await Voice.stop();
          console.log('Voice recognition stopped');
          
          // No need to call simulateVoiceToText here as the Voice.onSpeechResults
          // event handler will be triggered with the final results
        } catch (voiceError) {
          console.error('Error stopping voice recognition:', voiceError);
          
          // Fall back to simulation if stopping voice recognition fails
          simulateVoiceToText();
        }
      } else {
        // Stop actual audio recording
        if (recording) {
          try {
            await recording.stopAndUnloadAsync();
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: false,
            });
            setRecording(null);
          } catch (audioError) {
            console.error('Error stopping audio recording:', audioError);
          }
        }
        
        // Use simulation when real voice recognition is disabled
        simulateVoiceToText();
      }
    } catch (error) {
      console.error('Failed to stop voice recording:', error);
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
    
    // Show a notification that we're using simulation
    setTimeout(() => {
      // Only show alert if we're not in the middle of submitting
      if (!loading) {
        Alert.alert(
          '语音识别模拟',
          '正在使用模拟数据。实际语音识别功能将在后续版本中提供。',
          [{ text: '了解' }]
        );
      }
      
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
          setRecordingStatus('语音转换完成');
          
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
      // Make sure any ongoing recording is stopped before submitting
      if (isRecording) {
        try {
          if (useVoiceRecognition) {
            await Voice.stop().catch(e => 
              console.error('Error stopping voice recognition during submit:', e)
            );
          }
          
          if (recording) {
            await recording.stopAndUnloadAsync().catch(e => 
              console.error('Error stopping recording during submit:', e)
            );
            setRecording(null);
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
            <View style={styles.textInputWrapper}>
              <TextInput
                style={styles.textArea}
                placeholder="e.g., '明天上午9点开会' 或 '提醒我下周一下午2点去医院'"
                value={text}
                onChangeText={setText}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.voiceIconButton, isRecording && styles.voiceIconButtonActive]}
                onPress={isRecording ? stopRecording : startRecording}
                disabled={loading}
              >
                <Ionicons 
                  name={isRecording ? "stop-circle" : "mic"} 
                  size={28} 
                  color={isRecording ? "#ff3b30" : "#4a90e2"} 
                />
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
          </View>

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

          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 使用提示</Text>
            <Text style={styles.tipsText}>
              AI 可识别时间（"明天9点"）、优先级（"高优先级"）、提醒（"提前5分钟"）等信息
            </Text>
            <Text style={styles.tipsText}>
              点击右下角麦克风图标可使用语音输入，支持中文识别
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
  textInputWrapper: {
    position: 'relative',
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    paddingRight: 56, // Make room for the voice button
    fontSize: 16,
    minHeight: 180,
  },
  voiceIconButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  voiceIconButtonActive: {
    backgroundColor: '#ffe5e5',
  },
  recordingStatusContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingStatusText: {
    color: '#4a90e2',
    fontSize: 14,
    fontWeight: '500',
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
  button: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: '#4a90e2',
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
  tipsContainer: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4a90e2',
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  tipsText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default TaskInputScreen;