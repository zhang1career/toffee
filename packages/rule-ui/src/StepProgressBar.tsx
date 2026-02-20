/**
 * 步骤进度条：挂载后从 0 动画到 1，表示步骤剩余时间流逝
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export interface StepProgressBarProps {
  /** 步骤总时长（秒） */
  durationSec: number;
}

export function StepProgressBar({ durationSec }: StepProgressBarProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progressAnim.setValue(0);
    const durationMs = durationSec * 1000;
    const timing = Animated.timing(progressAnim, {
      toValue: 1,
      duration: durationMs,
      useNativeDriver: false,
    });
    timing.start(({ finished }) => {
      if (!finished) progressAnim.setValue(0);
    });
    return () => timing.stop();
  }, [durationSec, progressAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.fill,
          {
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  fill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});
