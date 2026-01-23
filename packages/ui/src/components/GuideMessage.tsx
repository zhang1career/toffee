import React, { useEffect, useRef } from 'react';
import { PlatformView, PlatformText } from './PlatformView';

// 检测是否是 React Native 环境
// 在 web 环境中，react-native 会被 vite 的 alias 映射到 stub（空对象）
const isReactNativeEnv = ((): boolean => {
  try {
    const rn = require('react-native');
    // 检查是否是真正的 React Native（有 View 组件且不是字符串）
    // 在 web 环境中，stub 返回空对象，所以 rn.View 会是 undefined
    return !!(rn && rn.View && typeof rn.View !== 'string' && rn.View !== 'div');
  } catch {
    return false;
  }
})();
// 仅在非 React Native 环境中导入 CSS
// 在 Vite 中，CSS 必须使用 ES6 import，不能使用 require
import './GuideMessage.css';

interface GuideMessageProps {
  /** 是否显示引导词 */
  visible: boolean;
  /** 渐变过渡时间（毫秒），默认2000ms */
  fadeDuration?: number;
}

// 检测是否是 React Native 环境
const isReactNative = (): boolean => {
  try {
    require('react-native');
    return true;
  } catch {
    return false;
  }
};

export const GuideMessage: React.FC<GuideMessageProps> = ({ visible, fadeDuration = 2000 }) => {
  const fadeDurationMs = fadeDuration;
  const fadeDurationSec = fadeDurationMs / 1000;

  // React Native 环境使用 Animated API
  if (isReactNative()) {
    try {
      const { StyleSheet, Animated } = require('react-native');
      const opacityRef = useRef(new Animated.Value(visible ? 0 : 0));
      
      useEffect(() => {
        if (visible) {
          Animated.timing(opacityRef.current, {
            toValue: 1,
            duration: fadeDurationMs,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.timing(opacityRef.current, {
            toValue: 0,
            duration: fadeDurationMs,
            useNativeDriver: true,
          }).start();
        }
      }, [visible, fadeDurationMs]);
      
      const wrapperStyles = StyleSheet.create({
        wrapper: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 20,
          pointerEvents: 'none',
        },
      });
      
      const styles = StyleSheet.create({
        text: {
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: 16,
          textAlign: 'center',
          letterSpacing: 1,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
        },
      });

      if (!visible && opacityRef.current._value === 0) {
        return null;
      }

      return (
        <PlatformView style={wrapperStyles.wrapper}>
          <Animated.View style={{ opacity: opacityRef.current }}>
            <PlatformText style={styles.text}>
              轻触屏幕，说出你的心声
            </PlatformText>
          </Animated.View>
        </PlatformView>
      );
    } catch {
      // 如果样式创建失败，返回空
      return null;
    }
  }

  // Web/Taro 环境使用 CSS 和 style
  const style = {
    animation: visible 
      ? `guideFadeIn ${fadeDurationSec}s ease-out`
      : `guideFadeOut ${fadeDurationSec}s ease-in forwards`,
  };

  if (!visible) return null;

  return (
    <PlatformView className="guide-message" style={style}>
      <PlatformText className="guide-message-text">
        轻触屏幕，说出你的心声
      </PlatformText>
    </PlatformView>
  );
};
