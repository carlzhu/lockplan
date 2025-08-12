import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { getTasks, deleteTask, completeTask, Task } from '../services/taskService';
import { AuthContext } from '../context/AuthContext';

const HomeScreen = ({ navigation }: any) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const isInitialMount = useRef(true);
  const lastFocusTime = useRef(Date.now());

  const fetchTasks = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const data = await getTasks();
      setTasks(data);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      
      // Check if it's a 403 error (unauthorized)
      if (error.response && error.response.status === 403) {
        Alert.alert(
          'Authentication Error',
          'Your session has expired. Please log in again.',
          [
            { 
              text: 'OK', 
              onPress: () => logout() 
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to load tasks. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Initial fetch on component mount
    fetchTasks();

    // Setup focus listener with improved logic
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('HomeScreen focused');
      const now = Date.now();
      
      // Always refresh when returning from CreateTask or EditTask screens
      // This ensures we see new or updated tasks immediately
      const timeSinceLastFocus = now - lastFocusTime.current;
      console.log('Time since last focus:', timeSinceLastFocus, 'ms');
      
      // Use background fetch (no loading indicator) to prevent screen flicker
      fetchTasks(false);
      
      lastFocusTime.current = now;
      isInitialMount.current = false;
    });

    return unsubscribe;
  }, [navigation]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleDeleteTask = async (id: string | number) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(id);
              setTasks(tasks.filter(task => task.id !== id));
            } catch (error: any) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleCompleteTask = async (id: string | number) => {
    try {
      const updatedTask = await completeTask(id);
      setTasks(
        tasks.map(task => (task.id === id ? { ...task, completed: true } : task))
      );
    } catch (error: any) {
      console.error('Error completing task:', error);
      Alert.alert('Error', 'Failed to complete task. Please try again.');
    }
  };

  const renderItem = ({ item }: { item: Task }) => {
    // Format date to show both date and time if available
    let formattedDate = 'No due date';
    if (item.dueDate) {
      const date = new Date(item.dueDate);
      const dateOptions: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      };
      const timeOptions: Intl.DateTimeFormatOptions = { 
        hour: '2-digit', 
        minute: '2-digit' 
      };
      
      formattedDate = `${date.toLocaleDateString(undefined, dateOptions)} at ${date.toLocaleTimeString(undefined, timeOptions)}`;
    }
    
    // Determine status indicator color
    const statusColor = item.completed ? '#34c759' : 
                        (item.dueDate && new Date(item.dueDate) < new Date() ? '#ff3b30' : '#007aff');
    
    return (
      <View style={[
        styles.taskItem, 
        item.completed && styles.completedTask,
        { borderLeftWidth: 4, borderLeftColor: getPriorityColor(item.priority || 'low') }
      ]}>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        </View>
        
        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <Text style={[styles.taskTitle, item.completed && styles.completedText]}>
              {item.title}
            </Text>
            
            {item.priority && (
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                <Text style={styles.priorityText}>{item.priority}</Text>
              </View>
            )}
          </View>
          
          {item.description && (
            <Text 
              style={[styles.taskDescription, item.completed && styles.completedText]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.description}
            </Text>
          )}
          
          <View style={styles.taskMeta}>
            <View style={styles.dateContainer}>
              <Text style={styles.dateIcon}>🕒</Text>
              <Text style={styles.taskDate}>{formattedDate}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.taskActions}>
          {!item.completed && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleCompleteTask(item.id!)}
            >
              <Text style={styles.actionButtonText}>✓</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => navigation.navigate('EditTask', { taskId: item.id })}
          >
            <Text style={styles.actionButtonText}>✎</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteTask(item.id!)}
          >
            <Text style={styles.actionButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return '#ff6b6b';
      case 'medium':
        return '#feca57';
      case 'low':
        return '#1dd1a1';
      default:
        return '#c8d6e5';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateTask')}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tasks found</Text>
          <Text style={styles.emptySubtext}>Tap + to add a new task</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('TaskInput')}
      >
        <Text style={styles.floatingButtonText}>Add with Text</Text>
      </TouchableOpacity>
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1c1e',
    letterSpacing: 0.25,
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f2f2f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  settingsButtonText: {
    fontSize: 16,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007aff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  addButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    lineHeight: 22,
  },
  listContainer: {
    padding: 10,
  },
  taskItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  completedTask: {
    backgroundColor: '#f8f9fa',
    opacity: 0.85,
  },
  statusIndicator: {
    marginRight: 8,
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskContent: {
    flex: 1,
    paddingRight: 4,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1c1c1e',
    flex: 1,
    marginRight: 6,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#8e8e93',
  },
  taskDescription: {
    fontSize: 12,
    color: '#3c3c43',
    marginBottom: 5,
    lineHeight: 16,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    fontSize: 10,
    marginRight: 2,
  },
  taskDate: {
    fontSize: 11,
    color: '#636366',
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  taskActions: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginLeft: 6,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 1,
  },
  completeButton: {
    backgroundColor: '#34c759',
  },
  editButton: {
    backgroundColor: '#ff9500',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#f8f9fa',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3c3c43',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
    lineHeight: 22,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#007aff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  floatingButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default HomeScreen;