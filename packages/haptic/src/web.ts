import { HapticService } from '@zhang1career/core';
import { HapticAdapter } from './interface';

class WebHapticService implements HapticService {
  private continuousInterval: number | null = null;

  async vibrate(pattern: 'light' | 'medium' | 'heavy' | 'ripple' | 'resonance'): Promise<void> {
    if (!('vibrate' in navigator)) {
      // Web端不支持震动，静默失败
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
    navigator.vibrate(vibrationPattern);
  }

  async startContinuous(_pattern: 'resonance'): Promise<void> {
    if (!('vibrate' in navigator)) {
      return;
    }

    // 同频震动：每200ms轻微震动一次
    this.continuousInterval = window.setInterval(() => {
      navigator.vibrate(10);
    }, 200);
  }

  stopContinuous(): void {
    if (this.continuousInterval !== null) {
      clearInterval(this.continuousInterval);
      this.continuousInterval = null;
      // 停止所有震动
      if ('vibrate' in navigator) {
        navigator.vibrate(0);
      }
    }
  }
}

export const webHapticAdapter: HapticAdapter = {
  createService: () => new WebHapticService(),
};

