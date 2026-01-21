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
  TextInput,
  Modal,
} from 'react-native';
import { getEvents, deleteEvent, EventData, EventCategory, getEventCategoryName, getEventCategoryIcon, getEventCategoryColor, getSeverityColor } from '../services/eventService';
import { AuthContext } from '../context/AuthContext';

type ViewMode = 'list' | 'grid';
type SortOption = 'eventTime' | 'category' | 'createdAt' | 'title';

const EventsScreen = ({ navigation }: any) => {
  const formatDateConsistently = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };
  
  const [events, setEvents] = useState<EventData[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('eventTime');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | null>(null);
  const [lastTap, setLastTap] = useState<number | null>(null);
  
  const { user, logout } = useContext(AuthContext);
  const isInitialMount = useRef(true);
  const lastFocusTime = useRef(Date.now());

  const fetchEvents = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const data = await getEvents();
      setEvents(data);
      applyFiltersAndSort(data);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      
      if (error.response && error.response.status === 403) {
        Alert.alert(
          'Authentication Error',
          'Your session has expired. Please log in again.',
          [{ text: 'OK', onPress: () => logout() }]
        );
      } else {
        if (showLoading || refreshing) {
          Alert.alert('Error', 'Failed to load events. Please try again.');
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFiltersAndSort = useCallback((eventsToProcess = events) => {
    let result = eventsToProcess.filter(event => {
      const matchesSearch = searchQuery === '' || 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = !categoryFilter || event.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
    
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'eventTime':
          if (!a.eventTime) return 1;
          if (!b.eventTime) return -1;
          return new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime();
        
        case 'category':
          return a.category.localeCompare(b.category);
        
        case 'createdAt':
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        
        case 'title':
          return a.title.localeCompare(b.title);
        
        default:
          return 0;
      }
    });
    
    setFilteredEvents(result);
  }, [searchQuery, categoryFilter, sortBy, events]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort, searchQuery, categoryFilter, sortBy]);

  useEffect(() => {
    isInitialMount.current = true;
    fetchEvents(true);
    
    return () => {
      isInitialMount.current = false;
    };
  }, []);
  
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('EventsScreen focused');
      const now = Date.now();
      const timeSinceLastFocus = now - lastFocusTime.current;
      console.log('Time since last focus:', timeSinceLastFocus, 'ms');
      
      fetchEvents(false);
      lastFocusTime.current = now;
    });

    return unsubscribe;
  }, [navigation]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const handleDeleteEvent = async (id: number) => {
    Alert.alert(
      '删除事件',
      '确定要删除这个事件吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(id);
              setEvents(events.filter(event => event.id !== id));
            } catch (error: any) {
              console.error('Error deleting event:', error);
              Alert.alert('错误', '删除事件失败，请重试。');
            }
          },
        },
      ]
    );
  };

  const handleDoubleTap = (eventId: number) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      navigation.navigate('EditEvent', { eventId });
      setLastTap(null);
    } else {
      setLastTap(now);
    }
  };

  const renderItem = ({ item }: { item: EventData }) => {
    let formattedEventTime = '无时间';
    if (item.eventTime) {
      const date = new Date(item.eventTime);
      formattedEventTime = formatDateConsistently(date);
    }
    
    let formattedCreatedDate = '未知';
    if (item.createdAt) {
      const date = new Date(item.createdAt);
      formattedCreatedDate = formatDateConsistently(date);
    }
    
    const categoryColor = getEventCategoryColor(item.category);
    const categoryIcon = getEventCategoryIcon(item.category);
    const categoryName = getEventCategoryName(item.category);
    
    return (
      <TouchableOpacity 
        style={[
          styles.eventItem,
          { borderLeftWidth: 4, borderLeftColor: categoryColor }
        ]}
        onPress={() => handleDoubleTap(item.id!)}
      >
        <View style={styles.categoryIndicator}>
          <Text style={styles.categoryIcon}>{categoryIcon}</Text>
        </View>
        
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
              <Text style={styles.categoryText}>{categoryName}</Text>
            </View>
          </View>
          
          <Text 
            style={[
              styles.eventDescription,
              !item.description && styles.emptyDescription
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.description || " \n "}
          </Text>
          
          {item.severity && (
            <View style={styles.severityContainer}>
              <View style={[styles.severityDot, { backgroundColor: getSeverityColor(item.severity) }]} />
              <Text style={styles.severityText}>严重程度: {item.severity}</Text>
            </View>
          )}
          
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
          
          <View style={styles.eventMeta}>
            <View style={styles.dateContainer}>
              <Text style={styles.dateIcon}>📅</Text>
              <Text style={styles.eventDate}>创建: {formattedCreatedDate}</Text>
            </View>
          </View>
          <View style={styles.eventMeta}>
            <View style={styles.dateContainer}>
              <Text style={styles.dateIcon}>🕒</Text>
              <Text style={styles.eventDate}>事件时间: {formattedEventTime}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.eventActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => navigation.navigate('EditEvent', { eventId: item.id })}
          >
            <Text style={styles.actionButtonText}>✎</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteEvent(item.id!)}
          >
            <Text style={styles.actionButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing && isInitialMount.current) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'grid' : 'list');
  };

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
          <Text style={styles.modalTitle}>排序方式</Text>
          
          <TouchableOpacity 
            style={[styles.modalOption, sortBy === 'eventTime' && styles.selectedOption]} 
            onPress={() => {
              setSortBy('eventTime');
              setSortModalVisible(false);
            }}
          >
            <Text style={styles.modalOptionText}>事件时间</Text>
            {sortBy === 'eventTime' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modalOption, sortBy === 'category' && styles.selectedOption]} 
            onPress={() => {
              setSortBy('category');
              setSortModalVisible(false);
            }}
          >
            <Text style={styles.modalOptionText}>类别</Text>
            {sortBy === 'category' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modalOption, sortBy === 'createdAt' && styles.selectedOption]} 
            onPress={() => {
              setSortBy('createdAt');
              setSortModalVisible(false);
            }}
          >
            <Text style={styles.modalOptionText}>创建时间</Text>
            {sortBy === 'createdAt' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modalOption, sortBy === 'title' && styles.selectedOption]} 
            onPress={() => {
              setSortBy('title');
              setSortModalVisible(false);
            }}
          >
            <Text style={styles.modalOptionText}>标题 (A-Z)</Text>
            {sortBy === 'title' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSortModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>关闭</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

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
          <Text style={styles.modalTitle}>按类别筛选</Text>
          
          <TouchableOpacity 
            style={[styles.modalOption, categoryFilter === null && styles.selectedOption]} 
            onPress={() => {
              setCategoryFilter(null);
              setFilterModalVisible(false);
            }}
          >
            <Text style={styles.modalOptionText}>所有类别</Text>
            {categoryFilter === null && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          
          {Object.values(EventCategory).map((category) => (
            <TouchableOpacity 
              key={category}
              style={[styles.modalOption, categoryFilter === category && styles.selectedOption]} 
              onPress={() => {
                setCategoryFilter(category);
                setFilterModalVisible(false);
              }}
            >
              <View style={styles.categoryOptionContent}>
                <Text style={styles.categoryOptionIcon}>{getEventCategoryIcon(category)}</Text>
                <Text style={styles.modalOptionText}>{getEventCategoryName(category)}</Text>
              </View>
              {categoryFilter === category && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setFilterModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>关闭</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>事件记录</Text>
        <View style={styles.headerButtons}>
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
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateItem', { type: 'event' })}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索事件..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {filteredEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>没有找到事件</Text>
          <Text style={styles.emptySubtext}>
            {events.length > 0 
              ? "尝试调整搜索或筛选条件" 
              : "点击 + 添加新事件"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      {renderSortModal()}
      {renderFilterModal()}
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
  listContainer: {
    padding: 10,
  },
  eventItem: {
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
  categoryIndicator: {
    marginRight: 8,
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 20,
  },
  eventContent: {
    flex: 1,
    paddingRight: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1c1c1e',
    flex: 1,
    marginRight: 6,
  },
  eventDescription: {
    fontSize: 12,
    color: '#3c3c43',
    marginBottom: 3,
    lineHeight: 16,
    minHeight: 32,
  },
  emptyDescription: {
    opacity: 0,
  },
  severityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  severityText: {
    fontSize: 11,
    color: '#636366',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  tag: {
    backgroundColor: '#e5e5ea',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 2,
  },
  tagText: {
    fontSize: 10,
    color: '#3c3c43',
  },
  eventMeta: {
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
  eventDate: {
    fontSize: 11,
    color: '#636366',
    fontWeight: '500',
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  eventActions: {
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
  categoryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryOptionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
});

export default EventsScreen;
