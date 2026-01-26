import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ItemsScreenNew from './ItemsScreenNew';
import SettingsScreen from './SettingsScreen';

type TabType = 'items' | 'stats' | 'settings';

const MainTabsScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<TabType>('items');

  const renderContent = () => {
    switch (activeTab) {
      case 'items':
        return <ItemsScreenNew navigation={navigation} />;
      case 'stats':
        return <StatsView />;
      case 'settings':
        return <SettingsScreen navigation={navigation} />;
      default:
        return <ItemsScreenNew navigation={navigation} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 内容区域 */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* 底部导航栏 */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('items')}
        >
          <Ionicons
            name={activeTab === 'items' ? 'list' : 'list-outline'}
            size={24}
            color={activeTab === 'items' ? '#4a90e2' : '#95a5a6'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'items' && styles.tabLabelActive,
            ]}
          >
            项目
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('stats')}
        >
          <Ionicons
            name={activeTab === 'stats' ? 'stats-chart' : 'stats-chart-outline'}
            size={24}
            color={activeTab === 'stats' ? '#4a90e2' : '#95a5a6'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'stats' && styles.tabLabelActive,
            ]}
          >
            统计
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons
            name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
            size={24}
            color={activeTab === 'settings' ? '#4a90e2' : '#95a5a6'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'settings' && styles.tabLabelActive,
            ]}
          >
            设置
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// 统计视图组件
const StatsView = () => {
  return (
    <View style={styles.statsContainer}>
      <Text style={styles.statsTitle}>📊 统计</Text>
      
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>总任务</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>已完成</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>进行中</Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>总事件</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>本周</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>本月</Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>项目</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0%</Text>
          <Text style={styles.statLabel}>完成率</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>子任务</Text>
        </View>
      </View>

      <Text style={styles.comingSoon}>📈 更多统计功能即将推出</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
    paddingBottom: 0,
    height: 60,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#4a90e2',
    fontWeight: '600',
  },
  // 统计视图样式
  statsContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  statsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1c1c1e',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e5ea',
    marginHorizontal: 8,
  },
  comingSoon: {
    textAlign: 'center',
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 32,
  },
});

export default MainTabsScreen;
