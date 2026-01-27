import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Button } from 'react-native';
import { getItems } from '../services/itemService';
import { enhanceWithAI } from '../services/aiService';
import type { Item } from '../services/itemService';

// Utility: get start of week (Monday) and end of week
const getWeekRange = (refDate: Date = new Date()) => {
  const d = new Date(refDate);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

type AgendaItem = {
  type: 'task' | 'event';
  title: string;
  date?: string;
  details?: string;
  priority?: string;
  category?: string;
};

const WeeklyAgendaScreen = () => {
  const [loading, setLoading] = useState(true);
  const [weekItems, setWeekItems] = useState<AgendaItem[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [agendaTitle, setAgendaTitle] = useState<string>('');
  const [agendaContent, setAgendaContent] = useState<string>('');
  const { start, end } = useMemo(() => getWeekRange(new Date()), []);

  // Fetch current week's items and prepare AI input
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // 获取当前用户的所有项（简化：获取全部后在前端过滤日期）
        const items = await getItems(undefined, true, false);

        const weekTasks: AgendaItem[] = [];
        items.forEach((it: any) => {
          const due = it?.dueDate ? new Date(it.dueDate) : null;
          const evt = it?.eventTime ? new Date(it.eventTime) : null;
          const date = due ?? evt ?? null;
          if (!date) return;
          if (date >= start && date <= end) {
            const base: AgendaItem = {
              type: it.type === 'task' ? 'task' : 'event',
              title: it.title ?? 'Untitled',
              date: date.toLocaleString(),
              details: it.description ?? '',
              priority: it.priority,
              category: it.category,
            };
            weekTasks.push(base);
          }
        });

        setWeekItems(weekTasks);

        // 生成 AI 提纲
        const summaryLines: string[] = [];
        summaryLines.push(`本周周会时间范围：${start.toDateString()} - ${end.toDateString()}`);
        if (weekTasks.length > 0) {
          summaryLines.push('本周待办与事件：');
          weekTasks.forEach((it) => {
            const t = it.type.toUpperCase();
            const dt = it.date ?? '';
            const line = `- [${t}] ${it.title}${dt ? `, 时间: ${dt}` : ''}${it.priority ? `, 优先级: ${it.priority}` : ''}`;
            summaryLines.push(line);
          });
        } else {
          summaryLines.push('本周暂无待办或事件。');
        }

        const description = summaryLines.join('\n');
        await generateAgendaFromAI(description);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const generateAgendaFromAI = async (description: string) => {
    try {
      setAiLoading(true);
      // 使用 AI 生成周会提纲（标题、描述）
      const response = await enhanceWithAI({ description, type: 'task', generateTitle: true });
      if (response) {
        if (response.title) setAgendaTitle(response.title);
        if (response.enhancedDescription) setAgendaContent(response.enhancedDescription);
        else if (response?.enhancedDescription == null && response?.title == null) {
          setAgendaContent(description);
        }
      } else {
        setAgendaContent(description);
      }
    } catch (err) {
      console.error('AI agenda error', err);
      setAgendaContent(description);
    } finally {
      setAiLoading(false);
    }
  };

  const refreshAgenda = async () => {
    // 重新基于当前周重新生成
    const lines: string[] = [];
    lines.push(`本周周会时间范围：${start.toDateString()} - ${end.toDateString()}`);
    if (weekItems.length > 0) {
      lines.push('本周待办与事件：');
      weekItems.forEach((it) => {
        lines.push(`- [${it.type.toUpperCase()}] ${it.title}，日期: ${it.date ?? ''}，优先级: ${it.priority ?? ''}`);
      });
    } else {
      lines.push('本周暂无待办或事件。');
    }
    const desc = lines.join('\n');
    await generateAgendaFromAI(desc);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>本周周会提纲</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#4a90e2" />
      ) : (
        <View style={styles.card}>
          {aiLoading ? (
            <ActivityIndicator size="small" color="#4a90e2" />
          ) : (
            <>
              {agendaTitle ? <Text style={styles.title}>{agendaTitle}</Text> : null}
              <Text style={styles.content}>{agendaContent}</Text>
            </>
          )}
        </View>
      )}
      <View style={styles.actions}>
        <Button title="重新生成提纲" onPress={refreshAgenda} color="#4a90e2" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    padding: 16,
    backgroundColor: '#f9f9fb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    color: '#333',
  },
  actions: {
    marginTop: 16,
  },
});

export default WeeklyAgendaScreen;
