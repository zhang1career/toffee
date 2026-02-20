/**
 * 步骤按钮栏：渲染 StepButtonConfig 列表，按按钮类型分发点击
 */
import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { StepButtonConfig } from '@zhang1career/rule-engine';

export interface StepButtonBarProps {
  buttons: StepButtonConfig[];
  onButtonPress: (btn: StepButtonConfig) => void;
  /** 是否使用 iOS 柔化边框样式 */
  softBorder?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

const PADDING_V = 16;
const PADDING_H = 48;
const FONT_SIZE = 22;

export function StepButtonBar({
  buttons,
  onButtonPress,
  softBorder = Platform.OS === 'ios',
  containerStyle,
}: StepButtonBarProps) {
  if (buttons.length === 0) return null;

  return (
    <View style={[styles.container, containerStyle]}>
      {buttons.map((btn, i) => (
        <Pressable
          key={i}
          style={({ pressed }) => [
            styles.button,
            softBorder && styles.buttonSoftBorder,
            btn.type === 'danger' && styles.buttonWarn,
            pressed &&
              (btn.type === 'danger' ? styles.buttonWarnPressed : styles.buttonPressed),
          ]}
          onPress={() => onButtonPress(btn)}
          accessibilityLabel={btn.label}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.buttonText,
              btn.type === 'danger' && styles.buttonTextWarn,
            ]}
          >
            {btn.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    flexShrink: 0,
    gap: 12,
  },
  button: {
    paddingVertical: PADDING_V,
    paddingHorizontal: PADDING_H,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  buttonSoftBorder: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 0,
  },
  buttonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  buttonWarn: {
    borderColor: 'rgba(255, 100, 100, 0.7)',
    backgroundColor: 'rgba(200, 60, 60, 0.5)',
  },
  buttonWarnPressed: {
    backgroundColor: 'rgba(220, 80, 80, 0.65)',
  },
  buttonTextWarn: {
    color: '#ff8888',
  },
  buttonText: {
    fontSize: FONT_SIZE,
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 1,
  },
});
