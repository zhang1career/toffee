import { DeviceService } from '@zhang1career/core';
import { DeviceAdapter } from './interface';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

class NativeDeviceService implements DeviceService {
  private readonly STORAGE_KEY = 'echo_device_id';
  private readonly FIRST_LAUNCH_KEY = 'echo_first_launch';

  async getDeviceId(): Promise<string> {
    try {
      // 尝试从 AsyncStorage 获取
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return stored;
      }

      // 尝试获取设备唯一ID
      let deviceId: string;
      try {
        const uniqueId = DeviceInfo.getUniqueIdSync();
        deviceId = `${Platform.OS}_${uniqueId}`;
      } catch {
        // 如果获取失败，生成新的设备ID
        deviceId = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      }

      await AsyncStorage.setItem(this.STORAGE_KEY, deviceId);
      return deviceId;
    } catch (error) {
      // 如果所有方法都失败，返回临时ID
      return `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
  }

  async isFirstLaunch(): Promise<boolean> {
    try {
      const hasLaunched = await AsyncStorage.getItem(this.FIRST_LAUNCH_KEY);
      if (!hasLaunched) {
        await AsyncStorage.setItem(this.FIRST_LAUNCH_KEY, 'true');
        return true;
      }
      return false;
    } catch {
      // 如果存储失败，假设是首次启动
      return true;
    }
  }
}

export const nativeDeviceAdapter: DeviceAdapter = {
  createService: () => new NativeDeviceService(),
};

