import React, { useEffect, useState, useMemo, useRef } from 'react';
import { PlatformView, PlatformText } from './PlatformView';

// 检测是否是 React Native 环境
// 在 web 环境中，react-native 会被 vite 的 alias 映射到 stub（空对象）
const isReactNativeEnv = ((): boolean => {
  try {
    const rn = require('react-native');
    // 检查是否是真正的 React Native（有 View 组件且不是字符串）
    // 在 web 环境中，stub 返回空对象，所以 rn.View 会是 undefined
    return (rn && rn.View && typeof rn.View !== 'string' && rn.View !== 'div');
  } catch {
    return false;
  }
})();

// 仅在非 React Native 环境中导入 CSS
// 在 Vite 中，CSS 必须使用 ES6 import，不能使用 require
import './ListenerMessage.css';

interface ListenerMessageProps {
  count: number;
  onComplete: () => void;
  /** 自定义文案模板，默认为 "刚才，有 {count} 人陪你听见了。"，可使用 {count} 占位符 */
  message?: string;
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

export const ListenerMessage: React.FC<ListenerMessageProps> = ({ 
  count, 
  onComplete,
  message,
  fadeDuration = 2000,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const fadeDurationMs = fadeDuration;
  const fadeDurationSec = fadeDurationMs / 1000;

  // 在 React Native 环境中创建样式
  const rnStyles = useMemo(() => {
    if (!isReactNative()) return null;
    
    try {
      const { StyleSheet, Dimensions } = require('react-native');
      const { width, height } = Dimensions.get('window');
      
      return StyleSheet.create({
        container: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 8,
          maxWidth: width * 0.8, // 最大宽度为屏幕的80%
          minWidth: 200, // 最小宽度
        },
        text: {
          color: '#fff',
          fontSize: 16,
          textAlign: 'center',
        },
      });
    } catch {
      return null;
    }
  }, []);

  // React Native 环境使用 Animated API
  const opacityRef = useRef<any>(null);
  if (isReactNative() && opacityRef.current === null) {
    try {
      const { Animated } = require('react-native');
      opacityRef.current = new Animated.Value(0);
    } catch {
      // 忽略
    }
  }

  useEffect(() => {
    if (isReactNative() && opacityRef.current) {
      try {
        const { Animated } = require('react-native');
        // 淡入
        Animated.timing(opacityRef.current, {
          toValue: 1,
          duration: fadeDurationMs,
          useNativeDriver: true,
        }).start();
      } catch {
        // 忽略
      }
    }
  }, [fadeDurationMs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isReactNative() && opacityRef.current) {
        try {
          const { Animated } = require('react-native');
          // 淡出
          Animated.timing(opacityRef.current, {
            toValue: 0,
            duration: fadeDurationMs,
            useNativeDriver: true,
          }).start(() => {
            setIsVisible(false);
            setTimeout(onComplete, 100); // 等待淡出动画完成
          });
        } catch {
          setIsVisible(false);
          setTimeout(onComplete, 100);
        }
      } else {
        setIsVisible(false);
        setTimeout(onComplete, fadeDurationMs); // 等待淡出动画完成
      }
    }, 3000); // 3秒后消失

    return () => clearTimeout(timer);
  }, [onComplete, fadeDurationMs]);

  if (!isVisible) return null;

  // 格式化文案：如果传入自定义文案，优先使用；否则使用随机mock文案
  const formattedMessage = message 
    ? message.replace('{count}', count.toLocaleString())
    : '';

  // React Native 环境使用 Animated API
  if (rnStyles && opacityRef.current) {
    try {
      const { StyleSheet, Animated } = require('react-native');
      const wrapperStyles = StyleSheet.create({
        wrapper: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 15,
          pointerEvents: 'none',
        },
      });
      
      return (
        <PlatformView style={wrapperStyles.wrapper}>
          <Animated.View style={[rnStyles.container, { opacity: opacityRef.current }]}>
            <PlatformText style={rnStyles.text}>
              {formattedMessage}
            </PlatformText>
          </Animated.View>
        </PlatformView>
      );
    } catch {
      // 降级到普通样式
    }
  }

  // Web/Taro 环境使用 CSS 和 style
  const style = {
    animation: `messageFadeIn ${fadeDurationSec}s ease-out, messageFadeOut ${fadeDurationSec}s ease-in 2.5s forwards`,
  };

  return (
    <PlatformView className="listener-message" style={style}>
      <PlatformText className="listener-message-text">
        {formattedMessage}
      </PlatformText>
    </PlatformView>
  );
};

