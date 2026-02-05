import React, { useSyncExternalStore } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { TunerStore } from '../store';

function useTunerEntries() {
  return useSyncExternalStore(
    (cb) => TunerStore.subscribe(cb),
    () => TunerStore.getAll(),
    () => TunerStore.getAll()
  );
}

/**
 * 调谐器开关区块，用于侧边抽屉内嵌
 * 根据 TunerStore 中 kind='switch' 的条目渲染开关列表
 */
function TunerSwitchSectionComponent() {
  const entries = useTunerEntries();
  const switchEntries = entries.filter((e) => e.kind === 'switch');

  if (switchEntries.length === 0) return null;

  return (
    <View style={styles.section}>
      {switchEntries.map((entry) => (
        <View key={entry.name} style={styles.row}>
          <Text style={styles.label}>{entry.label ?? entry.name}</Text>
          <Switch
            value={entry.value === true}
            onValueChange={(v) => TunerStore.setValue(entry.name, v)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={entry.value === true ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      ))}
    </View>
  );
}

export const TunerSwitchSection = React.memo(TunerSwitchSectionComponent);

const styles = StyleSheet.create({
  section: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
