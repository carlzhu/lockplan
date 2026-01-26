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
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { getTasks, deleteTask, completeTask, Task } from '../services/taskServiceLocal';
import { AuthContext } from '../context/AuthContext';
import { getSyncStatus } from '../services/syncService';

// Define view mode types
type ViewMode = 'list' | 'grid';

// Define sort options
type SortOption = 'dueDate' | 'priority' | 'createdAt' | 'title';

const HomeScreen = ({ navigation }: any) => {
  // Helper function to format dates consistently as yyyy-MM-dd HH:mm:ss
  const formatDateConsistently = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };
  
  // State variables
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [lastTap, setLastTap] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);
  
  const { user, logout } = useContext(AuthContext);
  const isInitialMount = useRef(true);
  const lastFocusTime = useRef(Date.now());

  // Function to fetch tasks from the API
  const fetchTasks = async (showLoading = true) => {
    try {
      // Only show loading indicator for initial load or manual refresh
      // This prevents screen flicker when returning from other screens
      if (showLoading) {
        setLoading(true);
      }
      
      const data = await getTasks();
      
      // Use functional updates to ensure we're working with the latest state
      setTasks(data);
      applyFiltersAndSort(data); // Apply filters and sorting to the fetched data
      
      // Update sync status
      const syncStatus = await getSyncStatus();
      setIsOnline(syncStatus.isOnline);
      setPendingSync(syncStatus.pendingOperations);
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
        // Only show error alert for manual refreshes, not background updates
        if (showLoading || refreshing) {
          Alert.alert('Error', 'Failed to load tasks. Please try again.');
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Function to apply filters and sorting to tasks
  const applyFiltersAndSort = useCallback((tasksToProcess = tasks) => {
    // First apply search filter
    let result = tasksToProcess.filter(task => {
      const matchesSearch = searchQuery === '' || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Apply priority filter if set
      const matchesPriority = !priorityFilter || 
        (task.priority && task.priority.toLowerCase() === priorityFilter.toLowerCase());
      
      return matchesSearch && matchesPriority;
    });
    
    // Then sort the filtered results
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          // Sort by due date (tasks with no due date go to the end)
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        
        case 'priority':
          // Sort by priority (high > medium > low)
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          const aPriority = a.priority ? a.priority.toLowerCase() : 'low';
          const bPriority = b.priority ? b.priority.toLowerCase() : 'low';
          return priorityOrder[aPriority as keyof typeof priorityOrder] - 
                 priorityOrder[bPriority as keyof typeof priorityOrder];
        
        case 'createdAt':
          // Sort by creation date
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        
        case 'title':
          // Sort alphabetically by title
          return a.title.localeCompare(b.title);
        
        default:
          return 0;
      }
    });
    
    setFilteredTasks(result);
  }, [searchQuery, priorityFilter, sortBy, tasks]);

  // Apply filters and sorting whenever relevant state changes
  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort, searchQuery, priorityFilter, sortBy]);

  // Initial data fetch and focus listener setup
  useEffect(() => {
    // Set initial mount state
    isInitialMount.current = true;
    
    // Initial fetch on component mount - only time we show the loading indicator
    fetchTasks(true);
    
    // Mark that initial mount is complete after the first render
    return () => {
      isInitialMount.current = false;
    };
  }, []);
  
  // Setup navigation focus listener
  useEffect(() => {
    // Setup focus listener with silent refresh logic
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('HomeScreen focused');
      const now = Date.now();
      
      // Calculate time since last focus
      const timeSinceLastFocus = now - lastFocusTime.current;
      console.log('Time since last focus:', timeSinceLastFocus, 'ms');
      
      // Always refresh when returning to this screen, even if it's the initial mount
      // This ensures we always have the latest data after editing a task
      fetchTasks(false);
      
      lastFocusTime.current = now;
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

  const handleDoubleTap = (taskId: string | number) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      // Double tap detected
      navigation.navigate('EditTask', { taskId });
      setLastTap(null); // Reset to avoid triggering on triple tap
    } else {
      setLastTap(now);
    }
  };

  const renderItem = ({ item }: { item: Task }) => {
    // Format due date in consistent format: yyyy-MM-dd HH:mm:ss
    let formattedDueDate = 'No due date';
    if (item.dueDate) {
      const date = new Date(item.dueDate);
      formattedDueDate = formatDateConsistently(date);
    }
    
    // Format creation date in consistent format: yyyy-MM-dd HH:mm:ss
    let formattedCreatedDate = 'Unknown';
    if (item.createdAt) {
      const date = new Date(item.createdAt);
      formattedCreatedDate = formatDateConsistently(date);
    }
    
    // Determine status indicator color
    const statusColor = item.completed ? '#34c759' : 
                        (item.dueDate && new Date(item.dueDate) < new Date() ? '#ff3b30' : '#007aff');
    
    return (
      <TouchableOpacity 
        style={[
          styles.taskItem, 
          item.completed && styles.completedTask,
          { borderLeftWidth: 4, borderLeftColor: getPriorityColor(item.priority || 'low') }
        ]}
        onPress={() => handleDoubleTap(item.id!)}
      >
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
          
          <Text 
            style={[
              styles.taskDescription, 
              item.completed && styles.completedText,
              !item.description && styles.emptyDescription
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.description || " \n "}
          </Text>
          
          <View style={styles.taskMeta}>
            <View style={styles.dateContainer}>
              <Text style={styles.dateIcon}>📅</Text>
              <Text style={styles.taskDate}>Created: {formattedCreatedDate}</Text>
            </View>
          </View>
          <View style={styles.taskMeta}>
            <View style={styles.dateContainer}>
              <Text style={styles.dateIcon}>🕒</Text>
              <Text style={styles.taskDate}>Due: {formattedDueDate}</Text>
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
      </TouchableOpacity>
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

  // Only show loading indicator on initial mount, not when returning to the screen
  if (loading && !refreshing && isInitialMount.current) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  // Toggle between list and grid view
  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'grid' : 'list');
  };

  // Render the sort modal
  const renderSortModal = () => (
    <Modal
      visible={sortModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setSortModalVisible(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setSortModalVisible(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Sort Tasks By</Text>
          
          <TouchableOpacity 
            style={[styles.modalOption, sortBy === 'dueDate' && styles.selectedOption]} 
            onPress={() => {
              setSortBy('dueDate');
              setSortModalVisible(false);
            }}
          >
            <Text style={styles.modalOptionText}>Due Date</Text>
            {sortBy === 'dueDate' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modalOption, sortBy === 'priority' && styles.selectedOption]} 
            onPress={() => {
              setSortBy('priority');
              setSortModalVisible(false);
            }}
          >
            <Text style={styles.modalOptionText}>Priority</Text>
            {sortBy === 'priority' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modalOption, sortBy === 'createdAt' && styles.selectedOption]} 
            onPress={() => {
              setSortBy('createdAt');
              setSortModalVisible(false);
            }}
          >
            <Text style={styles.modalOptionText}>Creation Date</Text>
            {sortBy === 'createdAt' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modalOption, sortBy === 'title' && styles.selectedOption]} 
            onPress={() => {
              setSortBy('title');
              setSortModalVisible(false);
            }}
          >
            <Text style={styles.modalOptionText}>Title (A-Z)</Text>
            {sortBy === 'title' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSortModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Render the filter modal
  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filter by Priority</Text>
          
          <TouchableOpacity 
            style={[styles.modalOption, priorityFilter === null && styles.selectedOption]} 
            onPress={() => {
              setPriorityFilter(null);
              setFilterModalVisible(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Priorities</Text>
            {priorityFilter === null && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modalOption, priorityFilter === 'high' && styles.selectedOption]} 
            onPress={() => {
              setPriorityFilter('high');
              setFilterModalVisible(false);
            }}
          >
            <View style={styles.priorityOptionContent}>
              <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor('high') }]} />
              <Text style={styles.modalOptionText}>High Priority</Text>
            </View>
            {priorityFilter === 'high' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modalOption, priorityFilter === 'medium' && styles.selectedOption]} 
            onPress={() => {
              setPriorityFilter('medium');
              setFilterModalVisible(false);
            }}
          >
            <View style={styles.priorityOptionContent}>
              <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor('medium') }]} />
              <Text style={styles.modalOptionText}>Medium Priority</Text>
            </View>
            {priorityFilter === 'medium' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modalOption, priorityFilter === 'low' && styles.selectedOption]} 
            onPress={() => {
              setPriorityFilter('low');
              setFilterModalVisible(false);
            }}
          >
            <View style={styles.priorityOptionContent}>
              <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor('low') }]} />
              <Text style={styles.modalOptionText}>Low Priority</Text>
            </View>
            {priorityFilter === 'low' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setFilterModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Render grid item for grid view
  const renderGridItem = ({ item }: { item: Task }) => {
    // Format due date in consistent format: yyyy-MM-dd HH:mm:ss
    let formattedDueDate = 'No due date';
    if (item.dueDate) {
      const date = new Date(item.dueDate);
      formattedDueDate = formatDateConsistently(date);
    }
    
    // Format creation date in consistent format: yyyy-MM-dd HH:mm:ss
    let formattedCreatedDate = 'Unknown';
    if (item.createdAt) {
      const date = new Date(item.createdAt);
      formattedCreatedDate = formatDateConsistently(date);
    }
    
    // Determine status indicator color
    const statusColor = item.completed ? '#34c759' : 
                        (item.dueDate && new Date(item.dueDate) < new Date() ? '#ff3b30' : '#007aff');
    
    return (
      <TouchableOpacity 
        style={[
          styles.gridItem, 
          item.completed && styles.completedTask,
          { borderTopColor: getPriorityColor(item.priority || 'low'), borderTopWidth: 4 }
        ]}
        onPress={() => handleDoubleTap(item.id!)}
      >
        <View>
          <View style={styles.gridItemHeader}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            {item.priority && (
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                <Text style={styles.priorityText}>{item.priority}</Text>
              </View>
            )}
          </View>
          
          <Text 
            style={[styles.gridItemTitle, item.completed && styles.completedText]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.title}
          </Text>
          
          <Text 
            style={[
              styles.gridItemDescription, 
              item.completed && styles.completedText,
              !item.description && styles.emptyDescription
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.description || " \n "}
          </Text>
        </View>
        
        <View style={styles.gridItemFooter}>
          <Text style={styles.gridItemDate}>📅 {formattedCreatedDate.substring(0, 10)}</Text>
          <Text style={styles.gridItemDate}>🕒 {formattedDueDate.substring(0, 10)}</Text>
          
          <View style={styles.gridItemActions}>
            {!item.completed && (
              <TouchableOpacity
                style={[styles.smallActionButton, styles.completeButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleCompleteTask(item.id!);
                }}
              >
                <Text style={styles.smallActionButtonText}>✓</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.smallActionButton, styles.editButton]}
              onPress={(e) => {
                e.stopPropagation();
                navigation.navigate('EditTask', { taskId: item.id });
              }}
            >
              <Text style={styles.smallActionButtonText}>✎</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallActionButton, styles.deleteButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteTask(item.id!);
              }}
            >
              <Text style={styles.smallActionButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading check is now handled above

  return (
    <View style={styles.container}>
      {/* 离线指示器 */}
      {!isOnline && (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>📡 离线模式</Text>
        </View>
      )}
      
      {/* 同步状态指示器 */}
      {pendingSync > 0 && (
        <View style={styles.syncIndicator}>
          <Text style={styles.syncText}>⏳ {pendingSync} 项待同步</Text>
        </View>
      )}
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Events')}
          >
            <Text style={styles.iconButtonText}>📝</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.iconButtonText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={toggleViewMode}
          >
            <Text style={styles.iconButtonText}>{viewMode === 'list' ? '📊' : '📋'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setSortModalVisible(true)}
          >
            <Text style={styles.iconButtonText}>🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Text style={styles.iconButtonText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('WeeklyAgenda')}
          >
            <Text style={styles.iconButtonText}>🗒️ 周会</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {filteredTasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tasks found</Text>
          <Text style={styles.emptySubtext}>
            {tasks.length > 0 
              ? "Try adjusting your search or filters" 
              : "Tap + to add a new task"}
          </Text>
        </View>
      ) : viewMode === 'list' ? (
        <FlatList
          key="list"
          data={filteredTasks}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <FlatList
          key="grid"
          data={filteredTasks}
          renderItem={renderGridItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.gridContainer}
          numColumns={2}
          columnWrapperStyle={styles.gridColumnWrapper}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      {renderSortModal()}
      {renderFilterModal()}

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('UnifiedCreate', { type: 'task' })}
      >
        <Text style={styles.floatingButtonIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // 离线和同步指示器
  offlineIndicator: {
    backgroundColor: '#ff9500',
    padding: 8,
    alignItems: 'center',
  },
  offlineText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  syncIndicator: {
    backgroundColor: '#5ac8fa',
    padding: 6,
    alignItems: 'center',
  },
  syncText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  
  // Search container styles
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  searchInput: {
    backgroundColor: '#f2f2f7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  
  // Icon button styles
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f2f2f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  iconButtonText: {
    fontSize: 16,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  selectedOption: {
    backgroundColor: '#f2f2f7',
  },
  modalOptionText: {
    fontSize: 16,
  },
  checkmark: {
    fontSize: 16,
    color: '#007aff',
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#007aff',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  priorityOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  
  // Grid view styles
  gridContainer: {
    padding: 8,
  },
  gridColumnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  gridItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 160,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  gridItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 6,
  },
  gridItemDescription: {
    fontSize: 12,
    color: '#3c3c43',
    marginBottom: 8,
    lineHeight: 16,
    minHeight: 32,
  },
  gridItemFooter: {
    marginTop: 'auto',
  },
  gridItemDate: {
    fontSize: 11,
    color: '#636366',
    marginBottom: 8,
  },
  gridItemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  smallActionButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  smallActionButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
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
    marginBottom: 3,
    lineHeight: 16,
    minHeight: 32, // Ensures space for 2 lines
  },
  emptyDescription: {
    opacity: 0,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
    marginBottom: 1,
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
    marginLeft: 4,
  },
  actionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
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
    fontSize: 12,
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
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#4a90e2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  floatingButtonIcon: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 32,
  },
});

export default HomeScreen;
