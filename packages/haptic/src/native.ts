import { HapticService } from '@zhang1career/core';
import { HapticAdapter } from './interface';

// React Native 的 Haptic Feedback
// 注意：需要安装 react-native-haptic-feedback 或使用 React Native 内置的 Haptics API
// 这里使用一个简化的实现，实际项目中可以使用 expo-haptics 或 react-native-haptic-feedback

class NativeHapticService implements HapticService {
  private continuousInterval: NodeJS.Timeout | null = null;

  async vibrate(pattern: 'light' | 'medium' | 'heavy' | 'ripple' | 'resonance'): Promise<void> {
    // React Native 使用 Vibration API
    const { Vibration } = require('react-native');
    
    if (!Vibration) {
      // 如果不支持震动，静默失败
      return;
    }

    const patterns: Record<string, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 30,
      ripple: [5, 10, 5], // 短-长-短的涟漪感
      resonance: 15, // 同频震动的轻微震动
    };

    const vibrationPattern = patterns[pattern] || patterns.medium;
    
    if (Array.isArray(vibrationPattern)) {
      Vibration.vibrate(vibrationPattern);
    } else {
      Vibration.vibrate(vibrationPattern);
    }
  }

  async startContinuous(_pattern: 'resonance'): Promise<void> {
    const { Vibration } = require('react-native');
    
    if (!Vibration) {
      return;
    }

    // 同频震动：每200ms轻微震动一次
    this.continuousInterval = setInterval(() => {
      Vibration.vibrate(10);
    }, 200);
  }

  stopContinuous(): void {
    if (this.continuousInterval !== null) {
      clearInterval(this.continuousInterval);
      this.continuousInterval = null;
      // 停止所有震动
      const { Vibration } = require('react-native');
      if (Vibration && Vibration.cancel) {
        Vibration.cancel();
      }
    }
  }
}

export const nativeHapticAdapter: HapticAdapter = {
  createService: () => new NativeHapticService(),
};

