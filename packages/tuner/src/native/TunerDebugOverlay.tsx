import React, { useSyncExternalStore } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TunerStore } from '../store';

function useTunerEntries() {
  return useSyncExternalStore(
    (cb) => TunerStore.subscribe(cb),
    () => TunerStore.getAll(),
    () => TunerStore.getAll()
  );
}

interface TunerDebugOverlayProps {
  /** 是否显示（通常由调试开关控制） */
  visible: boolean;
  /** 嵌入模式：为 true 时不使用绝对定位，供父容器内嵌 */
  embedded?: boolean;
}

/**
 * 调谐器调试展示，屏幕左上角显示可调变量名和数值
 * 当 visible 为 true 时显示
 * 使用 React.memo 避免父组件（App）因 textItems 等重绘时无谓重绘，减轻发热。
 */
function TunerDebugOverlayComponent({ visible, embedded = false }: TunerDebugOverlayProps) {
  const entries = useTunerEntries();

  if (!visible || entries.length === 0) return null;

  return (
    <View style={embedded ? styles.embedded : styles.container}>
      {entries.map((entry) => (
        <Text key={entry.name} style={styles.text}>
          {entry.name}: {entry.value}
        </Text>
      ))}
    </View>
  );
}

export const TunerDebugOverlay = React.memo(TunerDebugOverlayComponent);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 4,
    zIndex: 9999,
  },
  embedded: {
    backgroundColor: 'transparent',
    padding: 0,
    marginBottom: 8,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});
