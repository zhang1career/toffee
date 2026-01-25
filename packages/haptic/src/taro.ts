import Taro from '@tarojs/taro';
import { HapticService } from '@zhang1career/core';
import { logger } from '@zhang1career/logger';
import { HapticAdapter } from './interface';

class TaroHapticService implements HapticService {
  private continuousTimer: NodeJS.Timeout | null = null;

  async vibrate(pattern: 'light' | 'medium' | 'heavy' | 'ripple' | 'resonance'): Promise<void> {
    try {
      switch (pattern) {
        case 'light':
          await Taro.vibrateShort({ type: 'light' });
          break;
        case 'medium':
          await Taro.vibrateShort({ type: 'medium' });
          break;
        case 'heavy':
          await Taro.vibrateShort({ type: 'heavy' });
          break;
        case 'ripple':
          // 涟漪效果：短-长-短
          await Taro.vibrateShort({ type: 'light' });
          await new Promise(resolve => setTimeout(resolve, 50));
          await Taro.vibrateShort({ type: 'medium' });
          await new Promise(resolve => setTimeout(resolve, 50));
          await Taro.vibrateShort({ type: 'light' });
          break;
        case 'resonance':
          // 同频震动：轻微震动
          await Taro.vibrateShort({ type: 'light' });
          break;
        default:
          await Taro.vibrateShort({ type: 'medium' });
      }
    } catch (error) {
      // 小程序不支持震动时静默失败
      logger.warn('Haptic feedback not supported:', error);
    }
  }

  async startContinuous(pattern: 'resonance'): Promise<void> {
    if (pattern !== 'resonance') {
      return;
    }

    // 停止之前的连续震动
    this.stopContinuous();

    // 同频震动：每200ms轻微震动一次
    this.continuousTimer = setInterval(async () => {
      try {
        await Taro.vibrateShort({ type: 'light' });
      } catch (error) {
        // 静默失败
        logger.warn('Continuous haptic feedback failed:', error);
      }
    }, 200);
  }

  stopContinuous(): void {
    if (this.continuousTimer !== null) {
      clearInterval(this.continuousTimer);
      this.continuousTimer = null;
    }
  }
}

export const taroHapticAdapter: HapticAdapter = {
  createService: () => new TaroHapticService(),
};
