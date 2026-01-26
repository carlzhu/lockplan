import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
  getItemById, 
  updateItem, 
  deleteItem, 
  completeItem, 
  changeItemStatus,
  Item, 
  UpdateItemDto,
  ItemStatus,
  getStatusLabel,
  getStatusIcon,
  getStatusColor,
} from '../services/itemService';
import { useSingleExecution } from '../hooks/useDebounce';

const ItemDetailScreen = ({ route, navigation }: any) => {
  const { itemId } = route.params;
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  
  // 编辑状态
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');
  const [tags, setTags] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // 状态相关
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusComment, setStatusComment] = useState('');

  useEffect(() => {
    fetchItem();
  }, [itemId]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const data = await getItemById(itemId, true);
      setItem(data);
      // 初始化编辑字段
      setTitle(data.title);
      setDescription(data.description || '');
      setPriority(data.priority || '');
      setTags(data.tags?.join(', ') || '');
      if (data.dueDate || data.eventTime) {
        setDueDate(new Date(data.dueDate || data.eventTime!));
      }
    } catch (error) {
      console.error('Error fetching item:', error);
      Alert.alert('错误', '加载失败');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInternal = async () => {
    if (!title.trim()) {
      Alert.alert('提示', '标题不能为空');
      return;
    }

    try {
      const updateData: UpdateItemDto = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority: priority || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : undefined,
      };

      if (dueDate) {
        if (item?.type === 'event') {
          updateData.eventTime = dueDate.toISOString();
        } else {
          updateData.dueDate = dueDate.toISOString();
        }
      }

      await updateItem(itemId, updateData);
      setEditing(false);
      fetchItem();
      Alert.alert('成功', '保存成功');
    } catch (error) {
      console.error('Error updating item:', error);
      Alert.alert('错误', '保存失败');
    }
  };

  const [handleSave, isSaving] = useSingleExecution(handleSaveInternal);

  const handleChangeStatusInternal = async (newStatus: ItemStatus) => {
    try {
      await changeItemStatus(itemId, {
        status: newStatus,
        comment: statusComment.trim() || undefined,
      });
      setShowStatusModal(false);
      setStatusComment('');
      fetchItem();
      Alert.alert('成功', '状态已更新');
    } catch (error) {
      console.error('Error changing status:', error);
      Alert.alert('错误', '状态更新失败');
    }
  };

  const [handleChangeStatus, isChangingStatus] = useSingleExecution(handleChangeStatusInternal);

  const handleDelete = () => {
    Alert.alert('确认删除', '确定要删除这个项目吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(itemId);
            navigation.goBack();
          } catch (error) {
            Alert.alert('错误', '删除失败');
          }
        },
      },
    ]);
  };

  const handleComplete = async () => {
    try {
      await completeItem(itemId);
      fetchItem();
    } catch (error) {
      Alert.alert('错误', '操作失败');
    }
  };

  const openStatusModal = () => {
    setStatusComment('');
    setShowStatusModal(true);
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      default: return '未设置';
    }
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

  if (!item) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {editing ? (
            <>
              <TouchableOpacity onPress={() => setEditing(false)} style={styles.headerButton}>
                <Text style={styles.cancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
                <Text style={styles.saveText}>保存</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={() => setEditing(true)} style={styles.headerButton}>
                <Ionicons name="create-outline" size={22} color="#4a90e2" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
                <Ionicons name="trash-outline" size={22} color="#e57373" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* 类型和状态 */}
        <View style={styles.section}>
          <View style={styles.typeRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{getTypeLabel(item.type)}</Text>
            </View>
            {item.type === 'task' && (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={handleComplete}
                disabled={editing}
              >
                <Ionicons
                  name={item.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                  size={28}
                  color={item.isCompleted ? '#7cb342' : '#bdbdbd'}
                />
                <Text style={[styles.completeText, item.isCompleted && styles.completedText]}>
                  {item.isCompleted ? '已完成' : '标记完成'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 标题 */}
        <View style={styles.section}>
          <Text style={styles.label}>标题</Text>
          {editing ? (
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="输入标题"
              multiline
            />
          ) : (
            <Text style={[styles.title, item.isCompleted && styles.completedTitle]}>
              {item.title}
            </Text>
          )}
        </View>

        {/* 描述 */}
        <View style={styles.section}>
          <Text style={styles.label}>描述</Text>
          {editing ? (
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder="输入描述"
              multiline
              numberOfLines={4}
            />
          ) : (
            <Text style={styles.description}>
              {item.description || '暂无描述'}
            </Text>
          )}
        </View>

        {/* 时间 */}
        <View style={styles.section}>
          <Text style={styles.label}>
            {item.type === 'event' ? '事件时间' : '截止时间'}
          </Text>
          {editing ? (
            <View>
              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeDisplay}>
                  <Text style={dueDate ? styles.dateTimeText : styles.dateTimePlaceholder}>
                    {dueDate ? formatDateTime(dueDate.toISOString()) : '未设置'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => {
                    if (!dueDate) setDueDate(new Date());
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={styles.buttonText}>📅</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => {
                    if (!dueDate) setDueDate(new Date());
                    setShowTimePicker(true);
                  }}
                >
                  <Text style={styles.buttonText}>🕒</Text>
                </TouchableOpacity>
                {dueDate && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setDueDate(null)}
                  >
                    <Text style={styles.buttonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#757575" />
              <Text style={styles.infoText}>
                {item.dueDate || item.eventTime
                  ? formatDateTime(item.dueDate || item.eventTime!)
                  : '未设置'}
              </Text>
            </View>
          )}
        </View>

        {/* 优先级 */}
        <View style={styles.section}>
          <Text style={styles.label}>重要程度</Text>
          {editing ? (
            <View style={styles.priorityButtons}>
              {['critical', 'high', 'medium', 'low'].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityButton,
                    priority === p && { backgroundColor: getPriorityColor(p) },
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      priority === p && styles.priorityButtonTextActive,
                    ]}
                  >
                    {getPriorityLabel(p)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.infoRow}>
              <View
                style={[
                  styles.priorityIndicator,
                  { backgroundColor: getPriorityColor(item.priority) },
                ]}
              />
              <Text style={styles.infoText}>{getPriorityLabel(item.priority)}</Text>
            </View>
          )}
        </View>

        {/* 状态 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>状态</Text>
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => navigation.navigate('ItemStatusHistory', { itemId: item.id })}
            >
              <Ionicons name="time-outline" size={18} color="#4a90e2" />
              <Text style={styles.historyButtonText}>历史</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}
            onPress={openStatusModal}
            disabled={editing}
          >
            <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={getStatusColor(item.status)} />
          </TouchableOpacity>
          {item.statusChangedAt && (
            <Text style={styles.statusChangedText}>
              更新于 {formatDateTime(item.statusChangedAt)}
            </Text>
          )}
        </View>

        {/* 标签 */}
        <View style={styles.section}>
          <Text style={styles.label}>标签</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={tags}
              onChangeText={setTags}
              placeholder="输入标签，用逗号分隔"
            />
          ) : (
            <View style={styles.tagsContainer}>
              {item.tags && item.tags.length > 0 ? (
                item.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noData}>暂无标签</Text>
              )}
            </View>
          )}
        </View>

        {/* 子项目 */}
        {item.subItems && item.subItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>子项目 ({item.subItems.length})</Text>
            {item.subItems.map((subItem) => (
              <TouchableOpacity
                key={subItem.id}
                style={styles.subItem}
                onPress={() => navigation.push('ItemDetail', { itemId: subItem.id })}
              >
                <Ionicons
                  name={subItem.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={subItem.isCompleted ? '#7cb342' : '#bdbdbd'}
                />
                <Text
                  style={[
                    styles.subItemText,
                    subItem.isCompleted && styles.completedText,
                  ]}
                >
                  {subItem.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 元信息 */}
        <View style={styles.section}>
          <Text style={styles.label}>创建信息</Text>
          <Text style={styles.metaText}>
            创建时间: {formatDateTime(item.createdAt)}
          </Text>
          {item.updatedAt && (
            <Text style={styles.metaText}>
              更新时间: {formatDateTime(item.updatedAt)}
            </Text>
          )}
          {item.completedAt && (
            <Text style={styles.metaText}>
              完成时间: {formatDateTime(item.completedAt)}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* 日期选择器 */}
      {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display="spinner"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (event.type === 'dismissed' || !selectedDate) return;
            
            if (dueDate) {
              selectedDate.setHours(dueDate.getHours());
              selectedDate.setMinutes(dueDate.getMinutes());
            }
            setDueDate(selectedDate);
          }}
        />
      )}

      {/* 时间选择器 */}
      {showTimePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="time"
          display="spinner"
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (event.type === 'dismissed' || !selectedTime) return;
            
            const newDateTime = dueDate ? new Date(dueDate) : new Date();
            newDateTime.setHours(selectedTime.getHours());
            newDateTime.setMinutes(selectedTime.getMinutes());
            setDueDate(newDateTime);
          }}
        />
      )}

      {/* 状态选择 Modal */}
      <Modal
        visible={showStatusModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>更改状态</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Ionicons name="close" size={28} color="#757575" />
              </TouchableOpacity>
            </View>

            <View style={styles.statusOptions}>
              {(['Todo', 'InProgress', 'Completed', 'OnHold', 'Cancelled'] as ItemStatus[]).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    { borderLeftColor: getStatusColor(status), borderLeftWidth: 4 },
                  ]}
                  onPress={() => handleChangeStatus(status)}
                  disabled={isChangingStatus}
                >
                  <Text style={styles.statusOptionIcon}>{getStatusIcon(status)}</Text>
                  <Text style={styles.statusOptionText}>{getStatusLabel(status)}</Text>
                  {item?.status === status && (
                    <Ionicons name="checkmark" size={24} color={getStatusColor(status)} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.commentSection}>
              <Text style={styles.commentLabel}>备注（可选）</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="添加状态变更说明..."
                value={statusComment}
                onChangeText={setStatusComment}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#fafafa',
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
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
    padding: 4,
  },
  cancelText: {
    fontSize: 16,
    color: '#757575',
  },
  saveText: {
    fontSize: 16,
    color: '#4a90e2',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: '#9e9e9e',
    marginBottom: 8,
    fontWeight: '500',
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 13,
    color: '#4a90e2',
    fontWeight: '500',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 6,
  },
  completedText: {
    color: '#7cb342',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#212121',
    lineHeight: 30,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#9e9e9e',
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '600',
    color: '#212121',
    padding: 0,
    minHeight: 60,
  },
  description: {
    fontSize: 15,
    color: '#616161',
    lineHeight: 22,
  },
  descriptionInput: {
    fontSize: 15,
    color: '#616161',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 15,
    color: '#424242',
    marginLeft: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 15,
    color: '#424242',
    marginLeft: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeDisplay: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
  },
  dateTimeText: {
    fontSize: 15,
    color: '#424242',
  },
  dateTimePlaceholder: {
    fontSize: 15,
    color: '#bdbdbd',
  },
  dateTimeButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  clearButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
  },
  priorityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  priorityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    marginBottom: 8,
  },
  priorityButtonText: {
    fontSize: 13,
    color: '#757575',
  },
  priorityButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#424242',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 13,
    color: '#4a90e2',
  },
  noData: {
    fontSize: 14,
    color: '#bdbdbd',
  },
  subItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  subItemText: {
    fontSize: 14,
    color: '#424242',
    marginLeft: 8,
    flex: 1,
  },
  metaText: {
    fontSize: 13,
    color: '#9e9e9e',
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  historyButtonText: {
    fontSize: 13,
    color: '#4a90e2',
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  statusChangedText: {
    fontSize: 12,
    color: '#9e9e9e',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  statusOptions: {
    marginBottom: 20,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 10,
  },
  statusOptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  statusOptionText: {
    fontSize: 16,
    color: '#212121',
    flex: 1,
  },
  commentSection: {
    marginTop: 10,
  },
  commentLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  commentInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export default ItemDetailScreen;
