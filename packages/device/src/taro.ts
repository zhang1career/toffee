import Taro from '@tarojs/taro';
import { DeviceService } from '@toffee/core';
import { DeviceAdapter } from './interface';

class TaroDeviceService implements DeviceService {
  private readonly STORAGE_KEY = 'echo_device_id';
  private readonly FIRST_LAUNCH_KEY = 'echo_first_launch';

  async getDeviceId(): Promise<string> {
    try {
      // 尝试从存储获取
      const stored = Taro.getStorageSync(this.STORAGE_KEY);
      if (stored) {
        return stored;
      }

      // 生成新的设备ID（使用时间戳 + 随机数）
      const deviceId = `miniprogram_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // 存储设备ID
      Taro.setStorageSync(this.STORAGE_KEY, deviceId);
      return deviceId;
    } catch (error) {
      // 如果存储失败，返回临时ID（不持久化）
      console.warn('Failed to get/set device ID from storage:', error);
      return `miniprogram_temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
  }

  async isFirstLaunch(): Promise<boolean> {
    try {
      const hasLaunched = Taro.getStorageSync(this.FIRST_LAUNCH_KEY);
      if (!hasLaunched) {
        Taro.setStorageSync(this.FIRST_LAUNCH_KEY, 'true');
        return true;
      }
      return false;
    } catch (error) {
      // 如果存储失败，假设是首次启动
      console.warn('Failed to check first launch:', error);
      return true;
    }
  }
}

export const taroDeviceAdapter: DeviceAdapter = {
  createService: () => new TaroDeviceService(),
};

