import React from 'react';
import { PlatformView } from './PlatformView';

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
// 使用条件导入，但 Vite 会在构建时处理所有 import，所以我们需要确保这个导入总是存在
// 解决方案：直接导入，让 Vite 处理，但在 React Native 环境中不会执行到这里
import './NightSkyBackground.css';

export const NightSkyBackground: React.FC = () => {
  // React Native 环境使用 StyleSheet 和 LinearGradient
  if (isReactNativeEnv) {
    try {
      const { StyleSheet, Dimensions } = require('react-native');
      const { width, height } = Dimensions.get('window');
      
      // 生成星星位置（使用固定随机种子确保一致性，但看起来更随机）
      const generateStars = () => {
        const stars = [];
        const starCount = 50; // 增加星星数量
        // 使用固定种子生成随机数，确保每次渲染位置一致
        let seed = 12345; // 固定种子
        const random = () => {
          seed = (seed * 9301 + 49297) % 233280;
          return seed / 233280;
        };
        
        for (let i = 0; i < starCount; i++) {
          // 完全随机的位置分布
          const x = random() * 100; // 0-100%
          const y = random() * 100; // 0-100%
          // 随机大小 1-3px
          const size = Math.floor(random() * 3) + 1;
          // 随机透明度 0.2-0.7
          const opacity = 0.2 + random() * 0.5;
          stars.push({ x, y, size, opacity });
        }
        return stars;
      };

      const stars = generateStars();
      
      const styles = StyleSheet.create({
        container: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          overflow: 'hidden',
        },
        gradient: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0a0a1a', // 深色背景
        },
        starContainer: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        },
        star: {
          position: 'absolute',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: 999,
        },
      });

      return (
        <PlatformView style={styles.container}>
          <PlatformView style={styles.gradient} />
          <PlatformView style={styles.starContainer}>
            {stars.map((star, index) => (
              <PlatformView
                key={`star-${index}`}
                style={[
                  styles.star,
                  {
                    left: `${star.x}%`,
                    top: `${star.y}%`,
                    width: star.size,
                    height: star.size,
                    opacity: star.opacity,
                  },
                ]}
              />
            ))}
          </PlatformView>
        </PlatformView>
      );
    } catch (error) {
      // 如果样式创建失败，返回一个基本的深色背景
      return (
        <PlatformView style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0a0a1a', zIndex: 0 }} />
      );
    }
  }

  // Web/Taro 环境使用 className
  return (
    <PlatformView className="night-sky">
      <PlatformView className="night-sky-gradient" />
      <PlatformView className="night-sky-stars" />
    </PlatformView>
  );
};

