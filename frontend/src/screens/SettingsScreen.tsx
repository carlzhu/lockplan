import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, DEFAULT_API_URL, updateApiUrl } from '../config/apiConfig';

const SettingsScreen = () => {
  const [apiUrl, setApiUrl] = useState(API_URL);
  const [savedUrl, setSavedUrl] = useState(API_URL);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedApiUrl = await AsyncStorage.getItem('api_url');
      if (storedApiUrl) {
        setApiUrl(storedApiUrl);
        setSavedUrl(storedApiUrl);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const success = await updateApiUrl(apiUrl);
      if (success) {
        setSavedUrl(apiUrl);
        Alert.alert(
          'Settings Saved',
          'API URL has been updated. Please restart the app for changes to take effect.',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Failed to update API URL');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Configuration</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>API URL</Text>
            <TextInput
              style={styles.input}
              value={apiUrl}
              onChangeText={setApiUrl}
              placeholder="Enter API URL"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.helpText}>
              Example: http://192.168.1.100:8080 (use your computer's IP address)
            </Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={saveSettings}
          >
            <Text style={styles.buttonText}>Save Settings</Text>
          </TouchableOpacity>

          {savedUrl !== DEFAULT_API_URL && (
            <View style={styles.noteContainer}>
              <Text style={styles.noteText}>
                Current API URL: {savedUrl}
              </Text>
              <Text style={styles.noteText}>
                Default API URL: {DEFAULT_API_URL}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setApiUrl(DEFAULT_API_URL);
                }}
              >
                <Text style={styles.resetText}>Reset to Default</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection Guide</Text>
          <Text style={styles.guideText}>
            1. For iOS Simulator: Use "http://localhost:8080"
          </Text>
          <Text style={styles.guideText}>
            2. For Android Emulator: Use "http://10.0.2.2:8080"
          </Text>
          <Text style={styles.guideText}>
            3. For Physical Device: Use "http://YOUR_COMPUTER_IP:8080"
          </Text>
          <Text style={styles.guideText}>
            4. Make sure your backend server is running and accessible from your device
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
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
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noteContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#feca57',
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resetText: {
    color: '#4a90e2',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  guideText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default SettingsScreen;