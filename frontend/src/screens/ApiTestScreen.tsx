import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { testTaskApi, testAuthToken } from '../utils/apiTest';
import { testEchoEndpoint, testPriorityEnum } from '../utils/apiDebug';

const ApiTestScreen = ({ navigation }: any) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>API Testing</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authentication Tests</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={testAuthToken}
        >
          <Text style={styles.buttonText}>Test Auth Token</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Task API Tests</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={testTaskApi}
        >
          <Text style={styles.buttonText}>Test Task API</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Debug Tools</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={testEchoEndpoint}
        >
          <Text style={styles.buttonText}>Test Priority Format</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { marginTop: 10 }]}
          onPress={testPriorityEnum}
        >
          <Text style={styles.buttonText}>Test Priority Enum</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Navigation</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Debug Information</Text>
        <Text style={styles.infoText}>
          This screen helps diagnose API issues by testing endpoints directly.
          Check the console logs for detailed information about API requests and responses.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1c1c1e',
  },
  button: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#fff',
    marginTop: 20,
    marginBottom: 30,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1c1c1e',
  },
  infoText: {
    fontSize: 14,
    color: '#3c3c43',
    lineHeight: 20,
  },
});

export default ApiTestScreen;