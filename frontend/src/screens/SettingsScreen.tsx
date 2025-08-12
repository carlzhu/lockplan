import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { API_URL, updateApiUrl } from '../config/apiConfig';
import { getAIModel, setAIModel, AIModel } from '../services/settingsService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = ({ navigation }: any) => {
  const { user, logout } = useContext(AuthContext);
  const [apiUrl, setApiUrl] = useState(API_URL);
  const [aiModel, setAiModel] = useState<AIModel>('qianwen');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const storedApiUrl = await AsyncStorage.getItem('apiUrl');
        const currentAiModel = await getAIModel();
        
        if (storedApiUrl) {
          setApiUrl(storedApiUrl);
        }
        
        setAiModel(currentAiModel);
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Save API URL settings
  const saveApiSettings = async () => {
    try {
      setSaving(true);
      
      // Validate URL format
      if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
        Alert.alert('Invalid URL', 'API URL must start with http:// or https://');
        return;
      }
      
      // Update API URL using the function from apiConfig
      const success = await updateApiUrl(apiUrl);
      
      if (success) {
        Alert.alert('Success', 'API settings saved successfully. You may need to log in again.');
      } else {
        Alert.alert('Error', 'Failed to save API settings');
      }
    } catch (error) {
      console.error('Error saving API settings:', error);
      Alert.alert('Error', 'Failed to save API settings');
    } finally {
      setSaving(false);
    }
  };

  // Save AI model settings
  const saveAiModelSettings = async () => {
    try {
      setSaving(true);
      const success = await setAIModel(aiModel);
      
      if (success) {
        Alert.alert('Success', 'AI model settings saved successfully');
      } else {
        Alert.alert('Error', 'Failed to save AI model settings');
      }
    } catch (error) {
      console.error('Error saving AI model settings:', error);
      Alert.alert('Error', 'Failed to save AI model settings');
    } finally {
      setSaving(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => logout() }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Server Settings</Text>
        <Text style={styles.sectionSubtitle}>Configure the backend API server URL</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>API URL</Text>
          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="https://api.example.com"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        
        <TouchableOpacity
          style={styles.button}
          onPress={saveApiSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Save API Settings</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Model Settings</Text>
        <Text style={styles.sectionSubtitle}>Select the AI model for task processing</Text>
        
        <TouchableOpacity
          style={[
            styles.modelOption,
            aiModel === 'qianwen' && styles.selectedModelOption
          ]}
          onPress={() => setAiModel('qianwen')}
        >
          <View style={styles.modelOptionContent}>
            <Text style={styles.modelName}>通义千问 (Qianwen)</Text>
            <Text style={styles.modelDescription}>阿里巴巴开发的大语言模型</Text>
          </View>
          {aiModel === 'qianwen' && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.modelOption,
            aiModel === 'ollama' && styles.selectedModelOption
          ]}
          onPress={() => setAiModel('ollama')}
        >
          <View style={styles.modelOptionContent}>
            <Text style={styles.modelName}>Ollama (Local)</Text>
            <Text style={styles.modelDescription}>本地运行的开源大语言模型</Text>
          </View>
          {aiModel === 'ollama' && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.button}
          onPress={saveAiModelSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Save AI Model Settings</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.sectionSubtitle}>Manage your account settings</Text>
        
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user.username || user.email || 'User'}
            </Text>
            {user.email && <Text style={styles.userEmail}>{user.email}</Text>}
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>VocalClerk v1.0.0</Text>
      </View>
    </ScrollView>
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
  section: {
    backgroundColor: '#fff',
    marginVertical: 10,
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#636366',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f2f2f7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007aff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
  },
  modelOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  selectedModelOption: {
    backgroundColor: '#f2f2f7',
    borderColor: '#007aff',
  },
  modelOptionContent: {
    flex: 1,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1c1c1e',
    marginBottom: 2,
  },
  modelDescription: {
    fontSize: 14,
    color: '#636366',
  },
  checkmark: {
    fontSize: 18,
    color: '#007aff',
    marginLeft: 8,
  },
  userInfo: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f2f2f7',
    borderRadius: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#636366',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#8e8e93',
  },
});

export default SettingsScreen;