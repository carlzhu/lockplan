import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getItems, deleteItem, completeItem, Item, ItemStatus, getStatusLabel, getStatusColor } from '../services/itemService';

type ViewMode = 'list' | 'card' | 'compact';
type SortBy = 'time' | 'priority' | 'type' | 'title';
type StatusFilter = 'all' | ItemStatus;

const { width } = Dimensions.get('window');

const ItemsScreenNew = ({ navigation }: any) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [sortBy, setSortBy] = useState<SortBy>('time');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [statusCounts, setStatusCounts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchItems();
    fetchStatusCounts();
  }, [statusFilter]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchItems();
      fetchStatusCounts();
    });
    return unsubscribe;
  }, [navigation, statusFilter]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const data = await getItems(undefined, true, true, status);
      const sorted = sortItems(data, sortBy);
      setItems(sorted);
    } catch (error) {
      console.error('Error fetching items:', error);
      Alert.alert('错误', '加载失败，请重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStatusCounts = async () => {
    try {
      // 获取所有项目以统计各状态数量
      const allItems = await getItems(undefined, true, true);
      const counts: { [key: string]: number } = {
        all: allItems.length,
        Todo: 0,
        InProgress: 0,
        Completed: 0,
        OnHold: 0,
        Cancelled: 0,
      };
      
      allItems.forEach(item => {
        if (counts[item.status] !== undefined) {
          counts[item.status]++;
        }
      });
      
      setStatusCounts(counts);
    } catch (error) {
      console.error('Error fetching status counts:', error);
    }
  };

  const handleStatusFilter = (status: StatusFilter) => {
    setStatusFilter(status);
  };

  const sortItems = (itemsToSort: Item[], sortType: SortBy): Item[] => {
    const sorted = [...itemsToSort];
    switch (sortType) {
      case 'time':
        return sorted.sort((a, b) => {
          const timeA = new Date(a.dueDate || a.eventTime || a.createdAt).getTime();
          const timeB = new Date(b.dueDate || b.eventTime || b.createdAt).getTime();
          return timeA - timeB;
        });
      case 'priority':
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return sorted.sort((a, b) => {
          const pA = priorityOrder[a.priority?.toLowerCase() as keyof typeof priorityOrder] ?? 4;
          const pB = priorityOrder[b.priority?.toLowerCase() as keyof typeof priorityOrder] ?? 4;
          return pA - pB;
        });
      case 'type':
        return sorted.sort((a, b) => a.type.localeCompare(b.type));
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted;
    }
  };

  const handleSort = (sortType: SortBy) => {
    setSortBy(sortType);
    const sorted = sortItems(items, sortType);
    setItems(sorted);
    setShowSortMenu(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchItems();
    fetchStatusCounts();
  };

  const handleDelete = (id: number) => {
    Alert.alert('确认删除', '确定要删除这个项目吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(id);
            fetchItems();
            fetchStatusCounts();
          } catch (error) {
            Alert.alert('错误', '删除失败');
          }
        },
      },
    ]);
  };

  const handleComplete = async (item: Item) => {
    try {
      await completeItem(item.id);
      fetchItems();
      fetchStatusCounts();
    } catch (error) {
      Alert.alert('错误', '操作失败');
    }
  };

  const handleItemPress = (item: Item) => {
    navigation.navigate('ItemDetail', { itemId: item.id });
  };

  const formatRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '明天';
    if (diffDays === -1) return '昨天';
    if (diffDays > 1 && diffDays <= 7) {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return weekdays[date.getDay()];
    }
    if (diffDays > 7 && diffDays <= 14) return '下周';
    if (diffDays < -7) return '已过期';
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  };

  const formatTimeOnly = (dateStr: string): string => {
    const date = new Date(dateStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getWeekSection = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < -7) return '已过期';
    if (diffDays < 0) return '本周（已过期）';
    if (diffDays <= 7) return '本周';
    if (diffDays <= 14) return '下周';
    if (diffDays <= 21) return '下下周';
    return '更晚';
  };

  const groupItemsByWeek = (itemsToGroup: Item[]): { [key: string]: Item[] } => {
    const grouped: { [key: string]: Item[] } = {};
    
    itemsToGroup.forEach(item => {
      const time = item.dueDate || item.eventTime;
      const section = time ? getWeekSection(time) : '未设置时间';
      
      if (!grouped[section]) {
        grouped[section] = [];
      }
      grouped[section].push(item);
    });
    
    return grouped;
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return '#d32f2f';
      case 'high': return '#f57c00';
      case 'medium': return '#fbc02d';
      case 'low': return '#7cb342';
      default: return '#9e9e9e';
    }
  };

  const getPriorityLabel = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return '紧急';
      case 'high': return '重要';
      case 'medium': return '普通';
      case 'low': return '次要';
      default: return '';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'task': return '任务';
      case 'event': return '事件';
      case 'project': return '项目';
      case 'note': return '笔记';
      default: return type;
    }
  };

  // 紧凑列表视图 - 重新设计，突出优先级和时间
  const renderCompactItem = ({ item }: { item: Item }) => {
    const time = item.dueDate || item.eventTime;
    const priorityColor = getPriorityColor(item.priority);
    const relativeTime = time ? formatRelativeTime(time) : '';
    const timeOnly = time ? formatTimeOnly(time) : '';

    return (
      <TouchableOpacity
        style={[styles.compactItem, item.isCompleted && styles.completedItem]}
        onPress={() => handleItemPress(item)}
      >
        {/* 左侧：优先级指示器 */}
        <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />
        
        <View style={styles.compactMain}>
          {/* 顶部：标题和完成状态 */}
          <View style={styles.compactTop}>
            {item.type === 'task' && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleComplete(item);
                }}
                style={styles.compactCheckbox}
              >
                <Ionicons
                  name={item.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={item.isCompleted ? '#7cb342' : '#bdbdbd'}
                />
              </TouchableOpacity>
            )}
            <Text
              style={[styles.compactTitle, item.isCompleted && styles.completedText]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
          </View>
          
          {/* 底部：时间和类型 */}
          <View style={styles.compactBottom}>
            <View style={styles.compactMeta}>
              <Text style={styles.compactType}>{getTypeLabel(item.type)}</Text>
              {item.tags && item.tags.length > 0 && (
                <>
                  <Text style={styles.metaSeparator}>·</Text>
                  <Text style={styles.compactTags} numberOfLines={1}>
                    {item.tags.slice(0, 2).join(', ')}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* 右侧：时间信息 */}
        {time && (
          <View style={styles.compactTimeContainer}>
            <Text style={styles.compactTimeDay}>{relativeTime}</Text>
            {timeOnly !== '00:00' && (
              <Text style={styles.compactTimeHour}>{timeOnly}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // 卡片视图
  const renderCardItem = ({ item }: { item: Item }) => {
    const time = item.dueDate || item.eventTime;
    const priorityColor = getPriorityColor(item.priority);

    return (
      <TouchableOpacity
        style={[styles.cardItem, item.isCompleted && styles.completedCard]}
        onPress={() => handleItemPress(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            {item.type === 'task' && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleComplete(item);
                }}
              >
                <Ionicons
                  name={item.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={item.isCompleted ? '#7cb342' : '#bdbdbd'}
                />
              </TouchableOpacity>
            )}
            <Text style={styles.cardType}>{getTypeLabel(item.type)}</Text>
          </View>
          {item.priority && (
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
              <Text style={styles.priorityText}>{getPriorityLabel(item.priority)}</Text>
            </View>
          )}
        </View>

        <Text style={[styles.cardTitle, item.isCompleted && styles.completedText]}>
          {item.title}
        </Text>

        {item.description && (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.cardFooter}>
          {time && (
            <View style={styles.cardTime}>
              <Ionicons name="time-outline" size={14} color="#757575" />
              <Text style={styles.cardTimeText}>{formatRelativeTime(time)}</Text>
            </View>
          )}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.cardTags}>
              {item.tags.slice(0, 3).map((tag, idx) => (
                <View key={idx} style={styles.cardTag}>
                  <Text style={styles.cardTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // 标准列表视图
  const renderListItem = ({ item }: { item: Item }) => {
    const time = item.dueDate || item.eventTime;
    const priorityColor = getPriorityColor(item.priority);

    return (
      <TouchableOpacity
        style={[styles.listItem, item.isCompleted && styles.completedItem]}
        onPress={() => handleItemPress(item)}
      >
        <View style={styles.listLeft}>
          {item.type === 'task' && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleComplete(item);
              }}
            >
              <Ionicons
                name={item.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={item.isCompleted ? '#7cb342' : '#bdbdbd'}
              />
            </TouchableOpacity>
          )}
          <View style={styles.listContent}>
            <Text style={[styles.listTitle, item.isCompleted && styles.completedText]}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={styles.listDescription} numberOfLines={1}>
                {item.description}
              </Text>
            )}
            <View style={styles.listMeta}>
              <Text style={styles.listType}>{getTypeLabel(item.type)}</Text>
              {time && (
                <>
                  <Text style={styles.metaSeparator}>·</Text>
                  <Text style={styles.listTime}>{formatRelativeTime(time)}</Text>
                </>
              )}
              {item.priority && (
                <>
                  <Text style={styles.metaSeparator}>·</Text>
                  <View style={[styles.listPriority, { backgroundColor: priorityColor }]}>
                    <Text style={styles.listPriorityText}>{getPriorityLabel(item.priority)}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = (props: { item: Item }) => {
    switch (viewMode) {
      case 'compact':
        return renderCompactItem(props);
      case 'card':
        return renderCardItem(props);
      case 'list':
        return renderListItem(props);
      default:
        return renderCompactItem(props);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 工具栏 */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          <Text style={styles.toolbarTitle}>全部项目</Text>
          <Text style={styles.toolbarCount}>{items.length}</Text>
        </View>
        <View style={styles.toolbarRight}>
          {/* 排序按钮 */}
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => setShowSortMenu(!showSortMenu)}
          >
            <Ionicons name="funnel-outline" size={20} color="#424242" />
          </TouchableOpacity>
          {/* 视图切换 */}
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => {
              const modes: ViewMode[] = ['compact', 'list', 'card'];
              const currentIndex = modes.indexOf(viewMode);
              setViewMode(modes[(currentIndex + 1) % modes.length]);
            }}
          >
            <Ionicons
              name={
                viewMode === 'compact'
                  ? 'list'
                  : viewMode === 'list'
                  ? 'grid-outline'
                  : 'apps-outline'
              }
              size={20}
              color="#424242"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 排序菜单 */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === 'time' && styles.sortOptionActive]}
            onPress={() => handleSort('time')}
          >
            <Ionicons name="time-outline" size={18} color={sortBy === 'time' ? '#4a90e2' : '#757575'} />
            <Text style={[styles.sortText, sortBy === 'time' && styles.sortTextActive]}>按时间</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === 'priority' && styles.sortOptionActive]}
            onPress={() => handleSort('priority')}
          >
            <Ionicons name="flag-outline" size={18} color={sortBy === 'priority' ? '#4a90e2' : '#757575'} />
            <Text style={[styles.sortText, sortBy === 'priority' && styles.sortTextActive]}>按重要度</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === 'type' && styles.sortOptionActive]}
            onPress={() => handleSort('type')}
          >
            <Ionicons name="albums-outline" size={18} color={sortBy === 'type' ? '#4a90e2' : '#757575'} />
            <Text style={[styles.sortText, sortBy === 'type' && styles.sortTextActive]}>按类型</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === 'title' && styles.sortOptionActive]}
            onPress={() => handleSort('title')}
          >
            <Ionicons name="text-outline" size={18} color={sortBy === 'title' ? '#4a90e2' : '#757575'} />
            <Text style={[styles.sortText, sortBy === 'title' && styles.sortTextActive]}>按标题</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 状态筛选条 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statusFilterContainer}
        contentContainerStyle={styles.statusFilterContent}
      >
        <TouchableOpacity
          style={[styles.statusChip, statusFilter === 'all' && styles.statusChipActive]}
          onPress={() => handleStatusFilter('all')}
        >
          <Text style={[styles.statusChipText, statusFilter === 'all' && styles.statusChipTextActive]}>
            全部 ({statusCounts.all || 0})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.statusChip, statusFilter === 'Todo' && styles.statusChipActive]}
          onPress={() => handleStatusFilter('Todo')}
        >
          <View style={[styles.statusDot, { backgroundColor: getStatusColor('Todo') }]} />
          <Text style={[styles.statusChipText, statusFilter === 'Todo' && styles.statusChipTextActive]}>
            {getStatusLabel('Todo')} ({statusCounts.Todo || 0})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.statusChip, statusFilter === 'InProgress' && styles.statusChipActive]}
          onPress={() => handleStatusFilter('InProgress')}
        >
          <View style={[styles.statusDot, { backgroundColor: getStatusColor('InProgress') }]} />
          <Text style={[styles.statusChipText, statusFilter === 'InProgress' && styles.statusChipTextActive]}>
            {getStatusLabel('InProgress')} ({statusCounts.InProgress || 0})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.statusChip, statusFilter === 'Completed' && styles.statusChipActive]}
          onPress={() => handleStatusFilter('Completed')}
        >
          <View style={[styles.statusDot, { backgroundColor: getStatusColor('Completed') }]} />
          <Text style={[styles.statusChipText, statusFilter === 'Completed' && styles.statusChipTextActive]}>
            {getStatusLabel('Completed')} ({statusCounts.Completed || 0})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.statusChip, statusFilter === 'OnHold' && styles.statusChipActive]}
          onPress={() => handleStatusFilter('OnHold')}
        >
          <View style={[styles.statusDot, { backgroundColor: getStatusColor('OnHold') }]} />
          <Text style={[styles.statusChipText, statusFilter === 'OnHold' && styles.statusChipTextActive]}>
            {getStatusLabel('OnHold')} ({statusCounts.OnHold || 0})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.statusChip, statusFilter === 'Cancelled' && styles.statusChipActive]}
          onPress={() => handleStatusFilter('Cancelled')}
        >
          <View style={[styles.statusDot, { backgroundColor: getStatusColor('Cancelled') }]} />
          <Text style={[styles.statusChipText, statusFilter === 'Cancelled' && styles.statusChipTextActive]}>
            {getStatusLabel('Cancelled')} ({statusCounts.Cancelled || 0})
          </Text>
        </TouchableOpacity>
      </ScrollView>

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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="file-tray-outline" size={64} color="#bdbdbd" />
              <Text style={styles.emptyText}>
                {statusFilter === 'all' ? '暂无项目' : `暂无${getStatusLabel(statusFilter as ItemStatus)}的项目`}
              </Text>
              <Text style={styles.emptyHint}>点击右下角 + 创建新项目</Text>
            </View>
          }
        />
      )}

      {/* 创建按钮 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('UnifiedCreate')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  toolbarCount: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 8,
  },
  toolbarRight: {
    flexDirection: 'row',
  },
  toolButton: {
    padding: 8,
    marginLeft: 8,
  },
  sortMenu: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  sortOptionActive: {
    backgroundColor: '#e3f2fd',
  },
  sortText: {
    fontSize: 13,
    color: '#757575',
    marginLeft: 4,
  },
  sortTextActive: {
    color: '#4a90e2',
    fontWeight: '500',
  },
  listContainer: {
    padding: 12,
  },
  // 紧凑视图样式 - 重新设计
  compactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingRight: 12,
    marginBottom: 1,
    borderRadius: 8,
  },
  priorityBar: {
    width: 4,
    alignSelf: 'stretch',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    marginRight: 12,
  },
  compactMain: {
    flex: 1,
    justifyContent: 'center',
  },
  compactTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  compactCheckbox: {
    marginRight: 8,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    flex: 1,
  },
  compactBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactType: {
    fontSize: 11,
    color: '#9e9e9e',
  },
  compactTags: {
    fontSize: 11,
    color: '#757575',
    flex: 1,
  },
  metaSeparator: {
    fontSize: 11,
    color: '#e0e0e0',
    marginHorizontal: 4,
  },
  compactTimeContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  compactTimeDay: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4a90e2',
    marginBottom: 2,
  },
  compactTimeHour: {
    fontSize: 10,
    color: '#757575',
  },
  // 卡片视图样式
  cardItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardType: {
    fontSize: 12,
    color: '#9e9e9e',
    marginLeft: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  priorityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    color: '#616161',
    lineHeight: 18,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTimeText: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 4,
  },
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardTag: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  cardTagText: {
    fontSize: 10,
    color: '#757575',
  },
  // 列表视图样式
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 10,
  },
  listLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  listContent: {
    flex: 1,
    marginLeft: 10,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 4,
  },
  listDescription: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listType: {
    fontSize: 11,
    color: '#9e9e9e',
  },
  listTime: {
    fontSize: 11,
    color: '#757575',
  },
  listPriority: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  listPriorityText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '600',
  },
  // 通用样式
  completedItem: {
    opacity: 0.5,
  },
  completedCard: {
    opacity: 0.6,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#9e9e9e',
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
    fontSize: 16,
    color: '#9e9e9e',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 13,
    color: '#bdbdbd',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4a90e2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});

// 状态筛选样式
const statusFilterStyles = StyleSheet.create({
  statusFilterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusFilterContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  statusChipActive: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#4a90e2',
  },
  statusChipText: {
    fontSize: 13,
    color: '#757575',
    fontWeight: '500',
  },
  statusChipTextActive: {
    color: '#4a90e2',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
});

// 合并样式
Object.assign(styles, statusFilterStyles);

export default ItemsScreenNew;
