import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  getItemStatusHistory, 
  ItemStatusHistory, 
  getStatusLabel, 
  getStatusIcon, 
  getStatusColor 
} from '../services/itemService';

const ItemStatusHistoryScreen = ({ route, navigation }: any) => {
  const { itemId } = route.params;
  const [history, setHistory] = useState<ItemStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [itemId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getItemStatusHistory(itemId);
      setHistory(data);
    } catch (error) {
      console.error('Error loading status history:', error);
      Alert.alert('错误', '加载历史记录失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const renderHistoryItem = ({ item, index }: { item: ItemStatusHistory; index: number }) => {
    const isFirst = index === 0;
    const isLast = index === history.length - 1;

    return (
      <View style={styles.historyItem}>
        {/* 时间线 */}
        <View style={styles.timeline}>
          {!isFirst && <View style={styles.timelineLine} />}
          <View style={[styles.timelineDot, { backgroundColor: getStatusColor(item.newStatus) }]} />
          {!isLast && <View style={styles.timelineLine} />}
        </View>

        {/* 内容 */}
        <View style={styles.historyContent}>
          <View style={styles.historyHeader}>
            <View style={styles.statusChange}>
              {item.oldStatus && (
                <>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeIcon}>{getStatusIcon(item.oldStatus)}</Text>
                    <Text style={styles.statusBadgeText}>{getStatusLabel(item.oldStatus)}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color="#9e9e9e" style={styles.arrow} />
                </>
              )}
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.newStatus) + '20' }]}>
                <Text style={styles.statusBadgeIcon}>{getStatusIcon(item.newStatus)}</Text>
                <Text style={[styles.statusBadgeText, { color: getStatusColor(item.newStatus) }]}>
                  {getStatusLabel(item.newStatus)}
                </Text>
              </View>
            </View>
            <Text style={styles.timestamp}>{formatDateTime(item.changedAt)}</Text>
          </View>
          {item.comment && (
            <View style={styles.commentBox}>
              <Ionicons name="chatbox-outline" size={14} color="#757575" />
              <Text style={styles.comment}>{item.comment}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>状态历史</Text>
        <View style={styles.placeholder} />
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color="#e0e0e0" />
          <Text style={styles.emptyText}>暂无状态变更记录</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
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
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  placeholder: {
    width: 32,
  },
  listContainer: {
    padding: 16,
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timeline: {
    width: 30,
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e0e0e0',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4a90e2',
    marginVertical: 4,
  },
  historyContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyHeader: {
    marginBottom: 8,
  },
  statusChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  statusBadgeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#424242',
  },
  arrow: {
    marginHorizontal: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#9e9e9e',
  },
  commentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  comment: {
    fontSize: 13,
    color: '#616161',
    marginLeft: 6,
    flex: 1,
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9e9e9e',
    marginTop: 16,
  },
});

export default ItemStatusHistoryScreen;
