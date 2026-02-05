import React, { useSyncExternalStore } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { TunerStore } from '../store';

function useTunerEntries() {
  return useSyncExternalStore(
    (cb) => TunerStore.subscribe(cb),
    () => TunerStore.getAll(),
    () => TunerStore.getAll()
  );
}

/**
 * 调谐器滑动条区块，用于侧边抽屉内嵌
 * 根据 TunerStore 中已注册的变量渲染滑动条列表
 * 使用 React.memo 避免父组件（如 SideDrawer）重渲染时无谓重绘，减轻发热。
 */
function TunerSliderSectionComponent() {
  const entries = useTunerEntries();
  const sliderEntries = entries.filter((e) => e.kind !== 'switch');

  if (sliderEntries.length === 0) return null;

  return (
    <View style={styles.section}>
      {sliderEntries.map((entry) => (
        <View key={entry.name} style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>
            {entry.name}: {entry.value}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={entry.min ?? 0}
            maximumValue={entry.max ?? 100}
            {...(entry.step != null ? { step: entry.step } : {})}
            value={entry.value as number}
            onValueChange={(v) => TunerStore.setValue(entry.name, v)}
            onSlidingComplete={() => TunerStore.flushNotify()}
            minimumTrackTintColor="#81b0ff"
            maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
            thumbTintColor="#f5dd4b"
          />
        </View>
      ))}
    </View>
  );
}

export const TunerSliderSection = React.memo(TunerSliderSectionComponent);

const styles = StyleSheet.create({
  section: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  sliderRow: {
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});
