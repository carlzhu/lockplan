import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getItems, deleteItem, completeItem, Item, ItemType } from '../services/itemService';

type FilterType = 'all' | 'task' | 'event' | 'project';

const ItemsScreen = ({ navigation }: any) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    fetchItems();
  }, [filter]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchItems();
    });
    return unsubscribe;
  }, [navigation, filter]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const type = filter === 'all' ? undefined : (filter as ItemType);
      const data = await getItems(type, true, true); // 包含子项，只获取顶层
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
      Alert.alert('错误', '加载失败，请重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      '确认删除',
      '确定要删除这个项目吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(id);
              fetchItems();
            } catch (error) {
              Alert.alert('错误', '删除失败');
            }
          },
        },
      ]
    );
  };

  const handleComplete = async (item: Item) => {
    if (item.type !== 'task') return;
    
    try {
      await completeItem(item.id);
      fetchItems();
    } catch (error) {
      Alert.alert('错误', '操作失败');
    }
  };

  const getTypeIcon = (type: ItemType) => {
    switch (type) {
      case 'task':
        return '✓';
      case 'event':
        return '📅';
      case 'project':
        return '📁';
      case 'note':
        return '📝';
      default:
        return '•';
    }
  };

  const getTypeColor = (type: ItemType) => {
    switch (type) {
      case 'task':
        return '#4a90e2';
      case 'event':
        return '#f39c12';
      case 'project':
        return '#9b59b6';
      case 'note':
        return '#27ae60';
      default:
        return '#95a5a6';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'critical':
        return '#e74c3c';
      case 'medium':
        return '#f39c12';
      case 'low':
        return '#27ae60';
      default:
        return '#95a5a6';
    }
  };

  const renderItem = ({ item }: { item: Item }) => {
    const typeColor = getTypeColor(item.type);
    const priorityColor = getPriorityColor(item.priority);
    const time = item.dueDate || item.eventTime;

    return (
      <TouchableOpacity
        style={[
          styles.itemCard,
          item.isCompleted && styles.completedCard,
        ]}
        onPress={() => {
          // TODO: 导航到详情页
        }}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemTypeContainer}>
            <View style={[styles.typeIndicator, { backgroundColor: typeColor }]}>
              <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
            </View>
            {item.type === 'task' && (
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => handleComplete(item)}
              >
                <Ionicons
                  name={item.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={item.isCompleted ? '#27ae60' : '#95a5a6'}
                />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>

        <Text
          style={[
            styles.itemTitle,
            item.isCompleted && styles.completedText,
          ]}
        >
          {item.title}
        </Text>

        {item.description && (
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.itemFooter}>
          {time && (
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={14} color="#95a5a6" />
              <Text style={styles.timeText}>
                {new Date(time).toLocaleString('zh-CN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}

          {item.priority && (
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
              <Text style={styles.priorityText}>{item.priority}</Text>
            </View>
          )}

          {item.subItems && item.subItems.length > 0 && (
            <View style={styles.subItemsBadge}>
              <Ionicons name="list-outline" size={14} color="#fff" />
              <Text style={styles.subItemsText}>{item.subItems.length}</Text>
            </View>
          )}
        </View>

        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 筛选器 */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            全部
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'task' && styles.filterButtonActive]}
          onPress={() => setFilter('task')}
        >
          <Text style={[styles.filterText, filter === 'task' && styles.filterTextActive]}>
            ✓ 任务
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'event' && styles.filterButtonActive]}
          onPress={() => setFilter('event')}
        >
          <Text style={[styles.filterText, filter === 'event' && styles.filterTextActive]}>
            📅 事件
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'project' && styles.filterButtonActive]}
          onPress={() => setFilter('project')}
        >
          <Text style={[styles.filterText, filter === 'project' && styles.filterTextActive]}>
            📁 项目
          </Text>
        </TouchableOpacity>
      </View>

      {/* 列表 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无内容</Text>
              <Text style={styles.emptyHint}>点击右下角 ➕ 创建新项目</Text>
            </View>
          }
        />
      )}

      {/* 创建按钮 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('UnifiedCreate', { type: filter === 'all' ? 'task' : filter })}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#4a90e2',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 12,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  completedCard: {
    opacity: 0.6,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  typeIcon: {
    fontSize: 16,
    color: '#fff',
  },
  checkboxContainer: {
    marginLeft: 4,
  },
  deleteButton: {
    padding: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#95a5a6',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#95a5a6',
    marginLeft: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  subItemsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a90e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subItemsText: {
    fontSize: 10,
    color: '#fff',
    marginLeft: 2,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#e5e5ea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#95a5a6',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#bdc3c7',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4a90e2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default ItemsScreen;
