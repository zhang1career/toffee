import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
// 导入崩溃报告器（根据平台自动选择）
import { CrashReporter } from '../native';
import type { CrashLog } from '../interface';
import { logger } from '@zhang1career/logger';

interface CrashLogViewerProps {
  /** 是否显示组件 */
  visible?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
}

/**
 * 崩溃日志查看器组件
 * 用于在 App 内查看和导出崩溃日志
 */
export function CrashLogViewer({ visible = true, onClose }: CrashLogViewerProps) {
  const [logs, setLogs] = useState<CrashLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<CrashLog | null>(null);

  useEffect(() => {
    if (visible) {
      loadLogs();
    }
  }, [visible]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const crashLogs = await CrashReporter.getCrashLogs();
      setLogs(crashLogs);
    } catch (error) {
      logger.error('Failed to load crash logs:', error);
      Alert.alert('错误', '无法加载崩溃日志');
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = () => {
    Alert.alert(
      '确认',
      '确定要清除所有崩溃日志吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          style: 'destructive',
          onPress: async () => {
            try {
              await CrashReporter.clearCrashLogs();
              setLogs([]);
              setSelectedLog(null);
              Alert.alert('成功', '已清除所有崩溃日志');
            } catch (error) {
              Alert.alert('错误', '清除日志失败');
            }
          },
        },
      ]
    );
  };

  const handleShareLog = async (log: CrashLog) => {
    try {
      const logText = formatLogForShare(log);
      
      if (Platform.OS === 'ios') {
        await Share.share({
          message: logText,
          title: `崩溃日志 - ${log.id}`,
        });
      } else {
        // Android 平台
        await Share.share({
          message: logText,
          title: `崩溃日志 - ${log.id}`,
        });
      }
    } catch (error) {
      logger.error('Failed to share log:', error);
      Alert.alert('错误', '分享日志失败');
    }
  };

  const formatLogForShare = (log: CrashLog): string => {
    let text = `崩溃日志 ID: ${log.id}\n`;
    text += `类型: ${log.type}\n`;
    text += `时间: ${log.timestamp}\n`;
    text += `消息: ${log.message}\n\n`;
    
    if (log.stack) {
      text += `堆栈信息:\n${log.stack}\n\n`;
    }
    
    if (log.deviceInfo) {
      text += `设备信息:\n`;
      if (log.deviceInfo.iosVersion) {
        text += `iOS 版本: ${log.deviceInfo.iosVersion}\n`;
      }
      if (log.deviceInfo.deviceModel) {
        text += `设备型号: ${log.deviceInfo.deviceModel}\n`;
      }
      if (log.deviceInfo.appVersion) {
        text += `应用版本: ${log.deviceInfo.appVersion}\n`;
      }
      if (log.deviceInfo.memoryUsage) {
        text += `内存使用: ${log.deviceInfo.memoryUsage.toFixed(2)} MB\n`;
      }
    }
    
    if (log.extra) {
      text += `\n额外信息:\n${log.extra}\n`;
    }
    
    return text;
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>崩溃日志</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={loadLogs} style={styles.button}>
            <Text style={styles.buttonText}>刷新</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearLogs} style={[styles.button, styles.dangerButton]}>
            <Text style={styles.buttonText}>清除</Text>
          </TouchableOpacity>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.button}>
              <Text style={styles.buttonText}>关闭</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text>加载中...</Text>
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>暂无崩溃日志</Text>
        </View>
      ) : selectedLog ? (
        <ScrollView style={styles.detailView}>
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setSelectedLog(null)}>
              <Text style={styles.backButton}>← 返回</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleShareLog(selectedLog)}>
              <Text style={styles.shareButton}>分享</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>ID:</Text>
            <Text style={styles.detailValue}>{selectedLog.id}</Text>
            
            <Text style={styles.detailLabel}>类型:</Text>
            <Text style={styles.detailValue}>{selectedLog.type}</Text>
            
            <Text style={styles.detailLabel}>时间:</Text>
            <Text style={styles.detailValue}>{selectedLog.timestamp}</Text>
            
            <Text style={styles.detailLabel}>消息:</Text>
            <Text style={styles.detailValue}>{selectedLog.message}</Text>
            
            {selectedLog.stack && (
              <>
                <Text style={styles.detailLabel}>堆栈:</Text>
                <ScrollView style={styles.stackView}>
                  <Text style={styles.stackText}>{selectedLog.stack}</Text>
                </ScrollView>
              </>
            )}
            
            {selectedLog.deviceInfo && (
              <>
                <Text style={styles.detailLabel}>设备信息:</Text>
                <Text style={styles.detailValue}>
                  {JSON.stringify(selectedLog.deviceInfo, null, 2)}
                </Text>
              </>
            )}
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.listView}>
          {logs.map((log) => (
            <TouchableOpacity
              key={log.id}
              style={styles.logItem}
              onPress={() => setSelectedLog(log)}
            >
              <View style={styles.logItemHeader}>
                <Text style={styles.logType}>{log.type}</Text>
                <Text style={styles.logTime}>
                  {new Date(log.timestamp).toLocaleString()}
                </Text>
              </View>
              <Text style={styles.logMessage} numberOfLines={2}>
                {log.message}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  listView: {
    flex: 1,
  },
  logItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  logItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  logType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF3B30',
    textTransform: 'uppercase',
  },
  logTime: {
    fontSize: 12,
    color: '#999',
  },
  logMessage: {
    fontSize: 14,
    color: '#333',
  },
  detailView: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  shareButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  detailContent: {
    padding: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
  },
  stackView: {
    maxHeight: 200,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  stackText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#333',
  },
});
